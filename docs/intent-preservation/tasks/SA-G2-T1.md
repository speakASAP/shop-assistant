# SA-G2-T1: Legal, Privacy, And Secret-Surface Audit

id: SA-G2-T1
status: draft
owner: shop-assistant-owner
created: 2026-06-13
last_updated: 2026-06-13
upstream: GOAL-SA-G2, FEAT-004, BUSINESS.md, SYSTEM.md, README.md, TASKS.md, STATE.json
downstream: EP-SA-G2-LEGAL-PRIVACY-AUDIT, CP-SA-G2-LEGAL-PRIVACY-AUDIT, PROMPT-SA-G2-LEGAL-PRIVACY-AUDIT, VAL-SA-G2-LEGAL-PRIVACY-AUDIT

## Objective

Audit Shop Assistant public, authenticated, admin, documentation, and operations surfaces for GDPR/ePrivacy/EU AI Act transparency, cookie-consent preservation, and accidental secret or raw personal-data exposure.

## Intent Preservation Chain

Vision -> Goal Impact SA-G2 -> System shop-assistant -> Feature FEAT-004 -> Task SA-G2-T1 -> Execution Plan EP-SA-G2-LEGAL-PRIVACY-AUDIT -> Coding Prompt PROMPT-SA-G2-LEGAL-PRIVACY-AUDIT -> Code audit-only/no source edits -> Validation VAL-SA-G2-LEGAL-PRIVACY-AUDIT.

## Scope

- Inspect public and legal pages for privacy/cookie/terms/AI transparency reachability.
- Inspect admin/test/dashboard surfaces for token handling, diagnostic leakage, and role-boundary language.
- Inspect docs and scripts for committed secret values or unsafe raw-data instructions.
- Produce a sanitized validation report and follow-up task recommendations.

## Non-Goals

- Do not deploy.
- Do not modify secrets or token files.
- Do not change legal substance without owner/legal approval.
- Do not edit runtime source except a later owner-selected fix task.

## Acceptance Criteria

- Parallel audit workstreams are defined and assignable to separate agents.
- Findings are sanitized and traceable to files/routes.
- Legal routes and AI/cookie transparency are checked.
- Secret/raw-data scan evidence is recorded.
- Follow-up fixes are listed as ready, dependency-gated, blocked, or no action.
