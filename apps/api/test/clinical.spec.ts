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

interface LoginResponse {
  csrfToken: string;
}

interface EncounterResponse {
  id: string;
}

interface NoteResponse {
  id: string;
  status: string;
  currentVersion: number;
}

interface ChartResponse {
  id: string;
  conditions: Array<{
    toothFdi: string;
    condition: string;
    surfaces: string[];
  }>;
}

interface PlanResponse {
  id: string;
  status: string;
  approvedAt: string | null;
}

describe('Clinical Dental Records & Treatment Planning Integration Tests', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let dentistSessionCookie: string;
  let dentistCsrfToken: string;
  let receptionistSessionCookie: string;
  let clinicId: string;
  let dentistId: string;
  let patientId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(env)],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(app, env);
    await app.init();

    prisma = app.get(PrismaService);

    const clinic = await prisma.clinic.findFirst();
    if (!clinic) throw new Error('Clinic not found');
    clinicId = clinic.id;

    const dentistRole = await prisma.role.findUnique({ where: { key: 'DENTIST' } });
    if (!dentistRole) throw new Error('Dentist role not found');

    const receptionistRole = await prisma.role.findUnique({ where: { key: 'RECEPTIONIST' } });
    if (!receptionistRole) throw new Error('Receptionist role not found');

    const { hash } = await import('@node-rs/argon2');
    const pwdHash = await hash('SecurePass123!', {
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });

    const dentist = await prisma.user.upsert({
      where: { email: 'dr.nair@example.invalid' },
      update: {},
      create: {
        email: 'dr.nair@example.invalid',
        fullName: 'Dr. Nair (BDS, MDS Endodontist)',
        passwordHash: pwdHash,
        roles: {
          create: {
            clinicId,
            roleId: dentistRole.id,
          },
        },
      },
    });
    dentistId = dentist.id;

    await prisma.user.upsert({
      where: { email: 'reception_clinical@example.invalid' },
      update: {},
      create: {
        email: 'reception_clinical@example.invalid',
        fullName: 'Reception Staff',
        passwordHash: pwdHash,
        roles: {
          create: {
            clinicId,
            roleId: receptionistRole.id,
          },
        },
      },
    });

    // Create a test patient
    const patient = await prisma.patient.create({
      data: {
        clinicId,
        patientNumber: `KMDC-CLIN-${Math.floor(Math.random() * 100000)}`,
        fullName: 'Kavitha Menon',
        primaryPhone: '+919876543299',
      },
    });
    patientId = patient.id;

    // Login as Dentist
    const dentistLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'dr.nair@example.invalid', password: 'SecurePass123!' });

    dentistSessionCookie = dentistLogin.headers['set-cookie'] ?? '';
    dentistCsrfToken = (dentistLogin.body as LoginResponse).csrfToken;

    // Login as Receptionist
    const recepLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'reception_clinical@example.invalid', password: 'SecurePass123!' });

    receptionistSessionCookie = recepLogin.headers['set-cookie'] ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('records patient encounter, examination, and diagnosis', async () => {
    const encRes = await request(app.getHttpServer())
      .post('/api/v1/clinical/encounters')
      .set('Cookie', dentistSessionCookie)
      .set('x-csrf-token', dentistCsrfToken)
      .send({
        patientId,
        dentistId,
        chiefComplaint: 'Severe throbbing pain in upper right back tooth (16)',
        examination:
          'Deep occlusal caries with pulpal involvement on tooth 16. Tender to percussion.',
      });

    expect(encRes.status).toBe(201);
    const encounter = encRes.body as EncounterResponse;

    // Add diagnosis
    const diagRes = await request(app.getHttpServer())
      .post(`/api/v1/clinical/encounters/${encounter.id}/diagnoses`)
      .set('Cookie', dentistSessionCookie)
      .set('x-csrf-token', dentistCsrfToken)
      .send({
        description: 'Acute irreversible pulpitis with apical periodontitis',
        toothFdi: '16',
        code: 'K04.0',
      });

    expect(diagRes.status).toBe(201);
  });

  it('enforces clinical note finalisation, version immutability, and role boundaries', async () => {
    // Receptionist CANNOT create or write clinical notes
    const enc = await prisma.encounter.findFirst({ where: { patientId } });
    expect(enc).toBeDefined();
    if (!enc) throw new Error('Encounter missing');

    const recepWrite = await request(app.getHttpServer())
      .post(`/api/v1/clinical/encounters/${enc.id}/notes`)
      .set('Cookie', receptionistSessionCookie)
      .send({ content: 'Receptionist trying to write note' });

    expect(recepWrite.status).toBe(403);

    // Dentist creates draft note
    const draftRes = await request(app.getHttpServer())
      .post(`/api/v1/clinical/encounters/${enc.id}/notes`)
      .set('Cookie', dentistSessionCookie)
      .set('x-csrf-token', dentistCsrfToken)
      .send({
        content:
          'Patient examined. Advised Root Canal Treatment for 16 followed by full coverage crown.',
      });

    expect(draftRes.status).toBe(201);
    const note = draftRes.body as NoteResponse;
    expect(note.status).toBe('DRAFT');
    expect(note.currentVersion).toBe(1);

    // Finalise note
    const finalRes = await request(app.getHttpServer())
      .post(`/api/v1/clinical/notes/${note.id}/finalise`)
      .set('Cookie', dentistSessionCookie)
      .set('x-csrf-token', dentistCsrfToken);

    expect(finalRes.status).toBe(201);
    const finalisedNote = finalRes.body as NoteResponse;
    expect(finalisedNote.status).toBe('FINALISED');

    // Amend note with reason
    const amendRes = await request(app.getHttpServer())
      .post(`/api/v1/clinical/notes/${note.id}/amend`)
      .set('Cookie', dentistSessionCookie)
      .set('x-csrf-token', dentistCsrfToken)
      .send({
        content:
          'Patient examined. Advised RCT 16 with ceramic crown. Local anaesthesia 2% lignocaine with adrenaline 1:80000 administered.',
        amendmentReason: 'Documented local anaesthesia batch and administration',
      });

    expect(amendRes.status).toBe(201);
    const amendedNote = amendRes.body as NoteResponse;
    expect(amendedNote.status).toBe('AMENDED');
    expect(amendedNote.currentVersion).toBe(2);
  });

  it('records odontogram tooth condition and creates treatment plan with patient approval', async () => {
    // Record caries on tooth 16 surfaces O and D
    const condRes = await request(app.getHttpServer())
      .post(`/api/v1/clinical/patients/${patientId}/tooth-conditions`)
      .set('Cookie', dentistSessionCookie)
      .set('x-csrf-token', dentistCsrfToken)
      .send({
        toothFdi: '16',
        surfaces: ['O', 'D'],
        condition: 'CARIES',
        status: 'EXISTING',
      });

    expect(condRes.status).toBe(201);

    // Fetch dental chart
    const chartRes = await request(app.getHttpServer())
      .get(`/api/v1/clinical/patients/${patientId}/dental-chart`)
      .set('Cookie', dentistSessionCookie);

    expect(chartRes.status).toBe(200);
    const chart = chartRes.body as ChartResponse;
    expect(chart.conditions.some((c) => c.toothFdi === '16' && c.condition === 'CARIES')).toBe(
      true,
    );

    // Create treatment plan
    const planRes = await request(app.getHttpServer())
      .post('/api/v1/clinical/treatment-plans')
      .set('Cookie', dentistSessionCookie)
      .set('x-csrf-token', dentistCsrfToken)
      .send({
        patientId,
        dentistId,
        title: 'Tooth 16 Root Canal and Crown Rehabilitation',
        items: [
          {
            procedure: 'Molar Root Canal Treatment',
            teethFdi: ['16'],
            surfaces: ['O', 'D'],
            estimateCost: 450000, // 4,500.00 INR
            plannedVisit: 1,
          },
          {
            procedure: 'Zirconia Crown',
            teethFdi: ['16'],
            surfaces: [],
            estimateCost: 750000, // 7,500.00 INR
            plannedVisit: 2,
          },
        ],
      });

    expect(planRes.status).toBe(201);
    const plan = planRes.body as PlanResponse;
    expect(plan.status).toBe('DRAFT');

    // Record patient approval
    const approveRes = await request(app.getHttpServer())
      .patch(`/api/v1/clinical/treatment-plans/${plan.id}/status`)
      .set('Cookie', dentistSessionCookie)
      .set('x-csrf-token', dentistCsrfToken)
      .send({ status: 'APPROVED' });

    expect(approveRes.status).toBe(200);
    const approvedPlan = approveRes.body as PlanResponse;
    expect(approvedPlan.status).toBe('APPROVED');
    expect(approvedPlan.approvedAt).toBeDefined();
  });
});
