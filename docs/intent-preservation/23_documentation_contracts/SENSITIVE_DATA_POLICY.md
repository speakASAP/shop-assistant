# Sensitive Data Policy

    id: SA-SENSITIVE-DATA-POLICY
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/00_constitution/CONSTITUTION.md
      - public/privacy.html
    downstream:
      - docs/intent-preservation/PRE_CODING_GATE.md
    related_adrs: []

## Policy

Do not place secrets, raw production data, real customer identifiers, raw voice transcripts, contact methods, or private session content in documentation, prompts, tests, logs, examples, screenshots, or reports.

## Allowed Evidence

Use redacted, synthetic, or aggregate evidence unless an owner-approved secure workflow explicitly allows otherwise.
