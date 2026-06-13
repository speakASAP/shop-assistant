-- Add traceability from sessions started by saved criteria reuse back to the criteria template.
ALTER TABLE "Session" ADD COLUMN "usedSavedCriteriaId" TEXT;

CREATE INDEX "Session_usedSavedCriteriaId_idx" ON "Session"("usedSavedCriteriaId");

ALTER TABLE "Session"
ADD CONSTRAINT "Session_usedSavedCriteriaId_fkey"
FOREIGN KEY ("usedSavedCriteriaId") REFERENCES "SavedSearchCriteria"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
