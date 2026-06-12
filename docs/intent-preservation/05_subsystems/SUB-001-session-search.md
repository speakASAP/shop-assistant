# Subsystem: Session Search

    id: SA-SUB-001
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/04_systems/SYS-001-shop-assistant.md
      - src/sessions/
    downstream:
      - docs/intent-preservation/10_features/FEAT-001-request-to-results.md
    related_adrs: []

## Purpose

Convert user requests and feedback into refined searches, persisted results, comparison output, assistant messages, and merchant redirects.

## Parent System

SA-SYS-001.

## Responsibilities

Session creation, text or audio input, AI transcription, refinement, location extraction, multi-intent splitting, comparison, presentation, persistence, choices, and diagnostics.

## Interfaces

POST /api/sessions, POST /api/sessions/:id/query, POST /api/sessions/:id/feedback, result, choice, redirect, messages, and agent-communications endpoints.

## Dependencies

Prisma, logging, AI service, search service, execution mode, agent queue, and ai-microservice.

## Data Ownership

Owns session-scoped local persistence. Does not own AI provider secrets or identity authority.

## Failure Modes

Downstream AI or search failure, empty input, missing session or result, latency or rate-limit pressure, excessive diagnostic logging.

## Validation Criteria

Changed work must verify query, feedback, results, choice, redirect, diagnostics, privacy, and real URL behavior.
