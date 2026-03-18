const User = require('../models/User');
const Vendor = require('../models/Vendor');

// @desc    Get all pending vendor and agent registrations
// @route   GET /api/admin/users/pending
// @access  Private/Admin
const getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ isApproved: false, role: { $in: ['vendor', 'agent'] } }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve a pending user
// @route   PUT /api/admin/users/:id/approve
// @access  Private/Admin
const approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.isApproved = true;
        await user.save();
        res.json({ message: 'User approved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject and delete a pending user
// @route   DELETE /api/admin/users/:id/reject
// @access  Private/Admin
const rejectUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // if the user is a vendor, delete their vendor profile too
        if (user.role === 'vendor') {
            await Vendor.findOneAndDelete({ user: user._id });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User rejected and deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset the system (Admin)
// @route   POST /api/admin/reset
// @access  Private/Admin
const resetSystem = async (req, res) => {
    try {
        const Order = require('../models/Order');
        const Transaction = require('../models/Transaction');
        const Product = require('../models/Product');
        const Vendor = require('../models/Vendor');

        // Delete all transactional data
        await Order.deleteMany({});
        await Transaction.deleteMany({});
        await Product.deleteMany({});
        await Vendor.deleteMany({});

        // Reset all user wallets to 0 (except admin?)
        // Actually the user said "everything restart", so let's reset all.
        await User.updateMany({}, { $set: { walletBalance: 0, isApproved: false } });
        
        // Re-approve the current admin
        const currentAdmin = await User.findById(req.user._id);
        if (currentAdmin) {
            currentAdmin.isApproved = true;
            await currentAdmin.save();
        }

        res.json({ message: 'System reset successfully. All data cleared.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPendingUsers,
    approveUser,
    rejectUser,
    resetSystem,
};
