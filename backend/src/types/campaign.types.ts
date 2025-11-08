/**
 * Campaign related types
 */

import { CampaignStatus } from '@prisma/client';
import { Timestamps, Location, PaginationParams } from './common.types';

/**
 * Create campaign data transfer object
 */
export interface CreateCampaignDTO extends Location {
  merchantId: string;
  title: string;
  description: string;
  shortDescription?: string;
  priceOriginal: number;
  pricePromo: number;
  category: string;
  tags?: string[];
  startAt: Date;
  endAt: Date;
  totalQuantity: number;
  terms?: string;
  imageUrl?: string;
  images?: string[];
}

/**
 * Update campaign data transfer object
 */
export interface UpdateCampaignDTO extends Partial<CreateCampaignDTO> {
  status?: CampaignStatus;
  isFeatured?: boolean;
}

/**
 * Campaign list filter parameters
 */
export interface CampaignListFilter extends PaginationParams {
  city?: string;
  state?: string;
  category?: string;
  search?: string;
  status?: CampaignStatus;
  merchantId?: string;
  isFeatured?: boolean;
}

/**
 * Campaign response with merchant info
 */
export interface CampaignResponse extends Timestamps {
  id: string;
  merchantId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  priceOriginal: number;
  pricePromo: number;
  discountPercent: number;
  category: string;
  tags: string[];
  imageUrl?: string;
  images: string[];
  startAt: Date;
  endAt: Date;
  totalQuantity: number;
  redeemedQuantity: number;
  viewCount: number;
  favoriteCount: number;
  status: CampaignStatus;
  terms?: string;
  city: string;
  state: string;
  country: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  isPaid: boolean;
  isFeatured: boolean;
  publishedAt?: Date;
  merchant?: MerchantSummary;
}

/**
 * Merchant summary for campaign responses
 */
export interface MerchantSummary {
  id: string;
  name: string;
  city: string;
  state: string;
  logoUrl?: string;
  phone?: string;
  description?: string;
}

/**
 * Campaign statistics
 */
export interface CampaignStats {
  totalViews: number;
  totalFavorites: number;
  totalRedemptions: number;
  redemptionRate: number;
  availableCoupons: number;
  revenue: number;
}

/**
 * Toggle favorite response
 */
export interface ToggleFavoriteResponse {
  isFavorited: boolean;
}
