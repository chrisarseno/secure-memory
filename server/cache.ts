import Redis from 'ioredis';
import { env } from './env';
import { logger } from './index';

export class CacheService {
  private redis: Redis | null = null;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = env.ENABLE_REDIS_CACHE && !!env.REDIS_URL;

    if (this.isEnabled) {
      try {
        this.redis = new Redis(env.REDIS_URL!, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              logger.error('Redis connection failed after 3 retries');
              return null; // Stop retrying
            }
            const delay = Math.min(times * 200, 2000);
            return delay;
          },
          reconnectOnError: (err) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
              // Reconnect if read-only error
              return true;
            }
            return false;
          },
        });

        this.redis.on('connect', () => {
          logger.info('✅ Redis connected successfully');
        });

        this.redis.on('error', (err) => {
          logger.error({ err }, '❌ Redis connection error');
        });

        this.redis.on('reconnecting', () => {
          logger.info('🔄 Redis reconnecting...');
        });
      } catch (error) {
        logger.error({ error }, 'Failed to initialize Redis');
        this.redis = null;
        this.isEnabled = false;
      }
    } else {
      logger.info('📦 Redis caching is disabled (in-memory mode)');
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.redis) {
      return null;
    }

    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      logger.debug({ key }, 'Cache hit');
      return parsed as T;
    } catch (error) {
      logger.error({ error, key }, 'Cache get error');
      return null;
    }
  }

  /**
   * Set a value in cache with TTL (in seconds)
   */
  async set(key: string, value: any, ttl: number): Promise<void> {
    if (!this.isEnabled || !this.redis) {
      return;
    }

    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      logger.debug({ key, ttl }, 'Cache set');
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
    }
  }

  /**
   * Delete a specific key
   */
  async del(key: string): Promise<void> {
    if (!this.isEnabled || !this.redis) {
      return;
    }

    try {
      await this.redis.del(key);
      logger.debug({ key }, 'Cache key deleted');
    } catch (error) {
      logger.error({ error, key }, 'Cache delete error');
    }
  }

  /**
   * Invalidate all keys matching a pattern
   */
  async invalidate(pattern: string): Promise<void> {
    if (!this.isEnabled || !this.redis) {
      return;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info({ pattern, count: keys.length }, 'Cache keys invalidated');
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Cache invalidate error');
    }
  }

  /**
   * Get or set pattern: try to get from cache, if miss, call function and cache result
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss, call function
    const result = await fn();

    // Cache the result
    await this.set(key, result, ttl);

    return result;
  }

  /**
   * Check if Redis is connected and healthy
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return true; // Not using Redis, so it's "healthy"
    }

    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error({ error }, 'Redis health check failed');
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keys: number;
    memory: string;
  } | null> {
    if (!this.isEnabled || !this.redis) {
      return null;
    }

    try {
      const info = await this.redis.info('memory');
      const keys = await this.redis.dbsize();

      // Parse memory usage from info string
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        connected: true,
        keys,
        memory,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get cache stats');
      return null;
    }
  }

  /**
   * Close Redis connection (for graceful shutdown)
   */
  async close(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
        logger.info('Redis connection closed');
      } catch (error) {
        logger.error({ error }, 'Error closing Redis connection');
      }
    }
  }
}

// Export singleton instance
export const cache = new CacheService();
