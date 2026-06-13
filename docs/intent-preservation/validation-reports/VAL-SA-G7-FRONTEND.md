# VAL-SA-G7-FRONTEND: Commercial Frontend, Dashboard, And Admin Validation

```yaml
id: VAL-SA-G7-FRONTEND
status: draft
owner: shop-assistant-owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: planning
upstream:
  - docs/intent-preservation/tasks/SA-G7-T1.md
  - docs/intent-preservation/execution-plans/EP-SA-G7-FRONTEND.md
  - docs/intent-preservation/context-packages/CP-SA-G7-FRONTEND.md
  - docs/intent-preservation/coding-prompts/PROMPT-SA-G7-FRONTEND.md
downstream:
  - TASKS.md
  - STATE.json
related_adrs: []
```

## Gate Evidence

Gate: Shop Assistant pre-coding gate
Date: 2026-06-13
Goal: SA-G7 Commercial frontend, authenticated client dashboard, and role-protected admin panel
Task: SA-G7-T1
Repository root: `/home/ssf/Documents/Github/shop-assistant`
Git status: dirty before this planning change; existing modified/untracked files were present and must not be reverted by this task
Execution plan: `docs/intent-preservation/execution-plans/EP-SA-G7-FRONTEND.md`
Context package: `docs/intent-preservation/context-packages/CP-SA-G7-FRONTEND.md`
Coding prompt: `docs/intent-preservation/coding-prompts/PROMPT-SA-G7-FRONTEND.md`
Invariants checked: real merchant URLs, Auth ownership, admin JWT/RBAC, client data ownership, legal transparency, environment-only secrets, owner-approved deploy
Sensitive-data classification: planning docs only; no secrets, tokens, raw user queries, voice transcripts, lead contacts, or production personal data
Contract/schema impact: expected current-user dashboard APIs and ownership checks; Prisma change only if existing schema is insufficient
Privacy/legal impact: dashboard must be authenticated and user-scoped; public legal and AI transparency must remain visible
Replay/determinism impact: dashboard state deterministic from authenticated user and persisted DB state; search result ordering remains external/nondeterministic
External service boundary impact: Auth remains identity/JWT/RBAC owner; AI/search remains in ai-microservice; logging remains in logging-microservice
Validation commands: `npm run build`; route/API auth smoke checks; browser desktop/mobile checks after frontend source changes
Result: pass-for-planning; source coding requires selecting the first implementation slice and preserving this scope

## Planning Validation

- Existing frontend presence checked: `public/index.html`, `public/admin.html`, `public/login.html`, `public/register.html`, `public/test.html`, legal pages.
- Existing backend auth checked: `src/auth/auth.service.ts`, `src/auth/jwt-auth.guard.ts`, `src/auth/roles.guard.ts`.
- Existing admin RBAC checked: `src/admin/prompts.controller.ts`, `src/admin/ai-models.controller.ts`, `src/admin/settings.controller.ts`.
- Existing client data support checked: `prisma/schema.prisma`, `src/sessions/sessions.controller.ts`, `src/sessions/sessions.service.ts`, `src/profiles/profiles.controller.ts`, `src/profiles/saved-criteria.controller.ts`.
- Auth contract checked: `auth-microservice/docs/UNIFIED_AUTH_CONTRACT.md`.

## Findings

- Frontend exists but is static and incomplete for authenticated client dashboard use.
- Admin APIs are already JWT and role protected for prompt/model/settings operations.
- Profiles and saved criteria are already authenticated and scoped to `req.user.id`.
- Session history/results/messages are not yet exposed through safe current-user dashboard endpoints.
- Local login/register pages should be reconciled with Auth-hosted UI preference.

## Pending Implementation Validation

- Build after source changes: not run yet for this planning-only change.
- Browser screenshots after UI changes: pending.
- 401/403/ownership API smoke checks: pending implementation and test-token availability.
- Sensitive-data scan after source changes: pending.

## Gate Script Availability

The broader company IPS reference names `scripts/strict_doc_audit.py`, `scripts/pre_coding_gate.py`, and `scripts/deployment_readiness_gate.py`. These scripts are not present in the `shop-assistant` repository as of 2026-06-13, so they were not run for this planning-only step. The repository-local pre-coding requirements were satisfied by creating the task, execution plan, context package, coding prompt, validation draft, traceability links, `TASKS.md` entry, and `STATE.json` state update.

## Implementation Slice 2026-06-13: Current-User Dashboard API Foundation

Scope implemented:

- Added `src/me/me.module.ts`, `src/me/me.controller.ts`, and `src/me/me.service.ts`.
- Registered `MeModule` in `src/app.module.ts`.
- Added authenticated current-user endpoints:
  - `GET /api/me`
  - `GET /api/me/dashboard`
  - `GET /api/me/sessions`
  - `POST /api/me/sessions`
  - `GET /api/me/sessions/:id`
  - `POST /api/me/sessions/:id/query`
  - `POST /api/me/sessions/:id/feedback`
- Current-user session endpoints derive `userId` from `req.user.id` after `JwtAuthGuard` validation.
- Session detail/list/dashboard queries filter by authenticated `userId`.
- Current-user session create/query/feedback validates that any supplied `profileId` belongs to the authenticated user.
- `SavedCriteriaService` now validates profile ownership before creating, updating, or running saved criteria with a `profileId`.

Validation evidence:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Runtime smoke note: a throwaway `PORT=4599 npm run start:prod` from raw SSH showed Nest route registration for all new `/api/me` routes before startup failed during Prisma initialization because the raw process could not reach `db-server-postgres:5432`. No production deploy was attempted. Live 401/403/ownership HTTP checks remain pending in an environment with database connectivity or after an owner-approved deployment/staging run.

Security evidence:

- `GET/POST /api/me*` routes are controller-level protected with `JwtAuthGuard`.
- No frontend token handling or secret storage was changed in this slice.
- No Prisma schema migration was required; existing `Session.userId`, `AccountProfile.userId`, and `SavedSearchCriteria.userId` were sufficient.
- Existing anonymous `/api/sessions` flow remains untouched for public search compatibility.

Remaining SA-G7 work:

- Auth-hosted login/register handoff and stale-token cleanup in static frontend pages.
- Dedicated client dashboard UI using only `/api/me` and other authenticated current-user endpoints.
- Commercial landing-page upgrade.
- Admin panel expansion and persisted safe settings classification/application.
- Browser visual QA and authenticated HTTP smoke checks.

## Implementation Slice 2026-06-13: Dashboard Static Frontend And Landing Entry Point

Scope implemented:

- Added `public/dashboard.html` as the first dedicated authenticated customer dashboard surface.
- Dashboard uses Auth-hosted login/register entry points at `https://auth.alfares.cz/login` and `/register` with `return_url`, `client_id=shop-assistant`, and `state`.
- Dashboard parses Auth fragment handoff (`access_token`, `refresh_token`, `state`), validates state when present, stores tokens, removes tokens from the URL fragment, and clears local/session auth state on 401.
- Dashboard calls current-user APIs only for account data: `/api/me`, `/api/me/dashboard`, `/api/me/sessions`, `/api/profiles`, and `/api/saved-criteria`.
- Dashboard supports account-scoped new search creation through `POST /api/me/sessions` and `POST /api/me/sessions/:id/query`.
- Dashboard renders summary counts, recent sessions, selected products, saved searches, and profiles for the signed-in user.
- Updated `public/index.html` to expose `dashboard.html` as the customer dashboard entry point while keeping `test.html` as the advanced test interface.

Validation evidence:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass. `dist/public/dashboard.html` was produced by the Nest asset copy.

Static visual QA:

- Concept generated with built-in image generation: `/Users/Sergej.Stasok/.codex/generated_images/019ebf8a-12cf-76d0-a4ff-b0e77b729ec8/ig_09e48a0f5812b98e016a2cf4f7f27c8191a963a48d697b9381.png`.
- Playwright static screenshot fallback was required because Browser plugin tools were not exposed and the raw remote app cannot reach `db-server-postgres:5432` from SSH.
- Initial mobile screenshot clipped the `Profiles` nav label; CSS was corrected to wrap mobile nav.
- Final screenshots:
  - `/private/tmp/shop-assistant-dashboard-desktop-final.png`
  - `/private/tmp/shop-assistant-dashboard-mobile-final.png`
- Final static screenshot checks: auth gate visible on desktop and mobile, first heading `Your shopping workspace is private`, nav labels `Dashboard`, `Search`, `History`, `Saved`, `Profiles`, and no console/page errors.

Design comparison notes:

- Matched the concept's white/slate/teal restrained SaaS direction, compact top navigation, small-radius panels/buttons, and customer dashboard information architecture.
- Implemented the unauthenticated gate state in this environment; the populated signed-in dashboard state is code-native and API-backed but not live-render verified due to missing database connectivity and no test token in this shell context.
- Above-the-fold copy is purposeful and account/security oriented; no decorative hero, marketing badges, or gradient-orb background were added.

Remaining validation:

- Live Auth callback and `/api/me` dashboard data rendering with a real test token.
- Live 401/403/ownership smoke checks in an environment with database connectivity.
- Browser QA of the populated signed-in dashboard state.

## Implementation Slice 2026-06-13: Admin Overview And Persisted Safe Settings

Scope implemented:

- Added `AppSetting` Prisma model and migration `prisma/migrations/20260613_add_app_settings/migration.sql` for non-secret admin-editable settings.
- Added `src/admin/app-settings.service.ts` to validate, persist, and apply safe settings.
- Added `src/admin/overview.controller.ts` exposing `GET /api/admin/overview`, protected by `JwtAuthGuard`, `RolesGuard`, and roles `global:superadmin` / `app:shop-assistant:admin`.
- Expanded `src/admin/settings.controller.ts` with `GET /api/admin/settings` and `PUT /api/admin/settings` while preserving `GET/PUT /api/admin/settings/agent-execution-mode` compatibility.
- Updated `ExecutionModeService` to load persisted `agentExecutionMode` from `AppSetting` on module init and continue applying runtime changes.
- Added `maxSearchResults` as a safe persisted setting and wired `SessionsService` query/feedback search limits to `AppSettingsService.getMaxSearchResults()`.
- Updated `public/admin.html` with an Admin Overview tab and expanded Safe service settings UI for `agentExecutionMode` and `maxSearchResults`.

Validation evidence:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && npm run prisma:generate && npm run build'
```

Result: pass.

Static admin UI QA:

- Used a local mocked HTTP server with Playwright because remote raw runtime still lacks database connectivity from SSH.
- Verified `Admin Overview` tab activates and renders mocked `/api/admin/overview` summary data.
- Verified `Execution mode` settings tab activates, loads mocked `/api/admin/settings`, and renders `maxSearchResults=20`.
- Final screenshot: `/private/tmp/shop-assistant-admin-settings-final.png`.
- Console/page errors: none in mocked HTTP run.

Security and boundary evidence:

- Overview and settings endpoints are role-protected with the same admin roles as prompt/model management.
- Only non-secret settings are editable. Secrets, provider keys, JWT secrets, and deployment/environment values are not represented in `AppSetting` or the UI.
- `agentExecutionMode` is persisted and applied to `ExecutionModeService`.
- `maxSearchResults` is persisted and applied to new query and feedback search paths.

Database migration evidence:

- Direct SSH `npx prisma migrate status` could not be used because the repository `.env` points Prisma engines at container-only `/app` paths, and the SSH host cannot resolve `db-server-postgres:5432`.
- Copied `prisma/migrations/20260613_add_app_settings/migration.sql` into the running `shop-assistant` pod and ran `npx prisma migrate deploy` from inside the pod.
- Migration `20260613_add_app_settings` applied successfully on 2026-06-13.
- Verified inside the pod that table `AppSetting` exists and `_prisma_migrations` contains `20260613_add_app_settings`.

Live temporary runtime smoke evidence:

- Started a throwaway new-code runtime from the remote checkout on `PORT=4599` with database access via Kubernetes port-forward to `db-server-postgres`.
- Verified protected routes reject unauthenticated requests:
  - `GET /api/me` -> `401`
  - `GET /api/me/dashboard` -> `401`
  - `GET /api/admin/settings` -> `401`
  - `GET /api/admin/overview` -> `401`
- Verified static/runtime availability in the temporary instance:
  - `HEAD /dashboard.html` -> `200`
  - `HEAD /admin.html` -> `200`
  - `HEAD /health` -> `200`

Deployment note:

- No production deploy was performed for SA-G7 during this slice.
- The database migration has been applied to the existing database, but the running production pod still needs an owner-approved deploy before it serves the new application code.

Remaining validation:

- Live admin overview/settings smoke checks with a valid admin token.
- Live client dashboard smoke checks with a valid customer token.
- Verify persisted settings survive restart after deployment/staging run.
