# Audit Report: IPS Installation

    id: SA-AUDIT-2026-06-12
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/00_constitution/CONSTITUTION.md
      - docs/intent-preservation/21_execution_plans/EP-SA-DOCS-T1.md
    downstream:
      - docs/intent-preservation/12_validation/VAL-SA-DOCS-T1.md
    related_adrs: []

## Scope

Review Shop Assistant documentation against the company Intent Preservation System.

## Findings

- Root project intent exists in BUSINESS.md, SYSTEM.md, README.md, and TASKS.md.
- A partial IPS overlay existed before this installation.
- README-linked docs under docs/API.md, docs/DEPLOYMENT.md, docs/DEVELOPMENT.md, docs/IMPLEMENTATION_PLAN.md, docs/INTEGRATION.md, docs/MODEL_AND_ROLE_MANAGEMENT.md, and docs/AI_VERIFICATION_PROMPT.md are absent and must not be cited as evidence until restored.
- Numbered IPS layers were added under docs/intent-preservation.

## Recommendation

Use the new numbered IPS documents for all future coding gates. Restore or replace missing README-linked docs only through a documented task.
