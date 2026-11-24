import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { PostStatus } from '@kmsdc/db';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RequirePermissions } from '../auth/decorators/permissions.decorator.js';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator.js';
import { MarketingService } from './marketing.service.js';
import {
  createSocialAccountSchema,
  createMarketingCampaignSchema,
  createSocialPostSchema,
  updateSocialPostSchema,
} from '@kmsdc/validation';

@Controller('marketing')
@UseGuards(AuthGuard)
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  // ────────────────────────────── Social Accounts ──────────────────────────────

  @Get('accounts')
  @RequirePermissions('marketing.read')
  async listAccounts(@CurrentUser() user: CurrentUserPayload) {
    return this.marketingService.listSocialAccounts(user.clinicId);
  }

  @Post('accounts')
  @RequirePermissions('marketing.manage')
  async createAccount(@CurrentUser() user: CurrentUserPayload, @Body() body: unknown) {
    const parsed = createSocialAccountSchema.parse(body);
    return this.marketingService.createSocialAccount(user.clinicId, parsed);
  }

  // ────────────────────────────── Campaigns ──────────────────────────────

  @Get('campaigns')
  @RequirePermissions('marketing.read')
  async listCampaigns(@CurrentUser() user: CurrentUserPayload) {
    return this.marketingService.listCampaigns(user.clinicId);
  }

  @Post('campaigns')
  @RequirePermissions('marketing.manage')
  async createCampaign(@CurrentUser() user: CurrentUserPayload, @Body() body: unknown) {
    const parsed = createMarketingCampaignSchema.parse(body);
    return this.marketingService.createCampaign(user.clinicId, parsed);
  }

  // ────────────────────────────── Posts ──────────────────────────────

  @Get('posts')
  @RequirePermissions('marketing.read')
  async listPosts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('campaignId') campaignId?: string,
    @Query('status') status?: PostStatus,
  ) {
    return this.marketingService.listPosts(user.clinicId, { campaignId, status });
  }

  @Get('posts/:id')
  @RequirePermissions('marketing.read')
  async getPost(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.marketingService.getPostById(user.clinicId, id);
  }

  @Post('posts')
  @RequirePermissions('marketing.manage')
  async createPost(@CurrentUser() user: CurrentUserPayload, @Body() body: unknown) {
    const parsed = createSocialPostSchema.parse(body);
    return this.marketingService.createPost(user.clinicId, user.id, parsed);
  }

  @Patch('posts/:id')
  @RequirePermissions('marketing.manage')
  async updatePost(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsed = updateSocialPostSchema.parse(body);
    return this.marketingService.updatePost(user.clinicId, id, parsed);
  }

  @Post('posts/:id/approve-clinical')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('marketing.approve_clinical')
  async approveClinicalPost(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.marketingService.approveClinicalPost(user.clinicId, id, user.id);
  }

  @Post('posts/:id/publish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('marketing.publish')
  async publishPost(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.marketingService.publishPost(user.clinicId, id);
  }
}
