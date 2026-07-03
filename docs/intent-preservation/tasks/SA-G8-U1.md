# SA-G8-U1: Conversion UX

```yaml
id: SA-G8-U1
status: ready_parallel
owner: conversion-ux-agent
created: 2026-07-03
upstream:
  - docs/intent-preservation/22_goal_impact/GOAL-SA-G8.md
  - docs/intent-preservation/21_execution_plans/EP-SA-G8-SALES-READINESS.md
  - docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-21.md
validation:
  - docs/intent-preservation/validation-reports/VAL-SA-G8-U1.md
```

Objective: Improve selected-product and refinement conversion so users naturally choose merchant results and continue refining searches.

Scope: Result cards, selected-product CTA, merchant redirect affordance, dashboard selected-products follow-up, refine prompts after successful and zero-result searches.

Allowed files: `public/index.html`, `public/dashboard.html`, `public/test.html`, focused `src/me/**` or `src/sessions/**` only if an API gap is verified, and validation docs.

Forbidden files: billing/payment implementation, hosted Auth token model, secrets, raw production data, unrelated deploy files.

Validation: `npm run build`, browser/static QA, no token leakage scan, and updated validation report.
