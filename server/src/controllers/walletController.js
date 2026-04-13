const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Commission = require('../models/Commission');
const Order = require('../models/Order');

// @desc    Add funds to user wallet (Admin)
// @route   POST /api/wallet/add-funds
// @access  Private (Admin)
const addFunds = async (req, res) => {
    const { userId, amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Please provide a valid positive amount');
    }

    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Update Wallet Balance
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();

    // Create Transaction Record
    await Transaction.create({
        user: userId,
        amount: amount,
        type: 'credit',
        description: 'Funds added by Admin',
        status: 'success'
    });

    res.json({
        message: 'Funds added successfully',
        balance: user.walletBalance
    });
};

// @desc    Get user wallet balance and transactions
// @route   GET /api/wallet/my-wallet
// @access  Private
const getWallet = async (req, res) => {
    const user = await User.findById(req.user._id);
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
        balance: user.walletBalance || 0,
        transactions
    });
};

// @desc    Get system earnings (Admin)
// @route   GET /api/wallet/earnings
// @access  Private (Admin)
const getSystemEarnings = async (req, res) => {
    // Aggregate earnings from all DELIVERED Orders
    const result = await Order.aggregate([
        {
            $match: { status: 'delivered' }
        },
        {
            $group: {
                _id: null,
                totalCompanyEarnings: { $sum: "$commission.company" },
                totalDeliveryEarnings: { $sum: "$commission.delivery" },
                totalVendorEarnings: { $sum: "$commission.vendor" },
                totalSales: { $sum: "$totalAmount" }
            }
        }
    ]);

    res.json(result[0] || {
        totalCompanyEarnings: 0,
        totalDeliveryEarnings: 0,
        totalVendorEarnings: 0,
        totalSales: 0
    });
};

// @desc    Get admin analytics (Admin)
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAdminAnalytics = async (req, res) => {
    const { type } = req.query; // daily, weekly, monthly, yearly

    const now = new Date();
    const startDate = new Date();
    let groupId;

    switch (type) {
        case 'daily':
            // Last 24 hours — group by hour ("08", "09", ...)
            startDate.setHours(now.getHours() - 23, 0, 0, 0);
            groupId = { $dateToString: { format: '%H', date: '$createdAt' } };
            break;

        case 'monthly':
            // Last 30 days — group by week within that period ("Week 1" ... "Week 4")
            startDate.setDate(now.getDate() - 29);
            startDate.setHours(0, 0, 0, 0);
            groupId = {
                $concat: [
                    'Week ',
                    {
                        $toString: {
                            $add: [
                                1,
                                {
                                    $floor: {
                                        $divide: [
                                            { $divide: [{ $subtract: ['$createdAt', startDate] }, 86400000] },
                                            7
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            };
            break;

        case 'yearly':
            // Last 12 months — group by month ("2026-04")
            startDate.setFullYear(now.getFullYear() - 1);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            groupId = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
            break;

        case 'weekly':
        default:
            // Last 7 days — group by date ("2026-04-07")
            startDate.setDate(now.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            groupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
            break;
    }

    try {
        const stats = await Order.aggregate([
            {
                $match: {
                    status: 'delivered',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: groupId,
                    revenue:       { $sum: '$totalAmount' },
                    commission:    { $sum: '$commission.company' },
                    deliveryProfit:{ $sum: '$commission.delivery' },
                    orderCount:    { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get commission rates
// @route   GET /api/wallet/commission
// @access  Private
const getCommissionRates = async (req, res) => {
    let commission = await Commission.findOne();
    if (!commission) {
        // Initialize if not exists
        commission = await Commission.create({});
    }
    res.json(commission);
};

// @desc    Update commission rates (Admin)
// @route   PUT /api/wallet/commission
// @access  Private (Admin)
const updateCommissionRates = async (req, res) => {
    const { companyRate, deliveryRate } = req.body;

    let commission = await Commission.findOne();
    if (!commission) {
        commission = new Commission();
    }

    commission.companyRate = companyRate !== undefined ? companyRate : commission.companyRate;
    commission.deliveryRate = deliveryRate !== undefined ? deliveryRate : commission.deliveryRate;

    await commission.save();
    res.json(commission);
};

// @desc    Get All Users with Wallet Info (For Admin search)
// @route   GET /api/wallet/users?search=...
// @access  Private (Admin)
const getUsersForWallet = async (req, res) => {
    const keyword = req.query.search
        ? {
            $or: [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
            ],
        }
        : {};

    const users = await User.find({ ...keyword, role: 'user' }).select('name email walletBalance');
    res.json(users);
}

// @desc    Get admin summary report (all-time, weekly, monthly)
// @route   GET /api/wallet/report
// @access  Private (Admin)
const getAdminReport = async (req, res) => {
    try {
        const now = new Date();

        const buildStats = async (startDate) => {
            const match = { status: 'delivered' };
            if (startDate) match.createdAt = { $gte: startDate };

            const result = await Order.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        totalOrders:    { $sum: 1 },
                        netRevenue:     { $sum: '$commission.company' },
                        totalCommission:{ $sum: { $add: ['$commission.company', '$commission.delivery'] } },
                        totalSales:     { $sum: '$totalAmount' },
                    }
                }
            ]);

            return result[0] || { totalOrders: 0, netRevenue: 0, totalCommission: 0, totalSales: 0 };
        };

        const weekStart  = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now); monthStart.setDate(monthStart.getDate() - 30);

        const [allTime, weekly, monthly] = await Promise.all([
            buildStats(null),
            buildStats(weekStart),
            buildStats(monthStart),
        ]);

        res.json({ allTime, weekly, monthly });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addFunds,
    getWallet,
    getSystemEarnings,
    getAdminAnalytics,
    getCommissionRates,
    updateCommissionRates,
    getUsersForWallet,
    getAdminReport,
};
