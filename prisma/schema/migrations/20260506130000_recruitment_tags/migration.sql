DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RecruitmentTagType') THEN
    CREATE TYPE "RecruitmentTagType" AS ENUM ('SKILL', 'LANGUAGE', 'CERTIFICATION');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "RecruitmentTag" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "type" "RecruitmentTagType" NOT NULL,
  "name" TEXT NOT NULL,
  "nameLower" TEXT NOT NULL,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RecruitmentTag_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RecruitmentTag"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RecruitmentTag_organizationId_fkey'
  ) THEN
    ALTER TABLE "RecruitmentTag"
      ADD CONSTRAINT "RecruitmentTag_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "RecruitmentTag_organizationId_type_nameLower_key"
  ON "RecruitmentTag"("organizationId", "type", "nameLower");

CREATE INDEX IF NOT EXISTS "RecruitmentTag_organizationId_type_usageCount_idx"
  ON "RecruitmentTag"("organizationId", "type", "usageCount" DESC);
