const ErrorResponse = require('../utils/errorResponse');
const ERROR_CODES = require('../utils/errorCodes');

/**
 * Global Error Handler Middleware
 * Catches all errors and returns structured responses
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }

    // Mongoose Bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new ErrorResponse(ERROR_CODES.NOT_FOUND, message, 404);
    }

    // Mongoose Duplicate Key Error (E11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0];
        let message = 'Duplicate entry';

        if (field === 'Emailaddress' || field === 'Email_address') {
            message = 'User with this email already exists';
            error = new ErrorResponse(ERROR_CODES.DUPLICATE_USER, message, 409, { field: 'email' });
        } else if (field === 'Phone_Number') {
            message = 'User with this phone number already exists';
            error = new ErrorResponse(ERROR_CODES.DUPLICATE_USER, message, 409, { field: 'phone' });
        } else {
            message = `Duplicate ${field}`;
            error = new ErrorResponse(ERROR_CODES.ALREADY_EXISTS, message, 409, { field });
        }
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        const message = messages.join(', ');
        error = new ErrorResponse(ERROR_CODES.VALIDATION_ERROR, message, 400, {
            fields: Object.keys(err.errors)
        });
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new ErrorResponse(ERROR_CODES.TOKEN_INVALID, message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new ErrorResponse(ERROR_CODES.TOKEN_EXPIRED, message, 401);
    }

    // If it's already an ErrorResponse, use it
    if (err instanceof ErrorResponse) {
        error = err;
    }

    // Default to 500 server error
    const statusCode = error.statusCode || 500;
    const response = error instanceof ErrorResponse
        ? error.toJSON()
        : {
            success: false,
            code: ERROR_CODES.SERVER_ERROR,
            message: error.message || 'Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        };

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
