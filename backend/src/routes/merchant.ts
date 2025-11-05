import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import { z } from 'zod';
import { AuthRequest } from '@/middlewares/auth';
import { Response, NextFunction } from 'express';
import { campaignService } from '@/services/CampaignService';
import { UserRole } from '@prisma/client';

const router = Router();

// All merchant routes require authentication
router.use(authenticate);

const createCampaignSchema = z.object({
  body: z.object({
    merchantId: z.string().uuid(),
    title: z.string().min(5),
    description: z.string().min(20),
    shortDescription: z.string().optional(),
    priceOriginal: z.number().positive(),
    pricePromo: z.number().positive(),
    category: z.string(),
    tags: z.array(z.string()).optional(),
    city: z.string(),
    state: z.string(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    totalQuantity: z.number().int().positive(),
    terms: z.string().optional(),
    imageUrl: z.string().url().optional(),
    images: z.array(z.string().url()).optional(),
  }),
});

// Create campaign
router.post(
  '/campaigns',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(createCampaignSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaign = await campaignService.create(
        {
          ...req.body,
          startAt: new Date(req.body.startAt),
          endAt: new Date(req.body.endAt),
        },
        req.user!.userId,
        req.user!.role,
      );

      res.status(201).json({
        status: 'success',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Update campaign
router.patch(
  '/campaigns/:id',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaign = await campaignService.update(
        req.params.id,
        req.body,
        req.user!.userId,
        req.user!.role,
      );

      res.status(200).json({
        status: 'success',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Publish campaign
router.post(
  '/campaigns/:id/publish',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaign = await campaignService.publish(
        req.params.id,
        req.user!.userId,
        req.user!.role,
      );

      res.status(200).json({
        status: 'success',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Delete campaign
router.delete(
  '/campaigns/:id',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await campaignService.delete(req.params.id, req.user!.userId, req.user!.role);

      res.status(200).json({
        status: 'success',
        message: 'Campaign deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get merchant campaigns
router.get(
  '/campaigns',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Get merchant ID for current user
      const { merchantId } = req.query;

      const result = await campaignService.list({
        merchantId: merchantId as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: result.campaigns,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
