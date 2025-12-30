const ratelimiter = require('express-rate-limit');

/**
 * General API rate limiter
 */
const generalLimiter = ratelimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = ratelimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * OTP rate limiter
 */
const otpLimiter = ratelimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 OTP requests per hour
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
