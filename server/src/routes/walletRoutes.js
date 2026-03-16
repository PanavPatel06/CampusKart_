const express = require('express');
const router = express.Router();
const {
    addFunds,
    getWallet,
    getSystemEarnings,
    getCommissionRates,
    updateCommissionRates,
    getUsersForWallet
} = require('../controllers/walletController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/add-funds').post(protect, admin, addFunds);
router.route('/my-wallet').get(protect, getWallet);
router.route('/earnings').get(protect, admin, getSystemEarnings);
router.route('/commission').get(protect, getCommissionRates).put(protect, admin, updateCommissionRates);
router.route('/users').get(protect, admin, getUsersForWallet);

module.exports = router;
