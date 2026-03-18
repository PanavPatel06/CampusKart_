const express = require('express');
const router = express.Router();
const { getPendingUsers, approveUser, rejectUser, resetSystem } = require('../controllers/adminController');
const { getAdminAnalytics } = require('../controllers/walletController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/users/pending', protect, authorize('admin'), getPendingUsers);
router.put('/users/:id/approve', protect, authorize('admin'), approveUser);
router.delete('/users/:id/reject', protect, authorize('admin'), rejectUser);
router.get('/analytics', protect, authorize('admin'), getAdminAnalytics);
router.post('/reset', protect, authorize('admin'), resetSystem);

module.exports = router;
