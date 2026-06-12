# Subsystem: Leads, Legal, And Operations

    id: SA-SUB-004
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/04_systems/SYS-001-shop-assistant.md
      - src/leads/
      - public/privacy.html
      - public/cookies.html
      - public/terms.html
      - scripts/deploy.sh
    downstream:
      - docs/intent-preservation/10_features/FEAT-004-leads-legal-operations.md
    related_adrs: []

## Purpose

Preserve lead capture, legal transparency, health, deployment, and operational safety.

## Parent System

SA-SYS-001.

## Responsibilities

Save lead requests, forward to leads and AI services, keep legal pages reachable, maintain health and deployment, and keep secrets in environment stores.

## Interfaces

POST /api/leads/submit, public legal pages, /health, deployment scripts, and Kubernetes manifests.

## Dependencies

Leads service, AI service, Prisma, logging, static pages, Kubernetes nginx, environment variables.

## Data Ownership

Owns local lead request record and downstream IDs. Does not own CRM or AI analysis storage after forwarding.

## Failure Modes

Upload mishandling, unreachable legal pages, committed secrets, deployment without approval.

## Validation Criteria

Changed work must verify local save, downstream behavior where in scope, legal route reachability, no committed secrets, health, and rollback evidence.
