const CartItem = require('../models/cart');
const mongoose = require('mongoose');

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
        return res.status(400).json({ message: 'Invalid or missing customerid' });
    }

    if (!Vendorid || !mongoose.Types.ObjectId.isValid(Vendorid)) {
        return res.status(400).json({ message: 'Invalid or missing Vendorid' });
    }

    if (!producturl || !productname || !productQuantity || !productprice) {
        return res.status(400).json({ message: 'Missing required product fields' });
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
        res.status(201).json({ message: 'Added to cart', cartItem: savedItem });
    } catch (error) {
        console.error('Failed to add to cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get cart items for customer
 */
exports.getCartItems = async (req, res) => {
    try {
        const id = req.params.id;
        const usercarts = await CartItem.find({ customerid: id });
        res.json(usercarts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get cart item count for customer
 */
exports.getCartCount = async (req, res) => {
    try {
        const customerId = req.params.id;
        const countcart = await CartItem.countDocuments({ customerid: customerId });
        res.json({ count: countcart });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
            return res.status(404).json({ message: 'Cart item not found' });
        }

        res.status(200).json({ message: 'Item removed from cart' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
