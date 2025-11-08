import { z } from 'zod';
import { CampaignStatus } from '@prisma/client';
import {
  uuidSchema,
  brazilianStateSchema,
  countryCodeSchema,
  urlSchema,
  dateStringSchema,
  positiveDecimalSchema,
  positiveIntSchema,
  paginationSchema,
  booleanQuerySchema,
} from './common.schema';

/**
 * Campaign validation schemas
 *
 * Centralizes all Zod validation schemas for campaign endpoints.
 */

export const campaignSchemas = {
  /**
   * Create campaign schema
   * POST /api/merchant/campaigns
   */
  create: z.object({
    body: z
      .object({
        merchantId: uuidSchema,
        title: z.string().min(3, 'Título muito curto').max(200, 'Título muito longo'),
        description: z.string().min(10, 'Descrição muito curta').max(5000, 'Descrição muito longa'),
        shortDescription: z.string().max(500).optional(),
        priceOriginal: positiveDecimalSchema,
        pricePromo: positiveDecimalSchema,
        category: z.string().min(1, 'Categoria é obrigatória').max(100),
        tags: z.array(z.string().max(50)).max(10, 'Máximo 10 tags').optional(),
        city: z.string().min(1, 'Cidade é obrigatória').max(100),
        state: brazilianStateSchema,
        country: countryCodeSchema.default('BR'),
        startAt: dateStringSchema,
        endAt: dateStringSchema,
        totalQuantity: positiveIntSchema.max(100000, 'Quantidade máxima: 100.000'),
        terms: z.string().max(5000).optional(),
        imageUrl: urlSchema.optional(),
        images: z.array(urlSchema).max(10, 'Máximo 10 imagens').optional(),
      })
      .refine((data) => data.pricePromo < data.priceOriginal, {
        message: 'Preço promocional deve ser menor que o preço original',
        path: ['pricePromo'],
      })
      .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
        message: 'Data de término deve ser posterior à data de início',
        path: ['endAt'],
      }),
  }),

  /**
   * Update campaign schema
   * PATCH /api/merchant/campaigns/:id
   */
  update: z.object({
    params: z.object({
      id: uuidSchema,
    }),
    body: z.object({
      title: z.string().min(3).max(200).optional(),
      description: z.string().min(10).max(5000).optional(),
      shortDescription: z.string().max(500).optional(),
      priceOriginal: positiveDecimalSchema.optional(),
      pricePromo: positiveDecimalSchema.optional(),
      category: z.string().min(1).max(100).optional(),
      tags: z.array(z.string().max(50)).max(10).optional(),
      city: z.string().min(1).max(100).optional(),
      state: brazilianStateSchema.optional(),
      startAt: dateStringSchema.optional(),
      endAt: dateStringSchema.optional(),
      totalQuantity: positiveIntSchema.max(100000).optional(),
      terms: z.string().max(5000).optional(),
      imageUrl: urlSchema.optional(),
      images: z.array(urlSchema).max(10).optional(),
      status: z.nativeEnum(CampaignStatus).optional(),
      isFeatured: z.boolean().optional(),
    }),
  }),

  /**
   * Get campaign by ID or slug
   * GET /api/campaigns/:id
   */
  getById: z.object({
    params: z.object({
      id: z.string().min(1, 'ID ou slug é obrigatório'),
    }),
    query: z.object({
      incrementView: booleanQuerySchema(false),
    }),
  }),

  /**
   * List campaigns schema
   * GET /api/campaigns
   */
  list: z.object({
    query: z
      .object({
        city: z.string().max(100).optional(),
        state: brazilianStateSchema.optional(),
        category: z.string().max(100).optional(),
        search: z.string().max(200).optional(),
        status: z.nativeEnum(CampaignStatus).optional(),
        merchantId: uuidSchema.optional(),
        isFeatured: booleanQuerySchema(false),
        ...paginationSchema.shape,
      })
      .partial(),
  }),

  /**
   * Delete campaign schema
   * DELETE /api/merchant/campaigns/:id
   */
  delete: z.object({
    params: z.object({
      id: uuidSchema,
    }),
  }),

  /**
   * Publish campaign schema
   * POST /api/merchant/campaigns/:id/publish
   */
  publish: z.object({
    params: z.object({
      id: uuidSchema,
    }),
  }),

  /**
   * Toggle favorite schema
   * POST /api/campaigns/:id/favorite
   */
  toggleFavorite: z.object({
    params: z.object({
      id: uuidSchema,
    }),
  }),
} as const;
