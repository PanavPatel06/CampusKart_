const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
    companyRate: {
        type: Number,
        default: 5, // Percentage
        required: true
    },
    deliveryRate: {
        type: Number,
        default: 5, // Percentage
        required: true
    }
}, {
    timestamps: true
});

// We generally only want one document for this.
const Commission = mongoose.model('Commission', commissionSchema);

module.exports = Commission;
