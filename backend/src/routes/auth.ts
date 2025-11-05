import { Router } from 'express';
import { authController } from '@/controllers/AuthController';
import { authenticate } from '@/middlewares/auth';
import { authLimiter } from '@/middlewares/rateLimiter';
import { validate } from '@/middlewares/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['USER', 'MERCHANT']).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

// Routes
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register.bind(authController),
);

router.post('/login', authLimiter, validate(loginSchema), authController.login.bind(authController));

router.post('/refresh', validate(refreshSchema), authController.refresh.bind(authController));

router.post('/logout', validate(refreshSchema), authController.logout.bind(authController));

router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  authController.verifyEmail.bind(authController),
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController),
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController),
);

router.get('/me', authenticate, authController.me.bind(authController));

export default router;
