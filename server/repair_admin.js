const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const repairAdmins = async () => {
    await connectDB();
    try {
        // Reset password for admin@campuskart.com
        const admin1 = await User.findOne({ email: 'admin@campuskart.com' });
        if (admin1) {
            admin1.password = 'admin123';
            admin1.isApproved = true;
            await admin1.save();
            console.log('admin@campuskart.com updated to: admin123');
        }

        // Reset password for admin_new@campuskart.com
        const admin2 = await User.findOne({ email: 'admin_new@campuskart.com' });
        if (admin2) {
            admin2.password = 'admin123';
            admin2.isApproved = true;
            await admin2.save();
            console.log('admin_new@campuskart.com updated to: admin123');
        } else {
            // Create if missing
            await User.create({
                name: 'Admin New',
                email: 'admin_new@campuskart.com',
                password: 'admin123',
                role: 'admin',
                isApproved: true
            });
            console.log('admin_new@campuskart.com created with: admin123');
        }

        // Approve any other admins just in case
        await User.updateMany({ role: 'admin' }, { isApproved: true });
        console.log('All admin accounts marked as approved.');

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

repairAdmins();
