import { Button, Container } from '@kmsdc/ui';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-dvh items-center bg-bg-brand-subtle">
      <Container className="flex flex-col items-start gap-5 py-24">
        <p className="text-sm font-semibold tracking-wide text-fg-brand uppercase">
          Page not found
        </p>
        <h1 className="font-heading text-4xl font-semibold text-fg sm:text-5xl">
          We couldn&rsquo;t find that page
        </h1>
        <p className="max-w-xl text-lg text-fg-muted">
          The link may be out of date. You can return to the home page or browse our services.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/">Go to home page</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/services">View services</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
