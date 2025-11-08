/**
 * Common reusable Zod schemas
 *
 * These schemas are used across multiple validation schemas to ensure consistency
 */

import { z } from 'zod';

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('ID inválido');

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Email inválido').toLowerCase();

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(100, 'Senha muito longa')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  );

/**
 * Relaxed password schema for login (no complexity requirements)
 */
export const passwordLoginSchema = z.string().min(1, 'Senha é obrigatória');

/**
 * Brazilian state code (UF) schema
 */
export const brazilianStateSchema = z
  .string()
  .length(2, 'Estado inválido')
  .toUpperCase()
  .refine(
    (val) =>
      [
        'AC',
        'AL',
        'AP',
        'AM',
        'BA',
        'CE',
        'DF',
        'ES',
        'GO',
        'MA',
        'MT',
        'MS',
        'MG',
        'PA',
        'PB',
        'PR',
        'PE',
        'PI',
        'RJ',
        'RN',
        'RS',
        'RO',
        'RR',
        'SC',
        'SP',
        'SE',
        'TO',
      ].includes(val),
    'Estado inválido',
  );

/**
 * Country code schema (ISO 3166-1 alpha-2)
 */
export const countryCodeSchema = z.string().length(2, 'Código de país inválido').toUpperCase();

/**
 * URL validation schema
 */
export const urlSchema = z.string().url('URL inválida');

/**
 * Phone number schema (Brazilian format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Número de telefone inválido')
  .optional();

/**
 * CNPJ validation schema (Brazilian company ID)
 */
export const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido')
  .optional();

/**
 * Pagination query parameters schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100).default(20)),
});

/**
 * Date string schema (ISO 8601)
 */
export const dateStringSchema = z.string().datetime('Data inválida');

/**
 * Positive decimal schema
 */
export const positiveDecimalSchema = z.number().positive('Valor deve ser positivo');

/**
 * Non-negative integer schema
 */
export const nonNegativeIntSchema = z.number().int().nonnegative('Valor não pode ser negativo');

/**
 * Positive integer schema
 */
export const positiveIntSchema = z.number().int().positive('Valor deve ser positivo');

/**
 * Request params with ID
 */
export const idParamsSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

/**
 * Optional boolean query parameter
 */
export const booleanQuerySchema = (defaultValue = false) =>
  z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default(String(defaultValue));

/**
 * Location schema (address components)
 */
export const locationSchema = z.object({
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: brazilianStateSchema,
  country: countryCodeSchema.default('BR'),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

/**
 * Metadata schema (flexible JSON object)
 */
export const metadataSchema = z.record(z.unknown()).optional();
