const ERROR_CODES = require('./errorCodes');
const ErrorResponse = require('./errorResponse');

/**
 * Validation Utilities
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (Indian format)
const PHONE_REGEX = /^[6-9]\d{9}$/;

// Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validate email format
 */
const validateEmail = (email) => {
    if (!email) {
        throw new ErrorResponse(ERROR_CODES.MISSING_FIELDS, 'Email is required', 400, { field: 'email' });
    }
    if (!EMAIL_REGEX.test(email)) {
        throw new ErrorResponse(ERROR_CODES.INVALID_EMAIL, 'Invalid email format', 400, { field: 'email' });
    }
    return true;
};

/**
 * Validate phone number
 */
const validatePhone = (phone) => {
    if (!phone) {
        throw new ErrorResponse(ERROR_CODES.MISSING_FIELDS, 'Phone number is required', 400, { field: 'phone' });
    }
    if (!PHONE_REGEX.test(phone)) {
        throw new ErrorResponse(ERROR_CODES.INVALID_PHONE, 'Invalid phone number format. Must be 10 digits', 400, { field: 'phone' });
    }
    return true;
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
    if (!password) {
        throw new ErrorResponse(ERROR_CODES.MISSING_FIELDS, 'Password is required', 400, { field: 'password' });
    }
    if (password.length < 8) {
        throw new ErrorResponse(ERROR_CODES.WEAK_PASSWORD, 'Password must be at least 8 characters long', 400, { field: 'password' });
    }
    if (!PASSWORD_REGEX.test(password)) {
        throw new ErrorResponse(
            ERROR_CODES.WEAK_PASSWORD,
            'Password must contain uppercase, lowercase, number, and special character',
            400,
            { field: 'password' }
        );
    }
    return true;
};

/**
 * Validate required fields
 */
const validateRequiredFields = (fields, data) => {
    const missing = [];

    fields.forEach(field => {
        if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
            missing.push(field);
        }
    });

    if (missing.length > 0) {
        throw new ErrorResponse(
            ERROR_CODES.MISSING_FIELDS,
            `Missing required fields: ${missing.join(', ')}`,
            400,
            { fields: missing }
        );
    }

    return true;
};

module.exports = {
    validateEmail,
    validatePhone,
    validatePassword,
    validateRequiredFields,
    EMAIL_REGEX,
    PHONE_REGEX,
    PASSWORD_REGEX
};
