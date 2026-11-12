'use client';

import {
  Container,
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
  IconButton,
  cn,
} from '@kmsdc/ui';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

export const PUBLIC_NAV = [
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/doctors', label: 'Doctors' },
  { href: '/facilities', label: 'Facilities' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/contact', label: 'Contact' },
] as const;

export function ClinicLogo({ compact = false }: { compact?: boolean }) {
  // PROVISIONAL monogram until the clinic's logo is supplied (docs/design/design-system.md).
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md">
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-lg bg-primary font-heading text-base font-bold text-primary-fg"
      >
        K
      </span>
      {compact ? (
        <span className="sr-only">Kottakal Multispeciality Dental Clinic</span>
      ) : (
        <span className="flex flex-col leading-tight">
          <span className="font-heading text-base font-semibold text-fg">Kottakal</span>
          <span className="text-xs text-fg-muted">
            <span className="sr-only"> </span>Multispeciality Dental Clinic
          </span>
        </span>
      )}
    </Link>
  );
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ cta }: { cta: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center gap-6 sm:h-18">
        <ClinicLogo />
        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-bg-muted hover:text-fg',
                    isActive(pathname, item.href) ? 'text-fg-brand' : 'text-fg-muted',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden lg:block">{cta}</div>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <IconButton
              className="ml-auto lg:hidden"
              label="Open menu"
              icon={<Menu aria-hidden="true" />}
            />
          </DrawerTrigger>
          <DrawerContent side="right" aria-describedby={undefined} className="gap-6">
            <DrawerTitle className="sr-only">Menu</DrawerTitle>
            <ClinicLogo />
            <nav aria-label="Main">
              <ul className="flex flex-col">
                {[{ href: '/', label: 'Home' }, ...PUBLIC_NAV].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? 'page' : undefined}
                      onClick={() => {
                        setOpen(false);
                      }}
                      className={cn(
                        'flex h-12 items-center rounded-md px-3 text-base font-medium hover:bg-bg-muted',
                        pathname === item.href ? 'text-fg-brand' : 'text-fg',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-auto">{cta}</div>
          </DrawerContent>
        </Drawer>
      </Container>
    </header>
  );
}

/** Mobile-only sticky booking bar (hidden on large screens where the header CTA is visible). */
export function MobileBookingBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 p-3 backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-md justify-center [&>*]:w-full [&_a]:w-full">
        {children}
      </div>
    </div>
  );
}
