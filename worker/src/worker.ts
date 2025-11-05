import { Worker, Job } from 'bullmq';
import { redis } from './config/redis';
import { logger } from './config/logger';
import { emailProcessor } from './processors/emailProcessor';
import { pushProcessor } from './processors/pushProcessor';
import { reportProcessor } from './processors/reportProcessor';

const CONCURRENCY = 5;

// Email worker
const emailWorker = new Worker(
  'email',
  async (job: Job) => {
    logger.info({ jobId: job.id, type: job.name }, 'Processing email job');
    await emailProcessor(job);
  },
  {
    connection: redis,
    concurrency: CONCURRENCY,
  },
);

// Push notification worker
const pushWorker = new Worker(
  'push',
  async (job: Job) => {
    logger.info({ jobId: job.id, type: job.name }, 'Processing push job');
    await pushProcessor(job);
  },
  {
    connection: redis,
    concurrency: CONCURRENCY,
  },
);

// Report worker
const reportWorker = new Worker(
  'report',
  async (job: Job) => {
    logger.info({ jobId: job.id, type: job.name }, 'Processing report job');
    await reportProcessor(job);
  },
  {
    connection: redis,
    concurrency: CONCURRENCY,
  },
);

// Event handlers
[emailWorker, pushWorker, reportWorker].forEach((worker) => {
  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: worker.name }, '✅ Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, queue: worker.name, error: err.message },
      '❌ Job failed',
    );
  });

  worker.on('error', (err) => {
    logger.error({ queue: worker.name, error: err.message }, '💥 Worker error');
  });
});

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  logger.info('Shutting down workers...');

  await Promise.all([emailWorker.close(), pushWorker.close(), reportWorker.close()]);

  await redis.quit();

  logger.info('✅ Workers shut down gracefully');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

logger.info('🚀 Workers started successfully');
