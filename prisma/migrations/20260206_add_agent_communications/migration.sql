-- CreateTable
CREATE TABLE "AgentCommunication" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fromAgent" VARCHAR(255) NOT NULL,
    "toAgent" VARCHAR(255) NOT NULL,
    "messageType" VARCHAR(64) NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentCommunication_sessionId_idx" ON "AgentCommunication"("sessionId");

-- CreateIndex
CREATE INDEX "AgentCommunication_createdAt_idx" ON "AgentCommunication"("createdAt");

-- CreateIndex
CREATE INDEX "AgentCommunication_fromAgent_idx" ON "AgentCommunication"("fromAgent");

-- CreateIndex
CREATE INDEX "AgentCommunication_toAgent_idx" ON "AgentCommunication"("toAgent");

-- CreateIndex
CREATE INDEX "AgentCommunication_sessionId_createdAt_idx" ON "AgentCommunication"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "AgentCommunication" ADD CONSTRAINT "AgentCommunication_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
