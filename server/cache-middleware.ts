import { Request, Response, NextFunction } from 'express';
import { cache } from './cache';
import { logger } from './index';

/**
 * Cache middleware for GET requests
 * Usage: app.get('/api/endpoint', cacheMiddleware(60), handler)
 */
export function cacheMiddleware(ttl: number = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `http:${req.originalUrl || req.url}`;

    try {
      // Try to get from cache
      const cachedResponse = await cache.get<{
        statusCode: number;
        body: any;
        headers: Record<string, string>;
      }>(cacheKey);

      if (cachedResponse) {
        // Cache hit - return cached response
        logger.debug({ cacheKey }, 'HTTP cache hit');

        // Set cached headers
        Object.entries(cachedResponse.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        // Add cache header
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);

        return res.status(cachedResponse.statusCode).json(cachedResponse.body);
      }

      // Cache miss - intercept response
      logger.debug({ cacheKey }, 'HTTP cache miss');

      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (body: any) {
        // Only cache successful responses (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseToCache = {
            statusCode: res.statusCode,
            body,
            headers: {
              'content-type': res.getHeader('content-type') as string,
            },
          };

          // Cache asynchronously (don't await to avoid blocking response)
          cache.set(cacheKey, responseToCache, ttl).catch((error) => {
            logger.error({ error, cacheKey }, 'Failed to cache response');
          });
        }

        // Add cache header
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error({ error, cacheKey }, 'Cache middleware error');
      next(); // Continue without caching on error
    }
  };
}

/**
 * Invalidate cache for specific patterns
 * Usage: After updating data, invalidate related cache entries
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    await cache.invalidate(pattern);
    logger.info({ pattern }, 'Cache invalidated');
  } catch (error) {
    logger.error({ error, pattern }, 'Cache invalidation error');
  }
}

/**
 * Middleware to invalidate cache on mutations (POST, PUT, PATCH, DELETE)
 * Usage: app.use('/api/modules', invalidateCacheMiddleware('http:/api/modules*'))
 */
export function invalidateCacheMiddleware(pattern: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate on mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // Invalidate after response is sent
      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await invalidateCache(pattern);
        }
      });
    }

    next();
  };
}
