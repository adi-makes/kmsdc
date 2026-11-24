import { Controller, Get, Put, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ClinicService } from './clinic.service.js';
import { RequirePermissions } from '../auth/decorators/permissions.decorator.js';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator.js';
import { clinicProfileSchema } from '@kmsdc/validation';

@Controller('clinic')
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Get()
  @RequirePermissions('settings.read')
  async getClinic(@CurrentUser() user: CurrentUserPayload) {
    return this.clinicService.getClinic(user.clinicId);
  }

  @Put('settings')
  @RequirePermissions('settings.manage')
  async updateSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const profile = clinicProfileSchema.parse(body);
    return this.clinicService.updateSettings(
      user.clinicId,
      profile,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }
}
