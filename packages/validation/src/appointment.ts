import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '@kmsdc/types';

export const APPOINTMENT_SOURCES = ['WHATSAPP', 'WEB', 'PHONE', 'WALK_IN'] as const;
export type AppointmentSource = (typeof APPOINTMENT_SOURCES)[number];

export const createAppointmentSchema = z
  .object({
    patientId: z.uuid(),
    dentistId: z.uuid(),
    branchId: z.uuid().optional(),
    chairId: z.uuid().optional(),
    typeId: z.uuid(),
    source: z.enum(APPOINTMENT_SOURCES).default('PHONE'),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'End time must be after start time',
    path: ['endsAt'],
  });

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
  reason: z.string().trim().max(500).optional(),
});

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

export const rescheduleAppointmentSchema = z
  .object({
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    dentistId: z.uuid().optional(),
    chairId: z.uuid().optional(),
    reason: z.string().trim().min(3).max(500),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'End time must be after start time',
    path: ['endsAt'],
  });

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
