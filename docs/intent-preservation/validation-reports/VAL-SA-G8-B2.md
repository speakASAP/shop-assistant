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

## Remaining Runtime Gates

- [MISSING: deployed `PAYMENTS_API_KEY` or `SHOP_ASSISTANT_PAYMENTS_API_KEY` scoped to `payments:create` and `payments:read` for `shop-assistant`].
- [MISSING: deployed `SHOP_ASSISTANT_PUBLIC_BASE_URL` matching the payment service callback/success/cancel origin allowlist].
- [MISSING: deployed `SHOP_ASSISTANT_BILLING_CALLBACK_TOKEN` configured both in Shop Assistant and payment callback config].
- [MISSING: owner approval for enabling `SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE=true` and running a real checkout smoke].
