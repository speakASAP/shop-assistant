ALTER TABLE "LeadRequest"
  ADD COLUMN "leadForwardingStatus" VARCHAR(32) NOT NULL DEFAULT 'pending',
  ADD COLUMN "leadForwardingError" TEXT,
  ADD COLUMN "leadForwardedAt" TIMESTAMP(3),
  ADD COLUMN "aiAnalysisStatus" VARCHAR(32) NOT NULL DEFAULT 'pending',
  ADD COLUMN "aiAnalysisError" TEXT,
  ADD COLUMN "aiAnalyzedAt" TIMESTAMP(3);

CREATE INDEX "LeadRequest_leadForwardingStatus_idx" ON "LeadRequest"("leadForwardingStatus");
CREATE INDEX "LeadRequest_aiAnalysisStatus_idx" ON "LeadRequest"("aiAnalysisStatus");
