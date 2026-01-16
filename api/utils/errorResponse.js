/**
 * Custom Error Response Class
 * Provides structured error responses across the application
 */
class ErrorResponse extends Error {
    constructor(code, message, statusCode = 500, details = {}) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.success = false;

        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Convert error to JSON response format
     */
    toJSON() {
        return {
            success: false,
            code: this.code,
            message: this.message,
            details: this.details,
            ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
        };
    }
}

module.exports = ErrorResponse;
