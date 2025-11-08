import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/AuthService';
import { AuthenticatedRequest } from '@/types';
import { BaseController } from './BaseController';
import {
  RegisterDTO,
  LoginDTO,
  RefreshTokenDTO,
  VerifyEmailDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from '@/types';

/**
 * Authentication Controller
 *
 * Handles all authentication-related endpoints including:
 * - User registration
 * - Login/logout
 * - Token refresh
 * - Email verification
 * - Password reset
 */
export class AuthController extends BaseController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      async () => {
        const dto: RegisterDTO = req.body;
        const result = await authService.register(dto);
        this.created(res, result);
      },
      req as AuthenticatedRequest,
      res,
      next,
    );
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      async () => {
        const dto: LoginDTO = req.body;
        const result = await authService.login(dto);
        this.success(res, result);
        this.logAction(req as AuthenticatedRequest, 'login', { email: dto.email });
      },
      req as AuthenticatedRequest,
      res,
      next,
    );
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      async () => {
        const dto: RefreshTokenDTO = req.body;
        const result = await authService.refreshToken(dto.refreshToken);
        this.success(res, result);
      },
      req as AuthenticatedRequest,
      res,
      next,
    );
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      async () => {
        const dto: RefreshTokenDTO = req.body;
        await authService.logout(dto.refreshToken);
        this.message(res, 'Logout realizado com sucesso');
      },
      req as AuthenticatedRequest,
      res,
      next,
    );
  }

  /**
   * Verify email
   * POST /api/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      async () => {
        const dto: VerifyEmailDTO = req.body;
        await authService.verifyEmail(dto.token);
        this.message(res, 'Email verificado com sucesso');
      },
      req as AuthenticatedRequest,
      res,
      next,
    );
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      async () => {
        const dto: ForgotPasswordDTO = req.body;
        await authService.requestPasswordReset(dto.email);
        this.message(res, 'Se o email existir, um link de recuperação foi enviado');
      },
      req as AuthenticatedRequest,
      res,
      next,
    );
  }

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      async () => {
        const dto: ResetPasswordDTO = req.body;
        await authService.resetPassword(dto.token, dto.password);
        this.message(res, 'Senha redefinida com sucesso');
      },
      req as AuthenticatedRequest,
      res,
      next,
    );
  }

  /**
   * Get current authenticated user
   * GET /api/auth/me
   */
  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      async () => {
        const user = this.getAuthUser(req);
        this.success(res, user);
      },
      req,
      res,
      next,
    );
  }
}

export const authController = new AuthController();
