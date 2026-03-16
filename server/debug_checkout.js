const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
const Vendor = require('./src/models/Vendor');
const Product = require('./src/models/Product');
require('dotenv').config();

const runDebug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Get a test user (customer)
        const customer = await User.findOne({ role: 'user' });
        if (!customer) throw new Error('No customer found');
        console.log('Customer:', customer._id);

        // 2. Get a test product and its vendor
        const product = await Product.findOne().populate('vendor');
        if (!product) throw new Error('No product found');
        if (!product.vendor) throw new Error('Product has no vendor');

        console.log('Product:', product._id, product.name);
        console.log('Vendor:', product.vendor._id);

        // 3. Simulate existing Order Payload from Cart.jsx
        // vendorId comes from the grouping key in Cart.jsx
        const vendorId = product.vendor._id.toString();

        const orderData = {
            customer: customer._id,
            vendor: vendorId,
            items: [{
                product: product._id,
                name: product.name,
                qty: 1,
                price: product.price
            }],
            totalAmount: product.price, // mapped from totalPrice in controller
            status: 'pending'
        };

        console.log('Attempting to create Order with:', JSON.stringify(orderData, null, 2));

        const order = new Order(orderData);
        await order.save();

        console.log('Order created successfully!');
        process.exit(0);

    } catch (error) {
        console.error('SERVER ERROR SIMULATION:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation Error [${key}]: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

runDebug();
