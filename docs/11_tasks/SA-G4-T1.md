# SA-G4-T1: UX Improvement Report From Session Data

```yaml
id: SA-G4-T1
status: complete
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-21
completeness_level: complete
upstream:
  - TASKS.md
  - README.md
  - BUSINESS.md
  - SYSTEM.md
  - docs/TRACEABILITY_MATRIX.md
downstream:
  - docs/21_execution_plans/EP-SA-BACKLOG.md
  - docs/13_context_packages/CP-SA-BACKLOG.md
  - docs/14_prompts/PROMPT-SA-BACKLOG.md
  - docs/12_validation/VAL-SA-BACKLOG.md
related_adrs: []
```

## Objective

Generate a UX improvement report from session data while preserving privacy, legal transparency, and truthful result handling.

## Upstream Links

- Goal: SA-G4 Agent admin and observability.
- Backlog: `TASKS.md` item "Generate UX improvement report based on session data".
- Intent: `README.md`, `BUSINESS.md`, `SYSTEM.md`.
- Invariants: `docs/README.md`.

## Goal Impact

This task helps improve the public request flow, test interface, admin diagnostics, profile selection, saved criteria experience, and feedback loop without changing the service mission.

## Project Invariant Impact

Applies to privacy-safe analytics, public legal visibility, AI transparency, admin JWT protection, and diagnostic observability.

## Sensitive-Data Classification

Allowed: aggregated session metrics, UX friction categories, synthetic examples, anonymized counts, route-level observations.

Forbidden: raw user query text, voice transcripts, lead contact details, personal profile names tied to identities, JWTs, secrets, raw logs with personal data.

## Contract/Schema Impact

Documentation/reporting task by default. If code is added for metrics extraction, any database reads, admin endpoints, or UI changes must be scoped in the execution plan before coding.

## Privacy/Legal Impact

The report must avoid exposing personal data and must not recommend removing EU AI Act, GDPR, or cookie transparency. Any retention recommendation requires owner review.

## External Service Boundary Impact

`database-server` remains session persistence owner; `logging-microservice` remains central logging owner. Any AI-assisted report generation must use approved `ai-microservice` pathways and avoid sending sensitive raw data unless owner approved.

## Replay/Determinism Impact

Report generation should be repeatable from a declared query window and metric definition. If using sampled data, the sample rule must be documented.

## Scope

- Define privacy-safe metrics and data window.
- Inspect public, test, admin, profile, and saved criteria flows.
- Produce a report with prioritized UX recommendations and evidence type.
- Add code only if the execution plan explicitly allows it.

## Non-Goals

- Do not deploy without owner approval.
- Do not expose raw session data in documentation.
- Do not weaken admin auth or legal notices.
- Do not redesign the product beyond recommendations unless owner selects a follow-up implementation task.

## Acceptance Criteria

- Report sources and anonymization method are documented.
- Recommendations map to preserved intent and user workflows.
- No secrets or raw personal data appear in the report.
- Any code changes pass `npm run build` and focused checks.

## Required Context

- `public/index.html`
- `public/test.html`
- `public/admin.html`
- `src/sessions/`
- `src/profiles/`
- `src/admin/`
- `prisma/schema.prisma`

## Validation Task

Record report generation method, data-safety checks, and any build/test evidence in `VAL-SA-BACKLOG.md`.

## Required Gates

- Shop Assistant pre-coding gate
- Privacy/legal review gate
- Admin auth preservation gate
- Completion gate
