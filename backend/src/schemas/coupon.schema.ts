/**
 * Coupon validation schemas
 */

import { z } from 'zod';
import { uuidSchema, idParamsSchema } from './common.schema';

export const couponSchemas = {
  /**
   * Reserve coupon schema
   * POST /api/coupons/reserve
   */
  reserve: z.object({
    body: z.object({
      campaignId: uuidSchema,
    }),
  }),

  /**
   * Get coupon by ID
   * GET /api/coupons/:id
   */
  getById: idParamsSchema,

  /**
   * Redeem coupon schema
   * POST /api/coupons/:code/redeem
   */
  redeem: z.object({
    params: z.object({
      code: z.string().min(1, 'Código do cupom é obrigatório'),
    }),
  }),

  /**
   * Validate coupon code schema
   * GET /api/coupons/validate/:code
   */
  validate: z.object({
    params: z.object({
      code: z.string().min(1, 'Código do cupom é obrigatório'),
    }),
  }),

  /**
   * Generate coupons schema (admin only)
   * POST /api/merchant/campaigns/:id/coupons/generate
   */
  generate: z.object({
    params: z.object({
      id: uuidSchema,
    }),
    body: z.object({
      quantity: z.number().int().positive('Quantidade deve ser positiva').max(10000),
    }),
  }),
} as const;
