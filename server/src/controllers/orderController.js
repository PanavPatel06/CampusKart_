const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Commission = require('../models/Commission');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    const {
        orderItems,
        vendorId,
        totalPrice,
    } = req.body;

    console.log('[addOrderItems] Request Body:', JSON.stringify(req.body, null, 2));

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        try {
            // 1. Check Wallet Balance (soft check — actual deduction happens on confirmation)
            const user = await User.findById(req.user._id);
            if (!user) {
                res.status(404);
                throw new Error('User not found');
            }

            if (user.walletBalance < totalPrice) {
                res.status(400);
                throw new Error('Insufficient wallet balance');
            }

            // 2. Get Commission Rates
            let commissionRates = await Commission.findOne();
            if (!commissionRates) {
                commissionRates = { companyRate: 5, deliveryRate: 5 };
            }

            // 3. Calculate Splits
            const companyEarnings = (totalPrice * commissionRates.companyRate) / 100;
            const deliveryEarnings = (totalPrice * commissionRates.deliveryRate) / 100;
            const vendorEarnings = totalPrice - companyEarnings - deliveryEarnings;

            console.log(`[OrderPayment] Total: ${totalPrice}, Com: ${companyEarnings}, Del: ${deliveryEarnings}, Ven: ${vendorEarnings}`);

            // NOTE: Wallet is NOT deducted here. Deduction happens when agent confirms (out_for_delivery).

            // Generate 4-digit OTP
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            console.log('[addOrderItems] Generated OTP:', otp);

            const order = new Order({
                customer: req.user._id,
                vendor: vendorId,
                items: orderItems,
                totalAmount: totalPrice,
                status: 'pending',
                deliveryOtp: otp,
                instructions: req.body.instructions || "",
                deliveryLocation: req.body.deliveryLocation,
                paymentStatus: 'unpaid',
                commission: {
                    company: companyEarnings,
                    delivery: deliveryEarnings,
                    vendor: vendorEarnings
                }
            });

            console.log('[addOrderItems] Order Object before save:', order);
            const createdOrder = await order.save();
            console.log('[addOrderItems] Order saved successfully:', createdOrder._id);
            console.log('[addOrderItems] Saved Order OTP:', createdOrder.deliveryOtp);

            // Update Transaction with Order ID (optional but good for tracking)
            // await Transaction.create... (we did it before, maybe we update it or just link in description in future) 
            // Better: update the transaction we just made if we had its ID, but let's keep it simple.

            try {
                const { getIO } = require('../socket');
                const io = getIO();
                io.emit('new_vendor_order', createdOrder);
            } catch (err) {
                console.error('[Socket] Failed to emit new_vendor_order:', err);
            }

            res.status(201).json(createdOrder);
        } catch (error) {
            console.error('[addOrderItems] Error saving order:', error);
            res.status(500).json({ message: 'Failed to create order: ' + error.message });
        }
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
};

// @desc    Get vendor orders
// @route   GET /api/orders/vendor
// @access  Private (Vendor/Admin)
const getVendorOrders = async (req, res) => {
    try {
        console.log(`[getVendorOrders] Fetching orders for User ID: ${req.user._id}`);

        // Find the Vendor document associated with the logged-in user
        const vendor = await Vendor.findOne({ user: req.user._id });

        if (!vendor) {
            console.log(`[getVendorOrders] No Vendor profile found for User ID: ${req.user._id}`);
            return res.status(404).json({ message: 'Vendor profile not found. Please register a new Vendor account.' });
        }

        console.log(`[getVendorOrders] Found Vendor Profile ID: ${vendor._id}`);

        const orders = await Order.find({ vendor: vendor._id })
            .populate('customer', 'name email')
            .sort({ createdAt: -1 });

        console.log(`[getVendorOrders] Found ${orders.length} orders for Vendor ID: ${vendor._id}`);

        res.json(orders);
    } catch (error) {
        console.error('[getVendorOrders] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private (Admin)
const getAllOrders = async (req, res) => {
    const orders = await Order.find({})
        .populate('customer', 'id name')
        .populate('vendor', 'storeName location')
        .populate('deliveryAgent', 'name')
        .sort({ createdAt: -1 });
    res.json(orders);
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
        // Authorization Check
        if (req.user.role === 'user' || req.user.role === 'agent') {
            // Case 1: Customer Cancelling Pending Order
            if (order.customer.toString() === req.user._id.toString()) {
                if (status !== 'cancelled' || order.status !== 'pending') {
                    res.status(400);
                    throw new Error('Customers can only cancel pending orders');
                }
            }
            // Case 2: Delivery Agent Accepting Order → directly out_for_delivery
            else if (status === 'out_for_delivery' && req.user.role === 'agent') {
                if (order.status !== 'accepted') {
                    res.status(400);
                    throw new Error('Order must be accepted by vendor first');
                }
                // Deduct wallet balance now (order confirmed)
                const customer = await User.findById(order.customer);
                if (!customer) {
                    res.status(404);
                    throw new Error('Customer not found');
                }
                if (customer.walletBalance < order.totalAmount) {
                    res.status(400);
                    throw new Error('Customer has insufficient wallet balance');
                }
                customer.walletBalance -= order.totalAmount;
                await customer.save();
                console.log(`[Payment] Deducted ₹${order.totalAmount} from user ${customer._id}`);

                // Create transaction record
                await Transaction.create({
                    user: customer._id,
                    amount: order.totalAmount,
                    type: 'debit',
                    description: `Payment for Order #${order._id.toString().slice(-6).toUpperCase()}`,
                    status: 'success'
                });

                order.deliveryAgent = req.user._id;
                order.paymentStatus = 'paid';
            }
            // Case 3: Delivery Agent Completing Order (OTP required)
            else if (status === 'delivered' && req.user.role === 'agent') {
                if (!order.deliveryAgent || order.deliveryAgent.toString() !== req.user._id.toString()) {
                    res.status(401);
                    throw new Error('Not authorized to complete this delivery');
                }
                // Verify OTP
                const { otp } = req.body;
                if (!otp || otp !== order.deliveryOtp) {
                    res.status(400);
                    throw new Error('Invalid OTP. Delivery cannot be verified.');
                }
            }
            else {
                res.status(401);
                throw new Error('Not authorized to update this order');
            }
        }
        // If Vendor: Can accept or reject orders they own
        else if (req.user.role === 'vendor') {
            const vendor = await Vendor.findOne({ user: req.user._id });
            if (!vendor || order.vendor.toString() !== vendor._id.toString()) {
                res.status(401);
                throw new Error('Not authorized to update this order');
            }
            // Vendor can accept or reject pending orders
            if (order.status === 'pending' && (status === 'accepted' || status === 'rejected')) {
                // No refund needed on reject — wallet is not deducted until order is confirmed
            } else {
                res.status(400);
                throw new Error('Vendor can only accept or reject pending orders');
            }
        }
        // If Admin: Can do anything
        else if (req.user.role === 'admin') {
            // Admin power
        }

        order.status = status;
        const updatedOrder = await order.save();

        // Socket.IO Notifications
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            const populatedOrder = await Order.findById(updatedOrder._id)
                .populate('vendor', 'storeName location')
                .populate('deliveryAgent', 'name');

            // Notify all clients on any status change
            io.emit('order_updated', populatedOrder);

            // Vendor accepted → notify delivery agents in the location room
            if (status === 'accepted') {
                const locationRaw = populatedOrder.vendor.location || "";
                const normalizedLocation = locationRaw.trim().toLowerCase().replace(/\s+/g, '_');
                const targetRoom = `delivery_${normalizedLocation}`;
                console.log(`[Socket] Vendor Location: '${locationRaw}' -> Room: '${targetRoom}'`);
                io.to(targetRoom).emit('new_delivery_request', populatedOrder);
                console.log(`[Socket] SUCCESS: Emitted event to ${targetRoom}`);
            }

        } catch (err) {
            console.error('[Socket] CRITICAL FAILURE:', err);
        }

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
};

// @desc    Get available orders for delivery agent
// @route   GET /api/orders/delivery/available
// @access  Private (Agent)
const getAvailableDeliveryOrders = async (req, res) => {
    try {
        const { location } = req.query;

        console.log(`[getAvailableDeliveryOrders] Agent ${req.user._id} requesting orders for location: '${location}'`);

        if (!location) {
            return res.status(400).json({ message: 'Location query parameter is required' });
        }

        const Vendor = require('../models/Vendor');

        let vendorQuery = {};
        if (location !== 'All') {
            vendorQuery = { location: location };
        }

        const vendors = await Vendor.find(vendorQuery);

        if (vendors.length === 0) {
            console.log(`[getAvailableDeliveryOrders] No vendors found for location: ${location}`);
            return res.json([]);
        }

        const vendorIds = vendors.map(v => v._id);

        const orders = await Order.find({
            vendor: { $in: vendorIds },
            status: 'accepted',
            deliveryAgent: { $exists: false }
        }).populate('vendor', 'storeName location')
            .sort({ createdAt: -1 });

        console.log(`[getAvailableDeliveryOrders] Found ${orders.length} active orders.`);
        res.json(orders);

    } catch (error) {
        console.error('[getAvailableDeliveryOrders] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active deliveries for agent
// @route   GET /api/orders/delivery/my
// @access  Private (Agent)
const getMyDeliveries = async (req, res) => {
    try {
        const orders = await Order.find({ deliveryAgent: req.user._id })
            .populate('vendor', 'storeName location')
            .populate('customer', 'name phone')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addOrderItems,
    getMyOrders,
    getVendorOrders,
    updateOrderStatus,
    getAvailableDeliveryOrders,
    getAllOrders,
    getMyDeliveries
};
