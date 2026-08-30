# Project Constitution: Shop Assistant

> Protected document. Human approval is required. AI agents may draft only from approved source material and must not override the approved baseline without explicit approval.

```yaml
id: CONSTITUTION-shop-assistant
status: approved
owner: project owner
created: 2026-06-12
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - ../../BUSINESS.md
  - ../../SYSTEM.md
  - ../../README.md
  - ../../AGENTS.md
downstream:
  - ../01_vision/VISION.md
  - ../17_governance/PROJECT_INVARIANTS.md
```

## purpose

This constitution defines the non-negotiable rules for Shop Assistant. It is derived from the repository's original intent (drafted 2026-06-12 under this project's own Intent Preservation System installation, SA-DOCS-T1) and preserved here as protected content. AI agents must treat it as protected and propose changes through vision evolution or change control.

## constitutional principles

### project laws

1. Shop Assistant turns voice or text shopping intent into useful product search, refinement, comparison, and redirects to real merchant pages.
2. Search results, prices, availability, merchants, and URLs must not be fabricated.
3. User voice and text search data must remain within documented session and persistence scope.
4. Secrets, raw production data, confidential identifiers, and real customer data must not enter prompts, examples, tests, logs, screenshots, reports, or docs.
5. ASR, LLM processing, lead AI analysis, and delegated shop search orchestration remain owned by ai-microservice unless an approved ADR changes this.
6. JWT validation and user identity remain owned by auth-microservice.
7. Admin prompt, model, profile, and criteria operations must remain protected.
8. GDPR, ePrivacy cookie, and EU AI Act transparency surfaces must remain reachable.
9. Production deployment requires explicit owner approval in the active work session.

### ai agent rules

Do not code from vague intent. Create or update task, goal-impact, execution-plan, context-package, coding-prompt, and validation artifacts before implementation. Use `[MISSING: ...]` and `[UNKNOWN: ...]` markers where evidence is not available, in draft or evidence artifacts only (never in this protected constitution once approved).

### data and security

- Secrets, tokens, credentials, and private evidence must never be committed or exposed in logs or docs.
- Execution evidence must be grounded in actual data and validation results.
- Unverified automation must be treated as blocked or draft until evidence exists.

## amendment process

1. Create or update a proposal under `docs/17_governance/` or a reviewed equivalent path.
2. Explain the reason, affected artifacts, and compatibility impact.
3. Obtain human approval.
4. Update dependent documents (`docs/01_vision/VISION.md`, `docs/17_governance/PROJECT_INVARIANTS.md`) and rerun relevant validation.

## approval

Status: approved
Approved by: project owner
Approval evidence: owner-confirmation: shop-assistant-onboarding-approved
