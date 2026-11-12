/**
 * Controlled vocabularies shared by every app. Mirrors docs/database/data-dictionary.md;
 * update both together.
 */

export const ROLE_KEYS = [
  'SUPER_ADMIN',
  'CLINIC_ADMIN',
  'DENTIST',
  'RECEPTIONIST',
  'DENTAL_ASSISTANT',
  'ACCOUNTANT',
  'MARKETING_MANAGER',
  'PATIENT',
] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const APPOINTMENT_STATUSES = [
  'REQUESTED',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'RESCHEDULED',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** States that occupy a dentist/chair slot (ADR-009). */
export const SLOT_BLOCKING_STATUSES = [
  'REQUESTED',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
] as const satisfies readonly AppointmentStatus[];

/** Allowed lifecycle transitions; enforced server-side. */
export const APPOINTMENT_TRANSITIONS: Readonly<
  Record<AppointmentStatus, readonly AppointmentStatus[]>
> = {
  REQUESTED: ['CONFIRMED', 'CANCELLED', 'RESCHEDULED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
  CHECKED_IN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  RESCHEDULED: [],
};

export function canTransitionAppointment(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return APPOINTMENT_TRANSITIONS[from].includes(to);
}

export const CONSENT_PURPOSES = [
  'CLINICAL_PROCESSING',
  'OPERATIONAL_COMMS',
  'PROMOTIONAL_COMMS',
  'ANALYTICS',
] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export const CHANNELS = ['WHATSAPP', 'SMS', 'EMAIL', 'WEB'] as const;
export type Channel = (typeof CHANNELS)[number];

export const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'ONLINE'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** How an external integration is currently operating (ADR-010). */
export const INTEGRATION_MODES = ['mock', 'live', 'unavailable'] as const;
export type IntegrationMode = (typeof INTEGRATION_MODES)[number];

export const CLINIC_TIMEZONE = 'Asia/Kolkata';
export const CURRENCY = 'INR';
