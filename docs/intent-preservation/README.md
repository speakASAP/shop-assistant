# Shop Assistant Intent Preservation System

```yaml
id: SA-IPS-README
status: active
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - TASKS.md
  - STATE.json
downstream:
  - docs/intent-preservation/TRACEABILITY_MATRIX.md
  - docs/intent-preservation/PRE_CODING_GATE.md
  - docs/intent-preservation/tasks/
  - docs/intent-preservation/execution-plans/
  - docs/intent-preservation/context-packages/
  - docs/intent-preservation/coding-prompts/
  - docs/intent-preservation/validation-reports/
related_adrs: []
```

## Purpose

This folder adapts the company Intent Preservation System to `shop-assistant`.

The goal is to keep the original product intent visible from business objective through task selection, execution plan, context package, coding prompt, validation evidence, and state update. Coding must not start until the selected task has traceability, declared invariants, sensitive-data handling, contract impact, replay/determinism impact, an execution plan, a context package, a coding prompt, and named validation gates.

## Source Of Truth

The protected project intent is preserved in:

- `BUSINESS.md`
- `SYSTEM.md`
- `README.md`
- `TASKS.md`
- `STATE.json`
- `AGENTS.md`
- `prisma/schema.prisma`
- `public/privacy.html`, `public/cookies.html`, `public/terms.html`
- `k8s/` deployment manifests

`README.md` references `docs/API.md`, `docs/DEPLOYMENT.md`, `docs/DEVELOPMENT.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/INTEGRATION.md`, `docs/MODEL_AND_ROLE_MANAGEMENT.md`, and `docs/AI_VERIFICATION_PROMPT.md`, but those files are not present in the repository as of 2026-06-12. Agents must not invent them as authoritative sources. If the owner later adds them, this IPS overlay must link to those files as upstream sources.

## Preserved Product Intent

Shop Assistant is an AI shopping assistant for the user phrase "I want" / "Ya khochu": it accepts voice or text product requests, refines the request through feedback, searches the internet for real merchant offers, compares results by the user's priorities, and redirects the user to the chosen merchant product page.

The initial-stage requirements preserved from `README.md` are:

- collect and compare products by user priorities such as price, quality, and location/delivery;
- search for multiple distinct products in one request;
- support multiple profiles or recipients under one account;
- optionally save reusable search criteria;
- keep lead capture, AI analysis, admin prompts, agent communication logs, legal pages, and deployment health operational.

## Intent Preservation Chain

Every implementation cycle must preserve this chain:

```text
Shop Assistant intent
  -> Project invariants
  -> Goal
  -> Task
  -> Goal impact
  -> Execution plan
  -> Context package
  -> Coding prompt
  -> Code or documentation changes
  -> Validation report
  -> TASKS.md and STATE.json update
```

## Immutable Intent Rules

Agents must not change these rules without owner approval:

- Shop Assistant must return real merchant URLs; fabricated product links are forbidden.
- AI voice/text searches must not be stored beyond the session scope documented by the project.
- External search calls must be rate-limited and must remain delegated through approved service boundaries.
- Search provider secrets belong in configured services and environment variables, never in source, prompts, docs, logs, or reports.
- `ai-microservice` owns ASR, LLM processing, lead analysis, and delegated shop search orchestration.
- `auth-microservice` owns user identity, JWT validation, and account-bound access.
- `database-server` owns persistence for sessions, messages, search runs, results, choices, lead requests, profiles, saved criteria, prompts, and agent communication logs.
- `logging-microservice` owns central operation and error logging.
- Admin prompt and model management must remain JWT-protected.
- Legal transparency for GDPR, ePrivacy/cookies, and EU AI Act Art. 50 must remain visible on the public service.
- Lead submissions must be stored locally and forwarded to the leads and AI services according to the documented flow.
- Production deployment requires explicit owner approval in the current session.

## Required Artifacts Before Coding

For each implementation task, create or update:

- task document under `docs/intent-preservation/tasks/`;
- execution plan under `docs/intent-preservation/execution-plans/`;
- context package under `docs/intent-preservation/context-packages/`;
- coding prompt under `docs/intent-preservation/coding-prompts/`;
- validation report draft under `docs/intent-preservation/validation-reports/`.

These documents may be `draft` before coding, but they must be meaningful and traceable. Do not use vague placeholders. If information cannot be derived, use `[MISSING: ...]` or `[UNKNOWN: ...]` and block coding when the missing item affects behavior, privacy, legal compliance, external contracts, or ownership boundaries.

## Completion Requirements

Before ending a coding session:

- validation evidence must be recorded in the validation report;
- `TASKS.md` must reflect completed or blocked task state by appending evidence, not rewriting history;
- `STATE.json` must reflect current machine-readable state;
- deviations from the execution plan must be listed;
- the next command must be concrete.
