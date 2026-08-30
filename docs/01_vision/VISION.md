# Project Vision: Shop Assistant

> Protected document. Human approval is required.

```yaml
id: VISION-shop-assistant
status: approved
owner: project owner
created: 2026-06-12
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - ../00_constitution/CONSTITUTION.md
  - ../../BUSINESS.md
  - ../../README.md
downstream:
  - ../22_goal_impact/GOAL-IMPACT-TASK-001.md
```

## one-sentence vision

Let shoppers turn a voice or text "I want" ("Я хочу") request into a refined, price-compared, real-merchant redirect, without over-retaining their search data.

## problem statement

Manually comparing prices for one or more products across many merchants, and doing so for multiple people in one household, is slow and error-prone. Shop Assistant accepts voice or text product requests, refines the request through feedback, searches for product options on the internet, compares results according to user priorities, and redirects the user to a real merchant product page — while strictly respecting session-scoped privacy and only ever linking to real merchant pages.

## target users

- End users seeking the best price for one or more products via voice or text
- Users managing multiple profiles/recipients (e.g. family members) in one account
- The business owner monitoring conversion, latency, and retention metrics (escalation contact: Telegram @sergej_partizan)

## core user need

Users need fast, accurate, privacy-respecting product search and comparison across the internet, with real merchant redirect links, profile-aware preferences, optionally saved search criteria, and no over-retention of their voice/text queries.

## key outcomes

- Search-to-click conversion improves
- Search latency stays under 2 seconds
- User retention improves
- Zero fabricated merchant links; all redirects resolve to real merchant product pages
- Lead capture, AI analysis, admin prompt/model management, diagnostics, legal pages, and deployability are preserved

## non-goals

- Retaining user voice/text search content beyond the session
- Running external search API calls directly (delegated to ai-microservice)
- Enabling live payment creation without runtime gates and owner-approved checkout smoke
- Storing provider secrets in this repository

## success criteria

- `GET /health` passes
- Search latency target < 2s is met
- All search-result redirects resolve to real, non-fabricated merchant URLs
- Real merchant URLs only, privacy-respecting session scope, public legal transparency, and approved microservice boundaries are all preserved

## approval

Status: approved
Approved by: project owner
Approval evidence: owner-confirmation: shop-assistant-onboarding-approved
