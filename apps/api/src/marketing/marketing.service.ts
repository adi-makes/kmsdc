import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PostStatus, Prisma } from '@kmsdc/db';
import type {
  CreateSocialAccountInput,
  CreateMarketingCampaignInput,
  CreateSocialPostInput,
  UpdateSocialPostInput,
} from '@kmsdc/validation';

@Injectable()
export class MarketingService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────── Social Accounts ──────────────────────────────

  async createSocialAccount(clinicId: string, input: CreateSocialAccountInput) {
    return this.prisma.socialAccount.create({
      data: {
        clinicId,
        platform: input.platform,
        accountName: input.accountName,
        accountHandle: input.accountHandle,
        isMock: input.isMock,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async listSocialAccounts(clinicId: string) {
    return this.prisma.socialAccount.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ────────────────────────────── Campaigns ──────────────────────────────

  async createCampaign(clinicId: string, input: CreateMarketingCampaignInput) {
    return this.prisma.marketingCampaign.create({
      data: {
        clinicId,
        name: input.name,
        description: input.description,
        status: input.status,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        budget: input.budget !== undefined ? input.budget : undefined,
      },
    });
  }

  async listCampaigns(clinicId: string) {
    return this.prisma.marketingCampaign.findMany({
      where: { clinicId },
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ────────────────────────────── Content / Posts ──────────────────────────────

  async createPost(clinicId: string, userId: string, input: CreateSocialPostInput) {
    const status = input.requiresClinicalReview
      ? 'PENDING_CLINICAL_APPROVAL'
      : input.scheduledAt
        ? 'SCHEDULED'
        : 'DRAFT';

    return this.prisma.socialPost.create({
      data: {
        clinicId,
        createdById: userId,
        campaignId: input.campaignId,
        socialAccountId: input.socialAccountId,
        title: input.title,
        caption: input.caption,
        hashtags: input.hashtags,
        mediaUrls: input.mediaUrls,
        status,
        requiresClinicalReview: input.requiresClinicalReview,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      },
    });
  }

  async listPosts(clinicId: string, filters?: { campaignId?: string; status?: PostStatus }) {
    return this.prisma.socialPost.findMany({
      where: {
        clinicId,
        ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      include: {
        campaign: { select: { id: true, name: true } },
        socialAccount: { select: { id: true, platform: true, accountName: true, isMock: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPostById(clinicId: string, id: string) {
    const post = await this.prisma.socialPost.findFirst({
      where: { id, clinicId },
      include: {
        campaign: true,
        socialAccount: true,
      },
    });
    if (!post) throw new NotFoundException('Social post not found');
    return post;
  }

  async updatePost(clinicId: string, id: string, input: UpdateSocialPostInput) {
    const post = await this.getPostById(clinicId, id);
    if (post.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot edit an already published post');
    }

    return this.prisma.socialPost.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.caption !== undefined ? { caption: input.caption } : {}),
        ...(input.hashtags !== undefined ? { hashtags: input.hashtags } : {}),
        ...(input.mediaUrls !== undefined ? { mediaUrls: input.mediaUrls } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.requiresClinicalReview !== undefined
          ? { requiresClinicalReview: input.requiresClinicalReview }
          : {}),
        ...(input.scheduledAt !== undefined
          ? { scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null }
          : {}),
      },
    });
  }

  async approveClinicalPost(clinicId: string, id: string, dentistUserId: string) {
    const post = await this.getPostById(clinicId, id);
    if (post.status !== 'PENDING_CLINICAL_APPROVAL') {
      throw new BadRequestException('Post is not awaiting clinical approval');
    }

    return this.prisma.socialPost.update({
      where: { id },
      data: {
        status: post.scheduledAt ? 'SCHEDULED' : 'APPROVED',
        clinicalApprovedAt: new Date(),
        clinicalApprovedById: dentistUserId,
      },
    });
  }

  async publishPost(clinicId: string, id: string) {
    const post = await this.getPostById(clinicId, id);
    if (post.requiresClinicalReview && !post.clinicalApprovedAt) {
      throw new ForbiddenException(
        'Post contains clinical content and requires dentist approval before publishing',
      );
    }

    // In local / mock environment, execute mock publishing adapter
    const updated = await this.prisma.socialPost.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include: {
        socialAccount: true,
      },
    });

    // Record outbox event for audit & metric tracking
    await this.prisma.outboxEvent.create({
      data: {
        type: 'marketing.post.published',
        aggregateType: 'marketing_post',
        aggregateId: id,
        payload: {
          postId: id,
          platform: post.socialAccount?.platform ?? 'MOCK_FEED',
          publishedAt: updated.publishedAt,
          isMock: post.socialAccount?.isMock ?? true,
        },
      },
    });

    return updated;
  }
}
