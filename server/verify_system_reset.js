const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Order = require('./src/models/Order');
const Product = require('./src/models/Product');
const Vendor = require('./src/models/Vendor');
const Transaction = require('./src/models/Transaction');
const { resetSystem } = require('./src/controllers/adminController');
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
        console.log('\n--- Testing System Reset ---');
        
        // 1. Create some dummy data
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) throw new Error('No admin user found for test');

        await Order.create({ customer: adminUser._id, vendor: adminUser._id, items: [], totalAmount: 10, deliveryLocation: 'Loc' });
        await Product.create({ name: 'Test P', price: 10, category: 'Test', vendor: adminUser._id });
        await Transaction.create({ user: adminUser._id, amount: 10, type: 'credit', status: 'success' });
        
        console.log('Dummy data created.');

        // 2. Call resetSystem
        const req = { user: { _id: adminUser._id } };
        const res = { json: (data) => console.log('Reset Response:', data.message) };
        
        await resetSystem(req, res);

        // 3. Verify counts
        const orderCount = await Order.countDocuments();
        const productCount = await Product.countDocuments();
        const transCount = await Transaction.countDocuments();
        const adminStillApproved = await User.findById(adminUser._id);

        console.log('Counts after reset -> Orders:', orderCount, 'Products:', productCount, 'Transactions:', transCount);
        console.log('Admin isApproved:', adminStillApproved.isApproved);

        if (orderCount === 0 && productCount === 0 && transCount === 0 && adminStillApproved.isApproved) {
            console.log('SUCCESS: System reset successfully cleared transactions but kept admin.');
        } else {
            console.error('FAILURE: System reset did not work as expected!');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        mongoose.connection.close();
    }
};

runTest();
