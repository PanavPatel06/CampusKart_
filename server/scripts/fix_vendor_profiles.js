const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');

// Load env vars
dotenv.config({ path: './server/.env' }); // Adjust path if running from root

const fixVendorProfiles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const vendors = await User.find({ role: 'vendor' });
        console.log(`Found ${vendors.length} users with role 'vendor'`);

        for (const user of vendors) {
            const existingProfile = await Vendor.findOne({ user: user._id });
            if (!existingProfile) {
                console.log(`Creating profile for ${user.name} (${user.email})...`);
                await Vendor.create({
                    user: user._id,
                    storeName: `${user.name}'s Store`,
                    location: 'Main Campus', // Default
                    isVerified: true
                });
                console.log(`  -> Created!`);
            } else {
                console.log(`Profile exists for ${user.name}. Skipping.`);
            }
        }

        console.log('Done.');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixVendorProfiles();
