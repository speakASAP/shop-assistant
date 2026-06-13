# VAL-SA-G3-PROFILE-CRITERIA: Saved Criteria Session Traceability

## Gate Evidence

Gate: Shop Assistant pre-coding gate
Date: 2026-06-13
Goal: SA-G3 Multi-intent and profile search
Task: SA-G3-T1 Saved Criteria Session Traceability
Repository root: /home/ssf/Documents/Github/shop-assistant
Git status: dirty worktree with ongoing SA-G7/SA-G1 validation work; this slice touches Prisma/session/profile/current-user files and new SA-G3 docs
Execution plan: docs/intent-preservation/execution-plans/EP-SA-G3-PROFILE-CRITERIA.md
Context package: docs/intent-preservation/context-packages/CP-SA-G3-PROFILE-CRITERIA.md
Coding prompt: docs/intent-preservation/coding-prompts/PROMPT-SA-G3-PROFILE-CRITERIA.md
Invariants checked: authenticated ownership boundaries, real merchant URL truthfulness, Auth ownership, AI/search ownership, no deployment without approval
Sensitive-data classification: source/schema/docs only; no raw production query text, profile names, JWTs, secrets, lead content, or contact details
Contract/schema impact: nullable Session.usedSavedCriteriaId plus current-user response trace fields
Privacy/legal impact: account-scoped APIs remain protected by JwtAuthGuard and user ownership filtering
Replay/determinism impact: saved criteria run deterministically records the criteria id on the created session
External service boundary impact: no external service contract changes
Validation commands: npm run prisma:generate; npm run build; focused sensitive-data scan
Result: pass

## Implementation Evidence

- Added nullable `Session.usedSavedCriteriaId` with index and foreign key to `SavedSearchCriteria`.
- Added migration `20260613_add_session_saved_criteria_trace`.
- Extended `SessionsService.createSession` with optional internal `usedSavedCriteriaId`.
- `SavedCriteriaService.runCriteria` now passes the criteria id when creating the session.
- `MeService` dashboard, session list, and session detail include `usedSavedCriteriaId` and `usedSavedCriteria` for owner-scoped responses.

## Validation Evidence

- `npm run prisma:generate`: pass.
- `npm run build`: pass.
- Focused sensitive-data scan across changed SA-G3 files: no matches.

## Remaining Validation

- Migration deploy/apply requires owner approval.
- Live saved-criteria run smoke requires valid customer account/token.

## Deployment Evidence 2026-06-13

- Owner approved SA-G3 deployment/migration apply in the active session on 2026-06-13.
- Ran the repository deployment script from /home/ssf/Documents/Github/shop-assistant.
- Deployment preflight passed.
- Rollout completed successfully.
- New pod observed running: shop-assistant-74fccf57d-ff7lv.
- Total deployment time reported by script: 23.08s.
- Prisma migrate status inside the deployed pod reported: Database schema is up to date; 8 migrations found.
- Post-deploy health check returned 200.
- Unauthenticated GET /api/me returned 401.
- Unauthenticated GET /api/saved-criteria returned 401.

Result: deployment and migration status validation passed. Live saved-criteria run traceability still requires a valid customer token.

## Rebuilt Image And Customer Token Smoke 2026-06-13

- Initial rollout restarted an older image, so the first customer-token smoke created profile/criteria/session successfully but usedSavedCriteriaId was not populated.
- Built a fresh Docker image from the remote working tree and pushed localhost:5000/shop-assistant:latest.
- Image digest after push: sha256:94262d813da39183c607ef09814676f6cdab3a735bc955937c4b9f97716269a8.
- Redeployed successfully; new pod observed running: shop-assistant-5b699c65f6-szhz2.
- Rebuilt pod contains usedSavedCriteriaId in dist and prisma schema.
- Prisma migrate status inside rebuilt pod reported 10 migrations and database schema is up to date.
- Generated a synthetic Auth user/token in-memory through auth.alfares.cz; token and password were not printed.
- Live saved-criteria traceability smoke run id: sa-g3-token-smoke-20260613094543.
- Auth register returned 201; /api/me returned 200.
- Profile create returned 201.
- Saved criteria create returned 201.
- Saved criteria run returned 201 and session id 1f704307-1137-44ab-be19-4da077ba1f98.
- Session detail returned 200.
- usedSavedCriteriaId matched saved criteria id d675dbf3-79ee-4066-ba21-8da3bc8c5c14.
- usedSavedCriteria relation matched the same saved criteria id.
- Result count from the saved criteria run was 10.
Result: pass.
