-- CreateEnum
CREATE TYPE "WorkflowTriggerType" AS ENUM ('APPOINTMENT_SCHEDULED', 'APPOINTMENT_REMINDER_DUE', 'APPOINTMENT_COMPLETED', 'APPOINTMENT_NO_SHOW', 'PATIENT_REGISTERED', 'PATIENT_BIRTHDAY', 'ROUTINE_RECALL_DUE', 'MANUAL_CAMPAIGN');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAFT');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'REQUIRES_APPROVAL', 'CANCELLED');

-- CreateTable
CREATE TABLE "WorkflowDefinition" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" "WorkflowTriggerType" NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'ACTIVE',
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkflowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "patientId" UUID,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "triggerPayload" JSONB NOT NULL,
    "resultPayload" JSONB,
    "idempotencyKey" TEXT NOT NULL,
    "scheduledFor" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMPTZ(3),
    "approvedAt" TIMESTAMPTZ(3),
    "approvedById" UUID,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowDefinition_key_key" ON "WorkflowDefinition"("key");

-- CreateIndex
CREATE INDEX "WorkflowDefinition_clinicId_triggerType_idx" ON "WorkflowDefinition"("clinicId", "triggerType");

-- CreateIndex
CREATE INDEX "WorkflowDefinition_clinicId_status_idx" ON "WorkflowDefinition"("clinicId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowExecution_idempotencyKey_key" ON "WorkflowExecution"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WorkflowExecution_clinicId_status_idx" ON "WorkflowExecution"("clinicId", "status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_scheduledFor_status_idx" ON "WorkflowExecution"("scheduledFor", "status");

-- AddForeignKey
ALTER TABLE "WorkflowDefinition" ADD CONSTRAINT "WorkflowDefinition_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
