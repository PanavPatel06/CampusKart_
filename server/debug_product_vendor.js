const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Vendor = require('./src/models/Vendor');
const User = require('./src/models/User');
require('dotenv').config();

const check = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const products = await Product.find({}).populate('vendor');
    console.log("--- Products ---");
    products.forEach(p => {
        console.log(`Product: ${p.name}`);
        console.log(`  Vendor Ref ID: ${p.vendor?._id}`);
        console.log(`  Vendor Object:`, p.vendor);
        if (p.vendor) {
            console.log(`  Vendor.user: ${p.vendor.user}`);
            console.log(`  Vendor.storeName: ${p.vendor.storeName}`);
        } else {
            console.log("  WARNING: Vendor is NULL or Not Populated");
        }
    });
    process.exit(0);
};
check();
