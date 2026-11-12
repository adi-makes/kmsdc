# Feature matrix

Status legend: ⬜ Not started · 🟨 In progress · ✅ Done (tested) · 🧪 Mock only · ⛔ Blocked (needs info/approval)

| Module         | Feature                                 | Priority | Phase | Status | Notes                                                      |
| -------------- | --------------------------------------- | -------- | ----- | ------ | ---------------------------------------------------------- |
| Foundation     | Monorepo, Docker Compose, health checks | P0       | 1     | ✅     | Phase 1: health endpoints, CI, secret scan                 |
| Design         | Tokens, component library, showcase     | P0       | 2     | ✅     | Provisional palette until branding is supplied             |
| A Website      | Pages, SEO, sitemap, JSON-LD            | P0       | 3     | ⬜     |                                                            |
| A Website      | WhatsApp CTA                            | P0       | 3     | ⛔     | Needs WhatsApp number (disabled until set)                 |
| A Website      | Enquiry form                            | P0       | 3/4   | ⬜     | Persisted once the API exists                              |
| A Website      | Doctors / testimonials                  | P0       | 3     | ⛔     | Hidden until real data is supplied                         |
| Identity       | Login/logout, sessions, Argon2id        | P0       | 4     | ⬜     |                                                            |
| Identity       | RBAC + permission guards                | P0       | 4     | ⬜     |                                                            |
| Identity       | MFA for privileged users                | P1       | 12    | ⬜     |                                                            |
| Audit          | Audit log                               | P0       | 4     | ⬜     |                                                            |
| B Dashboard    | Permission-aware widgets                | P0       | 5/11  | ⬜     |                                                            |
| C Patients     | CRUD, search, timeline                  | P0       | 5     | ⬜     |                                                            |
| C Patients     | Duplicates & merge                      | P1       | 5     | ⬜     |                                                            |
| C Patients     | Consent records                         | P0       | 5     | ⬜     |                                                            |
| D Appointments | Calendar, lifecycle, conflict guard     | P0       | 5     | ⬜     |                                                            |
| D Appointments | Waiting list                            | P1       | 5     | ⬜     |                                                            |
| E Clinical     | Encounters, notes w/ versioning         | P0       | 6     | ⬜     |                                                            |
| E Clinical     | Odontogram (FDI)                        | P0       | 6     | ⬜     |                                                            |
| E Clinical     | Prescriptions                           | P1       | 6     | ⬜     |                                                            |
| E Clinical     | Documents / X-rays (MinIO)              | P1       | 6     | ⬜     |                                                            |
| F Treatment    | Plans, approval, consent                | P0       | 6     | ⬜     |                                                            |
| G Billing      | Invoices, payments, refunds, receipts   | P0       | 7     | ⬜     |                                                            |
| G Billing      | Payment gateway                         | P2       | 7     | 🧪     | Mock adapter; a real gateway needs approval                |
| H Inventory    | Products, stock, POs, alerts            | P1       | 7     | ⬜     |                                                            |
| I Comms        | Unified inbox                           | P0       | 8     | ⬜     |                                                            |
| I Comms        | WhatsApp Cloud API                      | P1       | 8     | ⛔     | Needs a Meta Business account; per-message pricing applies |
| I Comms        | Email / SMS providers                   | P1       | 8     | 🧪     | Mock until a provider is approved                          |
| J Automation   | Outbox + BullMQ + workflows             | P1       | 9     | ⬜     |                                                            |
| K Marketing    | Content calendar & approvals            | P1       | 10    | ⬜     |                                                            |
| K Marketing    | Platform publishing adapters            | P2       | 10    | 🧪     | Per-platform API approval needed                           |
| K Marketing    | AI drafting                             | P2       | 10    | ⛔     | Needs approval for a paid LLM API                          |
| L Analytics    | Clinic KPIs, funnel, export             | P1       | 11    | ⬜     |                                                            |
| Hardening      | Security review, E2E, threat model      | P0       | 12    | ⬜     |                                                            |
| Deploy         | Free-tier preview                       | P1       | 13    | ⬜     | Needs provider accounts (will ask)                         |
| Deploy         | Production plan (AWS)                   | P1       | 14    | ⬜     | Documentation only                                         |
