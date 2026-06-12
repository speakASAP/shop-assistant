# SA-DOCS-T1: Install Intent Preservation System

```yaml
id: SA-DOCS-T1
status: validated
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - owner request from 2026-06-12
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - TASKS.md
  - STATE.json
downstream:
  - docs/intent-preservation/README.md
  - docs/intent-preservation/TRACEABILITY_MATRIX.md
  - docs/intent-preservation/PRE_CODING_GATE.md
  - docs/intent-preservation/validation-reports/VAL-SA-IPS-INSTALL.md
related_adrs: []
```

## Objective

Create the company-standard Intent Preservation System documentation structure for `shop-assistant` on the remote `alfares` server.

## Upstream Links

- Goal: Documentation standard applied to Shop Assistant.
- Intent: `BUSINESS.md`, `SYSTEM.md`, `README.md`.
- Invariants: `docs/intent-preservation/README.md` and `docs/intent-preservation/TRACEABILITY_MATRIX.md`.

## Goal Impact

This task makes the original Shop Assistant intent explicit and creates the required pre-coding documentation chain for future implementation work.

## Project Invariant Impact

No runtime behavior changes. The task preserves all product, privacy, legal, service-boundary, and deployment invariants by documenting them as future gates.

## Sensitive-Data Classification

Allowed: public repository documentation, source file paths, high-level service boundaries, synthetic examples.

Forbidden: `.env` values, JWTs, provider API keys, production user data, lead content, voice transcripts, raw search sessions, real customer identifiers.

## Contract/Schema Impact

Documentation-only. No API, Prisma, Kubernetes, or public UI contract changes.

## Privacy/Legal Impact

Documentation-only. The pack records GDPR, ePrivacy/cookie, and EU AI Act transparency as protected future checks.

## External Service Boundary Impact

Documentation-only. The pack records ownership boundaries for ai-microservice, auth-microservice, database-server, logging-microservice, leads-microservice, and external search providers.

## Replay/Determinism Impact

No state-changing runtime logic. Future implementation work must document replay, idempotency, transaction, and deterministic-validation impact before coding.

## Scope

- Create `docs/intent-preservation/` structure.
- Add README, traceability matrix, pre-coding gate, task template, backlog task docs, execution plan, context package, coding prompt, and validation reports.
- Update `AGENTS.md` to require the IPS workflow.

## Non-Goals

- Do not change runtime code.
- Do not deploy.
- Do not create or modify secrets.
- Do not invent absent README-linked docs as completed evidence.

## Acceptance Criteria

- Required IPS folders and files exist.
- Documents cite real upstream sources present in the repository.
- Missing upstream docs are explicitly marked absent.
- Future coding is gated by the IPS workflow.
- Validation report records evidence for this install.

## Required Context

- `BUSINESS.md`
- `SYSTEM.md`
- `README.md`
- `TASKS.md`
- `STATE.json`
- `AGENTS.md`
- `prisma/schema.prisma`
- `public/privacy.html`
- `public/cookies.html`
- `public/terms.html`

## Validation Task

Confirm the files exist, contain required sections, and do not contain secrets.

## Required Gates

- Documentation validation gate
- Completion gate
