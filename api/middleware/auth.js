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

// Cookie configuration for production
const getCookieOptions = (maxAge = 7 * 24 * 60 * 60 * 1000) => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,           // Prevents XSS access to cookie
        secure: isProduction,      // HTTPS only in production
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in production
        maxAge: maxAge,           // 7 days by default
        path: '/'
    };
};

/**
 * Set auth token cookie
 */
const setCookieToken = (res, token, maxAge = 7 * 24 * 60 * 60 * 1000) => {
    res.cookie('authToken', token, getCookieOptions(maxAge));
};

/**
 * Clear auth token cookie
 */
const clearCookieToken = (res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/'
    });
};

/**
 * Generate JWT token
 */
const generateToken = (payload, expiresIn = '7d') => {
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
 * Get token from request (cookies first, then Authorization header)
 */
const getTokenFromRequest = (req) => {
    // Check cookies first
    if (req.cookies && req.cookies.authToken) {
        return req.cookies.authToken;
    }

    // Fall back to Authorization header (for mobile apps, Postman, etc.)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    return null;
};


const authenticateToken = (req, res, next) => {
    const token = getTokenFromRequest(req);

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
    const token = getTokenFromRequest(req);

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
    optionalAuth,
    setCookieToken,
    clearCookieToken,
    getTokenFromRequest
};
