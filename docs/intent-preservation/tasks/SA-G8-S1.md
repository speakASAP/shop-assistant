# SA-G8-S1: Search Quality And Zero-Result Reduction

```yaml
id: SA-G8-S1
status: ready_parallel
owner: search-quality-agent
created: 2026-07-03
upstream:
  - docs/intent-preservation/22_goal_impact/GOAL-SA-G8.md
  - docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-21.md
validation:
  - docs/intent-preservation/validation-reports/VAL-SA-G8-S1.md
```

Objective: Reduce zero-result friction while preserving truthful merchant URL behavior and privacy-safe analytics.

Scope: aggregate/hashed failed-search analysis, recovery query tuning, prompt defaults, deterministic no-result guidance, optional admin prompt seed improvements.

Allowed files: `src/sessions/**`, `src/admin/prompts*`, search scripts/reports, validation docs.

Forbidden files: billing/payment, Auth session model, raw production query/message exports.

Validation: `npm run build`, deterministic synthetic probes, no raw-query export scan, validation report.
