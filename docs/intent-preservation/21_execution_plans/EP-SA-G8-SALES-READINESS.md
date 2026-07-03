# EP-SA-G8-SALES-READINESS

```yaml
id: EP-SA-G8-SALES-READINESS
status: active
owner: shop-assistant-orchestrator
created: 2026-07-03
upstream:
  - docs/intent-preservation/22_goal_impact/GOAL-SA-G8.md
  - docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-21.md
  - docs/intent-preservation/21_execution_plans/EP-SA-HOSTED-AUTH-VERIFICATION-2026-06-24.md
downstream:
  - docs/intent-preservation/tasks/SA-G8-U1.md
  - docs/intent-preservation/tasks/SA-G8-B1.md
  - docs/intent-preservation/tasks/SA-G8-P1.md
  - docs/intent-preservation/tasks/SA-G8-S1.md
  - docs/intent-preservation/tasks/SA-G8-V1.md
```

## Intent Preservation Chain

Vision: Shop Assistant converts natural language or voice shopping intent into truthful comparable merchant options while preserving privacy and legal transparency.

Goal Impact: GOAL-SA-G8 makes the service sellable, not just demo-ready.

System: NestJS backend, static frontend, PostgreSQL/Prisma, hosted Auth, ai-microservice, leads-microservice, logging, Kubernetes production at `https://shop-assistant.alfares.cz`.

Feature: Sales readiness across conversion UX, billing/entitlements, privacy/rate limiting, search quality, and release validation.

Task: Split into independent SA-G8 workstreams below.

Execution Plan: Run workstreams in separate Codex threads and separate remote git worktrees/branches. Integrate through orchestrator after validation evidence is available.

Coding Prompt: See `docs/intent-preservation/coding-prompts/PROMPT-SA-G8-SALES-READINESS.md`.

Code: [MISSING: worker branch outputs pending].

Validation: [MISSING: worker validation reports pending].

## Parallel Execution

| Workstream | Status | Owner role | Objective | Allowed files | Forbidden files | Dependencies | Required validation | Merge order |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SA-G8-U1 Conversion UX | ready_parallel | Frontend/product UX agent | Improve result-card selection, merchant redirect affordance, refine prompts, and dashboard follow-up for selected products. | `public/index.html`, `public/dashboard.html`, `public/test.html`, `src/me/**`, `src/sessions/**`, focused docs/report | billing/payment files, auth token model, Prisma migrations unless needed and documented | Current UX report and existing APIs | `npm run build`; no-secret live smoke if deploy not required; browser/static QA; source audit for token leakage | First implementation candidate |
| SA-G8-B1 Billing and entitlements | ready_parallel | Commerce architecture agent | Inspect Alfares payment/contracts, design and implement minimal sellable entitlement gate if contracts exist; otherwise produce exact blockers. | payment integration docs, new billing/entitlement modules, admin/customer UI only if contract verified, IPS docs | product search algorithm, raw leads/session exports, auth credential forms | `[UNKNOWN: existing Alfares payment provider contract]` | build; contract evidence; sandbox/no-secret smoke or `[MISSING]` blocker | After contract design; before production sale |
| SA-G8-P1 Privacy retention and rate limits | ready_parallel | Backend security/privacy agent | Implement or plan retention, deletion/anonymization, anonymous-session TTL, and per-IP/user search rate limiting. | `src/sessions/**`, `src/me/**`, `src/common/**`, `prisma/**`, legal/privacy docs, validation docs | billing UI, result UX styling except status messages | Business constraints in `BUSINESS.md`; GDPR/legal pages | `npm run build`; Prisma validate/generate if schema changes; privacy scan; rate-limit tests | Before sale gate |
| SA-G8-S1 Search quality | ready_parallel | Search-quality agent | Reduce zero-result friction using aggregate/hashed evidence, better prompts, recovery/refine UX, no fabricated URLs. | `src/sessions/**`, `src/admin/prompts*`, search scripts/reports, focused public copy | billing/payment, auth session model, raw production data | Aggregate-only failed-search evidence | build; deterministic synthetic probes; no raw-query export scan | Can merge after U1 if overlapping UX files conflict |
| SA-G8-V1 Release validation | dependency_gated | Validation/release agent | Run strict customer/admin/non-admin token-backed smoke and ownership negative tests using safe token files. | existing smoke scripts, validation report docs | application source unless fixing verifier bugs, raw token printing | `[MISSING: safe test token files/accounts]` | strict token smoke; non-admin forbidden; two-account ownership negative tests | Final gate after implementation branches |

## Shared Files And Conflict Rules

- `public/index.html`, `public/dashboard.html`, `public/test.html`, `src/sessions/**`, and `TASKS.md` are shared-risk files. Only one branch may be merged at a time by the orchestrator.
- Worker branches must append evidence to their own validation report before asking for integration.
- Workers must not deploy production unless the prompt explicitly authorizes it and deploy gate evidence is current.
- Workers must not mutate the shared remote main checkout except to create remote git worktrees/branches.

## Orchestrator Responsibilities

- Maintain this plan and final integration order.
- Review branch diffs and validation evidence.
- Resolve shared-file conflicts.
- Run final build/smoke gate.
- Deploy only after validation evidence and owner approval are satisfied.
