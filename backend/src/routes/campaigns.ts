import { Router } from 'express';
import { campaignController } from '@/controllers/CampaignController';
import { authenticate, optionalAuth } from '@/middlewares/auth';

const router = Router();

// Public routes (with optional auth)
router.get('/', optionalAuth, campaignController.list.bind(campaignController));
router.get('/:id', optionalAuth, campaignController.getById.bind(campaignController));

// Protected routes
router.post('/:id/favorite', authenticate, campaignController.toggleFavorite.bind(campaignController));

export default router;
