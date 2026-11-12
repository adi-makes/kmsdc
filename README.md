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

> **Project status: Phase 0 complete (planning and architecture).** No runnable application yet.
> Phase 1 (monorepo and local environment) is next. See the [roadmap](docs/architecture/roadmap.md).

---

## Contents
- [Features](#features)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Documentation](#documentation)
- [Information needed from the clinic](#information-needed-from-the-clinic)
- [Project principles](#project-principles)
- [Development log](#development-log)

## Features

| Area | What it will do | Status |
|------|-----------------|--------|
| Public website | Service pages, SEO, WhatsApp booking CTA, enquiry form | Planned (Phase 3) |
| Staff dashboard | Today's schedule, requests, inbox and alerts, filtered by role | Planned (Phase 5/11) |
| Patients | Search, timeline, consent, duplicate merge | Planned (Phase 5) |
| Appointments | Calendar, lifecycle, chair/dentist conflict prevention, waiting list | Planned (Phase 5) |
| Clinical | Encounters, versioned notes, FDI odontogram, prescriptions, X-rays | Planned (Phase 6) |
| Treatment plans | Multi-item plans, estimates, patient approval and consent | Planned (Phase 6) |
| Billing | Invoices, partial payments, refunds, receipts, daily reconciliation | Planned (Phase 7) |
| Inventory | Stock, batches/expiry, suppliers, purchase orders, alerts | Planned (Phase 7) |
| Communication | Unified inbox (WhatsApp, web, email, SMS), templates, consent checks | Planned (Phase 8) |
| Automation | Reminders, recalls, follow-ups, review requests, reports | Planned (Phase 9) |
| Marketing | Content calendar, approvals, platform adapters | Planned (Phase 10) |
| Analytics | Clinic KPIs, acquisition funnel, exports | Planned (Phase 11) |

Every external integration (WhatsApp, SMS, email, payments, social) starts as a clearly labelled
**mock**. Real services are connected only after the owner approves them and their costs.

## Architecture

| Layer | Technology |
|-------|------------|
| Web | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod, TanStack Query |
| API | NestJS, REST `/api/v1`, OpenAPI, Prisma |
| Data | PostgreSQL 17, Redis (BullMQ), MinIO (S3-compatible) |
| Background jobs | Separate worker, transactional outbox, idempotent jobs |
| Tooling | pnpm workspaces, Turborepo, Docker Compose, GitHub Actions |

See [architecture overview](docs/architecture/architecture-overview.md) and [ADRs](docs/architecture/architecture-decisions.md).

## Getting started

> Available from Phase 1. Prerequisites: Node.js ≥ 24, pnpm ≥ 10, Docker with Compose v2.

Planned flow:
```bash
cp .env.example .env        # local-only values; never commit .env
docker compose up -d        # PostgreSQL, Redis, MinIO, Mailpit
pnpm install
pnpm dev                    # web :3000, api :4000, worker :4001
```

## Documentation

| Area | Documents |
|------|-----------|
| Product | [Master spec](docs/product/master-specification.md) · [PRD](docs/product/product-requirements.md) · [Personas](docs/product/user-personas.md) · [Journeys](docs/product/user-journeys.md) · [Feature matrix](docs/product/feature-matrix.md) · [Clinic info checklist](docs/product/clinic-information-checklist.md) |
| Architecture | [Overview + module map](docs/architecture/architecture-overview.md) · [ADRs](docs/architecture/architecture-decisions.md) · [Event flow](docs/architecture/event-flow.md) · [Roadmap](docs/architecture/roadmap.md) |
| Database | [Schema overview](docs/database/schema-overview.md) · [ERD](docs/database/erd.md) · [Data dictionary](docs/database/data-dictionary.md) |
| API | [Conventions](docs/api/api-conventions.md) · [OpenAPI](docs/api/openapi.md) |
| Security | [Permission matrix](docs/security/access-control-matrix.md) · [Privacy design](docs/security/privacy-design.md) · [Threat model](docs/security/threat-model.md) |
| Design | [Design system](docs/design/design-system.md) · [Components](docs/design/component-inventory.md) · [UX guidelines](docs/design/ux-guidelines.md) · [Skills evaluation](docs/design/skills-evaluation.md) |
| Deployment | [Local dev](docs/deployment/local-development.md) · [Free-tier strategy](docs/deployment/free-tier-deployment.md) · [Production](docs/deployment/production-deployment.md) · [Backup/restore](docs/deployment/backup-restore.md) |

## Information needed from the clinic

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
