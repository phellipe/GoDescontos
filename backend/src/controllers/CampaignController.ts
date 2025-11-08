import { Response, NextFunction } from 'express';
import { campaignService } from '@/services/CampaignService';
import { AuthenticatedRequest, CampaignListFilter } from '@/types';
import { BaseController } from './BaseController';

/**
 * Campaign Controller
 *
 * Handles public campaign-related endpoints including:
 * - List campaigns with filters
 * - Get campaign details
 * - Toggle favorite campaigns
 */
export class CampaignController extends BaseController {
  /**
   * List campaigns with filters and pagination
   * GET /api/campaigns
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      async () => {
        const filters: CampaignListFilter = {
          city: req.query.city as string,
          state: req.query.state as string,
          category: req.query.category as string,
          search: req.query.search as string,
          status: req.query.status as any,
          merchantId: req.query.merchantId as string,
          isFeatured: req.query.isFeatured === 'true',
          page: req.query.page ? parseInt(req.query.page as string) : undefined,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        };

        const result = await campaignService.list(filters);

        this.paginated(res, result.campaigns, result.pagination);
      },
      req,
      res,
      next,
    );
  }

  /**
   * Get campaign by ID or slug
   * GET /api/campaigns/:id
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    await this.execute(
      async () => {
        const { id } = req.params;
        const incrementView = req.query.incrementView === 'true';

        const campaign = await campaignService.getById(id, incrementView);

        this.success(res, campaign);
      },
      req,
      res,
      next,
    );
  }

  /**
   * Toggle favorite campaign
   * POST /api/campaigns/:id/favorite
   */
  async toggleFavorite(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    await this.execute(
      async () => {
        const { id } = req.params;
        const userId = this.getUserId(req);

        const result = await campaignService.toggleFavorite(id, userId);

        this.success(res, result);
        this.logAction(req, 'toggle_favorite', { campaignId: id });
      },
      req,
      res,
      next,
    );
  }
}

export const campaignController = new CampaignController();
