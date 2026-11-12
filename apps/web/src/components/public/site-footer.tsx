import { Container } from '@kmsdc/ui';
import Link from 'next/link';
import { clinic, clinicLocation } from '@/content/clinic-profile';
import { SERVICES } from '@/content/services';
import { formatIndianPhone, telLink } from '@/lib/site';

const SOCIAL_LABELS: Record<keyof typeof clinic.social, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  googleBusinessProfile: 'Google',
};

export function SiteFooter() {
  const social = (Object.keys(clinic.social) as (keyof typeof clinic.social)[])
    .map((key) => ({ key, url: clinic.social[key], label: SOCIAL_LABELS[key] }))
    .filter((s): s is { key: keyof typeof clinic.social; url: string; label: string } =>
      Boolean(s.url),
    );

  return (
    <footer className="bg-bg-inverse text-fg-inverse">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <p className="font-heading text-lg font-semibold">{clinic.name}</p>
          <p className="text-sm text-brand-200">{clinicLocation}, India</p>
        </div>

        <nav aria-labelledby="footer-services" className="flex flex-col gap-3">
          <h2
            id="footer-services"
            className="text-sm font-semibold tracking-wide text-brand-200 uppercase"
          >
            Services
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="hover:underline">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-clinic" className="flex flex-col gap-3">
          <h2
            id="footer-clinic"
            className="text-sm font-semibold tracking-wide text-brand-200 uppercase"
          >
            Clinic
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {[
              ['/about', 'About'],
              ['/doctors', 'Doctors'],
              ['/facilities', 'Facilities'],
              ['/faqs', 'FAQs'],
              ['/contact', 'Contact'],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href ?? '/'} className="hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-brand-200 uppercase">Contact</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {clinic.phoneNumbers.map((p) => (
              <li key={p}>
                <a href={telLink(p)} className="hover:underline">
                  {formatIndianPhone(p)}
                </a>
              </li>
            ))}
            {clinic.email ? (
              <li>
                <a href={`mailto:${clinic.email}`} className="hover:underline">
                  {clinic.email}
                </a>
              </li>
            ) : null}
            <li>
              <Link href="/contact" className="hover:underline">
                Send an enquiry
              </Link>
            </li>
          </ul>
          {social.length > 0 ? (
            <ul className="flex flex-wrap gap-3 text-sm" aria-label="Social media">
              {social.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.url}
                    className="hover:underline"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-sm text-brand-200 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {clinic.name}
          </p>
          <ul className="flex gap-4">
            <li>
              <Link href="/privacy" className="hover:underline">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:underline">
                Terms of use
              </Link>
            </li>
          </ul>
        </Container>
      </div>
      {/* Spacer so the mobile booking bar never covers footer links. */}
      <div aria-hidden="true" className="h-20 lg:hidden" />
    </footer>
  );
}
