const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./src/models/Order');

dotenv.config();

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const orders = await Order.find().sort({ createdAt: -1 }).limit(5);

        console.log('--- LATEST 5 ORDERS ---');
        orders.forEach(o => {
            console.log(`ID: ${o._id}`);
            console.log(`Status: ${o.status}`);
            console.log(`OTP: ${o.deliveryOtp}`);
            console.log(`Created: ${o.createdAt}`);
            console.log('-----------------------');
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkOrders();
