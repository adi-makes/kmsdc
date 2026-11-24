export interface ClinicKpisDto {
  totalPatients: number;
  newPatientsThisMonth: number;
  totalAppointments: number;
  completedAppointments: number;
  noShowAppointments: number;
  completionRate: number;
  noShowRate: number;
  activeTreatmentPlans: number;
  totalConversations: number;
}

export interface FunnelStageDto {
  stage: string;
  count: number;
  conversionRateFromPrevious: number;
}

export interface PatientAcquisitionFunnelDto {
  timeframe: string;
  stages: FunnelStageDto[];
}
