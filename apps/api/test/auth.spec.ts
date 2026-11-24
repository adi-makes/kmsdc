import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { apiEnvSchema, parseEnv } from '@kmsdc/config/env';
import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';
import { loadRootEnvFile } from '../src/config/env.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

loadRootEnvFile();

const env = parseEnv('api-test', apiEnvSchema, {
  ...process.env,
  NODE_ENV: 'test',
  LOG_LEVEL: 'fatal',
});

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

interface LoginResponseBody {
  csrfToken: string;
  user: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

interface MeResponseBody {
  user: {
    id: string;
    email: string;
  };
}

describe('Auth & Permissions Integration Tests', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(env)],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(app, env);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests to protected endpoints', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    const body = res.body as ErrorResponseBody;
    expect(body.error.message).toBe('Authentication required');
  });

  it('rejects invalid login credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.invalid', password: 'wrongpassword123' });

    expect(res.status).toBe(401);
    const body = res.body as ErrorResponseBody;
    expect(body.error.message).toBe('Invalid email or password');
  });

  it('logs in demo receptionist and gets session cookie and csrfToken', async () => {
    const prisma = app.get(PrismaService);
    const { hash } = await import('@node-rs/argon2');
    const pwdHash = await hash('SecurePass123!', {
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });

    const clinic = await prisma.clinic.findFirst();
    expect(clinic).toBeDefined();
    if (!clinic) throw new Error('Clinic not found');

    const role = await prisma.role.findUnique({ where: { key: 'RECEPTIONIST' } });
    expect(role).toBeDefined();
    if (!role) throw new Error('Role not found');

    await prisma.user.upsert({
      where: { email: 'test_receptionist@example.invalid' },
      update: { passwordHash: pwdHash },
      create: {
        email: 'test_receptionist@example.invalid',
        fullName: 'Test Receptionist',
        passwordHash: pwdHash,
        roles: {
          create: {
            clinicId: clinic.id,
            roleId: role.id,
          },
        },
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test_receptionist@example.invalid', password: 'SecurePass123!' });

    expect(loginRes.status).toBe(200);
    const loginBody = loginRes.body as LoginResponseBody;
    expect(loginBody.csrfToken).toBeDefined();
    expect(loginBody.user.email).toBe('test_receptionist@example.invalid');

    const cookieHeader = loginRes.headers['set-cookie'];
    expect(cookieHeader).toBeDefined();
    const cookie = cookieHeader ?? '';

    const meRes = await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    const meBody = meRes.body as MeResponseBody;
    expect(meBody.user.email).toBe('test_receptionist@example.invalid');

    const auditRes = await request(app.getHttpServer()).get('/api/v1/audit').set('Cookie', cookie);

    expect(auditRes.status).toBe(403);
    const auditBody = auditRes.body as ErrorResponseBody;
    expect(auditBody.error.message).toContain('do not have permission');

    const logoutNoCsrf = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie);

    expect(logoutNoCsrf.status).toBe(403);
    const logoutNoCsrfBody = logoutNoCsrf.body as ErrorResponseBody;
    expect(logoutNoCsrfBody.error.message).toBe('Invalid CSRF token');

    const logoutWithCsrf = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .set('x-csrf-token', loginBody.csrfToken);

    expect(logoutWithCsrf.status).toBe(204);

    const meAfterLogout = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meAfterLogout.status).toBe(401);
  });
});
