import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '@/middlewares/auth';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access and refresh token pair
 */
export function generateTokens(userId: string, email: string, role: UserRole): TokenPair {
  const accessToken = jwt.sign(
    {
      userId,
      email,
      role,
      type: 'access',
    } as JwtPayload,
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  );

  const refreshToken = jwt.sign(
    {
      userId,
      email,
      role,
      type: 'refresh',
    } as JwtPayload,
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
  );

  return { accessToken, refreshToken };
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}

/**
 * Calculate token expiration date
 */
export function getTokenExpirationDate(expiresIn: string): Date {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid expiration format');
  }

  const [, value, unit] = match;
  const duration = parseInt(value, 10);

  const now = new Date();
  switch (unit) {
    case 's':
      return new Date(now.getTime() + duration * 1000);
    case 'm':
      return new Date(now.getTime() + duration * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + duration * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
    default:
      throw new Error('Invalid time unit');
  }
}
