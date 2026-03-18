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

const approveAll = async () => {
    await connectDB();
    try {
        const result = await User.updateMany({ role: { $in: ['vendor', 'agent', 'admin', 'user'] } }, { $set: { isApproved: true } });
        console.log(`Updated ${result.modifiedCount} users to isApproved: true`);
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

approveAll();
