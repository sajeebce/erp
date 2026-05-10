CREATE TABLE IF NOT EXISTS "EmailQueue" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "relatedModule" TEXT,
  "relatedEntityId" UUID,
  "eventKey" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailQueue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmailQueue_organizationId_eventKey_key" ON "EmailQueue"("organizationId", "eventKey");
CREATE INDEX IF NOT EXISTS "EmailQueue_organizationId_status_scheduledAt_idx" ON "EmailQueue"("organizationId", "status", "scheduledAt");
CREATE INDEX IF NOT EXISTS "EmailQueue_recipientEmail_idx" ON "EmailQueue"("recipientEmail");
