const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const uploadRoutes = require('./routes/uploadRoutes');
const orderRoutes = require('./routes/orderRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const locationRoutes = require('./routes/locationRoutes');

const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/products', require('./routes/productRoutes'));

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    // Any route not matching API routes gets served the index.html
    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.resolve(__dirname, '../../client/dist', 'index.html'));
    });
} else {
    // Root Route for Development
    app.get('/', (req, res) => {
        res.send('API is running...');
    });
}

module.exports = app;
