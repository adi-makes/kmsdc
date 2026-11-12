# CLAUDE.md — Kottakal Clinic platform

Guidance for Claude Code (and humans) working in this repository. **Read this first at the start of
every phase**, then the docs relevant to the task.

## What this is

A clinic management and digital operations platform for **Kottakal Multispeciality Dental
Clinic** (Pathanamthitta, Kerala, India): public website, staff dashboard, patients, appointments,
dental records/odontogram, treatment plans, billing, inventory, unified inbox, automation,
marketing and analytics. Built phase by phase from the authoritative spec:
[`docs/product/master-specification.md`](docs/product/master-specification.md).

## Current status

| Phase                   | Status                                                    |
| ----------------------- | --------------------------------------------------------- |
| 0 Inspection & planning | ✅ Complete (2026-11-12)                                  |
| 1 Monorepo & local env  | ✅ Complete (2026-11-12)                                  |
| 2 Design system         | ⏭ Next                                                    |
| 3–14                    | Not started (see [roadmap](docs/architecture/roadmap.md)) |

Foundation only: health endpoints, env validation, worker heartbeat. No business features yet. Feature status lives in [docs/product/feature-matrix.md](docs/product/feature-matrix.md).

## Locked architecture (change only with a written ADR + owner approval)

- **Monorepo:** pnpm workspaces + Turborepo. `apps/web` (Next.js App Router, TS strict, Tailwind,
  shadcn/ui customised, RHF + Zod, TanStack Query, Lucide), `apps/api` (NestJS REST + OpenAPI),
  `apps/worker` (BullMQ). Packages: `ui`, `types`, `validation`, `config`, `api-client`, and `db` (Prisma, ADR-018).
- **Data:** PostgreSQL 17 + Prisma. Redis + BullMQ. MinIO locally / S3 API in the cloud.
- **Style:** modular monolith + event-driven worker via the **transactional outbox**. No microservices.
- **Local-first**, Docker Compose. Free-tier-only cloud previews.
- Key decisions: [ADRs](docs/architecture/architecture-decisions.md). Overview and module dependency map: [architecture-overview](docs/architecture/architecture-overview.md).

## Directory structure (target)

```text
apps/{web,api,worker}  packages/{ui,types,validation,config,api-client,db}
infrastructure/{docker,cloud,monitoring}  database/{seed,documentation}
docs/{product,architecture,design,database,api,security,deployment}  scripts/  .github/workflows/
```

## Commands

```bash
pnpm install && pnpm env:init   # deps + .env with random local secrets
pnpm infra:up                   # postgres, redis, minio(+bucket), mailpit
pnpm dev                        # web, api, worker in watch mode
pnpm check                      # format:check + lint + typecheck + test + build (what CI runs)
pnpm health                     # health table for every service
```

Per package: `pnpm --filter @kmsdc/api test` etc. Full list: [local-development](docs/deployment/local-development.md).
Pinned toolchain and why: ADR-019 (TypeScript 6, Nest 11, Prisma 7, ESLint 9).

Local ports (ADR-016): web 3000 · api 4000 · worker health 4001 · Postgres 5442 · Redis 6389 ·
MinIO 9010/9011 · Mailpit 1035/8035.

## Non-negotiable rules

1. **Never invent clinic information** (doctors, qualifications, address, phone, hours, prices,
   testimonials, ratings, handles). Use labelled placeholders. See the [checklist](docs/product/clinic-information-checklist.md).
2. **No paid service, API or billable resource** without a cost brief and the owner's approval.
3. **Never claim a mock integration is real.** Mock sends are `MOCK_DELIVERED` and the UI shows "Mock mode".
4. **Public repository:** never commit `.env`, secrets, keys, real patient/clinic-confidential data,
   DB dumps or uploads. Seeds are synthetic and marked `[TEST]`.
5. **Server-side authorisation on every endpoint** (`@RequirePermissions`) plus record-level scoping.
   The [permission matrix](docs/security/access-control-matrix.md) is the source of truth, mirrored in `packages/types` and tested.
6. **Immutability:** finalised clinical notes, payments, refunds, consent and audit rows are never
   updated or deleted. Corrections are amendments or reversing entries (ADR-013).
7. **Money** in integer paise. **Time** stored as UTC `timestamptz` and shown in `Asia/Kolkata`.
8. **No autonomous diagnosis or prescriptions.** AI only drafts marketing copy, always as a draft.
9. **Consent check before every outbound message.** No clinical details in reminders or promotions.
10. **TypeScript:** strict. No `any`, no broad `as` casts, no disabled lint rules to get green builds.
11. Never delete data or migrations without explicit approval. Never use production credentials in dev.
12. Don't mark a feature done if it's only a visual mockup.

## Coding conventions

- Validation: Zod schemas in `packages/validation`, shared by web forms and API pipes (ADR-004).
- API: `/api/v1`, error shape `{ error: { code, message, details?, requestId } }`, state changes as
  action endpoints. See [api-conventions](docs/api/api-conventions.md).
- Modules own their tables. Cross-module access goes through public services or domain events, never direct table reads.
- Domain events are written to `OutboxEvent` in the same transaction as the change ([event-flow](docs/architecture/event-flow.md)).
- Logging: pino JSON with PII redaction. Job payloads carry IDs only.
- Raw-SQL DB objects (exclusion constraints, trigram indexes, REVOKEs) live in migrations and are asserted by tests.

## Testing rules

- Every module: unit tests for domain logic and integration tests against a real Postgres (Docker/Testcontainers).
- Must-have suites: permission matrix (role × endpoint), appointment conflicts (concurrent inserts),
  financial calculations, workflow idempotency, webhook dedupe and signature checks, timezone boundaries.
- UI: Playwright screenshots at desktop (1440), tablet (834) and mobile (390), plus E2E for critical journeys.
- Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` before every commit that touches code.

## Workflow rules (owner's standing instructions)

- **Commit regularly** with Conventional Commit messages (`feat(scope):`, `fix:`, `docs:`, `chore:`…)
  and **push to GitHub** (`origin` = `github.com/adi-makes/kmsdc`, public). Branch protection is not
  set up yet, so work happens on `main` unless a phase warrants a branch.
- **Append every prompt and response to [`prompt_responses.md`](prompt_responses.md).**
- **When a phase completes, update `README.md`** (project details, features, usage, setup) and the status table above.
- **Ask the owner for credentials or account setup** (e.g. a Supabase/Neon project, Meta app) when
  needed. Never guess and never create accounts on their behalf.
- Phase report format: what was built · what works · tests executed · results · known issues · docs updated · next phase.

## Skills to use

See [skills-evaluation](docs/design/skills-evaluation.md): `ui-ux-pro-max` (design intelligence),
`web-design-guidelines` (UI review), and `design-system`/`ui-styling` reference docs. Don't use
image- or logo-generation skills (the clinic has its own branding).
