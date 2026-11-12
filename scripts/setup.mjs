#!/usr/bin/env node
// Creates .env from .env.example with freshly generated local secrets.
// Refuses to overwrite an existing .env.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const target = resolve(root, '.env');
if (existsSync(target)) {
  console.log('.env already exists — leaving it unchanged.');
  process.exit(0);
}

const secret = (bytes) => randomBytes(bytes).toString('base64url');
const dbPassword = secret(18);
const minioPassword = secret(18);

const content = readFileSync(resolve(root, '.env.example'), 'utf8')
  .replaceAll('kmsdc:change-me-local-only@', `kmsdc:${dbPassword}@`)
  .replace(/^POSTGRES_PASSWORD=.*$/m, `POSTGRES_PASSWORD=${dbPassword}`)
  .replace(/^MINIO_ROOT_PASSWORD=.*$/m, `MINIO_ROOT_PASSWORD=${minioPassword}`)
  .replace(/^S3_SECRET_ACCESS_KEY=.*$/m, `S3_SECRET_ACCESS_KEY=${minioPassword}`)
  .replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET=${secret(48)}`);

writeFileSync(target, content, { mode: 0o600 });
console.log('Created .env with generated local secrets (git-ignored).');
