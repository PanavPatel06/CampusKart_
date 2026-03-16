const mongoose = require('mongoose');
const Vendor = require('./src/models/Vendor');
const User = require('./src/models/User');
require('dotenv').config();

const checkVendorLocation = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const vendors = await Vendor.find({}).populate('user', 'name email');
        console.log(`Found ${vendors.length} vendors.`);

        vendors.forEach(v => {
            console.log(`Vendor: ${v.storeName} | User: ${v.user?.name} | Location: '${v.location}'`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkVendorLocation();
