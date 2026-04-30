DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectExtensionStatus') THEN
    CREATE TYPE "ProjectExtensionStatus" AS ENUM (
      'PENDING_APPROVAL',
      'APPROVED',
      'REJECTED',
      'CANCELLED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ProjectExtensionRequest" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "requestNo" TEXT NOT NULL,
  "currentStartDate" TIMESTAMP(3),
  "currentEndDate" TIMESTAMP(3) NOT NULL,
  "proposedEndDate" TIMESTAMP(3) NOT NULL,
  "currentBudget" DECIMAL(18,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "impactNotes" TEXT,
  "approvalReference" TEXT,
  "attachmentUrl" TEXT,
  "status" "ProjectExtensionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "requestedById" UUID NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedById" UUID,
  "approvedAt" TIMESTAMP(3),
  "approvalNotes" TEXT,
  "rejectedById" UUID,
  "rejectedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "cancelledById" UUID,
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "ProjectExtensionRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectExtensionRequest_organizationId_requestNo_key"
  ON "ProjectExtensionRequest"("organizationId", "requestNo");

CREATE INDEX IF NOT EXISTS "ProjectExtensionRequest_organizationId_idx"
  ON "ProjectExtensionRequest"("organizationId");

CREATE INDEX IF NOT EXISTS "ProjectExtensionRequest_projectId_idx"
  ON "ProjectExtensionRequest"("projectId");

CREATE INDEX IF NOT EXISTS "ProjectExtensionRequest_status_idx"
  ON "ProjectExtensionRequest"("status");

CREATE INDEX IF NOT EXISTS "ProjectExtensionRequest_requestedAt_idx"
  ON "ProjectExtensionRequest"("requestedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectExtensionRequest_organizationId_fkey'
  ) THEN
    ALTER TABLE "ProjectExtensionRequest"
      ADD CONSTRAINT "ProjectExtensionRequest_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectExtensionRequest_projectId_fkey'
  ) THEN
    ALTER TABLE "ProjectExtensionRequest"
      ADD CONSTRAINT "ProjectExtensionRequest_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
