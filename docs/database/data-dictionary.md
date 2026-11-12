# Data dictionary

**Status:** Seeded with core vocabularies (Phase 0). Each phase adds its tables' full field
definitions here when the Prisma schema is written.

## Controlled vocabularies

### AppointmentStatus

| Value         | Meaning                                                            | Allowed next states                         |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| `REQUESTED`   | Booking request received (web/WhatsApp/phone), not yet confirmed   | CONFIRMED, CANCELLED, RESCHEDULED           |
| `CONFIRMED`   | Slot confirmed by clinic                                           | CHECKED_IN, CANCELLED, NO_SHOW, RESCHEDULED |
| `CHECKED_IN`  | Patient arrived                                                    | IN_PROGRESS, CANCELLED                      |
| `IN_PROGRESS` | With dentist                                                       | COMPLETED                                   |
| `COMPLETED`   | Visit finished                                                     | — (terminal)                                |
| `CANCELLED`   | Cancelled by patient or clinic (reason required)                   | —                                           |
| `NO_SHOW`     | Did not attend (set after start time only)                         | —                                           |
| `RESCHEDULED` | Replaced by a new appointment (`rescheduledFromId` on the new one) | —                                           |

Slot-blocking states (ADR-009): REQUESTED, CONFIRMED, CHECKED_IN, IN_PROGRESS.

### ConsentPurpose

`CLINICAL_PROCESSING` · `OPERATIONAL_COMMS` · `PROMOTIONAL_COMMS` · `ANALYTICS`. See [privacy-design](../security/privacy-design.md).

### ConsentStatus

`GRANTED` · `WITHDRAWN`. Each change is a new row (`effectiveAt`).

### Channel

`WHATSAPP` · `SMS` · `EMAIL` · `WEB` (website enquiry/form).

### MessageStatus

`QUEUED` · `SENT` · `DELIVERED` · `READ` · `FAILED` · `MOCK_DELIVERED` (never shown as "Delivered").

### Teeth (FDI, ADR-015)

- Permanent: 11–18, 21–28, 31–38, 41–48 (32 teeth)
- Primary: 51–55, 61–65, 71–75, 81–85 (20 teeth)

### Tooth surfaces

`M` mesial · `D` distal · `O` occlusal (posterior) · `I` incisal (anterior) · `B` buccal · `F` facial/labial (anterior) · `L` lingual (lower) · `P` palatal (upper)

### ToothConditionType (initial; to be confirmed by the clinic's dentists)

`CARIES` · `RESTORATION` (with material: composite, amalgam, GIC, ceramic, other) · `MISSING` · `EXTRACTED` · `EXTRACTION_PLANNED` ·
`ROOT_CANAL_TREATED` · `CROWN` · `BRIDGE_ABUTMENT` · `BRIDGE_PONTIC` · `IMPLANT` · `FRACTURE` · `SEALANT` ·
`IMPACTED` · `UNERUPTED` · `MOBILITY` · `OTHER` (free text, dentist-authored)

### ToothConditionStatus

`EXISTING` (found on examination) · `PLANNED` (recommended by dentist) · `COMPLETED` (done in this clinic)

### ClinicalNoteStatus

`DRAFT` (editable by author) · `FINALISED` (immutable) · `AMENDED` (finalised with ≥ 1 amendment version)

### InvoiceStatus

`DRAFT` · `ISSUED` · `PARTIALLY_PAID` · `PAID` · `VOID`

### PaymentMethod

`CASH` · `UPI` · `CARD` · `ONLINE`

### StockMovementType

`RECEIPT` · `CONSUMPTION` · `WASTAGE` · `ADJUSTMENT` · `RETURN`

### Role keys

`SUPER_ADMIN` · `CLINIC_ADMIN` · `DENTIST` · `RECEPTIONIST` · `DENTAL_ASSISTANT` · `ACCOUNTANT` · `MARKETING_MANAGER` · `PATIENT`

## Identifiers

| Identifier     | Format                                     | Notes                                                            |
| -------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| Patient number | `KMDC-` + 6-digit zero-padded sequence     | Human-friendly, unique, never reused. The prefix is configurable |
| Invoice number | `INV/{FY}/{seq}` e.g. `INV/2026-27/000001` | Gapless per Indian financial year (Apr–Mar)                      |
| Receipt number | `RCP/{FY}/{seq}`                           | Gapless per FY                                                   |
| Purchase order | `PO/{FY}/{seq}`                            |                                                                  |
