# GOAL-SA-G8: Sales Readiness

```yaml
id: GOAL-SA-G8
status: active
owner: shop-assistant-owner
created: 2026-07-03
completeness_level: implementation_ready
upstream:
  - docs/01_vision/VISION.md
  - BUSINESS.md
  - TASKS.md
  - STATE.json
downstream:
  - docs/21_execution_plans/EP-SA-G8-SALES-READINESS.md
  - docs/11_tasks/SA-G8-U1.md
  - docs/11_tasks/SA-G8-B1.md
  - docs/11_tasks/SA-G8-P1.md
  - docs/11_tasks/SA-G8-P2.md
  - docs/11_tasks/SA-G8-S1.md
  - docs/11_tasks/SA-G8-V1.md
```

## Goal Impact

Move Shop Assistant from pilot-ready MVP to sellable user-facing service by closing conversion, commercial access, privacy/rate-limit hardening, search quality, and release-validation gaps.

## Business Outcome

A buyer can understand the offer, sign in, use the assistant, select or open merchant results, reuse searches/profiles, and operate inside clear commercial, privacy, and reliability boundaries.

## Guardrails

- Preserve real merchant URL truthfulness. Do not fabricate product links.
- Preserve hosted Auth as credential owner.
- Do not print secrets, JWTs, raw production queries, raw lead contacts, or private profile data.
- Keep public anonymous search compatible unless a scoped task explicitly changes it.
- Use remote `alfares:/home/ssf/Documents/Github/shop-assistant` source of truth only.
- Parallel agents must use separate remote git worktrees or branches and must not edit the shared main checkout concurrently.

## Success Criteria

- Result selection and refinement UX is implemented and measured.
- Commercial billing/entitlement path is designed and either implemented with existing Alfares payment contracts or blocked with exact `[MISSING: ...]` dependencies.
- Privacy retention and rate-limit policy is implemented, including a repo-owned scheduled retention runner or an exact external runner blocker.
- Search quality work reduces zero-result friction without raw-data exposure.
- Token-backed customer/admin/non-admin release smoke can run without exposing tokens.
