-- AlterTable AgentPrompt: add model and role for flexible AI model and role-based prompts
ALTER TABLE "AgentPrompt" ADD COLUMN "model" VARCHAR(255);
ALTER TABLE "AgentPrompt" ADD COLUMN "role" VARCHAR(64);

-- CreateIndex
CREATE INDEX "AgentPrompt_agentType_role_idx" ON "AgentPrompt"("agentType", "role");
CREATE INDEX "AgentPrompt_agentType_role_isActive_idx" ON "AgentPrompt"("agentType", "role", "isActive");
