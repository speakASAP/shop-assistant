# SA-G1-T1: Search Quality From Failed Searches

```yaml
id: SA-G1-T1
status: draft
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - TASKS.md
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - docs/intent-preservation/TRACEABILITY_MATRIX.md
downstream:
  - docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md
  - docs/intent-preservation/context-packages/CP-SA-BACKLOG.md
  - docs/intent-preservation/coding-prompts/PROMPT-SA-BACKLOG.md
  - docs/intent-preservation/validation-reports/VAL-SA-BACKLOG.md
related_adrs: []
```

## Objective

Analyze the top failed searches and improve response quality without weakening privacy, result truthfulness, or service ownership boundaries.

## Upstream Links

- Goal: SA-G1 Request-to-result quality.
- Backlog: `TASKS.md` item "Analyze top 20 failed searches and improve response quality".
- Intent: `BUSINESS.md` and `README.md`.
- Invariants: `docs/intent-preservation/README.md`.

## Goal Impact

This task improves the core promise: the user expresses what they want, receives useful real product options, can refine the request, and can click through to a real merchant page.

## Project Invariant Impact

Applies to real merchant URL truthfulness, session-scoped search storage, AI/search service boundaries, rate limiting, and diagnostic logging constraints.

## Sensitive-Data Classification

Allowed: aggregated failure categories, synthetic query examples, counts, non-sensitive error classes, anonymized session IDs when needed for debugging.

Forbidden: raw production user queries in documentation, voice transcripts, contact details, JWTs, provider secrets, lead messages, full raw search payloads containing personal data.

## Contract/Schema Impact

Potential impact on session query/feedback responses, search result ranking, prompt behavior, admin prompt content, or diagnostics. Any API response shape change requires explicit documentation in the execution plan and validation report.

## Privacy/Legal Impact

Failed-search analysis must preserve the rule that voice/text searches are not stored beyond approved session scope. Any exported analysis must be aggregated or anonymized. Public AI transparency must remain intact.

## External Service Boundary Impact

`ai-microservice` remains owner of ASR, LLM, and delegated shop search orchestration. Search provider credentials remain outside this repository. `logging-microservice` remains the central logging destination.

## Replay/Determinism Impact

Search quality changes should produce deterministic local normalization and request construction where possible. External search results remain nondeterministic and must be validated by shape and truthfulness checks, not fixed exact result ordering.

## Scope

- Inspect session, AI, search, prompt, and result persistence flows.
- Derive failure categories from approved logs or session data without exposing sensitive content.
- Improve query extraction, ranking, feedback refinement, or prompt guidance only within the selected plan.
- Add focused validation for real URLs and useful failure handling.

## Non-Goals

- Do not deploy without owner approval.
- Do not store provider secrets or raw user data in docs/tests.
- Do not bypass `ai-microservice` for owned AI/search behavior unless owner approves a contract change.
- Do not weaken legal pages or admin auth.

## Acceptance Criteria

- Failure analysis method is privacy-safe and recorded.
- Changes improve at least one named failure category.
- Search results still contain real URLs only.
- Query, feedback, and error behavior are verified with synthetic or approved anonymized data.
- `npm run build` passes.

## Required Context

- `src/sessions/sessions.controller.ts`
- `src/sessions/sessions.service.ts`
- `src/sessions/ai.service.ts`
- `src/sessions/search.service.ts`
- `src/admin/prompts.service.ts`
- `prisma/schema.prisma`
- `public/test.html`
- `public/admin.html`

## Validation Task

Record build output, focused API or service-level checks, and privacy-safe before/after failure evidence in `VAL-SA-BACKLOG.md`.

## Required Gates

- Shop Assistant pre-coding gate
- Privacy/legal review gate
- Search truthfulness validation gate
- Completion gate
