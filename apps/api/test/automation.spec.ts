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

interface WorkflowResponse {
  id: string;
  key: string;
  name: string;
  status: string;
}

interface ExecutionResponse {
  id: string;
  status: string;
  resultPayload: unknown;
}

describe('Automation Engine & Workflow Execution Integration Tests', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  let adminCookie: string[];
  let adminCsrf: string;
  let receptionistCookie: string[];
  let receptionistCsrf: string;

  let clinicId: string;
  let patientId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(env)],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, env);
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up automation and communication tables
    await prisma.workflowExecution.deleteMany();
    await prisma.workflowDefinition.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();

    const clinic = await prisma.clinic.findUniqueOrThrow({ where: { slug: 'kottakal' } });
    clinicId = clinic.id;

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
      where: { email: 'admin_auto@example.invalid' },
      update: {},
      create: {
        email: 'admin_auto@example.invalid',
        fullName: 'Admin Automation',
        passwordHash: pwdHash,
        roles: {
          create: { clinicId, roleId: superAdminRole.id },
        },
      },
    });

    await prisma.user.upsert({
      where: { email: 'reception_auto@example.invalid' },
      update: {},
      create: {
        email: 'reception_auto@example.invalid',
        fullName: 'Reception Automation',
        passwordHash: pwdHash,
        roles: {
          create: { clinicId, roleId: receptionistRole.id },
        },
      },
    });

    // Login Super Admin (has workflows.read, workflows.manage, workflows.approve)
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin_auto@example.invalid', password: 'SecurePass123!' });
    expect(adminRes.status).toBe(200);
    adminCookie = adminRes.headers['set-cookie'] as unknown as string[];
    adminCsrf = (adminRes.body as LoginResponse).csrfToken;

    // Login Receptionist (has workflows.read, but not workflows.manage)
    const recRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'reception_auto@example.invalid', password: 'SecurePass123!' });
    expect(recRes.status).toBe(200);
    receptionistCookie = recRes.headers['set-cookie'] as unknown as string[];
    receptionistCsrf = (recRes.body as LoginResponse).csrfToken;

    // Create test patient with operational messaging consent
    const patient = await prisma.patient.create({
      data: {
        clinicId,
        patientNumber: `AUTO-P-${Date.now()}`,
        fullName: 'Automation Patient',
        primaryPhone: '9876543220',
        consents: {
          create: [
            { purpose: 'OPERATIONAL_MESSAGING', status: 'GRANTED', noticeVersion: '2026-11-01' },
          ],
        },
      },
    });
    patientId = patient.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an automated appointment reminder workflow definition', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/automation/workflows')
      .set('Cookie', adminCookie)
      .set('x-csrf-token', adminCsrf)
      .send({
        key: 'appointment_reminder_24h',
        name: '24-Hour Appointment Reminder',
        description: 'Sends an automated WhatsApp reminder 24 hours prior to scheduled appointment',
        triggerType: 'APPOINTMENT_REMINDER_DUE',
        status: 'ACTIVE',
        actions: [
          {
            type: 'SEND_COMMUNICATION',
            channel: 'WHATSAPP',
            messageBody:
              'Reminder: You have an appointment tomorrow at Kottakal Multispeciality Dental Clinic.',
          },
        ],
        requiresApproval: false,
      });

    expect(res.status).toBe(201);
    const body = res.body as WorkflowResponse;
    expect(body.id).toBeDefined();
    expect(body.key).toBe('appointment_reminder_24h');
    expect(body.status).toBe('ACTIVE');
  });

  it('rejects workflow creation by unauthorised staff (Receptionist)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/automation/workflows')
      .set('Cookie', receptionistCookie)
      .set('x-csrf-token', receptionistCsrf)
      .send({
        key: 'unauthorised_workflow',
        name: 'Should Fail',
        triggerType: 'PATIENT_BIRTHDAY',
        actions: [{ type: 'SEND_COMMUNICATION' }],
      });

    expect(res.status).toBe(403);
  });

  it('executes active workflow immediately and dispatches communication action via mock provider', async () => {
    // Trigger the 24-hour reminder workflow
    const triggerRes = await request(app.getHttpServer())
      .post('/api/v1/automation/trigger')
      .set('Cookie', adminCookie)
      .set('x-csrf-token', adminCsrf)
      .send({
        workflowKey: 'appointment_reminder_24h',
        patientId,
        payload: { appointmentId: 'test_apt_1' },
      });

    expect(triggerRes.status).toBe(201);
    const execution = triggerRes.body as ExecutionResponse;
    expect(execution.id).toBeDefined();
    expect(execution.status).toBe('COMPLETED');

    // Verify conversation was automatically generated with mock delivery
    const conv = await prisma.conversation.findFirst({
      where: { clinicId, patientId },
      include: { messages: true },
    });

    expect(conv).toBeDefined();
    expect(conv?.messages).toHaveLength(1);
    expect(conv?.messages[0]?.body).toContain('Reminder: You have an appointment tomorrow');
    expect(conv?.messages[0]?.deliveryStatus).toBe('MOCK_DELIVERED');
  });

  it('supports sensitive workflows requiring human review and approval before execution', async () => {
    // 1. Create campaign workflow requiring approval
    const createWf = await request(app.getHttpServer())
      .post('/api/v1/automation/workflows')
      .set('Cookie', adminCookie)
      .set('x-csrf-token', adminCsrf)
      .send({
        key: 'festival_greeting_campaign',
        name: 'Onam Festival Greeting',
        description: 'Special seasonal festival greeting campaign requiring management review',
        triggerType: 'MANUAL_CAMPAIGN',
        status: 'ACTIVE',
        actions: [
          {
            type: 'SEND_COMMUNICATION',
            channel: 'WHATSAPP',
            messageBody:
              'Wishing you and your family a joyous and blessed Onam! — Kottakal Dental Clinic',
          },
        ],
        requiresApproval: true,
      });

    expect(createWf.status).toBe(201);

    // 2. Trigger sensitive workflow -> should pause in REQUIRES_APPROVAL
    const triggerRes = await request(app.getHttpServer())
      .post('/api/v1/automation/trigger')
      .set('Cookie', adminCookie)
      .set('x-csrf-token', adminCsrf)
      .send({
        workflowKey: 'festival_greeting_campaign',
        patientId,
      });

    expect(triggerRes.status).toBe(201);
    const execution = triggerRes.body as ExecutionResponse;
    expect(execution.status).toBe('REQUIRES_APPROVAL');

    // 3. Approve execution as admin -> transitions to COMPLETED
    const approveRes = await request(app.getHttpServer())
      .post(`/api/v1/automation/executions/${execution.id}/approve`)
      .set('Cookie', adminCookie)
      .set('x-csrf-token', adminCsrf)
      .send();

    expect(approveRes.status).toBe(201);
    expect((approveRes.body as ExecutionResponse).status).toBe('COMPLETED');
  });
});
