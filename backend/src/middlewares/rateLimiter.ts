import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';

/**
 * General rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: Number(env.RATE_LIMIT_WINDOW_MS), // 15 minutes default
  max: Number(env.RATE_LIMIT_MAX_REQUESTS), // 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.',
    });
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for payment endpoints
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  message: {
    status: 'error',
    message: 'Too many payment attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes
  message: {
    status: 'error',
    message: 'Too many file uploads, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
