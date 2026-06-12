# PROMPT-SA-BACKLOG: Implement Current Shop Assistant Backlog

```yaml
id: PROMPT-SA-BACKLOG
status: draft
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/intent-preservation/context-packages/CP-SA-BACKLOG.md
  - docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md
downstream:
  - docs/intent-preservation/validation-reports/VAL-SA-BACKLOG.md
related_adrs: []
```

## Task Summary

Implement exactly one owner-selected Shop Assistant backlog task.

## Execution Plan Link

Use `docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md`.

## Required Context

Read these documents before source edits:

- `BUSINESS.md`
- `SYSTEM.md`
- `README.md`
- `TASKS.md`
- `STATE.json`
- `docs/intent-preservation/README.md`
- `docs/intent-preservation/TRACEABILITY_MATRIX.md`
- `docs/intent-preservation/PRE_CODING_GATE.md`
- selected task document under `docs/intent-preservation/tasks/`
- `docs/intent-preservation/context-packages/CP-SA-BACKLOG.md`

Inspect only the source files listed by the selected task and execution plan.

## Allowed Changes

Allowed only after the pre-coding gate passes:

- selected session/search/admin/profile/public/report files named by the execution plan;
- focused validation scripts or docs explicitly named by the execution plan;
- `docs/intent-preservation/validation-reports/VAL-SA-BACKLOG.md`;
- `TASKS.md` by append-only completion or blocked notes;
- `STATE.json` for current state and next focus.

## Forbidden Changes

- Do not deploy without owner approval.
- Do not commit `.env`, JWTs, API keys, or service credentials.
- Do not expose raw production user queries, voice transcripts, lead content, contact details, or personal profile data in docs/tests/logs.
- Do not fabricate merchant URLs, prices, availability, or source names.
- Do not weaken admin JWT protection.
- Do not remove GDPR, ePrivacy/cookie, or EU AI Act transparency.
- Do not move ASR, LLM, auth, database, logging, or leads ownership into this service without owner-approved contract change.

## Implementation Instructions

1. Identify the selected task: `SA-G1-T1` or `SA-G4-T1`, unless the owner explicitly selects another task.
2. Run and record the pre-coding gate.
3. Keep changes inside the selected task scope.
4. Define privacy-safe data handling before reading or exporting session data.
5. Implement the smallest complete change or report.
6. Run validation commands.
7. Update `VAL-SA-BACKLOG.md`, `TASKS.md`, and `STATE.json`.
8. Report files changed, validation results, deviations, risks, and next command.

## Acceptance Criteria

- Selected task maps to preserved Shop Assistant intent.
- Sensitive data and secrets are not exposed.
- Service ownership boundaries remain intact.
- Public legal transparency and admin auth remain intact.
- Validation evidence is recorded.
- The next task or command is clear.

## Validation Commands

```bash
npm run build
```

Add focused checks appropriate to the selected task.

## Expected Output

Report back with selected task, files changed, privacy/legal handling summary, external service boundary summary, validation commands and results, remaining risks, and next command.
