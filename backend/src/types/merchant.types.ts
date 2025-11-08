/**
 * Merchant related types
 */

import { Timestamps, Location } from './common.types';

/**
 * Create merchant data transfer object
 */
export interface CreateMerchantDTO extends Location {
  userId: string;
  name: string;
  cnpj?: string;
  phone?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
}

/**
 * Update merchant data transfer object
 */
export interface UpdateMerchantDTO extends Partial<CreateMerchantDTO> {
  isApproved?: boolean;
}

/**
 * Merchant response
 */
export interface MerchantResponse extends Timestamps, Location {
  id: string;
  userId: string;
  name: string;
  cnpj?: string;
  phone?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isApproved: boolean;
  approvedAt?: Date;
}

/**
 * Merchant with user info
 */
export interface MerchantWithUser extends MerchantResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Customer data transfer object
 */
export interface CreateCustomerDTO {
  merchantId: string;
  userId?: string;
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Customer response
 */
export interface CustomerResponse extends Timestamps {
  id: string;
  merchantId: string;
  userId?: string;
  email: string;
  name: string;
  phone?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}
