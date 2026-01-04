const jwt = require('jsonwebtoken');

// Get JWT secret with fallback for development
const getJwtSecret = () => {
    const secret = "Apnamestri";
    if (!secret) {
        // For development only - in production, JWT_SECRET must be set in Vercel
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET must be set in production environment. Add it to Vercel Environment Variables.');
        }
        console.warn('WARNING: JWT_SECRET not set. Using default for development only!');
        return 'apna-mestri-dev-secret-key-do-not-use-in-production';
    }
    return secret;
};

/**
 * Generate JWT token
 */
const generateToken = (payload, expiresIn = '24h') => {
    return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, getJwtSecret());
    } catch (error) {
        return null;
    }
};

/**
 * Authentication middleware
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }

    req.user = decoded;
    next();
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
        }

        next();
    };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
            req.user = decoded;
        }
    }

    next();
};

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    authorize,
    optionalAuth
};
