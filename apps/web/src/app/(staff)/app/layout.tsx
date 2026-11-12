import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { StaffShell } from '@/components/staff/staff-shell';

// The staff workspace must never be indexed by search engines.
export const metadata: Metadata = {
  title: { default: 'Workspace', template: '%s | Kottakal workspace' },
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <StaffShell>{children}</StaffShell>;
}
