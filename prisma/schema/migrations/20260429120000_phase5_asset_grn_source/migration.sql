-- Phase 5: structured source references for assets registered from procurement GRNs.
ALTER TABLE "Asset"
ADD COLUMN "sourceModule" TEXT,
ADD COLUMN "sourceId" UUID,
ADD COLUMN "sourceLineId" UUID,
ADD COLUMN "sourceUnitIndex" INTEGER;

CREATE UNIQUE INDEX "Asset_sourceModule_sourceLineId_sourceUnitIndex_key"
ON "Asset"("sourceModule", "sourceLineId", "sourceUnitIndex");

CREATE INDEX "Asset_sourceModule_sourceId_idx" ON "Asset"("sourceModule", "sourceId");
CREATE INDEX "Asset_sourceLineId_idx" ON "Asset"("sourceLineId");
