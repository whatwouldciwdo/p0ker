import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // don't spam reconnection in local dev
});

redis.on('error', (err) => {
  // Ignore connection errors if redis is optional in dev
});
