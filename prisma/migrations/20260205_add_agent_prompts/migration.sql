-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('SEARCH', 'COMPARISON', 'LOCATION', 'COMMUNICATION', 'PRESENTATION');

-- CreateTable
CREATE TABLE "AgentPrompt" (
    "id" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentPrompt_agentType_idx" ON "AgentPrompt"("agentType");

-- CreateIndex
CREATE INDEX "AgentPrompt_agentType_isActive_idx" ON "AgentPrompt"("agentType", "isActive");
