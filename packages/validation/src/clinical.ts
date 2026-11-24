import { z } from 'zod';
import {
  ALL_TEETH_FDI,
  TOOTH_SURFACES,
  TOOTH_CONDITIONS,
  TOOTH_CONDITION_STATUSES,
  TREATMENT_PLAN_STATUSES,
} from '@kmsdc/types';

export const medicalHistorySchema = z.object({
  conditions: z.record(z.string(), z.boolean().or(z.string())),
  notes: z.string().trim().max(2000).optional(),
});

export type MedicalHistoryInput = z.infer<typeof medicalHistorySchema>;

export const allergySchema = z.object({
  substance: z.string().trim().min(2).max(100),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
  reaction: z.string().trim().max(500).optional(),
});

export type AllergyInput = z.infer<typeof allergySchema>;

export const medicationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  dosage: z.string().trim().max(100).optional(),
});

export type MedicationInput = z.infer<typeof medicationSchema>;

export const createEncounterSchema = z.object({
  patientId: z.uuid(),
  dentistId: z.uuid(),
  appointmentId: z.uuid().optional(),
  chiefComplaint: z.string().trim().min(3).max(1000),
  examination: z.string().trim().max(2000).optional(),
});

export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;

export const createDiagnosisSchema = z.object({
  description: z.string().trim().min(3).max(500),
  toothFdi: z.enum(ALL_TEETH_FDI as unknown as [string, ...string[]]).optional(),
  code: z.string().trim().max(50).optional(),
});

export type CreateDiagnosisInput = z.infer<typeof createDiagnosisSchema>;

export const createClinicalNoteSchema = z.object({
  content: z.string().trim().min(5),
});

export type CreateClinicalNoteInput = z.infer<typeof createClinicalNoteSchema>;

export const amendClinicalNoteSchema = z.object({
  content: z.string().trim().min(5),
  amendmentReason: z.string().trim().min(5).max(500),
});

export type AmendClinicalNoteInput = z.infer<typeof amendClinicalNoteSchema>;

export const prescriptionItemSchema = z.object({
  drug: z.string().trim().min(2).max(100),
  dose: z.string().trim().min(1).max(50),
  frequency: z.string().trim().min(1).max(50),
  duration: z.string().trim().min(1).max(50),
  instructions: z.string().trim().max(500).optional(),
});

export const createPrescriptionSchema = z.object({
  items: z.array(prescriptionItemSchema).min(1),
  notes: z.string().trim().max(500).optional(),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

export const toothConditionSchema = z.object({
  toothFdi: z.enum(ALL_TEETH_FDI as unknown as [string, ...string[]]),
  surfaces: z.array(z.enum(TOOTH_SURFACES as unknown as [string, ...string[]])).default([]),
  condition: z.enum(TOOTH_CONDITIONS as unknown as [string, ...string[]]),
  status: z.enum(TOOTH_CONDITION_STATUSES as unknown as [string, ...string[]]).default('EXISTING'),
  material: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type ToothConditionInput = z.infer<typeof toothConditionSchema>;

export const treatmentItemSchema = z.object({
  procedure: z.string().trim().min(2).max(150),
  teethFdi: z.array(z.enum(ALL_TEETH_FDI as unknown as [string, ...string[]])).default([]),
  surfaces: z.array(z.enum(TOOTH_SURFACES as unknown as [string, ...string[]])).default([]),
  estimateCost: z.number().int().nonnegative(),
  actualCost: z.number().int().nonnegative().optional(),
  plannedVisit: z.number().int().min(1).default(1),
  notes: z.string().trim().max(500).optional(),
});

export const createTreatmentPlanSchema = z.object({
  patientId: z.uuid(),
  dentistId: z.uuid(),
  title: z.string().trim().min(3).max(150),
  notes: z.string().trim().max(2000).optional(),
  items: z.array(treatmentItemSchema).min(1),
});

export type CreateTreatmentPlanInput = z.infer<typeof createTreatmentPlanSchema>;

export const updateTreatmentPlanStatusSchema = z.object({
  status: z.enum(TREATMENT_PLAN_STATUSES as unknown as [string, ...string[]]),
});

export type UpdateTreatmentPlanStatusInput = z.infer<typeof updateTreatmentPlanStatusSchema>;
