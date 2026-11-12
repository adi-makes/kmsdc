import { SkipLink } from '@kmsdc/ui';
import type { ReactNode } from 'react';
import { BookingCta } from '@/components/public/booking-cta';
import { MobileBookingBar, SiteHeader } from '@/components/public/site-header';
import { SiteFooter } from '@/components/public/site-footer';
import { dentistJsonLd, jsonLdScript } from '@/lib/site';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <script
        type="application/ld+json"
        // Built only from verified profile fields; "<" escaped (see lib/site.ts).
        dangerouslySetInnerHTML={{ __html: jsonLdScript(dentistJsonLd()) }}
      />
      <SiteHeader cta={<BookingCta size="md" showFallbackNote={false} />} />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
      <MobileBookingBar>
        <BookingCta size="lg" showFallbackNote={false} />
      </MobileBookingBar>
    </>
  );
}
