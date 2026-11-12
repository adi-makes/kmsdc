# Phased implementation roadmap

Phases run in order. A phase is complete only when its acceptance criteria pass, the README and
`CLAUDE.md` status are updated, `prompt_responses.md` is appended, and the work is committed and
pushed.

| Phase | Scope | Key deliverables | Acceptance gate | Inputs needed from owner |
|-------|-------|------------------|-----------------|---------------------------|
| **0** | Inspection & planning | Docs, ADRs, permission matrix, ERD, roadmap, CLAUDE.md | Docs coherent | — |
| **1** | Monorepo & local env | pnpm/turbo, apps & packages scaffolds, Docker Compose (pg, redis, minio, mailpit), env validation, health endpoints, CI (lint/typecheck/build), secret scanning | `docker compose up` healthy; `pnpm build lint typecheck test` green | — |
| **2** | Design system | Tokens, typography, components in `packages/ui`, `/app/design-system` showcase, screenshots at 3 breakpoints | Visual QA reviewed; a11y checks pass | **Logo, brand colours, fonts, photos** (provisional palette otherwise) |
| **3** | Public website | All public pages, SEO, sitemap, robots, JSON-LD, WhatsApp CTA, enquiry form (integration boundary) | Playwright link/form/responsive tests; Lighthouse | **Clinic details** (checklist), WhatsApp number |
| **4** | Backend foundation | Prisma schema (identity/org/audit), migrations, sessions, RBAC, audit, errors, logging, OpenAPI, rate limits, auth/authz tests | Login/logout/denial/audit demonstrated in tests | — |
| **5** | Patients & appointments | Patient CRUD/search/timeline/consent/merge; scheduling with exclusion constraints; calendar & reception UI | Conflict tests; integration tests; UI QA | Clinic hours, chairs, appointment types (or placeholders) |
| **6** | Clinical records | Encounters, notes versioning, odontogram, treatment plans, prescriptions, documents | Full encounter E2E test | Dentist review of odontogram vocabulary (ADR-015) |
| **7** | Billing & inventory | Invoices, payments, refunds, receipts, reconciliation; inventory & POs | Calculation + integrity tests | Tax/GST decision, receipt format |
| **8** | Communication | Inbox, templates, consent checks, mock providers, WhatsApp Cloud API adapter (webhook verify) | Duplicate webhook/opt-out/retry tests | **Meta app credentials** only when going live (cost explained first) |
| **9** | Automation | Outbox relay, BullMQ queues, DLQ, 12 workflows, execution dashboard | Idempotency + timezone tests | Reminder timings, recall interval |
| **10** | Marketing | Content calendar, approvals, media, adapters (mock/manual), optional AI drafts | Approval state tests | Social accounts (OAuth later); AI API approval if wanted |
| **11** | Analytics | KPIs, funnel, exports, metric definitions | Metrics verified against fixtures | — |
| **12** | Hardening | Security review, MFA, E2E suite, threat model, backup runbook | No critical/high issues open | — |
| **13** | Free preview | Provider verification, deploy configs, synthetic seed | Health checks on preview | **Provider accounts/credentials** (Neon/Supabase/Render/Cloudflare) |
| **14** | Production plan | AWS architecture, DR, cost approach, exit plan | Docs reviewed | — |

## Risk register (top items)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Clinic details and branding not supplied | Site cannot launch credibly | Placeholders plus checklist. Features degrade gracefully |
| WhatsApp Cloud API costs and approval | Per-message charges, template approval delays | Mock first. Cost brief before going live. Manual WhatsApp Business app fallback |
| Legal compliance (DPDP Act 2023 + Rules) | Regulatory exposure | Consent model by purpose. Professional review is required before production |
| Free-tier limits and sleeping services | Preview unreliable or data loss | Synthetic data only. Documented limits. Never real data |
| Scope size (12 modules) | Long timeline | Strict phase gates. P0 before P1 |
| Prisma vs raw SQL drift | Constraints dropped by a migration | Raw SQL in migrations plus constraint tests in CI |
| Public GitHub repository | Secret or data leakage | `.gitignore`, gitleaks in CI (Phase 1), synthetic seeds only, no clinic-confidential data in repo |
| Dev machine NTFS volume | Permission or symlink quirks | Named Docker volumes. Verified that symlinks work |
