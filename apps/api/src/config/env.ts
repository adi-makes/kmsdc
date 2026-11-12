import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { apiEnvSchema, parseEnv, type ApiEnv } from '@kmsdc/config/env';

/** DI token for the validated API environment. */
export const API_ENV = Symbol('API_ENV');

/**
 * Local development keeps a single `.env` at the monorepo root. Real environment
 * variables always take precedence (Node's loader never overrides existing values).
 */
export function loadRootEnvFile(cwd: string = process.cwd()): void {
  for (const file of [resolve(cwd, '.env'), resolve(cwd, '../../.env')]) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
      return;
    }
  }
}

export function loadApiEnv(): ApiEnv {
  loadRootEnvFile();
  return parseEnv('api', apiEnvSchema);
}

export const APP_VERSION = process.env.APP_VERSION ?? process.env.npm_package_version ?? 'dev';
