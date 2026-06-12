# Task: Install Company Intent Preservation Structure

    id: SA-DOCS-T1
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/09_milestones/MS-001-intent-foundation.md
      - docs/intent-preservation/00_constitution/CONSTITUTION.md
    downstream:
      - docs/intent-preservation/21_execution_plans/EP-SA-DOCS-T1.md
      - docs/intent-preservation/12_validation/VAL-SA-DOCS-T1.md
    related_adrs:
      - SA-ADR-001

## Objective

Create a company-standard IPS documentation structure for Shop Assistant without changing runtime behavior.

## Upstream Links

Root project docs, current partial IPS overlay, and company IPS standard.

## Goal Impact

Supports all goals by making traceability explicit before implementation work.

## Project Invariant Impact

Documents invariants. Does not change runtime behavior.

## Sensitive-Data Classification

Documentation-only. No secrets or production user data should be included.

## Contract/Schema Impact

None.

## Replay/Determinism Impact

None.

## Scope

Add IPS markdown files under docs/intent-preservation.

## Non-goals

No source code, schema, environment, deployment, or root state mutation.

## Acceptance Criteria

Numbered IPS layers exist, documents have metadata and traceability, backlog tasks map to artifacts, and missing README-linked upstream docs are called out.

## Required Context

BUSINESS.md, SYSTEM.md, README.md, TASKS.md, STATE.json, prisma/schema.prisma, source controllers and services, existing docs/intent-preservation.

## Validation Task

Run file listing and marker scan. Record validation in VAL-SA-DOCS-T1.md.

## Required Gates

Documentation completeness check and pre-coding gate review.
