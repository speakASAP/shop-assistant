# VAL-SA-G8-B2

Owner: Billing integration orchestrator
Date: 2026-07-03
Branch: `codex/sa-g8-b2-billing-entitlements`
Status: passed for source integration; live payment creation remains runtime-gated

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation is preserved in `docs/intent-preservation/tasks/SA-G8-B2.md`.

## Contract Created

SA-G8-B1 was blocked because the Shop Assistant-specific billing contract did not exist. The owner directed the orchestrator to create it and proceed. This branch creates the contract with conservative runtime gates:

- `applicationId`: `shop-assistant`.
- Plans: `shop-assistant-pro-monthly` and `shop-assistant-business-monthly`.
- Auth identity: hosted Auth `user.id`.
- Entitlement store: Shop Assistant Prisma `UserEntitlement`.
- Checkout store: Shop Assistant Prisma `BillingCheckout`.
- Payment create client: `PAYMENTS_SERVICE_URL` plus `PAYMENTS_API_KEY` or `SHOP_ASSISTANT_PAYMENTS_API_KEY`.
- Live payment creation gate: `SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE=true`.
- Callback route: `POST /api/billing/payments/callback` with `x-shop-assistant-billing-token`.

## Subagent Evidence

Payments explorer confirmed generic contract routes/scopes and that `shop-assistant` is now listed in the payments allowed-application policy. UI explorer confirmed `public/dashboard.html` is the minimal customer touch point, with `public/admin.html` read-only billing view optional after backend exists.

## Validation Evidence

Executed commands:

```bash
npm install
npm run prisma:generate
DATABASE_URL=postgresql://user:pass@localhost:5432/shop_assistant npx prisma validate
npm run build
git diff --check
rg -n "sk_live|pk_live|PAYMENTS_API_KEY=|SHOP_ASSISTANT_PAYMENTS_API_KEY=|SHOP_ASSISTANT_BILLING_CALLBACK_TOKEN=|Bearer [A-Za-z0-9._-]+|BEGIN (RSA|OPENSSH|PRIVATE) KEY" src/billing public/dashboard.html prisma/schema.prisma docs/intent-preservation/tasks/SA-G8-B2.md docs/intent-preservation/validation-reports/VAL-SA-G8-B2.md || true
```

Results:

- `npm install` completed in the remote B2 worktree to restore missing validation dependencies; npm reported existing dependency audit debt: 32 vulnerabilities.
- `npm run prisma:generate` passed with Prisma Client v5.22.0.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/shop_assistant npx prisma validate` passed.
- `npm run build` passed.
- `git diff --check` passed.
- Focused no-secret scan over B2 source/docs returned no matches.

No live `payments/create`, refund, provider, or DB production mutation has been executed by this report.

## Production Deployment Evidence

Deployment date: 2026-07-03.

- Source commit merged and pushed: `aa34067 feat: add billing entitlement core`.
- Image built and pushed: `localhost:5000/shop-assistant:latest`.
- Source fingerprint: `9d9568f3cdb45dd5a0aaa16efbbf0ab1ac2fa6ab1814cfb9379a62e82d258c0f`.
- Running image digest after rollout: `sha256:9c272a67b77e786d34ea4691a5ccd42c4e972e44a6db4aecc0830e4d8c60c343`.
- Running pod: `shop-assistant-6bff8445cb-pcggk`, ready `1/1`, restarts `0`.
- Prisma migration applied during container startup: `20260703_add_billing_entitlements`; logs showed all migrations successfully applied.
- Live health: `https://shop-assistant.alfares.cz/health` returned HTTP 200 with status ok.
- Standard post-deploy no-secret smoke passed with `Failures: 0`; optional token checks skipped in that script.
- Strict token-file smoke passed with `Failures: 0`; `AGENT_FLOW_SESSION_ID` checks skipped only.
- Focused billing smoke passed:
  - `GET /api/billing/plans` -> 200.
  - customer `GET /api/billing/entitlement` -> 200.
  - customer `POST /api/billing/checkouts` -> 201 with `paymentConfigured:false`, proving live payment creation is still disabled until runtime config is supplied.
  - admin `GET /api/admin/billing` -> 200.
  - non-admin `GET /api/admin/billing` -> 403.
  - unauthenticated callback without `SHOP_ASSISTANT_BILLING_CALLBACK_TOKEN` -> 403.

Deploy note: two deploy-script runs timed out while Kubernetes/containerd reported cluster-wide pod sandbox creation delays across unrelated workloads. The second rollout completed after the script timeout; manual post-deploy checks were then run and passed. Production remained served by the previous ready pod during the delayed rollout.

## Remaining Runtime Gates

- [MISSING: deployed `PAYMENTS_API_KEY` or `SHOP_ASSISTANT_PAYMENTS_API_KEY` scoped to `payments:create` and `payments:read` for `shop-assistant`].
- [MISSING: deployed `SHOP_ASSISTANT_PUBLIC_BASE_URL` matching the payment service callback/success/cancel origin allowlist].
- [MISSING: deployed `SHOP_ASSISTANT_BILLING_CALLBACK_TOKEN` configured both in Shop Assistant and payment callback config].
- [MISSING: owner approval for enabling `SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE=true` and running a real checkout smoke].
