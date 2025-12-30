const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Get all products
router.get('/fetch', productController.getAllProducts);

// Get product by ID
router.get('/product/:id', productController.getProductById);

// Get related products
router.get('/related-products/:category', productController.getRelatedProducts);

// Get products by vendor
router.get('/viewproduct/:vendorId', productController.getProductsByVendor);

// Get product count for vendor
router.get('/api/getproductcount/:id', productController.getProductCount);

// Add product
router.post('/addproduct', productController.addProduct);

// View store products
router.post('/api/viewstore', productController.viewStore);

// Update product view
router.post('/updateview/:id', productController.updateProductView);

// Get recent products
router.post('/recent-products', productController.getRecentProducts);

// Update product
router.put('/updatedetails/:productId', productController.updateProduct);

// Delete product
router.delete('/delete/:id', productController.deleteProduct);

module.exports = router;
