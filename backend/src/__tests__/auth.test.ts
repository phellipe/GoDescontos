import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { authService } from '../services/AuthService';
import { prisma } from '../config/database';

describe('AuthService', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { contains: 'test@' } },
    });
    await prisma.$disconnect();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPass123!@#',
        name: 'Test User',
      };

      const result = await authService.register(userData);

      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.isEmailVerified).toBe(false);
    });

    it('should not register user with duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPass123!@#',
        name: 'Test User',
      };

      await expect(authService.register(userData)).rejects.toThrow('User with this email already exists');
    });

    it('should hash password correctly', async () => {
      const email = 'test2@example.com';
      const password = 'MyPassword123!@#';

      await authService.register({
        email,
        password,
        name: 'Test User 2',
      });

      const user = await prisma.user.findUnique({ where: { email } });
      expect(user?.passwordHash).not.toBe(password);
      expect(user?.passwordHash).toHaveLength(60); // bcrypt hash length
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'StrongPass123!@#';

      const result = await authService.login({ email, password });

      expect(result.user.email).toBe(email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const email = 'test@example.com';
      const password = 'WrongPassword';

      await expect(authService.login({ email, password })).rejects.toThrow('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const email = 'nonexistent@example.com';
      const password = 'SomePassword';

      await expect(authService.login({ email, password })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const email = 'test@example.com';
      const password = 'StrongPass123!@#';

      const loginResult = await authService.login({ email, password });
      const { refreshToken } = loginResult;

      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(refreshToken); // Token rotation
    });

    it('should fail with invalid refresh token', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(authService.refreshToken(invalidToken)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should revoke refresh token', async () => {
      const email = 'test@example.com';
      const password = 'StrongPass123!@#';

      const { refreshToken } = await authService.login({ email, password });
      await authService.logout(refreshToken);

      // Try to use the revoked token
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow();
    });
  });
});
