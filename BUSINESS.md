# Business: Shop Assistant

> Protected business baseline. Human approval is required before changes to the approved product scope.

```yaml
id: BUSINESS-shop-assistant
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - docs/01_vision/VISION.md
  - docs/00_constitution/CONSTITUTION.md
downstream:
  - SYSTEM.md
  - docs/22_goal_impact/GOAL-IMPACT-TASK-001.md
```

## problem

Shoppers need an AI assistant that can take voice or text requests, iteratively refine product search based on feedback, and compare real merchant offers by price/quality/location without fabricating links, while remaining GDPR- and EU-AI-Act-compliant.

## target users and stakeholders

- End users searching for products by voice or text, optionally across multiple profiles/recipients in one account
- Business owner monitoring search-to-click conversion, latency, and retention (Escalation Contact: @sergej_partizan)

## value proposition

shop-assistant removes the friction of manual multi-site price comparison by using voice/text input, iterative AI-driven refinement, and real merchant redirect links, while enforcing session-scoped privacy, rate-limited external search, and real (non-fabricated) merchant URLs.

## goals

- Collect and compare products by user priorities (price, quality, location/delivery)
- Search simultaneously for multiple products in one request
- Support multiple profiles/recipients per account
- Optionally save search criteria for reuse
- Refine search from user feedback and return a real merchant redirect URL

## non-goals

- Storing user voice/text searches beyond the session (privacy constraint)
- Fabricating merchant links; search results must link to real merchant URLs
- Owning payment processing logic directly (payments are delegated to payments-microservice behind a runtime-gated, owner-approved checkout flow)

## success metrics

- Search-to-click conversion
- Search latency < 2s
- User retention

## business constraints

- AI must not store user voice/text searches beyond session (privacy)
- External search API calls must be rate-limited
- Search results must link to real merchant URLs — no fabricated links
- Escalation Contact: Owner Telegram @sergej_partizan

## approval

Status: approved
Approved by: project owner
Approval evidence: owner-confirmation: shop-assistant-onboarding-approved
