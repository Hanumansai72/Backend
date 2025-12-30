const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { validationRules, handleValidationErrors } = require('../middleware/validation');

// Admin login
router.post('/login',
    authLimiter,
    [validationRules.email(), validationRules.password()],
    handleValidationErrors,
    authController.adminLogin
);

// Vendor login
router.post('/postusername',
    authLimiter,
    [validationRules.email(), validationRules.password()],
    handleValidationErrors,
    authController.vendorLogin
);

// Login with OTP (vendor)
router.post('/loginwith-otp',
    authLimiter,
    [validationRules.email()],
    handleValidationErrors,
    authController.loginWithOtpVendor
);

// Login with OTP (customer)
router.post('/login-with-otp',
    authLimiter,
    [validationRules.email()],
    handleValidationErrors,
    authController.loginWithOtpCustomer
);

// Google login (vendor)
router.post('/google-login',
    authLimiter,
    authController.googleLoginVendor
);

// Google login (customer)
router.post('/google-login/customer',
    authLimiter,
    authController.googleLoginCustomer
);

// Send OTP
router.post('/sendotp',
    otpLimiter,
    [validationRules.email()],
    handleValidationErrors,
    authController.sendOtp
);

// Verify OTP
router.post('/verifyotp',
    authLimiter,
    [validationRules.email(), validationRules.otp()],
    handleValidationErrors,
    authController.verifyOtp
);

// Forget password
router.put('/forgetpassword',
    authLimiter,
    [validationRules.email(), validationRules.password()],
    handleValidationErrors,
    authController.forgetPassword
);

module.exports = router;
