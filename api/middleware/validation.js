const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation error handler middleware
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Common validation rules
 */
const validationRules = {
    // Email validation
    email: () => body('email')
        .trim()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    // Password validation
    password: () => body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/\d/).withMessage('Password must contain at least one number'),

    // MongoDB ObjectId validation
    mongoId: (field = 'id') => param(field)
        .isMongoId().withMessage('Invalid ID format'),

    // Phone number validation
    phone: () => body('Phone_number')
        .optional()
        .matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),

    // OTP validation
    otp: () => body('otp')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
        .isNumeric().withMessage('OTP must contain only numbers'),

    // Pagination validation
    pagination: () => [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],

    // Product validation
    product: () => [
        body('ProductName').trim().notEmpty().withMessage('Product name is required'),
        body('ProductPrice').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('ProductStock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
        body('ProductCategory').trim().notEmpty().withMessage('Category is required')
    ],

    // Vendor registration validation
    vendorRegistration: () => [
        body('Business_Name').trim().notEmpty().withMessage('Business name is required'),
        body('Owner_name').trim().notEmpty().withMessage('Owner name is required'),
        body('Email_address').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('Phone_number').matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),
        body('Category').trim().notEmpty().withMessage('Category is required')
    ],

    // User registration validation
    userRegistration: () => [
        body('Full_Name').trim().notEmpty().withMessage('Full name is required'),
        body('Emailaddress').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('Password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],

    // Booking validation
    booking: () => [
        body('Vendorid').isMongoId().withMessage('Invalid vendor ID'),
        body('serviceDate').isISO8601().withMessage('Invalid date format'),
        body('serviceTime').notEmpty().withMessage('Service time is required'),
        body('customer.email').isEmail().withMessage('Valid customer email is required'),
        body('customer.fullName').trim().notEmpty().withMessage('Customer name is required')
    ],

    // Review validation
    review: () => [
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment too long')
    ]
};

module.exports = {
    handleValidationErrors,
    validationRules
};
