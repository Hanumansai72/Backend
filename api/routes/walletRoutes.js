const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

// Get vendor wallet (service bookings)
router.get('/wallet/:vendorId', walletController.getVendorWallet);

// Get product wallet
router.get('/product-wallet/:vendorid', walletController.getProductWallet);

module.exports = router;
