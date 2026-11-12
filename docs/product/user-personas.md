# User personas

> These are **archetypes** for design decisions. They are not real people, and they say nothing about
> the clinic's actual staff. Validate them with the clinic team during Phase 2/5 reviews.

## 1. Receptionist — "front desk"

- **Context:** At the desk all day. Handles phone, WhatsApp and walk-ins at the same time and is often interrupted.
- **Goals:** Book, confirm, reschedule and check in quickly. Never double-book. Know who is waiting.
- **Frustrations:** Retyping the same details, scattered WhatsApp chats, not knowing whether a reminder went out.
- **Design implications:** Keyboard-first booking. Patient search by phone in one field. Daily reception view as the home screen. Inline status changes. Inbox visible without leaving the day view.
- **Permissions:** Patients (demographics/contact), appointments, inbox, enquiries, invoice viewing and payment collection (configurable). No clinical-note editing.

## 2. Dentist — "clinician"

- **Context:** Moves between chairs with gloved hands and short time windows. May have several patients in parallel.
- **Goals:** See the patient's history at a glance, chart quickly, write notes, build treatment plans and get consent.
- **Frustrations:** Slow forms, losing previous findings, unclear treatment status.
- **Design implications:** A large-target odontogram that works on a tablet. Patient header with allergies always visible. Draft autosave. Explicit "Finalise" step.
- **Permissions:** Full clinical read/write for patients they treat (and clinic-wide read, configurable), prescriptions, treatment plans, approval of clinical marketing claims.

## 3. Dental Assistant — "chairside"

- **Context:** Supports the dentist, prepares the chair, records materials used.
- **Goals:** Record vitals and chart under dentist supervision, log material consumption.
- **Design implications:** Their chart entries are saved as _proposed_ or draft until the dentist finalises them.
- **Permissions:** Clinical read, draft charting, inventory consumption. Cannot finalise notes or prescribe.

## 4. Clinic Admin — "practice manager"

- **Context:** Oversees operations, staff accounts, settings and reports.
- **Goals:** Configure the clinic profile, hours, chairs, appointment types, templates and users. Review performance.
- **Design implications:** Settings grouped clearly. Audit log viewer. Sensitive actions require confirmation.
- **Permissions:** Everything operational, user and role management (except creating Super Admins), with sensitive actions audited.

## 5. Accountant

- **Context:** Part-time or periodic. Reconciles daily collections and tracks dues.
- **Goals:** Accurate invoices, receipts, refunds and reconciliation by payment method. Exportable reports.
- **Permissions:** Billing and payments in full, financial reports and exports. Patient identity and contact only. No clinical notes. Line items show procedure names.

## 6. Marketing Manager

- **Context:** May be an external agency or a staff member.
- **Goals:** Plan the content calendar, draft posts, get approvals, see enquiry attribution and aggregate stats.
- **Permissions:** Marketing workspace, aggregated analytics, review responses. **No access to patient records or clinical data.** Campaign audiences are chosen by segment, and recipient identities are not shown.

## 7. Super Admin — "platform owner / IT"

- **Context:** Technical owner. Rarely uses the app day to day.
- **Goals:** System configuration, break-glass access, integrations and secrets setup.
- **Permissions:** All administrative and operational permissions, but **not** clinical finalisation or amendment, prescribing, or clinical marketing approval. Those stay with registered dentists (see the access-control matrix). Every action is audited. MFA required in production (Phase 12).

## 8. Patient

- **Context:** A local resident of Pathanamthitta and nearby areas, on a mobile phone. Prefers WhatsApp. Could be any age, including parents booking for children.
- **Goals:** Find trustworthy information, book easily on WhatsApp, get reminders, understand treatment and costs.
- **Frustrations:** Unclear pricing or hours, slow sites, having to call during working hours.
- **Design implications:** Mobile-first public site, a large WhatsApp CTA, plain language, fast loading on 4G, clear location and hours.
- **Permissions (later portal):** Own profile, appointments, invoices and shared documents only.
