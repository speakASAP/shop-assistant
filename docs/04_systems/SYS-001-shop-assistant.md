# System: Shop Assistant Service

    id: SA-SYS-001
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/01_vision/VISION.md
      - docs/02_business_case/BUSINESS_CASE.md
      - SYSTEM.md
      - README.md
    downstream:
      - docs/05_subsystems/SUB-001-session-search.md
      - docs/05_subsystems/SUB-002-profile-criteria.md
      - docs/05_subsystems/SUB-003-admin-ai.md
      - docs/05_subsystems/SUB-004-leads-legal-ops.md
    related_adrs:
      - SA-ADR-001

## Purpose

Provide backend, public pages, admin surfaces, persistence, and integration boundaries for AI-assisted shopping search and lead capture.

## Responsibilities

Create sessions, process text and audio shopping requests, delegate AI work, persist records, protect admin and user-owned surfaces, serve public and legal pages, integrate with shared services, and remain deployable.

## Non-responsibilities

Owning ASR or LLM execution, search provider credentials, user identity authority, or merchant data truth.

## Inputs

User text, audio URL, feedback, result IDs, profile and criteria data, lead form data, admin prompt and model changes, environment config, and downstream responses.

## Outputs

Search results, assistant messages, redirect URLs, criteria execution, lead forwarding results, prompt and model records, logs, health responses, and deployment artifacts.

## Dependencies

ai-microservice, auth-microservice, PostgreSQL database-server, logging-microservice, leads-microservice, Kubernetes nginx, and environment variables.

## Upstream Traceability

Traces to BUSINESS.md, SYSTEM.md, README.md, prisma/schema.prisma, and SA-VISION.

## Downstream Artifacts

Subsystems, features, tasks, execution plans, context packages, prompts, validation reports, audits, operations, and governance docs.

## Validation Criteria

Changed code must pass relevant API or build checks and preserve privacy, legal, external-service, schema, replay, and deployment gates.

## Open Questions

[MISSING: owner should confirm whether README-linked legacy docs should be restored or replaced by IPS documents.]
