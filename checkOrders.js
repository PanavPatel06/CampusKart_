const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
        
        const Order = require('./server/src/models/Order');
        const count = await Order.countDocuments({ vendor: '6989749325d41b95685f6b92' });
        console.log(`Total orders for vendor 6989749325d41b95685f6b92: ${count}`);
        
        const pending = await Order.find({ vendor: '6989749325d41b95685f6b92', status: 'pending' });
        console.log(`Pending orders: ${pending.length}`);
        if (pending.length > 0) {
            console.log('First pending order ID:', pending[0]._id);
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
