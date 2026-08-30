# Project Invariants: Shop Assistant

```yaml
id: PROJECT-INVARIANTS-shop-assistant
status: approved
owner: project owner
created: 2026-06-12
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - ../00_constitution/CONSTITUTION.md
downstream:
  - ../06_architecture/INTEGRATION_CONTRACT.md
```

## purpose

These invariants protect Shop Assistant's privacy-respecting, real-merchant-linking, gated-billing intent, drawn from the project's original invariants set (drafted 2026-06-12) and the ecosystem IPS adoption bootstrap.

## applicability

These invariants apply to session/search handling, external search delegation, lead capture, admin operations, legal/transparency surfaces, and the billing/entitlement flow.

## invariants

- Real merchant URLs only.
- No fabricated prices, availability, merchants, or links.
- Session and search data retention remains within documented scope.
- No secrets or raw production data in source, prompts, logs, examples, screenshots, reports, or docs.
- AI and search ownership remains in approved services (ai-microservice for ASR/LLM/search orchestration).
- Auth ownership remains in auth-microservice.
- Admin and user-owned profile or criteria operations remain protected.
- Legal transparency and cookie, privacy, terms surfaces remain reachable.
- Lead local-save and downstream-forwarding flow remains preserved when lead work is in scope.
- Production deployment requires active owner approval.
- Live payment creation must remain gated by runtime keys, callback token, public URL allowlist, and owner-approved checkout smoke until explicitly enabled.

## exceptions

No exceptions are currently approved. Any exception requires an explicit, dated entry here with owner approval evidence before it takes effect.

## review cadence

These invariants are reviewed whenever the constitution or vision changes, and at minimum during each major goal cycle (see TASKS.md goal history, SA-G1 through SA-G8).
