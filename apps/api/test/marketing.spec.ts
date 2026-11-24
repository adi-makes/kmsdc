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

interface SocialAccountResponse {
  id: string;
  accountHandle: string;
}

interface CampaignResponse {
  id: string;
  name: string;
}

interface PostResponse {
  id: string;
  title: string;
  status: string;
  requiresClinicalReview: boolean;
  publishedAt?: string;
}

describe('Marketing Operations & Content Approval Integration Tests', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  let adminCookie: string[];
  let adminCsrf: string;
  let dentistCookie: string[];
  let dentistCsrf: string;
  let receptionistCookie: string[];
  let receptionistCsrf: string;

  let clinicId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(env)],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, env);
    await app.init();
    prisma = app.get(PrismaService);

    // Clean up marketing tables
    await prisma.socialPost.deleteMany();
    await prisma.marketingCampaign.deleteMany();
    await prisma.socialAccount.deleteMany();

    const clinic = await prisma.clinic.findUniqueOrThrow({ where: { slug: 'kottakal' } });
    clinicId = clinic.id;

    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'SUPER_ADMIN' } });
    const dentistRole = await prisma.role.findUniqueOrThrow({ where: { key: 'DENTIST' } });
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
      where: { email: 'admin_mktg@example.invalid' },
      update: {},
      create: {
        email: 'admin_mktg@example.invalid',
        fullName: 'Admin Marketing',
        passwordHash: pwdHash,
        roles: {
          create: { clinicId, roleId: superAdminRole.id },
        },
      },
    });

    await prisma.user.upsert({
      where: { email: 'dentist_mktg@example.invalid' },
      update: {},
      create: {
        email: 'dentist_mktg@example.invalid',
        fullName: 'Dentist Marketing',
        passwordHash: pwdHash,
        roles: {
          create: { clinicId, roleId: dentistRole.id },
        },
      },
    });

    await prisma.user.upsert({
      where: { email: 'reception_mktg@example.invalid' },
      update: {},
      create: {
        email: 'reception_mktg@example.invalid',
        fullName: 'Reception Marketing',
        passwordHash: pwdHash,
        roles: {
          create: { clinicId, roleId: receptionistRole.id },
        },
      },
    });

    // Login as Admin (has marketing.read, marketing.manage, marketing.publish, campaigns.send)
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin_mktg@example.invalid', password: 'SecurePass123!' });
    expect(adminRes.status).toBe(200);
    adminCookie = adminRes.headers['set-cookie'] as unknown as string[];
    adminCsrf = (adminRes.body as LoginResponse).csrfToken;

    // Login as Dentist (has marketing.approve_clinical)
    const dentistRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'dentist_mktg@example.invalid', password: 'SecurePass123!' });
    expect(dentistRes.status).toBe(200);
    dentistCookie = dentistRes.headers['set-cookie'] as unknown as string[];
    dentistCsrf = (dentistRes.body as LoginResponse).csrfToken;

    // Login as Receptionist (has marketing.read, but no marketing.manage or approve_clinical)
    const recepRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'reception_mktg@example.invalid', password: 'SecurePass123!' });
    expect(recepRes.status).toBe(200);
    receptionistCookie = recepRes.headers['set-cookie'] as unknown as string[];
    receptionistCsrf = (recepRes.body as LoginResponse).csrfToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows marketing staff/admin to register social accounts and campaigns', async () => {
    const accountRes = await request(app.getHttpServer())
      .post('/api/v1/marketing/accounts')
      .set('Cookie', adminCookie)
      .set('x-csrf-token', adminCsrf)
      .send({
        platform: 'INSTAGRAM',
        accountName: 'Kottakal Dental Instagram',
        accountHandle: '@kottakal_dental_clinic',
        isMock: true,
      });

    expect(accountRes.status).toBe(201);
    const account = accountRes.body as SocialAccountResponse;
    expect(account.accountHandle).toBe('@kottakal_dental_clinic');

    const campaignRes = await request(app.getHttpServer())
      .post('/api/v1/marketing/campaigns')
      .set('Cookie', adminCookie)
      .set('x-csrf-token', adminCsrf)
      .send({
        name: 'Oral Health Awareness Month',
        description: 'Educating patients on oral hygiene and early caries detection',
        status: 'RUNNING',
      });

    expect(campaignRes.status).toBe(201);
    const campaign = campaignRes.body as CampaignResponse;
    expect(campaign.name).toBe('Oral Health Awareness Month');
  });

  it('strictly enforces clinical approval gate before publishing clinical marketing posts', async () => {
    // 1. Create a post with clinical content claims requiring review
    const postRes = await request(app.getHttpServer())
      .post('/api/v1/marketing/posts')
      .set('Cookie', adminCookie)
      .set('x-csrf-token', adminCsrf)
      .send({
        title: 'Root Canal Therapy: Busting Common Myths',
        caption:
          'Root canal treatment is virtually painless under modern anaesthesia. Here is what you need to know...',
        hashtags: ['#DentalCare', '#Endodontics', '#OralHealth'],
        requiresClinicalReview: true,
      });

    expect(postRes.status).toBe(201);
    const post = postRes.body as PostResponse;
    expect(post.status).toBe('PENDING_CLINICAL_APPROVAL');

    // 2. Attempting to publish without approval must fail with 403 Forbidden
    const unapprovedPublish = await request(app.getHttpServer())
      .post(`/api/v1/marketing/posts/${post.id}/publish`)
      .set('Cookie', adminCookie)
      .set('x-csrf-token', adminCsrf)
      .send();

    expect(unapprovedPublish.status).toBe(403);

    // 3. Receptionist attempting to approve clinical claims must fail (requires marketing.approve_clinical)
    const recepApproval = await request(app.getHttpServer())
      .post(`/api/v1/marketing/posts/${post.id}/approve-clinical`)
      .set('Cookie', receptionistCookie)
      .set('x-csrf-token', receptionistCsrf)
      .send();

    expect(recepApproval.status).toBe(403);

    // 4. Registered dentist approves clinical post
    const dentistApproval = await request(app.getHttpServer())
      .post(`/api/v1/marketing/posts/${post.id}/approve-clinical`)
      .set('Cookie', dentistCookie)
      .set('x-csrf-token', dentistCsrf)
      .send();

    expect(dentistApproval.status).toBe(200);
    expect((dentistApproval.body as PostResponse).status).toBe('APPROVED');

    // 5. Now publishing succeeds and emits outbox event
    const publishRes = await request(app.getHttpServer())
      .post(`/api/v1/marketing/posts/${post.id}/publish`)
      .set('Cookie', adminCookie)
      .set('x-csrf-token', adminCsrf)
      .send();

    expect(publishRes.status).toBe(200);
    expect((publishRes.body as PostResponse).status).toBe('PUBLISHED');

    const outbox = await prisma.outboxEvent.findFirst({
      where: { aggregateId: post.id, type: 'marketing.post.published' },
    });
    expect(outbox).toBeDefined();
  });
});
