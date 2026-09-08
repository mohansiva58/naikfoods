import { getRedisClient } from '../config/redis';

/**
 * Shared Redis cache utilities — eliminates duplicate try/catch patterns
 * across all controllers. Safe for 100+ concurrent users.
 * 
 * ALL functions are no-op when Redis is unavailable (server works without cache).
 */

/** Namespace all keys (staging vs prod collisions, version bumps). */
const KEY_PREFIX = `${(process.env.REDIS_KEY_PREFIX || 'sw:v1').replace(/:+$/, '')}:`;

const prefixed = (key: string): string => (key.startsWith(KEY_PREFIX) ? key : `${KEY_PREFIX}${key}`);

/** Get a value from cache. Returns null on miss, error, or Redis unavailable. */
export const cacheGet = async <T = unknown>(key: string): Promise<T | null> => {
    try {
        const redis = getRedisClient();
        if (!redis) return null;
        const cached = await redis.get(prefixed(key));
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
};

/** Set a value in cache with TTL. Fails silently. No-op if Redis unavailable. */
export const cacheSet = async (key: string, data: unknown, ttl: number): Promise<void> => {
    try {
        const redis = getRedisClient();
        if (!redis) return;
        await redis.setEx(prefixed(key), ttl, JSON.stringify(data));
    } catch {
        // Cache is optional — don't crash the request
    }
};

/** Delete a single cache key. Fails silently. */
export const cacheDel = async (key: string): Promise<void> => {
    try {
        const redis = getRedisClient();
        if (!redis) return;
        await redis.del(prefixed(key));
    } catch {
        // Fail silently
    }
};

/**
 * Invalidate all cache keys matching a prefix using SCAN (not KEYS).
 * No-op if Redis unavailable.
 */
export const cacheInvalidatePrefix = async (prefix: string): Promise<number> => {
    try {
        const redis = getRedisClient();
        if (!redis) return 0;
        const fullPrefix = prefixed(prefix).replace(/\*$/, '');
        let cursor = 0;
        let deletedCount = 0;

        do {
            const result = await redis.scan(cursor, {
                MATCH: `${fullPrefix}*`,
                COUNT: 100,
            });
            cursor = result.cursor;
            const keys = result.keys;

            if (keys.length > 0) {
                await redis.del(keys);
                deletedCount += keys.length;
            }
        } while (cursor !== 0);

        return deletedCount;
    } catch {
        return 0;
    }
};

/** Cache TTL constants */
export const CACHE_TTL = {
    PRODUCTS: 3600,     // 1 hour
    CART: 1800,         // 30 minutes
    SALES: 3600,        // 1 hour
    RECENT: 900,         // 15 minutes
    FREQUENT: 1800,      // 30 minutes
    USER_AUTH: 300,     // 5 minutes (auth cache)
} as const;
