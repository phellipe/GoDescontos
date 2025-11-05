import { prisma } from '@/config/database';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { CampaignStatus, CouponStatus } from '@prisma/client';
import QRCode from 'qrcode';
import crypto from 'crypto';

export class CouponService {
  /**
   * Generate coupons for a campaign
   */
  async generateCoupons(campaignId: string, quantity: number): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    // Check if coupons already exist
    const existingCount = await prisma.coupon.count({
      where: { campaignId },
    });

    if (existingCount >= quantity) {
      return; // Already generated
    }

    const couponsToGenerate = quantity - existingCount;
    const coupons = [];

    for (let i = 0; i < couponsToGenerate; i++) {
      const code = this.generateCouponCode(campaign.title, campaign.id, existingCount + i + 1);

      coupons.push({
        campaignId,
        code,
        expiresAt: campaign.endAt,
        status: CouponStatus.AVAILABLE,
      });
    }

    // Bulk create coupons
    await prisma.coupon.createMany({
      data: coupons,
    });
  }

  /**
   * Generate unique coupon code
   */
  private generateCouponCode(title: string, campaignId: string, sequence: number): string {
    // Extract first word and convert to uppercase
    const prefix = title.split(' ')[0].toUpperCase().substring(0, 10);

    // Use first 8 chars of campaign ID
    const campaignCode = campaignId.substring(0, 8).toUpperCase();

    // Sequence with padding
    const seqCode = String(sequence).padStart(3, '0');

    return `${prefix}-${campaignCode}-${seqCode}`;
  }

  /**
   * Generate QR code for a coupon
   */
  async generateQRCode(couponId: string): Promise<string> {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        campaign: {
          select: {
            title: true,
            pricePromo: true,
            merchant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    // Create QR code data (JSON with coupon info)
    const qrData = JSON.stringify({
      code: coupon.code,
      couponId: coupon.id,
      campaign: coupon.campaign.title,
      merchant: coupon.campaign.merchant.name,
      value: Number(coupon.campaign.pricePromo),
    });

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Update coupon with QR code URL
    await prisma.coupon.update({
      where: { id: couponId },
      data: { qrCodeUrl: qrCodeDataURL },
    });

    return qrCodeDataURL;
  }

  /**
   * Get coupon with QR code
   */
  async getCouponWithQR(couponId: string, userId?: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    // Check ownership
    if (userId && coupon.userId !== userId) {
      throw new BadRequestError('This coupon does not belong to you');
    }

    // Generate QR code if not exists
    if (!coupon.qrCodeUrl) {
      coupon.qrCodeUrl = await this.generateQRCode(couponId);
    }

    return coupon;
  }

  /**
   * Reserve a coupon for a user
   */
  async reserveCoupon(campaignId: string, userId: string) {
    // Check if user already has a coupon for this campaign
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        campaignId,
        userId,
      },
    });

    if (existingCoupon) {
      // Return existing coupon
      return this.getCouponWithQR(existingCoupon.id, userId);
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
      throw new BadRequestError('No coupons available for this campaign');
    }

    // Reserve coupon
    const updated = await prisma.coupon.update({
      where: { id: availableCoupon.id },
      data: {
        userId,
        status: CouponStatus.RESERVED,
        reservedAt: new Date(),
      },
    });

    // Generate QR code
    await this.generateQRCode(updated.id);

    return this.getCouponWithQR(updated.id, userId);
  }

  /**
   * Validate and redeem a coupon
   */
  async redeemCoupon(code: string, merchantUserId: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { code },
      include: {
        campaign: {
          include: {
            merchant: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    if (coupon.status === CouponStatus.REDEEMED) {
      throw new BadRequestError('This coupon has already been redeemed');
    }

    if (coupon.status === CouponStatus.EXPIRED) {
      throw new BadRequestError('This coupon has expired');
    }

    if (coupon.expiresAt < new Date()) {
      // Mark as expired
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { status: CouponStatus.EXPIRED },
      });
      throw new BadRequestError('This coupon has expired');
    }

    // Redeem coupon
    const redeemed = await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        status: CouponStatus.REDEEMED,
        redeemedAt: new Date(),
        redeemedBy: merchantUserId,
      },
      include: {
        campaign: {
          include: {
            merchant: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update campaign redeemed count
    await prisma.campaign.update({
      where: { id: coupon.campaignId },
      data: {
        redeemedQuantity: { increment: 1 },
      },
    });

    // TODO: Send notification to user
    // await notificationService.sendCouponRedeemed(coupon.userId, coupon.campaign);

    return redeemed;
  }

  /**
   * Get user's coupons
   */
  async getUserCoupons(userId: string) {
    return prisma.coupon.findMany({
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
  }
}

export const couponService = new CouponService();
