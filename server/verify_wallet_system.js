const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Order = require('./src/models/Order');
const Transaction = require('./src/models/Transaction');
const Commission = require('./src/models/Commission');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const runTest = async () => {
    await connectDB();

    try {
        // 1. Reset Test Data
        console.log('\n--- Resetting Test Data ---');
        await User.deleteOne({ email: 'testwalletuser@example.com' });

        // 2. Create Test User
        console.log('\n--- Creating Test User ---');
        const user = await User.create({
            name: 'Test Wallet User',
            email: 'testwalletuser@example.com',
            password: 'password123',
            role: 'user',
            walletBalance: 0
        });
        console.log(`User created: ${user.email} (ID: ${user._id}) Balance: ${user.walletBalance}`);

        // 3. Admin Add Funds (Simulated)
        console.log('\n--- Simulating Admin Adding Funds (₹1000) ---');
        // Logic from walletController.addFunds
        user.walletBalance += 1000;
        await user.save();

        await Transaction.create({
            user: user._id,
            amount: 1000,
            type: 'credit',
            description: 'Funds added by Test Admin',
            status: 'success'
        });
        console.log(`Funds added. New Balance: ${user.walletBalance}`);

        // 4. Update Commission Rates (Simulate)
        console.log('\n--- Setting Commission Rates (10% Company, 5% Delivery) ---');
        await Commission.deleteMany({});
        await Commission.create({ companyRate: 10, deliveryRate: 5 });

        // 5. Place Order (Logic from orderController.addOrderItems)
        console.log('\n--- Placing Order for ₹200 ---');
        const totalPrice = 200;
        const vendorId = user._id; // Self vendor for simplicity (or random ID)

        if (user.walletBalance < totalPrice) {
            throw new Error('Insufficient Funds');
        }

        const comm = await Commission.findOne();
        const companyEarnings = (totalPrice * comm.companyRate) / 100;
        const deliveryEarnings = (totalPrice * comm.deliveryRate) / 100;
        const vendorEarnings = totalPrice - companyEarnings - deliveryEarnings;

        console.log(`Calculated Splits -> Company: ${companyEarnings}, Delivery: ${deliveryEarnings}, Vendor: ${vendorEarnings}`);

        user.walletBalance -= totalPrice;
        await user.save();

        await Transaction.create({
            user: user._id,
            amount: totalPrice,
            type: 'debit',
            description: 'Payment for Test Order',
            status: 'success'
        });

        const order = await Order.create({
            customer: user._id,
            vendor: vendorId, // Just using user ID as placeholder
            items: [{ name: "Test Item", price: 200, qty: 1 }],
            totalAmount: totalPrice,
            status: 'pending',
            deliveryLocation: "Test Loc",
            paymentStatus: 'paid',
            commission: {
                company: companyEarnings,
                delivery: deliveryEarnings,
                vendor: vendorEarnings
            }
        });

        console.log(`Order Placed: ${order._id}. Payment Status: ${order.paymentStatus}`);
        console.log(`User Final Balance: ${user.walletBalance} (Expected: 800)`);

        // 6. Verify Earnings Aggregation
        console.log('\n--- Verifying Earnings Aggregation ---');
        const result = await Order.aggregate([
            { $match: { _id: order._id } }, // Only check this order for clarity
            {
                $group: {
                    _id: null,
                    totalCompanyEarnings: { $sum: "$commission.company" },
                    totalDeliveryEarnings: { $sum: "$commission.delivery" },
                    totalVendorEarnings: { $sum: "$commission.vendor" },
                }
            }
        ]);
        console.log('Earnings Result:', result[0]);

        if (result[0].totalCompanyEarnings === 20 && result[0].totalDeliveryEarnings === 10) {
            console.log('\n[SUCCESS] All checks passed!');
        } else {
            console.log('\n[FAILURE] Earnings mismatch.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        // Cleanup
        // await User.deleteOne({ email: 'testwalletuser@example.com' });
        mongoose.connection.close();
    }
};

runTest();
