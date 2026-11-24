import { Controller, Get, Res, UseGuards, Header } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RequirePermissions } from '../auth/decorators/permissions.decorator.js';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator.js';
import { AnalyticsService } from './analytics.service.js';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  @RequirePermissions('analytics.clinic')
  async getClinicKpis(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getClinicKpis(user.clinicId);
  }

  @Get('funnel')
  @RequirePermissions('analytics.clinic')
  async getAcquisitionFunnel(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getAcquisitionFunnel(user.clinicId);
  }

  @Get('export')
  @RequirePermissions('analytics.export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="clinic-summary.csv"')
  async exportCsv(@CurrentUser() user: CurrentUserPayload, @Res() res: Response) {
    const csv = await this.analyticsService.exportClinicSummaryCsv(user.clinicId);
    res.send(csv);
  }
}
