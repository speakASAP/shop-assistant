# Subsystem: Admin AI Controls

    id: SA-SUB-003
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/04_systems/SYS-001-shop-assistant.md
      - src/admin/
      - public/admin.html
    downstream:
      - docs/intent-preservation/10_features/FEAT-003-admin-observability.md
    related_adrs: []

## Purpose

Allow admins to manage prompts, models, roles, execution mode, and diagnostic flow inspection safely.

## Parent System

SA-SYS-001.

## Responsibilities

Prompt CRUD, model listing, role and model selection, agent diagnostics, and JWT protection.

## Interfaces

/api/admin endpoints and public/admin.html.

## Dependencies

Auth and roles guards, Prisma AgentPrompt, AI model list, agent communication records.

## Data Ownership

Owns prompt metadata. Does not own provider credentials or model execution.

## Failure Modes

Secrets in prompts, weakened admin protection, overexposed diagnostics.

## Validation Criteria

Changed work must verify authorization, prompt persistence, model role behavior, and absence of secrets in examples or logs.
