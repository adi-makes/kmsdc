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

interface PatientResponse {
  id: string;
  patientNumber: string;
  fullName: string;
}

interface AppointmentResponse {
  id: string;
  status: string;
}

interface ErrorResponse {
  error: {
    message: string;
  };
}

describe('Patients & Appointments Scheduling Integration Tests', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let sessionCookie: string;
  let csrfToken: string;
  let clinicId: string;
  let dentistId: string;
  let appointmentTypeId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(env)],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(app, env);
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.appointmentStatusHistory.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.patientConsent.deleteMany({});
    await prisma.patientTagAssignment.deleteMany({});
    await prisma.patient.deleteMany({});

    const clinic = await prisma.clinic.findFirst();
    if (!clinic) throw new Error('Clinic not found');
    clinicId = clinic.id;

    const dentistRole = await prisma.role.findUnique({ where: { key: 'DENTIST' } });
    if (!dentistRole) throw new Error('Dentist role not found');

    const { hash } = await import('@node-rs/argon2');
    const pwdHash = await hash('SecurePass123!', {
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });

    const dentist = await prisma.user.upsert({
      where: { email: 'dr.smith@example.invalid' },
      update: {},
      create: {
        email: 'dr.smith@example.invalid',
        fullName: 'Dr. Smith (BDS)',
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

    const apptType = await prisma.appointmentType.upsert({
      where: { clinicId_name: { clinicId, name: 'Root Canal Consultation' } },
      update: {},
      create: {
        clinicId,
        name: 'Root Canal Consultation',
        defaultDurationMin: 45,
      },
    });
    appointmentTypeId = apptType.id;

    // Login as Clinic Admin / Receptionist to perform operations
    const adminRole = await prisma.role.findUnique({ where: { key: 'CLINIC_ADMIN' } });
    if (!adminRole) throw new Error('Clinic Admin role not found');

    await prisma.user.upsert({
      where: { email: 'scheduler_admin@example.invalid' },
      update: { passwordHash: pwdHash },
      create: {
        email: 'scheduler_admin@example.invalid',
        fullName: 'Admin Scheduler',
        passwordHash: pwdHash,
        roles: {
          create: {
            clinicId,
            roleId: adminRole.id,
          },
        },
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'scheduler_admin@example.invalid', password: 'SecurePass123!' });

    const cookieHeader = loginRes.headers['set-cookie'];
    sessionCookie = cookieHeader ?? '';
    const body = loginRes.body as LoginResponse;
    csrfToken = body.csrfToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, retrieves, and updates patient demographics with audit trail', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/patients')
      .set('Cookie', sessionCookie)
      .set('x-csrf-token', csrfToken)
      .send({
        fullName: 'Anoop Kumar',
        dateOfBirth: '1990-05-15',
        gender: 'MALE',
        primaryPhone: '+919876543210',
        city: 'Pathanamthitta',
        state: 'Kerala',
        postalCode: '689645',
        tags: ['VIP', 'Root Canal'],
      });

    expect(createRes.status).toBe(201);
    const patient = createRes.body as PatientResponse;
    expect(patient.patientNumber).toContain('KMDC-');
    expect(patient.fullName).toBe('Anoop Kumar');

    // Fetch patient
    const fetchRes = await request(app.getHttpServer())
      .get(`/api/v1/patients/${patient.id}`)
      .set('Cookie', sessionCookie);

    expect(fetchRes.status).toBe(200);

    // Record consent
    const consentRes = await request(app.getHttpServer())
      .post(`/api/v1/patients/${patient.id}/consents`)
      .set('Cookie', sessionCookie)
      .set('x-csrf-token', csrfToken)
      .send({
        purpose: 'CLINICAL_TREATMENT',
        status: 'GRANTED',
        noticeVersion: '2026-11-01',
      });

    expect(consentRes.status).toBe(201);
  });

  it('prevents double-booking a dentist for conflicting time slots', async () => {
    // Register patient
    const pRes = await request(app.getHttpServer())
      .post('/api/v1/patients')
      .set('Cookie', sessionCookie)
      .set('x-csrf-token', csrfToken)
      .send({
        fullName: 'Sita Ram',
        primaryPhone: '+919876543211',
      });
    const patient = pRes.body as PatientResponse;

    // Use a unique time slot for this test to avoid collision with prior test runs
    const randOffset = Math.floor(Math.random() * 100000) * 60 * 1000;
    const slot1Start = new Date(Date.now() + 24 * 60 * 60 * 1000 + randOffset);
    const slot1End = new Date(slot1Start.getTime() + 60 * 60 * 1000);

    // Booking 1: slot1Start -> slot1End
    const appt1Res = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Cookie', sessionCookie)
      .set('x-csrf-token', csrfToken)
      .send({
        patientId: patient.id,
        dentistId,
        typeId: appointmentTypeId,
        startsAt: slot1Start.toISOString(),
        endsAt: slot1End.toISOString(),
        source: 'PHONE',
      });

    expect(appt1Res.status).toBe(201);

    // Booking 2: Overlapping slot (shifted by +30 min) with same dentist
    const overlapStart = new Date(slot1Start.getTime() + 30 * 60 * 1000);
    const overlapEnd = new Date(slot1End.getTime() + 30 * 60 * 1000);

    const appt2Res = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Cookie', sessionCookie)
      .set('x-csrf-token', csrfToken)
      .send({
        patientId: patient.id,
        dentistId,
        typeId: appointmentTypeId,
        startsAt: overlapStart.toISOString(),
        endsAt: overlapEnd.toISOString(),
        source: 'PHONE',
      });

    expect(appt2Res.status).toBe(409);
    const errBody = appt2Res.body as ErrorResponse;
    expect(errBody.error.message).toContain('already has an appointment scheduled');
  });

  it('enforces appointment lifecycle transitions', async () => {
    const pRes = await request(app.getHttpServer())
      .post('/api/v1/patients')
      .set('Cookie', sessionCookie)
      .set('x-csrf-token', csrfToken)
      .send({
        fullName: 'Rahul Varma',
        primaryPhone: '+919876543212',
      });
    const patient = pRes.body as PatientResponse;

    const baseTime = new Date(
      Date.now() + 72 * 60 * 60 * 1000 + Math.floor(Math.random() * 10000000),
    );
    const start = new Date(baseTime.getTime() + 14 * 60 * 60 * 1000);
    const end = new Date(baseTime.getTime() + 15 * 60 * 60 * 1000);

    const apptRes = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Cookie', sessionCookie)
      .set('x-csrf-token', csrfToken)
      .send({
        patientId: patient.id,
        dentistId,
        typeId: appointmentTypeId,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
      });

    expect(apptRes.status).toBe(201);
    const appt = apptRes.body as AppointmentResponse;
    expect(appt.status).toBe('REQUESTED');

    // Invalid transition: REQUESTED directly to COMPLETED
    const invalidRes = await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${appt.id}/status`)
      .set('Cookie', sessionCookie)
      .set('x-csrf-token', csrfToken)
      .send({ status: 'COMPLETED' });

    expect(invalidRes.status).toBe(400);

    // Valid transition: REQUESTED -> CONFIRMED
    const confirmRes = await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${appt.id}/status`)
      .set('Cookie', sessionCookie)
      .set('x-csrf-token', csrfToken)
      .send({ status: 'CONFIRMED' });

    expect(confirmRes.status).toBe(200);
    const confirmedAppt = confirmRes.body as AppointmentResponse;
    expect(confirmedAppt.status).toBe('CONFIRMED');
  });
});
