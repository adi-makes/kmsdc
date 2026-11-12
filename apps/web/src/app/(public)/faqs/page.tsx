import { Container, Section } from '@kmsdc/ui';
import { BookingCta } from '@/components/public/booking-cta';
import { FaqList, PageIntro } from '@/components/public/sections';
import { clinic } from '@/content/clinic-profile';
import { getGeneralFaqs } from '@/content/faqs';
import { SERVICES } from '@/content/services';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Frequently asked questions',
  description: `Answers to common questions about booking and visiting ${clinic.name}.`,
  path: '/faqs',
});

export default function FaqsPage() {
  const serviceFaqs = SERVICES.filter((s) => s.faqs.length > 0);
  return (
    <>
      <PageIntro
        title="Frequently asked questions"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'FAQs' }]}
      />
      <Section>
        <Container className="flex max-w-3xl flex-col gap-12">
          <section aria-labelledby="faq-general" className="flex flex-col gap-4">
            <h2 id="faq-general" className="font-heading text-2xl font-semibold text-fg">
              Booking and visiting
            </h2>
            <FaqList faqs={getGeneralFaqs()} />
          </section>
          <section aria-labelledby="faq-treatments" className="flex flex-col gap-4">
            <h2 id="faq-treatments" className="font-heading text-2xl font-semibold text-fg">
              About treatments
            </h2>
            <FaqList faqs={serviceFaqs.flatMap((s) => s.faqs)} />
          </section>
          <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-bg-brand-subtle p-6">
            <p className="font-heading text-lg font-semibold text-fg">Have another question?</p>
            <BookingCta size="md" />
          </div>
        </Container>
      </Section>
    </>
  );
}
