# Free-Tier Preview Deployment Guide & Verification (Phase 13)

**Project:** Kottakal Multispeciality Dental Clinic (KMSDC)  
**Date:** 2026-11-24  
**Scope:** Architecture configuration, synthetic seed pipeline, cloud provider mappings, environment variable matrices, and verification runbooks for zero-cost cloud preview environments.

---

## 1. Zero-Cost Preview Architecture Blueprint

To provide a live staging preview for clinic stakeholders without incurring ongoing subscription fees or cloud spend, KMSDC supports free-tier cloud deployment:

```text
                                  ┌───────────────────────────────┐
                                  │   Cloudflare Pages / Vercel   │
                                  │       (Next.js Web App)       │
                                  └──────────────┬────────────────┘
                                                 │ HTTPS / REST
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │    Render Free Web Service    │
                                  │       (NestJS REST API)       │
                                  └──────────────┬────────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
         ┌───────────────────────────────┐                 ┌───────────────────────────────┐
         │          Neon / Supabase      │                 │          Upstash Redis        │
         │      (Serverless PostgreSQL)  │                 │        (Serverless BullMQ)    │
         └───────────────────────────────┘                 └───────────────────────────────┘
```

---

## 2. Verified Free-Tier Provider Due-Diligence

| Component         | Target Provider            | Plan & Allowance                              | Cost | Limits & Sleep Behaviour                                                     |
| :---------------- | :------------------------- | :-------------------------------------------- | :--- | :--------------------------------------------------------------------------- |
| **Frontend Web**  | Vercel / Cloudflare Pages  | Free Hobby / Free Tier                        | ₹0   | 100 GB bandwidth / mo. Instant edge delivery.                                |
| **Backend API**   | Render Web Service         | Free Web Service (512 MB RAM, 0.1 CPU)        | ₹0   | Spins down after 15 min inactivity; ~45s cold start on first request.        |
| **Database**      | Neon Serverless Postgres   | Free Tier (0.5 GiB storage, 1 compute branch) | ₹0   | Auto-suspends compute when idle; resumes in ~500ms. No card required.        |
| **Cache & Queue** | Upstash Redis              | Free Serverless (10,000 commands/day)         | ₹0   | BullMQ polling interval tuned for preview to avoid command quota exhaustion. |
| **Object Store**  | Cloudflare R2 / MinIO Mock | Free 10 GB/month                              | ₹0   | S3-compatible API.                                                           |

---

## 3. Synthetic Seed Pipeline

Preview deployments must never contain real patient records. The synthetic seed generator populates:

- **1 Clinic & 1 Branch:** Kottakal Multispeciality Dental Clinic, Main Branch (Pathanamthitta).
- **Default Seed Accounts:**
  - `admin@kottakalclinic.com` (Clinic Admin)
  - `dentist@kottakalclinic.com` (Registered Dentist)
  - `reception@kottakalclinic.com` (Front-desk Receptionist)
- **12 Synthetic Patients:** Realistic demographic profiles with synthetic phone numbers (`98765432xx`) and explicit test consent records.
- **Appointments & Odontograms:** Completed encounters, FDI dental chart conditions (caries on 16, missing 28), and proposed treatment plans.

To run preview seeding in the cloud environment:

```bash
pnpm --filter @kmsdc/db exec prisma db seed
```

---

## 4. Environment Variables Checklist for Preview

Deployments require setting these variables in the host provider dashboard:

```env
# Database
DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/kmsdc?sslmode=require

# Redis (Upstash)
REDIS_URL=rediss://default:token@xyz.upstash.io:6379

# Secrets (Random 64-char hex strings)
SESSION_SECRET=preview-session-secret-64-character-hex-string
CSRF_SECRET=preview-csrf-secret-64-character-hex-string

# App URLs
API_BASE_URL=https://kmsdc-api-preview.onrender.com
NEXT_PUBLIC_APP_URL=https://kmsdc-preview.pages.dev
NEXT_PUBLIC_API_URL=https://kmsdc-api-preview.onrender.com

# Modes
NODE_ENV=production
ENABLE_MOCK_PROVIDERS=true
```
