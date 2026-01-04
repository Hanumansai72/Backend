const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware } = require('../config/redis');

// Public routes - Get all products (cached 3 min)
router.get('/fetch', cacheMiddleware(180), productController.getAllProducts);

// Get product by ID (cached 5 min)
router.get('/product/:id', cacheMiddleware(300), productController.getProductById);

// Get related products (cached 5 min)
router.get('/related-products/:category', cacheMiddleware(300), productController.getRelatedProducts);

// Get products by vendor
router.get('/viewproduct/:vendorId', productController.getProductsByVendor);

// Get product count for vendor
router.get('/api/getproductcount/:id', productController.getProductCount);

// View store products
router.post('/api/viewstore', productController.viewStore);

// Update product view
router.post('/updateview/:id', productController.updateProductView);

// Get recent products
router.post('/recent-products', productController.getRecentProducts);

// Protected routes - require authentication
// Add product
router.post('/addproduct', authenticateToken, productController.addProduct);

// Update product
router.put('/updatedetails/:productId', authenticateToken, productController.updateProduct);

// Delete product
router.delete('/delete/:id', authenticateToken, productController.deleteProduct);

module.exports = router;

