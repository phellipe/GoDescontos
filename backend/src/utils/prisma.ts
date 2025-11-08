/**
 * Prisma utility functions
 */

import { Prisma } from '@prisma/client';

/**
 * Create case-insensitive search filter
 */
export function createSearchFilter(
  searchTerm: string,
  fields: string[],
): Prisma.CampaignWhereInput {
  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as Prisma.QueryMode,
      },
    })),
  };
}

/**
 * Create date range filter
 */
export function createDateRangeFilter(
  startField: string,
  endField: string,
  date: Date = new Date(),
) {
  return {
    [startField]: { lte: date },
    [endField]: { gte: date },
  };
}

/**
 * Exclude fields from Prisma result
 * Useful for removing sensitive fields like passwords
 */
export function exclude<T, Key extends keyof T>(
  entity: T,
  keys: Key[],
): Omit<T, Key> {
  const result = { ...entity };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Transform Prisma Decimal to number
 */
export function decimalToNumber(value: Prisma.Decimal | number): number {
  if (typeof value === 'number') return value;
  return Number(value);
}

/**
 * Create location filter
 */
export function createLocationFilter(city?: string, state?: string) {
  const filter: Record<string, unknown> = {};

  if (city) {
    filter.city = {
      contains: city,
      mode: 'insensitive' as Prisma.QueryMode,
    };
  }

  if (state) {
    filter.state = {
      equals: state,
      mode: 'insensitive' as Prisma.QueryMode,
    };
  }

  return filter;
}
