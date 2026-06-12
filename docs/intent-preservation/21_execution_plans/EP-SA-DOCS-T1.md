# Execution Plan: Install Company IPS Structure

    id: EP-SA-DOCS-T1
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/11_tasks/TASK-SA-DOCS-T1.md
    downstream:
      - docs/intent-preservation/12_validation/VAL-SA-DOCS-T1.md
    related_adrs:
      - SA-ADR-001

## Metadata

Documentation-only plan for the remote shop-assistant repository.

## Upstream Traceability

TASK-SA-DOCS-T1, company IPS standard, and root project docs.

## Goal Impact

Creates traceability for all current project goals.

## Project Invariants

No runtime behavior changes, no secrets, root intent preserved.

## Sensitive-Data Handling

Use only repository documentation and source structure. Do not include env values or production data.

## Contract Validation Plan

No API or schema contract changes.

## Replay/Determinism Plan

Documentation generation is deterministic from cited source files and current date.

## Scope

Create numbered IPS documents under docs/intent-preservation.

## Non-goals

No deploy, no code changes, no root state rewrite.

## Files To Inspect

README.md, BUSINESS.md, SYSTEM.md, TASKS.md, STATE.json, prisma/schema.prisma, src/sessions, src/profiles, src/admin, src/leads, public, scripts/deploy.sh, existing docs/intent-preservation.

## Files To Create

Numbered IPS markdown files under docs/intent-preservation.

## Files To Modify

Existing docs/intent-preservation entry files may remain compatibility entry points.

## Files That Must Not Be Modified

.env, .env backups, source code, Prisma schema, deployment manifests, root state files, and production secrets.

## Implementation Steps

Inspect standard, inspect remote project, create hierarchy, add project-specific documents, validate presence and missing markers.

## Test Plan

Run file listing and marker scans.

## Validation Plan

Record evidence in VAL-SA-DOCS-T1.md.

## Gate Commands

find docs/intent-preservation -maxdepth 3 -type f | sort
grep -R "[MISSING:\|[UNKNOWN:" docs/intent-preservation || true

## Documentation Updates

This plan creates the documentation updates.

## Rollback Plan

Remove newly added files under docs/intent-preservation before commit if owner rejects the structure.

## Agent Handoff Prompt

Use this IPS structure before future coding. Select a task, verify traceability and gates, then code only within plan scope.

## Completion Checklist

- [ ] Files created.
- [ ] Validation recorded.
- [ ] Remaining missing markers reported.
