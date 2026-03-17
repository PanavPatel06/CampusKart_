const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Vendor/Admin)
const createProduct = async (req, res) => {
    const { name, price, description, image } = req.body;

    try {
        const vendor = await Vendor.findOne({ user: req.user._id });

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor profile not found. Please contact admin.' });
        }

        const product = new Product({
            vendor: vendor._id,
            name,
            price,
            description,
            image: image || '',
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

// @desc    Get vendor's own products
// @route   GET /api/products/vendor/myproducts
// @access  Private (Vendor)
const getVendorProducts = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor profile not found.' });
        }
        const products = await Product.find({ vendor: vendor._id }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Vendor)
const updateProduct = async (req, res) => {
    const { name, price, description, image } = req.body;
    try {
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

        const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
        if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });

        product.name = name || product.name;
        product.price = price || product.price;
        product.description = description !== undefined ? description : product.description;
        product.image = image !== undefined ? image : product.image;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Vendor)
const deleteProduct = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

        const product = await Product.findOneAndDelete({ _id: req.params.id, vendor: vendor._id });
        if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });

        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getVendorProducts,
    updateProduct,
    deleteProduct,
};
