import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { EnquirySubmission } from '@kmsdc/validation';

@Injectable()
export class EnquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private hashIp(ip: string | undefined): string | null {
    if (!ip) return null;
    const secret = process.env.SESSION_SECRET ?? 'kmsdc_secret';
    return createHash('sha256').update(`${ip}:${secret}`).digest('hex');
  }

  async submitEnquiry(
    submission: EnquirySubmission,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    if (submission.website) {
      // Honeypot triggered
      return { id: 'ok' };
    }

    if (submission.elapsedMs < 2000) {
      throw new BadRequestException('Form submission was too fast');
    }

    const clinic = await this.prisma.clinic.findFirst();
    if (!clinic) throw new BadRequestException('Clinic not found');

    const enquiry = await this.prisma.enquiry.create({
      data: {
        clinicId: clinic.id,
        name: submission.name,
        phone: submission.phone,
        email: submission.email || null,
        service: submission.service,
        preferredTime: submission.preferredTime,
        message: submission.message || null,
        consentToContact: submission.consentToContact,
        consentToPromotions: submission.consentToPromotions,
        consentNoticeVersion: '2026-11-01',
        sourcePage: submission.source?.page || null,
        referrer: submission.source?.referrer || null,
        utmSource: submission.source?.utmSource || null,
        utmMedium: submission.source?.utmMedium || null,
        utmCampaign: submission.source?.utmCampaign || null,
        ipHash: this.hashIp(ipAddress),
      },
    });

    await this.audit.log({
      clinicId: clinic.id,
      actorType: 'PUBLIC',
      action: 'enquiries.submit',
      entityType: 'Enquiry',
      entityId: enquiry.id,
      ipAddress,
      userAgent,
      requestId,
    });

    return { id: enquiry.id };
  }

  async list(clinicId: string) {
    return this.prisma.enquiry.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
