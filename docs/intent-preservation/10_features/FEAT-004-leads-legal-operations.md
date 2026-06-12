# Feature: Leads, Legal, And Operations

    id: SA-FEAT-004
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/05_subsystems/SUB-004-leads-legal-ops.md
      - docs/intent-preservation/22_goal_impact/GOAL-SA-G2.md
      - docs/intent-preservation/22_goal_impact/GOAL-SA-G5.md
      - docs/intent-preservation/22_goal_impact/GOAL-SA-G6.md
    downstream:
      - docs/intent-preservation/11_tasks/
    related_adrs: []

## User Or System Need

Public users need compliant legal information and lead submission. Operators need deployable, observable service behavior.

## Goal Impact

Supports legal and privacy compliance, lead capture integrations, and operations goals.

## Scope

Lead submission, local lead storage, downstream forwarding, public legal pages, health, deployment scripts, and k8s manifests.

## Non-goals

Changing CRM ownership, AI analysis ownership, or deployment without approval.

## Acceptance Criteria

Lead submission saves locally before forwarding, legal pages remain reachable, secrets stay out of source, and health and deployment checks are named.

## Dependencies

Leads service, AI service, Prisma, public pages, scripts, k8s manifests.

## Validation Strategy

Validate public routes, lead flow, environment-only secrets, health endpoint, and deployment gate evidence.
