# VAL-SA-G2-LEGAL-PRIVACY-AUDIT: Legal, Privacy, And Secret-Surface Audit

id: VAL-SA-G2-LEGAL-PRIVACY-AUDIT
status: draft
owner: shop-assistant-owner
created: 2026-06-13
last_updated: 2026-06-13
upstream: SA-G2-T1, EP-SA-G2-LEGAL-PRIVACY-AUDIT, CP-SA-G2-LEGAL-PRIVACY-AUDIT, PROMPT-SA-G2-LEGAL-PRIVACY-AUDIT
downstream: TASKS.md, STATE.json

## Gate Evidence

Gate: Shop Assistant pre-coding gate
Date: 2026-06-13
Goal: SA-G2 Legal and privacy compliance
Task: SA-G2-T1
Repository root: /home/ssf/Documents/Github/shop-assistant
Git status: dirty before this planning change; existing modified/untracked files were present and must not be reverted by this task
Execution plan: docs/intent-preservation/execution-plans/EP-SA-G2-LEGAL-PRIVACY-AUDIT.md
Context package: docs/intent-preservation/context-packages/CP-SA-G2-LEGAL-PRIVACY-AUDIT.md
Coding prompt: docs/intent-preservation/coding-prompts/PROMPT-SA-G2-LEGAL-PRIVACY-AUDIT.md
Invariants checked: legal route reachability, cookie consent, EU AI Act transparency, environment-only secrets, raw-data minimization, admin JWT/RBAC, owner-approved deployment
Sensitive-data classification: sanitized audit metadata only; no secrets, tokens, raw production queries, voice transcripts, lead contacts, or raw database rows
Contract/schema impact: audit-only; no API, Prisma, Kubernetes, legal-substance, or auth contract change
Privacy/legal impact: direct compliance audit; no raw personal data export allowed
Replay/determinism impact: repeatable file scans and route checks; record commands and skipped reasons
External service boundary impact: Auth, AI/search, database, logging, and leads ownership unchanged
Validation commands: sensitive-data scan; legal route checks; optional browser/static checks; no build required unless source is edited
Result: pass-for-read-only-audit; source coding remains blocked until a follow-up fix task is selected and gated

## Parallel Workstream Handoffs

### Documentation and IPS audit

Worker thread: 019ec2dd-0eb7-7a80-a707-ded72f4bdd98.

Scope inspected: AGENTS.md, BUSINESS.md, SYSTEM.md, README.md, TASKS.md, STATE.json, IPS README, TRACEABILITY_MATRIX, PRE_CODING_GATE, SA-G2 task packet, validation reports, UX reports, audit report, sensitive-data policy, and rollout runbook.

Evidence method: remote-only find/sed/nl/rg/git status scans over documentation and validation surfaces. No .env or token-file contents were read.

Handoff summary: IPS privacy/legal gates are present and correctly block coding without sensitive-data, privacy/legal, RBAC, service-boundary, and deployment-approval evidence. No confirmed raw secret values, production query excerpts, voice transcripts, lead contact excerpts, or raw database rows were found in inspected docs.

### Public/legal surface audit

Worker thread: 019ec2dd-1270-7f33-aeb9-c00bbca040bc.

Scope inspected: public index, dashboard, admin, test, login, register, privacy, cookies, terms pages; public debug/admin-token helper pages noted; production status-only route checks.

Evidence method: remote-only sed/find/rg and curl HEAD/status checks. No tokens, secrets, or raw production data were requested or printed.

Route status summary: /privacy.html, /cookies.html, and /terms.html returned 200; extensionless /privacy, /cookies, and /terms returned 404; /api/admin/overview, /api/admin/operations/sessions, and /api/admin/operations/leads returned 401 unauthenticated.

### Protected/admin/test surface audit

Worker thread: 019ec2dd-1782-7352-91b5-47d4ccfde693.

Scope inspected: public admin/dashboard/test pages, auth/admin/sessions/leads/me/profile source boundaries, sa-g7 scripts, k8s references, gitignore/dockerignore.

Evidence method: remote-only sed/nl/rg/git status/git ls-files, token-file existence checks with ls -l only, status-only curl probes, and scripts/sa-g7-source-audit.sh. Token files and .env contents were not read.

Handoff summary: frontend token model generally aligns with sessionStorage and legacy localStorage cleanup; admin overview/settings/model/prompt surfaces are JWT + admin-role guarded by static inspection and unauthenticated 401 probes; scripts/sa-g7-source-audit.sh passed 111 checks.

## Findings

### High

1. README admin/debug documentation is stale and unsafe. README.md still describes storing an admin JWT in the page and passing token in a URL, while later SA-G7 hardening removed manual JWT fallback and rejects token URLs.

2. VAL-SA-G7-FRONTEND.md preserves a replay command that reads token files into shell variables and expands bearer tokens into curl command arguments. This conflicts with token-file minimization even if values were not printed in the original run.

3. Public legal pages contain unresolved template placeholders for company/controller/contact/jurisdiction fields and are production-reachable at .html routes.

4. Public /api/sessions/* endpoints remain unauthenticated and session-id based. They expose results/messages and allow query/feedback/choice mutation by session id. Public DTOs accept userId/profileId, while dashboard.html uses safer /api/me ownership-scoped routes. This is the main account-data boundary risk if an account-bound session id leaks or if public callers attach arbitrary user/profile identifiers.

### Medium

1. SA-G7 rollout runbook still shows raw CUSTOMER_TOKEN, ADMIN_TOKEN, and NON_ADMIN_TOKEN environment variable usage before recommending token files. It should lead with token-file-only examples.

2. AI transparency is visible on index.html and terms.html, but direct interactive public routes such as test.html do not show an EU AI Act transparency notice before interaction.

3. Cookie consent exists on index.html, but legal/auth/dashboard/test pages do not expose the banner or an obvious preference-change control even though cookie policy text says preferences can be changed through the banner.

4. Admin operations detail responses intentionally expose broad session, agent communication, lead message, and contact metadata to authorized admins. This may be operationally intended, but it needs explicit minimization/classification and possibly redaction-by-default.

### Low

1. Root-level TRACEABILITY_MATRIX.md and PRE_CODING_GATE.md are missing, while canonical active equivalents exist under docs/intent-preservation/.

2. README-linked docs/API.md, docs/DEPLOYMENT.md, docs/DEVELOPMENT.md, docs/IMPLEMENTATION_PLAN.md, docs/INTEGRATION.md, docs/MODEL_AND_ROLE_MANAGEMENT.md, and docs/AI_VERIFICATION_PROMPT.md remain missing as already documented by the IPS.

3. Extensionless legal routes /privacy, /cookies, and /terms return 404. Add aliases only if product/SEO expects them.

4. Public diagnostic surfaces /test.html, /debug.html, and /getting-admin-token.html remain reachable. Current source does not expose raw diagnostics without admin Auth, but ownership should decide whether these routes remain public.

## Follow-Up Classification

Ready now:

- SA-G2-FIX-T1: Documentation and legal/privacy surface hardening. Scope: remove stale token URL/JWT storage docs, replace unsafe token replay command examples with token-file-safe script invocation, make rollout runbook token-file-first, resolve approved legal placeholders, add AI transparency to direct interactive pages, and add/align cookie preference controls.

- SA-G2-FIX-T2: Public session ownership boundary hardening. Scope: ignore or reject userId/profileId on unauthenticated public session endpoints, keep anonymous sessions anonymous, and require /api/me/* for account-bound sessions.

Dependency-gated:

- Admin operations data minimization and redaction-by-default. Requires owner decision on operational need for full raw session/lead detail.

- Authenticated strict browser/API smoke with real safe token files. Requires explicit permission for a worker to read token files or run scripts that read them.

- Extensionless legal route aliases. Requires product/SEO decision.

Blocked:

- Legal substance changes beyond approved company/contact placeholders require owner/legal approval.

No action:

- Admin overview/settings/model/prompt protected surfaces returned expected unauthenticated 401 and are statically JWT/RBAC guarded.


## SA-G2-FIX-T1 Implementation Evidence

Date: 2026-06-14
Scope: documentation and legal/privacy surface hardening only.

Changed files:

- README.md
- docs/intent-preservation/16_operations/SA-G7-FRONTEND-ROLLOUT-RUNBOOK.md
- docs/intent-preservation/validation-reports/VAL-SA-G7-FRONTEND.md
- public/privacy.html
- public/cookies.html
- public/terms.html
- public/test.html

Implemented:

- Replaced stale README admin guidance that described storing JWTs in the page or passing token query parameters.
- Made SA-G7 rollout browser-auth examples token-file-first and removed raw token example variables from the documented browser verifier command.
- Replaced the unsafe agent-flow validation replay command with the token-file-safe strict smoke script invocation.
- Replaced legal placeholders with approved Alfares repository company/contact values.
- Added cookie preference reset controls to legal pages.
- Added direct AI transparency notice to public test.html before first interaction.

Validation:

- npm run build: pass.
- node --check scripts/sa-g7-browser-verify.js: pass.
- node --check scripts/sa-g7-chrome-browser-verify.js: pass.
- Focused rg scan found no unresolved legal placeholders, no stale Store JWT wording, no raw CUSTOMER_TOKEN/ADMIN_TOKEN/NON_ADMIN_TOKEN browser examples, no documented Authorization Bearer token-variable replay command, and no Alfares s.r.o double-period typo in scoped files.

Remaining follow-up:

- SA-G2-FIX-T2 public session ownership boundary hardening remains open and separate.
- Admin operations data minimization remains dependency-gated on owner decision.
- Extensionless legal route aliases remain dependency-gated on product/SEO decision.


## SA-G2-FIX-T2 Implementation Evidence

Date: 2026-06-14
Scope: public session ownership boundary hardening.

Changed files:

- src/sessions/sessions.controller.ts
- src/sessions/sessions.service.ts
- public/test.html
- docs/intent-preservation/tasks/SA-G2-FIX-T2.md
- TASKS.md
- STATE.json

Implemented:

- Public POST /api/sessions now creates anonymous sessions only and ignores supplied userId/profileId.
- Public query, feedback, results, choice, redirect, and client-message routes now use public-session wrappers.
- Public-session wrappers reject account-bound sessions with ForbiddenException when userId, profileId, or usedSavedCriteriaId is present.
- test.html now uses /api/me/sessions routes when a session token is present and only sends profileId on authenticated account-scoped routes; anonymous public sessions no longer receive profileId.
- Existing /api/me/* ownership checks remain the account-bound session path.

Validation:

- npm run build: pass after backend/public changes.
- Focused scan confirmed public controller no longer calls createSession(dto.userId), submitQuery(... dto.profileId), submitFeedback(... dto.profileId), getResults(id), getChoiceRedirect(id), or getClientMessages(id) directly.
- Focused scan confirmed test.html only assigns body.profileId behind token checks and switches authenticated create/query/feedback calls to /api/me/sessions.
- STATE.json parses with python3 -m json.tool.

Deployment:

- Not deployed. Production deployment still requires explicit deploy approval and rollout validation.

Remaining dependency-gated work:

- Admin operations data minimization/redaction requires owner decision on operational need for full detail.
- Authenticated strict token-file smoke requires explicit permission to read/use token files in the active session.
- Extensionless legal route aliases require product/SEO decision.
