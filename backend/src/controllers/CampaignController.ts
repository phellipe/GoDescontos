import { Response, NextFunction } from 'express';
import { campaignService } from '@/services/CampaignService';
import { AuthRequest } from '@/middlewares/auth';

export class CampaignController {
  /**
   * List campaigns
   * GET /api/campaigns
   */
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { city, state, category, search, status, merchantId, isFeatured, page, limit } = req.query;

      const result = await campaignService.list({
        city: city as string,
        state: state as string,
        category: category as string,
        search: search as string,
        status: status as any,
        merchantId: merchantId as string,
        isFeatured: isFeatured === 'true',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: result.campaigns,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign by ID
   * GET /api/campaigns/:id
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const incrementView = req.query.incrementView === 'true';

      const campaign = await campaignService.getById(id, incrementView);

      res.status(200).json({
        status: 'success',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle favorite
   * POST /api/campaigns/:id/favorite
   */
  async toggleFavorite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Unauthorized');
      }

      const { id } = req.params;

      const result = await campaignService.toggleFavorite(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const campaignController = new CampaignController();
