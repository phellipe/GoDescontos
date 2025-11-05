import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '@/middlewares/auth';
import { AuthRequest } from '@/middlewares/auth';
import { stripeService } from '@/services/StripeService';
import { UserRole } from '@prisma/client';
import { env } from '@/config/env';
import Stripe from 'stripe';
import { paymentLimiter } from '@/middlewares/rateLimiter';

const router = Router();

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// Create checkout session
router.post(
  '/create-checkout',
  authenticate,
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  paymentLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { merchantId, campaignId, planId, amount } = req.body;

      const result = await stripeService.createCheckoutSession({
        merchantId,
        campaignId,
        planId,
        amount,
        successUrl: env.STRIPE_SUCCESS_URL,
        cancelUrl: env.STRIPE_CANCEL_URL,
      });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Stripe webhook endpoint
router.post(
  '/webhook',
  // Use raw body for webhook signature verification
  Router().raw({ type: 'application/json' }),
  async (req: Request, res: Response, next: NextFunction) => {
    const sig = req.headers['stripe-signature'] as string;

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        env.STRIPE_WEBHOOK_SECRET,
      );

      await stripeService.handleWebhook(event);

      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
