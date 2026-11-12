# Architecture overview

**Style:** Modular monolith (NestJS API) + separate background worker (BullMQ) + Next.js web app,
in a pnpm/Turborepo monorepo. Development is local-first with Docker Compose (PostgreSQL, Redis, MinIO).
See the decisions in [`architecture-decisions.md`](./architecture-decisions.md).

## 1. System context

```text
                         ┌───────────────────────────────────────────┐
  Patients (mobile) ───▶ │  apps/web  (Next.js App Router)           │
                         │   • (public)  marketing site, SSG/ISR      │
  Staff (desktop/tab) ─▶ │   • (staff)   dashboard /app/*, client UI  │
                         └──────────────┬────────────────────────────┘
                                        │ same-origin /api/v1/* (rewrite/proxy)
                                        ▼  httpOnly session cookie
                         ┌───────────────────────────────────────────┐
  Meta WhatsApp  ──────▶ │  apps/api  (NestJS modular monolith)      │
  webhooks (Phase 8)     │   REST /api/v1 · OpenAPI · RBAC guards     │
                         │   Prisma ─▶ PostgreSQL (incl. outbox)      │
                         └──────┬───────────────┬────────────────────┘
                                │               │ presigned URLs
                         writes │ outbox rows   ▼
                                │         ┌───────────┐
                                ▼         │  MinIO/S3 │ private buckets
                         ┌─────────────┐  └───────────┘
                         │ PostgreSQL  │◀───────────────┐
                         └─────────────┘                │ reads/writes
                                ▲ poll outbox           │
                         ┌──────┴──────────────────────────────────────┐
                         │  apps/worker  (BullMQ processors + relay)   │
                         │   outbox relay · schedulers · workflows     │──▶ Provider adapters
                         └──────┬──────────────────────────────────────┘    (mock │ WhatsApp │
                                ▼                                            email │ SMS │ social)
                         ┌─────────────┐
                         │ Redis       │ BullMQ queues, rate-limit store
                         └─────────────┘
```

## 2. Applications

| App | Responsibility | Runtime |
|-----|----------------|---------|
| `apps/web` | Public website (static/ISR, SEO) and staff dashboard (`/app`, authenticated client components with TanStack Query). Calls the API through same-origin rewrites so cookies stay first-party. | Next.js (Node) |
| `apps/api` | All business logic, validation, authorisation, persistence, webhooks, OpenAPI. Writes domain events to the **outbox** in the same transaction as state changes. | NestJS (Node) |
| `apps/worker` | Outbox relay → BullMQ, workflow engine, scheduled jobs (reminders, recalls, reports), provider calls with retry/backoff, DLQ. Exposes `/health`. Shares domain/service code with the API through packages, not HTTP. | Node + BullMQ |

## 3. Shared packages

| Package | Contents | Consumed by |
|---------|----------|-------------|
| `packages/config` | tsconfig bases, ESLint/Prettier config, env schemas (Zod) | all |
| `packages/types` | Shared enums and types (roles, permissions, appointment status, event names) | all |
| `packages/validation` | Zod schemas for request/response DTOs and forms (single source of truth) | web, api, worker |
| `packages/ui` | Design-system components (shadcn/ui-based, customised) and tokens | web |
| `packages/api-client` | Typed fetch client generated from or aligned with the OpenAPI spec | web |
| `packages/db` *(added in Phase 4, ADR-018)* | Prisma schema, migrations, generated client, seed scripts | api, worker |

Both the API and the worker share one Prisma schema through `packages/db`. This is the one documented
deviation from the spec's directory tree.

## 4. Backend modules (domain boundaries)

Each module owns its tables, service and controller. Other modules may call its **public service
interface** or react to its **domain events**, and must never query its tables directly. This
boundary makes later extraction possible.

| Module | Owns (Prisma models) | Phase |
|--------|----------------------|-------|
| `organisation` | Clinic, Branch, ClinicSettings, Chair | 4 |
| `identity` (auth, users, roles) | User, Role, Permission, UserRole, Session, PasswordResetToken | 4 |
| `audit` | AuditLog, AccessLog | 4 |
| `patients` | Patient, PatientContact, PatientAddress, PatientTag, PatientMergeRecord | 5 |
| `consent` | ConsentRecord, CommunicationPreference | 5 |
| `scheduling` | Appointment, AppointmentType, DoctorSchedule, Availability (exceptions), WaitingListEntry | 5 |
| `enquiries` | Enquiry (web/WhatsApp leads + attribution) | 3/4 |
| `medical` | MedicalHistory, Allergy, Medication | 6 |
| `clinical` | Encounter, Diagnosis, ClinicalNote, ClinicalNoteVersion, Prescription, PrescriptionItem | 6 |
| `dental-chart` | DentalChart, ToothCondition (tooth + surfaces), ToothConditionHistory | 6 |
| `treatment` | Procedure (catalogue), TreatmentPlan, TreatmentItem | 6 |
| `files` | Document, FileMetadata | 6 |
| `billing` | Invoice, InvoiceItem, Payment, Refund, ReceiptSequence, Reconciliation | 7 |
| `inventory` | Product, ProductCategory, ProductBatch, StockMovement, Supplier, PurchaseOrder(+Item) | 7 |
| `communication` | Conversation, Message, MessageTemplate, ConversationLabel, InternalNote, WebhookEvent | 8 |
| `automation` | Workflow, WorkflowVersion, WorkflowStep, WorkflowExecution, WorkflowExecutionLog, OutboxEvent | 9 |
| `marketing` | Campaign, CampaignRecipient, SocialAccount, SocialPost, SocialPostMedia, ContentApproval | 10 |
| `analytics` | Read-only aggregate queries / materialised views, AnalyticsEvent (site events, no PII) | 11 |

## 5. Module dependency map

Arrows mean "depends on (calls the public service of, or reads IDs from)". Event subscriptions are
dotted (`⇢`) and do not create compile-time coupling. **The graph must stay acyclic.** Enforce
this with lint boundaries (Phase 1) and review.

```text
                         organisation ◀──────────── (everything reads clinic/branch/settings)
                              ▲
                          identity ◀── audit (audit records actorId; identity emits audit events)
                              ▲
     ┌──────────────┬─────────┴──────────┬───────────────┬─────────────┐
  patients ◀── consent              files            inventory    marketing
     ▲            ▲                   ▲                  ▲            ▲  (no patient PII;
     │            │                   │                  │            │   segment counts only)
 scheduling   communication ──────────┘                  │            │
     ▲            ▲   ▲ (consent check before send)      │            │
     │            │   └──────────────── automation ⇢ (subscribes to all domain events)
 clinical ◀── dental-chart                 │
     ▲                                     │ actions call communication / inventory alerts
 treatment ─────────▶ billing ─────────────┘
     (accepted items → invoice lines)

 analytics ──▶ read-only aggregates over all modules (no writes)
 enquiries ──▶ patients (link/convert), communication (inbox thread)
```

Rules:
1. `clinical`, `dental-chart`, `medical` and `treatment` are **clinical data**. Only modules with clinical permissions may read them. `billing` sees treatment item names and prices, not notes.
2. `marketing` never imports `patients` or `clinical`. Campaign audiences are resolved inside `communication`/`consent` and returned as counts and opaque recipient IDs.
3. `automation` triggers on events and calls other modules' public services. It never writes their tables.

## 6. Cross-cutting concerns

| Concern | Approach |
|---------|----------|
| Validation | Zod schemas from `packages/validation`, applied by a global `ZodValidationPipe` in Nest and by React Hook Form resolvers in web |
| Errors | Global exception filter returns `{ error: { code, message, details?, requestId } }`. Never stack traces in prod |
| Logging | `pino` (nestjs-pino) JSON logs with request ID. Redaction list covers names, phone, email, notes, tokens and cookies |
| AuthN | Opaque session token (random 256-bit) in an httpOnly, Secure, SameSite=Lax cookie. SHA-256 hash stored in `Session`. Sliding and absolute expiry. Rotated on login and privilege change |
| AuthZ | `@RequirePermissions()` decorator + guard. Record-level checks in services (e.g. a patient sees only their own data) |
| CSRF | SameSite=Lax cookie + required `X-CSRF-Token` (double-submit) on state-changing requests, and Origin header check |
| Audit | `AuditService.record()` inside the same transaction for sensitive writes. Append-only table (DB role has no UPDATE/DELETE) |
| Time | `timestamptz` in UTC. `date-fns-tz` for Asia/Kolkata display and day boundaries. DOB as `date` |
| Money | Integer paise (`Int`/`BigInt`) and currency `INR`. All arithmetic on the server |
| Files | `ObjectStorage` interface (`putObject`, `getSignedUrl`, `delete`) with MinIO/S3 implementations. Private buckets. Signed URL TTL ≤ 5 min. MIME and magic-byte validation |
| Integrations | Provider interfaces + `mock` implementations. Each adapter reports `mode: 'mock' \| 'live' \| 'unavailable'`, which the UI displays |
| Config | Env validated at boot with Zod (fail fast). `.env.example` documents every variable |

## 7. Deployment views

- **Local (Phases 1–12):** `docker compose up` runs postgres, redis and minio (plus optional mailpit for email capture). Apps run with `pnpm dev`. See [`../deployment/local-development.md`](../deployment/local-development.md).
- **Free preview (Phase 13):** synthetic data only. See [`../deployment/free-tier-deployment.md`](../deployment/free-tier-deployment.md).
- **Production (Phase 14, plan only):** AWS reference architecture, documentation only, no provisioning.
