# EP-SA-BACKLOG: Current Shop Assistant Backlog

```yaml
id: EP-SA-BACKLOG
status: draft
source_task:
  - ../tasks/SA-G1-T1.md
  - ../tasks/SA-G4-T1.md
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Metadata

Goal set: current `TASKS.md` backlog.

Lifecycle state: ready for future owner-selected implementation after pre-coding gate evidence is recorded.

## Upstream Traceability

- Original intent: `BUSINESS.md`, `README.md`
- System boundaries: `SYSTEM.md`
- Current state: `STATE.json`
- Backlog: `TASKS.md`
- IPS matrix: `docs/intent-preservation/TRACEABILITY_MATRIX.md`

## Goal Impact

The current backlog targets the quality loop around failed searches and UX improvement. Both tasks protect the same core promise: users should be able to state product intent naturally, refine results, compare real offers, and reach merchant pages while privacy and legal expectations remain intact.

## Project Invariants

- Real merchant URLs only; no fabricated links.
- Session query storage remains limited to documented session scope.
- External search calls are rate-limited and handled through approved service boundaries.
- Search and AI secrets stay outside repository content.
- AI service, auth service, database service, logging service, and leads service ownership remains intact.
- Admin operations remain JWT-protected.
- GDPR, ePrivacy/cookie, and EU AI Act transparency remains visible.
- Production deployment requires owner approval in the current session.

## Sensitive-Data Handling

Classification: internal implementation documentation, source paths, aggregated metrics, synthetic examples.

Do not place `.env` values, JWTs, provider API keys, production user queries, voice transcripts, lead messages, contact details, raw search payloads, or personal profile data in prompts, reports, tests, screenshots, or committed docs.

## Contract Validation Plan

For SA-G1-T1, validate request and response behavior for session query, feedback, results, and redirect endpoints if touched. Preserve response compatibility unless a contract change is explicitly approved and documented.

For SA-G4-T1, default to report-only output. If code is added, document any new admin endpoint, script, output file, or database query contract before editing.

## Privacy/Legal Plan

Before any data analysis, define the data window and anonymization strategy. Raw user text, voice transcripts, lead content, contact details, and secrets must not appear in documentation or terminal output. Legal pages and AI transparency notices must remain reachable.

## Replay/Determinism Plan

For analytics/reporting, define repeatable metric queries or sampling rules. For search-quality changes, validate deterministic request normalization and error handling with synthetic data. External search output should be validated by shape, real URL presence, and failure behavior rather than exact ordering.

## Scope

- SA-G1-T1: failed-search analysis and targeted response-quality improvements.
- SA-G4-T1: privacy-safe UX improvement report from session data.
- Shared: update validation report, `TASKS.md`, and `STATE.json` after implementation.

## Non-Goals

- Do not deploy without owner approval.
- Do not rewrite the product mission.
- Do not create permanent storage of raw searches beyond approved session behavior.
- Do not move AI/search provider ownership into this service without owner-approved contract change.
- Do not weaken legal transparency or admin JWT protections.

## Files To Inspect

- `BUSINESS.md`
- `SYSTEM.md`
- `README.md`
- `TASKS.md`
- `STATE.json`
- `prisma/schema.prisma`
- `src/sessions/sessions.controller.ts`
- `src/sessions/sessions.service.ts`
- `src/sessions/ai.service.ts`
- `src/sessions/search.service.ts`
- `src/profiles/`
- `src/admin/`
- `src/leads/`
- `public/index.html`
- `public/test.html`
- `public/admin.html`
- `public/privacy.html`
- `public/cookies.html`
- `public/terms.html`

## Files To Modify

Allowed implementation files depend on the selected task and must be narrowed during the pre-coding gate.

Always allowed documentation files for selected backlog work:

- `docs/intent-preservation/validation-reports/VAL-SA-BACKLOG.md`
- `TASKS.md`
- `STATE.json`

## Files That Must Not Be Modified

- `.env` and secret files;
- `BUSINESS.md` unless owner explicitly approves changing immutable intent;
- public legal pages unless the selected task is legal/compliance work;
- Kubernetes manifests or deploy scripts unless the selected task is operations work;
- unrelated services outside `shop-assistant`.

## Implementation Steps

1. Select exactly one task from `TASKS.md` or owner instruction.
2. Complete the Shop Assistant pre-coding gate and record evidence.
3. Inspect only the files listed for the selected task.
4. Define privacy-safe data handling before reading or exporting session data.
5. Implement the smallest complete change or report that satisfies the task.
6. Run validation commands.
7. Update `VAL-SA-BACKLOG.md`, `TASKS.md`, and `STATE.json`.
8. Record deviations and the next concrete command.

## Validation Plan

Minimum validation for code changes:

```bash
npm run build
```

For documentation/reporting tasks, add a file existence check and sensitive-data scan before completion.

## Rollback Plan

Revert only the selected task changes. Preserve validation evidence by appending a rollback note rather than deleting history. Do not revert unrelated owner or agent changes.
