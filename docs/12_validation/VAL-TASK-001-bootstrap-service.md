# Validation: Shop Assistant IPS adoption bootstrap

```yaml
id: VAL-TASK-001-bootstrap-service
status: validated
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - ../11_tasks/TASK-001-bootstrap-service.md
  - ../22_goal_impact/GOAL-IMPACT-TASK-001.md
downstream:
[]
```

## summary

The shop-assistant repository now includes the complete required IPS adoption document set, reformatted from real pre-existing BUSINESS.md/SYSTEM.md/AGENTS.md/README.md/TASKS.md/STATE.json content plus observed .env.example facts, with no fabricated business claims.

## upstream goal

This validation closes `TASK-001-bootstrap-service`, which advances `../22_goal_impact/GOAL-IMPACT-TASK-001.md`.

## acceptance criteria evidence

- Required root and docs/ artifacts are present and populated with project-specific content
- Integration review covers all 16 capabilities with concrete required/not-applicable decisions and evidence-grounded reasons
- STATE.json and TASKS.md reflect the real current state, including the open owner-gated checkout follow-up

## gate evidence

- `validate_adoption_profile.py --root shop-assistant --phase planning` exits 0 (see command output recorded in the onboarding session)

## integration evidence

- ai-microservice, auth-microservice, PostgreSQL, logging-microservice, and leads-microservice integrations confirmed via README.md/SYSTEM.md's documented integration tables
- payments-microservice integration confirmed via TASKS.md SA-G8-B2 entries and .env.example PAYMENTS_*/PAYMENT_* variables
- Redis declared optional in .env.example but not referenced anywhere in src/, supporting the not-applicable decision; no RabbitMQ/MinIO/catalog/orders/warehouse/invoices/notifications references found

## invariant evidence

SA-INV-001..005 are drawn directly from BUSINESS.md (Constraints), README.md (env/config handling), and TASKS.md (SA-G8-B2 gated billing) without alteration.

## sensitive-data evidence

No secrets, tokens, or user search content appear in any adoption artifact; only architectural facts and non-secret configuration variable names are referenced.

## replay and determinism evidence

Not applicable; the billing callback idempotency and search/refinement pipeline are documented as-is and not modified by this bootstrap.

## issues and validation debt

No new validation debt was created. A required docs/orchestrator/VALIDATION_DEBT.md did not previously exist (a differently-pathed docs/12_validation/VALIDATION_DEBT.md exists and was left untouched); the scaffolder created the required path with a clean ledger reflecting no active entries.

## deviations

The repository already had a docs/12_validation/VALIDATION_DEBT.md at a non-standard path; this was left in place untouched, and the standard docs/orchestrator/VALIDATION_DEBT.md path was created fresh per the IPS standard.

## recommendation

Approve for planning phase. Deployment-phase (implementation) validation is not required for a documentation-only onboarding.

## traceability confirmation

This validation confirms the traceability chain `TASK-001-bootstrap-service` -> `../22_goal_impact/GOAL-IMPACT-TASK-001.md` -> `EP-TASK-001-bootstrap-service.md` -> `VAL-TASK-001-bootstrap-service.md` is intact and evidenced.
