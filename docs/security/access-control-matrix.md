# Access-control (permission) matrix

**Enforcement:** server-side only. Every API route declares `@RequirePermissions(...)`, and services
apply record-level scoping on top. Hiding UI elements is a convenience, never a control.
Permissions are seeded as data (`Permission`), assigned to roles (`RolePermission`), and roles are
assigned to users (`UserRole`, scoped to a clinic). Admins can create custom roles later, but cannot
grant permissions they do not hold themselves.

Roles: **SA** Super Admin · **CA** Clinic Admin · **DEN** Dentist · **REC** Receptionist ·
**DA** Dental Assistant · **ACC** Accountant · **MKT** Marketing Manager · **PAT** Patient

Legend: ✅ allowed · 🔸 limited (see note) · ❌ denied · 🅾 own records only · 📝 audited every time

## Permission catalogue

| Permission                           | SA  | CA  | DEN | REC | DA  | ACC | MKT | PAT | Notes                                                    |
| ------------------------------------ | --- | --- | --- | --- | --- | --- | --- | --- | -------------------------------------------------------- |
| **Administration**                   |
| `users.read`                         | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  |                                                          |
| `users.manage` 📝                    | ✅  | 🔸  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | CA cannot create or modify SA users                      |
| `roles.manage` 📝                    | ✅  | 🔸  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | CA can assign only permissions they hold                 |
| `sessions.revoke` 📝                 | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | 🅾   | Anyone can revoke their own sessions                     |
| `settings.read`                      | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ❌  | Clinic profile, hours, chairs                            |
| `settings.manage` 📝                 | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  |                                                          |
| `integrations.manage` 📝             | ✅  | 🔸  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | CA: toggle only; secrets set via env by SA               |
| `audit.read`                         | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  |                                                          |
| **Patients**                         |
| `patients.read`                      | ✅  | ✅  | ✅  | ✅  | ✅  | 🔸  | ❌  | 🅾   | ACC: identity + contact only                             |
| `patients.create`                    | ✅  | ✅  | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  |                                                          |
| `patients.update` 📝                 | ✅  | ✅  | ✅  | ✅  | ❌  | ❌  | ❌  | 🔸  | PAT: limited contact fields (portal, later)              |
| `patients.merge` 📝                  | ✅  | ✅  | ❌  | 🔸  | ❌  | ❌  | ❌  | ❌  | REC: propose; CA approves                                |
| `patients.export` 📝                 | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  |                                                          |
| `patients.delete` 📝                 | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | Anonymisation per retention policy, not a hard delete    |
| `consent.read`                       | ✅  | ✅  | ✅  | ✅  | ✅  | ❌  | ❌  | 🅾   |                                                          |
| `consent.manage` 📝                  | ✅  | ✅  | ✅  | ✅  | ❌  | ❌  | ❌  | 🅾   | Records grant/withdraw with source and evidence          |
| **Scheduling**                       |
| `appointments.read`                  | ✅  | ✅  | ✅  | ✅  | ✅  | 🔸  | ❌  | 🅾   | ACC: date/patient/status only                            |
| `appointments.manage`                | ✅  | ✅  | ✅  | ✅  | 🔸  | ❌  | ❌  | 🔸  | DA: check-in/start only. PAT: request/cancel own (later) |
| `schedules.manage`                   | ✅  | ✅  | 🔸  | ❌  | ❌  | ❌  | ❌  | ❌  | DEN: own availability                                    |
| **Clinical**                         |
| `clinical.read` 📝(access log)       | ✅  | 🔸  | ✅  | ❌  | ✅  | ❌  | ❌  | 🔸  | CA: break-glass, logged. PAT: shared summaries only      |
| `clinical.write`                     | ✅  | ❌  | ✅  | ❌  | 🔸  | ❌  | ❌  | ❌  | DA: drafts / chart proposals only                        |
| `clinical.finalise` 📝               | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | Dentist only, including SA. Clinical accountability      |
| `clinical.amend` 📝                  | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | Reason required                                          |
| `prescriptions.write` 📝             | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  |                                                          |
| `treatment_plans.read`               | ✅  | ✅  | ✅  | 🔸  | ✅  | 🔸  | ❌  | 🅾   | REC/ACC: items and costs, no clinical notes              |
| `treatment_plans.write`              | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  |                                                          |
| `treatment_plans.record_approval` 📝 | ✅  | ✅  | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | Records patient consent/approval                         |
| `documents.read` 📝(access log)      | ✅  | 🔸  | ✅  | 🔸  | ✅  | ❌  | ❌  | 🅾   | REC: non-clinical docs (ID, consent forms)               |
| `documents.upload`                   | ✅  | ✅  | ✅  | ✅  | ✅  | ❌  | ❌  | ❌  |                                                          |
| **Billing**                          |
| `billing.read`                       | ✅  | ✅  | 🔸  | ✅  | ❌  | ✅  | ❌  | 🅾   | DEN: own patients' invoice status                        |
| `billing.invoice`                    | ✅  | ✅  | ❌  | ✅  | ❌  | ✅  | ❌  | ❌  |                                                          |
| `billing.discount` 📝                | ✅  | ✅  | ❌  | 🔸  | ❌  | ✅  | ❌  | ❌  | REC: up to a configurable limit                          |
| `billing.payment` 📝                 | ✅  | ✅  | ❌  | ✅  | ❌  | ✅  | ❌  | ❌  |                                                          |
| `billing.refund` 📝                  | ✅  | ✅  | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  | Reason required                                          |
| `billing.void` 📝                    | ✅  | ✅  | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  | Reversing entry, never a delete                          |
| `billing.reconcile` 📝               | ✅  | ✅  | ❌  | ❌  | ❌  | ✅  | ❌  | ❌  |                                                          |
| **Inventory**                        |
| `inventory.read`                     | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ❌  | ❌  |                                                          |
| `inventory.consume`                  | ✅  | ✅  | ✅  | ❌  | ✅  | ❌  | ❌  | ❌  |                                                          |
| `inventory.manage` 📝                | ✅  | ✅  | ❌  | ❌  | ❌  | 🔸  | ❌  | ❌  | ACC: purchase orders and suppliers                       |
| **Communication**                    |
| `inbox.read`                         | ✅  | ✅  | 🔸  | ✅  | ❌  | ❌  | ❌  | ❌  | DEN: conversations assigned to them                      |
| `inbox.reply`                        | ✅  | ✅  | 🔸  | ✅  | ❌  | ❌  | ❌  | ❌  |                                                          |
| `templates.manage` 📝                | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | 🔸  | ❌  | MKT: promotional templates only                          |
| `enquiries.read`                     | ✅  | ✅  | ❌  | ✅  | ❌  | ❌  | 🔸  | ❌  | MKT: aggregate attribution only, no PII                  |
| **Automation**                       |
| `workflows.read`                     | ✅  | ✅  | ❌  | ✅  | ❌  | ❌  | 🔸  | ❌  | MKT: campaign workflows                                  |
| `workflows.manage` 📝                | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  |                                                          |
| `workflows.approve` 📝               | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | Sensitive campaign sends                                 |
| **Marketing**                        |
| `marketing.read`                     | ✅  | ✅  | ✅  | ❌  | ❌  | ❌  | ✅  | ❌  |                                                          |
| `marketing.manage`                   | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  | Drafts, calendar, media                                  |
| `marketing.approve_clinical` 📝      | ❌  | ❌  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | Dentist sign-off on clinical claims                      |
| `marketing.publish` 📝               | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  | Blocked if clinical approval is pending                  |
| `campaigns.send` 📝                  | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | 🔸  | ❌  | MKT: request; CA approves                                |
| **Analytics**                        |
| `analytics.clinic`                   | ✅  | ✅  | 🔸  | ❌  | ❌  | 🔸  | ❌  | ❌  | DEN: own stats. ACC: financial KPIs                      |
| `analytics.marketing`                | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ✅  | ❌  | Aggregated only                                          |
| `analytics.export` 📝                | ✅  | ✅  | ❌  | ❌  | ❌  | 🔸  | 🔸  | ❌  | Scoped to the role's own analytics                       |

## Key boundaries (from spec §6), and how they are enforced

1. **Receptionists cannot silently edit clinical notes.** REC lacks `clinical.write`/`clinical.read`, so the API rejects the request with 403.
2. **Accountants have no unrestricted clinical access.** ACC lacks `clinical.read`. Billing DTOs include procedure names and prices, never note text.
3. **Marketing has no clinical or patient access.** MKT lacks `patients.read`. Campaign audiences are resolved server-side and shown as counts.
4. **Patients see only their own records.** 🅾 rules are enforced in the service layer with `where: { patientId: actor.patientId }`.
5. **Admin actions are audited.** Every 📝 permission writes an `AuditLog` row in the same transaction.
6. **Clinical finalisation is restricted to Dentists**, including over Super Admin, so clinical accountability stays with a registered dentist. Super Admin break-glass read access is logged in `AccessLog`.

## Testing

Phase 4 adds a table-driven authorisation test that loads this matrix (mirrored in
`packages/types/src/permissions.ts`) and asserts allow or deny for every role × representative
endpoint. A change to this document must update that source file and its tests.
