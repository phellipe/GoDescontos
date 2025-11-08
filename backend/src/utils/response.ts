import { Response } from 'express';

/**
 * Standardized API response helpers
 *
 * Provides consistent response format across the application:
 * - Success responses: { status: 'success', data: T }
 * - Paginated responses: { status: 'success', data: T[], pagination: {...} }
 * - No content responses: 204 status with no body
 *
 * Usage:
 *   ApiResponse.success(res, userData);
 *   ApiResponse.created(res, newCampaign);
 *   ApiResponse.paginated(res, campaigns, pagination);
 */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class ApiResponse {
  /**
   * Send a successful response with data
   * @param res - Express response object
   * @param data - Response data
   * @param statusCode - HTTP status code (default: 200)
   */
  static success<T>(res: Response, data: T, statusCode = 200): void {
    res.status(statusCode).json({
      status: 'success',
      data,
    });
  }

  /**
   * Send a 201 Created response
   * @param res - Express response object
   * @param data - Created resource data
   */
  static created<T>(res: Response, data: T): void {
    this.success(res, data, 201);
  }

  /**
   * Send a 204 No Content response
   * @param res - Express response object
   */
  static noContent(res: Response): void {
    res.status(204).send();
  }

  /**
   * Send a success message response
   * @param res - Express response object
   * @param message - Success message
   * @param statusCode - HTTP status code (default: 200)
   */
  static message(res: Response, message: string, statusCode = 200): void {
    res.status(statusCode).json({
      status: 'success',
      message,
    });
  }

  /**
   * Send a paginated response
   * @param res - Express response object
   * @param data - Array of items
   * @param pagination - Pagination metadata
   */
  static paginated<T>(res: Response, data: T[], pagination: PaginationMeta): void {
    res.status(200).json({
      status: 'success',
      data,
      pagination,
    });
  }
}
