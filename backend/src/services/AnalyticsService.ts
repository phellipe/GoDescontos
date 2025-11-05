import { prisma } from '@/config/database';
import { NotFoundError, ForbiddenError } from '@/utils/errors';
import { UserRole, CampaignStatus } from '@prisma/client';

interface CampaignStats {
  campaignId: string;
  title: string;
  totalViews: number;
  totalCoupons: number;
  reservedCoupons: number;
  redeemedCoupons: number;
  availableCoupons: number;
  conversionRate: number;
  redemptionRate: number;
  revenue: number;
  favorites: number;
}

interface MerchantDashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRevenue: number;
  totalCouponsRedeemed: number;
  totalViews: number;
  averageConversionRate: number;
  recentCampaigns: CampaignStats[];
}

export class AnalyticsService {
  /**
   * Get merchant dashboard stats
   */
  async getMerchantDashboard(merchantId: string, userId: string, userRole: UserRole): Promise<MerchantDashboardStats> {
    // Verify ownership
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    if (merchant.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Access denied');
    }

    // Get all campaigns
    const campaigns = await prisma.campaign.findMany({
      where: { merchantId },
      include: {
        _count: {
          select: {
            coupons: true,
            favorites: true,
          },
        },
        coupons: {
          select: {
            status: true,
          },
        },
      },
    });

    // Calculate totals
    let totalRevenue = 0;
    let totalCouponsRedeemed = 0;
    let totalViews = 0;
    let totalReserved = 0;
    let totalCoupons = 0;

    campaigns.forEach((campaign) => {
      totalViews += campaign.viewCount;
      const redeemed = campaign.coupons.filter((c) => c.status === 'REDEEMED').length;
      const reserved = campaign.coupons.filter((c) => c.status === 'RESERVED').length;

      totalCouponsRedeemed += redeemed;
      totalReserved += reserved;
      totalCoupons += campaign.coupons.length;

      // Calculate revenue (price per coupon * redeemed)
      totalRevenue += Number(campaign.pricePromo) * redeemed;
    });

    // Get recent campaigns with stats
    const recentCampaigns = await Promise.all(
      campaigns.slice(0, 5).map(async (campaign) => {
        return this.getCampaignStats(campaign.id);
      })
    );

    const averageConversionRate = totalViews > 0
      ? ((totalReserved + totalCouponsRedeemed) / totalViews) * 100
      : 0;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === CampaignStatus.PUBLISHED).length,
      totalRevenue,
      totalCouponsRedeemed,
      totalViews,
      averageConversionRate: Math.round(averageConversionRate * 100) / 100,
      recentCampaigns,
    };
  }

  /**
   * Get detailed campaign stats
   */
  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: {
            favorites: true,
          },
        },
        coupons: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const totalCoupons = campaign.coupons.length;
    const reservedCoupons = campaign.coupons.filter((c) => c.status === 'RESERVED').length;
    const redeemedCoupons = campaign.coupons.filter((c) => c.status === 'REDEEMED').length;
    const availableCoupons = campaign.coupons.filter((c) => c.status === 'AVAILABLE').length;

    const conversionRate = campaign.viewCount > 0
      ? ((reservedCoupons + redeemedCoupons) / campaign.viewCount) * 100
      : 0;

    const redemptionRate = totalCoupons > 0
      ? (redeemedCoupons / totalCoupons) * 100
      : 0;

    const revenue = Number(campaign.pricePromo) * redeemedCoupons;

    return {
      campaignId: campaign.id,
      title: campaign.title,
      totalViews: campaign.viewCount,
      totalCoupons,
      reservedCoupons,
      redeemedCoupons,
      availableCoupons,
      conversionRate: Math.round(conversionRate * 100) / 100,
      redemptionRate: Math.round(redemptionRate * 100) / 100,
      revenue,
      favorites: campaign._count.favorites,
    };
  }

  /**
   * Get coupon validation history for a campaign
   */
  async getCouponHistory(campaignId: string, merchantId: string, userId: string, userRole: UserRole) {
    // Verify ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { merchant: true },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.merchant.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Access denied');
    }

    const coupons = await prisma.coupon.findMany({
      where: {
        campaignId,
        status: { in: ['RESERVED', 'REDEEMED'] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { redeemedAt: 'desc' },
    });

    return coupons;
  }

  /**
   * Get merchant revenue by period
   */
  async getRevenueByPeriod(
    merchantId: string,
    userId: string,
    userRole: UserRole,
    startDate: Date,
    endDate: Date
  ) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    if (merchant.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Access denied');
    }

    const coupons = await prisma.coupon.findMany({
      where: {
        campaign: {
          merchantId,
        },
        status: 'REDEEMED',
        redeemedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        campaign: {
          select: {
            pricePromo: true,
            title: true,
          },
        },
      },
    });

    // Group by date
    const revenueByDate = coupons.reduce((acc, coupon) => {
      if (!coupon.redeemedAt) return acc;

      const date = coupon.redeemedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
          count: 0,
        };
      }
      acc[date].revenue += Number(coupon.campaign.pricePromo);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; revenue: number; count: number }>);

    return Object.values(revenueByDate).sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const analyticsService = new AnalyticsService();
