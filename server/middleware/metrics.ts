import { Request, Response, NextFunction } from 'express';
import { recordHttpRequest } from '../metrics';

/**
 * Middleware to track HTTP request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Get request size
  const requestSize = req.headers['content-length']
    ? parseInt(req.headers['content-length'], 10)
    : 0;

  // Capture response size
  const originalSend = res.send;
  let responseSize = 0;

  res.send = function (data: any) {
    if (typeof data === 'string') {
      responseSize = Buffer.byteLength(data);
    } else if (Buffer.isBuffer(data)) {
      responseSize = data.length;
    } else if (data) {
      responseSize = Buffer.byteLength(JSON.stringify(data));
    }

    return originalSend.call(this, data);
  };

  // Record metrics when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = getRoute(req);

    recordHttpRequest(
      req.method,
      route,
      res.statusCode,
      duration,
      requestSize,
      responseSize
    );
  });

  next();
}

/**
 * Extract route pattern from request
 * Converts /api/modules/123 -> /api/modules/:id
 */
function getRoute(req: Request): string {
  // Try to get the matched route
  if (req.route) {
    return req.route.path;
  }

  // Fallback: normalize the path
  let path = req.path;

  // Replace UUID patterns
  path = path.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '/:id'
  );

  // Replace numeric IDs
  path = path.replace(/\/\d+/g, '/:id');

  return path || '/';
}
