import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;
let redisAvailable = false;

export const connectRedis = async () => {
    try {
        const redisUrl = process.env.REDIS_URL;
        const redisPassword = process.env.REDIS_PASSWORD;

        if (!redisUrl) {
            console.warn('⚠️  REDIS_URL not set — running without Redis cache (server will still work)');
            return null;
        }

        // Support both formats: full URL with password, or separate URL + password
        let connectionUrl: string;
        if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
            // Full URL already provided (e.g., from Render/Railway)
            connectionUrl = redisUrl;
        } else if (redisPassword) {
            connectionUrl = `redis://:${redisPassword}@${redisUrl}`;
        } else {
            connectionUrl = `redis://${redisUrl}`;
        }

        redisClient = createClient({
            url: connectionUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('❌ Redis reconnection failed after 10 attempts');
                        redisAvailable = false;
                        return new Error('Redis reconnection limit exceeded');
                    }
                    return Math.min(retries * 100, 3000);
                },
                connectTimeout: 5000,
            },
        });

        redisClient.on('error', (error) => {
            console.error('❌ Redis client error:', error.message);
            redisAvailable = false;
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis connected and ready');
            redisAvailable = true;
        });

        redisClient.on('reconnecting', () => {
            console.log('🔄 Redis reconnecting...');
        });

        await redisClient.connect();
        redisAvailable = true;

        return redisClient;
    } catch (error) {
        console.warn('⚠️  Redis connection failed — running without cache:', (error as Error).message);
        redisClient = null;
        redisAvailable = false;
        // DON'T throw — server should work without Redis
        return null;
    }
};

/** Returns Redis client or null if unavailable. Callers must handle null. */
export const getRedisClient = (): ReturnType<typeof createClient> | null => {
    if (!redisClient || !redisAvailable) {
        return null;
    }
    return redisClient;
};

/** Check if Redis is currently available */
export const isRedisAvailable = (): boolean => redisAvailable;

export const disconnectRedis = async () => {
    if (redisClient) {
        try {
            await redisClient.quit();
            console.log('✅ Redis disconnected');
        } catch {
            // Already disconnected
        }
        redisClient = null;
        redisAvailable = false;
    }
};
