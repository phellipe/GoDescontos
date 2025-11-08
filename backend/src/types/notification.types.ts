/**
 * Notification related types
 */

import { NotificationType, Platform } from '@prisma/client';
import { Timestamps } from './common.types';

/**
 * Push token registration data transfer object
 */
export interface RegisterPushTokenDTO {
  token: string;
  platform: Platform;
  deviceId?: string;
}

/**
 * Web push subscription data transfer object
 */
export interface WebPushSubscriptionDTO {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Send push notification data transfer object
 */
export interface SendPushNotificationDTO {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  type?: NotificationType;
}

/**
 * Send bulk notification data transfer object
 */
export interface SendBulkNotificationDTO {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  type?: NotificationType;
}

/**
 * Notification response
 */
export interface NotificationResponse extends Timestamps {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  sentAt?: Date;
}

/**
 * Push token response
 */
export interface PushTokenResponse extends Timestamps {
  id: string;
  userId: string;
  token: string;
  platform: Platform;
  deviceId?: string;
  enabled: boolean;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  newCampaigns: boolean;
  campaignExpiring: boolean;
  couponRedeemed: boolean;
  paymentConfirmed: boolean;
  merchantApproved: boolean;
  general: boolean;
}
