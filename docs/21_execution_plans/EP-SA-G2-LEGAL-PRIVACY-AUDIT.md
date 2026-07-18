# EP-SA-G2-LEGAL-PRIVACY-AUDIT: Legal, Privacy, And Secret-Surface Audit

id: EP-SA-G2-LEGAL-PRIVACY-AUDIT
status: draft
source_task: docs/11_tasks/SA-G2-T1.md
owner: shop-assistant-owner
created: 2026-06-13
last_updated: 2026-06-13

## Upstream Traceability

- Vision: docs/01_vision/VISION.md
- Goal Impact: docs/22_goal_impact/GOAL-SA-G2.md
- System: docs/04_systems/SYS-001-shop-assistant.md
- Feature: docs/10_features/FEAT-004-leads-legal-operations.md
- Task: docs/11_tasks/SA-G2-T1.md
- Current state: STATE.json

## Goal Impact

Protect public trust and compliance by confirming that Shop Assistant keeps GDPR/ePrivacy/EU AI Act transparency reachable, avoids committed secrets, and does not expose raw personal data in docs, scripts, public pages, admin/test diagnostics, or validation reports.

## File Scope

Read-only inspection targets: BUSINESS.md, SYSTEM.md, README.md, TASKS.md, STATE.json, public/, src/auth/, src/admin/, src/leads/, src/sessions/, scripts/, k8s/, docs/.

Allowed write targets: docs/12_validation/VAL-SA-G2-LEGAL-PRIVACY-AUDIT.md, TASKS.md, STATE.json.

Runtime source edits, legal substance changes, secret changes, and deployment are forbidden during this audit.

## Parallel Execution

| Workstream | Status | Owner Role | Objective | Scope | Allowed Files | Forbidden Files | Dependencies | Validation Evidence | Handoff Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Documentation and IPS audit | ready now | Compliance docs agent | Verify IPS, README, TASKS, STATE, and validation reports preserve privacy/legal gates and do not contain unsafe data-handling instructions. | Docs-only read audit. | Validation report append if assigned. | Runtime source, secrets, token files. | None. | File list inspected, sensitive-term scan summary, missing-docs list. | Return findings with file path and no raw secret/data excerpts. |
| Public/legal surface audit | ready now | Public UX compliance agent | Verify legal routes, cookie consent, AI transparency, Auth handoff text, and public diagnostic exposure. | Public static pages and optional public route status checks. | Validation report append if assigned. | Legal substance edits, Auth source, deployment files. | Public route access; no tokens required. | Route status matrix and static inspection notes. | Separate compliance defects from UX polish suggestions. |
| Protected/admin/test surface audit | ready now | Security surface agent | Verify admin/test/dashboard token handling, lockout language, and diagnostic data boundaries without printing tokens. | Protected page source and existing smoke scripts. | Validation report append if assigned. | Token files, .env, production data exports. | Safe token files only for optional authenticated checks. | 401/403 checks or skipped reason, token-storage grep summary. | Mark authenticated checks skipped if safe tokens are unavailable. |
| Integration and follow-up planning | final integration | Orchestrator | Merge findings into the IPS chain and select fix tasks. | Validation report, TASKS.md, STATE.json, traceability if needed. | SA-G2 planning and state files. | Worker source edits during active audit. | All worker handoffs or explicit skipped reasons. | Final report, follow-up workstream states, next concrete command. |

Shared contracts: BUSINESS.md, README.md, SYSTEM.md, docs/README.md, TRACEABILITY_MATRIX.md, public legal pages, and Auth/RBAC ownership boundaries. Merge order: docs audit, public/legal audit, protected surface audit, integration summary.

## Validation Plan

- find docs/intent-preservation -type f | sort
- rg -n "access_token|refresh_token|JWT|api[_-]?key|secret|password|BEGIN .*KEY|Authorization: Bearer" README.md TASKS.md STATE.json public src scripts docs/intent-preservation k8s
- curl -I https://shop-assistant.alfares.cz/privacy.html
- curl -I https://shop-assistant.alfares.cz/cookies.html
- curl -I https://shop-assistant.alfares.cz/terms.html
