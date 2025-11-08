/**
 * Application-wide constants
 *
 * Centralizes all magic numbers, default values, and configuration constants
 * to improve maintainability and avoid hardcoded values scattered in the codebase.
 */

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
} as const;

/**
 * Token expiration times (in milliseconds)
 */
export const TOKEN_EXPIRY = {
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  PAYMENT: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 10,
  },
  UPLOAD: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 20,
  },
} as const;

/**
 * Bcrypt hashing rounds
 */
export const BCRYPT_ROUNDS = {
  DEVELOPMENT: 10,
  PRODUCTION: 12,
} as const;

/**
 * File upload limits
 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

/**
 * QR Code generation settings
 */
export const QR_CODE = {
  WIDTH: 400,
  MARGIN: 2,
  COLORS: {
    DARK: '#000000',
    LIGHT: '#FFFFFF',
  },
} as const;

/**
 * Coupon code generation
 */
export const COUPON = {
  PREFIX_MAX_LENGTH: 10,
  CAMPAIGN_ID_LENGTH: 8,
  SEQUENCE_PADDING: 3,
} as const;

/**
 * Refresh token management
 */
export const REFRESH_TOKEN = {
  MAX_ACTIVE_TOKENS: 5, // Keep only last 5 tokens per user
} as const;

/**
 * Campaign defaults
 */
export const CAMPAIGN = {
  DEFAULT_COUNTRY: 'BR',
} as const;

/**
 * HTTP Status Codes (for reference)
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
