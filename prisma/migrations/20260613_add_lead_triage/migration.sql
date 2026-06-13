ALTER TABLE "LeadRequest"
ADD COLUMN "triageStatus" VARCHAR(32) NOT NULL DEFAULT 'new',
ADD COLUMN "assignedTo" VARCHAR(255),
ADD COLUMN "adminNotes" TEXT,
ADD COLUMN "triagedAt" TIMESTAMP(3),
ADD COLUMN "triagedBy" VARCHAR(255);

CREATE INDEX "LeadRequest_triageStatus_idx" ON "LeadRequest"("triageStatus");
