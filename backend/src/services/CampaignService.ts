import { prisma } from '@/config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import { CampaignStatus, UserRole } from '@prisma/client';
import { generateUniqueSlug } from '@/utils/slugify';

interface CreateCampaignData {
  merchantId: string;
  title: string;
  description: string;
  shortDescription?: string;
  priceOriginal: number;
  pricePromo: number;
  category: string;
  tags?: string[];
  city: string;
  state: string;
  country?: string;
  startAt: Date;
  endAt: Date;
  totalQuantity: number;
  terms?: string;
  imageUrl?: string;
  images?: string[];
}

interface UpdateCampaignData extends Partial<CreateCampaignData> {
  status?: CampaignStatus;
}

interface ListCampaignsFilter {
  city?: string;
  state?: string;
  category?: string;
  search?: string;
  status?: CampaignStatus;
  merchantId?: string;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
}

export class CampaignService {
  /**
   * Create a new campaign
   */
  async create(data: CreateCampaignData, userId: string, userRole: UserRole) {
    // Verify merchant ownership
    const merchant = await prisma.merchant.findUnique({
      where: { id: data.merchantId },
      include: { user: true },
    });

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    if (merchant.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('You do not have permission to create campaigns for this merchant');
    }

    if (!merchant.isApproved) {
      throw new BadRequestError('Merchant must be approved before creating campaigns');
    }

    // Calculate discount percentage
    const discountPercent = Math.round(
      ((data.priceOriginal - data.pricePromo) / data.priceOriginal) * 100,
    );

    // Generate unique slug
    const existingCampaigns = await prisma.campaign.findMany({
      select: { slug: true },
    });
    const slug = generateUniqueSlug(
      data.title,
      existingCampaigns.map((c) => c.slug),
    );

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        merchantId: data.merchantId,
        title: data.title,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        priceOriginal: data.priceOriginal,
        pricePromo: data.pricePromo,
        discountPercent,
        category: data.category,
        tags: data.tags || [],
        city: data.city,
        state: data.state,
        country: data.country || 'BR',
        startAt: data.startAt,
        endAt: data.endAt,
        totalQuantity: data.totalQuantity,
        terms: data.terms,
        imageUrl: data.imageUrl,
        images: data.images || [],
        status: CampaignStatus.DRAFT,
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            logoUrl: true,
          },
        },
      },
    });

    return campaign;
  }

  /**
   * Get campaign by ID or slug
   */
  async getById(idOrSlug: string, incrementView = false) {
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            phone: true,
            logoUrl: true,
            description: true,
          },
        },
        _count: {
          select: {
            coupons: true,
            favorites: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    // Increment view count
    if (incrementView && campaign.status === CampaignStatus.PUBLISHED) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return campaign;
  }

  /**
   * List campaigns with filters
   */
  async list(filters: ListCampaignsFilter) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.state) {
      where.state = { equals: filters.state, mode: 'insensitive' };
    }

    if (filters.category) {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    } else {
      // Default to published campaigns
      where.status = CampaignStatus.PUBLISHED;
    }

    if (filters.merchantId) {
      where.merchantId = filters.merchantId;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    // Only show active campaigns (started and not ended)
    if (!filters.status) {
      where.startAt = { lte: new Date() };
      where.endAt = { gte: new Date() };
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              favorites: true,
            },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return {
      campaigns,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update campaign
   */
  async update(id: string, data: UpdateCampaignData, userId: string, userRole: UserRole) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { merchant: true },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.merchant.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('You do not have permission to update this campaign');
    }

    // Calculate new discount if prices changed
    let discountPercent = campaign.discountPercent;
    if (data.priceOriginal || data.pricePromo) {
      const original = data.priceOriginal || Number(campaign.priceOriginal);
      const promo = data.pricePromo || Number(campaign.pricePromo);
      discountPercent = Math.round(((original - promo) / original) * 100);
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...data,
        discountPercent,
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            logoUrl: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete campaign
   */
  async delete(id: string, userId: string, userRole: UserRole): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { merchant: true },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.merchant.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('You do not have permission to delete this campaign');
    }

    await prisma.campaign.delete({
      where: { id },
    });
  }

  /**
   * Publish campaign
   */
  async publish(id: string, userId: string, userRole: UserRole) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { merchant: true },
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.merchant.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('You do not have permission to publish this campaign');
    }

    // Check if campaign is paid (for campaigns that require payment)
    if (campaign.isPaid === false) {
      throw new BadRequestError('Campaign must be paid before publishing');
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    // TODO: Generate coupons, send notifications to followers
    // await couponService.generateCoupons(campaign.id, campaign.totalQuantity);
    // await notificationService.notifyNewCampaign(campaign.id);

    return updated;
  }

  /**
   * Toggle favorite
   */
  async toggleFavorite(campaignId: string, userId: string) {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { favoriteCount: { decrement: 1 } },
      });

      return { isFavorited: false };
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          campaignId,
        },
      });

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { favoriteCount: { increment: 1 } },
      });

      return { isFavorited: true };
    }
  }
}

export const campaignService = new CampaignService();
