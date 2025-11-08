/**
 * Authentication related types
 */

import { UserRole } from '@prisma/client';

/**
 * User registration data transfer object
 */
export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/**
 * User login data transfer object
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Auth response with tokens
 */
export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

/**
 * User data in responses (without sensitive fields)
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt?: Date;
  lastLoginAt?: Date;
}

/**
 * Token refresh request
 */
export interface RefreshTokenDTO {
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Email verification request
 */
export interface VerifyEmailDTO {
  token: string;
}

/**
 * Password reset request
 */
export interface ForgotPasswordDTO {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface ResetPasswordDTO {
  token: string;
  password: string;
}

/**
 * JWT token payload structure
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
