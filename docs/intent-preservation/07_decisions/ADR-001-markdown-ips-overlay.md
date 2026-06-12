# ADR-001: Use Markdown IPS Overlay In Repository

    id: SA-ADR-001
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/00_constitution/CONSTITUTION.md
      - docs/intent-preservation/README.md
    downstream:
      - docs/intent-preservation/
    related_adrs: []

## Context

Shop Assistant has root intent files and a partial IPS overlay. The company standard uses a numbered Markdown documentation structure.

## Decision

Keep root files as upstream source evidence and create the company IPS structure under docs/intent-preservation.

## Consequences

Existing entry files remain useful. Future work can follow the full IPS chain without moving current root documents.
