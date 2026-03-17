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

module.exports = {
    getPendingUsers,
    approveUser,
    rejectUser,
};
