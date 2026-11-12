import { Breadcrumbs, Container, type BreadcrumbItem } from '@kmsdc/ui';
import {
  ArrowRight,
  Baby,
  Clock,
  Crosshair,
  Mail,
  MapPin,
  Phone,
  ScanLine,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { clinic, clinicLocation } from '@/content/clinic-profile';
import type { Faq } from '@/content/faqs';
import type { ServiceContent, ServiceSlug } from '@/content/services';
import { formatIndianPhone, formatOpeningHours, telLink } from '@/lib/site';

/** Intro band for inner pages: breadcrumbs, one h1 and a short lead. */
export function PageIntro({
  title,
  lead,
  breadcrumbs,
  children,
}: {
  title: string;
  lead?: ReactNode;
  breadcrumbs: readonly BreadcrumbItem[];
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-bg-brand-subtle">
      <Container className="flex flex-col gap-5 py-12 sm:py-16">
        <Breadcrumbs items={breadcrumbs} linkComponent={Link} />
        <h1 className="max-w-3xl font-heading text-4xl font-semibold text-fg sm:text-5xl">
          {title}
        </h1>
        {lead ? <p className="max-w-2xl text-lg leading-8 text-fg-muted">{lead}</p> : null}
        {children}
      </Container>
    </div>
  );
}

/* Lucide icons chosen for recognisability; they illustrate categories, not clinical findings. */
const SERVICE_ICONS: Record<ServiceSlug, LucideIcon> = {
  'general-dentistry': Stethoscope,
  'root-canal-treatment': Crosshair,
  'teeth-whitening': Sparkles,
  'dental-implants': ShieldCheck,
  'braces-and-orthodontics': Smile,
  'pediatric-dentistry': Baby,
  'dental-x-rays': ScanLine,
  'other-dental-procedures': Stethoscope,
};

export function ServiceCard({
  service,
  headingLevel = 'h3',
}: {
  service: ServiceContent;
  headingLevel?: 'h2' | 'h3';
}) {
  const Icon = SERVICE_ICONS[service.slug];
  const Heading = headingLevel;
  return (
    <li className="group relative flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 transition-colors hover:border-border-brand hover:bg-bg-brand-subtle">
      <span className="flex size-11 items-center justify-center rounded-lg bg-primary-subtle text-fg-brand">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <Heading className="font-heading text-lg font-semibold text-fg">
        <Link
          href={`/services/${service.slug}`}
          className="after:absolute after:inset-0 after:rounded-xl"
        >
          {service.name}
        </Link>
      </Heading>
      <p className="text-sm leading-6 text-fg-muted">{service.summary}</p>
      <span
        aria-hidden="true"
        className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-fg-brand"
      >
        Learn more{' '}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </li>
  );
}

/** Accessible, no-JS FAQ accordion using native <details>/<summary>. */
export function FaqList({ faqs }: { faqs: readonly Faq[] }) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface">
      {faqs.map((faq) => (
        <details
          key={faq.question}
          className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium text-fg">
            {faq.question}
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bg-muted text-fg-muted transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="pb-4 leading-7 text-fg-muted">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

const DT = 'flex items-center gap-3 font-semibold text-fg';
const ICON = 'size-5 shrink-0 text-fg-brand';

/** Location, hours and contact — shows only what the clinic has confirmed. */
export function ContactDetails() {
  const hours = clinic.openingHours ? formatOpeningHours(clinic.openingHours) : null;
  return (
    <dl className="flex flex-col gap-6">
      <div>
        <dt className={DT}>
          <MapPin aria-hidden="true" className={ICON} />
          Location
        </dt>
        <dd className="pl-8 text-fg-muted">
          {clinic.address.streetAddress ? (
            <>
              {clinic.address.streetAddress}
              <br />
            </>
          ) : null}
          {clinicLocation}
          {clinic.address.postalCode ? ` ${clinic.address.postalCode}` : ''}
          {clinic.mapUrl ? (
            <>
              <br />
              <a
                href={clinic.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg-link underline"
              >
                Get directions<span className="sr-only"> (opens Google Maps)</span>
              </a>
            </>
          ) : (
            <>
              <br />
              <span className="text-sm">The full address and map will be added soon.</span>
            </>
          )}
        </dd>
      </div>
      <div>
        <dt className={DT}>
          <Clock aria-hidden="true" className={ICON} />
          Opening hours
        </dt>
        <dd className="pl-8 text-fg-muted">
          {hours ? (
            <table className="mt-1 w-full max-w-sm text-sm">
              <caption className="sr-only">Opening hours</caption>
              <tbody>
                {hours.map((row) => (
                  <tr key={row.day}>
                    <th scope="row" className="py-0.5 pr-4 text-left font-normal">
                      {row.day}
                    </th>
                    <td className="py-0.5 tabular">{row.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            'Please contact the clinic for current timings.'
          )}
        </dd>
      </div>
      {clinic.phoneNumbers.length > 0 ? (
        <div>
          <dt className={DT}>
            <Phone aria-hidden="true" className={ICON} />
            Phone
          </dt>
          {clinic.phoneNumbers.map((p) => (
            <dd key={p} className="pl-8">
              <a href={telLink(p)} className="text-fg-link underline">
                {formatIndianPhone(p)}
              </a>
            </dd>
          ))}
        </div>
      ) : null}
      {clinic.email ? (
        <div>
          <dt className={DT}>
            <Mail aria-hidden="true" className={ICON} />
            Email
          </dt>
          <dd className="pl-8">
            <a href={`mailto:${clinic.email}`} className="text-fg-link underline">
              {clinic.email}
            </a>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

/** Shown with form errors so visitors always have another working way to reach the clinic. */
export function AlternativeContact() {
  const phone = clinic.phoneNumbers[0];
  if (!clinic.whatsappNumber && !phone) {
    return <p>Please try again later.</p>;
  }
  return (
    <p>
      You can also reach the clinic
      {clinic.whatsappNumber ? ' on WhatsApp' : ''}
      {clinic.whatsappNumber && phone ? ' or' : ''}
      {phone ? (
        <>
          {' '}
          by phone at{' '}
          <a className="underline" href={telLink(phone)}>
            {formatIndianPhone(phone)}
          </a>
        </>
      ) : null}
      .
    </p>
  );
}
