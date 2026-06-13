# SA-G3-T1: Saved Criteria Session Traceability

```yaml
id: SA-G3-T1
status: draft
owner: shop-assistant-owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: implementation-slice
upstream:
  - docs/intent-preservation/22_goal_impact/GOAL-SA-G3.md
  - docs/intent-preservation/10_features/FEAT-002-profiles-saved-criteria.md
  - TASKS.md
downstream:
  - docs/intent-preservation/execution-plans/EP-SA-G3-PROFILE-CRITERIA.md
  - docs/intent-preservation/context-packages/CP-SA-G3-PROFILE-CRITERIA.md
  - docs/intent-preservation/coding-prompts/PROMPT-SA-G3-PROFILE-CRITERIA.md
  - docs/intent-preservation/validation-reports/VAL-SA-G3-PROFILE-CRITERIA.md
related_adrs: []
```

## Objective

Strengthen saved criteria reuse by making sessions created from a saved search traceable back to the saved criteria template.

## Goal Impact

Supports SA-G3 by making reusable saved criteria visible in account-scoped dashboard/session history and analytics.

## Project Invariant Impact

Profile and criteria data remain scoped to authenticated identity. Search results still require real merchant URLs. Auth, AI/search, database, logging, and leads ownership boundaries remain unchanged.

## Sensitive-Data Classification

Allowed: schema field names, route names, synthetic validation IDs, aggregate status.

Forbidden: raw production query text, profile names tied to real identities, contact details, JWTs, provider keys, and secrets.

## Contract/Schema Impact

Adds nullable `Session.usedSavedCriteriaId` and a relation to `SavedSearchCriteria`. Current-user dashboard/session responses add saved-criteria trace fields.

## Privacy/Legal Impact

No legal page or cookie behavior changes. Account-scoped APIs still require JWT validation and user ownership checks.

## External Service Boundary Impact

No external contract change. Saved criteria execution still delegates query/search to existing session and AI/search services.

## Replay/Determinism Impact

Running a saved criteria deterministically records the criteria id on the created session. Search results remain nondeterministic.

## Scope

- Add Prisma schema/migration for saved criteria session traceability.
- Write trace id when running saved criteria.
- Expose trace relation in current-user dashboard/session list/session detail.

## Non-Goals

- Do not deploy or apply migration without owner approval.
- Do not expose cross-user criteria data.
- Do not alter Auth ownership or AI/search behavior.

## Acceptance Criteria

- Prisma generate and build pass.
- Saved criteria run path writes `usedSavedCriteriaId`.
- Current-user session APIs include trace fields only for authenticated owner-scoped data.
- Validation evidence is recorded.
