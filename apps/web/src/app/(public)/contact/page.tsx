import { Container, Section } from '@kmsdc/ui';
import { BookingCta } from '@/components/public/booking-cta';
import { EnquiryForm } from '@/components/public/enquiry-form';
import { AlternativeContact, ContactDetails, PageIntro } from '@/components/public/sections';
import { clinic, clinicLocation } from '@/content/clinic-profile';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Contact and location',
  description: `Contact ${clinic.name} in ${clinicLocation}. Book on WhatsApp or send an enquiry.`,
  path: '/contact',
});

export default function ContactPage() {
  return (
    <>
      <PageIntro
        title="Contact us"
        lead="Book an appointment or ask a question. The clinic team will get back to you."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      >
        {clinic.whatsappNumber ? <BookingCta /> : null}
      </PageIntro>
      <Section>
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <h2 className="font-heading text-2xl font-semibold text-fg">Clinic details</h2>
            <ContactDetails />
          </div>
          <section
            id="enquiry"
            aria-labelledby="enquiry-title"
            className="flex scroll-mt-24 flex-col gap-5 rounded-2xl border border-border bg-surface p-6 sm:p-8"
          >
            <h2 id="enquiry-title" className="font-heading text-2xl font-semibold text-fg">
              Send an enquiry
            </h2>
            <EnquiryForm alternativeContact={<AlternativeContact />} />
          </section>
        </Container>
      </Section>
    </>
  );
}
