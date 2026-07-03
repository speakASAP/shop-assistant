# VAL-SA-G8-S1

Status: pass
Owner: SA-G8-S1 worker
Created: 2026-07-03
Updated: 2026-07-03

## Intent Preservation Chain

- Vision: Shop Assistant converts shopping intent into truthful comparable merchant options while preserving privacy.
- Goal Impact: GOAL-SA-G8 sales readiness requires lower zero-result friction without weakening merchant URL truthfulness.
- System: NestJS backend delegates search to ai-microservice and persists session-scoped search runs/results.
- Feature: Search quality and zero-result reduction.
- Task: SA-G8-S1.
- Execution Plan: `docs/intent-preservation/21_execution_plans/EP-SA-G8-SALES-READINESS.md`.
- Coding Prompt: `docs/intent-preservation/coding-prompts/PROMPT-SA-G8-SALES-READINESS.md`.
- Code: `src/sessions/search.service.ts`, `scripts/sa-g8-s1-search-quality-probes.js`.
- Validation: commands and evidence below.

## Validation Evidence

Repository root: `/home/ssf/Documents/Github/shop-assistant-worktrees/sa-g8-s1`
Branch: `codex/sa-g8-s1-search-quality`

- `npm install`: pass, installed missing remote-worktree dependencies; reported existing audit debt: 32 vulnerabilities.
- `npm run build`: pass.
- `node scripts/sa-g8-s1-search-quality-probes.js`: pass.
  - no-result path: 0 results, 4 attempted searches, 3 deterministic recovery queries, raw-query logged=false.
  - result-preservation path: 1 valid result, 2 attempted searches, invalidUrlCount=0, firstResultPosition=1.
- `git diff --check`: pass.
- Sensitive-data scan over touched S1 files: pass with expected policy/environment-variable words only; no raw production query text, JWTs, API keys, database URLs, lead contacts, or profile PII added.

## Behavior Changes

- Expanded deterministic empty-result recovery from two to three query candidates.
- Added compact product-term recovery for long natural-language requests, including English/Russian/Czech intent-word stripping and stop-word removal.
- Kept external search ownership in ai-microservice; Shop Assistant still sends candidate queries only to the existing delegated search endpoint.
- Preserved real merchant URL behavior by retaining HTTP/HTTPS filtering, title requirement, dedupe, and position reassignment.
- Search-service logs now use query fingerprints and lengths instead of raw query previews for search requests, completion, recovery, missing AI URL, and search failures.

## Sensitive Data Check

This task used existing aggregate/hashed SA-G1 evidence and synthetic probes only. It did not export raw production query text, raw messages, merchant URLs from production, JWTs, secrets, lead contacts, profile names, or database URLs.

## U1 Conflict Check

No frontend files were changed. The S1 branch overlaps U1 only at product behavior intent level, not mutable files. U1 can keep owning public/dashboard/test conversion UX.

## Result

Pass. Ready for orchestrator review and merge after current `origin/main` integration checks remain green.
