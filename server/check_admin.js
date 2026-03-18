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

const checkAdmin = async () => {
    await connectDB();
    try {
        const admins = await User.find({ role: 'admin' });
        console.log('Admins found:', admins.length);
        admins.forEach(admin => {
            console.log(`Email: ${admin.email}, Approved: ${admin.isApproved}, Role: ${admin.role}`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

checkAdmin();
