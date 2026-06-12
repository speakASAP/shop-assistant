# Shop Assistant Vision

    id: SA-VISION
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/intent-preservation/00_constitution/CONSTITUTION.md
      - BUSINESS.md
      - README.md
    downstream:
      - docs/intent-preservation/02_business_case/BUSINESS_CASE.md
      - docs/intent-preservation/22_goal_impact/GOAL_IMPACT_MAPPING.md
    related_adrs: []

## Original Intent

Shop Assistant is an AI shopping assistant for the user phrase I want or Ya khochu. It accepts voice or text product requests, refines the request through feedback, searches for product options on the internet, compares results according to user priorities, and redirects the user to a real merchant product page.

## Product Promise

The service reduces the work needed to find suitable products by combining conversational input, product search, comparison, profile-aware preferences, saved criteria, and merchant redirect.

## Initial-Stage Requirements

- Collect and compare products by user priorities such as price, quality, location, or delivery.
- Search for multiple distinct products in one request.
- Support multiple profiles or recipients inside one account.
- Save reusable search criteria when the user chooses this.
- Preserve lead capture, AI analysis, admin prompt and model management, diagnostics, legal pages, and deployability.

## Constraints

Real merchant URLs only, no provider secrets in this repo, privacy-respecting session scope, public legal transparency, and approved microservice boundaries.
