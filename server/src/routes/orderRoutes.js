const express = require('express');
const router = express.Router();
const { addOrderItems, getMyOrders, getVendorOrders, updateOrderStatus, getAvailableDeliveryOrders, getAllOrders, getMyDeliveries } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');


router.route('/delivery/my').get(protect, getMyDeliveries);
router.route('/delivery/available').get(protect, getAvailableDeliveryOrders); // Moved to top
router.route('/').post(protect, addOrderItems);
router.route('/myorders').get(protect, getMyOrders);
router.route('/vendor').get(protect, authorize('vendor', 'admin'), getVendorOrders);
router.route('/:id/status').put(protect, updateOrderStatus);

router.route('/admin/all').get(protect, authorize('admin'), getAllOrders);

module.exports = router;
