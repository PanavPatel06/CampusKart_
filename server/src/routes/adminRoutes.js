const express = require('express');
const router = express.Router();
const { getPendingUsers, approveUser, rejectUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/users/pending', protect, authorize('admin'), getPendingUsers);
router.put('/users/:id/approve', protect, authorize('admin'), approveUser);
router.delete('/users/:id/reject', protect, authorize('admin'), rejectUser);

module.exports = router;
