import { prisma } from '@/config/database';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateTokens, verifyRefreshToken, getTokenExpirationDate } from '@/utils/jwt';
import { AppError, UnauthorizedError, ConflictError } from '@/utils/errors';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';
import { env } from '@/config/env';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isEmailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role || UserRole.USER,
        verificationToken,
      },
    });

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
    // await emailService.sendVerificationEmail(user.email, verificationToken);

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
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await comparePassword(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    // Revoke old refresh tokens (keep only last 5)
    const oldTokens = await prisma.refreshToken.findMany({
      where: { userId: user.id, isRevoked: false },
      orderBy: { createdAt: 'desc' },
      skip: 4,
    });

    if (oldTokens.length > 0) {
      await prisma.refreshToken.updateMany({
        where: {
          id: { in: oldTokens.map((t) => t.id) },
        },
        data: { isRevoked: true },
      });
    }

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
   * Refresh access token
   */
  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
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
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });
  }
}

export const authService = new AuthService();
