/**
 * Base Controller
 *
 * Provides common functionality for all controllers, including:
 * - Standardized response handling
 * - Error handling
 * - Request/response type safety
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, PaginationMeta } from '@/types';
import { ApiResponse } from '@/utils/response';
import { logger } from '@/config/logger';

export abstract class BaseController {
  /**
   * Execute controller method with automatic error handling
   */
  protected async execute<T>(
    fn: () => Promise<T>,
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await fn();
    } catch (error) {
      logger.error(
        {
          error,
          method: req.method,
          url: req.url,
          userId: req.user?.userId,
        },
        'Controller error',
      );
      next(error);
    }
  }

  /**
   * Send success response
   */
  protected success<T>(res: Response, data: T, statusCode = 200): void {
    ApiResponse.success(res, data, statusCode);
  }

  /**
   * Send created response (201)
   */
  protected created<T>(res: Response, data: T): void {
    ApiResponse.created(res, data);
  }

  /**
   * Send no content response (204)
   */
  protected noContent(res: Response): void {
    ApiResponse.noContent(res);
  }

  /**
   * Send success message
   */
  protected message(res: Response, message: string, statusCode = 200): void {
    ApiResponse.message(res, message, statusCode);
  }

  /**
   * Send paginated response
   */
  protected paginated<T>(res: Response, data: T[], pagination: PaginationMeta): void {
    ApiResponse.paginated(res, data, pagination);
  }

  /**
   * Get authenticated user from request
   */
  protected getAuthUser(req: AuthenticatedRequest) {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return req.user;
  }

  /**
   * Get user ID from request
   */
  protected getUserId(req: AuthenticatedRequest): string {
    return this.getAuthUser(req).userId;
  }

  /**
   * Get user role from request
   */
  protected getUserRole(req: AuthenticatedRequest) {
    return this.getAuthUser(req).role;
  }

  /**
   * Log controller action
   */
  protected logAction(
    req: AuthenticatedRequest,
    action: string,
    metadata?: Record<string, unknown>,
  ): void {
    logger.info(
      {
        action,
        userId: req.user?.userId,
        method: req.method,
        url: req.url,
        ...metadata,
      },
      'Controller action',
    );
  }
}
