-- CreateTable: AccountProfile for multi-user per account (10.3)
CREATE TABLE IF NOT EXISTS "AccountProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AccountProfile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AccountProfile_userId_idx" ON "AccountProfile"("userId");

-- AlterTable: Session add optional profileId (10.3)
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "profileId" TEXT;

ALTER TABLE "Session"
ADD CONSTRAINT "Session_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "AccountProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Session_profileId_idx" ON "Session"("profileId");

-- CreateTable: SavedSearchCriteria (10.4)
CREATE TABLE IF NOT EXISTS "SavedSearchCriteria" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priorities" JSONB,
    "productIntents" JSONB,
    "filters" JSONB,
    "profileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SavedSearchCriteria_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SavedSearchCriteria_userId_idx" ON "SavedSearchCriteria"("userId");
CREATE INDEX IF NOT EXISTS "SavedSearchCriteria_profileId_idx" ON "SavedSearchCriteria"("profileId");

ALTER TABLE "SavedSearchCriteria"
ADD CONSTRAINT "SavedSearchCriteria_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "AccountProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

