/**
 * Payment related types
 */

import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { Timestamps } from './common.types';

/**
 * Create checkout session data transfer object
 */
export interface CreateCheckoutSessionDTO {
  merchantId: string;
  campaignId?: string;
  planId?: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Checkout session response
 */
export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

/**
 * Payment response
 */
export interface PaymentResponse extends Timestamps {
  id: string;
  merchantId: string;
  campaignId?: string;
  subscriptionId?: string;
  stripePaymentId: string;
  stripeCustomerId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  description?: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
}

/**
 * Subscription response
 */
export interface SubscriptionResponse extends Timestamps {
  id: string;
  merchantId: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  plan?: PlanResponse;
}

/**
 * Plan response
 */
export interface PlanResponse extends Timestamps {
  id: string;
  name: string;
  description?: string;
  stripePriceId: string;
  stripeProductId: string;
  price: number;
  currency: string;
  interval: string;
  features: Record<string, unknown>;
  maxCampaigns: number;
  isActive: boolean;
}

/**
 * Webhook event data
 */
export interface WebhookEventData {
  type: string;
  data: unknown;
}

/**
 * Refund request
 */
export interface RefundRequestDTO {
  paymentId: string;
  amount?: number;
  reason?: string;
}
