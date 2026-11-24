import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ClinicKpisDto, PatientAcquisitionFunnelDto } from '@kmsdc/types';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getClinicKpis(clinicId: string): Promise<ClinicKpisDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalPatients,
      newPatientsThisMonth,
      totalAppointments,
      completedAppointments,
      noShowAppointments,
      activeTreatmentPlans,
      totalConversations,
    ] = await Promise.all([
      this.prisma.patient.count({ where: { clinicId } }),
      this.prisma.patient.count({
        where: {
          clinicId,
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.appointment.count({ where: { clinicId } }),
      this.prisma.appointment.count({
        where: { clinicId, status: 'COMPLETED' },
      }),
      this.prisma.appointment.count({
        where: { clinicId, status: 'NO_SHOW' },
      }),
      this.prisma.treatmentPlan.count({
        where: { clinicId, status: { in: ['PROPOSED', 'APPROVED', 'IN_PROGRESS'] } },
      }),
      this.prisma.conversation.count({ where: { clinicId } }),
    ]);

    const completionRate =
      totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
    const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0;

    return {
      totalPatients,
      newPatientsThisMonth,
      totalAppointments,
      completedAppointments,
      noShowAppointments,
      completionRate: Math.round(completionRate * 10) / 10,
      noShowRate: Math.round(noShowRate * 10) / 10,
      activeTreatmentPlans,
      totalConversations,
    };
  }

  async getAcquisitionFunnel(clinicId: string): Promise<PatientAcquisitionFunnelDto> {
    const [enquiriesCount, registeredCount, bookedCount, completedVisits, acceptedPlans] =
      await Promise.all([
        this.prisma.enquiry.count({ where: { clinicId } }),
        this.prisma.patient.count({ where: { clinicId } }),
        this.prisma.appointment.count({ where: { clinicId } }),
        this.prisma.appointment.count({ where: { clinicId, status: 'COMPLETED' } }),
        this.prisma.treatmentPlan.count({
          where: { clinicId, status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] } },
        }),
      ]);

    const stages = [
      { stage: 'Enquiries', count: enquiriesCount, conversionRateFromPrevious: 100 },
      {
        stage: 'Registered Patients',
        count: registeredCount,
        conversionRateFromPrevious:
          enquiriesCount > 0 ? Math.round((registeredCount / enquiriesCount) * 1000) / 10 : 100,
      },
      {
        stage: 'Booked Appointments',
        count: bookedCount,
        conversionRateFromPrevious:
          registeredCount > 0 ? Math.round((bookedCount / registeredCount) * 1000) / 10 : 0,
      },
      {
        stage: 'Completed Visits',
        count: completedVisits,
        conversionRateFromPrevious:
          bookedCount > 0 ? Math.round((completedVisits / bookedCount) * 1000) / 10 : 0,
      },
      {
        stage: 'Treatment Accepted',
        count: acceptedPlans,
        conversionRateFromPrevious:
          completedVisits > 0 ? Math.round((acceptedPlans / completedVisits) * 1000) / 10 : 0,
      },
    ];

    return {
      timeframe: 'ALL_TIME',
      stages,
    };
  }

  async exportClinicSummaryCsv(clinicId: string): Promise<string> {
    const kpis = await this.getClinicKpis(clinicId);
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Patients', String(kpis.totalPatients)],
      ['New Patients This Month', String(kpis.newPatientsThisMonth)],
      ['Total Appointments', String(kpis.totalAppointments)],
      ['Completed Appointments', String(kpis.completedAppointments)],
      ['No Show Appointments', String(kpis.noShowAppointments)],
      ['Completion Rate (%)', String(kpis.completionRate)],
      ['No Show Rate (%)', String(kpis.noShowRate)],
      ['Active Treatment Plans', String(kpis.activeTreatmentPlans)],
      ['Total Conversations', String(kpis.totalConversations)],
    ];

    return [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join(
      '\n',
    );
  }
}
