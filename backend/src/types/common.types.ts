/**
 * Common types used across the application
 */

import { Request } from 'express';
import { JwtPayload } from '@/middlewares/auth';

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = unknown> {
  status: 'success';
  data: T;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  status: 'error';
  message: string;
  errors?: unknown;
  stack?: string;
}

/**
 * Soft delete fields
 */
export interface SoftDelete {
  deletedAt?: Date | null;
  isDeleted?: boolean;
}

/**
 * Timestamp fields
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Location data
 */
export interface Location {
  city: string;
  state: string;
  country?: string;
  zipCode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * File upload data
 */
export interface FileUpload {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  url: string;
}
