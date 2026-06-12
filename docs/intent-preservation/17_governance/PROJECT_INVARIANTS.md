# Project Invariants

    id: SA-PROJECT-INVARIANTS
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/00_constitution/CONSTITUTION.md
    downstream:
      - docs/intent-preservation/PRE_CODING_GATE.md
    related_adrs: []

## Invariants

- Real merchant URLs only.
- No fabricated prices, availability, merchants, or links.
- Session and search data retention remains within documented scope.
- No secrets or raw production data in source, prompts, logs, examples, screenshots, reports, or docs.
- AI and search ownership remains in approved services.
- Auth ownership remains in auth-microservice.
- Admin and user-owned profile or criteria operations remain protected.
- Legal transparency and cookie, privacy, terms surfaces remain reachable.
- Lead local-save and downstream-forwarding flow remains preserved when lead work is in scope.
- Production deployment requires active owner approval.
