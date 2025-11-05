import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: unknown) => {
    const event = e as { query: string; duration: number };
    logger.debug({ query: event.query, duration: event.duration }, 'Prisma Query');
  });
}

prisma.$on('error' as never, (e: unknown) => {
  const event = e as { message: string };
  logger.error({ error: event.message }, 'Prisma Error');
});

prisma.$on('warn' as never, (e: unknown) => {
  const event = e as { message: string };
  logger.warn({ warning: event.message }, 'Prisma Warning');
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error({ error }, '❌ Failed to connect to database');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error({ error }, 'Failed to disconnect from database');
  }
}
