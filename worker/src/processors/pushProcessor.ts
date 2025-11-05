import { Job } from 'bullmq';
import { logger } from '../config/logger';

export async function pushProcessor(job: Job): Promise<void> {
  const { userId, title, body, data } = job.data;

  logger.info({ userId, title }, 'Sending push notification');

  // TODO: Implement actual push sending using PushService
  // const pushService = new PushService();
  // await pushService.sendToUser(userId, { title, body, data });

  // Simulate push sending
  await new Promise((resolve) => setTimeout(resolve, 500));

  logger.info({ userId }, 'Push notification sent successfully');
}
