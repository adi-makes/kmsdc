import { describe, expect, it } from 'vitest';
import { whatsappBookingUrl } from './clinic.js';
import { enquiryFormSchema, enquirySubmissionSchema } from './enquiry.js';

describe('whatsappBookingUrl', () => {
  it('returns null when no number is configured (never a fake link)', () => {
    expect(whatsappBookingUrl(null, 'Hi')).toBeNull();
  });
  it('builds a wa.me link with an encoded prefilled message', () => {
    expect(whatsappBookingUrl('+919876543210', 'Hello, I would like an appointment')).toBe(
      'https://wa.me/919876543210?text=Hello%2C%20I%20would%20like%20an%20appointment',
    );
  });
});

const valid = {
  name: 'Test Person',
  phone: '98765 43210',
  service: 'general-dentistry',
  preferredTime: 'morning',
  consentToContact: true,
} as const;

describe('enquiryFormSchema', () => {
  it('accepts a minimal valid enquiry and normalises the phone', () => {
    const parsed = enquiryFormSchema.parse(valid);
    expect(parsed.phone).toBe('+919876543210');
    expect(parsed.consentToPromotions).toBe(false);
    expect(parsed.email).toBeUndefined();
  });
  it('requires consent to contact', () => {
    const r = enquiryFormSchema.safeParse({ ...valid, consentToContact: false });
    expect(r.success).toBe(false);
  });
  it('treats an empty email as absent but rejects malformed ones', () => {
    expect(enquiryFormSchema.parse({ ...valid, email: '' }).email).toBeUndefined();
    expect(enquiryFormSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
  });
});

describe('enquirySubmissionSchema', () => {
  it('rejects a filled honeypot', () => {
    expect(
      enquirySubmissionSchema.safeParse({ ...valid, website: 'spam.example', elapsedMs: 9000 })
        .success,
    ).toBe(false);
  });
});
