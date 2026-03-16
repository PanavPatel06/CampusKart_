const Vendor = require('../models/Vendor');
const User = require('../models/User');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getVendors = async (req, res) => {
    try {
        // Fetch all vendors and populate user details
        const vendors = await Vendor.find({}).populate('user', 'name email');
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getVendors,
};
