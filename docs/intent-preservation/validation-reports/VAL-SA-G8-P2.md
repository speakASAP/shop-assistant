# VAL-SA-G8-P2

Status: pass
Owner: SA-G8-P2 worker
Created: 2026-07-03
Last updated: 2026-07-03

## Intent Preservation Chain

Vision: Shop Assistant converts voice/text shopping intent into truthful merchant options while preserving privacy.
Goal Impact: GOAL-SA-G8 closes sales-readiness privacy retention gaps before commercial launch.
System: NestJS backend, static frontend, PostgreSQL/Prisma, hosted Auth, Kubernetes production managed outside this branch.
Feature: Repo-owned anonymous-session TTL retention runner contract.
Task: SA-G8-P2 Retention Runner Contract.
Execution Plan: EP-SA-G8-SALES-READINESS, ready_parallel P2 worker lane after P1.
Coding Prompt: PROMPT-SA-G8-SALES-READINESS plus orchestrator P2 delegation.
Code: Implemented in `scripts/retention-cleanup.js`, `package.json`, `public/privacy.html`, `TASKS.md`, and `STATE.json`.
Validation: See command evidence below.

## Implemented Runner Contract

- Added `scripts/retention-cleanup.js` and npm script `retention:cleanup`.
- Dry-run is the default; `--help` prints the safety contract without DB access.
- Apply mode requires `--apply` plus `RETENTION_CLEANUP_APPLY_CONFIRM=delete-old-anonymous-sessions`.
- Eligible records are limited to old `Session` rows where `userId IS NULL` and `createdAt` is older than `RETENTION_ANONYMOUS_SESSION_TTL_DAYS`.
- `RETENTION_ANONYMOUS_SESSION_TTL_DAYS` defaults to 30 days and `RETENTION_CLEANUP_BATCH_SIZE` defaults to 100 with a hard cap of 1000.
- Account-bound sessions are intentionally out of scope and not selected by this runner.
- Output is aggregate-only and does not print raw queries, messages, result URLs, JWTs, secrets, lead details, profile names, or database URLs.
- Production scheduling remains an operations/deploy task; this branch does not install a Kubernetes CronJob or run production apply mode.

## Validation Evidence

- `npm run build`: pass.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/shop_assistant npx prisma validate`: pass with placeholder non-secret URL.
- `npm run retention:cleanup -- --help`: pass; help text printed without requiring `DATABASE_URL`.
- Synthetic dry-run/apply validation against temporary PostgreSQL in Docker: pass; dry-run counted one old anonymous session and deleted zero rows; apply with explicit confirmation deleted exactly one old anonymous session, left one recent anonymous session, and left one old account-bound session.
- `git diff --check`: pass.
- Sensitive-data scan of touched files: pass; matches were limited to the placeholder Prisma validation URL in this report and pre-existing token-hardening state text; no real secrets, JWTs, raw production queries, lead contacts, profile PII, database URLs, or raw exports added.

## Sensitive Data Check

No secrets, JWTs, raw production queries, lead contacts, raw profile data, raw database exports, production records, or database credentials were added. Validation used a placeholder Prisma URL and a synthetic local Docker database only.

## Remaining Blockers

- [MISSING: owner-approved production scheduling/deploy wiring] The repo now owns the runner contract, but no production CronJob/system scheduler was added or deployed in this branch.
- [UNKNOWN: central logging retention duration] Legal copy still delegates central operational log retention to the logging service policy.

## Result

Pass for repo-owned dry-run-first anonymous-session TTL cleanup runner contract. Production apply and production deploy were intentionally not run.
