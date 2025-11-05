import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/AuthService';
import { AuthRequest } from '@/middlewares/auth';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, role } = req.body;

      const result = await authService.register({
        email,
        password,
        name,
        role,
      });

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      await authService.logout(refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   * POST /api/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      await authService.verifyEmail(token);

      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      await authService.requestPasswordReset(email);

      res.status(200).json({
        status: 'success',
        message: 'If the email exists, a reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;

      await authService.resetPassword(token, password);

      res.status(200).json({
        status: 'success',
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is already authenticated via middleware
      res.status(200).json({
        status: 'success',
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
