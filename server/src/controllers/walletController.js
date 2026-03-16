const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Commission = require('../models/Commission');
const Order = require('../models/Order');

// @desc    Add funds to user wallet (Admin)
// @route   POST /api/wallet/add-funds
// @access  Private (Admin)
const addFunds = async (req, res) => {
    const { userId, amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Please provide a valid positive amount');
    }

    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Update Wallet Balance
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();

    // Create Transaction Record
    await Transaction.create({
        user: userId,
        amount: amount,
        type: 'credit',
        description: 'Funds added by Admin',
        status: 'success'
    });

    res.json({
        message: 'Funds added successfully',
        balance: user.walletBalance
    });
};

// @desc    Get user wallet balance and transactions
// @route   GET /api/wallet/my-wallet
// @access  Private
const getWallet = async (req, res) => {
    const user = await User.findById(req.user._id);
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
        balance: user.walletBalance || 0,
        transactions
    });
};

// @desc    Get system earnings (Admin)
// @route   GET /api/wallet/earnings
// @access  Private (Admin)
const getSystemEarnings = async (req, res) => {
    // Aggregate earnings from all completed Orders
    // We can also filter by date if needed, but for now global
    const result = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalCompanyEarnings: { $sum: "$commission.company" },
                totalDeliveryEarnings: { $sum: "$commission.delivery" },
                totalVendorEarnings: { $sum: "$commission.vendor" },
                totalSales: { $sum: "$totalAmount" }
            }
        }
    ]);

    res.json(result[0] || {
        totalCompanyEarnings: 0,
        totalDeliveryEarnings: 0,
        totalVendorEarnings: 0,
        totalSales: 0
    });
};

// @desc    Get commission rates
// @route   GET /api/wallet/commission
// @access  Private
const getCommissionRates = async (req, res) => {
    let commission = await Commission.findOne();
    if (!commission) {
        // Initialize if not exists
        commission = await Commission.create({});
    }
    res.json(commission);
};

// @desc    Update commission rates (Admin)
// @route   PUT /api/wallet/commission
// @access  Private (Admin)
const updateCommissionRates = async (req, res) => {
    const { companyRate, deliveryRate } = req.body;

    let commission = await Commission.findOne();
    if (!commission) {
        commission = new Commission();
    }

    commission.companyRate = companyRate !== undefined ? companyRate : commission.companyRate;
    commission.deliveryRate = deliveryRate !== undefined ? deliveryRate : commission.deliveryRate;

    await commission.save();
    res.json(commission);
};

// @desc    Get All Users with Wallet Info (For Admin search)
// @route   GET /api/wallet/users?search=...
// @access  Private (Admin)
const getUsersForWallet = async (req, res) => {
    const keyword = req.query.search
        ? {
            $or: [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
            ],
        }
        : {};

    const users = await User.find({ ...keyword, role: 'user' }).select('name email walletBalance');
    res.json(users);
}

module.exports = {
    addFunds,
    getWallet,
    getSystemEarnings,
    getCommissionRates,
    updateCommissionRates,
    getUsersForWallet
};
