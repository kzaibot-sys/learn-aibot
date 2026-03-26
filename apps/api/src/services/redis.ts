import Redis from 'ioredis';
import { config } from '../config';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  try {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
    redis.on('error', () => {
      // Silently handle — Redis is optional
    });
    redis.connect().catch(() => {
      redis = null;
    });
    return redis;
  } catch {
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Silently handle
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // Silently handle
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // Silently handle
  }
}
