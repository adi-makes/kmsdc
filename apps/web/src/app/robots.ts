import type { MetadataRoute } from 'next';
import { APP_ENV, SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // Only production is indexable; development and preview deployments are hidden from search.
  if (APP_ENV !== 'production') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/app', '/api', '/healthz'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
