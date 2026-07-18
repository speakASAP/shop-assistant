# VAL-SA-G8-P1

Status: pass
Owner: SA-G8-P1 worker
Created: 2026-07-03
Last updated: 2026-07-03

## Intent Preservation Chain

Vision: Shop Assistant converts voice/text shopping intent into truthful merchant options while preserving privacy.
Goal Impact: GOAL-SA-G8 closes sales-readiness gaps before commercial launch.
System: NestJS backend, static frontend, PostgreSQL/Prisma, hosted Auth, ai-microservice/search delegation.
Feature: Privacy retention, account data erasure/anonymization, and search abuse controls.
Task: SA-G8-P1 Privacy Retention And Rate Limits.
Execution Plan: EP-SA-G8-SALES-READINESS, ready_parallel worker lane.
Coding Prompt: PROMPT-SA-G8-SALES-READINESS.
Code: Implemented in `src/common/search-rate-limit.service.ts`, `src/sessions/sessions.controller.ts`, `src/sessions/sessions.module.ts`, `src/me/me.controller.ts`, `src/me/me.service.ts`, and `public/privacy.html`.
Validation: See command evidence below.

## Implemented Controls

- Added in-process search/refinement rate limiting for public anonymous session query/feedback endpoints keyed by client IP.
- Added in-process search/refinement rate limiting for authenticated `/api/me/sessions/:id/query` and `/api/me/sessions/:id/feedback` keyed by Auth user id.
- Added signed-in user privacy endpoint `POST /api/me/privacy/session-data/anonymize` to detach account session records from the account and scrub message/search-run/agent-communication text.
- Added signed-in user privacy endpoint `DELETE /api/me/privacy/session-data` to delete current-user sessions plus saved criteria and profiles using existing Prisma cascade behavior for session children.
- Updated `public/privacy.html` with implemented deletion/anonymization, retention, logging, and rate-limit behavior.

## Validation Evidence

- `npm install`: pass in isolated remote worktree to restore missing local CLI dependencies; reported existing dependency audit findings (32 total: 3 low, 16 moderate, 13 high), not changed by this task.
- `npm run build`: pass.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/shop_assistant npx prisma validate`: pass with non-secret placeholder URL.
- `npm run prisma:generate`: pass.
- `git diff --check`: pass.
- Rate-limit smoke: `node -e ... SearchRateLimitService ...`: pass; second request over a max=1 test bucket returned HTTP 429.
- Focused static wiring scan: `rg -n "assertAllowed|privacy/session-data|anonymizeSessionData|deleteSessionData|SearchRateLimitService" src/me src/sessions src/common`: pass; public and current-user query/feedback endpoints call the limiter and privacy endpoints are present.
- Sensitive added-line token/key scan: `git diff -U0 ... | rg "^\+.*(BEGIN [A-Z ]*PRIVATE KEY|Authorization: Bearer|eyJ...|CUSTOMER_TOKEN=|ADMIN_TOKEN=|NON_ADMIN_TOKEN=|AKIA...|-----BEGIN|password=|secret=|token=)" || true`: pass; no matches. A broader scan also returned existing public legal contact text and historical state/report words such as `secret`, which are not newly added credentials.

## Sensitive Data Check

No secrets, JWTs, raw production queries, lead contacts, raw profile data, raw database exports, or production records were added. Validation used only source/static checks and a synthetic in-memory rate-limit key.

## Schema And Migration Notes

No Prisma schema migration was required. Deletion uses existing `Session` cascade relations. Anonymization uses existing nullable `Session.userId`, `Session.profileId`, `Session.usedSavedCriteriaId` fields and overwrites text-bearing child records.

## Remaining Blockers

- [MISSING: scheduled retention-job infrastructure/runner contract] Automated TTL cleanup for old anonymous sessions is documented as missing; this branch lands user-triggered deletion/anonymization and request-time rate limiting only.
- [MISSING: production-safe token/account files for live `/api/me/privacy/session-data` smoke] Authenticated destructive privacy endpoints were not run against production or shared databases in this worker branch.
- [UNKNOWN: central logging retention duration] Legal copy references the central logging retention policy because this repository does not own that service policy.

## Result

Pass for source implementation and non-production validation. Production deploy was not run.
