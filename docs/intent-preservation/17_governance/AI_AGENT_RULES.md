# AI Agent Rules

    id: SA-AI-AGENT-RULES
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/00_constitution/CONSTITUTION.md
      - docs/intent-preservation/17_governance/PROJECT_INVARIANTS.md
    downstream:
      - docs/intent-preservation/PRE_CODING_GATE.md
    related_adrs: []

## Required Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Context Package -> Coding Prompt -> Code -> Validation.

## Before Coding

Verify task, upstream traceability, goal impact, invariants, sensitive-data classification, contract or schema impact, replay or determinism impact, execution plan, context package, coding prompt, validation commands, and operational gates.

## Forbidden Behavior

Do not invent business goals, approvals, merchant data, URLs, secrets, or validation evidence. Do not remove traceability or weaken privacy, auth, legal, or service boundaries.
