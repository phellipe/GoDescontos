/**
 * Coupon related types
 */

import { CouponStatus } from '@prisma/client';
import { Timestamps } from './common.types';
import { CampaignResponse } from './campaign.types';

/**
 * Reserve coupon data transfer object
 */
export interface ReserveCouponDTO {
  campaignId: string;
}

/**
 * Redeem coupon data transfer object
 */
export interface RedeemCouponDTO {
  code: string;
}

/**
 * Coupon response
 */
export interface CouponResponse extends Timestamps {
  id: string;
  campaignId: string;
  code: string;
  userId?: string;
  qrCodeUrl?: string;
  status: CouponStatus;
  issuedAt: Date;
  reservedAt?: Date;
  redeemedAt?: Date;
  redeemedBy?: string;
  expiresAt: Date;
  campaign?: CampaignResponse;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * QR code data structure
 */
export interface QRCodeData {
  code: string;
  couponId: string;
  campaign: string;
  merchant: string;
  value: number;
}

/**
 * Coupon generation options
 */
export interface CouponGenerationOptions {
  campaignId: string;
  quantity: number;
  prefix?: string;
  expiresAt: Date;
}

/**
 * Bulk coupon generation result
 */
export interface BulkCouponGenerationResult {
  generated: number;
  existing: number;
  total: number;
}
