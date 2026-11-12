import { describe, expect, it } from 'vitest';
import { EnvValidationError, apiEnvSchema, parseEnv, workerEnvSchema } from './env.js';

const validApi = {
  DATABASE_URL: 'postgresql://u:p@localhost:5442/db',
  REDIS_URL: 'redis://localhost:6389',
  SESSION_SECRET: 'x'.repeat(32),
  S3_ENDPOINT: 'http://localhost:9010',
  S3_ACCESS_KEY_ID: 'minio',
  S3_SECRET_ACCESS_KEY: 'minio-secret',
};

describe('parseEnv', () => {
  it('applies defaults for optional values', () => {
    const env = parseEnv('api', apiEnvSchema, validApi);
    expect(env.API_PORT).toBe(4000);
    expect(env.CLINIC_TIMEZONE).toBe('Asia/Kolkata');
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.NODE_ENV).toBe('development');
  });

  it('coerces booleans from strings', () => {
    const env = parseEnv('api', apiEnvSchema, { ...validApi, COOKIE_SECURE: 'true' });
    expect(env.COOKIE_SECURE).toBe(true);
  });

  it('lists every missing variable without leaking values', () => {
    try {
      parseEnv('api', apiEnvSchema, { SESSION_SECRET: 'short-secret-value' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const message = (error as EnvValidationError).message;
      expect(message).toContain('DATABASE_URL');
      expect(message).toContain('REDIS_URL');
      expect(message).toContain('SESSION_SECRET');
      expect(message).not.toContain('short-secret-value');
    }
  });

  it('rejects non-postgres database URLs', () => {
    expect(() =>
      parseEnv('worker', workerEnvSchema, { ...validApi, DATABASE_URL: 'mysql://x@y/z' }),
    ).toThrow(/postgres/);
  });

  it('keeps live sends disabled by default', () => {
    expect(parseEnv('worker', workerEnvSchema, validApi).ALLOW_LIVE_SENDS).toBe(false);
  });
});
