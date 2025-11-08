/**
 * Pagination utility functions
 */

import { PAGINATION } from '@/config/constants';
import { PaginationMeta, PaginationParams } from '@/types';

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  params: PaginationParams = {},
): PaginationMeta {
  const page = params.page || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(params.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const pages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    pages,
  };
}

/**
 * Calculate skip value for Prisma queries
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Normalize pagination parameters
 */
export function normalizePaginationParams(params: PaginationParams = {}): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = params.page || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(params.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = calculateSkip(page, limit);

  return { page, limit, skip };
}
