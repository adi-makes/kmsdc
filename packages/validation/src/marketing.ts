import { z } from 'zod';

export const socialPlatformSchema = z.enum([
  'INSTAGRAM',
  'FACEBOOK',
  'YOUTUBE',
  'GOOGLE_BUSINESS',
  'LINKEDIN',
]);

export const campaignStatusSchema = z.enum([
  'DRAFT',
  'SCHEDULED',
  'RUNNING',
  'COMPLETED',
  'CANCELLED',
]);

export const postStatusSchema = z.enum([
  'DRAFT',
  'PENDING_CLINICAL_APPROVAL',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'FAILED',
]);

export const createSocialAccountSchema = z.object({
  platform: socialPlatformSchema,
  accountName: z.string().min(1).max(100),
  accountHandle: z.string().min(1).max(100),
  isMock: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createMarketingCampaignSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  status: campaignStatusSchema.default('DRAFT'),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  budget: z.number().nonnegative().optional(),
});

export const createSocialPostSchema = z.object({
  campaignId: z.uuid().optional(),
  socialAccountId: z.uuid().optional(),
  title: z.string().min(1).max(200),
  caption: z.string().min(1).max(5000),
  hashtags: z.array(z.string()).default([]),
  mediaUrls: z.array(z.url()).default([]),
  requiresClinicalReview: z.boolean().default(false),
  scheduledAt: z.iso.datetime().optional(),
});

export const updateSocialPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  caption: z.string().min(1).max(5000).optional(),
  hashtags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.url()).optional(),
  status: postStatusSchema.optional(),
  requiresClinicalReview: z.boolean().optional(),
  scheduledAt: z.iso.datetime().nullable().optional(),
});

export type CreateSocialAccountInput = z.infer<typeof createSocialAccountSchema>;
export type CreateMarketingCampaignInput = z.infer<typeof createMarketingCampaignSchema>;
export type CreateSocialPostInput = z.infer<typeof createSocialPostSchema>;
export type UpdateSocialPostInput = z.infer<typeof updateSocialPostSchema>;
