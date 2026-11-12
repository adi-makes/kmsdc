import { Container, Section } from '@kmsdc/ui';
import { CircleCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookingCta } from '@/components/public/booking-cta';
import { FaqList, PageIntro } from '@/components/public/sections';
import { clinic } from '@/content/clinic-profile';
import { SERVICES, assertPublishable, getService } from '@/content/services';
import { APP_ENV, pageMetadata } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return pageMetadata({
    title: `${service.name} in ${clinic.address.locality}`,
    description: service.summary,
    path: `/services/${service.slug}`,
  });
}

export default async function ServicePage({ params }: { params: Params }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  assertPublishable(service, APP_ENV);

  const others = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 4);

  return (
    <>
      <PageIntro
        title={service.name}
        lead={service.intro}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: service.name },
        ]}
      >
        <BookingCta serviceName={service.name} />
      </PageIntro>

      <Section>
        <Container className="grid gap-12 lg:grid-cols-[1fr_20rem]">
          <article className="flex max-w-3xl flex-col gap-10">
            {service.sections.map((section) => (
              <section key={section.heading} className="flex flex-col gap-3">
                <h2 className="font-heading text-2xl font-semibold text-fg">{section.heading}</h2>
                {section.body ? <p className="leading-7 text-fg-muted">{section.body}</p> : null}
                {section.points ? (
                  <ul className="flex flex-col gap-2">
                    {section.points.map((p) => (
                      <li key={p} className="flex gap-3 leading-7 text-fg">
                        <CircleCheck
                          aria-hidden="true"
                          className="mt-1 size-5 shrink-0 text-fg-brand"
                        />
                        {p}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            {service.faqs.length > 0 ? (
              <section className="flex flex-col gap-4">
                <h2 className="font-heading text-2xl font-semibold text-fg">Common questions</h2>
                <FaqList faqs={service.faqs} />
              </section>
            ) : null}

            <p className="rounded-lg border border-border bg-bg-subtle p-4 text-sm text-fg-muted">
              This page gives general information only and is not a substitute for an examination.
              Your dentist will advise whether a treatment is suitable for you, and explain the
              options and costs before starting.
            </p>
          </article>

          <aside
            aria-label="Book and related services"
            className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-brand-subtle p-6">
              <p className="font-heading text-lg font-semibold text-fg">Book a consultation</p>
              <p className="text-sm text-fg-muted">
                Tell us you are interested in {service.name.toLowerCase()} and we will arrange a
                time.
              </p>
              <BookingCta serviceName={service.name} size="md" />
            </div>
            <nav aria-labelledby="related-services" className="flex flex-col gap-3">
              <h2
                id="related-services"
                className="text-sm font-semibold tracking-wide text-fg-muted uppercase"
              >
                Other services
              </h2>
              <ul className="flex flex-col gap-2">
                {others.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} className="text-fg-link hover:underline">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </Container>
      </Section>
    </>
  );
}
