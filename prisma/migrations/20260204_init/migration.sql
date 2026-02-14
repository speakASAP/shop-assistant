-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SearchRun" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "refinedParams" JSONB,
    "rawSearchResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SearchResult" (
    "id" TEXT NOT NULL,
    "searchRunId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "price" TEXT,
    "source" TEXT,
    "position" INTEGER NOT NULL,
    "snippet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Choice" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "searchResultId" TEXT NOT NULL,
    "productUrl" TEXT NOT NULL,
    "chosenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Choice_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchRun" ADD CONSTRAINT "SearchRun_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchResult" ADD CONSTRAINT "SearchResult_searchRunId_fkey" FOREIGN KEY ("searchRunId") REFERENCES "SearchRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Choice" ADD CONSTRAINT "Choice_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Choice" ADD CONSTRAINT "Choice_searchResultId_fkey" FOREIGN KEY ("searchResultId") REFERENCES "SearchResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_createdAt_idx" ON "Session"("createdAt");
CREATE INDEX "Message_sessionId_idx" ON "Message"("sessionId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
CREATE INDEX "SearchRun_sessionId_idx" ON "SearchRun"("sessionId");
CREATE INDEX "SearchRun_createdAt_idx" ON "SearchRun"("createdAt");
CREATE INDEX "SearchResult_searchRunId_idx" ON "SearchResult"("searchRunId");
CREATE INDEX "Choice_sessionId_idx" ON "Choice"("sessionId");
CREATE INDEX "Choice_chosenAt_idx" ON "Choice"("chosenAt");
