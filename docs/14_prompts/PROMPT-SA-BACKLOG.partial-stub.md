# Coding Prompt: Current Backlog

    id: PROMPT-SA-BACKLOG
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/13_context_packages/CP-SA-BACKLOG.md
      - docs/21_execution_plans/EP-SA-BACKLOG.md
    downstream:
      - docs/12_validation/VAL-SA-BACKLOG.md
    related_adrs: []

## Task Summary

Analyze failed searches and or session UX evidence, then implement only approved task-scoped changes.

## Execution Plan Link

docs/21_execution_plans/EP-SA-BACKLOG.md.

## Required Context

Use the context package and full upstream documents. Do not rely only on this prompt.

## Allowed Changes

[MISSING: fill after owner selects concrete task scope.]

## Forbidden Changes

No env changes, no secrets, no unredacted production data, no fabricated merchant data, no admin auth weakening, no production deployment without approval.

## Implementation Instructions

Before code changes, fill missing execution-plan fields, verify the pre-coding gate, and split the plan if search-quality and UX-report tasks diverge.

## Acceptance Criteria

Traceability, redaction, validation evidence, and task completion evidence are recorded.

## Validation Commands

npm run build
Additional commands: [MISSING: define based on changed files.]

## Expected Output

Task-scoped changes or report artifacts, validation report, and append-only task status update.
