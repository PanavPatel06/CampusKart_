const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Vendor = require('./src/models/Vendor'); // Required for population
require('dotenv').config();

const fixOrphaned = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Populate vendor to see if it resolves
        const products = await Product.find({}).populate('vendor');
        console.log(`Scanning ${products.length} products for orphans...`);

        let deletedCount = 0;

        for (const p of products) {
            // If p.vendor is null, it means the reference failed (orphan) or was null
            // We already cleaned literal nulls, so these are likely orphans
            if (!p.vendor) {
                console.log(`[ORPHAN DETECTED] Product: "${p.name}" (ID: ${p._id}) - Vendor ref is broken/null.`);
                await Product.findByIdAndDelete(p._id);
                deletedCount++;
            } else if (!p.vendor._id) {
                // Should not happen if populated, but safety check
                console.log(`[WEIRD STATE] Product: "${p.name}" (ID: ${p._id}) - Vendor populated but no _id.`);
                await Product.findByIdAndDelete(p._id);
                deletedCount++;
            }
        }

        console.log(`Cleanup complete. Deleted ${deletedCount} orphaned products.`);
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixOrphaned();
