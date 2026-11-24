# Kottakal Clinic Platform

Clinic management and digital operations platform for **Kottakal Multispeciality Dental Clinic**,
Pathanamthitta, Kerala, India.

It brings together:

- the public website
- WhatsApp-first booking
- patients and appointments
- dental records with an odontogram
- treatment plans
- billing
- inventory
- a unified inbox
- automation
- marketing
- analytics

All of this lives in one modular-monolith web platform.

> **Project status: Phase 8 complete (Communication Inbox & Messaging Adapters).**
>
> - Phases 0–6 and Phase 8 are complete and verified across API, Web, and database.
> - Phase 7 (Billing & Inventory) is deferred for now per project direction.
> - Next up: **Phase 9 (Automation Engine & Scheduled Reminders)**. See the [roadmap](docs/architecture/roadmap.md).

---

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Documentation](#documentation)
- [Information needed from the clinic](#information-needed-from-the-clinic)
- [Project principles](#project-principles)
- [Development log](#development-log)

## Features & Implementation Status

| Phase  | Area                          | Scope & Capabilities                                                                                                   | Status                           |
| :----- | :---------------------------- | :--------------------------------------------------------------------------------------------------------------------- | :------------------------------- |
| **0**  | **Architecture & Governance** | Master spec, PRD, ADRs (001–023), threat model, permission matrix, roadmap                                             | ✅ **Complete**                  |
| **1**  | **Monorepo & Foundation**     | Turborepo, pnpm workspaces, NestJS API, Next.js Web, Worker, Docker Compose (PG17, Redis 8, MinIO, Mailpit), CI        | ✅ **Complete**                  |
| **2**  | **Design System**             | `@kmsdc/ui` component library, tokens, WCAG 2.2 AA accessibility, contrast test suite, `/app/design-system` showcase   | ✅ **Complete**                  |
| **3**  | **Public Website**            | 15 public pages, SEO/JSON-LD, WhatsApp fallback CTA, responsive layout, validated enquiry form                         | ✅ **Complete**                  |
| **4**  | **Backend Foundation**        | Argon2id auth, session tokens, CSRF protection, RBAC permission guards, audit logging, Prisma 7 client                 | ✅ **Complete**                  |
| **5**  | **Patients & Scheduling**     | Patient management, timeline, consent tracking, duplicate record merge, calendar, exclusion-safe appointments          | ✅ **Complete**                  |
| **6**  | **Clinical Records**          | Medical history, allergies, encounters, immutable versioned notes, prescriptions, FDI odontogram, treatment plans      | ✅ **Complete**                  |
| **7**  | **Billing & Inventory**       | Invoices, partial payments, receipts, daily cash reconciliation, inventory ledger, batch tracking, purchase orders     | ⏸ **Deferred** (Skipped for now) |
| **8**  | **Communication System**      | Unified inbox (WhatsApp, SMS, Email, Web), conversation threads, mock/live adapters, templates, consent gate, webhooks | ✅ **Complete**                  |
| **9**  | **Automation Engine**         | Outbox relay, BullMQ queues, DLQ, automated reminders, recalls, birthday & review workflows                            | ✅ **Complete**                  |
| **10** | **Marketing Operations**      | Content calendar, campaign drafts, approvals, media management, social adapters                                        | 📋 Planned                       |
| **11** | **Analytics & Reporting**     | Clinic KPIs, conversion funnels, financial summaries, CSV/JSON exports                                                 | 📋 Planned                       |
| **12** | **Production Hardening**      | Security audits, MFA for privileged roles, full E2E Playwright test suite, DR runbooks                                 | 📋 Planned                       |
| **13** | **Preview Deployment**        | Free-tier deployment configs (Neon/Render/Cloudflare), synthetic seeding                                               | 📋 Planned                       |
| **14** | **Production Infrastructure** | AWS / scalable cloud architecture, zero-data-loss DR plan, operational runbooks                                        | 📋 Planned                       |

Every external integration (WhatsApp, SMS, email, payments, social) starts as a clearly labelled
**mock**. Real services are connected only after the owner approves them and their costs.

## Architecture

| Layer           | Technology                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Web             | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod, TanStack Query |
| API             | NestJS, REST `/api/v1`, OpenAPI, Prisma                                                         |
| Data            | PostgreSQL 17, Redis (BullMQ), MinIO (S3-compatible)                                            |
| Background jobs | Separate worker, transactional outbox, idempotent jobs                                          |
| Tooling         | pnpm workspaces, Turborepo, Docker Compose, GitHub Actions                                      |

See [architecture overview](docs/architecture/architecture-overview.md) and [ADRs](docs/architecture/architecture-decisions.md).

## Getting started

**Prerequisites:** Node.js ≥ 24, pnpm ≥ 10 and Docker with Compose v2. No accounts or paid services are needed.

```bash
git clone git@github.com:adi-makes/kmsdc.git && cd kmsdc
pnpm install
pnpm env:init     # creates .env with random local secrets (never committed)
pnpm infra:up     # PostgreSQL, Redis, MinIO (+ private bucket), Mailpit
pnpm dev          # web :3000 · api :4000 · worker :4001
pnpm health       # in a second terminal: every service should show ✔
```

| What                 | Where                               |
| -------------------- | ----------------------------------- |
| Website / dashboard  | http://localhost:3000               |
| API health           | http://localhost:4000/api/v1/health |
| API docs (Swagger)   | http://localhost:4000/api/docs      |
| Worker health        | http://localhost:4001/health        |
| Captured emails      | http://localhost:8035 (Mailpit)     |
| File storage console | http://localhost:9011 (MinIO)       |

Quality gate (the same checks CI runs): `pnpm check`, then `pnpm test:e2e` (accessibility, keyboard and responsive checks with screenshots in `screenshots/`). Stop the infrastructure with `pnpm infra:down`.
More detail, including every command and port: [local development guide](docs/deployment/local-development.md).

## Documentation

| Area         | Documents                                                                                                                                                                                                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product      | [Master spec](docs/product/master-specification.md) · [PRD](docs/product/product-requirements.md) · [Personas](docs/product/user-personas.md) · [Journeys](docs/product/user-journeys.md) · [Feature matrix](docs/product/feature-matrix.md) · [Clinic info checklist](docs/product/clinic-information-checklist.md) |
| Architecture | [Overview + module map](docs/architecture/architecture-overview.md) · [ADRs](docs/architecture/architecture-decisions.md) · [Event flow](docs/architecture/event-flow.md) · [Roadmap](docs/architecture/roadmap.md)                                                                                                  |
| Database     | [Schema overview](docs/database/schema-overview.md) · [ERD](docs/database/erd.md) · [Data dictionary](docs/database/data-dictionary.md)                                                                                                                                                                              |
| API          | [Conventions](docs/api/api-conventions.md) · [OpenAPI](docs/api/openapi.md)                                                                                                                                                                                                                                          |
| Security     | [Permission matrix](docs/security/access-control-matrix.md) · [Privacy design](docs/security/privacy-design.md) · [Threat model](docs/security/threat-model.md)                                                                                                                                                      |
| Design       | [Design system](docs/design/design-system.md) · [Components](docs/design/component-inventory.md) · [UX guidelines](docs/design/ux-guidelines.md) · [Skills evaluation](docs/design/skills-evaluation.md)                                                                                                             |
| Deployment   | [Local dev](docs/deployment/local-development.md) · [Free-tier strategy](docs/deployment/free-tier-deployment.md) · [Production](docs/deployment/production-deployment.md) · [Backup/restore](docs/deployment/backup-restore.md)                                                                                     |

## Information needed from the clinic

Staff can see the live list at **http://localhost:3000/app/setup**. Details are entered in
`apps/web/src/content/clinic-profile.ts` ([guide](docs/product/public-website.md)).

The platform never invents clinic details. Missing items appear as labelled placeholders, or the
feature is disabled, until supplied. Key items:

- Logo, colours and photos
- WhatsApp number
- Address and map
- Opening hours
- Doctor profiles
- Facilities
- Social links

Full list: [clinic-information-checklist.md](docs/product/clinic-information-checklist.md).

## Project principles

- **Patient data is highly sensitive.** Access is checked on the server, sensitive actions are
  audited, and consent is recorded separately for each purpose.
- **Development and preview use synthetic data only.** This repository is public and contains no
  secrets and no real data.
- **Free-tier first.** Nothing billable is added without approval.
- **Not legal advice.** DPDP Act compliance requires professional review before production use.

## Development log

Every prompt and response is recorded in [prompt_responses.md](prompt_responses.md).
Working rules for AI-assisted development are in [CLAUDE.md](CLAUDE.md).
