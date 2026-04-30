ALTER TABLE "Training"
  ADD COLUMN IF NOT EXISTS "organizationId" UUID;

UPDATE "Training"
SET "organizationId" = COALESCE(
  (SELECT "id" FROM "Organization" WHERE "slug" = 'cssbd' LIMIT 1),
  (SELECT "id" FROM "Organization" WHERE "slug" = 'css' LIMIT 1),
  (SELECT "id" FROM "Organization" ORDER BY "createdAt" ASC LIMIT 1)
)
WHERE "organizationId" IS NULL;

ALTER TABLE "Training"
  ALTER COLUMN "organizationId" SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Training_trainingNo_key'
  ) THEN
    ALTER TABLE "Training" DROP CONSTRAINT "Training_trainingNo_key";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Training_organizationId_trainingNo_key'
  ) THEN
    ALTER TABLE "Training"
      ADD CONSTRAINT "Training_organizationId_trainingNo_key"
      UNIQUE ("organizationId", "trainingNo");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Training_organizationId_fkey'
  ) THEN
    ALTER TABLE "Training"
      ADD CONSTRAINT "Training_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Training_organizationId_idx"
  ON "Training"("organizationId");
