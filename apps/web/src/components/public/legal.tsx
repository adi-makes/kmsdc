import { Alert, Container, Section } from '@kmsdc/ui';
import type { ReactNode } from 'react';

/**
 * Legal pages are drafts until reviewed by a qualified professional. In production builds an
 * unreviewed document fails the build rather than being published as if it were final.
 */
export function assertLegalReviewed(
  reviewedOn: string | null,
  document: string,
  appEnv: string,
): void {
  if (appEnv === 'production' && !reviewedOn) {
    throw new Error(
      `${document} has not been legally reviewed and cannot be published to production.`,
    );
  }
}

export function LegalDocument({
  reviewedOn,
  children,
}: {
  reviewedOn: string | null;
  children: ReactNode;
}) {
  return (
    <Section>
      <Container className="flex max-w-3xl flex-col gap-8">
        {reviewedOn ? (
          <p className="text-sm text-fg-muted">Last reviewed: {reviewedOn}</p>
        ) : (
          <Alert tone="warning" title="Draft — pending legal review">
            This document is a draft and has not yet been reviewed by a legal professional. It will
            be finalised before the clinic uses this website to collect patient information.
          </Alert>
        )}
        <div className="flex flex-col gap-6 leading-7 text-fg [&_h2]:pt-2 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-fg-muted [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:text-fg-muted">
          {children}
        </div>
      </Container>
    </Section>
  );
}
