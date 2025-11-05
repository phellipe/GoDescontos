import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth';
import { UserRole } from '@prisma/client';
import { analyticsController } from '@/controllers/AnalyticsController';

const router = Router();

// All routes require merchant or admin role
router.use(authenticate);
router.use(authorize(UserRole.MERCHANT, UserRole.ADMIN));

// Dashboard stats
router.get('/dashboard', analyticsController.getDashboard.bind(analyticsController));

// Campaign stats
router.get('/campaign/:id', analyticsController.getCampaignStats.bind(analyticsController));

// Coupon history
router.get('/campaign/:id/coupons', analyticsController.getCouponHistory.bind(analyticsController));

// Revenue by period
router.get('/revenue', analyticsController.getRevenue.bind(analyticsController));

export default router;
