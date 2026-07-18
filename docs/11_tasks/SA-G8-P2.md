# SA-G8-P2: Retention Runner Contract

```yaml
id: SA-G8-P2
status: ready_parallel
owner: backend-privacy-operations-agent
created: 2026-07-03
upstream:
  - docs/22_goal_impact/GOAL-SA-G8.md
  - docs/11_tasks/SA-G8-P1.md
  - docs/12_validation/VAL-SA-G8-P1.md
validation:
  - docs/12_validation/VAL-SA-G8-P2.md
```

Objective: Close the remaining scheduled retention-job blocker by adding a safe, repo-owned anonymous-session TTL cleanup runner contract.

Scope: dry-run-first retention script, explicit apply flag, anonymous-session-only default, env-configurable TTL/batch size, privacy docs, validation evidence.

Allowed files: `scripts/**`, `package.json`, `public/privacy.html`, `TASKS.md`, `STATE.json`, validation docs.

Forbidden files: billing/payment, Auth token model, raw production exports, production DB apply, production deploy.

Validation: `npm run build`, Prisma validate, script help/dry-run or synthetic validation, `git diff --check`, sensitive-data scan.
