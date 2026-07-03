# SA-G8-P1: Privacy Retention And Rate Limits

```yaml
id: SA-G8-P1
status: ready_parallel
owner: backend-security-privacy-agent
created: 2026-07-03
upstream:
  - docs/intent-preservation/22_goal_impact/GOAL-SA-G8.md
  - BUSINESS.md
validation:
  - docs/intent-preservation/validation-reports/VAL-SA-G8-P1.md
```

Objective: Close commercial privacy and abuse-control gaps for session data and search traffic.

Scope: anonymous-session retention, user deletion/anonymization path, query/message minimization, per-IP/user search rate limits, legal page alignment.

Allowed files: `src/sessions/**`, `src/me/**`, `src/common/**`, `prisma/**`, legal/privacy docs, validation docs.

Forbidden files: billing UI, conversion styling except privacy/rate-limit status messages, raw production exports.

Validation: `npm run build`, Prisma validate/generate if schema changes, focused privacy scan, rate-limit tests or documented blockers.
