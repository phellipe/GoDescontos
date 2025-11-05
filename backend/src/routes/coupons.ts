import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import { AuthRequest } from '@/middlewares/auth';
import { Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { CouponStatus } from '@prisma/client';

const router = Router();

// Reserve/claim a coupon
router.post(
  '/reserve',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId } = req.body;
      const userId = req.user!.userId;

      // Check if user already has a coupon for this campaign
      const existingCoupon = await prisma.coupon.findFirst({
        where: {
          campaignId,
          userId,
        },
      });

      if (existingCoupon) {
        throw new BadRequestError('You already have a coupon for this campaign');
      }

      // Find available coupon
      const availableCoupon = await prisma.coupon.findFirst({
        where: {
          campaignId,
          status: CouponStatus.AVAILABLE,
          userId: null,
        },
      });

      if (!availableCoupon) {
        throw new NotFoundError('No coupons available for this campaign');
      }

      // Reserve coupon
      const coupon = await prisma.coupon.update({
        where: { id: availableCoupon.id },
        data: {
          userId,
          status: CouponStatus.RESERVED,
          reservedAt: new Date(),
        },
        include: {
          campaign: {
            include: {
              merchant: true,
            },
          },
        },
      });

      res.status(200).json({
        status: 'success',
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get user coupons
router.get(
  '/my',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const coupons = await prisma.coupon.findMany({
        where: { userId },
        include: {
          campaign: {
            include: {
              merchant: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  state: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        status: 'success',
        data: coupons,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Validate/redeem coupon (merchant only)
router.post(
  '/:code/redeem',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params;

      const coupon = await prisma.coupon.findUnique({
        where: { code },
        include: {
          campaign: {
            include: {
              merchant: true,
            },
          },
        },
      });

      if (!coupon) {
        throw new NotFoundError('Coupon not found');
      }

      if (coupon.status === CouponStatus.REDEEMED) {
        throw new BadRequestError('Coupon already redeemed');
      }

      if (coupon.expiresAt < new Date()) {
        throw new BadRequestError('Coupon expired');
      }

      // Update coupon status
      const updated = await prisma.coupon.update({
        where: { id: coupon.id },
        data: {
          status: CouponStatus.REDEEMED,
          redeemedAt: new Date(),
          redeemedBy: req.user!.userId,
        },
      });

      // Update campaign redeemed count
      await prisma.campaign.update({
        where: { id: coupon.campaignId },
        data: {
          redeemedQuantity: { increment: 1 },
        },
      });

      res.status(200).json({
        status: 'success',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
