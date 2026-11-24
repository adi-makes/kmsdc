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

interface ConversationResponse {
  id: string;
  status: string;
  channel: string;
  contactPoint: string;
}

interface MessageResponse {
  id: string;
  body: string;
  deliveryStatus: string;
  providerMessageId: string | null;
}

describe('Communication Inbox & Messaging Adapters Integration Tests', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  let receptionistCookie: string[];
  let receptionistCsrf: string;
  let _dentistCookie: string[];
  let _dentistCsrf: string;

  let clinicId: string;
  let patientWithConsentId: string;
  let patientNoPromoConsentId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(env)],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, env);
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up communication tables before testing
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.messageTemplate.deleteMany();

    const clinic = await prisma.clinic.findUniqueOrThrow({ where: { slug: 'kottakal' } });
    clinicId = clinic.id;

    const receptionistRole = await prisma.role.findUniqueOrThrow({
      where: { key: 'RECEPTIONIST' },
    });
    const dentistRole = await prisma.role.findUniqueOrThrow({ where: { key: 'DENTIST' } });

    const { hash } = await import('@node-rs/argon2');
    const pwdHash = await hash('SecurePass123!', {
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });

    await prisma.user.upsert({
      where: { email: 'reception_comm@example.invalid' },
      update: {},
      create: {
        email: 'reception_comm@example.invalid',
        fullName: 'Reception Comm',
        passwordHash: pwdHash,
        roles: {
          create: {
            clinicId,
            roleId: receptionistRole.id,
          },
        },
      },
    });

    await prisma.user.upsert({
      where: { email: 'dentist_comm@example.invalid' },
      update: {},
      create: {
        email: 'dentist_comm@example.invalid',
        fullName: 'Dentist Comm',
        passwordHash: pwdHash,
        roles: {
          create: {
            clinicId,
            roleId: dentistRole.id,
          },
        },
      },
    });

    // Login as Receptionist (has inbox.read and inbox.reply)
    const recRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'reception_comm@example.invalid', password: 'SecurePass123!' });
    expect(recRes.status).toBe(200);
    receptionistCookie = recRes.headers['set-cookie'] as unknown as string[];
    receptionistCsrf = (recRes.body as LoginResponse).csrfToken;

    // Login as Dentist
    const denRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'dentist_comm@example.invalid', password: 'SecurePass123!' });
    expect(denRes.status).toBe(200);
    _dentistCookie = denRes.headers['set-cookie'] as unknown as string[];
    _dentistCsrf = (denRes.body as LoginResponse).csrfToken;

    // Create test patients with different consents
    const p1 = await prisma.patient.create({
      data: {
        clinicId,
        patientNumber: `COMM-P1-${Date.now()}`,
        fullName: 'Consent Patient',
        primaryPhone: '9876543210',
        consents: {
          create: [
            { purpose: 'OPERATIONAL_MESSAGING', status: 'GRANTED', noticeVersion: '2026-11-01' },
            { purpose: 'PROMOTIONAL_MESSAGING', status: 'GRANTED', noticeVersion: '2026-11-01' },
          ],
        },
      },
    });
    patientWithConsentId = p1.id;

    const p2 = await prisma.patient.create({
      data: {
        clinicId,
        patientNumber: `COMM-P2-${Date.now()}`,
        fullName: 'No Promo Patient',
        primaryPhone: '9876543211',
        consents: {
          create: [
            { purpose: 'OPERATIONAL_MESSAGING', status: 'GRANTED', noticeVersion: '2026-11-01' },
          ],
        },
      },
    });
    patientNoPromoConsentId = p2.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('verifies WhatsApp webhook verification challenge (GET /webhooks/whatsapp)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/communication/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'kmsdc_wa_verify',
        'hub.challenge': '1122334455',
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe('1122334455');
  });

  it('rejects invalid WhatsApp webhook verification token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/communication/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': '1122334455',
      });

    expect(res.status).toBe(403);
  });

  it('creates an outbound conversation and sends a message via mock provider', async () => {
    // 1. Create conversation
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/communication/conversations')
      .set('Cookie', receptionistCookie)
      .set('x-csrf-token', receptionistCsrf)
      .send({
        patientId: patientWithConsentId,
        channel: 'WHATSAPP',
        contactPoint: '9876543210',
        subject: 'Appointment Confirmation',
        initialMessage: 'Hello, your appointment is scheduled for tomorrow at 10 AM.',
      });

    expect(createRes.status).toBe(201);
    const conv = createRes.body as ConversationResponse;
    expect(conv.id).toBeDefined();
    expect(conv.channel).toBe('WHATSAPP');

    // 2. Send follow-up operational message
    const sendRes = await request(app.getHttpServer())
      .post(`/api/v1/communication/conversations/${conv.id}/messages`)
      .set('Cookie', receptionistCookie)
      .set('x-csrf-token', receptionistCsrf)
      .send({
        body: 'Please arrive 10 minutes prior to complete registration.',
        category: 'OPERATIONAL',
      });

    expect(sendRes.status).toBe(201);
    const msg = sendRes.body as MessageResponse;
    expect(msg.deliveryStatus).toBe('MOCK_DELIVERED');
    expect(msg.providerMessageId).toMatch(/^mock_wa_/);

    // 3. Verify conversation status updated to WAITING_ON_PATIENT
    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/communication/conversations/${conv.id}`)
      .set('Cookie', receptionistCookie);

    expect(getRes.status).toBe(200);
    const convBody = getRes.body as { status: string; messages: unknown[] };
    expect(convBody.status).toBe('WAITING_ON_PATIENT');
    expect(convBody.messages).toHaveLength(2);
  });

  it('strictly enforces consent check: blocks promotional messages when promotional consent is absent', async () => {
    // 1. Create conversation with patient who has NO promotional consent
    const convRes = await request(app.getHttpServer())
      .post('/api/v1/communication/conversations')
      .set('Cookie', receptionistCookie)
      .set('x-csrf-token', receptionistCsrf)
      .send({
        patientId: patientNoPromoConsentId,
        channel: 'WHATSAPP',
        contactPoint: '9876543211',
        subject: 'Special Offer',
      });

    expect(convRes.status).toBe(201);
    const convBody = convRes.body as ConversationResponse;
    const convId = convBody.id;

    // 2. Attempt sending promotional message -> 403 Forbidden
    const promoRes = await request(app.getHttpServer())
      .post(`/api/v1/communication/conversations/${convId}/messages`)
      .set('Cookie', receptionistCookie)
      .set('x-csrf-token', receptionistCsrf)
      .send({
        body: 'Get 20% off teeth whitening this month!',
        category: 'PROMOTIONAL',
      });

    expect(promoRes.status).toBe(403);
    const promoError = promoRes.body as { error: { message: string } };
    expect(promoError.error.message).toContain('promotional consent');
  });

  it('handles inbound WhatsApp webhook message and links or creates conversation', async () => {
    const inboundPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '1234567890', phone_number_id: '99887766' },
                messages: [
                  {
                    from: '9876543210',
                    id: 'wamid.HBgMOTg3NjU0MzIxMBUCABIYFDEyMzQ1Njc4OTA=',
                    timestamp: '1700000000',
                    text: { body: 'Thank you, I will be there on time!' },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const webhookRes = await request(app.getHttpServer())
      .post(`/api/v1/communication/webhooks/whatsapp?clinicId=${clinicId}`)
      .send(inboundPayload);

    expect(webhookRes.status).toBe(201);
    const webhookBody = webhookRes.body as { status: string; conversationId: string };
    expect(webhookBody.status).toBe('processed');
    expect(webhookBody.conversationId).toBeDefined();

    // Verify conversation now contains the inbound reply
    const convRes = await request(app.getHttpServer())
      .get(`/api/v1/communication/conversations/${webhookBody.conversationId}`)
      .set('Cookie', receptionistCookie);

    expect(convRes.status).toBe(200);
    const threadBody = convRes.body as {
      messages: Array<{ direction: string; body: string }>;
    };
    const messages = threadBody.messages;
    const lastMsg = messages[messages.length - 1];
    expect(lastMsg?.direction).toBe('INBOUND');
    expect(lastMsg?.body).toBe('Thank you, I will be there on time!');
  });
});
