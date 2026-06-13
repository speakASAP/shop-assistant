# Tasks: shop-assistant

## Backlog

- [ ] SA-G7-T1 Commercial frontend, authenticated client dashboard, and role-protected admin control panel (priority: 1)
- [ ] Analyze top 20 failed searches and improve response quality (priority: 2)
- [ ] Generate UX improvement report based on session data (priority: 3)

## Completed
<!-- AI appends here. Never modifies previous entries. -->
- [x] 2026-04-05 Documentation standard applied

- [x] 2026-06-12 Intent Preservation System installed under docs/intent-preservation (SA-DOCS-T1)
- [x] 2026-06-12 SA-G1-T1 bounded failed-search recovery and real URL filtering implemented; validation recorded in docs/intent-preservation/validation-reports/VAL-SA-BACKLOG.md
- [x] 2026-06-12 SA-G4-T1 UX improvement report generated from aggregate session metrics and static workflow inspection; report: docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-12.md
- [x] 2026-06-12 SA-G4-T1 synthetic usage fixture generated and aggregate UX metrics rerun; report: docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-12-synthetic-rerun.md
- [x] 2026-06-12 SA-G4-T1 production aggregate metrics compared with synthetic baseline; production persisted UX funnel remains zero; report: docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-12-production-comparison.md
- [x] 2026-06-13 SA-G4-T1 production session write path verified with one namespaced synthetic health-check session; report: docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-13-write-path-check.md
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
- [x] 2026-06-13 SA-G3 saved criteria session traceability implemented with Prisma migration, runCriteria linkage, and current-user dashboard/session response fields; prisma generate/build passed; deploy/migration apply pending owner approval
- [x] 2026-06-13 SA-G3 saved criteria traceability deployed; Prisma migration status up to date, health passed, unauthenticated /api/me and /api/saved-criteria returned 401; customer-token run smoke pending
- [x] 2026-06-13 SA-G3 rebuilt/pushed Shop Assistant image and reran live customer-token saved-criteria traceability smoke; usedSavedCriteriaId and relation matched saved criteria id; token/password not printed
