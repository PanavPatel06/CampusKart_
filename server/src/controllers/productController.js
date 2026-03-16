const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Vendor/Admin)
const createProduct = async (req, res) => {
    const { name, price, description } = req.body;

    try {
        // Find the Vendor document data for the logged in user
        const vendor = await Vendor.findOne({ user: req.user._id });

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor profile not found. Please contact admin.' });
        }

        const product = new Product({
            vendor: vendor._id, // correctly linking to Vendor Document ID
            name,
            price,
            description,
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({}).populate('vendor', 'storeName location');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProduct,
    getProducts,
};
