const mongoose = require('mongoose');
const User = require('./src/models/User');
const Vendor = require('./src/models/Vendor');
const Order = require('./src/models/Order');
const Product = require('./src/models/Product');
require('dotenv').config();

const runDebug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- USERS ---');
        const users = await User.find({}).lean();
        users.forEach(u => console.log(`ID: ${u._id}, Name: ${u.name}, Role: ${u.role}, Email: ${u.email}`));

        console.log('\n--- VENDORS ---');
        const vendors = await Vendor.find({}).lean();
        vendors.forEach(v => console.log(`VendorID: ${v._id}, UserRef: ${v.user}, Store: ${v.storeName}`));

        console.log('\n--- ORDERS ---');
        const orders = await Order.find({}).lean();
        orders.forEach(o => console.log(`OrderID: ${o._id}, Customer: ${o.customer}, VendorRef: ${o.vendor}, Status: ${o.status}`));

        console.log('\n--- PRODUCTS ---');
        const products = await Product.find({}).lean();
        products.forEach(p => console.log(`ProductID: ${p._id}, VendorRef: ${p.vendor}, Name: ${p.name}`));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runDebug();
