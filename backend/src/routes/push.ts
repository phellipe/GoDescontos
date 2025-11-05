import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import { z } from 'zod';
import { pushService } from '@/services/PushService';
import { AuthRequest } from '@/middlewares/auth';
import { Response, NextFunction } from 'express';

const router = Router();

const registerTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    platform: z.enum(['WEB', 'IOS', 'ANDROID', 'EXPO']),
    deviceId: z.string().optional(),
  }),
});

const webPushSubscribeSchema = z.object({
  body: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

const unregisterTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1),
  }),
});

// Register push token
router.post(
  '/register',
  authenticate,
  validate(registerTokenSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { token, platform, deviceId } = req.body;
      await pushService.registerToken(req.user!.userId, token, platform, deviceId);

      res.status(200).json({
        status: 'success',
        message: 'Push token registered successfully',
      });
    } catch (error) {
      next(error);
    }
  },
);

// Subscribe to web push
router.post(
  '/web/subscribe',
  authenticate,
  validate(webPushSubscribeSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { endpoint, keys } = req.body;
      await pushService.subscribeWebPush(req.user!.userId, { endpoint, keys });

      res.status(200).json({
        status: 'success',
        message: 'Web push subscription registered successfully',
      });
    } catch (error) {
      next(error);
    }
  },
);

// Unregister token
router.post(
  '/unregister',
  authenticate,
  validate(unregisterTokenSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      await pushService.unregisterToken(token);

      res.status(200).json({
        status: 'success',
        message: 'Push token unregistered successfully',
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get VAPID public key
router.get('/web/vapid-key', (_req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      publicKey: process.env.VAPID_PUBLIC_KEY || '',
    },
  });
});

export default router;
