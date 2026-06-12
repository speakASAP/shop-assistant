# Task: Generate UX Improvement Report From Session Data

    id: SA-G4-T1
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - TASKS.md
      - docs/intent-preservation/10_features/FEAT-003-admin-observability.md
      - docs/intent-preservation/22_goal_impact/GOAL-SA-G4.md
    downstream:
      - docs/intent-preservation/21_execution_plans/EP-SA-BACKLOG.md
      - docs/intent-preservation/13_context_packages/CP-SA-BACKLOG.md
      - docs/intent-preservation/14_prompts/PROMPT-SA-BACKLOG.md
      - docs/intent-preservation/12_validation/VAL-SA-BACKLOG.md
    related_adrs: []

## Objective

Generate a UX improvement report from session and diagnostic evidence.

## Upstream Links

TASKS.md, SA-FEAT-003, SA-GOAL-G4.

## Goal Impact

Improves admin observability and product UX feedback loops.

## Project Invariant Impact

Medium. Session diagnostics and reporting may be affected.

## Sensitive-Data Classification

Potentially sensitive. Reports must aggregate or redact user content and must not include real customer identifiers.

## Contract/Schema Impact

None unless report generation requires schema or API changes.

## Replay/Determinism Impact

Reports should define stable query windows, filters, and redaction rules.

## Scope

Session and diagnostic analysis plus actionable UX recommendations.

## Non-goals

Do not publish raw session transcripts or unredacted agent communication content.

## Acceptance Criteria

Report source and time window are documented, redaction rules are applied, and recommendations trace to evidence or are marked as hypotheses.

## Required Context

Session, message, search run, result, and agent communication data sources approved by owner.

## Validation Task

Use VAL-SA-BACKLOG.md or create task-specific validation evidence before completion.

## Required Gates

Pre-coding gate, sensitive-data review, validation report.
