# Subsystem: Profiles And Saved Criteria

    id: SA-SUB-002
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/04_systems/SYS-001-shop-assistant.md
      - src/profiles/
      - prisma/schema.prisma
    downstream:
      - docs/10_features/FEAT-002-profiles-saved-criteria.md
    related_adrs: []

## Purpose

Support multi-recipient shopping and reusable criteria per authenticated account.

## Parent System

SA-SYS-001.

## Responsibilities

CRUD account profiles, CRUD saved criteria, run saved criteria, and scope access by authenticated user.

## Interfaces

/api/profiles and /api/saved-criteria endpoints protected by JwtAuthGuard.

## Dependencies

Auth guard, Prisma, sessions service.

## Data Ownership

Owns profile and saved criteria records. User identity authority belongs to auth-microservice.

## Failure Modes

Cross-user leakage, stale saved filters after schema or search contract changes, missing auth context.

## Validation Criteria

Changed work must test authenticated ownership boundaries and saved-criteria execution behavior.
