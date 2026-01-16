const ErrorResponse = require('../utils/errorResponse');
const ERROR_CODES = require('../utils/errorCodes');

/**
 * Middleware to ensure user has "product" role (Non-Technical vendor)
 * This enforces that only Product vendors can perform product operations
 */
const requireProductRole = () => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ErrorResponse(
                ERROR_CODES.UNAUTHORIZED,
                'Authentication required',
                401
            ));
        }

        // Allow both "product" role and "Non-Technical" category
        // for backward compatibility
        const hasProductRole = req.user.role === 'product' ||
            req.user.role === 'Non-Technical' ||
            req.user.category === 'Non-Technical';

        if (!hasProductRole) {
            return next(new ErrorResponse(
                ERROR_CODES.FORBIDDEN,
                'Access denied. Product role required.',
                403
            ));
        }

        next();
    };
};

module.exports = requireProductRole;
