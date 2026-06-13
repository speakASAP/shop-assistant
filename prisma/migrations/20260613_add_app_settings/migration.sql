-- CreateTable: AppSetting for safe non-secret admin-editable runtime settings
CREATE TABLE IF NOT EXISTS "AppSetting" (
    "key" VARCHAR(128) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedBy" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "AppSetting_updatedAt_idx" ON "AppSetting"("updatedAt");
