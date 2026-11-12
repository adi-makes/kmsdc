import { z } from 'zod';

/**
 * Public clinic profile. Every field the clinic has not supplied is `null` and the website
 * hides or disables whatever depends on it — values are never invented
 * (docs/product/clinic-information-checklist.md).
 */

const e164India = z.string().regex(/^\+91[1-9]\d{9}$/, 'Use E.164 format, e.g. +91XXXXXXXXXX');

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:MM');

export const openingHoursSchema = z
  .array(
    z.object({
      day: z.enum(WEEKDAYS),
      /** One or more sessions, e.g. morning and evening. Empty array = closed. */
      sessions: z.array(z.object({ opens: hhmm, closes: hhmm })),
    }),
  )
  .length(7);

export const doctorProfileSchema = z.object({
  name: z.string().min(2),
  /** Exactly as registered, e.g. "BDS, MDS (Endodontics)". */
  qualifications: z.string().min(2),
  registrationNumber: z.string().nullable(),
  specialties: z.array(z.string()),
  bio: z.string().nullable(),
  photoUrl: z.string().nullable(),
});

export const testimonialSchema = z.object({
  quote: z.string().min(10),
  /** Display name exactly as the patient consented to (e.g. "R. Nair"). */
  attribution: z.string().min(1),
  /** Written consent reference — testimonials without consent must not be published. */
  consentReference: z.string().min(1),
});

export const clinicProfileSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  address: z.object({
    streetAddress: z.string().nullable(),
    locality: z.string().min(1),
    region: z.string().min(1),
    postalCode: z
      .string()
      .regex(/^\d{6}$/)
      .nullable(),
    country: z.string().length(2),
  }),
  /** Google Maps share link or similar. */
  mapUrl: z.url().nullable(),
  geo: z.object({ latitude: z.number(), longitude: z.number() }).nullable(),
  whatsappNumber: e164India.nullable(),
  phoneNumbers: z.array(e164India),
  email: z.email().nullable(),
  openingHours: openingHoursSchema.nullable(),
  doctors: z.array(doctorProfileSchema),
  facilities: z.array(z.object({ name: z.string(), description: z.string() })),
  testimonials: z.array(testimonialSchema),
  social: z.object({
    instagram: z.url().nullable(),
    facebook: z.url().nullable(),
    youtube: z.url().nullable(),
    linkedin: z.url().nullable(),
    googleBusinessProfile: z.url().nullable(),
  }),
  legal: z.object({
    /** DPDP Act grievance / contact person for privacy requests. */
    grievanceOfficerName: z.string().nullable(),
    grievanceOfficerEmail: z.email().nullable(),
    /** Set only after a qualified professional has reviewed the policy text. */
    privacyPolicyReviewedOn: z.iso.date().nullable(),
    termsReviewedOn: z.iso.date().nullable(),
  }),
});

export type ClinicProfile = z.infer<typeof clinicProfileSchema>;
export type DoctorProfile = z.infer<typeof doctorProfileSchema>;
export type OpeningHours = z.infer<typeof openingHoursSchema>;

/** Prefilled WhatsApp booking link, or null when no number is configured. */
export function whatsappBookingUrl(whatsappNumber: string | null, message: string): string | null {
  if (!whatsappNumber) return null;
  const digits = whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
