import type { Metadata, Viewport } from 'next';
import { Figtree, Noto_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// Self-hosted at build time by next/font — visitors' browsers never contact Google.
const display = Figtree({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Noto_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Kottakal Multispeciality Dental Clinic, Pathanamthitta',
    template: '%s | Kottakal Multispeciality Dental Clinic',
  },
  description: 'Kottakal Multispeciality Dental Clinic, Pathanamthitta, Kerala.',
  applicationName: 'Kottakal Dental',
};

export const viewport: Viewport = {
  themeColor: '#15766d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
