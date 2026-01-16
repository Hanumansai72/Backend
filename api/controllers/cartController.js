const CartItem = require('../models/cart');
const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const { ERROR_CODES } = require('../utils/errorCodes');

/**
 * Add item to cart
 */
exports.addToCart = async (req, res) => {
    const {
        customerid,
        Vendorid,
        productid,
        producturl,
        productname,
        productQuantity,
        productprice,
        productvendor
    } = req.body;

    if (!customerid || !mongoose.Types.ObjectId.isValid(customerid)) {
        return res.status(400).json(
            new ErrorResponse(
                ERROR_CODES.VALIDATION_ERROR,
                'Invalid or missing customer ID',
                { field: 'customerid' },
                400
            ).toJSON()
        );
    }

    if (!Vendorid || !mongoose.Types.ObjectId.isValid(Vendorid)) {
        return res.status(400).json(
            new ErrorResponse(
                ERROR_CODES.VALIDATION_ERROR,
                'Invalid or missing vendor ID',
                { field: 'Vendorid' },
                400
            ).toJSON()
        );
    }

    if (!producturl || !productname || !productQuantity || !productprice) {
        return res.status(400).json(
            new ErrorResponse(
                ERROR_CODES.VALIDATION_ERROR,
                'Missing required product fields',
                { required: ['producturl', 'productname', 'productQuantity', 'productprice'] },
                400
            ).toJSON()
        );
    }

    try {
        const cartItem = new CartItem({
            customerid,
            Vendorid,
            productid,
            producturl,
            productname,
            productQuantity,
            productprice,
            productvendor: productvendor || 'Unknown Vendor'
        });

        const savedItem = await cartItem.save();
        res.status(201).json({ success: true, message: 'Added to cart', cartItem: savedItem });
    } catch (error) {
        console.error('Failed to add to cart:', error);
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to add item to cart',
                { error: error.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Get cart items for customer
 */
exports.getCartItems = async (req, res) => {
    try {
        const id = req.params.id;
        const usercarts = await CartItem.find({ customerid: id });
        res.json({ success: true, items: usercarts, count: usercarts.length });
    } catch (err) {
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to fetch cart items',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Get cart item count for customer
 */
exports.getCartCount = async (req, res) => {
    try {
        const customerId = req.params.id;
        const countcart = await CartItem.countDocuments({ customerid: customerId });
        res.json({ success: true, count: countcart });
    } catch (err) {
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to get cart count',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Delete cart item
 */
exports.deleteCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const deletedItem = await CartItem.findOneAndDelete({
            _id: itemId,
        });

        if (!deletedItem) {
            return res.status(404).json(
                new ErrorResponse(
                    ERROR_CODES.RESOURCE_NOT_FOUND,
                    'Cart item not found',
                    { itemId },
                    404
                ).toJSON()
            );
        }

        res.status(200).json({ success: true, message: 'Item removed from cart' });
    } catch (err) {
        console.error(err);
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to remove item from cart',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};
