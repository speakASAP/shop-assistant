# SA-G2-FIX-T2: Public Session Ownership Boundary Hardening

id: SA-G2-FIX-T2
status: draft
owner: shop-assistant-owner
created: 2026-06-14
last_updated: 2026-06-14
upstream: SA-G2-T1, VAL-SA-G2-LEGAL-PRIVACY-AUDIT, GOAL-SA-G2

## Objective

Harden public /api/sessions/* behavior so unauthenticated sessions remain anonymous and account-bound session access uses authenticated /api/me/* ownership checks.

## Scope

- Inspect public session create/query/feedback/choice/result/message/agent-communication routes.
- Ignore or reject userId/profileId on unauthenticated public session flows.
- Preserve anonymous public search compatibility.
- Require authenticated /api/me/* routes for account-bound session history and account profile/saved-criteria behavior.
- Add focused validation for anonymous compatibility, authenticated ownership, and unauthenticated admin/agent-flow denial.

## Parallel Execution

| Workstream | Status | Owner Role | Objective | Allowed Files | Validation Evidence |
| --- | --- | --- | --- | --- | --- |
| Contract discovery | ready now | Backend contract agent | Map public vs authenticated session contracts and identify exact DTO/service call changes. | src/sessions, src/me, src/profiles, public/test.html, docs validation report | Contract matrix and no-source-change handoff. |
| Implementation | dependency-gated | Backend implementation agent | Apply minimal public ownership hardening after contract discovery. | src/sessions, focused tests/scripts, validation report | npm run build, focused HTTP/service smoke. |
| Integration validation | final integration | Orchestrator | Update IPS state and choose next task. | VAL-SA-G2-LEGAL-PRIVACY-AUDIT.md, TASKS.md, STATE.json | Build/smoke evidence and residual risk notes. |

## Non-Goals

- Do not change legal pages or token documentation.
- Do not deploy without explicit owner approval.
- Do not expose raw production queries, lead content, token files, or .env values.
