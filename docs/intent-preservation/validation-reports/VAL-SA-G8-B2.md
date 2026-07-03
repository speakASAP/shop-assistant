# VAL-SA-G8-B2

Owner: Billing integration orchestrator
Date: 2026-07-03
Branch: `codex/sa-g8-b2-billing-entitlements`
Status: passed for source integration, first invoice checkout smoke, and approved synthetic terminal callback smoke; public payment creation remains runtime-gated

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

## Runtime Wiring Update 2026-07-03

Payment runtime wiring was completed after the initial B2 deployment:

- `PAYMENTS_SERVICE_URL` and scoped Payments API key are deployed for Shop Assistant; public `GET /api/billing/plans` reported `hasPaymentsServiceUrl:true`, `hasPaymentsApiKey:true`.
- Shop Assistant public URL is deployed as `https://shop-assistant.alfares.cz`; `/payments/validate-create` accepted callback, success, and cancel origins for `applicationId=shop-assistant` with `mutation:false` and `providerCall:false`.
- Payments callback key map now includes `shop-assistant`; no secret values were printed in validation output.

## First Approved Checkout Smoke 2026-07-03

The owner approved the first sandbox/live checkout smoke. The orchestrator temporarily set the live deployment env override `SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE=true`, verified public plans reported `paymentCreateEnabled:true`, ran one customer checkout through Shop Assistant using the non-card `invoice` method, then removed the override and verified public plans returned to `paymentCreateEnabled:false`.

Smoke evidence:

- `POST https://shop-assistant.alfares.cz/api/billing/checkouts` -> HTTP 201.
- Plan: `shop-assistant-pro-monthly`; method: `invoice`; amount: `1900` cents `EUR`.
- Checkout id: `1aa4ab84-14ea-4b32-a12c-3a892ec713fb`.
- Order id: `sa-1783082483623-830f4895`.
- Payments id: `43c8c5c7-59f4-48e6-976c-c1bb14a7435c`.
- Shop Assistant checkout status: `payment_created`; provider status: `processing`; redirect URL absent for invoice provider.
- Customer `GET /api/billing/entitlement` -> HTTP 200 with `hasActiveEntitlement:false`, which is expected because no terminal payment callback was executed.
- Payments read-only `GET /payments/status/by-order-id?applicationId=shop-assistant&orderId=...` -> HTTP 200 with `status:processing`, `paymentMethod:invoice`, `source:payments_db_snapshot`, `providerCall:false`, `mutation:false`, `persistence:false`.
- Post-smoke health: `https://shop-assistant.alfares.cz/health` -> HTTP 200; `https://payments.alfares.cz/health` -> HTTP 200.
- Post-smoke pods: Shop Assistant `shop-assistant-987c88787-dwlpd` ready, restarts `0`; Payments `payments-microservice-6694fd54d9-rgmbm` ready, restarts `0`.

## Approved Terminal Callback Smoke 2026-07-03

The owner approved the terminal callback/entitlement smoke after the invoice checkout smoke. The orchestrator used the existing smoke checkout and submitted a trusted synthetic callback directly to Shop Assistant. This did not call `/payments/create`, did not run card/Stripe checkout, did not invoke a payment provider, and did not print secret values.

Callback smoke evidence:

- First `POST https://shop-assistant.alfares.cz/api/billing/payments/callback` -> HTTP 201.
- Payload identifiers: checkout `1aa4ab84-14ea-4b32-a12c-3a892ec713fb`, order `sa-1783082483623-830f4895`, payment `43c8c5c7-59f4-48e6-976c-c1bb14a7435c`, terminal status `completed`.
- Checkout moved to `status:completed`, `providerStatus:completed`.
- Entitlement activated: `08bec76f-7268-4ec2-8856-a25bf1f1ee00`, `status:active`, plan `shop-assistant-pro-monthly`, expires `2026-08-03T12:49:14.236Z`.
- Second identical callback -> HTTP 201 and returned the same entitlement id, proving the activation path is idempotent for the same checkout.
- Customer `GET /api/billing/entitlement` -> HTTP 200 with `hasActiveEntitlement:true`.
- Public plans remained restored to `paymentCreateEnabled:false` after the smoke.
- Shop Assistant health remained HTTP 200.

Limitation: this verifies Shop Assistant trusted callback authentication, checkout status transition, and entitlement activation/idempotency. It does not verify a real payment provider or Payments-dispatched provider completion event.

## Remaining Runtime Gates

- [MISSING: owner decision to permanently enable `SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE=true` for public paid checkout].
- Synthetic trusted callback smoke is complete; entitlement activation/idempotency passed for the smoke checkout.
- [MISSING: launch decision for card/Stripe checkout vs invoice-only initial sales path].
- [MISSING: provider-dispatched terminal callback smoke if the launch path uses card/Stripe instead of invoice-only sales].
