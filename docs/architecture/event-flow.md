# Domain events and event flow

## 1. Mechanism (ADR-007)

```text
API request ──▶ Service ──▶ prisma.$transaction([
                               state change,
                               AuditLog insert (if sensitive),
                               OutboxEvent insert
                             ])
                                  │ commit
Worker relay (every ~1s) ◀───────┘  SELECT … FROM "OutboxEvent" WHERE "publishedAt" IS NULL
     │                              ORDER BY "occurredAt" LIMIT 100 FOR UPDATE SKIP LOCKED
     ├─▶ queue.add(event.type, payload, { jobId: event.id })   // dedupe
     └─▶ UPDATE "OutboxEvent" SET "publishedAt" = now()
                                  │
BullMQ ─▶ handlers (automation engine, notifications, analytics counters)
     • attempts: 5, backoff: exponential (base 30s), then → DLQ queue `dead-letter`
     • every side effect uses an idempotency key (unique constraint)
```

Event naming is `<aggregate>.<past-tense-verb>`. The payload carries IDs and minimal non-sensitive
fields only. Handlers re-read current state from the DB, which avoids PII in Redis and stale data.

## 2. Event catalogue (initial)

| Event                                                     | Emitted by              | Consumers                                                  |
| --------------------------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| `enquiry.created`                                         | enquiries               | automation (acknowledgement), analytics                    |
| `conversation.message_received`                           | communication (webhook) | inbox unread counters, automation (auto-ack outside hours) |
| `message.status_updated`                                  | communication (webhook) | inbox, campaign stats                                      |
| `patient.created` / `patient.merged`                      | patients                | analytics, communication (re-link threads)                 |
| `consent.granted` / `consent.withdrawn`                   | consent                 | automation (cancel pending sends)                          |
| `appointment.requested`                                   | scheduling              | automation (booking-received message)                      |
| `appointment.confirmed`                                   | scheduling              | automation (confirmation + schedule reminder)              |
| `appointment.rescheduled`                                 | scheduling              | automation (cancel old reminders, schedule new)            |
| `appointment.cancelled`                                   | scheduling              | automation (ack, cancel reminders), waiting list           |
| `appointment.checked_in` / `.started` / `.completed`      | scheduling              | automation (post-visit, review request), analytics         |
| `appointment.no_show`                                     | scheduling              | automation (no-show follow-up)                             |
| `clinical_note.finalised` / `.amended`                    | clinical                | audit timeline                                             |
| `treatment_plan.approved`                                 | treatment               | billing (suggest invoice), automation (follow-up)          |
| `invoice.issued` / `payment.recorded` / `refund.recorded` | billing                 | analytics, automation (payment reminders)                  |
| `stock.below_minimum` / `batch.expiring`                  | inventory               | automation (inventory alert to admins)                     |
| `social_post.approved` / `.published`                     | marketing               | analytics                                                  |

## 3. Scheduled (cron) jobs: worker repeatable jobs, evaluated in Asia/Kolkata

| Job                       | Default schedule (IST) | Notes                                                                                                     |
| ------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Appointment reminders     | Every 15 min scan      | Sends at the configured offset (default 24 h before). Idempotency key `reminder:{appointmentId}:{offset}` |
| Birthday greetings        | Daily 09:00            | Promotional consent required                                                                              |
| Routine recall            | Daily 10:00            | Operational consent. Interval from settings                                                               |
| Pending payment reminders | Weekly, Mon 10:00      | Requires opt-in setting. No amounts in the message body unless configured                                 |
| Inventory alerts          | Daily 08:00            | Staff notification only                                                                                   |
| Daily clinic report       | Daily 20:00            | Aggregates only, to admins                                                                                |
| Outbox relay              | Continuous (1 s poll)  | —                                                                                                         |
| Expired session cleanup   | Hourly                 | —                                                                                                         |

## 4. Workflow execution model (Phase 9)

`Workflow` → active `WorkflowVersion` (immutable once published) → ordered `WorkflowStep`s of type
`CONDITION | ACTION | WAIT | APPROVAL`. A trigger (an event or cron) creates a `WorkflowExecution`
(unique on `workflowVersionId + subjectId + triggerKey`). Each step writes a
`WorkflowExecutionLog`. A WAIT step schedules a delayed BullMQ job. An APPROVAL step pauses the
execution until a permitted user approves it. Every send passes through the consent check in the
`communication` module.
