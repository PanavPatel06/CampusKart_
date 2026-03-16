const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Vendor',
    },
    deliveryAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: 'Product',
            },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            qty: { type: Number, required: true },
            fileUrl: { type: String },
            printOptions: {
                color: { type: String, enum: ['bw', 'color'], default: 'bw' },
                pages: { type: Number },
                copies: { type: Number, default: 1 },
            },
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'agent_requested', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'unpaid'],
        default: 'unpaid',
    },
    commission: {
        company: { type: Number, default: 0 },
        delivery: { type: Number, default: 0 },
        vendor: { type: Number, default: 0 },
    },
    deliveryOtp: {
        type: String, // 4-digit code
    },
    instructions: {
        type: String,
    },
    deliveryLocation: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
