export type SocialPlatformType =
  'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE' | 'GOOGLE_BUSINESS' | 'LINKEDIN';

export type CampaignStatusType = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';

export type PostStatusType =
  'DRAFT' | 'PENDING_CLINICAL_APPROVAL' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

export interface SocialAccountDto {
  id: string;
  clinicId: string;
  platform: SocialPlatformType;
  accountName: string;
  accountHandle: string;
  isMock: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingCampaignDto {
  id: string;
  clinicId: string;
  name: string;
  description?: string | null;
  status: CampaignStatusType;
  startDate?: string | null;
  endDate?: string | null;
  budget?: string | null;
  metrics?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPostDto {
  id: string;
  clinicId: string;
  campaignId?: string | null;
  socialAccountId?: string | null;
  title: string;
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  status: PostStatusType;
  requiresClinicalReview: boolean;
  clinicalApprovedAt?: string | null;
  clinicalApprovedById?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  publishError?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
