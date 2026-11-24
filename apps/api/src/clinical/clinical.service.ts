import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma, ToothConditionStatus, TreatmentPlanStatus } from '@kmsdc/db';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type {
  MedicalHistoryInput,
  AllergyInput,
  MedicationInput,
  CreateEncounterInput,
  CreateDiagnosisInput,
  CreateClinicalNoteInput,
  AmendClinicalNoteInput,
  CreatePrescriptionInput,
  ToothConditionInput,
  CreateTreatmentPlanInput,
  UpdateTreatmentPlanStatusInput,
} from '@kmsdc/validation';

@Injectable()
export class ClinicalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ──────────────────────── Medical History ─────────────────────────

  async getMedicalSummary(patientId: string) {
    const [history, allergies, medications] = await Promise.all([
      this.prisma.medicalHistory.findUnique({ where: { patientId } }),
      this.prisma.allergy.findMany({ where: { patientId, isActive: true } }),
      this.prisma.medication.findMany({ where: { patientId, isActive: true } }),
    ]);

    return { history, allergies, medications };
  }

  async updateMedicalHistory(
    patientId: string,
    clinicId: string,
    input: MedicalHistoryInput,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const conditionsJson = input.conditions as unknown as Prisma.InputJsonValue;
    const history = await this.prisma.medicalHistory.upsert({
      where: { patientId },
      create: {
        patientId,
        conditions: conditionsJson,
        notes: input.notes,
        updatedById: actorId,
      },
      update: {
        conditions: conditionsJson,
        notes: input.notes,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'clinical.update_medical_history',
      entityType: 'MedicalHistory',
      entityId: history.id,
      ipAddress,
      userAgent,
      requestId,
    });

    return history;
  }

  async addAllergy(patientId: string, input: AllergyInput) {
    return this.prisma.allergy.create({
      data: {
        patientId,
        substance: input.substance,
        severity: input.severity,
        reaction: input.reaction,
      },
    });
  }

  async addMedication(patientId: string, input: MedicationInput) {
    return this.prisma.medication.create({
      data: {
        patientId,
        name: input.name,
        dosage: input.dosage,
      },
    });
  }

  // ────────────────────────── Encounters ───────────────────────────

  async createEncounter(
    clinicId: string,
    input: CreateEncounterInput,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const encounter = await this.prisma.encounter.create({
      data: {
        clinicId,
        patientId: input.patientId,
        dentistId: input.dentistId,
        appointmentId: input.appointmentId,
        chiefComplaint: input.chiefComplaint,
        examination: input.examination,
      },
      include: {
        patient: { select: { id: true, fullName: true } },
        dentist: { select: { id: true, fullName: true } },
      },
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'clinical.create_encounter',
      entityType: 'Encounter',
      entityId: encounter.id,
      ipAddress,
      userAgent,
      requestId,
    });

    return encounter;
  }

  async getEncounter(id: string) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id },
      include: {
        patient: true,
        dentist: { select: { id: true, fullName: true, email: true } },
        diagnoses: true,
        notes: { include: { versions: { orderBy: { version: 'desc' } } } },
        prescriptions: { include: { items: true } },
        toothConditions: true,
      },
    });

    if (!encounter) throw new NotFoundException('Encounter not found');
    return encounter;
  }

  async addDiagnosis(encounterId: string, input: CreateDiagnosisInput, authorId: string) {
    const encounter = await this.prisma.encounter.findUnique({ where: { id: encounterId } });
    if (!encounter) throw new NotFoundException('Encounter not found');

    return this.prisma.diagnosis.create({
      data: {
        encounterId,
        description: input.description,
        toothFdi: input.toothFdi,
        code: input.code,
        authorId,
      },
    });
  }

  // ──────────────────────── Clinical Notes ─────────────────────────

  async createClinicalNote(encounterId: string, input: CreateClinicalNoteInput, authorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const note = await tx.clinicalNote.create({
        data: {
          encounterId,
          status: 'DRAFT',
          currentVersion: 1,
          authorId,
        },
      });

      await tx.clinicalNoteVersion.create({
        data: {
          noteId: note.id,
          version: 1,
          content: input.content,
          authorId,
        },
      });

      return tx.clinicalNote.findUnique({
        where: { id: note.id },
        include: { versions: true },
      });
    });
  }

  async finaliseClinicalNote(
    noteId: string,
    clinicId: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const note = await this.prisma.clinicalNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Clinical note not found');
    if (note.status !== 'DRAFT') {
      throw new BadRequestException('Note is already finalised');
    }

    const updated = await this.prisma.clinicalNote.update({
      where: { id: noteId },
      data: {
        status: 'FINALISED',
        finalisedAt: new Date(),
      },
      include: { versions: true },
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'clinical.finalise_note',
      entityType: 'ClinicalNote',
      entityId: noteId,
      ipAddress,
      userAgent,
      requestId,
    });

    return updated;
  }

  async amendClinicalNote(
    noteId: string,
    clinicId: string,
    input: AmendClinicalNoteInput,
    authorId: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const note = await this.prisma.clinicalNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Clinical note not found');
    if (note.status === 'DRAFT') {
      throw new BadRequestException('Draft notes must be finalised before amending');
    }

    const nextVersion = note.currentVersion + 1;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.clinicalNoteVersion.create({
        data: {
          noteId,
          version: nextVersion,
          content: input.content,
          amendmentReason: input.amendmentReason,
          authorId,
        },
      });

      return tx.clinicalNote.update({
        where: { id: noteId },
        data: {
          status: 'AMENDED',
          currentVersion: nextVersion,
        },
        include: { versions: { orderBy: { version: 'desc' } } },
      });
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId: authorId,
      action: 'clinical.amend_note',
      entityType: 'ClinicalNote',
      entityId: noteId,
      changes: {
        version: nextVersion,
        reason: input.amendmentReason,
      },
      ipAddress,
      userAgent,
      requestId,
    });

    return updated;
  }

  // ───────────────────────── Prescriptions ─────────────────────────

  async createPrescription(encounterId: string, dentistId: string, input: CreatePrescriptionInput) {
    return this.prisma.prescription.create({
      data: {
        encounterId,
        dentistId,
        notes: input.notes,
        items: {
          create: input.items.map((i) => ({
            drug: i.drug,
            dose: i.dose,
            frequency: i.frequency,
            duration: i.duration,
            instructions: i.instructions,
          })),
        },
      },
      include: { items: true },
    });
  }

  // ──────────────────────── Dental Odontogram ───────────────────────

  async getDentalChart(patientId: string) {
    let chart = await this.prisma.dentalChart.findUnique({
      where: { patientId },
      include: { conditions: true },
    });

    if (!chart) {
      chart = await this.prisma.dentalChart.create({
        data: { patientId, dentition: 'PERMANENT' },
        include: { conditions: true },
      });
    }

    return chart;
  }

  async recordToothCondition(
    patientId: string,
    input: ToothConditionInput,
    encounterId?: string,
    actorId?: string,
  ) {
    const chart = await this.getDentalChart(patientId);

    return this.prisma.toothCondition.create({
      data: {
        chartId: chart.id,
        toothFdi: input.toothFdi,
        surfaces: input.surfaces,
        condition: input.condition,
        status: input.status as ToothConditionStatus,
        material: input.material,
        notes: input.notes,
        encounterId,
        recordedById: actorId,
      },
    });
  }

  // ──────────────────────── Treatment Plans ────────────────────────

  async listTreatmentPlans(patientId: string) {
    return this.prisma.treatmentPlan.findMany({
      where: { patientId },
      include: {
        dentist: { select: { id: true, fullName: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTreatmentPlan(clinicId: string, input: CreateTreatmentPlanInput, actorId?: string) {
    const plan = await this.prisma.treatmentPlan.create({
      data: {
        clinicId,
        patientId: input.patientId,
        dentistId: input.dentistId,
        title: input.title,
        notes: input.notes,
        status: 'DRAFT',
        items: {
          create: input.items.map((item) => ({
            procedure: item.procedure,
            teethFdi: item.teethFdi,
            surfaces: item.surfaces,
            estimateCost: item.estimateCost,
            actualCost: item.actualCost,
            plannedVisit: item.plannedVisit,
            notes: item.notes,
          })),
        },
      },
      include: { items: true },
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'treatment_plans.create',
      entityType: 'TreatmentPlan',
      entityId: plan.id,
      changes: { title: plan.title, patientId: plan.patientId },
    });

    return plan;
  }

  async updateTreatmentPlanStatus(
    planId: string,
    clinicId: string,
    input: UpdateTreatmentPlanStatusInput,
    actorId?: string,
  ) {
    const plan = await this.prisma.treatmentPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Treatment plan not found');

    const updated = await this.prisma.treatmentPlan.update({
      where: { id: planId },
      data: {
        status: input.status as TreatmentPlanStatus,
        approvedAt: input.status === 'APPROVED' ? new Date() : plan.approvedAt,
      },
      include: { items: true },
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'treatment_plans.update_status',
      entityType: 'TreatmentPlan',
      entityId: planId,
      changes: { status: input.status },
    });

    return updated;
  }
}
