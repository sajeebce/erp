-- Phase 6: prevent duplicate auto-posted journal entries for one procurement GRN.
CREATE UNIQUE INDEX "JournalEntry_sourceModule_sourceId_key"
ON "JournalEntry"("sourceModule", "sourceId");
