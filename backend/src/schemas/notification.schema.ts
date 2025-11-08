/**
 * Notification validation schemas
 */

import { z } from 'zod';
import { Platform, NotificationType } from '@prisma/client';
import { uuidSchema } from './common.schema';

export const notificationSchemas = {
  /**
   * Register push token schema
   * POST /api/push/register
   */
  registerPushToken: z.object({
    body: z.object({
      token: z.string().min(1, 'Token é obrigatório'),
      platform: z.nativeEnum(Platform, {
        errorMap: () => ({ message: 'Platform inválida' }),
      }),
      deviceId: z.string().optional(),
    }),
  }),

  /**
   * Register web push subscription
   * POST /api/push/web/subscribe
   */
  webPushSubscribe: z.object({
    body: z.object({
      endpoint: z.string().url('Endpoint inválido'),
      keys: z.object({
        p256dh: z.string().min(1, 'Chave p256dh é obrigatória'),
        auth: z.string().min(1, 'Chave auth é obrigatória'),
      }),
    }),
  }),

  /**
   * Unsubscribe web push
   * POST /api/push/web/unsubscribe
   */
  webPushUnsubscribe: z.object({
    body: z.object({
      endpoint: z.string().url('Endpoint inválido'),
    }),
  }),

  /**
   * Send push notification (admin)
   * POST /api/push/send
   */
  sendPush: z.object({
    body: z.object({
      userId: uuidSchema,
      title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
      body: z.string().min(1, 'Mensagem é obrigatória').max(500, 'Mensagem muito longa'),
      data: z.record(z.unknown()).optional(),
      type: z.nativeEnum(NotificationType).optional(),
    }),
  }),

  /**
   * Send bulk notification (admin)
   * POST /api/push/send-bulk
   */
  sendBulk: z.object({
    body: z.object({
      userIds: z.array(uuidSchema).min(1, 'Lista de usuários vazia').max(1000),
      title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
      body: z.string().min(1, 'Mensagem é obrigatória').max(500, 'Mensagem muito longa'),
      data: z.record(z.unknown()).optional(),
      type: z.nativeEnum(NotificationType).optional(),
    }),
  }),

  /**
   * Mark notification as read
   * PATCH /api/notifications/:id/read
   */
  markAsRead: z.object({
    params: z.object({
      id: uuidSchema,
    }),
  }),

  /**
   * Get user notifications
   * GET /api/notifications
   */
  list: z.object({
    query: z.object({
      isRead: z.string().optional(),
      type: z.nativeEnum(NotificationType).optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  }),
} as const;
