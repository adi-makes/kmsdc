import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv, workerEnvSchema, type WorkerEnv } from '@kmsdc/config/env';

export function loadWorkerEnv(cwd: string = process.cwd()): WorkerEnv {
  for (const file of [resolve(cwd, '.env'), resolve(cwd, '../../.env')]) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
      break;
    }
  }
  return parseEnv('worker', workerEnvSchema);
}

export const APP_VERSION = process.env.APP_VERSION ?? process.env.npm_package_version ?? 'dev';
