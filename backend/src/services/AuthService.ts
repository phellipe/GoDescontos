import { prisma } from '@/config/database';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateTokens, verifyRefreshToken, getTokenExpirationDate } from '@/utils/jwt';
import { AppError, UnauthorizedError, ConflictError } from '@/utils/errors';
import { env } from '@/config/env';
import { REFRESH_TOKEN, TOKEN_EXPIRY } from '@/config/constants';
import { logger } from '@/config/logger';
import crypto from 'crypto';
import {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  RefreshTokenResponse,
  UserResponse,
} from '@/types/auth.types';

/**
 * Authentication Service
 *
 * Handles all authentication-related business logic including:
 * - User registration with email verification
 * - Login with credential validation
 * - Refresh token rotation for security
 * - Password reset flow
 * - Email verification
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(dto: RegisterDTO): Promise<AuthResponse> {
    logger.info({ email: dto.email }, 'User registration attempt');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      logger.warn({ email: dto.email }, 'Registration failed: email already exists');
      throw new ConflictError('Usuário com este email já existe');
    }

    // Hash password
    const passwordHash = await hashPassword(dto.password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: dto.role,
        verificationToken,
      },
    });

    logger.info({ userId: user.id, role: user.role }, 'User registered successfully');

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: getTokenExpirationDate(env.JWT_REFRESH_EXPIRES_IN),
      },
    });

    // TODO: Send verification email
    // await emailQueue.add('send-email', {
    //   to: user.email,
    //   subject: 'Verificação de Email',
    //   template: 'verify-email',
    //   data: { token: verificationToken }
    // });

    return this.buildAuthResponse(user, accessToken, refreshToken);
  }

  /**
   * Login user with credentials
   */
  async login(dto: LoginDTO): Promise<AuthResponse> {
    logger.info({ email: dto.email }, 'User login attempt');

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      logger.warn({ email: dto.email }, 'Login failed: user not found');
      throw new UnauthorizedError('Credenciais inválidas');
    }

    // Verify password
    const isValidPassword = await comparePassword(dto.password, user.passwordHash);

    if (!isValidPassword) {
      logger.warn({ userId: user.id }, 'Login failed: invalid password');
      throw new UnauthorizedError('Credenciais inválidas');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    // Revoke old refresh tokens (keep only last N)
    await this.revokeOldRefreshTokens(user.id);

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: getTokenExpirationDate(env.JWT_REFRESH_EXPIRES_IN),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info({ userId: user.id }, 'User logged in successfully');

    return this.buildAuthResponse(user, accessToken, refreshToken);
  }

  /**
   * Refresh access token with token rotation
   */
  async refreshToken(token: string): Promise<RefreshTokenResponse> {
    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if token exists and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Revoke old token (refresh token rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.email,
      user.role,
    );

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: getTokenExpirationDate(env.JWT_REFRESH_EXPIRES_IN),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new AppError('Invalid verification token', 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        verificationToken: null,
      },
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    // TODO: Send reset email
    // await emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Revoke all refresh tokens
    await this.revokeAllRefreshTokens(user.id);

    logger.info({ userId: user.id }, 'Password reset successfully');
  }

  /**
   * Build auth response with user data and tokens
   */
  private buildAuthResponse(user: any, accessToken: string, refreshToken: string): AuthResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Revoke old refresh tokens (keep only last N)
   */
  private async revokeOldRefreshTokens(userId: string): Promise<void> {
    const oldTokens = await prisma.refreshToken.findMany({
      where: { userId, isRevoked: false },
      orderBy: { createdAt: 'desc' },
      skip: REFRESH_TOKEN.MAX_ACTIVE_TOKENS - 1,
    });

    if (oldTokens.length > 0) {
      await prisma.refreshToken.updateMany({
        where: {
          id: { in: oldTokens.map((t) => t.id) },
        },
        data: { isRevoked: true },
      });
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  private async revokeAllRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}

export const authService = new AuthService();
