const Redis = require('ioredis');

// Create Redis client with error handling
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true, // Don't connect immediately
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Handle connection errors gracefully
redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

// Connect when module is loaded
redis.connect().catch(err => {
  console.error('Initial Redis connection failed:', err);
});

module.exports = redis;
