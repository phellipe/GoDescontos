import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { AppError } from '@/utils/errors';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware to authenticate JWT tokens
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('No token provided', 401);
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('Invalid token format', 401);
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      if (decoded.type !== 'access') {
        throw new AppError('Invalid token type', 401);
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check if user has required role(s)
 */
export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      if (!roles.includes(req.user.role)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  try {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      if (decoded.type === 'access') {
        req.user = decoded;
      }
    }
  } catch (error) {
    // Ignore errors in optional auth
  }

  next();
}
