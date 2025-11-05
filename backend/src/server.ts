import { createApp } from './app';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { disconnectRedis } from '@/config/redis';
import { initSentry } from '@/config/sentry';

async function startServer(): Promise<void> {
  try {
    // Initialize Sentry
    initSentry();

    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(Number(env.PORT), env.HOST, () => {
      logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
      logger.info(`📚 Environment: ${env.NODE_ENV}`);
      logger.info(`📚 API Docs: http://${env.HOST}:${env.PORT}/api-docs (dev only)`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          await disconnectRedis();
          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error({ error }, '❌ Error during shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, '💥 Uncaught Exception');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.fatal({ reason }, '💥 Unhandled Rejection');
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ error }, '❌ Failed to start server');
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.fatal({ error }, '💥 Fatal error during startup');
  process.exit(1);
});
