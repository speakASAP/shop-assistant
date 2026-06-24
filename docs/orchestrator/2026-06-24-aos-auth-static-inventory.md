# AOS Hosted Auth Static Inventory: shop-assistant

Date: 2026-06-24
Worker role: parallel Alfares Auth modernization inventory worker
Scope: static source/docs inspection only; no secrets, env values, live DB rows, production logs, deploys, backfills, or smokes.
Central standard: `/home/ssf/Documents/Github/auth-microservice/docs/HOSTED_AUTH_CONSUMER_STANDARD.md`

## IPS Chain

- Vision: Shop Assistant users authenticate through central Alfares Auth while the service focuses on shopping workflows, profiles, saved criteria, and admin operations.
- Goal Impact: preserve account-scoped product behavior without local credential authority or duplicated password handling.
- System: `auth-microservice`, Shop Assistant static public/customer/admin pages, NestJS Auth validation service, JWT and role guards.
- Feature: hosted Auth entry points, callback/session handoff, protected customer/admin APIs, and Auth-role enforcement.
- Task: inventory static auth surfaces and compare them to the hosted Auth consumer standard.
- Execution Plan: inspect source/docs with static grep only; document surfaces, gaps, workstreams, blockers, and validation candidates.
- Coding Prompt: future workers must not read secrets, production data, token files, or legacy `speakasap-portal`; preserve Auth and service-boundary ownership.
- Code: no code changed by this inventory worker.
- Validation: `git diff --check -- docs/orchestrator/2026-06-24-aos-auth-static-inventory.md` after report creation.

## Auth Surfaces Found

- Public login/register pages: `public/login.html` and `public/register.html` do not collect passwords; they redirect to `https://auth.alfares.cz/login` or `/register` with `client_id=shop-assistant`, `state`, and a return URL.
- Return URL behavior: the current static pages use `dashboard.html` as the return URL, not a dedicated `/auth/callback` route. `dashboard.html` parses `window.location.hash`, validates `shop_assistant_auth_state`, stores the access token in `sessionStorage`, strips the fragment, and removes legacy `localStorage` token keys.
- Admin callback behavior: `public/admin.html` has similar fragment parsing/state validation and stores `shop_assistant_access_token` in `sessionStorage`; it also migrates/removes legacy `localStorage` keys.
- Token storage: customer/admin pages use browser `sessionStorage` for `shop_assistant_access_token`; this is transitional browser storage, not the preferred BFF/httpOnly cookie model.
- Backend Auth service: `src/auth/auth.service.ts` validates bearer tokens with Auth `/auth/validate` and logs token length rather than token value.
- Backend guards: `src/auth/jwt-auth.guard.ts` requires `Authorization: Bearer`, attaches Auth user data to `request.user`, and returns 401 on missing/invalid tokens. `src/auth/roles.guard.ts` enforces role strings from Auth claims and returns 403 on insufficient roles.
- Protected API surfaces: `src/me/*`, `src/profiles/*`, saved criteria, and admin controllers use `JwtAuthGuard`; admin operations combine `JwtAuthGuard` and `RolesGuard`.
- Local credential controller: `src/auth/auth.controller.ts` explicitly documents that there is no Shop Assistant login/register controller.
- Service-token boundaries: AI/search/leads service clients set bearer headers from runtime configuration; these are machine/service integration paths and separate from hosted human login migration.

## Comparison To Hosted Auth Consumer Standard

- Compliant: credential collection is delegated to Auth-hosted login/register pages; local static pages do not collect passwords.
- Compliant: generated opaque state is stored before redirect and validated on callback-bearing pages.
- Partially compliant: callback parses token data from URL fragment and strips it, but the return URL is `dashboard.html`/admin page behavior rather than a dedicated `/auth/callback` endpoint described by the central standard.
- Transitional debt: browser `sessionStorage` token storage remains; the standard prefers server-owned HTTP-only Secure SameSite cookies.
- Compliant backend pattern: protected APIs validate Auth-issued bearer tokens via `POST /auth/validate` and preserve Auth roles.
- Needs verification: production callback/origin allowlist is `[MISSING: verified Auth runtime redirect allowlist]`; no runtime config was inspected.

## Implementation-Ready Workstreams

| Workstream | Status | Owner role | Scope | Forbidden files | Expected output | Dependencies | Validation evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. Dedicated callback adapter alignment | ready now | Shop Assistant frontend auth worker | `public/login.html`, `public/register.html`, `public/dashboard.html`, `public/admin.html`, docs/tests | secrets, token files, production data, deployment files | use a dedicated `/auth/callback` handoff or document approved static-page callback exception | `[UNKNOWN: whether static callback exception is acceptable]` | static route scan and browser hash/state tests |
| B. BFF/httpOnly session design | dependency-gated | Shop Assistant backend/frontend integration worker | session handoff route and protected page token retrieval design | Prisma/data migrations unless explicitly approved | move from `sessionStorage` token to server-owned session cookie | `[MISSING: approved session model for static pages]` | callback tests, no raw token marker scan |
| C. Guard and ownership validation | ready now | Shop Assistant API validation worker | `src/auth/*`, `src/me/*`, `src/profiles/*`, admin controllers | live DB rows, token-file contents | prove 401/403 and account ownership behavior with synthetic or mocked tokens | safe token/mock strategy | targeted unit/static tests and unauthenticated checks |
| D. Service-token boundary inventory | ready now | Integration boundary worker | AI/search/leads service client auth headers | secret values and runtime env output | classify machine-token paths separately from human Auth migration | none | static summary only, no secret output |

## Blockers And Unknowns

- [MISSING: verified production origin/callback for `shop-assistant`].
- [MISSING: verified Auth runtime redirect allowlist entry for `shop-assistant`].
- [UNKNOWN: whether `dashboard.html` as callback target is an approved exception to the dedicated `/auth/callback` standard].
- [MISSING: approved BFF/httpOnly cookie session adapter design].
- [UNKNOWN: current complete test coverage for state mismatch, fragment stripping, and no-token leakage].

## Validation Candidates

- Static marker scan: login/register pages do not contain password inputs or local POSTs to `/auth/login` or `/auth/register`.
- Browser/static callback check: fragment-only parsing, state mismatch rejection, fragment stripping, and safe redirect for customer and admin surfaces.
- Guard tests: missing bearer token returns 401; viewer/operator/admin role boundaries return expected 403/200 using mocked Auth validation.
- Token hygiene scan: changed files and test output do not include raw access tokens, refresh tokens, passwords, contact codes, or user PII.
- Ownership checks: authenticated profile/saved-criteria/current-user APIs filter by Auth user identity.

## Static Guardrail Validation Evidence - 2026-06-24

Worker role: parallel Alfares Auth modernization worker
Write scope used: `scripts/check-hosted-auth-contract.js`, `package.json`, and this validation evidence section only.
Runtime behavior: no app runtime HTML/TS code changed.

Commands run:

- `npm run check:hosted-auth` - PASS. Verified hosted Auth redirects for `public/login.html` and `public/register.html`; callback fragment/state/session handling for `public/dashboard.html` and `public/admin.html`; legacy `localStorage` token cleanup; no password inputs or local credential POSTs on public login/register; backend bearer validation through Auth `/auth/validate`.
- `git diff --check -- package.json docs/orchestrator/2026-06-24-aos-auth-static-inventory.md` - PASS before this evidence append.
- `git diff --no-index --check /dev/null scripts/check-hosted-auth-contract.js` - PASS for the new checker file.
- `npm run build` - BLOCKED by worker scope. The repo build command is `nest build`, which writes generated `dist/` output; `dist` is forbidden for this worker.

Remaining blockers:

- [MISSING: verified production origin/callback for `shop-assistant`].
- [MISSING: verified Auth runtime redirect allowlist entry for `shop-assistant`].
- [UNKNOWN: whether `dashboard.html` as callback target is an approved exception to the dedicated `/auth/callback` standard].
