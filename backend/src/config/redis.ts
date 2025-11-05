import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redis.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error({ error }, '❌ Redis connection error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error({ error }, 'Failed to disconnect from Redis');
  }
}
