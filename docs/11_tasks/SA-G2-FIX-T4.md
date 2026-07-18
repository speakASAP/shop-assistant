# SA-G2-FIX-T4: Extensionless Legal Route Aliases

id: SA-G2-FIX-T4
status: complete
owner: shop-assistant-owner
created: 2026-06-21
last_updated: 2026-06-21
upstream: SA-G2-T1, SA-G2-FIX-T1, VAL-SA-G2-LEGAL-PRIVACY-AUDIT, GOAL-SA-G2

## Objective

Make public legal pages reachable through both canonical .html URLs and extensionless aliases for user-friendly links and SEO compatibility.

## Scope

- Serve /privacy, /cookies, and /terms through the existing LegalController runtime substitution path.
- Preserve the existing /privacy.html, /cookies.html, and /terms.html routes.
- Exclude the extensionless legal routes from the global API prefix.
- Extend live smoke/source audit coverage for the alias routes.
- Do not change legal text, cookie behavior, Auth/RBAC, Prisma schema, or deployment scripts.

## Intent Preservation

Vision: Shop Assistant provides transparent, legally reachable public AI shopping flows.
Goal Impact: SA-G2 legal/privacy hardening closes the route reachability audit finding.
System: Shop Assistant NestJS API and static public legal pages.
Feature: public legal/privacy surface.
Task: SA-G2-FIX-T4 extensionless legal route aliases.
Execution Plan: add aliases in LegalController, add API-prefix exclusions, extend smoke/source audit checks, validate build and live route status after deployment.
Coding Prompt: implement only route aliases and evidence updates; do not alter legal substance or secret/token handling.
Code: src/legal/legal.controller.ts, src/main.ts, scripts/sa-g7-live-smoke.sh, scripts/sa-g7-source-audit.sh.
Validation: npm run build, git diff --check, source audit, live smoke, post-deploy legal route status.

## Validation

- npm run build
- git diff --check
- bash -n scripts/sa-g7-live-smoke.sh scripts/sa-g7-source-audit.sh
- ./scripts/sa-g7-source-audit.sh
- HEAD /privacy, /cookies, and /terms after deployment

## Parallel Execution

| Workstream | Status | Owner Role | Objective | Allowed Files | Validation Evidence |
| --- | --- | --- | --- | --- | --- |
| Legal aliases | complete | Backend/API agent | Serve extensionless legal aliases via existing LegalController. | src/legal/legal.controller.ts, src/main.ts | Build and route smoke. |
| Smoke/audit coverage | complete | Validation agent | Add extensionless legal route checks to live smoke and source audit. | scripts/sa-g7-live-smoke.sh, scripts/sa-g7-source-audit.sh | bash -n and source audit. |
| Integration evidence | complete | Orchestrator | Record task, validation, and state evidence. | docs/12_validation/VAL-SA-G2-LEGAL-PRIVACY-AUDIT.md, TASKS.md, STATE.json | JSON parse and final git status. |

## Non-Goals

- Do not change public legal page content beyond existing runtime substitution.
- Do not introduce redirects that could break current .html links.
- Do not read token files or production data for this route alias change.
