import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('connect', () => {
  console.log('✅ Worker connected to Redis');
});

redis.on('error', (error) => {
  console.error('❌ Redis error:', error);
});
