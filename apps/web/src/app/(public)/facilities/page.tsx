import { Container, EmptyState, Section } from '@kmsdc/ui';
import { Building2 } from 'lucide-react';
import Link from 'next/link';
import { PageIntro } from '@/components/public/sections';
import { clinic } from '@/content/clinic-profile';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Clinic facilities',
  description: `Facilities at ${clinic.name}.`,
  path: '/facilities',
});

/** Facilities render only from verified clinic data. */
export default function FacilitiesPage() {
  return (
    <>
      <PageIntro
        title="Clinic facilities"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Facilities' }]}
      />
      <Section>
        <Container>
          {clinic.facilities.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Facility details coming soon"
              description="Photos and details of the clinic's facilities will be added here shortly."
              action={
                <Link href="/services" className="text-fg-link underline">
                  See the services the clinic offers
                </Link>
              }
            />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {clinic.facilities.map((f) => (
                <li
                  key={f.name}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-6"
                >
                  <h2 className="font-heading text-xl font-semibold text-fg">{f.name}</h2>
                  <p className="leading-7 text-fg-muted">{f.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
