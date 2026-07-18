# SA-G8-B1: Billing And Entitlements

```yaml
id: SA-G8-B1
status: ready_parallel_contract_discovery
owner: commerce-architecture-agent
created: 2026-07-03
upstream:
  - docs/22_goal_impact/GOAL-SA-G8.md
  - docs/21_execution_plans/EP-SA-G8-SALES-READINESS.md
validation:
  - docs/12_validation/VAL-SA-G8-B1.md
```

Objective: Define and, if contracts exist, implement the minimum sellable billing/entitlement path.

Scope: Payment provider discovery, entitlement model, free/paid limits, protected feature gates, admin/customer visibility, exact blockers if payment contracts are missing.

Allowed files: focused billing/entitlement docs, new billing/entitlement modules, minimal UI hooks after contract verification, validation docs.

Forbidden files: product search quality, raw leads/session exports, local credential forms, secrets.

Validation: contract evidence, `npm run build` for source changes, sandbox/no-secret smoke when available, or exact `[MISSING: ...]` blockers.
