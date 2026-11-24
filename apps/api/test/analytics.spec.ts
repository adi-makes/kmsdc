import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { apiEnvSchema, parseEnv } from '@kmsdc/config/env';
import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';
import { loadRootEnvFile } from '../src/config/env.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

import type { ClinicKpisDto, PatientAcquisitionFunnelDto } from '@kmsdc/types';

loadRootEnvFile();

const env = parseEnv('api-test', apiEnvSchema, {
  ...process.env,
  NODE_ENV: 'test',
  LOG_LEVEL: 'fatal',
});

describe('Analytics & Reporting Integration Tests', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  let adminCookie: string[];
  let receptionistCookie: string[];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(env)],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, env);
    await app.init();
    prisma = app.get(PrismaService);

    const clinic = await prisma.clinic.findUniqueOrThrow({ where: { slug: 'kottakal' } });
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'SUPER_ADMIN' } });
    const receptionistRole = await prisma.role.findUniqueOrThrow({
      where: { key: 'RECEPTIONIST' },
    });

    const { hash } = await import('@node-rs/argon2');
    const pwdHash = await hash('SecurePass123!', {
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });

    await prisma.user.upsert({
      where: { email: 'admin_analytics@example.invalid' },
      update: {},
      create: {
        email: 'admin_analytics@example.invalid',
        fullName: 'Admin Analytics',
        passwordHash: pwdHash,
        roles: {
          create: { clinicId: clinic.id, roleId: superAdminRole.id },
        },
      },
    });

    await prisma.user.upsert({
      where: { email: 'reception_analytics@example.invalid' },
      update: {},
      create: {
        email: 'reception_analytics@example.invalid',
        fullName: 'Reception Analytics',
        passwordHash: pwdHash,
        roles: {
          create: { clinicId: clinic.id, roleId: receptionistRole.id },
        },
      },
    });

    // Login as Admin (has analytics.clinic and analytics.export)
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin_analytics@example.invalid', password: 'SecurePass123!' });
    expect(adminRes.status).toBe(200);
    adminCookie = adminRes.headers['set-cookie'] as unknown as string[];

    // Login as Receptionist (has analytics.clinic, but not analytics.export)
    const recepRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'reception_analytics@example.invalid', password: 'SecurePass123!' });
    expect(recepRes.status).toBe(200);
    receptionistCookie = recepRes.headers['set-cookie'] as unknown as string[];
  });

  afterAll(async () => {
    await app.close();
  });

  it('retrieves aggregated clinic KPIs and patient acquisition funnel', async () => {
    const kpiRes = await request(app.getHttpServer())
      .get('/api/v1/analytics/kpis')
      .set('Cookie', adminCookie);

    expect(kpiRes.status).toBe(200);
    const kpis = kpiRes.body as ClinicKpisDto;
    expect(kpis.totalPatients).toBeDefined();
    expect(kpis.completionRate).toBeDefined();

    const funnelRes = await request(app.getHttpServer())
      .get('/api/v1/analytics/funnel')
      .set('Cookie', adminCookie);

    expect(funnelRes.status).toBe(200);
    const funnel = funnelRes.body as PatientAcquisitionFunnelDto;
    expect(funnel.stages).toHaveLength(5);
    expect(funnel.stages[0]?.stage).toBe('Enquiries');
  });

  it('enforces RBAC permission gate on CSV metric data exports', async () => {
    // Receptionist does not have analytics.export
    const recepExport = await request(app.getHttpServer())
      .get('/api/v1/analytics/export')
      .set('Cookie', receptionistCookie);

    expect(recepExport.status).toBe(403);

    // Admin has analytics.export
    const adminExport = await request(app.getHttpServer())
      .get('/api/v1/analytics/export')
      .set('Cookie', adminCookie);

    expect(adminExport.status).toBe(200);
    expect(adminExport.headers['content-type']).toContain('text/csv');
    expect(adminExport.text).toContain('Total Patients');
  });
});
