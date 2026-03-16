const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Vendor = require('./src/models/Vendor');
require('dotenv').config();

const check = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("--- Checking for ACCEPTED orders in Hostel A ---");

    // 1. Find Vendor
    const vendors = await Vendor.find({ location: 'Hostel A' });
    const vendorIds = vendors.map(v => v._id);
    console.log(`Found ${vendors.length} vendors in Hostel A:`, vendors.map(v => v.storeName));

    if (vendorIds.length > 0) {
        // 2. Find Orders
        const orders = await Order.find({
            vendor: { $in: vendorIds },
            status: { $in: ['accepted', 'out_for_delivery'] }
        });

        console.log(`Found ${orders.length} ACTIVE orders (accepted/out_for_delivery) for Hostel A.`);
        orders.forEach(o => console.log(` - Order ${o._id}: ${o.status}`));

        // 3. Find PENDING orders
        const pending = await Order.find({
            vendor: { $in: vendorIds },
            status: 'pending'
        });
        console.log(`Found ${pending.length} PENDING orders (waiting for vendor accept).`);
    }

    process.exit(0);
};
check();
