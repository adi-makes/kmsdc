import { Controller, Get, Post, Put, Patch, Body, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ClinicalService } from './clinical.service.js';
import { RequirePermissions } from '../auth/decorators/permissions.decorator.js';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator.js';
import {
  medicalHistorySchema,
  allergySchema,
  medicationSchema,
  createEncounterSchema,
  createDiagnosisSchema,
  createClinicalNoteSchema,
  amendClinicalNoteSchema,
  createPrescriptionSchema,
  toothConditionSchema,
  createTreatmentPlanSchema,
  updateTreatmentPlanStatusSchema,
} from '@kmsdc/validation';

@Controller('clinical')
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

  @Get('patients/:id/medical-summary')
  @RequirePermissions('clinical.read')
  async getMedicalSummary(@Param('id') patientId: string) {
    return this.clinicalService.getMedicalSummary(patientId);
  }

  @Put('patients/:id/medical-history')
  @RequirePermissions('clinical.write')
  async updateMedicalHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') patientId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = medicalHistorySchema.parse(body);
    return this.clinicalService.updateMedicalHistory(
      patientId,
      user.clinicId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Post('patients/:id/allergies')
  @RequirePermissions('clinical.write')
  async addAllergy(@Param('id') patientId: string, @Body() body: unknown) {
    const input = allergySchema.parse(body);
    return this.clinicalService.addAllergy(patientId, input);
  }

  @Post('patients/:id/medications')
  @RequirePermissions('clinical.write')
  async addMedication(@Param('id') patientId: string, @Body() body: unknown) {
    const input = medicationSchema.parse(body);
    return this.clinicalService.addMedication(patientId, input);
  }

  @Post('encounters')
  @RequirePermissions('clinical.write')
  async createEncounter(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = createEncounterSchema.parse(body);
    return this.clinicalService.createEncounter(
      user.clinicId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Get('encounters/:id')
  @RequirePermissions('clinical.read')
  async getEncounter(@Param('id') id: string) {
    return this.clinicalService.getEncounter(id);
  }

  @Post('encounters/:id/diagnoses')
  @RequirePermissions('clinical.write')
  async addDiagnosis(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = createDiagnosisSchema.parse(body);
    return this.clinicalService.addDiagnosis(id, input, user.id);
  }

  @Post('encounters/:id/notes')
  @RequirePermissions('clinical.write')
  async createNote(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = createClinicalNoteSchema.parse(body);
    return this.clinicalService.createClinicalNote(id, input, user.id);
  }

  @Post('notes/:id/finalise')
  @RequirePermissions('clinical.finalise')
  async finaliseNote(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.clinicalService.finaliseClinicalNote(
      id,
      user.clinicId,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Post('notes/:id/amend')
  @RequirePermissions('clinical.amend')
  async amendNote(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = amendClinicalNoteSchema.parse(body);
    return this.clinicalService.amendClinicalNote(
      id,
      user.clinicId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Post('encounters/:id/prescriptions')
  @RequirePermissions('prescriptions.write')
  async createPrescription(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = createPrescriptionSchema.parse(body);
    return this.clinicalService.createPrescription(id, user.id, input);
  }

  @Get('patients/:id/dental-chart')
  @RequirePermissions('clinical.read')
  async getDentalChart(@Param('id') patientId: string) {
    return this.clinicalService.getDentalChart(patientId);
  }

  @Post('patients/:id/tooth-conditions')
  @RequirePermissions('clinical.write')
  async recordToothCondition(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') patientId: string,
    @Body() body: unknown,
  ) {
    const input = toothConditionSchema.parse(body);
    return this.clinicalService.recordToothCondition(patientId, input, undefined, user.id);
  }

  @Get('patients/:id/treatment-plans')
  @RequirePermissions('treatment_plans.read')
  async listTreatmentPlans(@Param('id') patientId: string) {
    return this.clinicalService.listTreatmentPlans(patientId);
  }

  @Post('treatment-plans')
  @RequirePermissions('treatment_plans.write')
  async createTreatmentPlan(@CurrentUser() user: CurrentUserPayload, @Body() body: unknown) {
    const input = createTreatmentPlanSchema.parse(body);
    return this.clinicalService.createTreatmentPlan(user.clinicId, input, user.id);
  }

  @Patch('treatment-plans/:id/status')
  @RequirePermissions('treatment_plans.record_approval')
  async updateTreatmentPlanStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = updateTreatmentPlanStatusSchema.parse(body);
    return this.clinicalService.updateTreatmentPlanStatus(id, user.clinicId, input, user.id);
  }
}
