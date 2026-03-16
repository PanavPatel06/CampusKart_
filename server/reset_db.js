const mongoose = require('mongoose');
const User = require('./src/models/User');
const Order = require('./src/models/Order');
const Vendor = require('./src/models/Vendor');
const Product = require('./src/models/Product');
require('dotenv').config();

const resetDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        await Order.deleteMany({});
        console.log('Cleared Orders');

        await Product.deleteMany({});
        console.log('Cleared Products');

        await Vendor.deleteMany({});
        console.log('Cleared Vendors');

        await User.deleteMany({});
        console.log('Cleared Users');

        console.log('Database Reset Complete');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetDB();
