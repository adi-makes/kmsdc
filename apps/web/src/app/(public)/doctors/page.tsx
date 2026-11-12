import { Container, EmptyState, Section } from '@kmsdc/ui';
import { UserRound } from 'lucide-react';
import { BookingCta } from '@/components/public/booking-cta';
import { PageIntro } from '@/components/public/sections';
import { clinic } from '@/content/clinic-profile';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Our dentists',
  description: `The dental team at ${clinic.name}.`,
  path: '/doctors',
});

/** Doctor profiles render ONLY from verified data in the clinic profile — never invented. */
export default function DoctorsPage() {
  return (
    <>
      <PageIntro
        title="Our dentists"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Doctors' }]}
      />
      <Section>
        <Container>
          {clinic.doctors.length === 0 ? (
            <EmptyState
              icon={UserRound}
              title="Dentist profiles coming soon"
              description="Profiles of the clinic's dentists, with their qualifications, will be published here shortly."
              action={<BookingCta size="md" />}
            />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clinic.doctors.map((d) => (
                <li
                  key={d.name}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-6"
                >
                  <h2 className="font-heading text-xl font-semibold text-fg">{d.name}</h2>
                  <p className="text-sm font-medium text-fg-brand">{d.qualifications}</p>
                  {d.specialties.length > 0 ? (
                    <p className="text-sm text-fg-muted">{d.specialties.join(' · ')}</p>
                  ) : null}
                  {d.registrationNumber ? (
                    <p className="text-xs text-fg-muted">Registration no. {d.registrationNumber}</p>
                  ) : null}
                  {d.bio ? <p className="pt-2 leading-7 text-fg-muted">{d.bio}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
