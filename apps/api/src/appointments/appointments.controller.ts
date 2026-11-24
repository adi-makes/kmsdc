import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AppointmentsService } from './appointments.service.js';
import { RequirePermissions } from '../auth/decorators/permissions.decorator.js';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator.js';
import type { AppointmentStatus } from '@kmsdc/types';
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
} from '@kmsdc/validation';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('types')
  @RequirePermissions('appointments.read')
  async listTypes(@CurrentUser() user: CurrentUserPayload) {
    return this.appointmentsService.listTypes(user.clinicId);
  }

  @Get()
  @RequirePermissions('appointments.read')
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('dentistId') dentistId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.appointmentsService.list(user.clinicId, {
      dentistId,
      patientId,
      status: status as AppointmentStatus | undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions('appointments.read')
  async getById(@Param('id') id: string) {
    return this.appointmentsService.getById(id);
  }

  @Post()
  @RequirePermissions('appointments.manage')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = createAppointmentSchema.parse(body);
    return this.appointmentsService.create(
      user.clinicId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Patch(':id/status')
  @RequirePermissions('appointments.manage')
  async updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = updateAppointmentStatusSchema.parse(body);
    return this.appointmentsService.updateStatus(
      id,
      user.clinicId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Post(':id/reschedule')
  @RequirePermissions('appointments.manage')
  async reschedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = rescheduleAppointmentSchema.parse(body);
    return this.appointmentsService.reschedule(
      id,
      user.clinicId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }
}
