const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Order = require('./src/models/Order');
const { getSystemEarnings } = require('./src/controllers/walletController');
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
        console.log('\n--- Testing Revenue Timing ---');
        
        // Helper to capture res.json
        let lastData;
        const res = { 
            json: (data) => { lastData = data; return data; },
            status: () => ({ json: (data) => { lastData = data; return data; } })
        };

        // 1. Get initial earnings
        await getSystemEarnings({}, res);
        let earningsBefore = lastData;
        console.log('Earnings Before:', earningsBefore);

        // 2. Create a "pending" order
        const order = await Order.create({
            customer: new mongoose.Types.ObjectId(),
            vendor: new mongoose.Types.ObjectId(),
            items: [{ name: "Test Item", price: 100, qty: 1 }],
            totalAmount: 100,
            status: 'pending',
            deliveryLocation: "Test Loc",
            commission: { company: 10, delivery: 5, vendor: 85 }
        });
        console.log('Order created (Pending). ID:', order._id);

        // 3. Check earnings (should be same as Before)
        await getSystemEarnings({}, res);
        let earningsAfterPending = lastData;
        console.log('Earnings After Pending:', earningsAfterPending);
        
        if (earningsAfterPending.totalCompanyEarnings !== earningsBefore.totalCompanyEarnings) {
            console.error('FAILURE: Revenue counted before delivery!');
        } else {
            console.log('SUCCESS: Revenue not counted for pending order.');
        }

        // 4. Update order to "delivered"
        order.status = 'delivered';
        await order.save();
        console.log('Order status updated to Delivered.');

        // 5. Check earnings (should be increased)
        await getSystemEarnings({}, res);
        let earningsAfterDelivered = lastData;
        console.log('Earnings After Delivered:', earningsAfterDelivered);

        if (earningsAfterDelivered.totalCompanyEarnings === (earningsBefore.totalCompanyEarnings + 10)) {
            console.log('SUCCESS: Revenue increased exactly by 10 after delivery.');
        } else {
            console.error('FAILURE: Revenue timing or calculation mismatch!');
        }

        // Cleanup
        await Order.findByIdAndDelete(order._id);

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        mongoose.connection.close();
    }
};

runTest();
