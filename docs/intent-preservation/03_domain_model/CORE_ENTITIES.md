# Shop Assistant Core Entities

    id: SA-CORE-ENTITIES
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - prisma/schema.prisma
      - README.md
    downstream:
      - docs/intent-preservation/04_systems/SYS-001-shop-assistant.md
    related_adrs: []

## Entities

Session, Message, SearchRun, SearchResult, Choice, AgentPrompt, LeadRequest, AgentCommunication, AccountProfile, and SavedSearchCriteria are the local persisted entities in prisma/schema.prisma.

## Data Ownership

Shop Assistant owns local Prisma persistence. Identity belongs to auth-microservice. ASR, LLM, and search orchestration belong to ai-microservice. Central logging belongs to logging-microservice.
