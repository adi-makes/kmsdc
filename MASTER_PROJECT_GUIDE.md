# Kottakal Multispeciality Dental Clinic — Master Project Guide

**Project:** Kottakal Multispeciality Dental Clinic (KMSDC) Management & Digital Operations Platform  
**Location:** Pathanamthitta, Kerala, India  
**Architecture:** Monorepo (Next.js 16 Web, NestJS 11 REST API, BullMQ Worker, PostgreSQL 17, Redis 8, MinIO S3)  
**Security & Compliance:** DPDP Act (2023) Compliant, WCAG 2.2 AA Accessible, Role-Based Access Control (RBAC), Transactional Outbox Pattern.

---

## Table of Contents

1. [Executive Overview & Architecture](#1-executive-overview--architecture)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Prerequisites & System Requirements](#3-prerequisites--system-requirements)
4. [Local Development Setup](#4-local-development-setup)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Complete Feature Breakdown & How They Work](#6-complete-feature-breakdown--how-they-work)
   - [Public Website & SEO Engine](#public-website--seo-engine)
   - [Authentication, Sessions & RBAC](#authentication-sessions--rbac)
   - [Patient Management & Timeline](#patient-management--timeline)
   - [Appointment Scheduling & Chair Calendar](#appointment-scheduling--chair-calendar)
   - [Clinical Records, FDI Odontogram & Treatment Planning](#clinical-records-fdi-odontogram--treatment-planning)
   - [Unified Communication Inbox & Webhooks](#unified-communication-inbox--webhooks)
   - [Automation Engine & Approval Graphs](#automation-engine--approval-graphs)
   - [Marketing Operations & Clinical Approval](#marketing-operations--clinical-approval)
   - [Analytics, Funnels & CSV Exports](#analytics-funnels--csv-exports)
7. [Deployment Guide: Free Preview (Vercel + Railway / Render / Neon)](#7-deployment-guide-free-preview-vercel--railway--render--neon)
8. [Deployment Guide: Enterprise Production on AWS](#8-deployment-guide-enterprise-production-on-aws)
9. [Operational Runbooks & Maintenance](#9-operational-runbooks--maintenance)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)

---

## 1. Executive Overview & Architecture

KMSDC is a production-grade digital operations platform tailored specifically for multi-chair, multi-branch dental clinics in India. Built with modern enterprise patterns, it provides:

- A public-facing patient portal and appointment enquiry engine with automated WhatsApp fallback.
- An internal clinical workstation for dentists featuring interactive FDI World Dental Federation odontograms, versioned immutable notes, and digital prescriptions.
- Operational back-office tools for receptionists and administrators covering appointments, multi-channel communication (WhatsApp Cloud API, SMS, Email), event-driven automation, social media marketing workflows, and clinical analytics.

### Architecture Style: Modular Monolith + Event-Driven Outbox

```text
                                  [ Patients / Browsers ]
                                             │
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │          apps/web (Next.js 16)            │
                       │   Public Pages, Forms & Staff Dashboard   │
                       └─────────────────────┬─────────────────────┘
                                             │ REST API / Session Cookies
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │          apps/api (NestJS 11)             │
                       │  Auth, Patients, Clinical, Inbox, Events  │
                       └──────────────┬─────────────┬──────────────┘
                                      │             │
                Transactional Outbox  │             │ Queries
                                      ▼             ▼
                       ┌────────────────┐    ┌─────────────────────┐
                       │  PostgreSQL 17 │    │ Redis 8 (BullMQ)    │
                       │  Prisma Client │    └──────────┬──────────┘
                       └────────────────┘               │
                                                        ▼
                                             ┌─────────────────────┐
                                             │ apps/worker (Node)  │
                                             │ Outbox Relay & Jobs │
                                             └─────────────────────┘
```

---

## 2. Monorepo Structure

Managed via **pnpm workspaces** and **Turborepo**:

```text
├── apps/
│   ├── web/               # Next.js 16 (App Router), Tailwind CSS, shadcn/ui, Playwright tests
│   ├── api/               # NestJS 11 REST API, Swagger/OpenAPI, Supertest/Vitest integration suites
│   └── worker/            # BullMQ background worker, transactional outbox consumer, email/SMS dispatch
├── packages/
│   ├── ui/                # Shared React component library, design tokens, WCAG 2.2 AA contrast tests
│   ├── db/                # Prisma 7 schema, migrations, and seed scripts
│   ├── types/             # Monorepo TypeScript domain models, DTOs, and RBAC permission catalogs
│   ├── validation/        # Shared runtime Zod schemas for forms and API requests
│   ├── config/            # Strict environment variable parsing and validation logic
│   └── api-client/        # Type-safe API client consumption SDK
├── docs/                  # Architecture Decision Records (ADRs), specs, and runbooks
├── scripts/               # Developer tooling, health checks, contrast validation
└── docker-compose.yml     # Local services: PostgreSQL 17, Redis 8, MinIO S3, Mailpit
```

---

## 3. Prerequisites & System Requirements

- **Node.js**: `v24.x` or `v26.x` (LTS recommended)
- **pnpm**: `v10.x` or higher (`corepack enable pnpm` or `npm install -g pnpm`)
- **Docker & Docker Compose**: v2.x (required for local database and queue services)
- **Git**: Configured with SSH or HTTPS

---

## 4. Local Development Setup

Clone the repository and set up your local environment in 5 minutes:

### Step 1: Clone and Install Dependencies

```bash
git clone git@github.com:adi-makes/kmsdc.git
cd kmsdc
pnpm install
```

### Step 2: Initialize Local Environment Secrets

Generate local `.env` with random cryptographic secrets (never committed to git):

```bash
pnpm env:init
```

### Step 3: Launch Local Docker Infrastructure

Start local PostgreSQL 17, Redis 8, MinIO S3, and Mailpit:

```bash
pnpm infra:up
```

### Step 4: Run Migrations and Seed Test Data

Deploy database tables and populate default roles, clinic settings, and synthetic demo users:

```bash
pnpm --filter @kmsdc/db exec prisma migrate deploy
pnpm --filter @kmsdc/db exec prisma db seed
```

### Step 5: Start the Development Server

Run Web, API, and Worker concurrently:

```bash
pnpm dev
```

### Step 6: Verify Service Health

In another terminal, check service statuses:

```bash
pnpm health
```

Expected output:

```text
✔ web                200 api:up
✔ api                200 database:up redis:up
✔ api via web proxy  200 database:up redis:up
✔ worker             200 redis:up database:up queueProcessor:up
✔ minio              200
✔ mailpit            200
```

### Local Access Endpoints:

- **Public Website & Staff App:** [http://localhost:3000](http://localhost:3000)
- **API Health Check:** [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
- **Interactive Swagger Documentation:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Worker Health:** [http://localhost:4001/health](http://localhost:4001/health)
- **Captured Test Emails (Mailpit):** [http://localhost:8035](http://localhost:8035)
- **Object Storage Console (MinIO):** [http://localhost:9011](http://localhost:9011) (`kmsdc_minio` / `kmsdc_minio_secret`)

---

## 5. Environment Variables Reference

All variables are strictly validated on startup using `@kmsdc/config`.

| Variable                | Scope           | Description                                   | Default / Example                                              |
| :---------------------- | :-------------- | :-------------------------------------------- | :------------------------------------------------------------- |
| `DATABASE_URL`          | API, DB, Worker | PostgreSQL connection string                  | `postgresql://kmsdc_app:kmsdc_dev_secret@localhost:5442/kmsdc` |
| `REDIS_URL`             | API, Worker     | Redis connection string for BullMQ            | `redis://localhost:6389`                                       |
| `SESSION_SECRET`        | API             | 64-char hex secret for session token signing  | Auto-generated via `pnpm env:init`                             |
| `CSRF_SECRET`           | API             | 64-char hex secret for CSRF HMAC generation   | Auto-generated via `pnpm env:init`                             |
| `API_PORT`              | API             | Port for the NestJS API                       | `4000`                                                         |
| `WORKER_PORT`           | Worker          | Port for Worker health probes                 | `4001`                                                         |
| `NEXT_PUBLIC_API_URL`   | Web             | Public API endpoint URL                       | `http://localhost:4000/api/v1`                                 |
| `S3_ENDPOINT`           | API, Worker     | MinIO or AWS S3 endpoint URL                  | `http://localhost:9010`                                        |
| `S3_BUCKET`             | API, Worker     | Private clinical documents bucket             | `kmsdc-clinical-documents`                                     |
| `S3_ACCESS_KEY`         | API, Worker     | S3 credentials access key                     | `kmsdc_minio`                                                  |
| `S3_SECRET_KEY`         | API, Worker     | S3 credentials secret key                     | `kmsdc_minio_secret`                                           |
| `SMTP_HOST`             | Worker          | Outgoing mail server (Mailpit in dev)         | `localhost`                                                    |
| `SMTP_PORT`             | Worker          | SMTP port                                     | `1035`                                                         |
| `ENABLE_MOCK_PROVIDERS` | API, Worker     | When `true`, WhatsApp/SMS use zero-cost mocks | `true`                                                         |

---

## 6. Complete Feature Breakdown & How They Work

### Public Website & SEO Engine

- **Next.js 16 App Router**: 15 pre-rendered pages covering Root Canal Therapy, Dental Implants, Braces & Orthodontics, Teeth Whitening, Pediatric Care, Doctor Profiles, and Clinic Facilities.
- **Structured Data (JSON-LD)**: Schema.org `Dentist` and `MedicalBusiness` tags, geocoordinates for Pathanamthitta, Kerala, India, and OpeningHours specifications.
- **Spam-Proof Enquiry Submissions**: Enquiry form implements a honeypot (`website` field) and client fill-time verification (`elapsedMs ≥ 3000ms`) to eliminate bot spam without intrusive CAPTCHAs.
- **Instant WhatsApp Fallback**: Generates deep-link `wa.me` URLs pre-filled with the patient's selected treatment service and preferred appointment slot.

### Authentication, Sessions & RBAC

- **Password Security**: Uses Argon2id (`memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`).
- **Session Architecture**: Cryptographically random 256-bit entropy tokens, stored as SHA-256 hashes in PostgreSQL. Transmitted via secure `HttpOnly`, `SameSite=Lax` cookies with strict 12h idle and 7d absolute expiration.
- **CSRF Dual-Token Protection**: Every state-changing HTTP request (`POST`, `PUT`, `PATCH`, `DELETE`) requires an `x-csrf-token` header matched with the session-bound hash.
- **Role-Based Access Control**: 8 roles (`SUPER_ADMIN`, `CLINIC_ADMIN`, `DENTIST`, `RECEPTIONIST`, `NURSE`, `BILLING_OPERATOR`, `MARKETING_OPERATOR`, `READ_ONLY`) enforcing 55 fine-grained permissions.

### Patient Management & Timeline

- **Unified Patient Registry**: Unique ID (`patientNumber`), demographic tracking, contact methods, and duplicate record merging with full audit preservation.
- **DPDP Act (2023) Granular Consent Tracking**: Separates `OPERATIONAL_MESSAGING`, `PROMOTIONAL_MESSAGING`, `DATA_PROCESSING`, and `TREATMENT_CONSENT`. Tracks consent grant notices and withdrawal timestamps.

### Appointment Scheduling & Chair Calendar

- **Exclusion-Safe Booking**: Prevents double-booking doctors or physical chairs across overlapping time slots using PostgreSQL constraint checks and transaction isolation.
- **Appointment Lifecycle**: `SCHEDULED` → `CONFIRMED` → `CHECKED_IN` → `IN_PROGRESS` → `COMPLETED` (or `CANCELLED` / `NO_SHOW`).
- **Receptionist Workstation**: Real-time calendar views filtered by branch, chair, and dentist.

### Clinical Records, FDI Odontogram & Treatment Planning

- **Interactive FDI Odontogram**: Standard 2-digit FDI tooth numbering system (permanent quadrants 1–4, primary quadrants 5–8) tracking conditions across individual surfaces (Mesial, Distal, Occlusal, Buccal, Lingual).
- **Immutable Clinical Notes**: Notes are versioned; finalised notes cannot be silently overwritten or deleted. Any amendment creates an explicit, audited revision.
- **Treatment Plans**: Multi-procedure treatment plans with procedure cost estimates, patient acceptance recording, and multi-visit tracking.

### Unified Communication Inbox & Webhooks

- **Multi-Channel Threads**: Centralized inbox aggregating WhatsApp, SMS, Email, and Website enquiries.
- **Provider Abstraction**: Decoupled `IMessagingProvider` interface with `MockWhatsAppProvider` delivering simulated message delivery (`MOCK_DELIVERED`) without incurring Meta Cloud API fees.
- **Consent Enforcement Gate**: Outbound messages strictly check patient consent. Sending promotional content to patients who have not opted in returns an immediate `403 Forbidden`.
- **WhatsApp Webhook Receiver**: Implements Meta challenge verification (`GET /webhooks/whatsapp`) and signature-verified incoming message ingestion (`POST /webhooks/whatsapp`).

### Automation Engine & Approval Graphs

- **Configurable Workflows**: 12 pre-built trigger types including 24-hour appointment reminders, routine recall due notices, patient birthdays, and post-visit review requests.
- **Sensitive Campaign Approval Gate**: Workflows flagged with `requiresApproval: true` transition to `REQUIRES_APPROVAL` state, preventing message dispatch until explicitly reviewed and approved by staff.

### Marketing Operations & Clinical Approval

- **Campaign & Social Asset Workspace**: Manages social media account connections, marketing campaigns, and content calendars.
- **Clinical Claim Safety Gate**: Posts discussing dental treatments or medical procedures are held in `PENDING_CLINICAL_APPROVAL` and can only be approved by licensed dentists with the `marketing.approve_clinical` permission.

### Analytics, Funnels & CSV Exports

- **Clinic KPIs**: Immediate visibility into appointment completion rates, no-show rates, monthly patient acquisition, and active treatment revenue pipelines.
- **Patient Acquisition Funnel**: Measures conversion from Website Enquiry → Registered Patient → Booked Appointment → Completed Visit → Accepted Treatment.
- **Audited CSV Export**: Role-gated raw data export with access logging.

---

## 7. Deployment Guide: Free Preview (Vercel + Railway / Render / Neon)

Follow these instructions to host a staging preview environment with ₹0 operational cost.

### Option A: Next.js on Vercel + API/Worker on Railway + Postgres on Neon

#### 1. Database Setup (Neon Serverless PostgreSQL)

1. Sign up for [Neon](https://neon.tech) (Free Tier, no credit card required).
2. Create a project named `kmsdc-preview` in AWS Asia Pacific (Singapore) or Europe.
3. Copy the pooled connection string:
   ```text
   postgresql://kmsdc_owner:PASSWORD@ep-xyz-pooler.ap-southeast-1.aws.neon.tech/kmsdc?sslmode=require
   ```
4. Run migrations from your local terminal against Neon:
   ```bash
   DATABASE_URL="<your-neon-url>" pnpm --filter @kmsdc/db exec prisma migrate deploy
   DATABASE_URL="<your-neon-url>" pnpm --filter @kmsdc/db exec prisma db seed
   ```

#### 2. Redis Setup (Upstash Redis)

1. Sign up for [Upstash](https://upstash.com) (Free Tier, 10,000 commands/day).
2. Create a Redis database named `kmsdc-preview-redis`.
3. Copy the `rediss://...` connection string.

#### 3. Backend Deployment on Railway or Render

1. Connect your GitHub repository to [Railway](https://railway.app) or [Render](https://render.com).
2. Configure a new **Web Service** pointing to `apps/api`:
   - **Build Command:** `pnpm --filter @kmsdc/config... --filter @kmsdc/db... --filter @kmsdc/api build`
   - **Start Command:** `node apps/api/dist/main.js`
   - **Port:** `4000`
3. Configure Environment Variables in the service settings:
   ```env
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=<your-neon-url>
   REDIS_URL=<your-upstash-redis-url>
   SESSION_SECRET=228d49a37be7e6f85d263914a2bb3c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
   CSRF_SECRET=7f9a8b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a
   ENABLE_MOCK_PROVIDERS=true
   LOG_LEVEL=info
   ```

#### 4. Frontend Deployment on Vercel

1. Import the repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `apps/web`.
3. Set **Framework Preset** to Next.js.
4. Add Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://<your-railway-or-render-api-domain>/api/v1
   NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>.vercel.app
   ```
5. Click **Deploy**. Vercel will build and launch the edge-cached public site and dashboard.

---

## 8. Deployment Guide: Enterprise Production on AWS

For production deployments holding real patient records, KMSDC is designed for high-availability AWS hosting in Mumbai (`ap-south-1`) adhering to Indian data residency requirements.

### Infrastructure Topology

- **VPC Configuration**: 2 Public Subnets (ALB, NAT Gateways) and 4 Private Subnets (ECS Fargate tasks and RDS Multi-AZ instances) across `ap-south-1a` and `ap-south-1b`.
- **Database**: Amazon RDS for PostgreSQL 17 (`db.t4g.medium`), Multi-AZ synchronous replication, automated daily snapshots, and 35-day Point-In-Time-Recovery (PITR).
- **Compute**: AWS ECS Fargate running OCI container images with Application Load Balancer health checks on `/api/v1/health`.
- **Object Storage**: Amazon S3 private bucket with SSE-KMS encryption and Versioning enabled for dental clinical X-rays and patient documents.
- **Edge Security**: AWS Route 53 DNS + AWS CloudFront CDN + AWS WAF configured with rate-limiting rules against DDoS and OWASP Top 10 exploits.

### Production Environment Variables Template

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://kmsdc_admin:SECRET@kmsdc-prod.xyz.ap-south-1.rds.amazonaws.com:5432/kmsdc?sslmode=verify-full&sslrootcert=/etc/ssl/certs/rds-combined-ca-bundle.pem
REDIS_URL=rediss://default:SECRET@kmsdc-prod.xyz.cache.amazonaws.com:6379
SESSION_SECRET=<64-char-hex-generated-from-aws-secrets-manager>
CSRF_SECRET=<64-char-hex-generated-from-aws-secrets-manager>
S3_BUCKET=kmsdc-prod-clinical-records
S3_REGION=ap-south-1
S3_SSE_KMS_KEY_ID=arn:aws:kms:ap-south-1:123456789012:key/xyz
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=secret-smtp-password
ENABLE_MOCK_PROVIDERS=false
WHATSAPP_PHONE_NUMBER_ID=1029384756
WHATSAPP_BUSINESS_ACCOUNT_ID=9876543210
WHATSAPP_ACCESS_TOKEN=<system-user-access-token>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<secure-verify-token>
```

---

## 9. Operational Runbooks & Maintenance

### Creating Backups

```bash
# Snapshot database to compressed, encrypted file
docker exec -t kmsdc-postgres-1 pg_dump -U kmsdc_app -d kmsdc -Fc > kmsdc_backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restoring from Backup

```bash
# Restore to local or staging target
pg_restore -U kmsdc_app -d kmsdc --clean --if-exists kmsdc_backup_XXXX.dump
```

### Running Test Suites

```bash
# Fast unit & integration tests
pnpm test

# Full static quality gate (prettier, eslint, tsc, vitest, next build)
pnpm check

# Playwright E2E and visual regression test suite
pnpm test:e2e
```

---

## 10. Troubleshooting & FAQ

#### Q: Why does `pnpm health` report ECONNREFUSED?

**A:** Ensure all containers and background processes are active. Run `docker compose ps` to ensure Docker services are healthy, then launch dev servers via `pnpm dev`.

#### Q: Why do promotional WhatsApp messages fail with 403 Forbidden?

**A:** Under DPDP Act rules enforced by `CommunicationService`, patients must explicitly grant `PROMOTIONAL_MESSAGING` consent before promotional templates can be delivered.

#### Q: How do I change the clinic branding and address?

**A:** Update [clinic-profile.ts](file:///run/media/adi/shared1/adi_makes/projects/kmsdc/apps/web/src/content/clinic-profile.ts). The entire public website, contact pages, and metadata pull directly from this centralized profile.
