# Shop Assistant Constitution

    id: SA-CONSTITUTION
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - BUSINESS.md
      - SYSTEM.md
      - README.md
      - AGENTS.md
    downstream:
      - docs/intent-preservation/01_vision/VISION.md
      - docs/intent-preservation/17_governance/PROJECT_INVARIANTS.md
    related_adrs: []

## Purpose

This constitution defines non-negotiable rules for Shop Assistant. It is derived from repository intent and the company Intent Preservation System. After owner review, AI agents must treat it as protected and propose changes through vision evolution or change control.

## Project Laws

1. Shop Assistant turns voice or text shopping intent into useful product search, refinement, comparison, and redirects to real merchant pages.
2. Search results, prices, availability, merchants, and URLs must not be fabricated.
3. User voice and text search data must remain within documented session and persistence scope.
4. Secrets, raw production data, confidential identifiers, and real customer data must not enter prompts, examples, tests, logs, screenshots, reports, or docs.
5. ASR, LLM processing, lead AI analysis, and delegated shop search orchestration remain owned by ai-microservice unless an approved ADR changes this.
6. JWT validation and user identity remain owned by auth-microservice.
7. Admin prompt, model, profile, and criteria operations must remain protected.
8. GDPR, ePrivacy cookie, and EU AI Act transparency surfaces must remain reachable.
9. Production deployment requires explicit owner approval in the active work session.

## AI Agent Rules

Do not code from vague intent. Create or update task, goal-impact, execution-plan, context-package, coding-prompt, and validation artifacts before implementation. Use [MISSING: ...] and [UNKNOWN: ...] markers where evidence is not available.
