# Shop Assistant Business Case

    id: SA-BUSINESS-CASE
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - BUSINESS.md
      - docs/intent-preservation/01_vision/VISION.md
    downstream:
      - docs/intent-preservation/04_systems/SYS-001-shop-assistant.md
      - docs/intent-preservation/22_goal_impact/GOAL_IMPACT_MAPPING.md
    related_adrs: []

## Problem

Users need help finding products that match intent, priorities, delivery or location needs, and recipient context without manually repeating searches across merchants.

## Users

Public shoppers, authenticated users managing profiles and saved criteria, admins managing prompts, models, and diagnostics, and operators maintaining deployments and integrations.

## Value

Shop Assistant converts ambiguous shopping intent into refined searches, comparison, and merchant redirects while preserving legal transparency and privacy boundaries.

## Success Metrics

Search-to-click conversion, search latency under 2 seconds where dependencies allow it, and user retention.

## Constraints

Do not store voice or text searches beyond documented scope. Rate-limit external search calls. Link only to real merchant URLs. Preserve lead forwarding.
