# Feature: Profiles And Saved Criteria

    id: SA-FEAT-002
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/05_subsystems/SUB-002-profile-criteria.md
      - docs/intent-preservation/22_goal_impact/GOAL-SA-G3.md
    downstream:
      - docs/intent-preservation/11_tasks/
    related_adrs: []

## User Or System Need

Users need to shop for multiple recipients and reuse criteria without rebuilding context every time.

## Goal Impact

Supports SA-G3 Multi-intent and profile search.

## Scope

Authenticated CRUD for profiles and saved criteria, plus saved criteria execution.

## Non-goals

Replacing auth ownership or exposing cross-account profile data.

## Acceptance Criteria

Profile and criteria access is scoped to authenticated identity, criteria preserve priorities and filters, and running criteria creates traceable search behavior.

## Dependencies

Auth guard, Prisma models, sessions service.

## Validation Strategy

Validate auth scope, CRUD behavior, and run behavior with no cross-user leakage.
