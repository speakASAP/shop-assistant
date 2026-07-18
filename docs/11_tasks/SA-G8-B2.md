# SA-G8-B2: Billing Contract And Entitlement Core

id: SA-G8-B2
status: implemented
owner: Billing integration orchestrator
parent: SA-G8

## Intent Chain

Vision: Shop Assistant must be sellable without inventing hidden commercial behavior.
Goal Impact: SA-G8 requires a commercial billing/entitlement boundary before paid users can be onboarded.
System: Shop Assistant owns customer-facing entitlement state; payments-microservice owns payment creation and provider status.
Feature: Billing plans, checkout handoff, idempotent payment callback, customer entitlement visibility, and admin billing visibility.
Task: Create the missing Shop Assistant-specific contract and implement the safe core behind runtime feature flags.
Execution Plan: Extends `EP-SA-G8-SALES-READINESS` after SA-G8-B1 reported missing contracts.
Coding Prompt: Implement only no-secret, source-owned contract defaults; do not execute live money movement during validation.
Code: `src/billing/**`, Prisma billing models/migration, dashboard billing panel, AppModule import.
Validation: `docs/12_validation/VAL-SA-G8-B2.md`.

## Contract Decisions

- Payment `applicationId`: `shop-assistant`.
- Entitlement key: hosted Auth `user.id` from `JwtAuthGuard`.
- Entitlement source of truth: Shop Assistant Prisma `UserEntitlement`.
- Checkout source of truth: Shop Assistant Prisma `BillingCheckout` correlated by `orderId` and optional `paymentId`.
- Payment provider source: `payments-microservice` `POST /payments/create` and callback payloads.
- Payment callback route: `POST /api/billing/payments/callback`.
- Callback authentication: `x-shop-assistant-billing-token` matched to `SHOP_ASSISTANT_BILLING_CALLBACK_TOKEN`.
- Runtime payment creation is disabled unless `SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE=true`, `PAYMENTS_SERVICE_URL`, and `PAYMENTS_API_KEY` or `SHOP_ASSISTANT_PAYMENTS_API_KEY` are configured.
- Plans are source-owned non-secret defaults: `shop-assistant-pro-monthly` and `shop-assistant-business-monthly`.

## Parallel Execution

| Workstream | Status | Owner | Scope | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| Contract verification | ready_parallel | payments explorer | Read-only payments route/scope/status evidence | payments-microservice docs/source | evidence in validation report |
| Backend billing core | final_integration | orchestrator | Prisma + Nest billing module | contract decisions above | Prisma generate/build |
| Customer UI | ready_parallel | UI explorer/orchestrator | Dashboard billing status and checkout button | backend endpoints | static/source smoke |
| Release validation | dependency_gated | validation owner | no-secret API/build/deploy checks | implementation branch | validation report |

## Remaining Gates

- Runtime payment API key, public URL, and callback-key wiring were validated on 2026-07-03.
- First approved live checkout smoke was completed with a non-card `invoice` payment; payment creation was later permanently enabled by owner direction on 2026-07-03.
- Approved synthetic terminal callback smoke was completed on 2026-07-03; entitlement activation/idempotency passed for the smoke checkout.
- Card/Stripe checkout-session creation smoke passed on 2026-07-03 with Stripe-hosted redirect URLs; sessions were not paid.
- `SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE=true` is now source-owned and deployed for public paid checkout.
- Signed Stripe webhook completion smoke passed for Payments -> Shop Assistant callback -> entitlement activation on 2026-07-03.
- [MISSING: real Stripe Checkout paid-session evidence, if the launch policy requires evidence beyond signed webhook fixtures].
