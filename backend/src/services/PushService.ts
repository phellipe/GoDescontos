import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushToken } from 'expo-server-sdk';
import webpush from 'web-push';
import { env } from '@/config/env';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { Platform } from '@prisma/client';

// Initialize Expo SDK
const expo = new Expo({
  accessToken: env.EXPO_ACCESS_TOKEN,
});

// Configure VAPID for Web Push
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT) {
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class PushService {
  /**
   * Send push notification to specific user
   */
  async sendToUser(userId: string, notification: PushNotificationData): Promise<void> {
    const tokens = await prisma.pushToken.findMany({
      where: {
        userId,
        enabled: true,
      },
    });

    if (tokens.length === 0) {
      logger.info(`No push tokens found for user ${userId}`);
      return;
    }

    // Separate tokens by platform
    const expoTokens = tokens.filter(
      (t) =>
        t.platform === Platform.EXPO ||
        t.platform === Platform.IOS ||
        t.platform === Platform.ANDROID,
    );
    const webTokens = tokens.filter((t) => t.platform === Platform.WEB);

    // Send to Expo (mobile)
    if (expoTokens.length > 0) {
      await this.sendExpoPush(
        expoTokens.map((t) => t.token),
        notification,
      );
    }

    // Send web push
    if (webTokens.length > 0) {
      await this.sendWebPush(userId, notification);
    }
  }

  /**
   * Send Expo push notification
   */
  async sendExpoPush(tokens: string[], notification: PushNotificationData): Promise<void> {
    const messages: ExpoPushMessage[] = [];

    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        logger.warn(`Invalid Expo push token: ${token}`);
        continue;
      }

      messages.push({
        to: token as ExpoPushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
    }

    if (messages.length === 0) {
      return;
    }

    try {
      const chunks = expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          logger.error({ error }, 'Error sending Expo push notification chunk');
        }
      }

      // Handle tickets and remove invalid tokens
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'error') {
          logger.error({ error: ticket.message }, 'Expo push ticket error');

          // Remove invalid tokens
          if (
            ticket.details?.error === 'DeviceNotRegistered' ||
            ticket.details?.error === 'InvalidCredentials'
          ) {
            await prisma.pushToken.deleteMany({
              where: { token: tokens[i] },
            });
          }
        }
      }
    } catch (error) {
      logger.error({ error }, 'Error sending Expo push notifications');
    }
  }

  /**
   * Send Web push notification
   */
  async sendWebPush(userId: string, notification: PushNotificationData): Promise<void> {
    try {
      const subscriptions = await prisma.webPushSubscription.findMany({
        where: {
          userId,
          enabled: true,
        },
      });

      if (subscriptions.length === 0) {
        return;
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: '/icon.png',
        badge: '/badge.png',
        data: notification.data,
      });

      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys as any,
            },
            payload,
          );
        } catch (error: any) {
          logger.error({ error }, 'Error sending web push notification');

          // Remove expired subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.webPushSubscription.delete({
              where: { id: subscription.id },
            });
          }
        }
      }
    } catch (error) {
      logger.error({ error }, 'Error in sendWebPush');
    }
  }

  /**
   * Register push token
   */
  async registerToken(
    userId: string,
    token: string,
    platform: Platform,
    deviceId?: string,
  ): Promise<void> {
    await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        deviceId,
        enabled: true,
      },
      create: {
        userId,
        token,
        platform,
        deviceId,
        enabled: true,
      },
    });
  }

  /**
   * Subscribe to web push
   */
  async subscribeWebPush(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ): Promise<void> {
    await prisma.webPushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        keys: subscription.keys,
        enabled: true,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        enabled: true,
      },
    });
  }

  /**
   * Unregister token
   */
  async unregisterToken(token: string): Promise<void> {
    await prisma.pushToken.updateMany({
      where: { token },
      data: { enabled: false },
    });
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers(
    userIds: string[],
    notification: PushNotificationData,
  ): Promise<void> {
    await Promise.all(userIds.map((userId) => this.sendToUser(userId, notification)));
  }

  /**
   * Broadcast to all users in a city
   */
  async broadcastToCity(city: string, state: string, notification: PushNotificationData): Promise<void> {
    // Get all merchants in the city
    const merchants = await prisma.merchant.findMany({
      where: { city, state },
      select: { userId: true },
    });

    // Get all customers
    const customers = await prisma.customer.findMany({
      where: {
        merchantId: { in: merchants.map((m) => m.id) },
        userId: { not: null },
      },
      select: { userId: true },
    });

    const userIds = Array.from(new Set(customers.map((c) => c.userId).filter(Boolean))) as string[];

    await this.sendToMultipleUsers(userIds, notification);
  }
}

export const pushService = new PushService();
