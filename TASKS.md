# Tasks: shop-assistant

## Next Selected Task

- [x] SA-G2-FIX-T2 Public session ownership boundary hardening completed (2026-06-14)
- [x] SA-G2-FIX-T1 Documentation and legal/privacy surface hardening completed (2026-06-14)
- [x] SA-G2-T1 Legal, privacy, and secret-surface audit integrated (2026-06-14)

## Backlog

- [x] SA-G7-T1 Commercial frontend, authenticated client dashboard, and role-protected admin control panel (priority: 1) - closed 2026-06-21 after deployed strict token-file smoke, source audit evidence, and SA-G7 completion history
- [x] Analyze top 20 failed searches and improve response quality (priority: 2) - closed 2026-06-21 with hashed top-failed-search refresh and constrained no-results validation
- [x] Generate UX improvement report based on session data (priority: 3) - closed 2026-06-21 with current aggregate production UX report

## Completed
<!-- AI appends here. Never modifies previous entries. -->
- [x] 2026-07-03 SA-G8-B2 billing/entitlement contract and safe core implemented with Prisma checkout/entitlement models, runtime-gated payments client, callback idempotency, dashboard billing panel, build/Prisma/diff/no-secret validation passed; live payment creation remains gated by runtime keys, callback token, public URL allowlist, and owner-approved checkout smoke.
- [x] 2026-04-05 Documentation standard applied

- [x] 2026-06-12 Intent Preservation System installed under docs/intent-preservation (SA-DOCS-T1)
- [x] 2026-06-12 SA-G1-T1 bounded failed-search recovery and real URL filtering implemented; validation recorded in docs/12_validation/VAL-SA-BACKLOG.md
- [x] 2026-06-12 SA-G4-T1 UX improvement report generated from aggregate session metrics and static workflow inspection; report: docs/16_operations/UX-SA-G4-T1-2026-06-12.md
- [x] 2026-06-12 SA-G4-T1 synthetic usage fixture generated and aggregate UX metrics rerun; report: docs/16_operations/UX-SA-G4-T1-2026-06-12-synthetic-rerun.md
- [x] 2026-06-12 SA-G4-T1 production aggregate metrics compared with synthetic baseline; production persisted UX funnel remains zero; report: docs/16_operations/UX-SA-G4-T1-2026-06-12-production-comparison.md
- [x] 2026-06-13 SA-G4-T1 production session write path verified with one namespaced synthetic health-check session; report: docs/16_operations/UX-SA-G4-T1-2026-06-13-write-path-check.md
- [x] 2026-06-13 SA-G7-T1 frontend goal saved with task, execution plan, context package, coding prompt, and validation draft; implementation pending scoped coding gate
- [x] 2026-06-13 SA-G7 backend foundation implemented for authenticated current-user dashboard APIs and profile ownership checks; build passed; frontend/dashboard/admin UI work remains open
- [x] 2026-06-13 SA-G7 customer dashboard static frontend added and linked from landing page; build and static desktop/mobile visual QA passed for unauthenticated gate; live authenticated QA remains pending
- [x] 2026-06-13 SA-G7 admin overview and persisted safe settings implemented; Prisma generate/build passed; migration applied inside running pod; temporary DB-connected runtime verified unauthenticated protection and static assets; live authenticated user/admin-token checks pending
- [x] 2026-06-13 SA-G7 commercial landing page upgraded with product preview, dashboard/admin positioning, request flow, lead capture, AI transparency, legal links, and desktop/mobile Playwright visual QA; live deployed search/lead checks pending
- [x] 2026-06-13 SA-G7 admin panel upgraded from pasted-token-first flow to Auth-hosted login gate with backend admin-role validation before showing admin UI; build and mocked Playwright auth-state QA passed; live real-token checks pending
- [x] 2026-06-13 SA-G7 admin operations drill-down implemented for sessions, messages, search runs, selected products, agent communications, and lead requests; build and mocked Playwright operations QA passed; live admin-token checks pending
- [x] 2026-06-13 SA-G7 customer dashboard inline editing added for account profiles and saved searches; create/update/delete mocked Playwright QA passed; live customer-account checks pending
- [x] 2026-06-13 SA-G7 customer dashboard session detail view added for messages, search runs, latest results, and selected products via account-scoped /api/me/sessions/:id; build and mocked Playwright QA passed; live customer-account checks pending

- [x] 2026-06-13 SA-G7 live landing anonymous search passed on deployed production with 10 HTTP result URLs; live lead capture exposed missing LEADS_SERVICE_URL/downstream port mismatch, fix prepared and build passed; production retest pending owner-approved deploy
- [x] 2026-06-13 SA-G7 lead downstream URL fix deployed; post-deploy live landing lead capture returned 201 with requestId and downstream leadId
- [x] 2026-06-13 SA-G1 failed-search follow-up analyzed production zero-result runs using hashed fingerprints only and added deterministic no-results refinement guidance; build passed; deployment pending owner approval
- [x] 2026-06-13 SA-G7 admin-editable public landing settings implemented with protected admin save path, public read-only landing settings endpoint, runtime landing application, build pass, and mocked Playwright UI QA; deployment/live admin-token smoke pending
- [x] 2026-06-13 SA-G7 admin session operations editing implemented for priority order and profile assignment with owner validation; build and mocked Playwright save/readback QA passed; deployment/live admin-token smoke pending
- [x] 2026-06-13 SA-G7 customer dashboard product selection implemented through account-scoped /api/me choice endpoint; build and mocked Playwright select/readback QA passed; deployment/live customer-token smoke pending
- [x] 2026-06-13 SA-G7 customer dashboard request refinement implemented through authenticated /api/me feedback endpoint; build and mocked Playwright refine/readback QA passed; deployment/live customer-token smoke pending
- [x] 2026-06-13 SA-G7 customer dashboard priority controls implemented for new requests and saved searches; build and mocked Playwright payload/edit QA passed; deployment/live customer-token smoke pending
- [x] 2026-06-13 SA-G7 admin operations filters implemented for sessions/leads; build and mocked Playwright q-param/render QA passed; deployment/live admin-token smoke pending
- [x] 2026-06-13 SA-G7 admin lead triage implemented with migration-backed status/assignee/notes, guarded update endpoint, in-app browser desktop/mobile QA, and mobile Operations overflow fix; deployment/migration/live admin-token smoke pending
- [x] 2026-06-13 SA-G7 customer history filters implemented for account-scoped q/profile/status search; build and in-app browser desktop/mobile QA passed; deployment/live customer-token smoke pending
- [x] 2026-06-13 SA-G7 customer history pagination implemented with Load more history, page-aware /api/me/sessions calls, desktop/mobile in-app browser QA, and build pass; deployment/live customer-token smoke pending
- [x] 2026-06-13 SA-G7 customer selected-products pagination implemented with account-scoped /api/me/choices, Load more selected UI, request detail links, desktop/mobile in-app browser QA, and build pass; deployment/live customer-token smoke pending
- [x] 2026-06-13 SA-G7 customer saved-search pagination implemented with page-aware /api/saved-criteria, Load more saved UI, desktop/mobile in-app browser QA, and build pass; deployment/live customer-token smoke pending
- [x] 2026-06-13 SA-G7 admin operational health overview implemented with protected health metrics, desktop/mobile in-app browser QA, and build pass; deployment/live admin-token smoke pending
- [x] 2026-06-13 SA-G7 admin account data tab implemented with admin-scoped profile/saved-search list and edit operations, desktop/mobile in-app browser QA, and build pass; deployment/live admin-token smoke pending
- [x] 2026-06-13 SA-G7 token URL hardening implemented for landing/admin/test pages; token query forwarding removed, admin token URLs stripped/rejected, Auth fragment cleanup browser QA passed
- [x] 2026-06-13 SA-G7 Auth callback state hardening implemented for dashboard/admin; missing or mismatched state fragments are rejected, URL fragments are cleaned, and browser QA passed
- [x] 2026-06-13 SA-G7 session-scoped token storage implemented for landing/dashboard/admin/test pages; persistent access/refresh token writes removed, legacy persistent tokens migrated/cleared, browser QA passed
- [x] 2026-06-13 SA-G7 persistent user identity storage removed from dashboard; user is rendered from /api/me only, persistent user read/write scan and browser QA passed
- [x] 2026-06-13 SA-G7 admin auth-failure lockdown implemented; protected admin fetches now lock the admin shell on 401/403, build passed, and in-app browser QA covered expired-auth and missing-role responses
- [x] 2026-06-13 SA-G7 customer dashboard authorization-failure lockdown implemented; 401/403 API responses now hide the dashboard shell, clear local auth, and browser QA covered signed-in-but-forbidden access
- [x] 2026-06-13 SA-G7 customer/admin token isolation tightened; landing and diagnostic customer flows no longer read the admin token key, manual admin JWT paste stays admin-scoped, build and browser QA passed
- [x] 2026-06-13 SA-G7 landing stale-token fallback implemented; public search clears stale customer auth on 401/403 and retries anonymously, build and browser QA passed
- [x] 2026-06-13 SA-G7 admin agent-flow deep link gated behind admin authorization; unauthenticated flow links no longer fetch data, authorized Auth callback loads flow with bearer token, build and browser QA passed
- [x] 2026-06-13 SA-G7 backend agent-communications route protected with JwtAuthGuard/RolesGuard admin roles; focused Nest smoke proved 401 missing token, 403 non-admin, 200 admin
- [x] 2026-06-13 SA-G7 legacy debug page converted to Admin Flow handoff; public debug page no longer fetches session/agent data, Admin copy updated, build and browser QA passed
- [x] 2026-06-13 SA-G7 login/register pages converted to centralized Auth handoff; local credential forms and legacy token writes removed, Auth URLs include client/state/return parameters, and build passed
- [x] 2026-06-13 SA-G7 advanced test interface copy and customer auth failure handling tightened; agent diagnostics point to Admin Flow, stale/forbidden account tokens hide profile/saved-search controls, build and browser QA passed
- [x] 2026-06-13 SA-G7 legacy admin-token guide converted to Auth admin access guide; raw access/refresh token extraction instructions removed, required roles documented, and build passed
- [x] 2026-06-13 SA-G7 admin manual JWT fallback removed; Admin now uses Auth-hosted sign-in only, token URL rejection remains, old admin-token session key is cleared, and browser QA passed
- [x] 2026-06-13 SA-G7 live frontend/auth smoke script added; public route and unauthenticated checks run without secrets, optional customer/admin/non-admin token checks are supported, build passed, and current production mismatch is documented pending deploy
- [x] 2026-06-13 SA-G7 post-deploy check integrated with live frontend/auth smoke script; optional Auth token variables documented, script syntax checks passed, and build passed
- [x] 2026-06-13 SA-G7 deploy script integrated with post-deploy frontend/auth gate; rollout success now requires post-deploy smoke pass, script syntax checks passed, and build passed
- [x] 2026-06-13 SA-G7 local auth proxy surface disabled; AuthModule no longer registers login/register proxy controller, legacy proxy implementation neutralized, smoke now expects /api/auth/login and /api/auth/register to return 404, and build passed
- [x] 2026-06-13 SA-G7 deploy post-deploy checks now use deploy_timing_run_phase; failed smoke closes the timed phase and deployment still reports failure cleanly, script syntax checks passed, and build passed
- [x] 2026-06-13 SA-G7 live smoke HTML copy checks hardened with no-cache headers and per-run cache busting; build passed and no-secret production run still documents expected predeploy frontend/auth gaps
- [x] 2026-06-13 SA-G7 post-deploy check now includes Kubernetes pod/deployment/log diagnostics before frontend/auth smoke; script syntax checks passed and build passed
- [x] 2026-06-13 SA-G7 admin settings audit metadata added; protected settings response now reports source/updatedBy/updatedAt/appliesTo for safe editable settings and Admin UI renders it; build passed
- [x] 2026-06-13 SA-G7 live smoke now validates admin settings audit metadata when ADMIN_TOKEN is provided and bounds curl request timeouts; script syntax checks passed and build passed
- [x] 2026-06-13 SA-G7 live smoke now validates customer dashboard/account response contracts when CUSTOMER_TOKEN is provided; script syntax checks passed, build passed, and no-secret run skipped optional checks cleanly
- [x] 2026-06-13 SA-G7 live smoke now covers admin operations/prompts/models RBAC: ADMIN_TOKEN validates admin list/model contracts and NON_ADMIN_TOKEN expects 403 across protected admin surfaces; script syntax checks passed and build passed
- [x] 2026-06-13 SA-G7 live smoke now validates public landing settings contract for editable commercial copy; production no-secret run passed this endpoint while preserving expected predeploy static/API failures
- [x] 2026-06-13 SA-G7 deploy script now prints Kubernetes rollout failure diagnostics on ERR, including deployment, ReplicaSets, pods, pod descriptions/logs, and recent events; script syntax checks passed and build passed
- [x] 2026-06-13 SA-G7 live smoke now validates Auth handoff invariants for login/register/dashboard/admin pages: Auth host, client_id, return_url/state handling, session token storage, and no persistent access-token writes; build passed and production run documents expected predeploy static gaps
- [x] 2026-06-13 SA-G7 deploy preflight now verifies localhost registry reachability, shop-assistant:latest tag availability, and current running image digest before rollout; read-only cluster/registry diagnostics passed
- [x] 2026-06-13 SA-G7 explicit image packaging step added with scripts/build-and-push-image.sh, and deploy now prints source dirty-state reminder before rollout; script syntax checks passed and build passed
- [x] 2026-06-13 SA-G7 image packaging now uses .dockerignore and labels Docker images with a source fingerprint over frontend/API/deploy inputs; fingerprint calculation, script syntax checks, and build passed
- [x] 2026-06-13 SA-G7 image packaging now verifies source-fingerprint label after Docker build and deploy preflight can enforce EXPECTED_SOURCE_FINGERPRINT before rollout; script syntax checks and build passed
- [x] 2026-06-13 SA-G7 rollout runbook added under docs/16_operations with image build/push, fingerprint-enforced deploy, no-secret smoke, token-backed smoke, browser verification, diagnostics, and evidence checklist; references/build validated
- [x] 2026-06-13 SA-G7 source fingerprint helper added and image packaging now reuses scripts/print-source-fingerprint.sh; runbook updated; script syntax checks, fingerprint calculation, and build passed
- [x] 2026-06-13 SA-G7 read-only rollout preflight script added; preflight passed build, script syntax, fingerprint, Kubernetes readiness, registry reachability, and confirmed current image label is missing before owner-approved build/push
- [x] 2026-06-13 SA-G3 saved criteria session traceability implemented with Prisma migration, runCriteria linkage, and current-user dashboard/session response fields; prisma generate/build passed; deploy/migration apply pending owner approval
- [x] 2026-06-13 SA-G3 saved criteria traceability deployed; Prisma migration status up to date, health passed, unauthenticated /api/me and /api/saved-criteria returned 401; customer-token run smoke pending
- [x] 2026-06-13 SA-G3 rebuilt/pushed Shop Assistant image and reran live customer-token saved-criteria traceability smoke; usedSavedCriteriaId and relation matched saved criteria id; token/password not printed

- [x] 2026-06-13 SA-G5 lead forwarding resilience implemented with migration-backed integration statuses, durable local capture on downstream forwarding failure, protected operations status fields, prisma generate/build/prisma validate passed; deployment pending owner approval

- [x] 2026-06-13 SA-G5 deployment attempted after approval; image build/push succeeded after disabling Nest asset watchers, but Kubernetes rollout timed out with new pod stuck ContainerCreating/Pulling before app start; rollout undo restored previous ready pod and production remained HTTP 200

- [x] 2026-06-13 SA-G5 deployment retry succeeded; running pod uses image digest sha256:a71aa4ec6c15dbf378461b161bf57474eef5f44f0442704edc523d2fcd934011, Prisma reports 11 migrations up to date, live lead smoke saved request a2c3726c-235f-48a1-a8d4-35066e4d184d with leadForwardingStatus=sent and aiAnalysisStatus=failed as non-blocking

- [x] 2026-06-13 SA-G7 deployment smoke cleaned: frontend/auth static checks, unauthenticated protection checks, disabled local auth endpoints, and post-deploy SA-G7 smoke all passed with Failures=0; optional token checks skipped
- [x] 2026-06-13 SA-G7 source audit added and wired into rollout preflight; 85 source checks passed for landing, Auth handoff, customer dashboard, admin RBAC, editable settings, token hardening, and rollout tooling; combined preflight passed but current source fingerprint differs from built image label
- [x] 2026-06-13 SA-G7 strict token-smoke gate added; REQUIRE_TOKEN_SMOKE=1 now fails when CUSTOMER_TOKEN, ADMIN_TOKEN, or NON_ADMIN_TOKEN is missing, while normal no-secret smoke still passes with optional token checks skipped
- [x] 2026-06-13 SA-G7 browser verification harness added for public locked states, Auth-hosted redirects, customer dashboard unlock, admin unlock, and non-admin denial; node syntax and source audit passed, remote execution is pending Playwright availability and safe tokens
- [x] 2026-06-13 SA-G7 public browser verification executed from local bundled Playwright runtime; landing copy, locked customer dashboard, locked admin panel, and Auth-hosted login/register redirects passed; authenticated browser checks skipped pending safe tokens
- [x] 2026-06-13 SA-G7 token-file support added for strict live smoke and browser verifier; CUSTOMER_TOKEN_FILE, ADMIN_TOKEN_FILE, and NON_ADMIN_TOKEN_FILE avoid raw token shell history exposure; source audit passed 96 checks and strict missing-token-file paths fail safely
- [x] 2026-06-13 SA-G7 Vault token helper hardened to write 0600 token files and an env file containing only CUSTOMER_TOKEN_FILE, ADMIN_TOKEN_FILE, and NON_ADMIN_TOKEN_FILE references; source audit passed 103 checks without creating or rotating credentials
- [x] 2026-06-13 SA-G4 query persistence validation harness added; read-only pod run against documented smoke session proved messages/search run/results/agent communications persisted with sanitized output only; build passed
- [x] 2026-06-13 Next non-blocked implementation goal selected: SA-G1-T1 Search Quality From Failed Searches; SA-G7 token-backed customer/admin/non-admin live checks remain skipped until safe tokens are supplied.
- [x] 2026-06-13 SA-G1 failed-search follow-up improved feedback zero-result handling; refined searches with no usable merchant results now persist concrete refinement guidance instead of generic empty-result presentation; build passed; no deploy run.
- [x] 2026-06-13 SA-G1 failed-search follow-up suppressed empty table messages for zero-result initial and feedback searches; successful result tables remain unchanged; build passed; no deploy run.
- [x] 2026-06-13 SA-G1 public test empty-state guidance implemented for initial query, refine form, chat refine, and existing zero-result session runs; inline script syntax/build/sensitive-data scan passed; no deploy run.
- [x] 2026-06-13 SA-G7 Vault-backed customer/admin/non-admin smoke credentials created; strict token smoke generated .env.sa-g7-smoke from Vault and passed with Failures: 0; only AGENT_FLOW_SESSION_ID checks skipped.
- [x] 2026-06-13 SA-G7 token helper dry-run mode added; SA_G7_TOKEN_HELPER_DRY_RUN=1 validates token-file env generation and 0700/0600 permissions with synthetic placeholder tokens only, without contacting Vault/Auth.
- [x] 2026-06-13 SA-G7 remote Chrome authenticated browser verification passed; system Chrome/CDP verifier kept token files on alfares and verified landing, locked states, Auth redirects, customer dashboard unlock, admin unlock, and non-admin denial with Failures: 0 and Skipped authenticated browser checks: 0.
- [x] 2026-06-13 SA-G7 optional agent-flow RBAC smoke passed in-cluster after public Cloudflare edge returned 521 during broad smoke; synthetic session id `smoke` returned 401 unauthenticated, 404 admin-allowed, and 403 non-admin denied through the Kubernetes service.
- [x] 2026-06-13 SA-G7 agent-flow strict token smoke implemented with auto-created smoke session; admin agent-communications returned 200, non-admin returned 403, Failures: 0, Skipped optional checks: 0.
- [x] 2026-06-13 SA-G1 failed-search live validation harness added; sanitized public and in-pod validators prove live zero-result guidance is present without raw query text, but production table-message suppression remains blocked until owner-approved deploy of current source.
- [x] 2026-06-13 SA-G1 failed-search live validation deployed after approval; rebuilt/pushed image sha256:87c45f1a73e2316856721999e95e357ec2131aae1c5696f70601194b172eedb9, rollout/post-deploy smoke passed, constrained zero-result live probe and in-pod validator passed with guidance present, tableMessages=0, and no invalid URLs.

- [x] 2026-06-14 SA-G2-T1 parallel audit completed and integrated into docs/12_validation/VAL-SA-G2-LEGAL-PRIVACY-AUDIT.md; next fix task SA-G2-FIX-T1 selected.

- [x] 2026-06-14 SA-G2-FIX-T1 documentation and legal/privacy surface hardening completed; build and focused scans passed; next fix task SA-G2-FIX-T2 selected.

- [x] 2026-06-14 SA-G2-FIX-T2 public session ownership boundary hardening completed; public sessions are anonymous-only, account-bound sessions require /api/me ownership routes, and build/focused scans passed; no deploy run.

- [x] 2026-06-15 SA-G2-FIX-T3 admin operations redaction by default implemented; protected detail responses redact sensitive content unless authorized admins explicitly request includeSensitive=true; build and focused scans passed; no deploy run.

- [x] 2026-06-21 SA-G2-FIX-T4 extensionless legal route aliases implemented; /privacy, /cookies, and /terms use the existing runtime legal page controller, source audit/live smoke coverage added, pre-deploy validation passed, owner-approved deployment completed, strict token-file smoke passed, and live legal aliases returned 200.

- [x] 2026-06-21 SA-G7-T1 umbrella backlog closed; deployed strict token-file smoke and source audit evidence cover commercial landing, authenticated dashboard, and role-protected admin surfaces.
- [x] 2026-06-21 SA-G1 failed-search quality refresh completed; added reusable hashed top-20 failed-search script, generated sanitized production evidence, and constrained no-results live validation passed.
- [x] 2026-06-21 SA-G4 current UX improvement report generated from aggregate production session metrics and static workflow inspection; no raw personal data exported.

- [x] 2026-07-03 SA-G8-P1 privacy retention and rate-limit core implemented on worker branch; build, Prisma validate/generate, diff check, rate-limit smoke, and sensitive-data scan passed; scheduled retention jobs remain blocked by missing runner contract; no deploy run.
- [x] 2026-07-03 SA-G8-P2 retention runner contract implemented with dry-run default, anonymous-session-only TTL cleanup, explicit apply confirmation, build/Prisma/help/synthetic retention validation, diff check, and sensitive-data scan passed; production apply/deploy not run; scheduling/deploy wiring remains blocked.
