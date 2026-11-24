import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@kmsdc/db';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuditLogParams {
  clinicId?: string;
  actorType: 'USER' | 'SYSTEM' | 'PUBLIC';
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          clinicId: params.clinicId,
          actorType: params.actorType,
          actorId: params.actorId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          changes: (params.changes ?? undefined) as Prisma.InputJsonValue | undefined,
          metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          requestId: params.requestId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create audit log entry for ${params.action} on ${params.entityType}:`,
        error,
      );
    }
  }

  async list(clinicId?: string, limit = 50, offset = 0) {
    return this.prisma.auditLog.findMany({
      where: clinicId ? { clinicId } : {},
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
    });
  }
}
