# EP-SA-HOSTED-AUTH-VERIFICATION-2026-06-24

Date: 2026-06-24
Owner role: Shop Assistant hosted Auth verification worker
Lifecycle state: verification complete for source; live token-backed smoke remains gated by safe test credentials and deploy approval.

## IPS Chain

Vision: Shop Assistant users and operators authenticate through Alfares hosted Auth, while Shop Assistant remains a product service for shopping sessions, profiles, prompts, operations, and lead/admin workflows.

Goal Impact: credential collection, account creation, Auth JWT issuance, and role assignment stay centralized in `auth-microservice`; Shop Assistant consumes Auth tokens only through redirect/callback handoff and backend `/auth/validate` validation.

System: static browser pages in `public/`, customer/current-user APIs under `src/me/**`, shared backend auth guard/service under `src/auth/**`, and Auth-hosted UI at `https://auth.alfares.cz/login` and `https://auth.alfares.cz/register`.

Feature: hosted Auth consumer compliance for Shop Assistant login, registration, customer dashboard, and admin access.

Task: verify hosted Auth handoff against `/home/ssf/Documents/Github/auth-microservice/docs/HOSTED_AUTH_CONSUMER_STANDARD.md`, document the local migration/verification decision, and make only small safe source changes if a clear mismatch is found.

Execution Plan: inspect only allowed auth surfaces and repo-local docs; do not read secrets, `.env` values, Kubernetes Secret data, live DB data, lead exports, raw sessions/messages, or deploy configuration; prefer documentation when code is already compliant; validate by build, static token persistence scan, and diff hygiene.

Coding Prompt: preserve hosted Auth as the only human credential surface, preserve `client_id=shop-assistant`, `return_url`, and per-request `state`; parse Auth callback fragments only in browser pages that validate state and clean the URL; keep bearer token validation server-side through Auth; do not reintroduce local credential forms or manual JWT paste flows.

Code: no application source changes were required in this verification slice. This document records the repo-local IPS/GDD migration and verification decision.

Validation: see `Validation Evidence` below.

## Current Auth Surface

- `public/login.html` redirects immediately to `https://auth.alfares.cz/login` with `client_id=shop-assistant`, a `dashboard.html` `return_url`, and a generated `state` stored in `sessionStorage`.
- `public/register.html` redirects immediately to `https://auth.alfares.cz/register` with the same hosted Auth parameters and no local password collection.
- `public/admin.html` starts hosted Auth sign-in with `client_id=shop-assistant`, stores admin handoff state in `sessionStorage`, accepts `access_token` only from the URL fragment after strict state validation, strips the fragment, and rejects token query URLs.
- `public/dashboard.html` is the customer callback/session page and uses session-scoped `shop_assistant_access_token` storage after state validation.
- `src/auth/auth.controller.ts` intentionally exposes no Shop Assistant login/register controller.
- `src/auth/auth.service.ts` validates bearer tokens through `AUTH_SERVICE_URL` plus `/auth/validate` and does not mint Shop Assistant user JWTs.
- `src/auth/jwt-auth.guard.ts` requires `Authorization: Bearer` and attaches the Auth-validated user to protected requests.
- `src/me/**` protects current-user APIs with `JwtAuthGuard` and scopes product data by Auth user id.

## Hosted Auth Compliance Decision

Decision: source is compliant with the hosted Auth consumer standard for this verification lane. No code change is warranted without live smoke credentials or a deploy/update request.

Reasons:

- Human login/register pages no longer collect local credentials and route to Auth-hosted UI.
- Hosted Auth requests include required `client_id`, `return_url`, and caller-generated `state`.
- Callback handling in customer/admin pages validates returned state, strips the fragment, and avoids token query parameters.
- Backend protected APIs validate Auth bearer tokens via `/auth/validate` instead of local user-token minting.
- Static scans found no persistent browser writes for `accessToken`, `refreshToken`, or `user` in the inspected hosted Auth surfaces.

## Transitional Browser And Session Debt

- Shop Assistant still uses the accepted transitional browser session model: Auth access tokens are stored in `sessionStorage` under `shop_assistant_access_token` for dashboard/admin API calls.
- Legacy cleanup paths still read old `localStorage.accessToken` / `localStorage.refreshToken` values, move an access token into `sessionStorage`, and remove persistent keys. This is cleanup-only debt and should remain until production no longer needs migration cleanup.
- Preferred future state is a BFF or server session adapter that exchanges the fragment for HTTP-only, Secure, SameSite cookies and keeps refresh/access token material out of application JavaScript.
- Live Auth callback smoke requires safe test accounts/tokens and must not print raw JWTs, refresh tokens, contact values, or user PII.

## Validation Evidence

Commands to run for this verification slice:

```bash
npm run build
rg -n "localStorage\\.setItem\\([^)]*(accessToken|refreshToken|shop_assistant_access_token|user)|localStorage\\[[^]]*(accessToken|refreshToken|shop_assistant_access_token|user)[^]]*\\]\\s*=" public/login.html public/register.html public/admin.html public/dashboard.html src/auth src/me
git diff --check -- docs/21_execution_plans/EP-SA-HOSTED-AUTH-VERIFICATION-2026-06-24.md
```

Expected result:

- Build passes without reading secrets or live data.
- Persistent-token write scan returns no matches for the inspected hosted Auth surfaces.
- Diff whitespace check passes.

## Remaining Blockers

- `[MISSING: approved safe live Auth test account/token path]` for real customer/admin callback verification.
- `[MISSING: owner approval for deploy or live post-deploy smoke]`; this worker did not deploy.
- `[UNKNOWN: live deployment version relative to current remote source]`; runtime drift cannot be resolved without deployment/runtime inspection outside this task.
- `[MISSING: BFF/httpOnly-cookie migration owner]` for replacing transitional sessionStorage with server-owned sessions.

## Parallel Execution Section

| Workstream | Status | Owner role | Objective | Allowed files | Forbidden files | Dependencies | Validation evidence | Merge order |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SA-AUTH-V1 Source verifier | complete | Shop Assistant hosted Auth verification worker | Verify login/register/admin/backend auth source against hosted Auth consumer standard and document decision. | `public/login.html`, `public/register.html`, `public/admin.html`, `src/auth/**`, `src/me/**`, repo-local docs/tests | AI/search logic, lead data, raw session/message exports, dependency/package edits, deploy/k8s, secrets | Hosted Auth standard and ecosystem rollout handoff | `npm run build`; persistent-token static scan; `git diff --check` | First |
| SA-AUTH-V2 Browser smoke | blocked | Shop Assistant validation owner | Run no-secret browser checks for hosted redirect URLs, callback state rejection, and locked admin/customer states. | Repo-local tests/docs only unless a test script already exists and needs no dependency changes | Raw tokens, live DB, deploy/k8s, secrets | [MISSING: safe browser/test-token path] | Playwright/browser evidence with synthetic tokens only; no raw JWT output | After V1 |
| SA-AUTH-V3 BFF design | dependency-gated | Auth/session architecture owner | Design migration from sessionStorage transitional model to HTTP-only cookie/BFF adapter. | `docs/**`, future scoped auth/session adapter files after approval | Product AI/search flows, lead exports, secrets, deploy/k8s | [MISSING: owner decision and shared BFF session contract] | Design review first; later build and auth smoke | After V1 and shared contract approval |
| SA-AUTH-V4 Live rollout verification | blocked | Shop Assistant release/validation owner | Confirm deployed runtime matches source and hosted Auth endpoints behave as expected without exposing tokens. | Existing smoke scripts/docs if approved | Deploys, Kubernetes mutations, secrets, live DB data | [MISSING: deploy/live-smoke approval and safe test credentials] | No-secret live smoke; 401/403 checks; redirect checks | Last |

Shared contracts: hosted Auth `client_id`, `return_url`, `state`, URL-fragment handoff, Auth `/auth/validate`, Auth role strings `global:superadmin` and `app:shop-assistant:admin`, and the future BFF/httpOnly-cookie session contract.

Integration owner: Shop Assistant auth modernization integration owner.

Validation owner: Shop Assistant validation owner for repo-local build/static checks; release owner for any live smoke.

Merge order: source verification documentation first, synthetic browser validation second, BFF design third, live rollout verification only after approval and safe credentials.
