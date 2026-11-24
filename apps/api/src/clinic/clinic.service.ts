import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@kmsdc/db';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { ClinicProfile } from '@kmsdc/validation';

@Injectable()
export class ClinicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getClinic(clinicId: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        branches: true,
        settings: true,
      },
    });
    if (!clinic) throw new NotFoundException('Clinic not found');

    return {
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
      timezone: clinic.timezone,
      branches: clinic.branches,
      settings: clinic.settings,
    };
  }

  async updateSettings(
    clinicId: string,
    profile: ClinicProfile,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const jsonProfile = profile as unknown as Prisma.InputJsonValue;
    const settings = await this.prisma.clinicSettings.upsert({
      where: { clinicId },
      create: {
        clinicId,
        profile: jsonProfile,
        updatedById: actorId,
      },
      update: {
        profile: jsonProfile,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'settings.update',
      entityType: 'ClinicSettings',
      entityId: settings.id,
      ipAddress,
      userAgent,
      requestId,
    });

    return settings;
  }
}
