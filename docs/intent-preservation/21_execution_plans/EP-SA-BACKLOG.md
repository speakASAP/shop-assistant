# Execution Plan: Current Backlog Work

    id: EP-SA-BACKLOG
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/11_tasks/TASK-SA-G1-T1.md
      - docs/intent-preservation/11_tasks/TASK-SA-G4-T1.md
    downstream:
      - docs/intent-preservation/13_context_packages/CP-SA-BACKLOG.md
      - docs/intent-preservation/14_prompts/PROMPT-SA-BACKLOG.md
      - docs/intent-preservation/12_validation/VAL-SA-BACKLOG.md
    related_adrs: []

## Metadata

Shared draft plan for the two current root backlog items. Split into task-specific plans before coding if implementation scope diverges.

## Upstream Traceability

TASK-SA-G1-T1, TASK-SA-G4-T1, TASKS.md.

## Goal Impact

Search quality and UX observability.

## Project Invariants

Real merchant URLs, privacy, no secrets, authenticated diagnostics, approved AI/search boundaries.

## Sensitive-Data Handling

Use aggregate or redacted data. Do not paste raw production searches, contact details, voice transcripts, or customer identifiers into docs or prompts.

## Contract Validation Plan

Before coding, declare whether APIs, Prisma schema, AI service contracts, search contracts, or report outputs change.

## Replay/Determinism Plan

Define evidence window, sample size, redaction method, and stable validation fixtures before implementation.

## Scope

Analyze failed searches and session UX evidence. Propose or implement bounded improvements after gate approval.

## Non-goals

No production data disclosure, no fabricated search results, no admin access weakening.

## Files To Inspect

src/sessions, src/admin, src/profiles, prisma/schema.prisma, public admin and test pages, approved logs or database extracts.

## Files To Create

Task-specific reports and validation reports as needed.

## Files To Modify

[MISSING: fill after owner selects the concrete implementation approach.]

## Files That Must Not Be Modified

.env, .env backups, secret manifests, unrelated services, immutable intent docs.

## Implementation Steps

1. Obtain approved redacted evidence source.
2. Categorize failures or UX friction.
3. Decide whether work is report-only or code-changing.
4. Split task-specific execution plan if code changes are needed.
5. Implement within approved scope.
6. Validate and record evidence.

## Test Plan

Depends on selected implementation. At minimum run build or tests and API or manual checks for changed flows.

## Validation Plan

Record evidence in VAL-SA-BACKLOG.md or task-specific report.

## Gate Commands

npm run build
Additional commands: [MISSING: define after implementation scope is selected.]

## Documentation Updates

Update task, plan, context package, prompt, validation report, and TASKS.md append-only completion evidence.

## Rollback Plan

Revert task-scoped changes before deployment. Keep report-only artifacts if useful and marked draft.

## Agent Handoff Prompt

Do not start coding until evidence source, redaction rules, files to modify, contract impact, and validation commands are filled.

## Completion Checklist

- [ ] Evidence source approved.
- [ ] Sensitive data redacted.
- [ ] Scope selected.
- [ ] Validation evidence recorded.
