import Redis from 'ioredis';
import { config } from '../config';

let redis: Redis | null = null;

// Connect eagerly at module load
try {
  redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 500, 2000);
    },
  });
  redis.on('error', () => { /* graceful */ });
  redis.on('ready', () => console.log('[Redis] Connected'));
  redis.on('end', () => { redis = null; });
} catch {
  redis = null;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* graceful */ }
}

export async function cacheDelete(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch { /* graceful */ }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch { /* graceful */ }
}
