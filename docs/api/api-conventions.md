# API conventions

**Status:** Defined (Phase 0). Implemented from Phase 4.

## Base

- Base path `/api/v1`. Breaking changes require `/api/v2`.
- JSON only, UTF-8. Field names in camelCase.
- Timestamps are ISO-8601 UTC (`2026-11-12T04:30:00.000Z`). Date-only values are `YYYY-MM-DD`.
- Money is integer paise plus `currency: "INR"`, e.g. `{ "totalPaise": 150000, "currency": "INR" }`.
- IDs are UUID strings. Human numbers (patient number, invoice number) are separate fields.

## Resources and verbs

| Action           | Method                         | Example                                                                               |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| List             | GET                            | `/patients?search=…&page=1&pageSize=25&sort=-createdAt`                               |
| Read             | GET                            | `/patients/{id}`                                                                      |
| Create           | POST                           | `/patients`                                                                           |
| Partial update   | PATCH                          | `/patients/{id}`                                                                      |
| State transition | POST to an action sub-resource | `/appointments/{id}/check-in`, `/clinical-notes/{id}/finalise`                        |
| Delete           | DELETE                         | Only for genuinely deletable resources. Clinical and financial records have no DELETE |

State transitions are explicit actions, not PATCHes of `status`, so each one can carry its own
permission, validation, audit entry and event.

## Pagination, sorting and filtering

- Offset pagination for staff lists: `page` (1-based) and `pageSize` (default 25, max 100).
  Cursor pagination (`cursor`, `limit`) for feeds such as messages and the timeline.
- Response: `{ "data": [...], "meta": { "page": 1, "pageSize": 25, "total": 312 } }`.
- Sort: `sort=field` or `sort=-field`. Only allow-listed fields.
- Filters: explicit query params validated by Zod (e.g. `status=CONFIRMED&dentistId=…&from=…&to=…`).

## Errors

```json
{
  "error": {
    "code": "APPOINTMENT_CONFLICT",
    "message": "The dentist already has an appointment at this time.",
    "details": [{ "path": "startsAt", "issue": "overlaps" }],
    "requestId": "01J…"
  }
}
```

| HTTP | Typical codes                                                                       |
| ---- | ----------------------------------------------------------------------------------- |
| 400  | `VALIDATION_FAILED`                                                                 |
| 401  | `UNAUTHENTICATED`, `SESSION_EXPIRED`                                                |
| 403  | `FORBIDDEN`, `CSRF_INVALID`                                                         |
| 404  | `NOT_FOUND` (also used where revealing existence would leak information)            |
| 409  | `APPOINTMENT_CONFLICT`, `INVALID_STATE_TRANSITION`, `RECORD_FINALISED`, `DUPLICATE` |
| 422  | `BUSINESS_RULE_VIOLATION` (e.g. `CONSENT_MISSING`)                                  |
| 429  | `RATE_LIMITED` (with `Retry-After`)                                                 |
| 500  | `INTERNAL_ERROR` (no internals exposed)                                             |

## Security headers and request rules

- Authentication through the session cookie. CSRF header `X-CSRF-Token` on POST/PATCH/PUT/DELETE.
- `X-Request-Id` is accepted or generated and echoed back.
- Idempotency: POSTs that create money or messages accept an `Idempotency-Key` header (stored 24 h).
- Body size limit 1 MB (file uploads use a dedicated endpoint).

## Webhooks

`/api/v1/webhooks/{provider}`: signature verified before parsing, raw payload stored in
`WebhookEvent` (unique on provider + external ID), immediate `200` response, asynchronous processing.
