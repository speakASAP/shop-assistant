# PROMPT-SA-G8-SALES-READINESS

Use Goal Driven Development and preserve the chain: Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation.

Work only on remote `alfares:/home/ssf/Documents/Github/shop-assistant` or a remote git worktree created from it. Do not create or edit Shop Assistant source locally under `/Users/Sergej.Stasok/Documents`.

Before coding:

1. Read `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `TASKS.md`, `STATE.json`.
2. Read `docs/intent-preservation/22_goal_impact/GOAL-SA-G8.md` and `docs/intent-preservation/21_execution_plans/EP-SA-G8-SALES-READINESS.md`.
3. Create/use a dedicated remote branch/worktree for the assigned workstream.
4. Inspect current source and dirty status. Do not overwrite unrelated work.

During coding:

- Keep changes scoped to assigned files.
- Mark unavailable facts as `[MISSING: ...]` or `[UNKNOWN: ...]`.
- Do not print secrets, JWTs, raw production queries, lead contacts, profile PII, or database URLs.
- Preserve hosted Auth and real merchant URL truthfulness.
- Add focused validation evidence in a workstream-specific validation report.

Before handoff:

- Run `npm run build` unless the workstream is docs-only.
- Run focused scans/tests listed in the workstream prompt.
- Report branch/worktree, changed files, validation commands/results, blockers, and merge order.
