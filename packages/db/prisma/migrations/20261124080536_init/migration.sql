-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'SYSTEM', 'PUBLIC');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED', 'SPAM');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicSettings" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "profile" JSONB NOT NULL,
    "patientNumberPrefix" TEXT NOT NULL DEFAULT 'KMDC',
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ClinicSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMPTZ(3),
    "passwordChangedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "clinicId" UUID,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "module" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" UUID,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId","clinicId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "csrfTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idleExpiresAt" TIMESTAMPTZ(3) NOT NULL,
    "absoluteExpiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "revokedReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "requestedIp" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "clinicId" UUID,
    "actorType" "ActorType" NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "purpose" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "service" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "message" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "consentToContact" BOOLEAN NOT NULL,
    "consentToPromotions" BOOLEAN NOT NULL DEFAULT false,
    "consentNoticeVersion" TEXT NOT NULL,
    "sourcePage" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "ipHash" TEXT,
    "handledById" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_slug_key" ON "Clinic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_clinicId_name_key" ON "Branch"("clinicId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicSettings_clinicId_key" ON "ClinicSettings"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_absoluteExpiresAt_idx" ON "Session"("absoluteExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_resourceType_resourceId_idx" ON "AccessLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AccessLog_actorId_createdAt_idx" ON "AccessLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_clinicId_status_createdAt_idx" ON "Enquiry"("clinicId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_phone_idx" ON "Enquiry"("phone");

-- CreateIndex
CREATE INDEX "OutboxEvent_publishedAt_occurredAt_idx" ON "OutboxEvent"("publishedAt", "occurredAt");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicSettings" ADD CONSTRAINT "ClinicSettings_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicSettings" ADD CONSTRAINT "ClinicSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
