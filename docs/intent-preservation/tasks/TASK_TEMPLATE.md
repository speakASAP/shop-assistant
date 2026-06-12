# SA-GX-TY: Task Title

```yaml
id: SA-GX-TY
status: draft
owner: shop-assistant-owner
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
completeness_level: skeletal
upstream:
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - docs/intent-preservation/TRACEABILITY_MATRIX.md
downstream:
  - docs/intent-preservation/execution-plans/EP-SA-GX.md
  - docs/intent-preservation/context-packages/CP-SA-GX.md
  - docs/intent-preservation/coding-prompts/PROMPT-SA-GX.md
  - docs/intent-preservation/validation-reports/VAL-SA-GX.md
related_adrs: []
```

## Objective

State the task objective.

## Upstream Links

- Goal:
- Intent:
- Invariants:

## Goal Impact

Explain how this task preserves the original intent or advances the selected goal.

## Project Invariant Impact

List applicable invariants and how each is preserved.

## Sensitive-Data Classification

State allowed data classes and forbidden data classes.

## Contract/Schema Impact

State request, response, event, database, API, or UI contract impact.

## Privacy/Legal Impact

State GDPR, ePrivacy/cookie, EU AI Act, and retention implications.

## External Service Boundary Impact

State ai/auth/database/logging/leads/search-provider ownership impact.

## Replay/Determinism Impact

State retry, idempotency, transaction, ordering, or deterministic-validation impact.

## Scope

List exact scope.

## Non-Goals

List what must not change.

## Acceptance Criteria

- criterion

## Required Context

- path

## Validation Task

State required validation evidence.

## Required Gates

- Shop Assistant pre-coding gate
- Validation gate
- Completion gate
