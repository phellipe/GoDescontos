import { Job } from 'bullmq';
import { logger } from '../config/logger';

export async function emailProcessor(job: Job): Promise<void> {
  const { to, subject, html, text } = job.data;

  logger.info({ to, subject }, 'Sending email');

  // TODO: Implement actual email sending with nodemailer
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html, text });

  // Simulate email sending
  await new Promise((resolve) => setTimeout(resolve, 1000));

  logger.info({ to, subject }, 'Email sent successfully');
}
