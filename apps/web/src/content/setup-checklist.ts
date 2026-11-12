import { clinic } from './clinic-profile';
import { SERVICES } from './services';

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  /** What the website does while the item is missing. */
  whileMissing: string;
  group: 'Clinic details' | 'Branding' | 'Content review' | 'Legal';
}

/** Derived from the live clinic profile, so it is always accurate. */
export function getSetupChecklist(): ChecklistItem[] {
  const unreviewed = SERVICES.filter((s) => s.review.status !== 'approved');
  return [
    {
      id: 'address',
      group: 'Clinic details',
      label: 'Street address and PIN code',
      done: Boolean(clinic.address.streetAddress && clinic.address.postalCode),
      whileMissing: 'Only the city is shown; structured data omits the street.',
    },
    {
      id: 'map',
      group: 'Clinic details',
      label: 'Google Maps link and coordinates',
      done: Boolean(clinic.mapUrl && clinic.geo),
      whileMissing: '"Get directions" is hidden.',
    },
    {
      id: 'whatsapp',
      group: 'Clinic details',
      label: 'WhatsApp booking number',
      done: Boolean(clinic.whatsappNumber),
      whileMissing: 'Booking buttons link to the enquiry form instead of WhatsApp.',
    },
    {
      id: 'phone',
      group: 'Clinic details',
      label: 'Phone number(s)',
      done: clinic.phoneNumbers.length > 0,
      whileMissing: 'No phone number is shown.',
    },
    {
      id: 'email',
      group: 'Clinic details',
      label: 'Email address',
      done: Boolean(clinic.email),
      whileMissing: 'No email is shown.',
    },
    {
      id: 'hours',
      group: 'Clinic details',
      label: 'Opening hours',
      done: Boolean(clinic.openingHours),
      whileMissing: '"Please contact the clinic for current timings."',
    },
    {
      id: 'doctors',
      group: 'Clinic details',
      label: 'Dentist profiles (verified names and qualifications)',
      done: clinic.doctors.length > 0,
      whileMissing: 'Doctors page shows "profiles coming soon"; homepage section hidden.',
    },
    {
      id: 'facilities',
      group: 'Clinic details',
      label: 'Facilities',
      done: clinic.facilities.length > 0,
      whileMissing: 'Facilities page shows "coming soon".',
    },
    {
      id: 'social',
      group: 'Clinic details',
      label: 'Social media and Google Business Profile links',
      done: Object.values(clinic.social).some(Boolean),
      whileMissing: 'Social links hidden.',
    },
    {
      id: 'testimonials',
      group: 'Clinic details',
      label: 'Testimonials with written patient consent (optional)',
      done: clinic.testimonials.length > 0,
      whileMissing: 'Testimonials section hidden.',
    },
    {
      id: 'logo',
      group: 'Branding',
      label: 'Logo, brand colours, fonts and photography',
      done: false,
      whileMissing: 'Provisional teal palette and "K" monogram are used.',
    },
    {
      id: 'service-review',
      group: 'Content review',
      label: `Dentist review of service pages (${String(SERVICES.length - unreviewed.length)}/${String(SERVICES.length)} approved)`,
      done: unreviewed.length === 0,
      whileMissing: 'Pages show in development/preview; production builds are blocked.',
    },
    {
      id: 'privacy',
      group: 'Legal',
      label: 'Privacy policy legal review and grievance officer',
      done: Boolean(clinic.legal.privacyPolicyReviewedOn && clinic.legal.grievanceOfficerName),
      whileMissing: 'Shown as a draft; production builds are blocked.',
    },
    {
      id: 'terms',
      group: 'Legal',
      label: 'Terms of use legal review',
      done: Boolean(clinic.legal.termsReviewedOn),
      whileMissing: 'Shown as a draft; production builds are blocked.',
    },
  ];
}
