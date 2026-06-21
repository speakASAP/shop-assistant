# PROMPT-SA-G7-FRONTEND: Implementation Prompt

```yaml
id: PROMPT-SA-G7-FRONTEND
status: complete
owner: shop-assistant-owner
created: 2026-06-13
last_updated: 2026-06-21
completeness_level: complete
upstream:
  - docs/intent-preservation/tasks/SA-G7-T1.md
  - docs/intent-preservation/execution-plans/EP-SA-G7-FRONTEND.md
  - docs/intent-preservation/context-packages/CP-SA-G7-FRONTEND.md
downstream:
  - docs/intent-preservation/validation-reports/VAL-SA-G7-FRONTEND.md
related_adrs: []
```

## Role

You are implementing a scoped frontend/productization slice for Shop Assistant on the remote `alfares` repository `/home/ssf/Documents/Github/shop-assistant`.

## Mandatory Rules

- Read `AGENTS.md`, `docs/intent-preservation/PRE_CODING_GATE.md`, `docs/intent-preservation/tasks/SA-G7-T1.md`, `docs/intent-preservation/execution-plans/EP-SA-G7-FRONTEND.md`, and `docs/intent-preservation/context-packages/CP-SA-G7-FRONTEND.md` before source edits.
- Keep work in the remote repository; do not copy service data into local `/Users/Sergej.Stasok/Documents`.
- Preserve Auth ownership: no local password authority, no JWT minting, no role assignment in Shop Assistant.
- Preserve AI/search ownership: no provider secrets in this repo or frontend bundle.
- Preserve admin protection: admin APIs must use `JwtAuthGuard`, `RolesGuard`, and Auth role strings.
- Preserve client ownership: dashboard APIs must derive `userId` from `req.user.id`, not from editable request body values.
- Do not expose raw production personal data, JWTs, refresh tokens, secrets, or `.env` values.
- Do not deploy without explicit owner approval in the active session.

## First Recommended Slice

Implement auth and ownership foundations before UI expansion:

1. Add current-user dashboard/session APIs under a scoped module/controller, protected by `JwtAuthGuard`.
2. Ensure returned sessions, messages, search runs, choices, profiles, and saved criteria are filtered by `req.user.id`.
3. Add ownership checks for any authenticated per-session dashboard detail endpoint.
4. Add or update frontend auth helper/callback behavior so dashboard/admin pages require a bearer token.
5. Leave public anonymous search behavior intact unless the selected slice explicitly changes it.

## Implementation Constraints

- Prefer existing Nest, Prisma, and static frontend patterns.
- Keep changes small enough to validate in one cycle.
- Add Prisma migrations only when existing schema cannot support the selected behavior.
- Use synthetic/test data only for validation examples.

## Required Validation

Run at minimum:

```bash
npm run build
```

Also record focused auth checks for the selected slice, including unauthenticated rejection and ownership enforcement. If test tokens are unavailable, document the exact blocked check and validate guards by build/static inspection without fabricating success.

## Completion

Append validation evidence to `docs/intent-preservation/validation-reports/VAL-SA-G7-FRONTEND.md`, append task status evidence to `TASKS.md`, and update `STATE.json` with the current goal state and next focus.

## Closeout Status

Status as of 2026-06-21: complete. This prompt has been executed through the SA-G7 implementation history. It is preserved for traceability from task to code and validation, not as an active coding instruction.

Do not use this prompt as an open work item. Follow-up changes need a fresh task, execution plan, context package, prompt, code change, and validation evidence.
