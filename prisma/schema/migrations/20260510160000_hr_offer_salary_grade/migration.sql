ALTER TABLE "JobApplication"
  ADD COLUMN IF NOT EXISTS "offerSalaryGradeId" UUID,
  ADD COLUMN IF NOT EXISTS "offerMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "offerLeaveBenefits" JSONB,
  ADD COLUMN IF NOT EXISTS "offerSentAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'JobApplication_offerSalaryGradeId_fkey'
  ) THEN
    ALTER TABLE "JobApplication"
      ADD CONSTRAINT "JobApplication_offerSalaryGradeId_fkey"
      FOREIGN KEY ("offerSalaryGradeId") REFERENCES "SalaryGrade"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "JobApplication_offerSalaryGradeId_idx" ON "JobApplication"("offerSalaryGradeId");
