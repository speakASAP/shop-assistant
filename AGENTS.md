# Agents: Shop Assistant

## required reading

Before implementation, read:

- `README.md`
- `BUSINESS.md`
- `SYSTEM.md`
- `AGENTS.md`
- `AGENT_OPERATIONS.md`
- `TASKS.md`
- `STATE.json`
- `docs/17_governance/PROJECT_INVARIANTS.md`
- `docs/01_vision/VISION.md`

## authority

Operators and agent workers may act only within the approved project intent, scope boundaries, and validation gates in this repository. Human approval is required for scope changes or production deployment decisions.

## intent preservation system

The project preserves the chain:

`Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation`

This is the binding requirement for planning, coding, and validation work.

## safety and operations

- Never commit secrets, credentials, or raw production data
- Keep the system grounded in proven repository facts
- Use `[MISSING: ...]` or `[UNKNOWN: ...]` instead of inventing facts
- Keep validation debt separate from current-task failures
- Prefer the narrowest valid validation command before broad test suites

## project-specific rules

- AI must not store user voice/text searches beyond session (privacy constraint)
- External search API calls must be rate-limited
- Search results must link to real merchant URLs — never fabricate links
- Never commit `.env`; back it up before changes
- Billing/payment creation must remain runtime-gated (SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE) until owner-approved checkout smoke passes
- Consult docs/DEVELOPMENT.md, docs/API.md, docs/INTEGRATION.md before changing agent/search/admin behavior

## required final report

The final task report must include:

- files changed
- documents created or revised
- validation commands and results
- validation debt used or created
- active blockers as `[MISSING: ...]` or `[UNKNOWN: ...]`
- deviations from scope
- next concrete action
