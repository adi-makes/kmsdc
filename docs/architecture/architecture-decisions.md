# Architecture Decision Records (ADRs)

Format: Context → Decision → Consequences. Status is one of `Accepted`, `Proposed`, `Superseded`.
Locked decisions from the master specification are marked **(locked)**. Changing one requires a
written justification and owner approval.

---

## ADR-001 Modular monolith with a separate worker (locked)

**Status:** Accepted · 2026-11-12
**Context:** A single clinic, a small team and a free-tier budget. Microservices would add operational cost without benefit.
**Decision:** One NestJS API process with domain modules, one worker process for async work, and one Next.js app.
**Consequences:** Simple deployment and transactions across modules. Module boundaries are enforced by convention and lint rules, not network boundaries.

## ADR-002 pnpm workspaces + Turborepo monorepo (locked)

**Status:** Accepted
**Decision:** pnpm workspaces (`apps/*`, `packages/*`) and Turborepo for task orchestration and caching. Node.js LTS (≥ 24; the dev machine runs 26).
**Consequences:** One lockfile and shared configs. Internal packages are consumed as TypeScript source (JIT, "internal packages" pattern) where possible, which avoids build steps for `types` and `validation`.

## ADR-003 Single Next.js app for the public site and staff dashboard (locked by structure)

**Status:** Accepted
**Context:** The spec puts both in `apps/web`. They need distinct experiences.
**Decision:** Route groups `(public)` and `(staff)` with separate layouts. Staff routes live under `/app/*`, are dynamically rendered and `noindex`. Public routes are static/ISR. Shared tokens, distinct component compositions.
**Consequences:** A single deployment. The bundle is split by route, so public pages do not ship dashboard code. A middleware-level session presence check redirects unauthenticated users. Real authorisation is still in the API.

## ADR-004 NestJS REST + OpenAPI, Zod as the single validation library

**Status:** Accepted
**Context:** The spec allows class-validator or Zod, used consistently. The frontend uses Zod already.
**Decision:** Zod everywhere. Schemas live in `packages/validation`. Nest uses a global Zod validation pipe, and OpenAPI is generated from the Zod schemas (`nestjs-zod` or `zod-openapi`, chosen in Phase 4 after a compatibility check against Zod 4).
**Consequences:** One schema for form, request and response. There is no class-validator dependency.

## ADR-005 PostgreSQL + Prisma, with raw-SQL migrations where Prisma is insufficient (locked)

**Status:** Accepted
**Decision:** Prisma schema and migrations. Features Prisma cannot express are added as raw SQL inside Prisma migration files and documented in `docs/database/schema-overview.md`:

- `btree_gist` exclusion constraints for appointment overlap (ADR-009),
- partial unique indexes,
- `pg_trgm` GIN indexes for patient search,
- revoking UPDATE/DELETE on append-only tables (audit, payments, note versions).
  **Consequences:** Prisma `migrate diff` must be checked so raw SQL objects are not dropped. Tests cover the constraints.

## ADR-006 Session authentication with opaque tokens

**Status:** Accepted
**Context:** The spec allows a session or token approach. Revocation must be immediate. Web and API share an origin through a proxy.
**Decision:** Server-side sessions. A 256-bit random token in a `__Host-` prefixed httpOnly, Secure (in hosted environments), SameSite=Lax cookie. Only its SHA-256 hash is stored. Idle timeout of 12 hours (sliding) and absolute timeout of 7 days, both configurable. The token rotates on login, MFA step-up and role change. Passwords use Argon2id (`@node-rs/argon2`, OWASP parameters). Logout and admin "revoke all sessions" delete the rows. Refresh tokens are unnecessary with server sessions, which satisfies "refresh-token rotation where applicable". Patient-portal or mobile clients may add short-lived JWT access tokens later in a new ADR.
**Consequences:** Every authenticated request costs one DB or Redis lookup, which is negligible at clinic scale. CSRF defence is required (double-submit token + Origin check).

## ADR-007 Transactional outbox → BullMQ (locked)

**Status:** Accepted
**Decision:** Services write `OutboxEvent(id, type, aggregateType, aggregateId, payload, occurredAt, publishedAt)` in the same transaction as the state change. The worker's relay polls `SELECT … FOR UPDATE SKIP LOCKED` in batches, enqueues to BullMQ with `jobId = outboxEvent.id` (BullMQ dedupes by jobId), then marks it published. Handlers are idempotent. Message sends use a unique `idempotencyKey` constraint on `Message`/`WorkflowExecution`, so a retry can never send twice.
**Consequences:** Delivery is at-least-once and processing is effectively-once. Polling latency is about 1 s, which is acceptable. A dead-letter queue keeps exhausted jobs for inspection or replay.

## ADR-008 Object storage abstraction, MinIO locally (locked)

**Status:** Accepted
**Decision:** An `ObjectStorage` interface with an S3-compatible implementation (`@aws-sdk/client-s3` and the presigner) that works with both MinIO and S3/R2. Buckets are private. Upload goes through the API (validated size, MIME and magic bytes) or a presigned PUT with a post-upload verification job. Downloads use presigned GET URLs with a TTL of 5 minutes or less, issued only after a permission check and logged in `AccessLog`.

## ADR-009 Double-booking prevention in the database

**Status:** Accepted
**Decision:** The `Appointment` table has a generated `timeRange tstzrange` column and two exclusion constraints:
`EXCLUDE USING gist (dentistId WITH =, timeRange WITH &&) WHERE (status IN ('REQUESTED','CONFIRMED','CHECKED_IN','IN_PROGRESS'))`
and the same for `chairId` (when it is not null). The service also pre-checks availability inside a transaction and maps the constraint-violation SQLSTATE `23P01` to a 409 `APPOINTMENT_CONFLICT` error.
**Open question for the clinic:** should REQUESTED (not yet confirmed) appointments block slots? The default is **yes**, to avoid surprises at confirmation time. This is configurable later.

## ADR-010 Provider adapters with explicit mode (locked intent)

**Status:** Accepted
**Decision:** Messaging (WhatsApp, email, SMS), payments, social platforms, maps and AI drafting all sit behind interfaces. The default implementation is `Mock*Provider`, which records the attempt and marks it `MOCK_DELIVERED`, never `DELIVERED`. The UI shows a persistent "Mock mode" badge on anything that uses a mock adapter. Live adapters are enabled per environment by env flags and credentials. In development, live sending is refused unless `ALLOW_LIVE_SENDS=true` is also set.

## ADR-011 Time handling

**Status:** Accepted
**Decision:** Every instant is stored as `timestamptz` (UTC). Clinic time zone is `Asia/Kolkata` (UTC+05:30, no DST), stored in ClinicSettings for multi-branch future-proofing. Calendar-day logic ("today", reminders "the day before at 10:00", birthdays) is computed in the clinic time zone with `date-fns-tz`. Date-only facts (DOB, holidays) use `date`.

## ADR-012 Money as integer minor units

**Status:** Accepted
**Decision:** Amounts are stored as integer **paise** with currency `INR` stored explicitly. No floats or `Decimal` in arithmetic. Totals are always recomputed on the server. Rounding follows half-up at line level, documented in the billing docs. Payments and refunds are append-only. A correction is a reversing entry (ADR-013).

## ADR-013 Immutability for clinical, financial and audit records

**Status:** Accepted
**Decision:**

- Clinical notes: `ClinicalNote` (status DRAFT/FINALISED/AMENDED) plus append-only `ClinicalNoteVersion`. Once finalised, content changes only through a new version with a reason.
- Financial: an invoice is editable only in DRAFT. Once ISSUED, changes are made through credit notes or adjustments. Payment and Refund rows are never updated or deleted, only voided by a reversing record with a reason.
- Audit: `AuditLog` is insert-only. The DB grants exclude UPDATE/DELETE for the app role (Phase 4/12).

## ADR-014 Multi-branch-ready single tenancy

**Status:** Accepted
**Decision:** Operational tables carry `clinicId`, and `branchId` where location matters (appointments, chairs, inventory, invoices). There is one seeded clinic and branch. No row-level multi-tenancy security yet. Services always filter by the actor's clinic.

## ADR-015 Odontogram notation: FDI (ISO 3950)

**Status:** Proposed (confirm with clinic dentists)
**Decision:** FDI two-digit notation is standard in India. Permanent teeth are 11–18, 21–28, 31–38 and 41–48. Primary teeth are 51–55, 61–65, 71–75 and 81–85. Surfaces are M, O/I, D, B/F, L/P. Conditions are a controlled vocabulary (caries, restoration with material, missing, extracted, root-canal-treated, crown, bridge abutment/pontic, implant, fractured, planned-treatment …), stored per tooth or surface with status `EXISTING | PLANNED | COMPLETED` and full history. The UI shows a toggle for Universal or Palmer display if requested.

## ADR-016 Ports and local infrastructure

**Status:** Accepted
**Context:** This dev machine already runs other stacks (e.g. a Supabase project on 54321–54324).
**Decision:** Local services use offset host ports, configurable via `.env`: Postgres `5442`, Redis `6389`, MinIO API `9010` / console `9011`, Mailpit SMTP `1035` / UI `8035`, web `3000`, API `4000`, worker health `4001`. Data uses named Docker volumes (not bind mounts), because the repo is on an NTFS volume where POSIX ownership is unreliable.

## ADR-017 Hosted Postgres for preview: provider chosen in Phase 13

**Status:** Proposed
**Decision:** Neon Free (from the spec) or Supabase Free (Postgres only, using none of its auth or storage, to keep the architecture portable) are candidates for the **synthetic-data** preview. The choice depends on verified current free limits, whether a card is needed and how pausing behaves. The owner will be asked to create the account and supply credentials. No real patient data goes to either.

## ADR-018 Shared database client package (`packages/db`)

**Status:** Proposed (Phase 4)
**Context:** Both the API and the worker need Prisma models. The spec's package list does not include a DB package.
**Decision:** Add `packages/db` with the Prisma schema, migrations, generated client and seed scripts, consumed by both `apps/api` and `apps/worker`. This is a technically necessary deviation from the spec's directory tree, documented here as the spec requires. `database/seed` and `database/documentation` keep their roles for synthetic seed fixtures and generated docs.

## ADR-019 Toolchain versions pinned in Phase 1

**Status:** Accepted · 2026-11-12
**Context:** Several npm `latest` tags point at releases that are incompatible with the rest of the stack, or are pre-releases.
**Decision:**

- **TypeScript 6.0.x**, not 7.x: `typescript-eslint` 8.72 supports TypeScript `<6.1`. TS 6 defaults `types` to `[]`, so the base tsconfig sets `"types": ["node"]`.
- **NestJS 11.2.x**, not 12.x: `nestjs-zod` (ADR-004) supports Nest ≤ 11, and Nest 11 is still patched (11.2.9 shipped 2026-11-09). Re-evaluate when `nestjs-zod` supports Nest 12.
- **Prisma 7.10.x** (stable), not 8.0 (npm `latest` currently points at an RC).
- **ESLint 9.39.x** (maintenance line), for plugin compatibility with `eslint-config-next`.
- **BullMQ 6 + ioredis 6** (the pair BullMQ is tested against). A raw ioredis instance is passed as `connection`.
- Next.js 16.4, React 19.3, Tailwind 4.3, Zod 4.6, Vitest 5, Turborepo 2.11, pnpm 10.34, Node ≥ 24 (CI on 24 LTS; dev machine on 26).
  **Consequences:** Upgrades go through Dependabot PRs and CI. Major upgrades need an ADR update.

## ADR-020 MinIO container image

**Status:** Accepted · 2026-11-12
**Context:** The official `minio/minio` and `quay.io/minio/*` images are no longer publicly pullable.
**Decision:** Local development uses `cgr.dev/chainguard/minio:latest`, Chainguard's maintained public MinIO build (AGPLv3, used unmodified for local development only). It includes `mc`, which the healthcheck and the one-shot `minio-init` bucket-creation service use. Application code talks to it only through the S3 API (ADR-008), so swapping in any S3-compatible store (S3, R2, Garage, SeaweedFS) needs configuration changes only.

## ADR-021 Compiled internal packages

**Status:** Accepted · 2026-11-12
**Decision:** Shared packages (`config`, `types`, `validation`, `api-client`, `ui`) are ESM, compiled with `tsc` to `dist/`, and consumed through `exports`. The CommonJS NestJS API loads them via Node's native `require(esm)` (Node ≥ 22.12). Turborepo builds dependencies first (`dependsOn: ["^build"]`).
**Consequences:** One build step per package, but every runtime (Nest, the worker, Next.js and Vitest) consumes plain JavaScript with no special transpilation config.
