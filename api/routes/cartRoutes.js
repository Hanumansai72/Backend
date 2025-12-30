const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Add to cart
router.post('/api/cart', cartController.addToCart);

// Get cart items
router.get('/carts/:id', cartController.getCartItems);

// Get cart count
router.get('/cart/:id/count', cartController.getCartCount);

// Delete cart item
router.delete('/delete/:itemId', cartController.deleteCartItem);

module.exports = router;
