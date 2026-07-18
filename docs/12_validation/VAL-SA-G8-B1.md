# VAL-SA-G8-B1

Status: blocked_contract_missing
Owner: SA-G8-B1 Billing and Entitlements worker
Created: 2026-07-03
Last updated: 2026-07-03
Branch: `codex/sa-g8-b1-billing`
Worktree: `/home/ssf/Documents/Github/shop-assistant-worktrees/sa-g8-b1`

## Intent Preservation Chain

- Vision: Shop Assistant converts natural-language or voice shopping intent into truthful comparable merchant options while preserving privacy and legal transparency.
- Goal Impact: `GOAL-SA-G8` makes the service sellable, including a commercial billing/entitlement boundary.
- System: Shop Assistant remains NestJS backend, static frontend, PostgreSQL/Prisma, hosted Auth, ai-microservice, leads-microservice, logging, and Kubernetes production at `https://shop-assistant.alfares.cz`.
- Feature: Billing and entitlements for minimum sellable access.
- Task: `SA-G8-B1` must inspect Alfares payment contracts and implement an entitlement gate only if the contract is verified.
- Execution Plan: `EP-SA-G8-SALES-READINESS` marks this workstream `ready_parallel` but dependency-gated by `[UNKNOWN: existing Alfares payment provider contract]`.
- Coding Prompt: `PROMPT-SA-G8-SALES-READINESS` forbids secrets/JWTs/raw production data and requires exact `[MISSING: ...]` blockers when contracts are unavailable.
- Code: no source code changed; implementation is blocked by missing Shop Assistant-specific payment/entitlement contract.
- Validation: this report records read-only contract evidence, blockers, and an implementation-ready design.

## Discovery Scope

Read in Shop Assistant: `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `TASKS.md`, `STATE.json`, IPS gate/docs, SA-G8 goal/plan/task/prompt, `package.json`, `prisma/schema.prisma`, selected auth/current-user/admin source and static frontend files.

Read in sibling Alfares repos without printing secrets or environment values: `payments-microservice` README/business/system/platform/orchestration docs, payment contract matrix, validation report, Payments-to-Orders bridge docs, and selected payment controller/DTO/entity/service source.

## Contract Evidence

Verified generic payment contract exists in `payments-microservice`:

- `POST /payments/validate-create` with scope `payments:create` validates a payment request without mutation, provider call, or persistence.
- `POST /payments/create` with scope `payments:create` creates a payment and returns `{ success, data: { paymentId, status, redirectUrl, expiresAt } }`.
- `GET /payments/:paymentId` with scope `payments:read` returns payment status and provider transaction reference.
- `GET /payments/status/by-order-id?applicationId=<id>&orderId=<id>` with scope `payments:read` returns a DB-only status snapshot with `providerCall=false`, `mutation=false`, and `persistence=false`.
- `POST /payments/:paymentId/refund` exists but is money movement and explicitly requires owner approval for live execution.
- Supported payment methods include `paypal`, `stripe`, `payu`, `fiobanka`, `comgate`, `card`, `webpay`, `inner`, and `invoice`.
- Payment callback payloads are documented as generic payment status notifications; duplicate verified provider callbacks can repeat downstream callbacks, so consumers must be idempotent.

Verified gaps for Shop Assistant:

- `payments-microservice/BUSINESS.md` lists current consumers as `flipflop-service`, `allegro-service`, `aukro-service`, `bazos-service`, `beauty`, `marathon`, `speakasap`, `sgiprealestate`, `statex`, and `crypto-ai-agent`; `shop-assistant` is not listed.
- Read-only searches in `payments-microservice`, `auth-microservice`, `orders-microservice`, `invoices-microservice`, and `shop-assistant` found no Shop Assistant-specific payment, entitlement, subscription, quota, or billing-profile contract.
- Shop Assistant `prisma/schema.prisma` has no billing, checkout, subscription, entitlement, plan, quota, or payment callback model.
- Shop Assistant has no billing module, payment client, entitlement guard, checkout endpoint, payment callback endpoint, or admin/customer billing UI.
- No non-secret source document verified `shop-assistant` in the payments application allowlist, callback origin allowlist, payment API key scope, pricing/SKU registry, entitlement lifecycle, or hosted Auth user-to-billing mapping.

## Decision

Implementation is blocked. The verified Alfares payment service is sufficient to design against, but not sufficient to safely implement a sellable entitlement gate for Shop Assistant because the Shop Assistant-specific commercial contract is missing.

Adding source now would require inventing at least one behavior-affecting contract: paid plan identity, amount/currency/payment method, `applicationId`, callback URL authorization, runtime API key scope, webhook/callback verification, entitlement activation semantics, and free-vs-paid limits. The SA-G8-B1 prompt explicitly forbids inventing those contracts.

## Required Blockers

- [MISSING: Shop Assistant payment application contract in payments-microservice, including canonical `applicationId`, allowed callback/success/cancel origins, and runtime API key scopes `payments:create` and `payments:read`].
- [MISSING: sellable plan catalog for Shop Assistant, including plan codes, price amounts, currency, allowed payment methods, billing period, trial/free tier, refund/cancellation policy, and entitlement limits].
- [MISSING: payment callback contract for Shop Assistant, including route, auth/signature/shared-secret model, retry/idempotency requirements, terminal statuses that activate/deactivate access, and duplicate-callback handling].
- [MISSING: hosted Auth billing identity mapping, including whether entitlements key by Auth user id, account id, tenant id, or organization id].
- [MISSING: source of truth for entitlement storage: Shop Assistant Prisma models vs Auth/customer wallet vs another billing service].
- [MISSING: admin operation rules for granting, revoking, extending, or viewing entitlements without exposing payment secrets or raw provider payloads].
- [MISSING: sandbox/no-secret payment validation environment or approved fake provider path for end-to-end checkout and callback smoke].

## Implementation-Ready Design After Blockers Clear

Minimum sellable path:

1. Add Shop Assistant billing config with a hardcoded non-secret plan allowlist loaded from source or safe `AppSetting` values. Do not place prices or provider credentials in frontend code unless they are public display values.
2. Add Prisma persistence owned by Shop Assistant only if the owner confirms this service owns entitlements: `BillingCheckout` and `UserEntitlement`, with unique/idempotency indexes on `orderId`, `paymentId`, and active entitlement per `userId` where practical.
3. Add a server-only `PaymentsClient` using runtime-only `PAYMENTS_SERVICE_URL`, `PAYMENTS_API_KEY`, `SHOP_ASSISTANT_PUBLIC_BASE_URL`, and optional `SHOP_ASSISTANT_PAYMENT_METHODS`; never log or expose the API key.
4. Add authenticated customer endpoints: `GET /api/billing/plans`, `POST /api/billing/checkouts`, and `GET /api/billing/entitlement`.
5. Add `POST /api/billing/payments/callback` only after callback auth is verified; make it idempotent and activate entitlements only from trusted terminal `completed` status.
6. Add `EntitlementsGuard` or service checks only after entitlement persistence exists. Keep anonymous public search compatible unless owner explicitly changes it.
7. Add minimal dashboard/admin billing UI only after the backend contract is verified.
8. Validate with `npm run prisma:generate` if Prisma changes, `npm run build`, `git diff --check`, no-secret scan, approved `POST /payments/validate-create` sandbox smoke, and duplicate callback replay smoke.

## Validation Evidence

Commands run from `/home/ssf/Documents/Github/shop-assistant-worktrees/sa-g8-b1` unless noted:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && pwd && git status --short --branch && git branch --show-current && git log -1 --oneline && git worktree list'
```

Result: main checkout clean at `51c50bc`; no existing SA-G8-B1 worktree was present.

```bash
ssh alfares 'mkdir -p /home/ssf/Documents/Github/shop-assistant-worktrees && cd /home/ssf/Documents/Github/shop-assistant && git fetch origin main && git worktree add -b codex/sa-g8-b1-billing ../shop-assistant-worktrees/sa-g8-b1 origin/main'
```

Result: worktree and branch created from `origin/main`.

```bash
rg --files | rg -i "billing|payment|stripe|checkout|subscription|entitlement|plan|quota|pricing|invoice|paddle|pay|commerce"
rg -n -i "billing|payment|stripe|checkout|subscription|entitlement|plan|quota|pricing|invoice|paddle|payment provider|paid|free tier|trial" --glob "!node_modules/**" --glob "!dist/**" --glob "!.git/**"
```

Result: no Shop Assistant billing/payment/entitlement source contract found; file-name matches were planning docs only.

```bash
find /home/ssf/Documents/Github -maxdepth 1 -mindepth 1 -type d -printf "%f\\n" | sort | rg -i "pay|billing|stripe|invoice|subscription|commerce|checkout|payment|wallet|order|auth|leads|shop|assistant|gateway|crm|business|catalog"
```

Result: likely contract repos identified: `payments-microservice`, `invoices-microservice`, `orders-microservice`, `auth-microservice`, `business-process-control-plane`.

```bash
for repo in payments-microservice invoices-microservice orders-microservice auth-microservice business-process-control-plane; do ... rg --files ...; rg -n -i ...; done
```

Result: `payments-microservice` contains the generic payment contract; no Shop Assistant entitlement/subscription contract was found in likely sibling repos.

```bash
for repo in payments-microservice auth-microservice orders-microservice invoices-microservice shop-assistant; do ... rg -n -i "shop-assistant|entitlement|subscription|membership|plan|quota|paid access|billing profile|payment status|PAYMENT_ALLOWED_APPLICATION_IDS|payments:create|payments:read" ...; done
```

Result: no Shop Assistant-specific billing/entitlement/payment-scope contract found.

## Sensitive Data Check

Pass for this worker scope:

- No `.env` values were printed.
- No payment provider credentials, API keys, webhook secrets, private keys, JWTs, card data, raw production provider payloads, raw production queries, lead contacts, or profile PII were read into this report.
- No live payment, refund, provider, connected-account, deployment, or database mutation was performed.

## Source Changes

Changed files:

- `docs/12_validation/VAL-SA-G8-B1.md`

No application source, Prisma schema, static frontend, tests, deployment files, secrets, or runtime configuration were changed.

## Build And Smoke

`npm run build` was not run because no source code changed and implementation is blocked by missing contracts. This matches the task validation rule: build is required if source changes.

Sandbox/no-secret smoke was not run because the required Shop Assistant payment application contract and sandbox/no-money provider path are missing.

## Result

Blocked, with implementation-ready design recorded.

Merge order: this docs-only blocker branch can merge before any SA-G8-B1 implementation branch. The actual billing implementation must wait until the missing contracts above are supplied and should merge after privacy/rate-limit work if it changes the same session/search access gates.
