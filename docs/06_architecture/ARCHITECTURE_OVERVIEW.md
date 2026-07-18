# Architecture Overview

    id: SA-ARCH-OVERVIEW
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - SYSTEM.md
      - README.md
      - docs/04_systems/SYS-001-shop-assistant.md
    downstream:
      - docs/07_decisions/ADR-001-markdown-ips-overlay.md
    related_adrs:
      - SA-ADR-001

## Runtime Shape

Shop Assistant is a NestJS service with static public and admin pages, Prisma PostgreSQL persistence, shared microservice integrations, and Kubernetes nginx deployment. README.md mentions Next.js, but the current repository exposes static public HTML pages. Any frontend architecture change requires documentation first.

## Primary Flows

Session query, feedback refinement, profile and criteria management, lead capture, and admin prompt or diagnostic operation.

## Integration Boundaries

ai-microservice owns AI and delegated search orchestration. auth-microservice owns identity. database-server owns PostgreSQL. logging-microservice owns central logs. leads-microservice owns CRM and notifications.

## Persistence Boundary

Prisma models are the repository-local schema contract. Schema changes require task, plan, contract validation, migration validation, rollback plan, and deployment gate evidence.

## Security And Privacy Boundary

No secrets or raw production data in source, docs, logs, prompts, screenshots, reports, or validation examples. Admin and user-owned operations stay authenticated.
