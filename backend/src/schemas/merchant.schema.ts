/**
 * Merchant validation schemas
 */

import { z } from 'zod';
import { uuidSchema, phoneSchema, cnpjSchema, urlSchema, locationSchema } from './common.schema';

export const merchantSchemas = {
  /**
   * Create merchant schema
   * POST /api/merchants
   */
  create: z.object({
    body: z.object({
      name: z.string().min(2, 'Nome muito curto').max(200, 'Nome muito longo'),
      cnpj: cnpjSchema,
      phone: phoneSchema,
      description: z.string().max(2000, 'Descrição muito longa').optional(),
      logoUrl: urlSchema.optional(),
      website: urlSchema.optional(),
      ...locationSchema.shape,
    }),
  }),

  /**
   * Update merchant schema
   * PATCH /api/merchants/:id
   */
  update: z.object({
    params: z.object({
      id: uuidSchema,
    }),
    body: z.object({
      name: z.string().min(2).max(200).optional(),
      cnpj: cnpjSchema,
      phone: phoneSchema,
      description: z.string().max(2000).optional(),
      logoUrl: urlSchema.optional(),
      website: urlSchema.optional(),
      city: z.string().optional(),
      state: z.string().length(2).optional(),
      country: z.string().length(2).optional(),
      zipCode: z.string().optional(),
      address: z.string().optional(),
    }),
  }),

  /**
   * Get merchant by ID
   * GET /api/merchants/:id
   */
  getById: z.object({
    params: z.object({
      id: uuidSchema,
    }),
  }),

  /**
   * Approve merchant schema (admin only)
   * POST /api/admin/merchants/:id/approve
   */
  approve: z.object({
    params: z.object({
      id: uuidSchema,
    }),
  }),

  /**
   * Create customer schema
   * POST /api/merchant/customers
   */
  createCustomer: z.object({
    body: z.object({
      email: z.string().email('Email inválido'),
      name: z.string().min(2, 'Nome muito curto').max(200, 'Nome muito longo'),
      phone: phoneSchema,
      metadata: z.record(z.unknown()).optional(),
    }),
  }),
} as const;
