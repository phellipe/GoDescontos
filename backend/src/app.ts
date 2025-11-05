import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { env } from '@/config/env';
import { Sentry } from '@/config/sentry';
import { generalLimiter } from '@/middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';
import { logger } from '@/config/logger';

// Import routes
import authRoutes from '@/routes/auth';
import campaignRoutes from '@/routes/campaigns';
import merchantRoutes from '@/routes/merchant';
import paymentRoutes from '@/routes/payment';
import couponRoutes from '@/routes/coupons';
import pushRoutes from '@/routes/push';
import analyticsRoutes from '@/routes/analytics';
import healthRoutes from '@/routes/health';
import uploadRoutes from '@/routes/uploads';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS configuration
  const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (corsOrigins.indexOf(origin) !== -1 || corsOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: env.CORS_CREDENTIALS === 'true',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    }),
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Sentry request handler (must be before routes)
  if (env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  }

  // Rate limiting
  app.use(generalLimiter);

  // Request logging
  app.use((req, res, next) => {
    logger.info(
      {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
      'Incoming request',
    );
    next();
  });

  // API Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/merchant', merchantRoutes);
  app.use('/api/merchant/analytics', analyticsRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/push', pushRoutes);
  app.use('/api/uploads', uploadRoutes);

  // API Documentation
  if (env.NODE_ENV === 'development') {
    const swaggerDocument = {
      openapi: '3.0.0',
      info: {
        title: 'GoDescontos API',
        version: '1.0.0',
        description: 'API documentation for GoDescontos platform',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}/api`,
          description: 'Development server',
        },
      ],
    };

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  // Sentry error handler (must be before other error handlers)
  if (env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
