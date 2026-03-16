const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
const Vendor = require('./src/models/Vendor');

dotenv.config();

const createTestOrder = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find a user and vendor
        const user = await User.findOne({ role: 'user' });
        const vendor = await User.findOne({ role: 'vendor' }); // Find user with vendor role
        let vendorId;

        if (vendor) {
            const vProfile = await Vendor.findOne({ user: vendor._id });
            if (vProfile) vendorId = vProfile._id;
        }

        if (!user || !vendorId) {
            console.log('User or Vendor not found, cannot create test order.');
            process.exit();
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        console.log('Generated OTP (Client Side for comparison, though backend does it):', otp);

        // Simulating Backend Logic locally to test Mongoose Model
        const order = new Order({
            customer: user._id,
            vendor: vendorId,
            items: [{
                name: 'Test Item',
                price: 100,
                qty: 1
            }],
            totalAmount: 100,
            status: 'pending',
            deliveryOtp: "9999", // Explicitly setting it
            instructions: "Test Instruction",
            deliveryLocation: "Hostel X"
        });

        const savedOrder = await order.save();
        console.log('Saved Order ID:', savedOrder._id);
        console.log('Saved Order OTP:', savedOrder.deliveryOtp);

        // Fetch it back
        const fetchedOrder = await Order.findById(savedOrder._id);
        console.log('Fetched Order OTP:', fetchedOrder.deliveryOtp);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createTestOrder();
