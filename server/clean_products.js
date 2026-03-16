const mongoose = require('mongoose');
const Product = require('./src/models/Product');
require('dotenv').config();

const cleanProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find products with no vendor
        const invalidProducts = await Product.find({ vendor: { $exists: false } });
        console.log(`Found ${invalidProducts.length} products with completely missing vendor field.`);

        // Find products where vendor is null (if field exists but is null)
        const nullVendorProducts = await Product.find({ vendor: null });
        console.log(`Found ${nullVendorProducts.length} products with vendor: null.`);

        const allInvalid = [...invalidProducts, ...nullVendorProducts];

        if (allInvalid.length > 0) {
            console.log('Deleting invalid products...');
            for (const p of allInvalid) {
                console.log(`Deleting product: ${p.name} (${p._id})`);
                await Product.findByIdAndDelete(p._id);
            }
            console.log('Cleanup complete.');
        } else {
            console.log('No invalid products found. Schema looks okay?');
        }

        process.exit(0);

    } catch (error) {
        console.error('Cleanup Error:', error);
        process.exit(1);
    }
};

cleanProducts();
