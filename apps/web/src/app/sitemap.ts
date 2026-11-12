import type { MetadataRoute } from 'next';
import { SERVICES } from '@/content/services';
import { SITE_URL } from '@/lib/site';

/** Public pages only — the staff workspace is never listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/services',
    '/about',
    '/doctors',
    '/facilities',
    '/faqs',
    '/contact',
    '/privacy',
    '/terms',
  ];
  return [
    ...staticPages.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
    ...SERVICES.map((s) => ({
      url: `${SITE_URL}/services/${s.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
