import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { apiEnvSchema, parseEnv } from '@kmsdc/config/env';
import { apiErrorSchema, healthReportSchema } from '@kmsdc/validation';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import {
  PG_POOL,
  REDIS_CLIENT,
  type RedisPinger,
  type SqlPinger,
} from '../src/health/health.tokens';

const env = parseEnv('api-test', apiEnvSchema, {
  NODE_ENV: 'test',
  LOG_LEVEL: 'fatal',
  DATABASE_URL: 'postgresql://test:test@localhost:1/test',
  REDIS_URL: 'redis://localhost:1',
  SESSION_SECRET: 'test-secret-'.padEnd(40, 'x'),
  S3_ENDPOINT: 'http://localhost:1',
  S3_ACCESS_KEY_ID: 'test',
  S3_SECRET_ACCESS_KEY: 'test-secret',
});

function fakeDb(fail = false): SqlPinger {
  return {
    query: () => (fail ? Promise.reject(new Error('connection refused')) : Promise.resolve({})),
    end: () => Promise.resolve(),
  };
}
const fakeRedis: RedisPinger = {
  ping: () => Promise.resolve('PONG'),
  quit: () => Promise.resolve('OK'),
};

let app: NestExpressApplication | undefined;

async function createApp(dbFails = false): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule.register(env)] })
    .overrideProvider(PG_POOL)
    .useValue(fakeDb(dbFails))
    .overrideProvider(REDIS_CLIENT)
    .useValue(fakeRedis)
    .compile();
  const created = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(created, env);
  await created.init();
  app = created;
  return created;
}

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('GET /api/v1/health', () => {
  it('returns 200 and a valid report when dependencies are up', async () => {
    const res = await request((await createApp()).getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    const report = healthReportSchema.parse(res.body);
    expect(report.status).toBe('ok');
    expect(report.checks.database?.status).toBe('up');
    expect(report.checks.redis?.status).toBe('up');
  });

  it('returns 503 when the database is down', async () => {
    const res = await request((await createApp(true)).getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(503);
    const report = healthReportSchema.parse(res.body);
    expect(report.status).toBe('down');
    expect(report.checks.database?.status).toBe('down');
  });

  it('serves a dependency-free liveness probe', async () => {
    const res = await request((await createApp(true)).getHttpServer()).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('HTTP pipeline', () => {
  it('returns the standard error envelope with a request id for unknown routes', async () => {
    const res = await request((await createApp()).getHttpServer())
      .get('/api/v1/does-not-exist')
      .set('X-Request-Id', 'test-request-0001');
    expect(res.status).toBe(404);
    const { error } = apiErrorSchema.parse(res.body);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.requestId).toBe('test-request-0001');
    expect(res.headers['x-request-id']).toBe('test-request-0001');
  });

  it('sets security headers and hides the framework', async () => {
    const res = await request((await createApp()).getHttpServer()).get('/api/v1/health/live');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
  });
});
