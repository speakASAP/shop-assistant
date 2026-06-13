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

## Implementation Slice 2026-06-13: Commercial Landing Page Upgrade

Scope implemented:

- Replaced `public/index.html` with a focused commercial SaaS landing page for Shop Assistant.
- Preserved the existing static/Nest asset architecture; no new frontend framework was introduced.
- Removed duplicated local auth-modal/register/login code from the landing page and routed account actions to `dashboard.html`, which uses the Auth-hosted login/register handoff.
- Added a first viewport with product name `Shop Assistant`, direct commercial positioning, CTAs for search/dashboard/contact, and code-native product previews for search results, customer dashboard, and admin settings.
- Added sections for request workflow, authenticated customer workspace, role-protected admin controls, anonymous landing-page search, lead/contact capture, AI transparency, legal links, and cookie consent.
- Preserved anonymous public search flow through `/api/sessions` and `/api/sessions/:id/query`.
- Preserved lead capture through `/api/leads/submit`, including text, multiple contact methods, optional voice recording, and optional file attachments.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static visual QA:

- Concept generated with built-in image generation: `/Users/Sergej.Stasok/.codex/generated_images/019ebf8a-12cf-76d0-a4ff-b0e77b729ec8/ig_091e46bc69d1ea65016a2cfce725fc8191ad2b4c3fc1d36651.png`.
- Browser plugin tools were not exposed in this turn, so Playwright Chromium was used as the browser fallback.
- Final screenshots:
  - `/private/tmp/shop-assistant-landing-desktop-final.png`
  - `/private/tmp/shop-assistant-landing-mobile-final.png`
  - `/private/tmp/shop-assistant-landing-desktop-clean.png`
  - `/private/tmp/shop-assistant-landing-mobile-clean.png`
- Desktop and mobile screenshot checks: no console/page errors, no horizontal overflow, H1 `Shop Assistant`, product preview visible, request form present, lead form present.
- Interaction smoke checks: cookie consent hides banner; dynamic contact row creation works; browser-required form validation prevents empty required submissions.

Design comparison notes:

- Matched the concept's white/slate SaaS direction, teal primary actions, small-radius panels, product UI previews, customer-dashboard section, admin-operations section, and compact lead form.
- Implemented product visuals as code-native UI instead of shipping a static screenshot, so request/search/dashboard/admin content remains maintainable and responsive.
- Intentional deviation: concept included a more detailed product results table and sidebar; implementation uses lighter static product panels to fit the existing single-file static asset architecture and keep mobile readability high.
- Above-the-fold copy checked: H1 `Shop Assistant`; CTAs `Start a search`, `View dashboard`, `Talk to us`; nav routes `Product`, `Dashboard`, `Admin`, `Contact`, `API Status`; no decorative hero eyebrow/kicker/pill was introduced.

Remaining validation:

- Live anonymous search from the deployed landing page after owner-approved deploy.
- Live lead submission from the deployed landing page after owner-approved deploy.
- Live authenticated dashboard/admin checks with valid customer and admin tokens.

## Implementation Slice 2026-06-13: Admin Auth-Hosted Login Gate

Scope implemented:

- Updated `public/admin.html` so the admin UI is locked by default behind an admin access gate.
- Added Auth-hosted login navigation to `https://auth.alfares.cz/login` with `client_id=shop-assistant`, `return_url`, and `state`.
- Added Auth fragment parsing for `access_token`, `refresh_token`, and `state`, matching the dashboard handoff pattern.
- Added state mismatch handling that clears tokens and requires a fresh login.
- Validates admin access through `GET /api/admin/overview` before revealing the admin tabs and panels.
- Keeps the admin shell hidden for missing tokens, expired/invalid tokens, or users without the `global:superadmin` / `app:shop-assistant:admin` role.
- Added logout/clear behavior that removes stored admin/customer tokens and returns to the locked gate.
- Historical note: this slice kept manual JWT paste as an advanced fallback rather than the primary login path. The later `Admin Auth-Only Gate` slice removed that fallback.
- Updated admin setup copy so operators sign in through Auth instead of manually fetching a JWT first.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static admin auth QA:

- Browser plugin tools were not exposed in this turn, so Playwright Chromium was used as the browser fallback.
- Locked/no-token state:
  - screenshot: `/private/tmp/shop-assistant-admin-locked-final.png`
  - body class: `admin-locked`
  - admin gate visible: yes
  - admin shell visible: no
  - console/page errors: none
  - no horizontal overflow
- Authorized mocked state:
  - screenshot: `/private/tmp/shop-assistant-admin-authorized-final.png`
  - body class: `admin-unlocked`
  - admin gate visible: no
  - admin shell visible: yes
  - prompts refresh loaded mocked response
  - console/page errors: none
  - failing requests: none
  - no horizontal overflow
- Forbidden mocked state:
  - gate remained locked when `/api/admin/overview` returned `403`
  - gate message told the user the signed-in account lacks a Shop Assistant admin role
- Auth navigation check:
  - Sign-in button navigated to `https://auth.alfares.cz/login`
  - included `client_id=shop-assistant`
  - included `return_url=http://127.0.0.1:4824/admin.html`
  - included a generated `state`

Security and boundary evidence:

- Frontend now hides admin surfaces until a backend role-protected admin API validates the token.
- Backend authorization remains authoritative; this slice does not rely on client-side role decoding for access.
- Manual token paste remains available only as an advanced fallback for diagnostics.

Remaining validation:

- Live Auth-hosted admin login with a real admin account.
- Live Auth-hosted forbidden check with a real non-admin account.
- Live deployed admin smoke after owner-approved deploy.

## Implementation Slice 2026-06-13: Admin Operations Data Drill-Down

Scope implemented:

- Added `src/admin/operations.controller.ts` with role-protected admin operations endpoints:
  - `GET /api/admin/operations/sessions`
  - `GET /api/admin/operations/sessions/:id`
  - `GET /api/admin/operations/leads`
  - `GET /api/admin/operations/leads/:id`
- Registered `OperationsController` in `src/admin/admin.module.ts`.
- Session list includes user/profile linkage, timestamps, and counts for messages, search runs, choices, and agent communications.
- Session detail includes profile, messages, search runs with bounded search results, selected product choices, and bounded agent communications.
- Lead list includes source, contact methods, message preview, external CRM lead id, AI submission id, metadata, and timestamps.
- Lead detail includes full saved lead message, contact methods, metadata, source URL, CRM lead id, and AI submission id.
- Added an `Operations` tab in `public/admin.html` with session/lead lists, refresh/more controls, and a detail pane for selected records.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static/mocked admin operations QA:

- Browser plugin tools were not exposed in this turn, so Playwright Chromium was used as the browser fallback.
- Mocked authorized admin state loaded the `Operations` tab.
- Mocked `GET /api/admin/operations/sessions` rendered one session row.
- Mocked `GET /api/admin/operations/leads` rendered one lead row.
- Mocked session detail rendered the latest query containing `red silk skirt`.
- Mocked lead detail rendered CRM lead id `crm-1`.
- Final screenshots:
  - `/private/tmp/shop-assistant-admin-operations-list.png`
  - `/private/tmp/shop-assistant-admin-operations-detail.png`
- Console/page errors: none.
- Failing requests: none.
- Horizontal overflow: none at 1440px desktop viewport.

Security and boundary evidence:

- All new operations endpoints use `JwtAuthGuard`, `RolesGuard`, and roles `global:superadmin` / `app:shop-assistant:admin`.
- Endpoints are bounded by pagination and relation limits where records can be large.
- Backend role checks remain authoritative; the UI only consumes admin data after admin authorization succeeds.

Remaining validation:

- Live operations list/detail smoke with a real admin token.
- Live forbidden check with a real non-admin token.
- Deployed operations UI verification after owner-approved deploy.

## Implementation Slice 2026-06-13: Customer Dashboard Profile And Saved Search Editing

Scope implemented:

- Updated `public/dashboard.html` so signed-in customers can manage their own reusable data from the dashboard.
- Added inline saved-search form with create/update support.
- Added saved-search row actions for run, edit, and delete.
- Saved search writes use authenticated account-scoped `/api/saved-criteria` endpoints.
- Saved search payload stores the search text in `productIntents` and `filters.queryText` so it can be rerun and edited from the dashboard.
- Added inline profile form with create/update support.
- Added profile row actions for edit and delete.
- Profile writes use authenticated account-scoped `/api/profiles` endpoints.
- Profile dropdowns for new searches and saved searches refresh after profile changes.
- Forms reset after create/update/delete and disable browser autocomplete to avoid stale field display.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static/mocked customer dashboard QA:

- Browser plugin tools were not exposed in this turn, so Playwright Chromium was used as the browser fallback.
- Mocked authenticated customer state loaded dashboard.
- Profile workflow verified:
  - `POST /api/profiles`
  - `PUT /api/profiles/:id`
  - `DELETE /api/profiles/:id`
  - profile list and both profile dropdowns refreshed.
- Saved-search workflow verified:
  - `POST /api/saved-criteria`
  - `PUT /api/saved-criteria/:id`
  - `DELETE /api/saved-criteria/:id`
  - saved-search list refreshed.
- Final state verified:
  - dashboard visible
  - profile row count updated after delete
  - saved-search row count updated after delete
  - inline form values reset to blank
  - no console/page errors
  - no failed requests
  - no horizontal overflow at 1440px viewport
- Final screenshot: `/private/tmp/shop-assistant-dashboard-editable-final-clean.png`.

Security and boundary evidence:

- Dashboard uses only authenticated user-scoped APIs.
- Ownership enforcement remains in existing profile and saved-criteria services.
- No admin endpoints or manual token paste are used for customer data management.

Remaining validation:

- Live customer dashboard CRUD smoke with a real customer account.
- Live Auth callback verification for customer dashboard after owner-approved deploy.

## Implementation Slice 2026-06-13: Customer Dashboard Session Detail View

Scope implemented:

- Updated `public/dashboard.html` so customers can inspect request history inside the dashboard instead of only linking to the advanced test page.
- Added a `Details` action for authenticated history rows.
- Details action calls account-scoped `GET /api/me/sessions/:id`.
- Added a dashboard detail panel showing:
  - stored customer/assistant messages
  - search runs and query text
  - latest search results with merchant links
  - selected products with merchant links
- Kept the existing `Advanced` link to `test.html?sessionId=...` for diagnostic workflows.
- Detail panel is hidden when no authenticated history exists.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static/mocked customer dashboard QA:

- Browser plugin tools were not exposed in this turn, so Playwright Chromium was used as the browser fallback.
- Mocked authenticated customer state loaded dashboard history.
- Clicking `Details` called `GET /api/me/sessions/session-detail-1`.
- Detail panel rendered sections:
  - `Messages`
  - `Searches`
  - `Latest results`
  - `Selected products`
- Verified rendered content included customer message text, search query text, result title, and selected product section.
- Console/page errors: none.
- Failing requests: none.
- Horizontal overflow: none at 1440px viewport.
- Final screenshot: `/private/tmp/shop-assistant-dashboard-session-detail.png`.

Security and boundary evidence:

- The frontend uses only `/api/me/sessions/:id`; ownership is enforced by `MeService.getSession(userId, sessionId)`.
- Public `/api/sessions/:id` detail routes were not used for dashboard history inspection.

Remaining validation:

- Live customer account session-detail smoke with real Auth callback.
- Deployed customer dashboard detail verification after owner-approved deploy.


## Live Validation Slice 2026-06-13: Landing Anonymous Search And Lead Capture

Scope validated:

- Ran live checks against deployed production URL `https://shop-assistant.alfares.cz`.
- Checked public landing and legal route availability with `HEAD /`, `/privacy.html`, `/cookies.html`, `/terms.html`, and `/health`.
- Submitted one synthetic anonymous landing-page search through the same public API path used by `public/index.html`: `POST /api/sessions` then `POST /api/sessions/:id/query`.
- Submitted one synthetic landing-page lead through `POST /api/leads/submit` using a reserved `example.invalid` contact value and non-personal validation text.

Live anonymous search evidence:

- Run id: `sa-g7-live-20260613073316`.
- Public/legal route status: all returned `200`.
- Session create: `201` with session id `8c106fe2-6d1e-440a-8e71-cec64cfaea1e`.
- Query submit: `201`.
- Result count: `10`.
- HTTP/HTTPS result URL count: `10`.
- Sample result sources included Etsy, Amazon, souvenirprague.com, suvenyry.com, eBay, GourmetKava, Walmart, Facebook Marketplace, and kafeahrnky.cz.

Live lead capture evidence before fix:

- Lead submit returned `500` with body `{"statusCode":500,"message":"Internal server error"}`.
- Local `LeadRequest` persistence occurred before downstream failure: record `6d1de78a-a822-466b-8635-ee799986c328` was saved with `leadId=null` and `aiSubmissionId=null`.
- Pod environment check showed `LEADS_SERVICE_URL` was not set.
- Kubernetes service discovery showed `leads-microservice` exposes port `4400`.
- Direct in-cluster downstream probe to `http://leads-microservice:4400/api/leads/submit` returned `201` with a `leadId`.
- Root cause: Shop Assistant fallback URL used `http://leads-microservice:3371` when `LEADS_SERVICE_URL` was absent.

Fix prepared:

- Updated `src/leads/leads.service.ts` fallback to `http://leads-microservice:4400`.
- Added non-secret `LEADS_SERVICE_URL=http://leads-microservice.statex-apps.svc.cluster.local:4400` to `k8s/configmap.yaml`.
- Ran `npm run build` after the fix: pass.

Security and privacy evidence:

- Validation used synthetic request text and a reserved non-personal `example.invalid` contact value.
- No JWTs, refresh tokens, provider keys, real customer details, raw production personal data, or environment secrets were recorded.
- Search result URL validation checked only returned URL shape and public merchant/source hostnames.

Remaining validation:

- Owner-approved production deploy is required before the corrected lead downstream URL is active.
- After deploy, rerun live `POST /api/leads/submit` and verify returned `requestId`, `leadId`, and optional `aiSubmissionId`.
- Live customer dashboard CRUD and admin operations smoke checks still require valid customer/admin/non-admin accounts.


## Deployment And Live Lead Retest 2026-06-13

Deployment evidence:

- Owner approved production deploy in the active session on 2026-06-13.
- Ran the repository deployment script from /home/ssf/Documents/Github/shop-assistant.
- Deployment preflight passed.
- Kubernetes manifests applied; shop-assistant-config was configured.
- Rollout restart completed successfully.
- New pod observed running: shop-assistant-9d8fd6548-gvrdq.
- Total deployment time reported by script: 21.88s.

Runtime configuration evidence:

- New pod environment includes LEADS_SERVICE_URL=http://leads-microservice.statex-apps.svc.cluster.local:4400.

Post-deploy live lead retest:

- Run id: sa-g7-lead-retest-20260613073916.
- HEAD /health returned 200.
- POST /api/leads/submit returned 201.
- Response included local request id 057ef3f2-9315-4756-b121-98af6e0c9af7.
- Response included downstream lead id 8228d598-b29f-452d-86c5-8284cb04916e.
- Response keys: confirmationSent, leadId, requestId, status.
- aiSubmissionId was not returned by this successful response; AI analysis remains best-effort per existing LeadsService.submitToAi behavior.

Result:

- Live landing-page anonymous search validation: pass.
- Live landing-page lead capture validation after deploy: pass for local persistence and downstream leads-microservice forwarding.
- Remaining SA-G7 live checks require valid customer/admin/non-admin accounts for Auth callback, dashboard CRUD, admin operations, and forbidden admin validation.

## Implementation Slice 2026-06-13: Admin-Editable Public Landing Settings

Scope implemented:

- Extended `src/admin/app-settings.service.ts` with safe public landing settings persisted in `AppSetting.publicLanding`.
- Added validated editable public copy fields:
  - `headline`
  - `subheadline`
  - `primaryCtaLabel`
  - `secondaryCtaLabel`
  - `contactHeadline`
  - `contactSubheadline`
  - `leadSubmitLabel`
  - `footerTagline`
- Added `src/admin/public-settings.controller.ts` with public read-only endpoint `GET /api/public/settings/landing`.
- Registered `PublicSettingsController` in `src/admin/admin.module.ts`.
- Updated protected `PUT /api/admin/settings` DTO support so authorized admins can save `publicLanding` alongside existing safe settings.
- Updated `public/admin.html` Safe service settings panel to load, edit, and save public landing copy.
- Updated `public/index.html` to apply public landing settings at runtime with static fallback if the API is unavailable.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static/mocked UI QA:

- Browser plugin tools were not exposed in this turn, so Playwright Chromium was used as the browser fallback.
- Mocked `GET /api/public/settings/landing` on the public landing page.
- Verified runtime copy applied to:
  - hero headline
  - hero subheadline
  - primary CTA
  - secondary CTA
  - contact headline
  - lead submit button
  - footer tagline
- Mocked authorized admin settings state and verified the Safe service settings form loaded public landing settings.
- Edited landing headline and lead-submit label in admin UI.
- Verified `PUT /api/admin/settings` payload included `publicLanding.headline=Revenue-ready Shop Assistant` and `publicLanding.leadSubmitLabel=Book demo`.
- Final screenshots:
  - `/private/tmp/shop-assistant-landing-settings-qa.png`
  - `/private/tmp/shop-assistant-admin-landing-settings-qa.png`
- Console/page errors: none.
- Horizontal overflow: none at 1440px desktop viewport.

Security and boundary evidence:

- Public endpoint exposes only non-secret public marketing copy.
- Write path remains protected by `JwtAuthGuard`, `RolesGuard`, and roles `global:superadmin` / `app:shop-assistant:admin`.
- Secrets, provider keys, JWT secrets, environment values, and deployment configuration remain outside editable public settings.
- Landing page keeps static copy fallback, so a settings API outage does not blank the commercial page.

Remaining validation:

- Owner-approved deploy is required before production serves the new public settings endpoint and updated static assets.
- Live public settings endpoint smoke after deployment.
- Live admin edit/save smoke with a real admin token.
- Live Auth callback checks still require valid customer/admin/non-admin accounts.

## Implementation Slice 2026-06-13: Admin Session Operations Editing

Scope implemented:

- Added protected `PUT /api/admin/operations/sessions/:id` in `src/admin/operations.controller.ts`.
- The update endpoint accepts only operational session fields:
  - `priorityOrder?: string[] | null`
  - `profileId?: string | null`
- `priorityOrder` is validated against the existing allowed keys from `src/sessions/dto/create-session.dto.ts`: `price`, `quality`, `location`.
- Duplicate priority values are collapsed by the admin UI before save and by backend normalization semantics.
- `profileId` updates validate that the profile exists.
- For user-bound sessions, the target profile must belong to the same `Session.userId`.
- Anonymous sessions can only clear `profileId`; they cannot be assigned a profile.
- The endpoint returns the same session detail shape used by `GET /api/admin/operations/sessions/:id`.
- Updated `public/admin.html` Operations session detail with an Admin edits form for priority order and profile id.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static/mocked admin operations QA:

- Browser plugin tools were not exposed in this turn, so Playwright Chromium was used as the browser fallback.
- Mocked authorized admin state loaded the Operations tab.
- Mocked session detail rendered Admin edits controls.
- Edited priority order to `location`, `price`, `quality`.
- Edited profile id to `profile-2`.
- Verified `PUT /api/admin/operations/sessions/session-edit-1` payload:
  - `priorityOrder=["location","price","quality"]`
  - `profileId="profile-2"`
- Verified refreshed detail retained the updated priority order and profile id.
- Final screenshot: `/private/tmp/shop-assistant-admin-session-edit-qa.png`.
- Console/page errors: none.
- Failing requests: none.
- Horizontal overflow: none at 1440px desktop viewport.

Security and boundary evidence:

- The write endpoint uses the same `JwtAuthGuard`, `RolesGuard`, and roles `global:superadmin` / `app:shop-assistant:admin` as the rest of admin operations.
- The endpoint does not edit original customer messages, search results, choices, lead contact data, or external correlation ids.
- Profile assignment is constrained to the session owner for user-bound sessions.
- No Prisma migration was required; only existing `Session.priorityOrder` and `Session.profileId` fields are updated.

Remaining validation:

- Live admin session edit smoke with a real admin token after owner-approved deploy.
- Live forbidden check with a real non-admin token.
- Live customer dashboard and Auth callback checks still require valid customer/admin/non-admin accounts.

## Implementation Slice 2026-06-13: Customer Dashboard Product Selection

Scope implemented:

- Added authenticated account-scoped product selection endpoint:
  - `POST /api/me/sessions/:id/choice/:productId`
- Added `MeService.chooseProduct(userId, sessionId, productId)`.
- The new current-user endpoint verifies the session belongs to the authenticated user before delegating to the existing `SessionsService.chooseProduct()` behavior.
- Updated `public/dashboard.html` request detail view so latest results include a `Select` action beside the merchant link.
- Selecting a product from the dashboard:
  - calls the new `/api/me/sessions/:id/choice/:productId` endpoint
  - refreshes the request detail
  - refreshes dashboard summary and selected-products list
  - keeps the existing merchant link available

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static/mocked customer dashboard QA:

- Browser plugin tools were not exposed in this turn, so Playwright Chromium was used as the browser fallback.
- Mocked authenticated customer state loaded dashboard history.
- Opened request detail for `session-choice-1`.
- Verified latest result rendered a `Select` action for result `result-1`.
- Clicked `Select`.
- Verified exactly one call to `POST /api/me/sessions/session-choice-1/choice/result-1`.
- Verified selected-products list refreshed with `Weatherproof work backpack`.
- Verified success status `Selected product saved to your dashboard.`.
- Final screenshot: `/private/tmp/shop-assistant-dashboard-select-product-qa.png`.
- Console/page errors: none.
- Failing requests in final QA run: none.
- Horizontal overflow: none at 1440px desktop viewport.

Security and boundary evidence:

- The dashboard no longer needs the public session choice route to save an account-bound selected product.
- Ownership is enforced through `MeService.assertSessionBelongsToUser()` before choice creation.
- The implementation reuses existing product-in-session validation in `SessionsService.chooseProduct()`.
- No admin endpoint or manual token is involved in customer product selection.

Remaining validation:

- Live customer dashboard product-selection smoke with a real customer token after owner-approved deploy.
- Live Auth callback checks still require valid customer/admin/non-admin accounts.

## Implementation Slice 2026-06-13: Customer Dashboard Request Refinement

Scope implemented:

- Updated `public/dashboard.html` request detail view with a `Refine request` form.
- The form calls the existing authenticated current-user endpoint:
  - `POST /api/me/sessions/:id/feedback`
- After a successful refinement, the dashboard:
  - clears the feedback text
  - reloads the request detail
  - reloads account summary/history/selected-products data
  - shows success status `Request refined and results refreshed.`
- The implementation keeps the existing advanced test page link for diagnostic workflows.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static/mocked customer dashboard QA:

- Browser plugin tools were not exposed in this turn, so Playwright Chromium was used as the browser fallback.
- Mocked authenticated customer state loaded dashboard history.
- Opened request detail for `session-refine-1`.
- Entered feedback `Need waterproof and under 90 EUR`.
- Verified `POST /api/me/sessions/session-refine-1/feedback` payload:
  - `message="Need waterproof and under 90 EUR"`
- Verified refreshed detail rendered updated result `Waterproof commuter backpack`.
- Verified success status `Request refined and results refreshed.`.
- Final screenshot: `/private/tmp/shop-assistant-dashboard-refine-qa.png`.
- Console/page errors: none.
- Failing requests: none.
- Horizontal overflow: none at 1440px desktop viewport.

Security and boundary evidence:

- No new backend route was needed; the dashboard uses the existing `JwtAuthGuard`-protected `/api/me` feedback route.
- Session ownership remains enforced by `MeService.submitFeedback()` before refinement.
- Customer refinement does not use public session feedback or admin endpoints.

Remaining validation:

- Live customer dashboard request-refinement smoke with a real customer token after owner-approved deploy.
- Live Auth callback checks still require valid customer/admin/non-admin accounts.

## Implementation Slice 2026-06-13: Customer Dashboard Priority Controls

Scope implemented:

- Updated `public/dashboard.html` to expose customer priority order controls for:
  - new authenticated requests
  - saved search create/update
- New request priority selectors submit `priorities` to:
  - `POST /api/me/sessions`
  - `POST /api/me/sessions/:id/query`
- Saved search priority selectors persist `priorities` through:
  - `POST /api/saved-criteria`
  - `PUT /api/saved-criteria/:id`
- Existing saved searches now populate the priority selectors during edit.
- Saved-search rows display the saved priority order when present.
- Duplicate priority values are collapsed before submit.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static/mocked customer dashboard QA:

- Browser plugin tools were not exposed in this turn, so Playwright Chromium was used as the browser fallback.
- Mocked authenticated customer state loaded dashboard with one profile and one saved search.
- New request path:
  - selected profile `profile-1`
  - selected priorities `quality`, `price`, `location`
  - verified `POST /api/me/sessions` payload included `priorities=["quality","price","location"]`
  - verified `POST /api/me/sessions/new-session-1/query` payload included the same priorities
- Saved search path:
  - opened existing saved search with priorities `quality`, `price`
  - verified edit form populated priority selectors
  - changed priorities to `location`, `price`, `quality`
  - verified saved-search create payload included `priorities=["location","price","quality"]`
- Final screenshot: `/private/tmp/shop-assistant-dashboard-priorities-qa.png`.
- Console/page errors in final QA run: none.
- Failing requests in final QA run: none.
- Horizontal overflow: none at 1440px desktop viewport.

Security and boundary evidence:

- No new backend route was required; dashboard uses existing authenticated `/api/me` and `/api/saved-criteria` endpoints.
- Profile ownership validation remains in the existing backend services.
- Priority values use the existing backend-supported order keys: `price`, `quality`, `location`.

Remaining validation:

- Live customer dashboard priority-control smoke with a real customer token after owner-approved deploy.
- Live Auth callback checks still require valid customer/admin/non-admin accounts.

## Implementation Slice 2026-06-13: Admin Operations Filters

Scope implemented:

- Added `q` filtering to `GET /api/admin/operations/sessions`.
- Session filter searches session id, user id, profile id, profile name, message content, and search query text.
- Added `q` filtering to `GET /api/admin/operations/leads`.
- Lead filter searches lead id, source service, source label, message, CRM lead id, and AI submission id.
- Added admin UI filter inputs for operations sessions and lead requests.
- Wired Refresh and Enter-key actions to reload filtered operations lists with `q` query parameters.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static/mocked admin operations QA:

- Browser plugin tools were not exposed in this turn, so Playwright Chromium was used as the browser fallback.
- Mocked authorized admin opened the Operations tab.
- Entered session filter `red skirt` and lead filter `crm-42`.
- Verified the sessions request used `q=red skirt`.
- Verified the leads request used `q=crm-42`.
- Verified the filtered session row rendered the expected user and activity counts.
- Verified the filtered lead row rendered the expected lead id, contact, and message preview.
- Final screenshot: `/private/tmp/shop-assistant-admin-operations-filters-qa.png`.
- Console/page errors in final QA run: none.
- Failing requests in final QA run: none.
- Horizontal overflow: none at 1440px desktop viewport.

Security and boundary evidence:

- Operations endpoints remain protected by JWT/RBAC admin guards.
- Existing pagination and limit bounds are preserved.
- Search strings are normalized and capped to 120 characters before Prisma filtering.

Remaining validation:

- Live admin operations filter smoke with a real admin token after owner-approved deploy.
- Live non-admin forbidden check after owner-approved deploy.

## Implementation Slice 2026-06-13: Admin Lead Triage

Scope implemented:

- Added non-secret lead triage fields to `LeadRequest`: `triageStatus`, `assignedTo`, `adminNotes`, `triagedAt`, and `triagedBy`.
- Added Prisma migration `prisma/migrations/20260613_add_lead_triage/migration.sql`.
- Added protected admin update endpoint `PUT /api/admin/operations/leads/:id`.
- Lead triage status is restricted to `new`, `contacted`, `qualified`, `won`, `lost`, and `spam`.
- Assignee and notes are normalized and length-bounded.
- Admin Operations lead list now shows triage status.
- Admin Operations lead detail now includes a Lead triage form for status, assignee, and internal notes.
- Mobile Operations tables are constrained to internal horizontal scrolling so they do not widen the whole page.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run prisma:generate && npm run build'
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

In-app browser admin QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served `admin.html` and role-authorized admin API fixtures at `http://127.0.0.1:8133/admin.html`.
- Flow under test: `admin.html` -> authorized Operations tab -> open lead detail -> edit triage fields -> save -> updated lead state rendered.
- Used a non-sensitive fake admin token accepted only by the mock server.
- Verified page identity: title `Shop Assistant — Admin`.
- Verified locked page was not blank and had no console warnings/errors.
- Verified authorized admin shell rendered after token handoff.
- Verified Operations lead row rendered with `New` status.
- Opened lead detail and verified Lead triage form fields.
- Saved status `qualified`, assignee `sales-admin@example.invalid`, and note `Schedule paid onboarding follow-up.`
- Verified refreshed detail showed `Qualified`, assignee, and note field value.
- Verified refreshed lead list showed `Qualified`.
- Desktop screenshot: `/private/tmp/shop-assistant-admin-lead-triage-qa.png`.
- Mobile screenshot after overflow fix: `/private/tmp/shop-assistant-admin-lead-triage-mobile-fixed-qa.png`.
- Console/page errors in final QA runs: none.
- Mobile page-level horizontal overflow after fix: none at 390px viewport.
- Wide Operations tables intentionally scroll inside their section on mobile.

Security and boundary evidence:

- New lead update endpoint uses the same `JwtAuthGuard`, `RolesGuard`, and roles `global:superadmin` / `app:shop-assistant:admin`.
- Immutable submitted lead message, contact methods, metadata, CRM lead id, and AI submission id remain read-only in the admin UI.
- The browser-editable fields are operational metadata only.
- No secrets, provider keys, JWT secrets, or environment values are editable.

Remaining validation:

- Apply migration and deploy after owner approval.
- Live admin lead triage smoke with a real admin token.
- Live forbidden check with a real non-admin token.

## Implementation Slice 2026-06-13: Customer History Filters

Scope implemented:

- Added account-scoped history filters to `GET /api/me/sessions`.
- Supported filters:
  - `q`: searches only the signed-in user's session id, profile name, saved-search name, message content, search query text, and selected product title.
  - `profileId`: narrows only the signed-in user's sessions to one profile id.
  - `status`: supports `selected`, `searched`, and `started`.
- Added customer dashboard history filter controls for search text, profile, and status.
- Added filter-aware empty state: `No matching requests in your account history.`
- Dashboard Refresh preserves active history filters.
- Clear button resets history filters and reloads account history.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

In-app browser customer dashboard QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served `dashboard.html` and authenticated current-user API fixtures at `http://127.0.0.1:8134/dashboard.html`.
- Flow under test: `dashboard.html` -> authenticated dashboard -> apply history filters -> account history list narrows to matching requests.
- Used a non-sensitive fake customer token accepted only by the mock server.
- Verified page identity: title `Shop Assistant — Dashboard`.
- Verified dashboard rendered signed-in customer state with the new filter controls.
- Verified initial history included selected, searched, and started sessions.
- Applied profile `profile-kids` and status `selected`.
- Verified rendered history narrowed to `waterproof school backpack` and excluded `standing desk lamps` and `Draft request`.
- Verified recorded mock API request included `profileId=profile-kids` and `status=selected`.
- Verified direct local API fixture call with `q=desk` returned only the searched desk-lamp session.
- Desktop screenshot: `/private/tmp/shop-assistant-dashboard-history-filters-qa.png`.
- Mobile viewport screenshot: `/private/tmp/shop-assistant-dashboard-history-filters-mobile-viewport-qa.png`.
- Console/page errors in final QA runs: none.
- Page-level horizontal overflow: none on desktop/default or 390px mobile viewport.

Browser interaction limitation:

- The in-app Browser text-fill/type path failed because the Browser virtual clipboard was unavailable in this environment.
- Text search filter (`q`) was therefore validated by direct local API fixture call instead of a typed browser interaction.

Security and boundary evidence:

- The backend filter query always starts from `where: { userId }` before applying additional filters.
- Filters only narrow the authenticated user's own sessions.
- Query text is normalized and capped to 120 characters.
- The dashboard still uses only `/api/me` current-user routes for history data.

Remaining validation:

- Live customer history filter smoke with a real customer token after owner-approved deploy.
- Ownership negative test with two real customer accounts remains pending.

## Implementation Slice 2026-06-13: Customer History Pagination

Scope implemented:

- Added customer dashboard history pagination state.
- Added `Load more history` control below account history.
- Initial dashboard history load requests `GET /api/me/sessions?page=1&limit=12`.
- Load more requests the next page and appends results without dropping existing rows.
- Pager shows `Showing N of total request(s)`.
- Active history filters are preserved when loading more pages.
- Filter submit, profile/status change, and Clear reset history paging back to page 1.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

In-app browser customer dashboard QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served `dashboard.html` and authenticated current-user API fixtures at `http://127.0.0.1:8135/dashboard.html`.
- Flow under test: `dashboard.html` -> authenticated dashboard history -> `Load more history` -> page 2 appends to visible history.
- Used a non-sensitive fake customer token accepted only by the mock server.
- Verified initial pager text: `Showing 12 of 14 request(s)` with `Load more history`.
- Clicked `Load more history`.
- Verified `History request 14` appeared while `History request 1` remained visible in the full history table text.
- Verified final pager text: `Showing 14 of 14 request(s)` and the Load more button disappeared.
- Verified mock API requests included page 1 and page 2:
  - `GET /api/me/sessions?page=1&limit=12`
  - `GET /api/me/sessions?page=2&limit=12`
- Desktop screenshot: `/private/tmp/shop-assistant-dashboard-history-paging-qa.png`.
- Mobile viewport screenshot: `/private/tmp/shop-assistant-dashboard-history-paging-mobile-qa.png`.
- Console/page errors in final QA runs: none.
- Page-level horizontal overflow: none on desktop/default or 390px mobile viewport.

Security and boundary evidence:

- No new backend endpoint was required.
- Paging uses the existing JWT-protected `/api/me/sessions` endpoint with current-user ownership.
- Load more preserves the same account-scoped filters and pagination bounds.

Remaining validation:

- Live customer history pagination smoke with a real customer token after owner-approved deploy.
- Ownership negative test with two real customer accounts remains pending.

## Implementation Slice 2026-06-13: Customer Selected Products Pagination

Scope implemented:

- Added authenticated current-user endpoint `GET /api/me/choices`.
- `GET /api/me/choices` supports `page` and `limit`, bounded to a maximum limit of 50.
- Selected product rows are scoped through `choice.session.userId`.
- Response includes selected product, merchant URL, selected timestamp, and session/profile context.
- Customer dashboard Selected products panel now loads from `/api/me/choices?page=1&limit=6`.
- Added `Load more selected` control and selected-products pager text.
- Added a `Request` button for each selected product to open the account-scoped request detail.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

In-app browser customer dashboard QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served `dashboard.html` and authenticated current-user API fixtures at `http://127.0.0.1:8136/dashboard.html`.
- Flow under test: `dashboard.html` -> authenticated dashboard selected products -> `Load more selected` -> page 2 appends to visible selected-product history.
- Used a non-sensitive fake customer token accepted only by the mock server.
- Verified initial pager text: `Showing 6 of 9 selected product(s)` with `Load more selected`.
- Clicked `Load more selected`.
- Verified `Selected product 9` appeared while `Selected product 1` remained in the full selected-products text.
- Verified final pager text: `Showing 9 of 9 selected product(s)` and the Load more button disappeared.
- Verified mock API requests included page 1 and page 2:
  - `GET /api/me/choices?page=1&limit=6`
  - `GET /api/me/choices?page=2&limit=6`
- Desktop screenshot: `/private/tmp/shop-assistant-dashboard-selected-products-paging-qa.png`.
- Mobile viewport screenshot: `/private/tmp/shop-assistant-dashboard-selected-products-paging-mobile-qa.png`.
- Console/page errors in final QA runs: none.
- Page-level horizontal overflow: none on desktop/default or 390px mobile viewport.

Security and boundary evidence:

- New endpoint uses existing `JwtAuthGuard` from `MeController`.
- Query scope is `where: { session: { userId } }`; selected products from other accounts are not returned.
- The dashboard still uses only current-user `/api/me` routes for customer data.
- No public or admin selected-products listing route was added for the customer dashboard.

Remaining validation:

- Live selected-products pagination smoke with a real customer token after owner-approved deploy.
- Ownership negative test with two real customer accounts remains pending.

## Implementation Slice 2026-06-13: Customer Saved Searches Pagination

Scope implemented:

- Added page/limit support to authenticated `GET /api/saved-criteria`.
- Saved-search list remains scoped to the signed-in user's `userId`.
- The API response now includes pagination metadata.
- Customer dashboard Saved searches panel now loads from `/api/saved-criteria?page=1&limit=6`.
- Added `Load more saved` control and saved-search pager text.
- Existing Run/Edit/Delete actions remain available for every loaded saved-search row.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

In-app browser customer dashboard QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served `dashboard.html` and authenticated saved-search API fixtures at `http://127.0.0.1:8137/dashboard.html`.
- Flow under test: `dashboard.html` -> authenticated dashboard saved searches -> `Load more saved` -> page 2 appends to visible saved-search list.
- Used a non-sensitive fake customer token accepted only by the mock server.
- Verified initial pager text: `Showing 6 of 10 saved search(es)` with `Load more saved`.
- Clicked `Load more saved`.
- Verified `Saved search 10` appeared while `Saved search 1` remained in the full saved-search list text.
- Verified final pager text: `Showing 10 of 10 saved search(es)` and the Load more button disappeared.
- Verified mock API requests included page 1 and page 2:
  - `GET /api/saved-criteria?page=1&limit=6`
  - `GET /api/saved-criteria?page=2&limit=6`
- Desktop screenshot: `/private/tmp/shop-assistant-dashboard-saved-searches-paging-qa.png`.
- Mobile viewport screenshot: `/private/tmp/shop-assistant-dashboard-saved-searches-paging-mobile-qa.png`.
- Console/page errors in final QA runs: none.
- Page-level horizontal overflow: none on desktop/default or 390px mobile viewport.

Security and boundary evidence:

- Existing `JwtAuthGuard` remains on `SavedCriteriaController`.
- List query remains `where: { userId }`; saved searches from other accounts are not returned.
- Pagination is bounded to a maximum limit of 50.
- No public or admin saved-search listing route was added for the customer dashboard.

Remaining validation:

- Live saved-search pagination smoke with a real customer token after owner-approved deploy.
- Ownership negative test with two real customer accounts remains pending.

## Implementation Slice 2026-06-13: Admin Operational Health Overview

Scope implemented:

- Added health metrics to the existing protected `GET /api/admin/overview` endpoint.
- Health data now includes lead triage counts, open lead requests, search runs in the last 24 hours, zero-result search runs in the last 24 hours, and agent error communications in the last 24 hours.
- Admin overview now renders an Operational health section with compact cards for the new metrics.
- Added mobile responsive hardening for admin tabs and tables so narrow screens do not force page-level horizontal scrolling.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

In-app browser admin QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served `admin.html` and authorized admin API fixtures at `http://127.0.0.1:8138/admin.html`.
- Used a non-sensitive fake admin token accepted only by the mock server.
- Verified Admin Overview renders `Operational health`, `Open lead requests`, `Zero-result searches 24h`, and `Agent errors 24h`.
- Desktop screenshot: `/private/tmp/shop-assistant-admin-health-qa.png`.
- Mobile viewport screenshot: `/private/tmp/shop-assistant-admin-health-mobile-qa.png`.
- Console/page errors in final QA runs: none.
- Page-level horizontal overflow: none on desktop/default or 390px mobile viewport.

Security and boundary evidence:

- The endpoint remains under existing `JwtAuthGuard`, `RolesGuard`, and `@Roles('global:superadmin', 'app:shop-assistant:admin')`.
- The slice adds read-only aggregate metrics only; it does not expose customer-owned detail records outside the existing admin overview/operations boundary.
- No public endpoint, schema migration, or auth bypass was added.

Remaining validation:

- Live admin overview smoke with a real admin token after owner-approved deploy.
- Real non-admin forbidden check remains pending.

## Implementation Slice 2026-06-13: Admin Account Data Profiles and Saved Searches

Scope implemented:

- Added admin-only account-data operations under the existing role-protected admin operations controller:
  - `GET /api/admin/operations/profiles`
  - `PUT /api/admin/operations/profiles/:id`
  - `GET /api/admin/operations/saved-criteria`
  - `PUT /api/admin/operations/saved-criteria/:id`
- Replaced the Admin Profiles tab behavior so it no longer calls current-user `/api/profiles` for admin work.
- Admins can now view account profiles across users with session/saved-search counts.
- Admins can now view saved-search templates across users with linked profile and run counts.
- Admins can edit profile labels and saved-search criteria JSON through the admin panel.
- Saved-search profile assignment validates that the profile belongs to the saved-search user.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

In-app browser admin QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served `admin.html` and authorized admin API fixtures at `http://127.0.0.1:8139/admin.html`.
- Used a non-sensitive fake admin token accepted only by the mock server.
- Verified Account Data tab renders cross-user profiles and saved searches.
- Verified UI save path sends:
  - `PUT /api/admin/operations/profiles/profile-parent`
  - `PUT /api/admin/operations/saved-criteria/saved-school`
- Browser text entry was limited by the unavailable virtual clipboard in this environment, so save-path QA used loaded form values while still exercising the page's save handlers, JSON parsing, auth headers, and PUT requests.
- Desktop screenshot: `/private/tmp/shop-assistant-admin-account-data-qa.png`.
- Mobile viewport screenshot: `/private/tmp/shop-assistant-admin-account-data-mobile-qa.png`.
- Console/page errors in final QA runs: none.
- Page-level horizontal overflow: none on desktop/default or 390px mobile viewport.

Security and boundary evidence:

- New endpoints remain under existing `JwtAuthGuard`, `RolesGuard`, and `@Roles('global:superadmin', 'app:shop-assistant:admin')`.
- Customer `/api/profiles` and `/api/saved-criteria` ownership boundaries remain unchanged.
- Admin saved-search profile reassignment rejects profile IDs belonging to a different user.
- No public account-data route or auth bypass was added.

Remaining validation:

- Live admin account-data smoke with a real admin token after owner-approved deploy.
- Real non-admin forbidden check remains pending.

## Implementation Slice 2026-06-13: Token URL Hardening

Scope implemented:

- Removed token query-string import from the commercial landing page request flow.
- Removed token forwarding from landing page search redirect to `test.html`.
- Removed token query-string import from the diagnostic `test.html` page.
- Removed token forwarding from saved-search run redirects in `test.html`.
- Hardened Admin boot so `?token=` is stripped from the URL and rejected with a visible message instead of being stored.
- Preserved Auth-owned hash-fragment callback handling and URL cleanup for `#access_token=...`.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Source scan evidence:

- No remaining `&token=` forwarding pattern in `public/`.
- No remaining `?token=` forwarding pattern in `public/`.
- No remaining `encodeURIComponent(token)` forwarding pattern in `public/`.
- The only remaining `p.get('token')` reference is the Admin rejection branch that strips and rejects token URLs.

In-app browser auth hardening QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served patched `index.html`, `admin.html`, and `test.html` at `http://127.0.0.1:8140`.
- Verified `admin.html?token=secret-token` becomes `admin.html` in the address bar and renders `Token URLs are not accepted`.
- Verified Auth-style `admin.html#access_token=fragment-token&refresh_token=refresh-token` cleans the address bar back to `admin.html`.
- Verified the same hash-fragment flow reaches an authorized admin state against a mocked protected overview endpoint.
- Console/page errors in final QA runs: none.
- Screenshot: `/private/tmp/shop-assistant-token-hardening-admin-qa.png`.

Security and boundary evidence:

- Bearer tokens are no longer accepted from public query strings on landing, admin, or diagnostic frontend pages.
- Session deep links remain supported without carrying tokens.
- Auth fragment callback cleanup remains available for Auth-owned login handoff.
- Manual admin token paste remains available only through the advanced form, not through URLs.

Remaining validation:

- Live Auth callback check with real Auth accounts after owner-approved deploy.
- Server/proxy access-log check after deploy to confirm no frontend flow emits token query strings.

## Implementation Slice 2026-06-13: Auth Callback State Hardening

Scope implemented:

- Dashboard Auth callback now rejects `#access_token=...` fragments when the stored `state` is missing, the returned `state` is missing, or the values do not match.
- Admin Auth callback now applies the same strict state requirement.
- Rejected Auth fragments clear local auth state, clean the URL fragment from the address bar, and keep the page locked.
- Removed the remaining dead diagnostic `token=` query branch from `test.html`.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Source scan evidence:

- No remaining loose `expectedState && returnedState` state-check pattern in `public/`.
- No remaining `token=` query import/forwarding patterns in `public/`.

In-app browser auth callback QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served patched `dashboard.html` and `admin.html` at `http://127.0.0.1:8141`.
- Verified `dashboard.html#access_token=fragment-token&refresh_token=refresh-token` without matching stored state:
  - cleans URL back to `dashboard.html`
  - renders `Authentication state did not match`
  - keeps the dashboard locked behind Auth sign-in
- Verified `admin.html#access_token=fragment-token&refresh_token=refresh-token` without matching stored state:
  - cleans URL back to `admin.html`
  - renders `Authentication state did not match`
  - keeps the admin shell locked
- Console/page errors in final QA runs: none.
- Screenshot: `/private/tmp/shop-assistant-auth-state-hardening-qa.png`.

Security and boundary evidence:

- Auth callback tokens are no longer accepted unless they correspond to the state created by the same page's Auth handoff.
- URL fragments are still removed after rejection, reducing token exposure in browser chrome/history.
- This slice does not change backend guards or customer/admin ownership boundaries.

Remaining validation:

- Live Auth callback success check with real Auth accounts after owner-approved deploy.
- Live mismatched-state check after owner-approved deploy if a safe test account/token flow is available.

## Implementation Slice 2026-06-13: Session-Scoped Frontend Token Storage

Scope implemented:

- Added session-scoped access token storage key `shop_assistant_access_token`.
- Dashboard Auth callback stores access tokens in `sessionStorage`, not `localStorage`.
- Admin Auth callback stores tokens in `sessionStorage`, not `localStorage`; the later `Admin Auth-Only Gate` slice removed the manual-token flow.
- Landing page and diagnostic page read session-scoped tokens for same-tab authenticated requests.
- Legacy `localStorage.accessToken` is migrated into session storage and then removed.
- Legacy `localStorage.refreshToken` is removed; frontend pages no longer persist refresh tokens.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Source scan evidence:

- No remaining persistent `localStorage.setItem('accessToken', ...)` writes in `public/`.
- No remaining persistent `localStorage.setItem('refreshToken', ...)` writes in `public/`.
- No remaining `localStorage.getItem('refreshToken')` reads in `public/`.
- Remaining `localStorage.getItem('accessToken')` reads are legacy migration paths that immediately move the token into session storage and remove persistent token keys.

In-app browser auth storage QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served patched dashboard/admin pages at `http://127.0.0.1:8142`.
- Seed pages created the expected Auth `state` in `sessionStorage`, then redirected through the real hash callback.
- Verified dashboard Auth callback:
  - cleans URL back to `dashboard.html`
  - renders signed-in dashboard state
  - sends `Authorization: Bearer dashboard-session-token` to `/api/me`, `/api/me/dashboard`, `/api/profiles`, `/api/me/sessions`, `/api/me/choices`, and `/api/saved-criteria`
- Verified admin Auth callback:
  - cleans URL back to `admin.html`
  - renders authorized admin state
  - sends `Authorization: Bearer admin-session-token` to protected admin endpoints
- Console/page errors in final QA runs: none.
- Screenshot: `/private/tmp/shop-assistant-session-token-storage-qa.png`.

Security and boundary evidence:

- Frontend bearer tokens are no longer written to persistent browser storage by Shop Assistant pages.
- Legacy persistent tokens are cleaned on use or logout.
- This slice does not change backend JWT validation, RBAC, or current-user ownership checks.

Remaining validation:

- Live Auth callback success check with real Auth accounts after owner-approved deploy.
- Confirm Auth still returns access token fragments compatible with same-tab session storage in production.

## Implementation Slice 2026-06-13: Persistent User Identity Storage Cleanup

Scope implemented:

- Removed the dashboard `localStorage.setItem('user', ...)` write.
- Dashboard user label/state now renders directly from the authenticated `/api/me` response without persisting user identity in browser storage.
- Legacy `localStorage.user` cleanup remains on logout/session expiry.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Source scan evidence:

- No remaining `localStorage.setItem('user', ...)` in `public/`.
- No remaining `localStorage.getItem('user')` in `public/`.

In-app browser dashboard QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served patched `dashboard.html` at `http://127.0.0.1:8142`.
- Seed page created the expected Auth `state` in `sessionStorage`, then redirected through the real dashboard hash callback.
- Verified the dashboard URL fragment is cleaned back to `dashboard.html`.
- Verified signed-in dashboard state still renders from protected API data.
- Console/page errors in final QA run: none.
- Screenshot: `/private/tmp/shop-assistant-dashboard-user-storage-qa.png`.

Security and boundary evidence:

- Shop Assistant frontend no longer writes authenticated user identity/email to persistent browser storage.
- Protected dashboard state continues to come from current-user APIs.
- This slice does not change backend JWT validation or current-user ownership checks.

Remaining validation:

- Live Auth callback success check with real customer account after owner-approved deploy.

## Implementation Slice 2026-06-13: Admin Auth-Failure Lockdown

Scope implemented:

- Added a shared `handleAdminAuthResponse()` helper for protected admin fetches.
- `401` responses now clear session auth, lock the admin shell, and show the expired-auth sign-in message.
- `403` responses now lock the admin shell and show the missing-admin-role message.
- Overview, operations, prompts, models, account data, settings, prompt edit/delete/save, and admin data edit flows now use the same auth-failure path.
- Added a race guard so a late successful overview validation cannot re-unlock the admin shell after another admin request has already cleared auth.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Source scan evidence:

- Remaining raw `status === 401/403` checks in `public/admin.html` are limited to initial token validation and the shared auth-failure helper.
- Protected admin feature fetches route `401/403` through `handleAdminAuthResponse()`.

In-app browser admin auth-failure QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock servers served patched `admin.html` at `http://127.0.0.1:8144` and `http://127.0.0.1:8145`.
- Verified a valid Auth callback followed by a protected prompts `401`:
  - cleans URL back to `admin.html`
  - renders `Authentication expired or missing. Please sign in again.`
  - leaves `body` in `admin-locked`, not `admin-unlocked`
- Verified an overview `403` during admin validation:
  - cleans URL back to `admin.html`
  - renders `Your account is signed in but does not have a Shop Assistant admin role.`
  - leaves `body` in `admin-locked`, not `admin-unlocked`
- Screenshots:
  - `/private/tmp/shop-assistant-admin-401-lockout-qa.png`
  - `/private/tmp/shop-assistant-admin-403-lockout-qa.png`

Security and boundary evidence:

- Expired or invalid admin tokens no longer leave the admin shell visible after protected admin calls fail.
- Signed-in users without Shop Assistant admin roles are blocked from the admin surface consistently across admin tabs.
- This slice does not change backend JWT validation, admin roles, or customer data ownership rules.

Remaining validation:

- Live real-admin and real-non-admin smoke checks after owner-approved deploy.
- Live expired-token behavior check if a safe test token can be produced.

## Implementation Slice 2026-06-13: Dashboard Authorization-Failure Lockdown

Scope implemented:

- Dashboard API helper now handles `403` as an authorization boundary.
- Dashboard `401` and `403` responses clear local auth state and hide the dashboard shell.
- `401` renders the expired-auth sign-in message.
- `403` renders `Your account is signed in but is not authorized to use this dashboard.`
- Action-level dashboard failures now lock the UI instead of leaving stale customer data visible behind an inline error.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

In-app browser dashboard authorization QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served patched `dashboard.html` at `http://127.0.0.1:8146`.
- Seed page created the expected Auth `state` in `sessionStorage`, then redirected through the real dashboard hash callback.
- Mocked `/api/me` returned `403` while `/api/me/dashboard` and `/api/profiles` returned harmless empty data.
- Verified final page state:
  - URL cleaned back to `dashboard.html`
  - auth gate visible
  - dashboard shell hidden
  - logout hidden
  - user label reset to `Not signed in`
  - authorization message rendered
- Screenshot: `/private/tmp/shop-assistant-dashboard-403-lockout-qa.png`.

Security and boundary evidence:

- Signed-in users without access to the Shop Assistant dashboard no longer keep a stale dashboard shell visible after protected API denial.
- Expired and unauthorized dashboard sessions clear local frontend auth state.
- This slice does not change backend JWT validation, customer ownership rules, or admin-role behavior.

Remaining validation:

- Live real-customer and unauthorized-account dashboard smoke checks after owner-approved deploy.

## Implementation Slice 2026-06-13: Customer/Admin Token Isolation

Scope implemented:

- Landing-page customer search no longer reads `shop_assistant_admin_token` directly.
- Diagnostic/test account helpers no longer read `shop_assistant_admin_token` directly.
- Diagnostic/test page sign-in hint now points to the customer dashboard/Auth flow instead of telling users to paste a JWT in Admin.
- Historical note: at the time of this slice, manual admin JWT paste in `admin.html` wrote only `shop_assistant_admin_token` and no longer wrote the generic customer `shop_assistant_access_token`.
- Supersession note: the later `Admin Auth-Only Gate` slice removed the manual admin JWT paste UI entirely. Current validation should use the Auth-only deploy/post-deploy smoke path.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Source scan evidence:

- `public/index.html` no longer contains `shop_assistant_admin_token`.
- `public/test.html` no longer contains `shop_assistant_admin_token`.
- Historical note: during this slice, `public/admin.html` still contained the admin token key for admin-only manual-token access. The later `Admin Auth-Only Gate` slice changed current behavior so `public/admin.html` keeps only cleanup references for old `shop_assistant_admin_token` values.

In-app browser token-isolation QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served patched `index.html` and `test.html` at `http://127.0.0.1:8149`.
- With only `sessionStorage.shop_assistant_admin_token=admin-only-token`, landing search sent no `Authorization` header to:
  - `/api/sessions`
  - `/api/sessions/qa-session/query`
- With `sessionStorage.shop_assistant_access_token=customer-token`, landing search sent `Authorization: Bearer customer-token` to:
  - `/api/sessions`
  - `/api/sessions/qa-session/query`
  - `/api/profiles`
  - `/api/saved-criteria`
- With only an admin token on `test.html`, the account hint rendered `Sign in through the customer dashboard to use profiles and saved searches.`, and profile/saved-search controls stayed hidden.
- Screenshot: `/private/tmp/shop-assistant-token-isolation-qa.png`.

Security and boundary evidence:

- Customer-facing pages no longer directly consume the admin-only token key.
- Historical note: manually pasted admin JWTs were scoped to the admin page in this slice; the later `Admin Auth-Only Gate` slice removed manual JWT paste as a supported path.
- This slice does not change backend JWT validation, Auth role claims, or current-user ownership checks.

Remaining validation:

- Live real-customer customer-flow smoke checks after owner-approved deploy.
- Manual admin-token smoke is superseded by the `Admin Auth-Only Gate` and deploy/post-deploy smoke checks, which validate Auth-only admin access and absence of manual JWT UI.

## Implementation Slice 2026-06-13: Landing Stale-Token Anonymous Fallback

Scope implemented:

- Landing-page search now detects `401` or `403` responses when a customer access token is present.
- On stale/forbidden customer auth, the landing page clears customer token storage and retries the same public request anonymously exactly once.
- The fallback applies to public session creation and query submission from the commercial landing page.
- Public buyer search remains usable even if a previous customer session left an expired token in the browser.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

In-app browser landing stale-token QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served patched `index.html` at `http://127.0.0.1:8150`.
- Seed page set `sessionStorage.shop_assistant_access_token=stale-customer-token`.
- Mocked `/api/sessions` returned `401` when `Authorization` was present and `200` without auth.
- Verified request sequence:
  - first `/api/sessions` request used `Authorization: Bearer stale-customer-token`
  - retry `/api/sessions` request had no `Authorization` header
  - `/api/sessions/qa-session/query` had no `Authorization` header
  - browser reached `test.html?sessionId=qa-session`
- Screenshot: `/private/tmp/shop-assistant-landing-stale-token-fallback-qa.png`.

Security and boundary evidence:

- Stale customer tokens are removed from frontend storage before anonymous retry.
- The retry is limited to public landing search requests; dashboard/admin protected surfaces still lock on authorization failures.
- This slice does not change backend JWT validation, customer dashboard ownership checks, or admin RBAC.

Remaining validation:

- Live landing stale-token smoke after owner-approved deploy if a safe expired customer token can be produced.

## Implementation Slice 2026-06-13: Admin Agent-Flow Deep-Link Gate

Scope implemented:

- Admin `?sessionId=...#flow` deep links no longer auto-load agent communications before admin authorization.
- Flow tab loading now requires a stored admin/Auth token.
- Flow data fetches now send `Authorization: Bearer ...` and route `401/403` through the shared admin auth-failure lockout helper.
- Successful Auth callbacks with `sessionId` now restore the Flow tab after the token fragment is cleaned, so authorized operators can still use the deep link.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

In-app browser admin flow-gate QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock servers served patched `admin.html` at `http://127.0.0.1:8152` and `http://127.0.0.1:8153`.
- Unauthenticated `admin.html?sessionId=qa-session#flow`:
  - stayed `admin-locked`
  - showed `Sign in with an authorized admin account.`
  - did not call `/api/admin/overview`
  - did not call `/api/sessions/qa-session/agent-communications`
- Authorized Auth-style callback with `sessionId=qa-session`:
  - cleaned URL back to `admin.html?sessionId=qa-session`
  - unlocked the admin shell after mocked `/api/admin/overview`
  - loaded Flow tab content
  - sent `Authorization: Bearer admin-token` to `/api/sessions/qa-session/agent-communications`
- Screenshot: `/private/tmp/shop-assistant-admin-flow-gate-qa.png`.

Security and boundary evidence:

- Admin diagnostic flow links no longer bypass the admin UI gate.
- Admin flow fetches are now consistent with the rest of the admin panel: visible only after Auth validation and sent with a bearer token.
- This slice does not change backend endpoint authorization; it hardens frontend admin access behavior.

Remaining validation:

- Live admin deep-link smoke after owner-approved deploy with a real admin account.
- Backend authorization review for `/api/sessions/:id/agent-communications` if this diagnostic route should become admin-only at API level too.

## Implementation Slice 2026-06-13: Backend Agent-Communications Admin Guard

Scope implemented:

- `GET /api/sessions/:id/agent-communications` now uses `JwtAuthGuard`.
- The route now uses `RolesGuard` with `global:superadmin` and `app:shop-assistant:admin`.
- `SessionsModule` now imports `AuthModule` so route-level auth guards resolve correctly.
- Public customer search/result/message routes remain unchanged; only the diagnostic agent-communications endpoint was moved behind admin RBAC.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Focused Nest route-guard smoke:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && node /tmp/sa-g7-agent-communications-guard-smoke.js'
```

Result:

```json
{
  "missingStatus": 401,
  "nonAdminStatus": 403,
  "adminStatus": 200,
  "serviceCalls": ["session-guard-1"]
}
```

Security and boundary evidence:

- Missing bearer token no longer reaches agent communications service logic.
- Authenticated users without admin roles no longer reach agent communications service logic.
- Admin role tokens can still access the endpoint used by the Admin Flow tab.
- This closes the backend gap identified after frontend deep-link gating; frontend and API now enforce the same admin-only expectation.

Remaining validation:

- Live admin/non-admin smoke after owner-approved deploy.

## Implementation Slice 2026-06-13: Legacy Debug Page Admin Handoff

Scope implemented:

- Replaced the legacy public `debug.html` split-pane session debugger with a compact Admin Flow handoff page.
- `debug.html?sessionId=...` now pre-fills the session id and routes operators to `admin.html?sessionId=...#flow`.
- The legacy page no longer fetches `/api/sessions/:id/messages`.
- The legacy page no longer fetches `/api/sessions/:id/agent-communications`.
- Updated Admin Flow copy to state that the view requires an authorized admin account.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

In-app browser debug handoff QA:

- Browser plugin was available and used through the in-app browser workflow.
- Temporary mock server served patched `debug.html` and `admin.html` at `http://127.0.0.1:8154`.
- Verified `debug.html?sessionId=qa-session`:
  - rendered `Admin debug moved`
  - prefilled the session id
  - made no `/api` requests
- Verified Admin Flow target `admin.html?sessionId=qa-session#flow`:
  - remained `admin-locked` without auth
  - rendered `Sign in with an authorized admin account.`
  - contained copy stating the view requires an authorized admin account

Security and boundary evidence:

- The old public debug page no longer exposes client or agent communication reads by session id.
- Agent communication inspection now funnels through the role-protected Admin Flow UI and the admin-protected backend route.
- This slice preserves deep-link usability while removing the public diagnostic data surface.

Remaining validation:

- Live debug-to-admin handoff smoke after owner-approved deploy.

## Implementation Slice 2026-06-13: Login/Register Centralized Auth Handoff

Scope implemented:

- Replaced the local `public/login.html` password form with a centralized Alfares Auth handoff page.
- Replaced the local `public/register.html` account/password form with a centralized Alfares Auth handoff page.
- Both pages generate Auth URLs with `client_id=shop-assistant`, `return_url` pointing to `dashboard.html`, and a per-request state value stored in session storage.
- Removed local credential submission to `/api/auth/login` and `/api/auth/register`.
- Removed legacy `localStorage` writes for `accessToken`, `refreshToken`, and `user` from the login/register surfaces.
- The customer dashboard remains the page that validates Auth callback state, stores the session-scoped customer token, and loads account-scoped data.

Validation evidence:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static auth-surface scan:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && rg -n "<form|type=\"password\"|localStorage\.setItem|/api/auth|auth/register|auth/login|accessToken|refreshToken|return_url|client_id|STATE_KEY|AUTH_BASE" public/login.html public/register.html'
```

Result:

- No local forms remain.
- No password inputs remain.
- No localStorage token writes remain.
- No `/api/auth/login` or `/api/auth/register` calls remain.
- Expected Auth handoff constants and URL parameters remain.

Security and boundary evidence:

- Shop Assistant static login/register pages no longer collect credentials.
- Credential handling, account creation, and verification stay owned by the authentication microservice.
- The handoff uses the same customer `STATE_KEY` and dashboard return target as the main customer dashboard Auth flow.

Remaining validation:

- Live Auth login/register callback smoke after owner-approved deploy.

## Implementation Slice 2026-06-13: Advanced Test Interface Boundary Cleanup

Scope implemented:

- Updated `public/test.html` header copy so the page is framed as an advanced customer search/conversation interface, not a public agent-debug surface.
- Updated the session handoff link to read `Open Admin Flow (admin only)`.
- Added shared customer auth cleanup for account features in `public/test.html`.
- Customer profile and saved-search operations now clear stale customer auth and hide account controls on `401` or `403`.
- Anonymous advanced search/session behavior remains unchanged.
- Admin-only agent diagnostics remain routed to `admin.html?sessionId=...#flow`.

Validation evidence:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static source scan:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && rg -n "Test agent communication|debug agent interactions|Open Admin Flow|handleAccountAuthResponse|clearCustomerAuth|Account sign-in required|customer dashboard" public/test.html'
```

Result:

- Old public-debug wording was not present.
- `Open Admin Flow (admin only)` was present.
- `clearCustomerAuth` and `handleAccountAuthResponse` were present and wired into profile/saved-search account operations.

Browser QA:

- Used the Browser plugin with a temporary local mock server at `127.0.0.1:8162`.
- Mock server seeded a stale customer token and returned `403` for `GET /api/profiles`.
- Verified DOM state after page load:
  - account section visible as the signed-out hint
  - profile controls hidden
  - saved-search controls hidden
  - header copy states agent diagnostics are available only in Admin Flow
  - Admin Flow link text is `Open Admin Flow (admin only) →`

Security and boundary evidence:

- A stale or forbidden customer token no longer leaves protected customer account controls visible on the advanced test page.
- The page no longer invites users to debug agent interactions outside the admin boundary.
- This keeps the public/customer diagnostic path separate from admin-only agent communication inspection.

Remaining validation:

- Live deployed advanced test page smoke after owner-approved deploy.

## Implementation Slice 2026-06-13: Legacy Admin Token Guide Auth Access Cleanup

Scope implemented:

- Replaced the public legacy `public/getting-admin-token.html` instructions for obtaining and pasting raw admin JWTs.
- The compatibility route now documents the supported Auth-hosted admin sign-in flow.
- The page documents required roles: `global:superadmin` and `app:shop-assistant:admin`.
- Troubleshooting now points operators to Auth role assignment and fresh Auth sign-in instead of copying tokens from DevTools, API responses, helper scripts, or refresh flows.
- Added explicit guidance not to copy access tokens from browser developer tools, logs, or API responses into documents or chats.

Validation evidence:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static source scan:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && rg -n "accessToken|refreshToken|Copy Token|Show Token|Developer Tools|POST /auth/login|curl -X POST|paste|raw tokens|Sign in with Auth|Required Roles|Do not copy access tokens" public/getting-admin-token.html'
```

Result:

- No old `accessToken` or `refreshToken` examples remain.
- No instructions remain for Copy Token, Show Token, DevTools extraction, login curl extraction, or pasting tokens into the panel.
- Expected Auth sign-in, required-role, and token-handling warning copy remains.

Security and boundary evidence:

- Public documentation no longer trains admins to handle raw credentials or token payloads for normal access.
- The page now matches the current admin frontend: Auth owns sign-in, Shop Assistant validates roles server-side, and the frontend should not expose token handling as the primary workflow.

Remaining validation:

- Live route smoke for `/getting-admin-token.html` after owner-approved deploy.

## Implementation Slice 2026-06-13: Admin Auth-Only Gate

Scope implemented:

- Removed the manual admin JWT paste fallback from `public/admin.html`.
- Removed the `tokenInput`, `saveTokenBtn`, `clearTokenBtn`, and `setToken` UI/code paths.
- Admin access now uses the Auth-hosted sign-in callback and the session-scoped `shop_assistant_access_token`.
- `shop_assistant_admin_token` is no longer used as an active token source; old values are cleared on page load and logout.
- Updated locked-state and action-level copy so operators are directed to Auth sign-in rather than saving or pasting JWTs.
- Preserved token URL rejection for `admin.html?token=...`.

Validation evidence:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

Static source scan:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && rg -n "manual-token|tokenInput|saveTokenBtn|clearTokenBtn|setToken|shop_assistant_admin_token|Paste JWT|paste a valid admin JWT|paste the admin JWT|Save a valid admin JWT|Save a valid JWT|Token saved|Token found|JWT token|Use token|valid admin token|Sign in with Auth|Sign in through Auth|Token URLs are not accepted" public/admin.html'
```

Result:

- Manual token UI/code identifiers were absent.
- Paste/save JWT copy was absent.
- Expected Auth sign-in copy remained.
- Expected token URL rejection copy remained.
- `shop_assistant_admin_token` remained only as cleanup calls.

Browser QA:

- Used the Browser plugin with a temporary local mock server at `127.0.0.1:8163`.
- Locked state at `/admin.html`:
  - body remained `admin-locked`
  - `Sign in with Auth` rendered
  - manual JWT text was absent
  - `tokenInput` was absent
- Token URL rejection at `/admin.html?token=secret-token`:
  - URL was cleaned back to `/admin.html`
  - status rendered `Token URLs are not accepted. Sign in through Auth.`
  - `tokenInput` was absent
- Auth callback success via seeded state and `#access_token=qa-admin-token`:
  - URL fragment was cleaned
  - body became `admin-unlocked`
  - `tokenStatus` rendered `Authorized admin session active.`
  - `tokenInput` remained absent

Security and boundary evidence:

- Operators no longer need to handle raw admin JWTs for normal or fallback admin access.
- Admin access still depends on server-side `/api/admin/overview` validation, JWT validation, and admin role checks.
- Bearer tokens are still rejected from URL query strings.

Remaining validation:

- Live real admin/non-admin Auth callback smoke after owner-approved deploy.

## Implementation Slice 2026-06-13: SA-G7 Live Smoke Script

Scope implemented:

- Added `scripts/sa-g7-live-smoke.sh`.
- The script targets `BASE_URL`, defaulting to `https://shop-assistant.alfares.cz`.
- Public checks run without secrets:
  - route availability for landing, health, dashboard, admin, login, register, test, debug, admin access guide, and legal pages
  - expected Auth-only copy on admin/login/register/debug/test pages
  - forbidden legacy token-copy/password-form/debug copy checks
  - unauthenticated `401` checks for `/api/me`, `/api/me/dashboard`, `/api/admin/overview`, `/api/admin/settings`, and `/api/sessions/:id/agent-communications`
- Optional token checks run only when the operator supplies environment variables:
  - `CUSTOMER_TOKEN` for `/api/me`, dashboard, profiles, and saved criteria
  - `ADMIN_TOKEN` for admin overview/settings and optional Agent Flow API
  - `NON_ADMIN_TOKEN` for admin `403` checks
  - `AGENT_FLOW_SESSION_ID` for Agent Flow route checks
- The script does not print token values.
- Search and lead submission are intentionally not part of the default script path to avoid creating live customer/lead data during routine readiness checks.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/sa-g7-live-smoke.sh'
```

Result: pass.

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

No-secret production run:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && ./scripts/sa-g7-live-smoke.sh'
```

Observed current production state:

- Public route availability mostly passed:
  - `/`, `/health`, `/dashboard.html`, `/admin.html`, `/login.html`, `/register.html`, `/test.html`, `/debug.html`, `/getting-admin-token.html`, `/privacy.html`, `/cookies.html`, and `/terms.html` returned `200`.
- Unauthenticated protections passed for:
  - `GET /api/me` -> `401`
  - `GET /api/me/dashboard` -> `401`
  - `GET /api/admin/overview` -> `401`
  - `GET /api/admin/settings` -> `401`
- Expected failures before deploy:
  - production static pages still serve pre-SA-G7 content for admin/login/register/debug/test/admin-access-guide copy checks
  - `GET /api/sessions/smoke/agent-communications` returned `404`, showing the protected route change is not live yet
- Optional customer/admin/non-admin token checks were skipped because no tokens were supplied.

Security and boundary evidence:

- The script gives a repeatable post-deploy proof path for the frontend/auth objective without recording or printing secrets.
- The failed production content checks are a deployment-readiness signal, not an implementation failure in the remote worktree; owner-approved deployment remains required before the live checks can pass.

Remaining validation:

- Owner-approved deploy.
- Rerun `scripts/sa-g7-live-smoke.sh` after deploy.
- Rerun with safe `CUSTOMER_TOKEN`, `ADMIN_TOKEN`, and `NON_ADMIN_TOKEN` values to prove customer dashboard access, admin access, and non-admin rejection.

## Implementation Slice 2026-06-13: Post-Deploy SA-G7 Smoke Integration

Scope implemented:

- Updated `scripts/post-deploy-check.sh` to run `scripts/sa-g7-live-smoke.sh` as the final frontend/auth readiness gate.
- Preserved the existing Docker/log/health check output as best-effort diagnostics.
- Documented optional environment variables in the post-deploy script header:
  - `CUSTOMER_TOKEN`
  - `ADMIN_TOKEN`
  - `NON_ADMIN_TOKEN`
  - `AGENT_FLOW_SESSION_ID`
- The post-deploy script now exits nonzero when the SA-G7 smoke script finds failures, making stale frontend assets or broken auth boundaries visible immediately after rollout.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/post-deploy-check.sh && bash -n scripts/sa-g7-live-smoke.sh && npm run build'
```

Result: pass.

Deployment note:

- The full post-deploy script was not rerun against production in this slice because the previous no-secret SA-G7 smoke already proved production is still serving pre-SA-G7 frontend assets before owner-approved deployment.
- After owner-approved deploy, `./scripts/post-deploy-check.sh` is now the single operator command for health plus SA-G7 frontend/auth readiness.

Remaining validation:

- Owner-approved deploy.
- Run `./scripts/post-deploy-check.sh` after deploy.
- Rerun with safe customer/admin/non-admin Auth tokens for complete live role validation.

## Implementation Slice 2026-06-13: Deploy Script Post-Deploy Gate

Scope implemented:

- Updated `scripts/deploy.sh` to run `scripts/post-deploy-check.sh` after rollout completion and pod status output.
- The new phase is tracked by the existing deploy timing wrapper as `Post-deploy checks`.
- Because `post-deploy-check.sh` now runs `scripts/sa-g7-live-smoke.sh`, a deploy cannot finish with `deploy_timing_finish_success` unless the frontend/auth smoke passes.
- Existing deployment preflight, manifest apply, rollout restart, rollout wait, and pod status phases remain unchanged.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/deploy.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/sa-g7-live-smoke.sh && npm run build'
```

Result: pass.

Deployment note:

- `scripts/deploy.sh` was not executed in this slice. Production deployment still requires explicit owner approval.
- The deploy script now enforces the same post-deploy SA-G7 checks that were previously available as a separate operator command.

Remaining validation:

- Owner-approved deploy.
- Observe deploy phase `Post-deploy checks`.
- Rerun with safe customer/admin/non-admin Auth tokens for complete live role validation.

## Implementation Slice 2026-06-13: Local Auth Proxy Surface Disabled

Scope implemented:

- Updated `src/auth/auth.module.ts` so it no longer registers a Shop Assistant login/register controller.
- Neutralized `src/auth/auth.controller.ts`; it now documents that credential collection, account creation, token refresh, and role assignment are owned by the authentication service.
- `AuthService`, `JwtAuthGuard`, and `RolesGuard` remain exported for protected customer/admin API validation.
- Updated `scripts/sa-g7-live-smoke.sh` to require:
  - `POST /api/auth/login` -> `404`
  - `POST /api/auth/register` -> `404`

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/sa-g7-live-smoke.sh && rg -n "AuthController|Proxies register|Proxying register|LOGIN_PROXY|/api/auth/login|/api/auth/register|auth/login|auth/register|passwordLength|controllers:" src/auth scripts/sa-g7-live-smoke.sh docs/intent-preservation/validation-reports/VAL-SA-G7-FRONTEND.md | head -n 220'
```

Result:

- `src/auth/auth.module.ts` has `controllers: []`.
- Old proxy implementation strings were absent from `src/auth`.
- Only expected references to `/api/auth/login` and `/api/auth/register` are smoke expectations and historical validation notes.

Security and boundary evidence:

- Shop Assistant no longer exposes same-origin login/register proxy endpoints.
- The browser-facing credential flow is Auth-hosted only.
- JWT validation and role checks for protected APIs remain owned by the authentication microservice through `AuthService`.

Remaining validation:

- Owner-approved deploy.
- Post-deploy smoke proving `/api/auth/login` and `/api/auth/register` return `404` in production.

## Implementation Slice 2026-06-13: Deploy Gate Failure Timing

Scope implemented:

- Refactored `scripts/deploy.sh` so the `Post-deploy checks` phase uses the shared `deploy_timing_run_phase` helper.
- A failed `scripts/post-deploy-check.sh` now still closes the timed phase before the deploy script exits nonzero.
- The deployment timing summary will therefore include the post-deploy smoke duration even when the frontend/auth gate fails.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/deploy.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/sa-g7-live-smoke.sh && npm run build'
```

Result: pass.

Deployment note:

- `scripts/deploy.sh` was not executed in this slice. Production deployment still requires explicit owner approval.

Remaining validation:

- Owner-approved deploy.
- Observe both successful and failing `Post-deploy checks` timing behavior during real rollout or a safe staging rehearsal.

## Implementation Slice 2026-06-13: Live Smoke Cache-Busted HTML Checks

Scope implemented:

- Updated `scripts/sa-g7-live-smoke.sh` so HTML body checks use:
  - `Cache-Control: no-cache`
  - `Pragma: no-cache`
  - per-run `sa_g7_smoke=<timestamp>` cache-busting query parameter
- The cache-bust key is printed in the smoke output.
- API status checks remain unchanged and do not print token values.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/sa-g7-live-smoke.sh && npm run build'
```

Result: pass.

No-secret production run:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && ./scripts/sa-g7-live-smoke.sh'
```

Observed:

- Smoke output included `HTML cache-bust key: <timestamp>`.
- Public route availability checks returned `200`.
- Expected predeploy failures remained for old static frontend content.
- Expected predeploy failures remained for:
  - `GET /api/sessions/smoke/agent-communications`, which returned `404` until the guarded route is deployed
  - `POST /api/auth/login`, which returned `400` until the disabled local auth proxy is deployed
  - `POST /api/auth/register`, which returned `400` until the disabled local auth proxy is deployed

Security and boundary evidence:

- The deploy smoke is less likely to falsely fail because of cached HTML after rollout.
- The script still fails if production serves old password/token/admin-debug surfaces after deploy.

Remaining validation:

- Owner-approved deploy.
- Post-deploy smoke proving cache-busted HTML checks pass against the newly deployed frontend.

## Implementation Slice 2026-06-13: Post-Deploy Kubernetes Diagnostics

Scope implemented:

- Updated `scripts/post-deploy-check.sh` to print Kubernetes runtime diagnostics for the Shop Assistant workload before health checks and frontend/auth smoke.
- Added configurable defaults:
  - `SERVICE_NAME=shop-assistant`
  - `NAMESPACE=statex-apps`
- Diagnostics now include:
  - matching pods with `kubectl get pods -l app=$SERVICE_NAME -o wide`
  - deployment state with `kubectl get deployment $SERVICE_NAME -o wide`
  - recent deployment logs with `kubectl logs deployment/$SERVICE_NAME --tail=80 --all-containers=true`
- Kubernetes diagnostics are best-effort and do not mask the final SA-G7 frontend/auth smoke gate.
- Existing Docker diagnostics remain in place for legacy/runtime context.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/post-deploy-check.sh && bash -n scripts/deploy.sh && bash -n scripts/sa-g7-live-smoke.sh && npm run build'
```

Result: pass.

Deployment note:

- `scripts/deploy.sh` was not executed in this slice. Production deployment still requires explicit owner approval.
- The new diagnostics are intended to surface pod creation, image pull, rollout, and runtime log context in the same post-deploy output that runs the cache-busted SA-G7 smoke.

Remaining validation:

- Owner-approved deploy.
- Observe Kubernetes diagnostics during the `Post-deploy checks` phase.
- Post-deploy smoke proving cache-busted frontend/auth checks pass against the newly deployed frontend.

## Implementation Slice 2026-06-13: Admin Settings Audit Metadata

Scope implemented:

- Extended protected `GET /api/admin/settings` and `PUT /api/admin/settings` responses with `meta` for safe editable settings:
  - `agentExecutionMode`
  - `maxSearchResults`
  - `publicLanding`
- Metadata includes:
  - setting key
  - editable flag
  - persisted/default source
  - description
  - runtime area the setting applies to
  - `updatedBy`
  - `updatedAt`
- Updated `public/admin.html` Safe service settings tab with a Settings audit table that renders metadata after settings load and after settings save.
- Public landing settings endpoint remains unchanged and does not expose audit metadata.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

Result: pass.

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && rg -n "Settings audit|settingsMetaBody|renderSettingsMeta|meta: SafeAppSettingsMeta|getSettingsMeta|updatedBy|updatedAt" public/admin.html src/admin/app-settings.service.ts'
```

Result: pass. Source verification confirmed:

- backend settings response includes safe setting metadata;
- admin page contains Settings audit markup;
- admin page renders metadata after load and save.

Security and boundary evidence:

- No secret, provider key, JWT secret, environment value, or deployment setting was added to the editable settings list.
- Metadata is returned only through the admin-protected settings endpoint.
- The public settings endpoint still returns only public landing copy.

Remaining validation:

- Owner-approved deploy.
- Live admin-token smoke proving the Settings audit table renders persisted/default state from production.
- Live save/readback smoke proving `updatedBy` and `updatedAt` update after an authorized settings change.

## Implementation Slice 2026-06-13: Live Smoke Admin Settings Metadata Gate

Scope implemented:

- Updated `scripts/sa-g7-live-smoke.sh` so optional `ADMIN_TOKEN` checks now validate the JSON shape of `GET /api/admin/settings`.
- The admin-token smoke now requires `meta` entries for:
  - `agentExecutionMode`
  - `maxSearchResults`
  - `publicLanding`
- Each metadata entry must include:
  - matching key
  - `editable=true`
  - source of `persisted` or `default`
  - non-empty description
  - non-empty applies-to text
  - nullable/string `updatedBy`
  - nullable/string `updatedAt`
- Added `SMOKE_CURL_MAX_TIME`, defaulting to `12`, and applied it to all smoke `curl` requests so live checks cannot hang indefinitely.
- Token values remain unprinted.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/sa-g7-live-smoke.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/deploy.sh && npm run build && rg -n "SMOKE_CURL_MAX_TIME|expect_admin_settings_metadata|safe settings metadata|Per-request timeout" scripts/sa-g7-live-smoke.sh'
```

Result: pass.

No-secret production run:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && ./scripts/sa-g7-live-smoke.sh'
```

Observed:

- Public route availability checks returned `200`.
- Optional `CUSTOMER_TOKEN`, `ADMIN_TOKEN`, and `NON_ADMIN_TOKEN` checks were skipped without printing tokens.
- The new admin settings metadata check was not run without `ADMIN_TOKEN`, as intended.
- Expected predeploy failures remained for old static frontend/auth content and not-yet-deployed API changes.

Remaining validation:

- Owner-approved deploy.
- Post-deploy no-secret smoke.
- Live `ADMIN_TOKEN` smoke proving protected settings metadata in production.
- Live admin settings save/readback smoke proving `updatedBy` and `updatedAt` update after an authorized settings change.

## Implementation Slice 2026-06-13: Live Smoke Customer Dashboard Contract Gate

Scope implemented:

- Updated `scripts/sa-g7-live-smoke.sh` so optional `CUSTOMER_TOKEN` checks validate customer dashboard/account API response contracts, not just HTTP `200` status.
- Added customer-token status checks for:
  - `GET /api/me/sessions?page=1&limit=5`
  - `GET /api/me/choices?page=1&limit=5`
- Added customer response-shape validation for:
  - `GET /api/me`: requires `user.id`
  - `GET /api/me/dashboard`: requires numeric summary fields and array-backed `recentSessions` / `recentChoices`
  - `GET /api/me/sessions?page=1&limit=5`: requires `items[]` plus pagination
  - `GET /api/me/choices?page=1&limit=5`: requires `items[]` plus pagination
  - `GET /api/profiles`: requires `items[]`
  - `GET /api/saved-criteria?page=1&limit=5`: requires `items[]` plus pagination
- Token values remain unprinted.
- The checks are skipped unless `CUSTOMER_TOKEN` is provided.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/sa-g7-live-smoke.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/deploy.sh && npm run build && rg -n "expect_customer_dashboard_contract|Customer dashboard/account APIs|/api/me/choices|DASHBOARD_BODY|assertPagination" scripts/sa-g7-live-smoke.sh'
```

Result: pass.

No-secret production run:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && ./scripts/sa-g7-live-smoke.sh'
```

Observed:

- Public route availability checks returned `200`.
- `CUSTOMER_TOKEN`, `ADMIN_TOKEN`, and `NON_ADMIN_TOKEN` optional checks were skipped without printing tokens.
- Expected predeploy failures remained for old static frontend/auth content and not-yet-deployed API changes.

Remaining validation:

- Owner-approved deploy.
- Post-deploy no-secret smoke.
- Live `CUSTOMER_TOKEN` smoke proving customer dashboard/account API contracts in production.
- Live dashboard browser smoke with a real customer Auth callback.

## Implementation Slice 2026-06-13: Live Smoke Admin RBAC Breadth Gate

Scope implemented:

- Expanded `scripts/sa-g7-live-smoke.sh` optional `ADMIN_TOKEN` checks beyond overview/settings.
- Admin-token smoke now checks `200` access for:
  - `GET /api/admin/prompts`
  - `GET /api/admin/ai-models?limit=5`
  - `GET /api/admin/operations/sessions?page=1&limit=5`
  - `GET /api/admin/operations/leads?page=1&limit=5`
  - `GET /api/admin/operations/profiles?page=1&limit=5`
  - `GET /api/admin/operations/saved-criteria?page=1&limit=5`
- Admin-token smoke validates response contracts for:
  - AI models: object-backed `models`, object-backed `providers`, and `modelList[]`
  - operations list endpoints: `items[]` and pagination with integer `page`, `limit`, and `total`
- Expanded optional `NON_ADMIN_TOKEN` checks to require `403` for the same protected admin surfaces.
- Token values remain unprinted.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/sa-g7-live-smoke.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/deploy.sh && npm run build && rg -n "expect_admin_list_contract|expect_admin_models_contract|/api/admin/operations/sessions|/api/admin/operations/saved-criteria|/api/admin/prompts non-admin|/api/admin/ai-models admin" scripts/sa-g7-live-smoke.sh'
```

Result: pass.

No-secret production run:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && ./scripts/sa-g7-live-smoke.sh'
```

Observed:

- Public route availability checks returned `200`.
- `CUSTOMER_TOKEN`, `ADMIN_TOKEN`, and `NON_ADMIN_TOKEN` optional checks were skipped without printing tokens.
- Expected predeploy failures remained for old static frontend/auth content and not-yet-deployed API changes.

Remaining validation:

- Owner-approved deploy.
- Post-deploy no-secret smoke.
- Live `ADMIN_TOKEN` smoke proving admin operations/prompts/models contracts in production.
- Live `NON_ADMIN_TOKEN` smoke proving role-denied admin panel surfaces return `403`.

## Implementation Slice 2026-06-13: Live Smoke Public Landing Settings Contract

Scope implemented:

- Updated `scripts/sa-g7-live-smoke.sh` with a no-token contract check for `GET /api/public/settings/landing`.
- The smoke now requires the public endpoint to return `publicLanding` with non-empty string fields:
  - `headline`
  - `subheadline`
  - `primaryCtaLabel`
  - `secondaryCtaLabel`
  - `contactHeadline`
  - `contactSubheadline`
  - `leadSubmitLabel`
  - `footerTagline`
- This verifies the runtime path used by the landing page to apply admin-editable commercial copy.
- No admin metadata or secret values are expected from the public endpoint.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/sa-g7-live-smoke.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/deploy.sh && npm run build && rg -n "expect_public_landing_settings_contract|/api/public/settings/landing|publicLanding|footerTagline" scripts/sa-g7-live-smoke.sh'
```

Result: pass.

No-secret production run:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && ./scripts/sa-g7-live-smoke.sh'
```

Observed:

- `GET /api/public/settings/landing` returned `200`.
- Public landing settings contract passed in production.
- Optional `CUSTOMER_TOKEN`, `ADMIN_TOKEN`, and `NON_ADMIN_TOKEN` checks were skipped without printing tokens.
- Expected predeploy failures remained for old static frontend/auth content and not-yet-deployed API changes.

Remaining validation:

- Owner-approved deploy.
- Post-deploy no-secret smoke proving the newly deployed landing HTML consumes this endpoint.
- Live admin save/readback smoke proving public landing copy changes are reflected by this endpoint and landing page runtime copy.

## Implementation Slice 2026-06-13: Deploy Rollout Failure Diagnostics

Scope implemented:

- Updated `scripts/deploy.sh` with an `ERR` trap that prints rollout diagnostics before the script exits nonzero.
- Diagnostics include:
  - deployment summary and full deployment describe
  - matching ReplicaSets
  - matching pods
  - pod descriptions
  - pod logs with all containers, tail 80
  - recent namespace events
- The diagnostic path is best-effort and does not perform rollback or deployment mutation by itself.
- This specifically improves evidence capture for the existing pod `ContainerCreating` / image pull-create blocker.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/deploy.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/sa-g7-live-smoke.sh && npm run build && rg -n "print_rollout_diagnostics|on_deploy_error|trap|recent namespace events|describe pod" scripts/deploy.sh'
```

Result: pass.

Deployment note:

- `scripts/deploy.sh` was not executed in this slice.
- Production deployment still requires explicit owner approval.

Remaining validation:

- Owner-approved deploy.
- If rollout fails, verify diagnostic output captures the failing pod state, events, and image pull/create context before exit.
- If rollout succeeds, run post-deploy no-secret and token-backed SA-G7 smokes.

## Implementation Slice 2026-06-13: Live Smoke Auth Handoff Static Invariants

Scope implemented:

- Expanded `scripts/sa-g7-live-smoke.sh` public static checks for Auth handoff invariants.
- Login and register page checks now require:
  - Auth host `https://auth.alfares.cz`
  - `client_id=shop-assistant` source presence
  - `return_url` source presence
  - state saved to `sessionStorage`
  - no password input
  - no persistent `localStorage.setItem('accessToken'...)` write
- Dashboard page checks now require:
  - Auth host `https://auth.alfares.cz`
  - `client_id=shop-assistant` source presence
  - callback state mismatch handling
  - session-scoped token storage
  - no persistent access-token write
- Admin page checks now require:
  - Auth host `https://auth.alfares.cz`
  - `client_id=shop-assistant` source presence
  - admin-specific state key
  - callback state mismatch handling
  - session-scoped token storage
  - no persistent access-token write

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/sa-g7-live-smoke.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/deploy.sh && npm run build && rg -n "login page Auth base|register page Auth base|dashboard page state validation|admin page admin state key|persistent token write|session token storage" scripts/sa-g7-live-smoke.sh'
```

Result: pass.

No-secret production run:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && ./scripts/sa-g7-live-smoke.sh'
```

Observed:

- Public route availability checks returned `200`.
- Public landing settings endpoint still returned `200` and passed contract.
- Optional `CUSTOMER_TOKEN`, `ADMIN_TOKEN`, and `NON_ADMIN_TOKEN` checks were skipped without printing tokens.
- Expected predeploy failures increased because current production still serves older login/register/admin/dashboard/static auth surfaces that do not satisfy the new Auth handoff invariants.

Remaining validation:

- Owner-approved deploy.
- Post-deploy no-secret smoke proving newly deployed login/register/dashboard/admin pages satisfy Auth handoff invariants.
- Token-backed customer/admin/non-admin smokes after Auth callback.

## Implementation Slice 2026-06-13: Deploy Registry Preflight Diagnostics

Scope implemented:

- Inspected current Kubernetes rollout state without changing it:
  - deployment is `1/1` ready;
  - current image is `localhost:5000/shop-assistant:latest`;
  - one ready pod is running;
  - historical zero-replica ReplicaSets remain from prior rollouts.
- Confirmed node conditions are healthy:
  - no memory pressure;
  - no disk pressure;
  - no PID pressure;
  - node is Ready.
- Confirmed local registry reachability and `shop-assistant:latest` tag availability.
- Updated `scripts/deploy.sh` preflight to verify before rollout:
  - registry `/v2/` responds;
  - `shop-assistant:latest` exists at `localhost:5000`;
  - current running image digest is printed for traceability.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/deploy.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/sa-g7-live-smoke.sh && npm run build && rg -n "REGISTRY_URL|IMAGE_REPOSITORY|IMAGE_TAG|checking local registry|tags/list|Current running image digest" scripts/deploy.sh'
```

Result: pass.

Read-only live diagnostics:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && curl -fsS --max-time 8 http://localhost:5000/v2/ >/dev/null && curl -fsS --max-time 8 http://localhost:5000/v2/shop-assistant/tags/list && kubectl get pod -n statex-apps -l app=shop-assistant -o jsonpath="{range .items[*]}{.metadata.name}{\" \"}{range .status.containerStatuses[*]}{.imageID}{\"\n\"}{end}{end}"'
```

Observed:

- Registry `/v2/` probe passed.
- Tags endpoint returned `{"name":"shop-assistant","tags":["latest"]}`.
- Current ready pod image digest: `localhost:5000/shop-assistant@sha256:94262d813da39183c607ef09814676f6cdab3a735bc955937c4b9f97716269a8`.

Deployment note:

- `scripts/deploy.sh` was not executed in this slice.

Remaining validation:

- Owner-approved deploy.
- Verify deploy preflight prints registry/tag/digest evidence before rollout.
- If rollout fails again, combine the registry preflight output with the existing rollout failure diagnostics.

## Implementation Slice 2026-06-13: Explicit Image Packaging Step

Scope implemented:

- Added `scripts/build-and-push-image.sh` as an explicit operator step before deployment.
- The script:
  - prints target image `localhost:5000/shop-assistant:latest` by default;
  - prints Git HEAD;
  - shows dirty worktree files if present;
  - runs `npm run build`;
  - builds the Docker image from the current filesystem state;
  - labels the image with source/revision/created metadata;
  - pushes to the local registry;
  - verifies the pushed repository tag list.
- Updated `scripts/deploy.sh` with a `Source/image state` phase that:
  - prints Git HEAD;
  - prints dirty worktree status;
  - reminds operators to run `scripts/build-and-push-image.sh` before deployment when local changes should be rolled out.
- Deployment still does not auto-build or auto-push images.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && chmod +x scripts/build-and-push-image.sh && bash -n scripts/build-and-push-image.sh && bash -n scripts/deploy.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/sa-g7-live-smoke.sh && npm run build && rg -n "build-and-push-image|Source/image state|preflight_source_state|Docker build|Docker push|Working tree has uncommitted changes|localhost:5000" scripts/deploy.sh scripts/build-and-push-image.sh'
```

Result: pass.

Execution note:

- `scripts/build-and-push-image.sh` was not executed in this slice because it builds and pushes an image.
- `scripts/deploy.sh` was not executed in this slice.

Remaining validation:

- Owner-approved image build/push.
- Owner-approved deployment.
- Confirm pushed image digest changes before rollout when frontend changes are intended to deploy.

## Implementation Slice 2026-06-13: Image Source Fingerprint And Docker Context

Scope implemented:

- Added `.dockerignore` to keep local-only/heavy/sensitive files out of Docker build context:
  - `node_modules`
  - `dist`
  - `.git`
  - `.env*`
  - logs, coverage, reports, and OS metadata
- Updated `scripts/build-and-push-image.sh` to compute a source fingerprint over:
  - `public`
  - `src`
  - `prisma`
  - `scripts`
  - package files
  - Dockerfile
  - Nest/TypeScript config
- The source fingerprint is printed before build and applied as Docker label:
  - `cz.alfares.shop-assistant.source-fingerprint=<hash>`

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/build-and-push-image.sh && bash -n scripts/deploy.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/sa-g7-live-smoke.sh && fingerprint=$({ find public src prisma scripts -type f -not -path "*/node_modules/*" -print 2>/dev/null; find . -maxdepth 1 -type f \( -name "package*.json" -o -name "Dockerfile" -o -name "nest-cli.json" -o -name "tsconfig*.json" \) -print 2>/dev/null; } | sort | xargs sha256sum | sha256sum | cut -d " " -f 1) && test -n "$fingerprint" && echo "source fingerprint: $fingerprint" && npm run build && rg -n "Source fingerprint|source-fingerprint|sha256sum|node_modules|dist|\\.env" scripts/build-and-push-image.sh .dockerignore'
```

Result: pass.

Observed source fingerprint during validation:

- `3449948fc0fb64f187f3e980fc4ea519dc8ec904025f460aaf2b24b04b582335`

Execution note:

- Docker image build/push was not executed in this slice.
- Deployment was not executed in this slice.

Remaining validation:

- Owner-approved `scripts/build-and-push-image.sh`.
- Verify pushed image label contains the expected source fingerprint.
- Owner-approved deployment and post-deploy smoke.

## Implementation Slice 2026-06-13: Image Fingerprint Label Verification

Scope implemented:

- Updated `scripts/build-and-push-image.sh` to inspect the built local image after `docker build`.
- The build script now fails before push if the image label:
  - `cz.alfares.shop-assistant.source-fingerprint`
  does not match the computed source fingerprint.
- Updated `scripts/deploy.sh` to read the local image label before rollout.
- Deploy preflight now prints the registry image source fingerprint label when available.
- Deploy can optionally enforce a known source fingerprint:
  - `EXPECTED_SOURCE_FINGERPRINT=<hash> ./scripts/deploy.sh`
- If `EXPECTED_SOURCE_FINGERPRINT` is set and the local image label is missing or different, deploy exits before applying manifests/restarting rollout.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && bash -n scripts/build-and-push-image.sh && bash -n scripts/deploy.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/sa-g7-live-smoke.sh && npm run build && rg -n "Image label check|IMAGE_FINGERPRINT|EXPECTED_SOURCE_FINGERPRINT|Registry image source fingerprint label|source-fingerprint|docker image inspect" scripts/build-and-push-image.sh scripts/deploy.sh'
```

Result: pass.

Read-only observation:

- Current pre-existing local image had no labels when inspected before this change.
- The new build script will add and verify labels for the next owner-approved image build.

Execution note:

- Docker image build/push was not executed in this slice.
- Deployment was not executed in this slice.

Remaining validation:

- Owner-approved `scripts/build-and-push-image.sh`.
- Verify the newly built image label equals the printed source fingerprint.
- Owner-approved deploy with `EXPECTED_SOURCE_FINGERPRINT=<printed hash>` when rolling out the staged frontend changes.

## Implementation Slice 2026-06-13: SA-G7 Rollout Runbook

Scope implemented:

- Added `docs/intent-preservation/16_operations/SA-G7-FRONTEND-ROLLOUT-RUNBOOK.md`.
- The runbook documents:
  - source/build preflight;
  - owner-approved image build and push;
  - source fingerprint recording;
  - deploy with `EXPECTED_SOURCE_FINGERPRINT`;
  - post-deploy no-secret smoke;
  - customer/admin/non-admin token-backed smoke;
  - browser verification for landing, customer dashboard, and admin panel;
  - rollout failure diagnostics;
  - evidence to append to validation and state artifacts.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && test -f docs/intent-preservation/16_operations/SA-G7-FRONTEND-ROLLOUT-RUNBOOK.md && test -x scripts/build-and-push-image.sh && test -x scripts/deploy.sh && test -x scripts/post-deploy-check.sh && test -x scripts/sa-g7-live-smoke.sh && bash -n scripts/build-and-push-image.sh && bash -n scripts/deploy.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/sa-g7-live-smoke.sh && npm run build && rg -n "Source fingerprint|EXPECTED_SOURCE_FINGERPRINT|Token-Backed Smoke|Browser Verification|Failure Diagnostics|Evidence To Record" docs/intent-preservation/16_operations/SA-G7-FRONTEND-ROLLOUT-RUNBOOK.md'
```

Result: pass.

Execution note:

- Image build/push was not executed.
- Deployment was not executed.

Remaining validation:

- Execute runbook after explicit owner approval.
- Record the rollout evidence in this validation report, `TASKS.md`, and `STATE.json`.

## Implementation Slice 2026-06-13: Reusable Source Fingerprint Helper

Scope implemented:

- Added `scripts/print-source-fingerprint.sh`.
- Updated `scripts/build-and-push-image.sh` to reuse the helper instead of duplicating the source fingerprint pipeline.
- Updated `docs/intent-preservation/16_operations/SA-G7-FRONTEND-ROLLOUT-RUNBOOK.md` so operators can precompute the expected fingerprint before an owner-approved image build/deploy.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && chmod +x scripts/print-source-fingerprint.sh scripts/build-and-push-image.sh && bash -n scripts/print-source-fingerprint.sh && bash -n scripts/build-and-push-image.sh && bash -n scripts/deploy.sh && bash -n scripts/post-deploy-check.sh && bash -n scripts/sa-g7-live-smoke.sh && fingerprint="$(./scripts/print-source-fingerprint.sh)" && test -n "$fingerprint" && echo "source fingerprint: $fingerprint" && npm run build && rg -n "print-source-fingerprint|Source fingerprint|EXPECTED_SOURCE_FINGERPRINT" scripts/build-and-push-image.sh scripts/print-source-fingerprint.sh docs/intent-preservation/16_operations/SA-G7-FRONTEND-ROLLOUT-RUNBOOK.md'
```

Result: pass.

Observed source fingerprint:

```text
8f8760fb016ba36a6245d3f5f7fe941dbb7deae9626475b3fdb11ea50b42bfa3
```

Execution note:

- Docker image build/push was not executed in this slice.
- Deployment was not executed in this slice.

Remaining validation:

- Owner-approved image build/push using `scripts/build-and-push-image.sh`.
- Owner-approved deploy with `EXPECTED_SOURCE_FINGERPRINT=8f8760fb016ba36a6245d3f5f7fe941dbb7deae9626475b3fdb11ea50b42bfa3`.
- Post-deploy no-secret smoke, token-backed customer/admin/non-admin smoke, and browser verification.

## Implementation Slice 2026-06-13: Read-Only Rollout Preflight

Scope implemented:

- Added `scripts/sa-g7-rollout-preflight.sh`.
- Updated `docs/intent-preservation/16_operations/SA-G7-FRONTEND-ROLLOUT-RUNBOOK.md` to use the preflight script before owner-approved build/push/deploy.
- The preflight checks source state, script syntax, source fingerprint, application build, Kubernetes namespace/node/deployment/pod readiness, current running image digest, local registry reachability, registry tag state, and local image source-fingerprint label.
- The preflight does not run Docker build, Docker push, `kubectl apply`, or rollout restart.

Validation evidence:

```bash
ssh ssf@192.168.88.53 'cd /home/ssf/Documents/Github/shop-assistant && chmod +x scripts/sa-g7-rollout-preflight.sh && ./scripts/sa-g7-rollout-preflight.sh'
```

Result: pass.

Observed source fingerprint:

```text
51cce4faa044fd1c908098a2fb54014e68b92a30ce7953493cc02970d6628ee6
```

Observed runtime state:

- `npm run build` passed.
- Kubernetes node `alfares` was `Ready`.
- Deployment `shop-assistant` was `1/1` ready.
- Current pod: `shop-assistant-5b699c65f6-szhz2` running.
- Current running image digest: `localhost:5000/shop-assistant@sha256:94262d813da39183c607ef09814676f6cdab3a735bc955937c4b9f97716269a8`.
- Local registry returned `{"name":"shop-assistant","tags":["latest"]}`.
- Current local image has no `cz.alfares.shop-assistant.source-fingerprint` label, so a build/push is required before deploying this staged source.

Execution note:

- Docker image build/push was not executed.
- Deployment was not executed.

Remaining validation:

- Owner-approved image build/push using `scripts/build-and-push-image.sh`.
- Owner-approved deploy with `EXPECTED_SOURCE_FINGERPRINT=51cce4faa044fd1c908098a2fb54014e68b92a30ce7953493cc02970d6628ee6`.
- Post-deploy no-secret smoke, token-backed customer/admin/non-admin smoke, and browser verification.
