// redis.js
const { createClient } = require("redis");

let redisClient = null;

async function initRedis() {
  if (!process.env.REDIS_URL) {
    console.log("⚠️ Redis disabled (no REDIS_URL)");
    return null;
  }

  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    console.log("✅ Redis Connected");
    return redisClient;
  } catch (err) {
    console.error("❌ Redis failed, continuing without cache");
    return null;
  }
}

module.exports = { initRedis };
