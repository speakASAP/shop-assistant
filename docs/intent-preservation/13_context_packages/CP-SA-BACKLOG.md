# Context Package: Current Backlog

    id: CP-SA-BACKLOG
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/21_execution_plans/EP-SA-BACKLOG.md
    downstream:
      - docs/intent-preservation/14_prompts/PROMPT-SA-BACKLOG.md
    related_adrs: []

## Task Summary

Current backlog work covers failed-search quality analysis and UX improvement reporting from session data.

## Required Source Context

BUSINESS.md, SYSTEM.md, README.md, TASKS.md, constitution, request-to-results feature, admin-observability feature, src/sessions, src/admin, and prisma/schema.prisma.

## Preserved Constraints

No fabricated merchant data, no secrets, no raw production data in prompts or docs, authenticated diagnostics, approved microservice boundaries.

## Missing Context

[MISSING: owner-approved redacted failed-search or session evidence source.]
[MISSING: selected implementation or reporting scope.]
