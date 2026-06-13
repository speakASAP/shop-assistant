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
