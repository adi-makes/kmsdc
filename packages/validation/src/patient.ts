import { z } from 'zod';
import { indianPhoneSchema } from './common.js';

export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'] as const;
export type Gender = (typeof GENDERS)[number];

export const PATIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'MERGED', 'ANONYMISED'] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export const createPatientSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  dateOfBirth: z.iso.date().optional(),
  gender: z.enum(GENDERS).default('UNDISCLOSED'),
  primaryPhone: indianPhoneSchema,
  email: z.email().optional(),
  emergencyContact: z.string().trim().max(100).optional(),
  emergencyPhone: indianPhoneSchema.optional(),
  addressLine1: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code')
    .optional(),
  notes: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial().extend({
  status: z.enum(PATIENT_STATUSES).optional(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export const mergePatientSchema = z.object({
  sourcePatientId: z.uuid(),
  targetPatientId: z.uuid(),
  reason: z.string().trim().min(5).max(500),
});

export type MergePatientInput = z.infer<typeof mergePatientSchema>;

export const patientConsentSchema = z.object({
  purpose: z.enum(['CLINICAL_TREATMENT', 'OPERATIONAL_MESSAGING', 'PROMOTIONAL_MESSAGING']),
  status: z.enum(['GRANTED', 'WITHDRAWN']),
  noticeVersion: z.string().min(1).default('2026-11-01'),
  notes: z.string().trim().max(500).optional(),
});

export type PatientConsentInput = z.infer<typeof patientConsentSchema>;
