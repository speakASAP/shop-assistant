# SA-G8-V1: Release Validation Gate

```yaml
id: SA-G8-V1
status: dependency_gated
owner: release-validation-agent
created: 2026-07-03
upstream:
  - docs/22_goal_impact/GOAL-SA-G8.md
  - docs/21_execution_plans/EP-SA-G8-SALES-READINESS.md
validation:
  - docs/12_validation/VAL-SA-G8-V1.md
```

Objective: Prove the sellable service release gate with no-secret and token-backed validation.

Scope: no-secret smoke, customer-token dashboard/account checks, admin-token operations checks, non-admin forbidden checks, two-account ownership negative tests, final release report.

Allowed files: existing smoke scripts, validation docs, verifier fixes only if required.

Forbidden files: feature implementation, raw JWT printing, raw production data, deploy unless explicitly approved by orchestrator/owner.

Dependencies: `[MISSING: safe customer/admin/non-admin token files or test account bootstrap path]`; implementation branches ready for final gate.

Validation: strict token smoke with token-file env, ownership negative tests, final summarized evidence with secrets redacted.
