/**
 * Payment validation schemas
 */

import { z } from 'zod';
import { uuidSchema, urlSchema, positiveDecimalSchema } from './common.schema';

export const paymentSchemas = {
  /**
   * Create checkout session schema
   * POST /api/payments/create-checkout
   */
  createCheckout: z.object({
    body: z.object({
      merchantId: uuidSchema,
      campaignId: uuidSchema.optional(),
      planId: uuidSchema.optional(),
      amount: positiveDecimalSchema,
      successUrl: urlSchema,
      cancelUrl: urlSchema,
    }),
  }),

  /**
   * Stripe webhook schema
   * POST /api/payments/webhook
   */
  webhook: z.object({
    body: z.unknown(), // Stripe sends the raw event body
  }),

  /**
   * Refund payment schema
   * POST /api/payments/:id/refund
   */
  refund: z.object({
    params: z.object({
      id: uuidSchema,
    }),
    body: z.object({
      amount: positiveDecimalSchema.optional(),
      reason: z.string().max(500).optional(),
    }),
  }),

  /**
   * Get payment by ID
   * GET /api/payments/:id
   */
  getById: z.object({
    params: z.object({
      id: uuidSchema,
    }),
  }),

  /**
   * List payments schema
   * GET /api/payments
   */
  list: z.object({
    query: z.object({
      merchantId: uuidSchema.optional(),
      campaignId: uuidSchema.optional(),
      status: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  }),
} as const;
