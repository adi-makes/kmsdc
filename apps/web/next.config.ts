import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import { parseEnv, webServerEnvSchema } from '@kmsdc/config/env';

// Local development keeps one .env at the monorepo root.
const rootEnv = resolve(import.meta.dirname, '../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const env = parseEnv('web', webServerEnvSchema);

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: resolve(import.meta.dirname, '../..'),
  // Same-origin API access keeps the session cookie first-party (ADR-006).
  rewrites() {
    return Promise.resolve([
      { source: '/api/v1/:path*', destination: `${env.API_INTERNAL_URL}/api/v1/:path*` },
    ]);
  },
  headers() {
    return Promise.resolve([{ source: '/:path*', headers: securityHeaders }]);
  },
};

export default nextConfig;
