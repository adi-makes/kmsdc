import { whatsappBookingUrl, type OpeningHours } from '@kmsdc/validation';
import type { Metadata } from 'next';
import { clinic, clinicLocation } from '@/content/clinic-profile';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);
export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? 'development';

/** Per-page metadata with canonical URL and Open Graph, consistent across the site. */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      siteName: clinic.name,
      title: `${title} | ${clinic.shortName}`,
      description,
      url: path,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/** WhatsApp link with a prefilled, non-sensitive message; null when no number is configured. */
export function bookingLink(serviceName?: string): string | null {
  const message = serviceName
    ? `Hello ${clinic.shortName}, I would like to book an appointment for ${serviceName.toLowerCase()}.`
    : `Hello ${clinic.shortName}, I would like to book an appointment.`;
  return whatsappBookingUrl(clinic.whatsappNumber, message);
}

export function telLink(e164: string): string {
  return `tel:${e164}`;
}

/** "+91 98765 43210" */
export function formatIndianPhone(e164: string): string {
  const d = e164.replace(/^\+91/, '');
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

const DAY_LABEL: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function to12h(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0
    ? `${String(hour)} ${suffix}`
    : `${String(hour)}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatOpeningHours(hours: OpeningHours): { day: string; text: string }[] {
  return hours.map((d) => ({
    day: DAY_LABEL[d.day] ?? d.day,
    text:
      d.sessions.length === 0
        ? 'Closed'
        : d.sessions.map((s) => `${to12h(s.opens)} – ${to12h(s.closes)}`).join(', '),
  }));
}

/**
 * schema.org Dentist structured data built ONLY from verified profile fields.
 * Unknown fields are omitted rather than guessed.
 */
export function dentistJsonLd(): Record<string, unknown> {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    '@id': `${SITE_URL}/#dentist`,
    name: clinic.name,
    url: SITE_URL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: clinic.address.locality,
      addressRegion: clinic.address.region,
      addressCountry: clinic.address.country,
      ...(clinic.address.streetAddress ? { streetAddress: clinic.address.streetAddress } : {}),
      ...(clinic.address.postalCode ? { postalCode: clinic.address.postalCode } : {}),
    },
    areaServed: clinicLocation,
  };
  if (clinic.phoneNumbers[0]) data.telephone = clinic.phoneNumbers[0];
  if (clinic.email) data.email = clinic.email;
  if (clinic.geo) {
    data.geo = {
      '@type': 'GeoCoordinates',
      latitude: clinic.geo.latitude,
      longitude: clinic.geo.longitude,
    };
  }
  if (clinic.mapUrl) data.hasMap = clinic.mapUrl;
  if (clinic.openingHours) {
    data.openingHoursSpecification = clinic.openingHours.flatMap((d) =>
      d.sessions.map((s) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${DAY_LABEL[d.day] ?? d.day}`,
        opens: s.opens,
        closes: s.closes,
      })),
    );
  }
  const sameAs = Object.values(clinic.social).filter((v): v is string => Boolean(v));
  if (sameAs.length > 0) data.sameAs = sameAs;
  return data;
}

/** Serialises JSON-LD safely for a <script> tag (escapes "<" to prevent breaking out). */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
