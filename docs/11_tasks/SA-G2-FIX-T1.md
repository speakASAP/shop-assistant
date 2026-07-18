# SA-G2-FIX-T1: Documentation And Legal/Privacy Surface Hardening

id: SA-G2-FIX-T1
status: draft
owner: shop-assistant-owner
created: 2026-06-14
last_updated: 2026-06-14
upstream: SA-G2-T1, VAL-SA-G2-LEGAL-PRIVACY-AUDIT, GOAL-SA-G2

## Objective

Apply low-risk documentation and public legal/privacy surface fixes found by SA-G2-T1 without changing runtime data ownership or deploying production.

## Scope

- Remove stale README instructions for admin JWT storage and token URL usage.
- Replace unsafe validation/report replay guidance that expands bearer tokens into command arguments with token-file-safe script invocation guidance.
- Make rollout runbook authenticated smoke examples token-file-first.
- Resolve approved company/contact/jurisdiction placeholders on public legal pages using existing repository-approved company data.
- Add AI transparency to direct interactive public pages, especially test.html.
- Add or align cookie preference reset/control behavior with cookie policy wording.

## Parallel Execution

| Workstream | Status | Owner Role | Objective | Allowed Files | Validation Evidence |
| --- | --- | --- | --- | --- | --- |
| Docs/token guidance fix | ready now | Documentation agent | Remove stale token URL/manual JWT instructions and unsafe replay examples. | README.md, VAL-SA-G7-FRONTEND.md, SA-G7 rollout runbook | rg scan for token URL/JWT storage wording and token-file-safe examples. |
| Public legal/UI fix | ready now | Public compliance agent | Resolve legal placeholders and add AI/cookie transparency controls. | public/privacy.html, public/cookies.html, public/terms.html, public/test.html, shared public script blocks if present | Public route/status check, static grep for placeholders, browser/static smoke if UI changes. |
| Integration validation | final integration | Orchestrator | Merge fixes, update validation and state. | VAL-SA-G2-LEGAL-PRIVACY-AUDIT.md, TASKS.md, STATE.json | sensitive-data scan, no runtime build unless source build inputs changed. |

## Non-Goals

- Do not change public session API ownership; that belongs to SA-G2-FIX-T2.
- Do not deploy without explicit owner approval.
- Do not read or print token files, .env values, or raw production data.
- Do not change legal substance beyond repository-approved company/contact placeholders without owner/legal approval.
