/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error constructors
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors?: unknown) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error', errors?: unknown) {
    super(message, 422, errors);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}
