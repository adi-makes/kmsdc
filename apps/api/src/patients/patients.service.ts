import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { Prisma } from '@kmsdc/db';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type {
  CreatePatientInput,
  UpdatePatientInput,
  MergePatientInput,
  PatientConsentInput,
} from '@kmsdc/validation';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async generatePatientNumber(clinicId: string): Promise<string> {
    const settings = await this.prisma.clinicSettings.findUnique({
      where: { clinicId },
    });
    const prefix = settings?.patientNumberPrefix ?? 'KMDC';
    const count = await this.prisma.patient.count({ where: { clinicId } });
    const padded = String(count + 1).padStart(6, '0');
    return `${prefix}-${padded}`;
  }

  async list(clinicId: string, search?: string, limit = 50, offset = 0) {
    const where: Prisma.PatientWhereInput = {
      clinicId,
      status: { not: 'MERGED' },
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { primaryPhone: { contains: search } },
        { patientNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          consents: true,
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { items, total };
  }

  async getById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        consents: { orderBy: { createdAt: 'desc' } },
        appointments: {
          include: {
            dentist: { select: { id: true, fullName: true } },
            type: true,
            chair: true,
          },
          orderBy: { startsAt: 'desc' },
        },
        mergedInto: true,
      },
    });

    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async create(
    clinicId: string,
    input: CreatePatientInput,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const patientNumber = await this.generatePatientNumber(clinicId);

    const patient = await this.prisma.$transaction(async (tx) => {
      const p = await tx.patient.create({
        data: {
          clinicId,
          patientNumber,
          fullName: input.fullName,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          gender: input.gender,
          primaryPhone: input.primaryPhone,
          email: input.email,
          emergencyContact: input.emergencyContact,
          emergencyPhone: input.emergencyPhone,
          addressLine1: input.addressLine1,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          notes: input.notes,
        },
      });

      if (input.tags && input.tags.length > 0) {
        for (const tagName of input.tags) {
          const tag = await tx.patientTag.upsert({
            where: { clinicId_name: { clinicId, name: tagName } },
            create: { clinicId, name: tagName },
            update: {},
          });
          await tx.patientTagAssignment.create({
            data: { patientId: p.id, tagId: tag.id },
          });
        }
      }

      return p;
    });

    await this.audit.log({
      clinicId,
      actorType: actorId ? 'USER' : 'SYSTEM',
      actorId,
      action: 'patients.create',
      entityType: 'Patient',
      entityId: patient.id,
      changes: {
        patientNumber: patient.patientNumber,
        fullName: patient.fullName,
        primaryPhone: patient.primaryPhone,
      },
      ipAddress,
      userAgent,
      requestId,
    });

    return this.getById(patient.id);
  }

  async update(
    id: string,
    clinicId: string,
    input: UpdatePatientInput,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const existing = await this.prisma.patient.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Patient not found');

    const updated = await this.prisma.patient.update({
      where: { id },
      data: {
        fullName: input.fullName,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        gender: input.gender,
        primaryPhone: input.primaryPhone,
        email: input.email,
        emergencyContact: input.emergencyContact,
        emergencyPhone: input.emergencyPhone,
        addressLine1: input.addressLine1,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        notes: input.notes,
        status: input.status,
      },
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'patients.update',
      entityType: 'Patient',
      entityId: id,
      changes: input,
      ipAddress,
      userAgent,
      requestId,
    });

    return this.getById(updated.id);
  }

  async recordConsent(
    patientId: string,
    clinicId: string,
    input: PatientConsentInput,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const consent = await this.prisma.patientConsent.create({
      data: {
        patientId,
        purpose: input.purpose,
        status: input.status,
        noticeVersion: input.noticeVersion,
        recordedById: actorId,
        notes: input.notes,
      },
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'patients.consent',
      entityType: 'PatientConsent',
      entityId: consent.id,
      changes: input,
      ipAddress,
      userAgent,
      requestId,
    });

    return consent;
  }

  async merge(
    input: MergePatientInput,
    clinicId: string,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    if (input.sourcePatientId === input.targetPatientId) {
      throw new BadRequestException('Cannot merge patient record into itself');
    }

    const [source, target] = await Promise.all([
      this.prisma.patient.findUnique({
        where: { id: input.sourcePatientId },
        include: { appointments: true, consents: true },
      }),
      this.prisma.patient.findUnique({
        where: { id: input.targetPatientId },
      }),
    ]);

    if (!source) throw new NotFoundException('Source patient not found');
    if (!target) throw new NotFoundException('Target patient not found');
    if (source.status === 'MERGED') throw new ConflictException('Source patient already merged');

    await this.prisma.$transaction(async (tx) => {
      // Reassign appointments
      await tx.appointment.updateMany({
        where: { patientId: source.id },
        data: { patientId: target.id },
      });

      // Mark source patient as MERGED
      await tx.patient.update({
        where: { id: source.id },
        data: {
          status: 'MERGED',
          mergedIntoId: target.id,
        },
      });

      // Record immutable merge record with snapshot
      await tx.patientMergeRecord.create({
        data: {
          sourcePatientId: source.id,
          targetPatientId: target.id,
          snapshot: JSON.parse(JSON.stringify(source)) as Prisma.InputJsonValue,
          reason: input.reason,
          mergedById: actorId,
        },
      });
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'patients.merge',
      entityType: 'PatientMergeRecord',
      entityId: target.id,
      changes: {
        sourcePatientId: source.id,
        targetPatientId: target.id,
        reason: input.reason,
      },
      ipAddress,
      userAgent,
      requestId,
    });

    return this.getById(target.id);
  }
}
