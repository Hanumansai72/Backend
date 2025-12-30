const redis = require('redis');

let redisClient = null;

/**
 * Initialize Redis client
 */
const initRedis = async () => {
    // Explicitly disabled
    console.log('Redis is disabled by configuration.');
    return null;
};

/**
 * Get value from cache
 */
const getCache = async (key) => {
    return null;
};

/**
 * Set value in cache
 */
const setCache = async (key, value, expirationInSeconds = 600) => {
    return false;
};

/**
 * Delete value from cache
 */
const deleteCache = async (key) => {
    return false;
};

/**
 * Clear all cache with pattern
 */
const clearCachePattern = async (pattern) => {
    return false;
};

/**
 * Get internal redis client
 */
const getRedisClient = () => null;

/**
 * Cache middleware
 */
const cacheMiddleware = (duration = 600) => {
    return async (req, res, next) => {
        next();
    };
};

module.exports = {
    initRedis,
    getCache,
    setCache,
    deleteCache,
    clearCachePattern,
    cacheMiddleware,
    getRedisClient
};
