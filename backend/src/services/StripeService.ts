import Stripe from 'stripe';
import { env } from '@/config/env';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

interface CreateCheckoutSessionData {
  merchantId: string;
  campaignId?: string;
  planId?: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}

export class StripeService {
  /**
   * Create checkout session for one-time payment
   */
  async createCheckoutSession(data: CreateCheckoutSessionData): Promise<{ url: string; sessionId: string }> {
    const merchant = await prisma.merchant.findUnique({
      where: { id: data.merchantId },
      include: { user: true },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Create or get Stripe customer
    let stripeCustomerId = '';

    const existingPayments = await prisma.payment.findFirst({
      where: { merchantId: data.merchantId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPayments?.stripeCustomerId) {
      stripeCustomerId = existingPayments.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: merchant.user.email,
        name: merchant.name,
        metadata: {
          merchantId: merchant.id,
          userId: merchant.userId,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: data.campaignId ? 'Campaign Payment' : 'Subscription',
              description: data.campaignId
                ? `Payment for campaign`
                : `Subscription to plan`,
            },
            unit_amount: Math.round(data.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: data.planId ? 'subscription' : 'payment',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: {
        merchantId: data.merchantId,
        campaignId: data.campaignId || '',
        planId: data.planId || '',
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        merchantId: data.merchantId,
        campaignId: data.campaignId,
        stripePaymentId: session.id,
        stripeCustomerId,
        amount: data.amount,
        status: PaymentStatus.PENDING,
        description: data.campaignId ? 'Campaign payment' : 'Subscription payment',
      },
    });

    return {
      url: session.url!,
      sessionId: session.id,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    logger.info({ type: event.type }, 'Processing Stripe webhook');

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object as Stripe.Charge);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      logger.error({ error, eventType: event.type }, 'Error handling webhook');
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: session.id },
    });

    if (!payment) {
      logger.error({ sessionId: session.id }, 'Payment not found for session');
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        paidAt: new Date(),
      },
    });

    // If payment is for a campaign, mark as paid
    if (payment.campaignId) {
      await prisma.campaign.update({
        where: { id: payment.campaignId },
        data: { isPaid: true },
      });
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.info({ paymentIntentId: paymentIntent.id }, 'Payment succeeded');
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.error({ paymentIntentId: paymentIntent.id }, 'Payment failed');
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const merchantId = subscription.metadata.merchantId;

    if (!merchantId) {
      logger.error('No merchantId in subscription metadata');
      return;
    }

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        status: this.mapSubscriptionStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      create: {
        merchantId,
        planId: subscription.metadata.planId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        status: this.mapSubscriptionStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        canceledAt: new Date(),
      },
    });
  }

  private async handleRefund(charge: Stripe.Charge): Promise<void> {
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentId: charge.payment_intent as string },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAt: new Date(),
          refundAmount: charge.amount_refunded / 100,
        },
      });
    }
  }

  private mapSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      canceled: SubscriptionStatus.CANCELLED,
      past_due: SubscriptionStatus.PAST_DUE,
      unpaid: SubscriptionStatus.UNPAID,
      trialing: SubscriptionStatus.TRIALING,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.CANCELLED;
  }
}

export const stripeService = new StripeService();
