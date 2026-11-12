import { Container, Section } from '@kmsdc/ui';
import { BookingCta } from '@/components/public/booking-cta';
import { PageIntro, ServiceCard } from '@/components/public/sections';
import { clinic } from '@/content/clinic-profile';
import { SERVICES } from '@/content/services';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Dental services',
  description: `Dental services at ${clinic.name}: general dentistry, root canal treatment, teeth whitening, implants, braces, pediatric dentistry and dental X-rays.`,
  path: '/services',
});

export default function ServicesPage() {
  return (
    <>
      <PageIntro
        title="Dental services"
        lead="General information about the treatments offered at the clinic. Your dentist will examine you and recommend what is right for you."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Services' }]}
      >
        <BookingCta />
      </PageIntro>
      <Section>
        <Container>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <ServiceCard key={s.slug} service={s} headingLevel="h2" />
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
