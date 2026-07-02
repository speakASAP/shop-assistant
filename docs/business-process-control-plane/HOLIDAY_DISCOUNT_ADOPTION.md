# BPCP Holiday Discount Adoption

Status: service-local adoption contract
Date: 2026-07-02
Service: `shop-assistant`
Central contract pack: `statex-ecosystem/docs/business-process-control-plane/`

## Role

Assistant/recommendation surface for BPCP-guided upsell and holiday messaging.

## Responsibilities

- Use active process and campaign refs to explain eligible offers.
- Never quote a discount unless backed by pricing authority.
- Preserve user consent and hosted auth boundaries.

## Required interfaces

- Read-only process/slot decision.
- Optional product recommendation/upsell refs.
- Customer context through approved auth path.

## Boundaries

- This service must not become the global owner of BPCP process definitions.
- This service must fail closed on invalid or unknown BPCP process versions.
- This service must keep existing domain ownership and invariants.
- This service must expose or document dry-run behavior before live execution.
- This service must not overwrite existing service contracts without an
  explicit integration owner and validation owner.

## Holiday Discount pilot expectations

- Recognize `holiday-discount-2026` only through versioned BPCP contracts.
- Preserve `processId`, `processVersion`, and `policyId` in every relevant
  decision, event, snapshot, log, or rendered experience.
- Support rollback by respecting BPCP pause and retired states.
- Keep process display and process execution separate where applicable.

## Blockers and unknowns

- [MISSING: exact assistant-to-commerce quote contract]

## Validation evidence required before implementation is accepted

- Assistant response fixture cites active holiday offer only when eligible.
- No hallucinated discount amount.
- Consent/legal checks remain active.

## Parallel handoff

This adoption doc is safe for a focused service owner to implement in parallel
after the central BPCP schemas are accepted. The service owner must not edit
shared BPCP schemas directly; schema changes go through the BPCP integration
owner.
