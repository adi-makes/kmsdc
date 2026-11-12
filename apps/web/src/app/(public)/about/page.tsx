import { Button, Container, Section, SectionHeader } from '@kmsdc/ui';
import Link from 'next/link';
import { BookingCta } from '@/components/public/booking-cta';
import { PageIntro } from '@/components/public/sections';
import { clinic, clinicLocation } from '@/content/clinic-profile';
import { SERVICES } from '@/content/services';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'About the clinic',
  description: `About ${clinic.name}, a multispeciality dental clinic in ${clinicLocation}.`,
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <PageIntro
        title="About the clinic"
        lead={`${clinic.name} is a multispeciality dental clinic in ${clinicLocation}, offering a range of dental treatments for adults and children.`}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
      />
      <Section>
        <Container className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <SectionHeader title="What we offer" />
            <p className="leading-7 text-fg-muted">
              The clinic provides general and specialised dental care under one roof. Each visit
              starts with an examination and a conversation about your concerns, so you understand
              the options before any treatment begins.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link className="text-fg-link hover:underline" href={`/services/${s.slug}`}>
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-bg-subtle p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-semibold text-fg">Booking is simple</h2>
            <p className="leading-7 text-fg-muted">
              {clinic.whatsappNumber
                ? 'Most patients book on WhatsApp. Send us a message and the team will confirm a time with you.'
                : 'Send us an enquiry and the team will contact you to arrange a time.'}
            </p>
            <BookingCta />
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild variant="secondary">
                <Link href="/doctors">Our dentists</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/facilities">Facilities</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
