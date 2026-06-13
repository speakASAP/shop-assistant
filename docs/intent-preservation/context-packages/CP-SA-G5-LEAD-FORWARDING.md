# Context Package: SA-G5 Lead Forwarding Resilience

    id: CP-SA-G5-LEAD-FORWARDING
    status: in_progress
    owner: shop-assistant-owner
    created: 2026-06-13

## Relevant Files

- `src/leads/leads.controller.ts`
- `src/leads/leads.service.ts`
- `src/admin/operations.controller.ts`
- `prisma/schema.prisma`
- `docs/intent-preservation/22_goal_impact/GOAL-SA-G5.md`
- `docs/intent-preservation/10_features/FEAT-004-leads-legal-operations.md`

## Constraints

Lead payloads and contact methods remain private. Public responses must not expose downstream stack traces, service URLs, tokens, or operator-only details. The service must save locally before forwarding.
