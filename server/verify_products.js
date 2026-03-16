const mongoose = require('mongoose');
const Product = require('./src/models/Product');
require('dotenv').config();

const verifyProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const products = await Product.find({}).populate('vendor');
        console.log(`Found ${products.length} total products.`);

        let validCount = 0;
        let invalidCount = 0;

        products.forEach(p => {
            if (p.vendor && p.vendor._id) {
                console.log(`[VALID] ${p.name} - Vendor: ${p.vendor.storeName} (${p.vendor._id})`);
                validCount++;
            } else {
                console.log(`[INVALID] ${p.name} - Vendor: ${p.vendor}`);
                invalidCount++;
            }
        });

        console.log(`Summary: ${validCount} Valid, ${invalidCount} Invalid.`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verifyProducts();
