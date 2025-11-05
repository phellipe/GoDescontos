import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import { AuthRequest } from '@/middlewares/auth';
import { Response, NextFunction } from 'express';
import { couponService } from '@/services/CouponService';

const router = Router();

// Reserve/claim a coupon
router.post(
  '/reserve',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId } = req.body;
      const userId = req.user!.userId;

      const coupon = await couponService.reserveCoupon(campaignId, userId);

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

      const coupons = await couponService.getUserCoupons(userId);

      res.status(200).json({
        status: 'success',
        data: coupons,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get coupon with QR code
router.get(
  '/:id/qr',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const coupon = await couponService.getCouponWithQR(id, userId);

      res.status(200).json({
        status: 'success',
        data: coupon,
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

      const coupon = await couponService.redeemCoupon(code, req.user!.userId);

      res.status(200).json({
        status: 'success',
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
