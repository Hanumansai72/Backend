// redisClient.js
const { createClient } = require("redis");
require('dotenv').config();

let client = null;

/**
 * Returns an already-connected client or creates/connects one.
 * Use getClient() in your app files.
 */
async function getClient() {
  if (client && client.isOpen) return client;

  client = createClient({ url: process.env.REDIS_URL });
  client.on('error', (err) => console.error('Redis Client Error', err));
  client.on('connect', () => console.log('Redis connecting...'));
  client.on('ready', () => console.log('Redis ready'));

  await client.connect();
  return client;
}

/**
 * For graceful shutdown
 */
async function quitClient() {
  if (client) {
    try {
      await client.quit();
      console.log('Redis connection closed.');
    } catch (err) {
      console.error('Error closing Redis', err);
    }
  }
}

module.exports = {
  getClient,
  quitClient
};
