import { z } from 'zod';
import { indianPhoneSchema } from './common.js';

export const ENQUIRY_SERVICES = [
  'general-dentistry',
  'root-canal-treatment',
  'teeth-whitening',
  'dental-implants',
  'braces-and-orthodontics',
  'pediatric-dentistry',
  'dental-x-rays',
  'other-dental-procedures',
  'not-sure',
] as const;

export const PREFERRED_TIMES = ['morning', 'afternoon', 'evening', 'any'] as const;

/** Minimum time a human needs to fill the form; faster submissions are treated as bots. */
export const ENQUIRY_MIN_FILL_MS = 3_000;

/**
 * Website enquiry form. Shared by the browser form and the API.
 * Deliberately collects no medical details: the message field warns against them.
 */
export const enquiryFormSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  phone: indianPhoneSchema,
  email: z
    .union([z.literal(''), z.email('Enter a valid email address')])
    .optional()
    .transform((v) => (v ? v : undefined)),
  service: z.enum(ENQUIRY_SERVICES),
  preferredTime: z.enum(PREFERRED_TIMES),
  message: z.string().trim().max(1000, 'Please keep the message under 1000 characters').optional(),
  /** Required: consent to be contacted about this enquiry (operational communication). */
  consentToContact: z
    .boolean()
    .refine((v) => v, { message: 'Please agree so we can reply to your enquiry' }),
  /** Optional, separate: promotional messages (never pre-ticked). */
  consentToPromotions: z.boolean().default(false),
});

/** Extra fields sent with the form for spam protection and attribution (not shown to users). */
export const enquirySubmissionSchema = enquiryFormSchema.extend({
  /** Honeypot: must stay empty. */
  website: z.string().max(0).optional(),
  /** Milliseconds between form render and submit. */
  elapsedMs: z.number().int().nonnegative(),
  source: z
    .object({
      page: z.string().max(200),
      referrer: z.string().max(500).optional(),
      utmSource: z.string().max(100).optional(),
      utmMedium: z.string().max(100).optional(),
      utmCampaign: z.string().max(100).optional(),
    })
    .optional(),
});

export type EnquiryFormInput = z.input<typeof enquiryFormSchema>;
export type EnquiryForm = z.infer<typeof enquiryFormSchema>;
export type EnquirySubmission = z.infer<typeof enquirySubmissionSchema>;

export const enquiryAcceptedSchema = z.object({
  id: z.uuid(),
  receivedAt: z.string(),
});
