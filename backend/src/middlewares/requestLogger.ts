import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';
import { AuthRequest } from './auth';

/**
 * Request logging middleware
 *
 * Logs incoming requests and outgoing responses with rich context including:
 * - Request details (method, URL, IP, user agent)
 * - Response details (status code, duration)
 * - User context (if authenticated)
 *
 * Provides automatic correlation between request and response logs.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const authReq = req as AuthRequest;

  // Log incoming request
  logger.info(
    {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: authReq.user?.userId,
    },
    'Incoming request',
  );

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const logContext = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: authReq.user?.userId,
    };

    // Log at different levels based on status code
    if (res.statusCode >= 500) {
      logger.error(logContext, 'Request completed with error');
    } else if (res.statusCode >= 400) {
      logger.warn(logContext, 'Request completed with client error');
    } else {
      logger.info(logContext, 'Request completed');
    }
  });

  next();
}
