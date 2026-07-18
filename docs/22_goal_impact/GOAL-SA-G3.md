# Goal Impact: SA-G3 Multi-Intent And Profile Search

    id: SA-GOAL-G3
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/22_goal_impact/GOAL_IMPACT_MAPPING.md
    downstream:
      - docs/10_features/FEAT-002-profiles-saved-criteria.md
    related_adrs: []

## Goal Impact

Support multiple products in one request, multiple recipient profiles under one account, user priorities, and reusable saved criteria.

## Protected Constraints

Profile and criteria data must remain scoped to the authenticated user and must not cross account boundaries.
