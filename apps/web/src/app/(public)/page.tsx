import { Button, Container, Section, SectionHeader } from '@kmsdc/ui';
import { CalendarCheck, MessageCircle, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { BookingCta } from '@/components/public/booking-cta';
import { ContactDetails, FaqList, ServiceCard } from '@/components/public/sections';
import { clinic, clinicLocation } from '@/content/clinic-profile';
import { getGeneralFaqs } from '@/content/faqs';
import { SERVICES } from '@/content/services';
import { pageMetadata } from '@/lib/site';

export const metadata = {
  ...pageMetadata({
    title: `Dental clinic in ${clinic.address.locality}`,
    description: `${clinic.name} in ${clinicLocation}. General dentistry, root canal treatment, implants, braces, children's dentistry and more. Book on WhatsApp.`,
    path: '/',
  }),
  title: { absolute: `${clinic.name} | Dentist in ${clinicLocation}` },
};

const STEPS = [
  {
    icon: MessageCircle,
    title: clinic.whatsappNumber ? 'Message us on WhatsApp' : 'Send an enquiry',
    text: clinic.whatsappNumber
      ? 'Tap the booking button and send the prefilled message.'
      : 'Use the short form on our contact page.',
  },
  {
    icon: CalendarCheck,
    title: 'We confirm a time',
    text: 'The clinic team replies to agree a date and time that suits you.',
  },
  {
    icon: Stethoscope,
    title: 'Visit the clinic',
    text: 'Your dentist examines you and explains the options before any treatment.',
  },
] as const;

export default function HomePage() {
  const faqs = getGeneralFaqs().slice(0, 4);
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden bg-bg-brand-subtle">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 size-[32rem] rounded-full bg-brand-100/70"
        />
        <Container className="relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-6">
            <p className="text-sm font-semibold tracking-wide text-fg-brand uppercase">
              Dental clinic · {clinicLocation}
            </p>
            <h1
              id="hero-title"
              className="font-heading text-4xl font-semibold text-fg sm:text-5xl lg:text-6xl"
            >
              Dental care for your whole family
            </h1>
            <p className="max-w-xl text-lg leading-8 text-fg-muted">
              {clinic.name} offers general dentistry, root canal treatment, implants, braces,
              children&rsquo;s dentistry and more in {clinic.address.locality}.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <BookingCta />
              <Button asChild variant="secondary" size="lg">
                <Link href="/services">View services</Link>
              </Button>
            </div>
          </div>

          <ol
            aria-label="How booking works"
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
          >
            <li className="pb-1">
              <p className="font-heading text-lg font-semibold text-fg">Booking in three steps</p>
            </li>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <p className="font-semibold text-fg">
                      <span className="sr-only">Step {i + 1}: </span>
                      {step.title}
                    </p>
                    <p className="text-sm text-fg-muted">{step.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Container>
      </section>

      {/* Services */}
      <Section aria-labelledby="services-title">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeader
              id="services-title"
              eyebrow="Our services"
              title="Treatments under one roof"
              description="From routine check-ups to specialised procedures, your dentist will explain the options for your situation."
            />
            <Button asChild variant="link" className="shrink-0">
              <Link href="/services">All services</Link>
            </Button>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </ul>
        </Container>
      </Section>

      {/* Doctors — only when verified profiles exist */}
      {clinic.doctors.length > 0 ? (
        <Section tone="subtle" aria-labelledby="doctors-title">
          <Container className="flex flex-col gap-8">
            <SectionHeader id="doctors-title" eyebrow="Our team" title="Meet our dentists" />
            <Button asChild variant="secondary">
              <Link href="/doctors">View dentist profiles</Link>
            </Button>
          </Container>
        </Section>
      ) : null}

      {/* FAQs */}
      <Section tone="subtle" aria-labelledby="faq-title">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div className="flex flex-col gap-4">
            <SectionHeader id="faq-title" eyebrow="Questions" title="Before your visit" />
            <Button asChild variant="link" className="self-start">
              <Link href="/faqs">More questions and answers</Link>
            </Button>
          </div>
          <FaqList faqs={faqs} />
        </Container>
      </Section>

      {/* Location & contact */}
      <Section aria-labelledby="visit-title">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <SectionHeader
              id="visit-title"
              eyebrow="Visit us"
              title={`In ${clinic.address.locality}`}
              description="Book ahead so the team can keep a time for you."
            />
            <BookingCta />
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <ContactDetails />
          </div>
        </Container>
      </Section>
    </>
  );
}
