-- CreateTable
CREATE TABLE "LeadRequest" (
    "id" TEXT NOT NULL,
    "sourceService" VARCHAR(64) NOT NULL,
    "sourceUrl" TEXT,
    "sourceLabel" VARCHAR(64),
    "message" TEXT NOT NULL,
    "contactMethods" JSONB NOT NULL,
    "metadata" JSONB,
    "leadId" VARCHAR(255),
    "aiSubmissionId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadRequest_createdAt_idx" ON "LeadRequest"("createdAt");

-- CreateIndex
CREATE INDEX "LeadRequest_sourceService_idx" ON "LeadRequest"("sourceService");
