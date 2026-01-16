const productdata = require('../models/vendorproudctdetails');
const Vendor = require('../models/admin');
const revieworder = require('../models/reviewvendor');
const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const { ERROR_CODES } = require('../utils/errorCodes');

/**
 * Get all products with optional category filter
 */
exports.getAllProducts = async (req, res) => {
    const { category } = req.query;

    try {
        // Escape regex special characters to prevent injection
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const query = category
            ? { ProductCategory: { $regex: new RegExp(escapeRegex(category), 'i') } }
            : {};

        const products = await productdata.find(query).lean();

        if (!products.length) {
            throw new ErrorResponse(
                ERROR_CODES.RESOURCE_NOT_FOUND,
                'No products found',
                {},
                404
            );
        }

        const productsWithReviewCount = await Promise.all(
            products.map(async (product) => {
                try {
                    const reviewCount = await revieworder.countDocuments({
                        productId: new mongoose.Types.ObjectId(product._id),
                    });
                    return { ...product, ProductReview: reviewCount };
                } catch (err) {
                    console.error(`Error counting reviews for product ${product._id}:`, err);
                    return { ...product, ProductReview: 0 };
                }
            })
        );

        res.status(200).json(productsWithReviewCount);
    } catch (err) {
        console.error('Error fetching products:', err);
        if (err instanceof ErrorResponse) {
            return res.status(err.statusCode).json(err.toJSON());
        }
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to fetch products',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Get product by ID
 */
exports.getProductById = async (req, res) => {
    try {
        const product = await productdata.findById(req.params.id);

        if (!product) {
            throw new ErrorResponse(
                ERROR_CODES.RESOURCE_NOT_FOUND,
                'Product not found',
                {},
                404
            );
        }

        const vendor = await Vendor.findById(product.Vendor);

        res.json({
            ...product.toObject(),
            Vendor: vendor
        });
    } catch (err) {
        console.error('Error fetching product:', err);
        if (err instanceof ErrorResponse) {
            return res.status(err.statusCode).json(err.toJSON());
        }
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to fetch product details',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Get related products by category
 */
exports.getRelatedProducts = async (req, res) => {
    try {
        const { category } = req.params;
        const { exclude } = req.query;

        const related = await productdata.find({
            ProductCategory: category,
            _id: { $ne: exclude }
        }).limit(4);

        res.json(related);
    } catch (err) {
        console.error('Error fetching related products:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get products by vendor ID
 */
exports.getProductsByVendor = async (req, res) => {
    const vendorId = req.params.vendorId;

    if (!vendorId || vendorId === 'null') {
        throw new ErrorResponse(
            ERROR_CODES.VALIDATION_ERROR,
            'Invalid vendor ID',
            {},
            400
        );
    }

    try {
        const products = await productdata.find({ Vendor: vendorId });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products by vendor ID:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Get product count for vendor
 */
exports.getProductCount = async (req, res) => {
    const id = req.params.id;
    const productwallet = require('../models/productwallet');
    const vieworder = require('../models/productorders');

    try {
        const products_id = await productdata.countDocuments({ Vendor: id });
        const product_wallet = await productwallet.findOne({ vendorid: id });
        const product_total_order = await vieworder.countDocuments({ vendorid: id });

        const balance = product_wallet ? product_wallet.balance : 0;
        res.status(200).json({
            success: true,
            vendorId: id,
            count: products_id,
            balance: balance,
            total_order: product_total_order
        });
    } catch (error) {
        console.error('Error fetching product count:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while counting products',
            error: error.message,
        });
    }
};

/**
 * Add new product
 */
exports.addProduct = async (req, res) => {
    try {
        const {
            Vendor,
            ProductName,
            ProductPrice,
            ProductStock,
            ProductDescription,
            ProductTags,
            ProductCategory,
            ProductSubCategory,
            ProductLocation,
            discountedprice,
            ProductUrl,
            ProductModelNumber,
            Weight,
            UnitofMeasurement,
            MinimumOrderQuantity,
            isAvailable
        } = req.body;

        if (
            !Vendor ||
            !ProductName ||
            !ProductPrice ||
            !ProductStock ||
            !ProductDescription ||
            !ProductCategory ||
            !ProductSubCategory ||
            !ProductLocation
        ) {
            throw new ErrorResponse(
                ERROR_CODES.VALIDATION_ERROR,
                'Missing required fields',
                {
                    required: ['Vendor', 'ProductName', 'ProductPrice', 'ProductStock',
                        'ProductDescription', 'ProductCategory', 'ProductSubCategory', 'ProductLocation']
                },
                400
            );
        }

        const ProductUrls = Array.isArray(ProductUrl)
            ? ProductUrl
            : typeof ProductUrl === 'string'
                ? [ProductUrl]
                : [];

        const newProduct = new productdata({
            Vendor,
            ProductName,
            ProductPrice,
            ProductStock,
            ProductDescription,
            ProductTags,
            ProductCategory,
            ProductSubCategory,
            ProductLocation,
            discountedprice,
            ProductUrl: ProductUrls,
            ProductModelNumber,
            Weight,
            UnitofMeasurement,
            MinimumOrderQuantity,
            isAvailable: isAvailable ?? true,
        });

        const savedProduct = await newProduct.save();
        res.status(201).json({
            success: true,
            message: 'Product uploaded successfully',
            product: savedProduct,
        });
    } catch (err) {
        console.error('Product upload error:', err);
        if (err instanceof ErrorResponse) {
            return res.status(err.statusCode).json(err.toJSON());
        }
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to add product',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * View store products
 */
exports.viewStore = async (req, res) => {
    try {
        const { id } = req.body;
        const product_id = await productdata.find({ Vendor: id });
        res.json(product_id);
    } catch (err) {
        console.error('Error viewing store:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Update product view count
 */
exports.updateProductView = async (req, res) => {
    const id = req.params.id;
    const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    try {
        const product = await productdata.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        if (!product.uniqueViews) {
            product.uniqueViews = [];
        }

        if (!product.uniqueViews.includes(ip_address)) {
            product.uniqueViews.push(ip_address);
            product.productview = (product.productview || 0) + 1;
            await product.save();
        }

        res.status(200).json({
            success: true,
            message: 'Unique view recorded',
            views: product.productview,
        });
    } catch (err) {
        console.error('Error tracking view:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

/**
 * Get recent products by IDs
 */
exports.getRecentProducts = async (req, res) => {
    try {
        const products = await productdata.find({ _id: { $in: req.body.ids } });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Update product details
 */
exports.updateProduct = async (req, res) => {
    const { productId } = req.params;
    const {
        ProductName,
        ProductPrice,
        ProductStock,
        ProductDescription,
        ProductCategory,
        ProductSubCategory,
        ProductTags,
        ProductLocation,
    } = req.body;

    try {
        // Verify ownership - vendor can only update their own products
        const product = await productdata.findById(productId);
        if (!product) {
            throw new ErrorResponse(
                ERROR_CODES.RESOURCE_NOT_FOUND,
                'Product not found',
                {},
                404
            );
        }

        if (req.user.role !== 'admin' && product.Vendor.toString() !== req.user.id) {
            throw new ErrorResponse(
                ERROR_CODES.FORBIDDEN,
                'Access denied. You can only update your own products',
                {},
                403
            );
        }

        const updatedProduct = await productdata.findByIdAndUpdate(
            productId,
            {
                ProductName,
                ProductPrice,
                ProductStock,
                ProductDescription,
                ProductCategory,
                ProductSubCategory,
                ProductTags,
                ProductLocation,
            },
            { new: true }
        );

        res.json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
    const productId = req.params.id;

    try {
        // Verify ownership - vendor can only delete their own products
        const product = await productdata.findById(productId);
        if (!product) {
            throw new ErrorResponse(
                ERROR_CODES.RESOURCE_NOT_FOUND,
                'Product not found',
                {},
                404
            );
        }

        if (req.user.role !== 'admin' && product.Vendor.toString() !== req.user.id) {
            throw new ErrorResponse(
                ERROR_CODES.FORBIDDEN,
                'Access denied. You can only delete your own products',
                {},
                403
            );
        }

        await productdata.findByIdAndDelete(productId);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
