import { clinicProfileSchema, type ClinicProfile } from '@kmsdc/validation';

/**
 * The clinic's public profile — SINGLE SOURCE for the website.
 *
 * Only facts the clinic has confirmed are filled in. Everything else is `null` / empty and
 * the site hides or disables what depends on it. To complete the site, fill these in from
 * docs/product/clinic-information-checklist.md (or, from Phase 4, via Settings in the staff
 * workspace once the profile is served by the API).
 *
 * Validated at build time: an invalid value (e.g. a malformed phone number) fails the build.
 */
const profile: ClinicProfile = {
  name: 'Kottakal Multispeciality Dental Clinic',
  shortName: 'Kottakal Dental',
  address: {
    streetAddress: null, // TODO(clinic): street address
    locality: 'Pathanamthitta',
    region: 'Kerala',
    postalCode: null, // TODO(clinic): 6-digit PIN code
    country: 'IN',
  },
  mapUrl: null, // TODO(clinic): Google Maps link
  geo: null, // TODO(clinic): latitude/longitude for structured data
  whatsappNumber: null, // TODO(clinic): booking number in +91XXXXXXXXXX format
  phoneNumbers: [], // TODO(clinic)
  email: null, // TODO(clinic)
  openingHours: null, // TODO(clinic): 7 days, sessions in 24h HH:MM
  doctors: [], // TODO(clinic): verified names, qualifications, registration numbers
  facilities: [], // TODO(clinic): verified facilities
  testimonials: [], // Only with written patient consent
  social: {
    instagram: null,
    facebook: null,
    youtube: null,
    linkedin: null,
    googleBusinessProfile: null,
  },
  legal: {
    grievanceOfficerName: null,
    grievanceOfficerEmail: null,
    privacyPolicyReviewedOn: null,
    termsReviewedOn: null,
  },
};

export const clinic: ClinicProfile = clinicProfileSchema.parse(profile);

/** "Pathanamthitta, Kerala" */
export const clinicLocation = `${clinic.address.locality}, ${clinic.address.region}`;
