# User journeys

Each journey lists its steps, the system responsibilities and the domain events emitted (see
[`../architecture/event-flow.md`](../architecture/event-flow.md)).

---

## P1. New patient discovers the clinic and books on WhatsApp

1. The patient finds the site through Google or social media and lands on the home page or a service page (UTM and referrer captured, first-party only, with no third-party tracking unless analytics consent is given).
2. They read the service and taps **Book on WhatsApp**.
   - The system builds `wa.me/<configured number>?text=<prefilled message including the service name>` and records a `whatsapp_click` analytics event (aggregate only, no PII).
   - If the number is not configured, the button is disabled and shows "Booking number not yet configured".
3. They send the WhatsApp message.
   - With the Cloud API connected (Phase 8), the webhook creates or attaches a Conversation and emits `conversation.message_received`. The enquiry acknowledgement template is sent only if the clinic has enabled it.
   - Before then, the receptionist uses the WhatsApp Business app manually and logs the enquiry in the inbox.
4. Reception creates a booking request from the conversation (`appointment.requested`), picks a slot and confirms it (`appointment.confirmed`).
5. A confirmation goes out only if the patient has operational-communication consent. Reminders are scheduled automatically (24 hours before by default, configurable).

## P2. Patient submits the website enquiry form

1. The form collects name, phone, preferred time, service and message. A consent checkbox (required) covers being contacted about the enquiry. A separate optional box covers promotional messages.
2. Validation runs on the client and the server, with a honeypot, a minimum fill time and an IP rate limit.
3. The API stores the `Enquiry`, records the consent and source attribution, and emits `enquiry.created`. The enquiry appears in the inbox.
4. The patient sees a confirmation that says when the clinic will respond, but only if opening hours are configured.

## P3. Patient visit (in clinic)

1. Arrival: reception finds the appointment, sets it to **Checked in** (`appointment.checked_in`) and verifies contact details and consent.
2. The dentist opens the encounter from the queue, which moves the appointment to **In progress**.
3. Before the visit, the patient sees reminders through the channels they consented to. Messages never contain diagnosis details.

## P4. Post-visit and recall

1. After completion (`appointment.completed`): a thank-you or follow-up message is sent if the workflow is enabled and the patient has consented.
2. A review request goes to **every** completed visit that has consent, not only to "satisfied" patients (no review gating).
3. Treatment-plan follow-up reminders are sent for approved plans with pending items.
4. A routine recall is sent at the clinic-configured interval (for example 6 months), with operational consent.
5. Opt-out: the patient replies STOP or asks reception. The consent record is withdrawn, future sends are blocked and the change is audited.

---

## S1. Receptionist: start of day

1. Log in and land on the **Today** view: the schedule by chair or dentist, pending requests, unread conversations and patients waiting.
2. Confirm pending requests. Conflicts are rejected by the server with a clear message and suggested free slots.
3. Process walk-ins: search by phone. If there is no match, quick-register (duplicate check runs), then add to the queue or book the next free slot.

## S2. Dentist: encounter

1. Open the patient from the queue. The header shows name, age, **allergies** and alerts.
2. Record the chief complaint and examination, and update the odontogram (tooth → surface → condition: existing or planned).
3. Enter the diagnosis (dentist-authored) and write the clinical note (autosaved draft).
4. Create a treatment plan with items, teeth, estimates and visits. Present it to the patient and record approval and consent.
5. Write a prescription if needed. **Finalise** the note. Later changes create an amendment with a reason.
6. Mark the appointment completed, or hand off to reception for billing and the next appointment.

## S3. Reception / Accountant: billing

1. Generate an invoice from completed treatment items or add lines manually. The server computes totals.
2. Apply a discount. This needs the `billing.discount` permission and a reason, and it is audited.
3. Record a payment (cash, UPI, card or online), full or partial, and issue a receipt.
4. A refund is a separate record linked to the payment, needs permission and a reason, and is audited.
5. End of day: the reconciliation screen shows totals by method and cashier, and is marked reconciled.

## S4. Admin: configuration

1. Fill in the clinic profile (see [clinic-information-checklist.md](./clinic-information-checklist.md)): hours, chairs, appointment types, staff accounts and roles.
2. Enable or disable automation workflows, edit templates and pick WhatsApp-approved templates.
3. Review the audit log and system health (mock vs live integrations).

## S5. Marketing Manager: monthly content

1. Open the content calendar for the month and create drafts (with optional AI drafting).
2. Mark any post that contains a clinical or medical claim. It then needs Dentist approval before scheduling.
3. Publish: use the adapter if it is connected, otherwise export the content and mark it "published manually" with a link.
4. Review aggregate engagement (where the API supports it) and enquiry attribution.
