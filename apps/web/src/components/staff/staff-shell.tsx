'use client';

import { AppShell, Toaster, TooltipProvider, type NavSection } from '@kmsdc/ui';
import { LayoutDashboard, Palette } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Staff navigation. Only routes that exist are listed; each phase adds its module here
 * (no links to unbuilt pages).
 */
const NAV: readonly NavSection[] = [
  {
    items: [{ href: '/app', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'System',
    items: [{ href: '/app/design-system', label: 'Design system', icon: Palette }],
  },
];

function Brand() {
  return (
    <Link href="/app" className="flex items-center gap-2.5 rounded-md">
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-md bg-primary font-heading text-sm font-bold text-primary-fg"
      >
        K
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-sm font-semibold text-fg">Kottakal Dental</span>
        <span className="text-xs text-fg-muted">Clinic workspace</span>
      </span>
    </Link>
  );
}

// Inlined at build time by Next.js. Defaults to "development" so the warning shows unless a
// deployment explicitly declares itself production.
const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? 'development';

function EnvironmentBanner() {
  if (APP_ENV === 'production') return null;
  const label = APP_ENV === 'preview' ? 'Preview environment' : 'Development environment';
  return (
    <div
      role="note"
      className="bg-warning-bg px-4 py-1.5 text-center text-xs font-medium text-warning"
    >
      {label}: synthetic data only. Never enter real patient information.
    </div>
  );
}

export function StaffShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <TooltipProvider>
      <AppShell
        brand={<Brand />}
        sections={NAV}
        activeHref={pathname}
        linkComponent={Link}
        banner={<EnvironmentBanner />}
      >
        {children}
      </AppShell>
      <Toaster />
    </TooltipProvider>
  );
}
