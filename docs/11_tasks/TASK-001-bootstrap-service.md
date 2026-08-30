# Task: Shop Assistant IPS adoption bootstrap

```yaml
id: TASK-001-bootstrap-service
status: validated
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - ../00_constitution/CONSTITUTION.md
  - ../01_vision/VISION.md
downstream:
  - ../21_execution_plans/EP-TASK-001-bootstrap-service.md
  - ../22_goal_impact/GOAL-IMPACT-TASK-001.md
  - ../12_validation/VAL-TASK-001-bootstrap-service.md
```

## objective

Bring the shop-assistant repository into full compliance with the IPS project-adoption standard: complete all required root and docs/ artifacts, integration review, and state files without fabricating product intent beyond what is already documented in BUSINESS.md, SYSTEM.md, README.md, AGENTS.md, TASKS.md, and STATE.json.

## upstream links

- `../00_constitution/CONSTITUTION.md`
- `../01_vision/VISION.md`
- `../../BUSINESS.md`

## goal impact

See `../22_goal_impact/GOAL-IMPACT-TASK-001.md` for the full contribution mapping to approved project goals.

## project invariant impact

This task does not change SA-INV-001..005; it documents them formally in docs/17_governance/PROJECT_INVARIANTS.md for the first time.

## sensitive-data classification

No secrets, user search content, or production data are included in any adoption artifact; all content is architectural/process documentation drawn from non-secret repository files.

## contract and schema impact

No API, database schema, or public contract changes. This is a documentation-only bootstrap.

## replay and determinism impact

Not applicable; this task does not change the search/refinement pipeline or the billing/entitlement callback idempotency logic, only documents it.

## scope

- Root IPS artifacts (README, BUSINESS, SYSTEM, AGENTS, AGENT_OPERATIONS, CLAUDE, TASKS, STATE.json, ips-adoption.json)
- Protected governance docs (CONSTITUTION, VISION, PROJECT_INVARIANTS)
- Bootstrap task chain (TASK-001, GOAL-IMPACT-TASK-001, EP-TASK-001, VAL-TASK-001)
- Integration contract and capability review

## non-goals

- Changing any running service behavior, schema, or deployment configuration
- Resolving the open owner-gated live checkout smoke follow-up
- Modifying docs/DEVELOPMENT.md, docs/API.md, or other existing docs/ content beyond the required VALIDATION_DEBT.md path

## acceptance criteria

- The IPS planning validator passes with no unresolved findings for shop-assistant
- All 16 integration capabilities have concrete required/not-applicable decisions grounded in observed repo facts
- Protected docs (BUSINESS, CONSTITUTION, VISION) carry human-approval evidence
- STATE.json and TASKS.md reflect the real current state, including the open billing checkout follow-up

## required context

- README.md, BUSINESS.md, SYSTEM.md, AGENTS.md, AGENT_OPERATIONS.md, TASKS.md, STATE.json (pre-existing real content)
- .env.example for integration facts
- TASKS.md SA-G8-B2 entries for billing/entitlement facts

## validation task

Run `python3 ../intent-preservation-system/scripts/validate_adoption_profile.py --root . --phase planning` from the ecosystem root and confirm a clean pass.

## required gates

- IPS adoption planning validator exits 0
- No placeholder markers remain in any artifact

## parallel workstream context

This is a single-owner documentation bootstrap with no parallel workstreams; it does not touch service source code or the open billing checkout follow-up.
