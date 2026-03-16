const express = require('express');
const router = express.Router();
const { createProduct, getProducts } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').post(protect, authorize('vendor', 'admin'), createProduct).get(getProducts);

module.exports = router;
