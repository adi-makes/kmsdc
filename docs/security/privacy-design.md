# Privacy design

> **Legal disclaimer:** This document describes _technical_ privacy controls. It is not legal advice
> and does not certify compliance. The Digital Personal Data Protection Act, 2023 (DPDP Act) and the
> DPDP Rules, plus any health-sector rules (for example the Indian Medical Council / Dental Council
> record-keeping guidance and Clinical Establishments rules where adopted by Kerala), must be reviewed
> by a qualified professional **before production use with real patient data**.

## 1. Data categories

| Category           | Examples                                                                    | Sensitivity      | Who can access                                    |
| ------------------ | --------------------------------------------------------------------------- | ---------------- | ------------------------------------------------- |
| Identity & contact | Name, phone, email, address, DOB                                            | High             | Clinical + front-desk roles                       |
| Clinical           | Medical/dental history, allergies, notes, odontogram, X-rays, prescriptions | **Very high**    | Dentist, Assistant (limited), audited break-glass |
| Financial          | Invoices, payments, refunds                                                 | High             | Accountant, admin, reception (collection)         |
| Communication      | Message content, phone numbers, delivery status                             | High             | Inbox roles                                       |
| Marketing          | Aggregates, opt-in segment counts                                           | Low (aggregated) | Marketing                                         |
| Website analytics  | Page views, referrer, UTM (first-party, no PII)                             | Low              | Marketing, admin                                  |

## 2. Consent model (purpose-specific)

`ConsentRecord(patientId, purpose, status, grantedAt, withdrawnAt, source, evidence, recordedById, noticeVersion)`

| Purpose               | Required for                                                     | Default                                                      |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `CLINICAL_PROCESSING` | Creating clinical records (treatment)                            | Recorded at registration                                     |
| `OPERATIONAL_COMMS`   | Appointment confirmations, reminders, recalls, payment reminders | Asked at registration or enquiry                             |
| `PROMOTIONAL_COMMS`   | Birthday or festival greetings, campaigns, offers                | **Off** unless explicitly opted in                           |
| `ANALYTICS`           | Optional website analytics cookies                               | Off. Cookie banner only if non-essential tracking is enabled |

Channel-level preferences are stored separately (`CommunicationPreference`: WhatsApp, SMS, email,
and quiet hours). A send requires **purpose consent AND channel permission AND that the template's
category matches the purpose**. Withdrawal takes effect immediately: queued jobs re-check consent at
send time. STOP or UNSUBSCRIBE replies are honoured automatically.

Records are append-only. Granting and withdrawing each create a row, which keeps a complete
history.

## 3. Data minimisation in messages

- Reminders contain the patient's first name, date and time, clinic name and contact. They contain
  **no diagnosis, procedure or clinical detail**.
- Template variables are allow-listed per template category. Clinical fields cannot be bound to
  promotional or operational templates.
- Logs redact names, phones, emails, message bodies, note text, tokens and cookies (pino redaction paths).
- Job payloads in Redis contain IDs only. Handlers fetch data at execution time.

## 4. Data-subject rights (technical support)

| Right            | Mechanism                                                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access           | Admin-generated export of a patient's record (audited). Portal access later                                                                                     |
| Correction       | Update with audit history. Clinical corrections go through amendments                                                                                           |
| Erasure          | Anonymisation workflow, subject to mandatory clinical record retention periods (to be confirmed legally). Financial records are retained as required by tax law |
| Withdraw consent | Per purpose, immediate effect                                                                                                                                   |
| Grievance        | Grievance officer contact shown in the privacy policy (**placeholder until supplied**)                                                                          |

## 5. Retention (to be confirmed by legal review)

Placeholders until legal confirmation: clinical records are kept for at least the period required
by applicable medical and dental record rules. Financial records are kept for the period required
by Indian tax law. Enquiries that never convert to patients are purged after a configurable period
(default proposal: 24 months). Logs are kept for 90 days. Audit logs are kept for at least as long
as the records they describe.

## 6. Environments

- **Development and preview:** synthetic data only. Seeds are generated (with an obviously fake
  marker, e.g. phone numbers in a reserved test range and names tagged `[TEST]`).
- **Production:** real data only on infrastructure that has been approved, encrypted at rest,
  backed up and access-controlled (Phase 14).
- The public GitHub repository never contains real clinic-confidential or patient information.
