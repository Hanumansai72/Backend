const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');
const { requireCustomer } = require('../middleware/Rolebased');

// Protected routes - customers only
// Add to cart
router.post('/api/cart', authenticateToken, requireCustomer(), cartController.addToCart);

// Get cart items
router.get('/carts/:id', authenticateToken, requireCustomer(), cartController.getCartItems);

// Get cart count
router.get('/cart/:id/count', authenticateToken, requireCustomer(), cartController.getCartCount);

// Delete cart item
router.delete('/cart/delete/:itemId', authenticateToken, requireCustomer(), cartController.deleteCartItem);

module.exports = router;
