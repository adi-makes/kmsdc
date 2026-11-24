import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { EnquiriesService } from './enquiries.service.js';
import { Public, RequirePermissions } from '../auth/decorators/permissions.decorator.js';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator.js';
import { enquirySubmissionSchema } from '@kmsdc/validation';

@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Public()
  @Post()
  async submit(@Body() body: unknown, @Req() req: Request) {
    const submission = enquirySubmissionSchema.parse(body);
    return this.enquiriesService.submitEnquiry(
      submission,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Get()
  @RequirePermissions('enquiries.read')
  async list(@CurrentUser() user: CurrentUserPayload) {
    return this.enquiriesService.list(user.clinicId);
  }
}
