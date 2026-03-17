const express = require('express');
const router = express.Router();
const { 
    createProduct, 
    getProducts,
    getVendorProducts,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('vendor', 'admin'), createProduct)
    .get(getProducts);

router.get('/vendor/myproducts', protect, authorize('vendor'), getVendorProducts);

router.route('/:id')
    .put(protect, authorize('vendor'), updateProduct)
    .delete(protect, authorize('vendor'), deleteProduct);

module.exports = router;
