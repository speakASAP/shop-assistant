# 2026-07-03 Shop Assistant Sales Readiness GDD Plan

Status: active orchestration
Remote repo: `/home/ssf/Documents/Github/shop-assistant`
Production URL: `https://shop-assistant.alfares.cz`

## Current Evidence

- Remote `main` was clean before plan creation.
- Last commit before plan: `4ed76b1 docs: add BPCP holiday discount adoption`.
- Current production no-secret smoke passed on 2026-07-03 with `Failures: 0` and optional token checks skipped.
- UX report from 2026-06-21 shows `0%` selected-product choice rate, `0%` feedback-after-results rate, and `40%` zero-result search-run rate.

## Decision

Start GOAL-SA-G8 as a sales-readiness goal. Use parallel subagents with remote worktree/branch isolation. Keep this original thread as orchestrator and integration owner.

## Workstreams

1. SA-G8-U1 Conversion UX - ready now.
2. SA-G8-B1 Billing and entitlements - ready for contract discovery; implementation depends on verified payment contract.
3. SA-G8-P1 Privacy retention and rate limits - ready now.
4. SA-G8-S1 Search quality - ready now; coordinate with U1 before merging shared UX files.
5. SA-G8-V1 Release validation - dependency-gated on safe token files/accounts and implementation branches.

## Integration Order

1. Merge docs/contract-only billing design if no code conflicts.
2. Merge privacy/rate-limit backend if tests pass.
3. Merge search-quality backend/prompt changes.
4. Merge conversion UX after resolving shared public file conflicts.
5. Run token-backed validation and release gate.

## Next Orchestrator Actions

- Create separate Codex threads for each workstream.
- Collect worker handoffs.
- Integrate validated branches in merge order.
