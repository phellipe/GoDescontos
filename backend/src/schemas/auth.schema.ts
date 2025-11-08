import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { emailSchema, passwordSchema, passwordLoginSchema } from './common.schema';

/**
 * Authentication validation schemas
 *
 * Centralizes all Zod validation schemas for authentication endpoints.
 * Provides consistent validation rules and error messages.
 */

export const authSchemas = {
  /**
   * User registration schema
   * POST /api/auth/register
   */
  register: z.object({
    body: z.object({
      email: emailSchema,
      password: passwordSchema,
      name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome muito longo'),
      role: z.nativeEnum(UserRole).optional().default(UserRole.USER),
    }),
  }),

  /**
   * User login schema
   * POST /api/auth/login
   */
  login: z.object({
    body: z.object({
      email: emailSchema,
      password: passwordLoginSchema,
    }),
  }),

  /**
   * Refresh token schema
   * POST /api/auth/refresh
   */
  refresh: z.object({
    body: z.object({
      refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
    }),
  }),

  /**
   * Logout schema
   * POST /api/auth/logout
   */
  logout: z.object({
    body: z.object({
      refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
    }),
  }),

  /**
   * Email verification schema
   * POST /api/auth/verify-email
   */
  verifyEmail: z.object({
    body: z.object({
      token: z.string().min(1, 'Token é obrigatório'),
    }),
  }),

  /**
   * Forgot password schema
   * POST /api/auth/forgot-password
   */
  forgotPassword: z.object({
    body: z.object({
      email: emailSchema,
    }),
  }),

  /**
   * Reset password schema
   * POST /api/auth/reset-password
   */
  resetPassword: z.object({
    body: z.object({
      token: z.string().min(1, 'Token é obrigatório'),
      password: passwordSchema,
    }),
  }),
} as const;
