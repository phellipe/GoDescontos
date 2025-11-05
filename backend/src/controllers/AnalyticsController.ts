import { Response, NextFunction } from 'express';
import { analyticsService } from '@/services/AnalyticsService';
import { AuthRequest } from '@/middlewares/auth';

export class AnalyticsController {
  /**
   * Get merchant dashboard stats
   * GET /api/merchant/analytics/dashboard
   */
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { merchantId } = req.query;

      if (!merchantId) {
        res.status(400).json({
          status: 'error',
          message: 'merchantId is required',
        });
        return;
      }

      const stats = await analyticsService.getMerchantDashboard(
        merchantId as string,
        req.user!.userId,
        req.user!.role,
      );

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign stats
   * GET /api/merchant/analytics/campaign/:id
   */
  async getCampaignStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const stats = await analyticsService.getCampaignStats(id);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get coupon history
   * GET /api/merchant/analytics/campaign/:id/coupons
   */
  async getCouponHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { merchantId } = req.query;

      const history = await analyticsService.getCouponHistory(
        id,
        merchantId as string,
        req.user!.userId,
        req.user!.role,
      );

      res.status(200).json({
        status: 'success',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get revenue by period
   * GET /api/merchant/analytics/revenue
   */
  async getRevenue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { merchantId, startDate, endDate } = req.query;

      if (!merchantId || !startDate || !endDate) {
        res.status(400).json({
          status: 'error',
          message: 'merchantId, startDate, and endDate are required',
        });
        return;
      }

      const revenue = await analyticsService.getRevenueByPeriod(
        merchantId as string,
        req.user!.userId,
        req.user!.role,
        new Date(startDate as string),
        new Date(endDate as string),
      );

      res.status(200).json({
        status: 'success',
        data: revenue,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
