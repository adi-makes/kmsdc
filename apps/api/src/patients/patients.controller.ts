import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PatientsService } from './patients.service.js';
import { RequirePermissions } from '../auth/decorators/permissions.decorator.js';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator.js';
import {
  createPatientSchema,
  updatePatientSchema,
  mergePatientSchema,
  patientConsentSchema,
} from '@kmsdc/validation';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @RequirePermissions('patients.read')
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 50;
    const o = offset ? parseInt(offset, 10) : 0;
    return this.patientsService.list(user.clinicId, search, l, o);
  }

  @Get(':id')
  @RequirePermissions('patients.read')
  async getById(@Param('id') id: string) {
    return this.patientsService.getById(id);
  }

  @Post()
  @RequirePermissions('patients.create')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = createPatientSchema.parse(body);
    return this.patientsService.create(
      user.clinicId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Patch(':id')
  @RequirePermissions('patients.update')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = updatePatientSchema.parse(body);
    return this.patientsService.update(
      id,
      user.clinicId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Post(':id/consents')
  @RequirePermissions('consent.manage')
  async recordConsent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = patientConsentSchema.parse(body);
    return this.patientsService.recordConsent(
      id,
      user.clinicId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Post('merge')
  @RequirePermissions('patients.merge')
  async merge(@CurrentUser() user: CurrentUserPayload, @Body() body: unknown, @Req() req: Request) {
    const input = mergePatientSchema.parse(body);
    return this.patientsService.merge(
      input,
      user.clinicId,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }
}
