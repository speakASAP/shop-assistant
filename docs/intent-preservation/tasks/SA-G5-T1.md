# Task: SA-G5-T1 Lead Forwarding Resilience

    id: SA-G5-T1
    status: deployment_attempt_blocked_runtime_pull
    owner: shop-assistant-owner
    created: 2026-06-13
    last_updated: 2026-06-13
    upstream:
      - docs/intent-preservation/22_goal_impact/GOAL-SA-G5.md
      - docs/intent-preservation/10_features/FEAT-004-leads-legal-operations.md
    validation:
      - docs/intent-preservation/validation-reports/VAL-SA-G5-LEAD-FORWARDING.md

## Objective

Preserve local lead capture even when downstream lead forwarding or AI analysis fails, and expose integration status to operations without leaking secrets or private failure details to public users.

## Scope

- Persist lead forwarding and AI analysis status/error/timestamp fields on `LeadRequest`.
- Keep `POST /api/leads/submit` successful after local save when leads-microservice forwarding fails.
- Keep AI analysis best-effort and persist skipped/failed/sent state.
- Expose status fields through protected admin operations lead APIs.

## Non-Goals

- No new CRM ownership flow.
- No retry worker or queue scheduler in this slice.
- No deployment without explicit owner approval.
