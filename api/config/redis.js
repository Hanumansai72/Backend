const redis = require('redis');

let redisClient = null;

/**
 * Initialize Redis client
 * Completely disabled if REDIS_URL is not set or points to localhost
 */
const initRedis = async () => {
    try {
        // Skip Redis if URL not configured or if it's localhost (for local development)
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl || redisUrl.includes('127.0.0.1') || redisUrl.includes('localhost')) {
            console.log('Redis disabled (no remote URL configured). Caching disabled.');
            return null;
        }

        redisClient = redis.createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 3) {
                        console.error('Redis: Too many retries, giving up');
                        return new Error('Too many retries');
                    }
                    return retries * 100;
                }
            }
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err.message);
        });

        redisClient.on('connect', () => {
            console.log('Redis connected successfully');
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('Redis initialization failed:', error.message);
        redisClient = null;
        return null;
    }
};

/**
 * Get value from cache
 */
const getCache = async (key) => {
    if (!redisClient || !redisClient.isOpen) {
        return null;
    }

    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Redis get error:', error);
        return null;
    }
};

/**
 * Set value in cache
 */
const setCache = async (key, value, expirationInSeconds = 600) => {
    if (!redisClient || !redisClient.isOpen) {
        return false;
    }

    try {
        await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Redis set error:', error);
        return false;
    }
};

/**
 * Delete value from cache
 */
const deleteCache = async (key) => {
    if (!redisClient || !redisClient.isOpen) {
        return false;
    }

    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.error('Redis delete error:', error);
        return false;
    }
};

/**
 * Clear all cache with pattern
 */
const clearCachePattern = async (pattern) => {
    if (!redisClient || !redisClient.isOpen) {
        return false;
    }

    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        return true;
    } catch (error) {
        console.error('Redis clear pattern error:', error);
        return false;
    }
};

/**
 * Cache middleware
 */
const cacheMiddleware = (duration = 600) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl}`;
        const cachedData = await getCache(key);

        if (cachedData) {
            return res.json(cachedData);
        }

        // Store original send function
        const originalSend = res.json;

        // Override send function
        res.json = function (data) {
            // Cache the response
            setCache(key, data, duration);
            // Call original send
            originalSend.call(this, data);
        };

        next();
    };
};

module.exports = {
    initRedis,
    getCache,
    setCache,
    deleteCache,
    clearCachePattern,
    cacheMiddleware
};
