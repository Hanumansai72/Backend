const ratelimiter = require('express-rate-limit');

/**
 * General API rate limiter
 * Increased limits for production use
 */
const generalLimiter = ratelimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 minutes (was 100)
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/';
    }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = ratelimiter({
    windowMs: 1 * 60 * 1000, // 1 minute (was 15 minutes)
    max: 10, // 10 attempts per minute (was 5 per 15 min)
    message: 'Too many login attempts, please try again after a minute',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * OTP rate limiter
 */
const otpLimiter = ratelimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 OTP requests per hour (was 3)
    message: 'Too many OTP requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * File upload rate limiter
 */
const uploadLimiter = ratelimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * API creation rate limiter (for creating resources)
 */
const createLimiter = ratelimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 creations per hour
    message: 'Too many creation requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    authLimiter,
    otpLimiter,
    uploadLimiter,
    createLimiter
};
