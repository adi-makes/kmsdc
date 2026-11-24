import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

// Local development keeps a single .env at the monorepo root; real env vars take precedence.
const rootEnv = resolve(import.meta.dirname, '../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
