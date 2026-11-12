import { Container, SectionHeader } from '@kmsdc/ui';
import Link from 'next/link';

/** Temporary landing page — replaced by the public website in Phase 3. */
export default function HomePage() {
  return (
    <main id="main-content" className="flex min-h-dvh items-center py-16">
      <Container className="flex flex-col gap-6">
        <SectionHeader
          as="h1"
          eyebrow="Development build"
          title="Kottakal Multispeciality Dental Clinic"
          description="The platform foundation is running. The public website is built in Phase 3."
        />
        <ul className="flex flex-col gap-2 text-fg-muted">
          <li>
            <Link className="text-fg-link underline" href="/app/design-system">
              Design system
            </Link>
          </li>
          <li>
            <a className="text-fg-link underline" href="/healthz">
              Web health
            </a>
          </li>
        </ul>
      </Container>
    </main>
  );
}
