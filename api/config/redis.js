const redis = require('redis');

let redisClient = null;
let inMemoryCache = new Map();

/**
 * Initialize Redis client
 * Falls back to in-memory cache if Redis is not available
 */
const initRedis = async () => {
    try {
        const redisUrl = "redis://default:NDLGFWNhDRmjRRLWJkHlhvo9qhDoiEXh@redis-18600.c266.us-east-1-3.ec2.cloud.redislabs.com:18600";

        // If no Redis URL, use in-memory caching
        if (!redisUrl) {
            console.log('Redis URL not configured. Using in-memory cache.');
            return null;
        }

        redisClient = redis.createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 3) {
                        console.error('Redis: Too many retries, falling back to in-memory cache');
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
        console.log('Falling back to in-memory cache');
        redisClient = null;
        return null;
    }
};

/**
 * Get value from cache (Redis or in-memory)
 */
const getCache = async (key) => {
    try {
        // Try Redis first
        if (redisClient && redisClient.isOpen) {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        }

        // Fall back to in-memory
        const cached = inMemoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }

        // Expired, delete it
        if (cached) {
            inMemoryCache.delete(key);
        }

        return null;
    } catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
};

/**
 * Set value in cache (Redis or in-memory)
 */
const setCache = async (key, value, expirationInSeconds = 600) => {
    try {
        // Try Redis first
        if (redisClient && redisClient.isOpen) {
            await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value));
            return true;
        }

        // Fall back to in-memory
        inMemoryCache.set(key, {
            data: value,
            expiry: Date.now() + (expirationInSeconds * 1000)
        });

        // Clean up expired entries periodically (max 1000 entries)
        if (inMemoryCache.size > 1000) {
            const now = Date.now();
            for (const [k, v] of inMemoryCache.entries()) {
                if (v.expiry < now) {
                    inMemoryCache.delete(k);
                }
            }
        }

        return true;
    } catch (error) {
        console.error('Cache set error:', error);
        return false;
    }
};

/**
 * Delete value from cache
 */
const deleteCache = async (key) => {
    try {
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(key);
        }
        inMemoryCache.delete(key);
        return true;
    } catch (error) {
        console.error('Cache delete error:', error);
        return false;
    }
};

/**
 * Clear all cache with pattern
 */
const clearCachePattern = async (pattern) => {
    try {
        if (redisClient && redisClient.isOpen) {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }

        // For in-memory, clear matching keys
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of inMemoryCache.keys()) {
            if (regex.test(key)) {
                inMemoryCache.delete(key);
            }
        }

        return true;
    } catch (error) {
        console.error('Cache clear pattern error:', error);
        return false;
    }
};

/**
 * Cache middleware - automatically caches GET responses
 */
const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl}`;

        try {
            const cachedData = await getCache(key);

            if (cachedData) {
                // Add cache hit header for debugging
                res.set('X-Cache', 'HIT');
                return res.json(cachedData);
            }

            // Store original json function
            const originalJson = res.json.bind(res);

            // Override json function to cache the response
            res.json = (data) => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    setCache(key, data, duration);
                }
                res.set('X-Cache', 'MISS');
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * Get cache stats
 */
const getCacheStats = () => {
    return {
        type: redisClient && redisClient.isOpen ? 'redis' : 'in-memory',
        inMemorySize: inMemoryCache.size
    };
};

module.exports = {
    initRedis,
    getCache,
    setCache,
    deleteCache,
    clearCachePattern,
    cacheMiddleware,
    getCacheStats
};
