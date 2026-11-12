# Product Requirements Document (PRD)

**Product:** Kottakal Clinic — Clinic Management & Digital Operations Platform
**Client:** Kottakal Multispeciality Dental Clinic, Pathanamthitta, Kerala, India
**Status:** Draft v0.1 (Phase 0) · **Owner:** Project owner (adi-makes) · **Last updated:** 2026-11-12
**Authoritative source:** [`master-specification.md`](./master-specification.md). This PRD restates its scope as
testable requirements. If they conflict, the master specification wins and the conflict is logged as an ADR.

---

## 1. Problem statement

The clinic runs its digital presence and its operations as separate, mostly manual activities.
WhatsApp is the main booking channel, but enquiries, appointments, clinical records, billing, stock,
follow-ups and marketing are not connected. As a result:

- Patient enquiries can go unanswered or are hard to trace back to their source.
- Reception has no single place to see the day, confirm bookings or prevent double-booking.
- Clinical history (odontogram, notes, treatment plans) is not structured, versioned or searchable.
- Payments, outstanding balances and stock levels need manual reconciliation.
- Reminders, recalls and review requests depend on someone remembering to send them.
- Marketing activity is not linked to the enquiries and revenue it produces.

## 2. Goals

| # | Goal | Measured by (once live) |
|---|------|--------------------------|
| G1 | A trustworthy public website that turns visitors into WhatsApp enquiries | WhatsApp CTA clicks, enquiries per week |
| G2 | Fast, error-free front-desk operations | Time to book/check in; zero double-bookings |
| G3 | Structured, versioned and auditable dental records | % of encounters with a finalised note |
| G4 | Accurate billing with no silent changes to financial records | Daily reconciliation matches cash/UPI/card totals |
| G5 | Reliable automated communication that respects consent | Reminder delivery rate, opt-outs honoured 100% |
| G6 | Marketing work organised and linked to outcomes | Content published on schedule; enquiry attribution |
| G7 | Decision-useful analytics built only from real data | Metrics shown with definitions; unavailable ones marked as such |

## 3. Non-goals (initial release)

- Microservices, multi-tenant SaaS for other clinics, or native mobile apps.
- Autonomous diagnosis, treatment recommendation or prescription generation (AI may only draft
  *marketing* copy, and every draft needs human review).
- Unofficial WhatsApp automation (WhatsApp Web scraping or browser bots). Only the official Meta Cloud API is allowed.
- Real payment-gateway integration (a mock adapter only, until the owner approves a gateway).
- Insurance/TPA claims, lab-order integrations and imaging-device (DICOM) integration. These are future scope.
- Any claim of legal or regulatory compliance (DPDP Act 2023 and its rules need professional review).

## 4. Users

See [`user-personas.md`](./user-personas.md). Roles: Super Admin, Clinic Admin, Dentist, Receptionist,
Dental Assistant, Accountant, Marketing Manager and Patient. See the permission matrix in
[`../security/access-control-matrix.md`](../security/access-control-matrix.md).

## 5. Known clinic facts and placeholders

**Known (may be used):** clinic name, the city (Pathanamthitta, Kerala, India), English language,
WhatsApp booking preference, the service list (general dentistry, root canal treatment, teeth
whitening, dental implants, braces & orthodontics, pediatric dentistry, dental X-rays, other dental
procedures) and the timezone `Asia/Kolkata`.

**Unknown (must stay a labelled placeholder until the clinic supplies it):** doctor names,
qualifications, experience, street address, map coordinates, phone/WhatsApp number, email, opening
hours, prices, testimonials, ratings, social handles, branding assets (logo, colours, fonts, photos),
GST registration and tax settings.

These live in a configurable **Clinic Profile** (`ClinicSettings`). The public site renders only the
fields that are filled in. For example, the WhatsApp CTA is disabled and shows "Booking number not
yet configured" until a number is set, and structured data leaves out any field without a value.
The full checklist is in [`clinic-information-checklist.md`](./clinic-information-checklist.md).

## 6. Functional requirements by module

Priority: **P0** = required for the first usable release, **P1** = required for the full product, **P2** = later.

### A. Public website (Phase 3)
- A-1 P0: Home, About, Services, 8 service detail pages, Doctors, Facilities, FAQs, Contact, Privacy, Terms.
- A-2 P0: A WhatsApp CTA (`https://wa.me/<number>?text=<prefilled>`) built from configuration, disabled when the number is unset.
- A-3 P0: SEO, covering unique titles and descriptions, Open Graph, a sitemap, robots, canonical URLs, and `Dentist` JSON-LD with verified fields only.
- A-4 P0: Enquiry form with Zod validation, a honeypot, a time trap and server-side rate limiting, persisted through the API (Phase 4+).
- A-5 P0: Doctor and testimonial sections render only when real data exists. Nothing fake is shown.
- A-6 P1: Mobile sticky booking bar. Lighthouse performance and accessibility of 90 or more on mobile.

### B. Staff dashboard (Phases 2, 5, 11)
- B-1 P0: Permission-aware widgets for today's appointments, pending requests, completed, cancelled/no-show, new vs returning patients, unread conversations and recent enquiries.
- B-2 P1: Revenue summary, outstanding payments, follow-ups due and inventory alerts, shown only to roles with the matching permission.

### C. Patient management (Phase 5)
- C-1 P0: Create, view, update and search (name, phone, patient ID) with pagination and filters.
- C-2 P0: A human-readable patient ID (for example `KMDC-000123`) alongside the UUID.
- C-3 P0: Contacts, address, emergency contact, communication preferences and separate consent records.
- C-4 P0: A patient timeline combining appointments, encounters, invoices and messages.
- C-5 P1: Duplicate detection (phone, name + DOB similarity) and a controlled, audited, reversible-by-record merge.
- C-6 P1: Tags, and export gated by the `patients.export` permission and audited.

### D. Appointments (Phase 5)
- D-1 P0: Day, week and month calendar, with per-dentist and per-chair views.
- D-2 P0: The lifecycle REQUESTED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED, plus CANCELLED / NO_SHOW / RESCHEDULED. Transitions are enforced server-side by a state machine.
- D-3 P0: A double-booking guard enforced in the database by a PostgreSQL exclusion constraint on `(dentist, tstzrange)` and `(chair, tstzrange)` for active states, plus an availability check inside a transaction.
- D-4 P0: Walk-ins, booking requests (including from WhatsApp/web enquiries) and reschedule with history.
- D-5 P1: Doctor schedules, clinic hours, appointment types with default durations, and a waiting list.

### E. Clinical records (Phase 6)
- E-1 P0: Encounter with chief complaint, examination, diagnosis (entered by the dentist), notes and follow-up instructions.
- E-2 P0: Clinical notes move DRAFT → FINALISED → AMENDED. Finalised content is immutable. Amendments create new versions with author, time and reason.
- E-3 P0: Odontogram (FDI notation) for permanent (11–48) and primary (51–85) teeth, with surfaces M/O/D/B/L(P)/I, condition types and a per-tooth history.
- E-4 P1: Medical and dental history, allergies, medications and prescriptions (written by the dentist; no autonomous generation).
- E-5 P1: Clinical documents and X-rays stored in private object storage and viewed through short-lived signed URLs.

### F. Treatment plans (Phase 6)
- F-1 P0: A multi-item plan with procedure, tooth reference(s), estimate, actual cost, planned visit and status.
- F-2 P0: Patient approval and consent record. Accepted items can be converted into invoice items.

### G. Billing (Phase 7)
- G-1 P0: Invoices, items, discounts (permission-gated and audited), partial payments, balances and receipts.
- G-2 P0: Money is stored as integer paise and totals are recomputed on the server. Payments and refunds are append-only, and a correction is a reversing entry.
- G-3 P1: Daily reconciliation by method (cash, UPI, card, online) and configurable tax (GST) settings.
- G-4 P1: A mock payment adapter. A real gateway only after cost approval.

### H. Inventory (Phase 7)
- H-1 P1: Products, categories, suppliers, batches/expiry, stock movements (in, consume, waste, adjust), minimum-stock alerts and purchase orders.

### I. Communication (Phase 8)
- I-1 P0: Unified inbox (WhatsApp, web enquiry, email, SMS) with conversations, messages, assignment, internal notes, labels and unread state.
- I-2 P0: A provider abstraction. The mock provider is clearly labelled **MOCK — not delivered** in the UI.
- I-3 P0: A consent check before every outbound send, with separate operational and promotional consent, and opt-out handling.
- I-4 P1: WhatsApp Cloud API adapter with webhook verification (`X-Hub-Signature-256`), dedupe, templates and the 24-hour customer-service window.

### J. Automation (Phase 9)
- J-1 P0: Transactional outbox → BullMQ. Idempotency key per (workflow, subject, step, scheduled-for).
- J-2 P1: The 12 initial workflows, with pause/resume, retries with exponential backoff, a dead-letter queue, an execution log and manual approval for campaigns.

### K. Marketing (Phase 10)
- K-1 P1: Content calendar, drafts, captions, hashtags, media library and approval workflow (dentist sign-off for clinical claims).
- K-2 P1: Platform adapters (Instagram, Facebook, YouTube, Google Business Profile, LinkedIn), each showing **Connected / Mock / Unavailable / Needs approval**. Manual publishing is always available.
- K-3 P2: Optional AI drafting. Output is always a draft. A paid LLM API needs cost approval.

### L. Analytics (Phase 11)
- L-1 P1: Clinic KPIs and the acquisition funnel, computed only from application data. Missing sources show "Unavailable", never zero or estimates.
- L-2 P1: Date filters, permission-aware views, audited CSV export and documented metric definitions.

## 7. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Security | Server-side RBAC on every endpoint; Argon2id; httpOnly secure cookies; CSRF defence; rate limits; audit logs; private files |
| Privacy | Purpose-specific consent records; withdrawal; minimal PII in logs and messages; no real data outside production |
| Reliability | Outbox for domain events; idempotent jobs; DB transactions for money and scheduling |
| Performance | Staff pages p95 under 500 ms API latency at clinic scale; public site LCP under 2.5 s on 4G |
| Accessibility | WCAG 2.2 AA target: keyboard operable, visible focus, 4.5:1 contrast, reduced motion |
| Time | Store UTC (`timestamptz`), display `Asia/Kolkata`; date-only fields (DOB) stored as `date` |
| Cost | Runs fully locally for free. Every cloud resource needs prior written approval if it can bill |
| Maintainability | Strict TypeScript, no `any` escapes, module boundaries, tests per module, documentation kept current |

## 8. Assumptions

1. One clinic and one branch at launch. Every operational row carries `clinicId` (and `branchId` where relevant) so more branches can be added without migration pain.
2. Staff use desktops or laptops at reception and in the operatory, and tablets or phones occasionally. Patients mostly use phones.
3. English UI only at first. Text is kept in one place so Malayalam can be added later (i18n-ready, not translated).
4. Currency is INR. GST applicability to dental services must be confirmed by the clinic's accountant, so tax is configurable and off by default.
5. The patient-facing portal (Patient role logging in) is a later increment. The role and its permissions are modelled from Phase 4.
6. Branding assets exist but have not been supplied yet. Phase 2 uses a provisional palette that is clearly marked for replacement.

## 9. Release plan

See [`../architecture/roadmap.md`](../architecture/roadmap.md).
