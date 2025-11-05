import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '@/utils/errors';
import { logger } from '@/config/logger';
import { Sentry } from '@/config/sentry';
import { env } from '@/config/env';

interface ErrorResponse {
  status: string;
  message: string;
  errors?: unknown;
  stack?: string;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  logger.error(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: {
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        ip: req.ip,
      },
    },
    'Error occurred',
  );

  // Report to Sentry in production
  if (env.NODE_ENV === 'production' && !(error instanceof AppError && error.statusCode < 500)) {
    Sentry.captureException(error);
  }

  // Handle AppError
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      status: 'error',
      message: error.message,
    };

    if (error.errors) {
      response.errors = error.errors;
    }

    if (env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
    return;
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        res.status(409).json({
          status: 'error',
          message: 'Duplicate entry',
          errors: {
            fields: error.meta?.target,
          },
        });
        return;

      case 'P2025':
        res.status(404).json({
          status: 'error',
          message: 'Record not found',
        });
        return;

      case 'P2003':
        res.status(400).json({
          status: 'error',
          message: 'Foreign key constraint failed',
        });
        return;

      default:
        logger.error({ prismaError: error }, 'Prisma error');
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      status: 'error',
      message: 'Database validation error',
    });
    return;
  }

  // Handle multer file upload errors
  if (error.name === 'MulterError') {
    res.status(400).json({
      status: 'error',
      message: 'File upload error',
      errors: { message: error.message },
    });
    return;
  }

  // Default error response
  const response: ErrorResponse = {
    status: 'error',
    message: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  };

  if (env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(500).json(response);
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.url} not found`,
  });
}
