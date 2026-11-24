import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { Prisma } from '@kmsdc/db';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import {
  APPOINTMENT_TRANSITIONS,
  SLOT_BLOCKING_STATUSES,
  type AppointmentStatus,
} from '@kmsdc/types';
import type {
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
  RescheduleAppointmentInput,
} from '@kmsdc/validation';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(
    clinicId: string,
    params: {
      dentistId?: string;
      patientId?: string;
      status?: AppointmentStatus;
      from?: Date;
      to?: Date;
    },
  ) {
    const where: Prisma.AppointmentWhereInput = { clinicId };
    if (params.dentistId) where.dentistId = params.dentistId;
    if (params.patientId) where.patientId = params.patientId;
    if (params.status) where.status = params.status;
    if (params.from || params.to) {
      where.startsAt = {
        gte: params.from,
        lte: params.to,
      };
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            primaryPhone: true,
            patientNumber: true,
          },
        },
        dentist: { select: { id: true, fullName: true } },
        chair: true,
        type: true,
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async getById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        dentist: { select: { id: true, fullName: true, email: true } },
        chair: true,
        type: true,
        statusHistory: {
          include: { recordedBy: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  private async assertNoSlotConflict(
    dentistId: string,
    chairId: string | null | undefined,
    startsAt: Date,
    endsAt: Date,
    excludeAppointmentId?: string,
  ) {
    // Check dentist conflict
    const dentistConflict = await this.prisma.appointment.findFirst({
      where: {
        dentistId,
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        status: { in: SLOT_BLOCKING_STATUSES as unknown as AppointmentStatus[] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (dentistConflict) {
      throw new ConflictException(
        'The selected dentist already has an appointment scheduled during this time slot',
      );
    }

    // Check chair conflict if assigned
    if (chairId) {
      const chairConflict = await this.prisma.appointment.findFirst({
        where: {
          chairId,
          id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
          status: { in: SLOT_BLOCKING_STATUSES as unknown as AppointmentStatus[] },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });

      if (chairConflict) {
        throw new ConflictException(
          'The selected dental chair is already booked during this time slot',
        );
      }
    }
  }

  async create(
    clinicId: string,
    input: CreateAppointmentInput,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    const [patient, dentist, branch] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: input.patientId } }),
      this.prisma.user.findUnique({ where: { id: input.dentistId } }),
      input.branchId
        ? this.prisma.branch.findUnique({ where: { id: input.branchId } })
        : this.prisma.branch.findFirst({ where: { clinicId, isDefault: true } }),
    ]);

    if (!patient) throw new NotFoundException('Patient not found');
    if (!dentist) throw new NotFoundException('Dentist not found');
    if (!branch) throw new NotFoundException('Branch not found');

    await this.assertNoSlotConflict(input.dentistId, input.chairId, startsAt, endsAt);

    const appointment = await this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.create({
        data: {
          clinicId,
          branchId: branch.id,
          patientId: input.patientId,
          dentistId: input.dentistId,
          chairId: input.chairId,
          typeId: input.typeId,
          source: input.source,
          startsAt,
          endsAt,
          notes: input.notes,
          status: 'REQUESTED',
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: appt.id,
          fromStatus: 'REQUESTED',
          toStatus: 'REQUESTED',
          recordedById: actorId,
          reason: 'Initial appointment creation',
        },
      });

      // Transactional outbox event
      await tx.outboxEvent.create({
        data: {
          type: 'appointment.requested',
          aggregateType: 'Appointment',
          aggregateId: appt.id,
          payload: {
            appointmentId: appt.id,
            patientId: patient.id,
            dentistId: dentist.id,
            startsAt: startsAt.toISOString(),
          },
        },
      });

      return appt;
    });

    await this.audit.log({
      clinicId,
      actorType: actorId ? 'USER' : 'SYSTEM',
      actorId,
      action: 'appointments.create',
      entityType: 'Appointment',
      entityId: appointment.id,
      ipAddress,
      userAgent,
      requestId,
    });

    return this.getById(appointment.id);
  }

  async updateStatus(
    id: string,
    clinicId: string,
    input: UpdateAppointmentStatusInput,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Appointment not found');

    const currentStatus = existing.status;
    const allowedNext = APPOINTMENT_TRANSITIONS[currentStatus];
    if (!allowedNext.includes(input.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${existing.status} to ${input.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id },
        data: {
          status: input.status,
          cancellationReason:
            input.status === 'CANCELLED' ? input.reason : existing.cancellationReason,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          fromStatus: existing.status,
          toStatus: input.status,
          recordedById: actorId,
          reason: input.reason,
        },
      });

      await tx.outboxEvent.create({
        data: {
          type: `appointment.${input.status.toLowerCase()}`,
          aggregateType: 'Appointment',
          aggregateId: id,
          payload: {
            appointmentId: id,
            patientId: existing.patientId,
            status: input.status,
          },
        },
      });

      return appt;
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'appointments.update_status',
      entityType: 'Appointment',
      entityId: id,
      changes: {
        from: existing.status,
        to: input.status,
        reason: input.reason,
      },
      ipAddress,
      userAgent,
      requestId,
    });

    return this.getById(updated.id);
  }

  async reschedule(
    id: string,
    clinicId: string,
    input: RescheduleAppointmentInput,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Appointment not found');

    const dentistId = input.dentistId ?? existing.dentistId;
    const chairId = input.chairId !== undefined ? input.chairId : existing.chairId;
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    await this.assertNoSlotConflict(dentistId, chairId, startsAt, endsAt, existing.id);

    const newAppointment = await this.prisma.$transaction(async (tx) => {
      // Mark old as RESCHEDULED
      await tx.appointment.update({
        where: { id: existing.id },
        data: { status: 'RESCHEDULED' },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: existing.id,
          fromStatus: existing.status,
          toStatus: 'RESCHEDULED',
          recordedById: actorId,
          reason: input.reason,
        },
      });

      // Create new appointment pointing back to original
      const created = await tx.appointment.create({
        data: {
          clinicId,
          branchId: existing.branchId,
          patientId: existing.patientId,
          dentistId,
          chairId,
          typeId: existing.typeId,
          source: existing.source,
          startsAt,
          endsAt,
          rescheduledFromId: existing.id,
          notes: existing.notes,
          status: 'CONFIRMED',
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: created.id,
          fromStatus: 'CONFIRMED',
          toStatus: 'CONFIRMED',
          recordedById: actorId,
          reason: `Rescheduled from ${existing.id}: ${input.reason}`,
        },
      });

      return created;
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'appointments.reschedule',
      entityType: 'Appointment',
      entityId: newAppointment.id,
      changes: {
        originalAppointmentId: existing.id,
        newStartsAt: startsAt.toISOString(),
        reason: input.reason,
      },
      ipAddress,
      userAgent,
      requestId,
    });

    return this.getById(newAppointment.id);
  }

  async listTypes(clinicId: string) {
    return this.prisma.appointmentType.findMany({
      where: { clinicId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
