# Shop Assistant Glossary

    id: SA-GLOSSARY
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - README.md
      - prisma/schema.prisma
    downstream:
      - docs/intent-preservation/03_domain_model/CORE_ENTITIES.md
    related_adrs: []

## Terms

- Account profile: recipient or persona under an account.
- Agent communication: diagnostic internal agent workflow message.
- Choice: selected search result and merchant URL.
- Lead request: contact or voice submission saved locally and forwarded downstream.
- Priority order: comparison priorities such as price, quality, or location.
- Saved search criteria: reusable search template with priorities, product intents, filters, and optional profile.
- Search intent: product-specific query derived from a user request.
- Search run: persisted execution of product search for a session.
- Session: interaction scope for messages, searches, choices, priorities, profile, and diagnostics.
