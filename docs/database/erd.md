# Proposed ERD

**Status:** Proposed (Phase 0). This document becomes authoritative once each domain's Prisma schema
lands (Phases 4–10), and it must be updated alongside every migration.

Conventions: every table has `id uuid PK`, `createdAt`, `updatedAt` (except append-only tables, which
have `createdAt` only). Operational tables carry `clinicId`, and `branchId` where relevant.
Diagrams are split by domain for readability. Fields listed are the key ones; the full list is in
[`data-dictionary.md`](./data-dictionary.md).

## 1. Organisation, identity, audit

```mermaid
erDiagram
  Clinic ||--o{ Branch : has
  Clinic ||--|| ClinicSettings : configures
  Branch ||--o{ Chair : has
  Clinic ||--o{ User : employs
  User ||--o{ UserRole : has
  Role ||--o{ UserRole : assigned
  Role ||--o{ RolePermission : grants
  Permission ||--o{ RolePermission : in
  User ||--o{ Session : opens
  User ||--o{ PasswordResetToken : requests
  User ||--o{ AuditLog : acts
  User ||--o{ AccessLog : reads

  Clinic { uuid id string name string timezone }
  ClinicSettings { uuid clinicId string whatsappNumber_nullable json openingHours_nullable json profile }
  Branch { uuid id uuid clinicId string name }
  Chair { uuid id uuid branchId string label bool active }
  User { uuid id citext email string passwordHash string status uuid patientId_nullable }
  Role { uuid id string key string name bool system }
  Permission { uuid id string key string description }
  UserRole { uuid userId uuid roleId uuid clinicId }
  Session { uuid id string tokenHash timestamptz expiresAt timestamptz absoluteExpiresAt string ip string userAgent }
  AuditLog { uuid id uuid actorId string action string entityType uuid entityId json changes string ip timestamptz createdAt }
  AccessLog { uuid id uuid actorId string resourceType uuid resourceId string reason timestamptz createdAt }
```

## 2. Patients, consent, enquiries

```mermaid
erDiagram
  Patient ||--o{ PatientContact : has
  Patient ||--o{ PatientAddress : has
  Patient ||--o{ PatientTagLink : tagged
  PatientTag ||--o{ PatientTagLink : on
  Patient ||--o{ ConsentRecord : gives
  Patient ||--o{ CommunicationPreference : sets
  Patient ||--o{ PatientMergeRecord : "merged into"
  Enquiry }o--o| Patient : "converted to"
  Enquiry }o--o| Conversation : "thread"

  Patient { uuid id string patientNumber "KMDC-000123 unique" string fullName date dateOfBirth string gender_nullable string primaryPhone string email_nullable string status uuid mergedIntoId_nullable }
  PatientContact { uuid id uuid patientId string type "PHONE|EMAIL|WHATSAPP|EMERGENCY" string value string relation_nullable bool primary }
  PatientAddress { uuid id uuid patientId string line1 string city string state string postalCode }
  PatientTag { uuid id string name string color }
  ConsentRecord { uuid id uuid patientId string purpose string status timestamptz effectiveAt string source string noticeVersion uuid recordedById }
  CommunicationPreference { uuid id uuid patientId string channel bool allowed string quietHours_nullable }
  PatientMergeRecord { uuid id uuid sourcePatientId uuid targetPatientId json snapshot uuid mergedById }
  Enquiry { uuid id string name string phone string message string source json utm string status uuid patientId_nullable }
```

## 3. Scheduling

```mermaid
erDiagram
  Patient ||--o{ Appointment : books
  User ||--o{ Appointment : "dentist"
  Chair ||--o{ Appointment : uses
  AppointmentType ||--o{ Appointment : typed
  Appointment ||--o| Appointment : "rescheduledFrom"
  Appointment ||--o{ AppointmentStatusHistory : transitions
  User ||--o{ DoctorSchedule : "weekly hours"
  User ||--o{ Availability : "exceptions (leave/extra)"
  Patient ||--o{ WaitingListEntry : waits

  Appointment { uuid id uuid patientId uuid dentistId uuid chairId_nullable uuid typeId timestamptz startsAt timestamptz endsAt tstzrange timeRange "generated" string status string source "WHATSAPP|WEB|PHONE|WALK_IN" uuid branchId }
  AppointmentType { uuid id string name int defaultDurationMin string color bool active }
  AppointmentStatusHistory { uuid id uuid appointmentId string fromStatus string toStatus uuid actorId string reason timestamptz createdAt }
  DoctorSchedule { uuid id uuid dentistId int weekday time startTime time endTime uuid branchId }
  Availability { uuid id uuid dentistId timestamptz startsAt timestamptz endsAt string kind "UNAVAILABLE|EXTRA" }
  WaitingListEntry { uuid id uuid patientId uuid dentistId_nullable daterange preferred string status }
```

Constraint (raw SQL, ADR-009): `EXCLUDE USING gist ("dentistId" WITH =, "timeRange" WITH &&) WHERE (status in active set)`,
and the same for `"chairId"`.

## 4. Medical, clinical, dental chart, treatment

```mermaid
erDiagram
  Patient ||--o| MedicalHistory : has
  Patient ||--o{ Allergy : has
  Patient ||--o{ Medication : takes
  Patient ||--o{ Encounter : visits
  Appointment ||--o| Encounter : "for"
  Encounter ||--o{ Diagnosis : records
  Encounter ||--o{ ClinicalNote : documents
  ClinicalNote ||--o{ ClinicalNoteVersion : versions
  Encounter ||--o{ Prescription : issues
  Prescription ||--o{ PrescriptionItem : lists
  Patient ||--|| DentalChart : has
  DentalChart ||--o{ ToothCondition : contains
  ToothCondition ||--o{ ToothConditionHistory : history
  Encounter ||--o{ ToothCondition : "recorded in"
  Patient ||--o{ TreatmentPlan : has
  TreatmentPlan ||--o{ TreatmentItem : includes
  Procedure ||--o{ TreatmentItem : "catalogue"
  TreatmentItem }o--o| ToothCondition : "addresses"
  TreatmentPlan ||--o{ ConsentRecord : "treatment consent"

  MedicalHistory { uuid id uuid patientId json conditions string notes uuid updatedById }
  Allergy { uuid id uuid patientId string substance string severity string reaction bool active }
  Medication { uuid id uuid patientId string name string dosage bool active }
  Encounter { uuid id uuid patientId uuid dentistId uuid appointmentId_nullable string chiefComplaint string status timestamptz startedAt }
  Diagnosis { uuid id uuid encounterId string description string toothFdi_nullable string code_nullable uuid authorId }
  ClinicalNote { uuid id uuid encounterId string status "DRAFT|FINALISED|AMENDED" int currentVersion uuid authorId timestamptz finalisedAt }
  ClinicalNoteVersion { uuid id uuid noteId int version text content string amendmentReason uuid authorId timestamptz createdAt }
  Prescription { uuid id uuid encounterId uuid dentistId string status timestamptz issuedAt }
  PrescriptionItem { uuid id uuid prescriptionId string drug string dose string frequency string duration string instructions }
  DentalChart { uuid id uuid patientId string dentition "PERMANENT|PRIMARY|MIXED" }
  ToothCondition { uuid id uuid chartId string toothFdi "11..48 / 51..85" string_array surfaces string condition string status "EXISTING|PLANNED|COMPLETED" string material_nullable uuid encounterId uuid recordedById }
  ToothConditionHistory { uuid id uuid toothConditionId json snapshot uuid actorId timestamptz createdAt }
  Procedure { uuid id string code string name string category int defaultPricePaise_nullable bool active }
  TreatmentPlan { uuid id uuid patientId uuid dentistId string status "DRAFT|PROPOSED|APPROVED|IN_PROGRESS|COMPLETED|DECLINED" timestamptz approvedAt }
  TreatmentItem { uuid id uuid planId uuid procedureId string_array teethFdi string_array surfaces int estimatePaise int actualPaise_nullable int plannedVisit string status }
```

The spec lists `Tooth` and `ToothSurface` as model names. Teeth (FDI codes) and surfaces are a
**fixed reference vocabulary**, so they are implemented as validated enums/constants in
`packages/types`, not as tables. `ToothCondition` references them by code. This avoids 52+ redundant
rows per patient while keeping full per-tooth history.

## 5. Billing and inventory

```mermaid
erDiagram
  Patient ||--o{ Invoice : billed
  Invoice ||--o{ InvoiceItem : lines
  TreatmentItem |o--o{ InvoiceItem : "source"
  Invoice ||--o{ Payment : "paid by"
  Payment ||--o{ Refund : "refunded by"
  Invoice ||--o{ InvoiceAdjustment : "credit notes"
  Reconciliation ||--o{ Payment : covers
  Supplier ||--o{ PurchaseOrder : receives
  PurchaseOrder ||--o{ PurchaseOrderItem : lines
  ProductCategory ||--o{ Product : groups
  Product ||--o{ ProductBatch : batches
  Product ||--o{ StockMovement : moves
  ProductBatch ||--o{ StockMovement : "batch moves"
  PurchaseOrderItem }o--|| Product : orders

  Invoice { uuid id string invoiceNumber "unique, gapless per FY" uuid patientId string status "DRAFT|ISSUED|PARTIALLY_PAID|PAID|VOID" int subtotalPaise int discountPaise int taxPaise int totalPaise int paidPaise timestamptz issuedAt }
  InvoiceItem { uuid id uuid invoiceId uuid treatmentItemId_nullable string description int quantity int unitPricePaise int discountPaise int taxRateBp int lineTotalPaise }
  Payment { uuid id uuid invoiceId string method "CASH|UPI|CARD|ONLINE" int amountPaise string reference_nullable string receiptNumber uuid receivedById timestamptz receivedAt string provider "MOCK|..." }
  Refund { uuid id uuid paymentId int amountPaise string reason uuid approvedById timestamptz createdAt }
  InvoiceAdjustment { uuid id uuid invoiceId int amountPaise string reason uuid actorId }
  Reconciliation { uuid id date businessDate uuid branchId json totalsByMethod uuid reconciledById }
  Product { uuid id string sku string name uuid categoryId string unit int minStock bool trackBatches }
  ProductBatch { uuid id uuid productId string batchNumber date expiryDate_nullable int quantityOnHand }
  StockMovement { uuid id uuid productId uuid batchId_nullable string type "RECEIPT|CONSUMPTION|WASTAGE|ADJUSTMENT|RETURN" int quantity string reason uuid actorId uuid encounterId_nullable }
  Supplier { uuid id string name string contact_nullable }
  PurchaseOrder { uuid id uuid supplierId string status string poNumber }
  PurchaseOrderItem { uuid id uuid purchaseOrderId uuid productId int quantity int unitCostPaise }
```

## 6. Communication, automation, marketing, files

```mermaid
erDiagram
  Patient |o--o{ Conversation : participates
  Conversation ||--o{ Message : contains
  Conversation ||--o{ InternalNote : annotated
  Conversation }o--o{ ConversationLabel : labelled
  User |o--o{ Conversation : "assigned"
  MessageTemplate ||--o{ Message : renders
  WebhookEvent }o--|| Message : updates
  Workflow ||--o{ WorkflowVersion : versions
  WorkflowVersion ||--o{ WorkflowStep : steps
  WorkflowVersion ||--o{ WorkflowExecution : runs
  WorkflowExecution ||--o{ WorkflowExecutionLog : logs
  WorkflowExecution |o--o{ Message : sends
  Campaign ||--o{ CampaignRecipient : targets
  Campaign |o--o| Workflow : "executes via"
  SocialAccount ||--o{ SocialPost : publishes
  SocialPost ||--o{ SocialPostMedia : media
  SocialPostMedia }o--|| FileMetadata : file
  Document }o--|| FileMetadata : file
  Patient |o--o{ Document : owns

  Conversation { uuid id string channel "WHATSAPP|EMAIL|SMS|WEB" string externalContact uuid patientId_nullable uuid assigneeId_nullable string status int unreadCount timestamptz lastMessageAt timestamptz serviceWindowExpiresAt_nullable }
  Message { uuid id uuid conversationId string direction string body uuid templateId_nullable string status "QUEUED|SENT|DELIVERED|READ|FAILED|MOCK_DELIVERED" string providerMessageId_unique string idempotencyKey_unique string provider }
  MessageTemplate { uuid id string key string channel string category "OPERATIONAL|PROMOTIONAL|TRANSACTIONAL" string body string_array allowedVariables string providerTemplateName_nullable string approvalStatus }
  WebhookEvent { uuid id string provider string externalId_unique json payload timestamptz receivedAt timestamptz processedAt }
  OutboxEvent { uuid id string type string aggregateType uuid aggregateId json payload timestamptz occurredAt timestamptz publishedAt_nullable }
  Workflow { uuid id string key string name string status "ACTIVE|PAUSED|DISABLED" }
  WorkflowVersion { uuid id uuid workflowId int version json trigger timestamptz publishedAt }
  WorkflowStep { uuid id uuid versionId int order string type json config }
  WorkflowExecution { uuid id uuid versionId string subjectType uuid subjectId string triggerKey "unique with versionId+subjectId" string status }
  WorkflowExecutionLog { uuid id uuid executionId int stepOrder string outcome json detail timestamptz createdAt }
  Campaign { uuid id string name string status string approvalStatus uuid approvedById_nullable }
  CampaignRecipient { uuid id uuid campaignId uuid patientId string status uuid messageId_nullable }
  SocialAccount { uuid id string platform string displayName string connectionMode "MOCK|MANUAL|OAUTH" string tokenRef_nullable "secret reference, never raw" }
  SocialPost { uuid id uuid accountId_nullable string caption string_array hashtags timestamptz scheduledFor string status bool hasClinicalClaim uuid clinicalApproverId_nullable string externalUrl_nullable }
  SocialPostMedia { uuid id uuid postId uuid fileId int order }
  FileMetadata { uuid id string bucket string objectKey string mimeType int sizeBytes string sha256 uuid uploadedById }
  Document { uuid id uuid patientId_nullable uuid encounterId_nullable uuid fileId string kind "XRAY|PHOTO|CONSENT_FORM|REPORT|OTHER" string title }
```

## 7. Key relationship notes

1. **Patient ⇄ User:** Patient-role users link to exactly one `Patient` via `User.patientId`. Staff users have no patient link.
2. **Merge:** merging sets `Patient.mergedIntoId` and `status=MERGED`. Child rows are re-pointed to the target inside one transaction, and a `PatientMergeRecord` snapshot allows audit and forensic reconstruction.
3. **Appointment → Encounter:** an encounter normally comes from an appointment. Walk-ins create both together.
4. **TreatmentItem → InvoiceItem:** billing copies the price at invoice time (a snapshot). Later plan edits do not change issued invoices.
5. **Message idempotency:** `idempotencyKey` is unique (e.g. `wf:{executionId}:step:{n}`), so a retried job cannot insert a second message.
6. **Deletion policy:** soft delete (`deletedAt`) only for Patient (anonymisation flow), User (deactivation) and catalogue entries. Clinical, financial, consent, audit and message rows are never deleted.
