# SA-G7-T1: Commercial Frontend, Authenticated Client Dashboard, And Admin Control Panel

```yaml
id: SA-G7-T1
status: complete
owner: shop-assistant-owner
created: 2026-06-13
last_updated: 2026-06-21
completeness_level: complete
upstream:
  - owner request 2026-06-13
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - TASKS.md
  - STATE.json
  - docs/TRACEABILITY_MATRIX.md
downstream:
  - docs/21_execution_plans/EP-SA-G7-FRONTEND.md
  - docs/13_context_packages/CP-SA-G7-FRONTEND.md
  - docs/14_prompts/PROMPT-SA-G7-FRONTEND.md
  - docs/12_validation/VAL-SA-G7-FRONTEND.md
related_adrs: []
```

## Objective

Plan and implement the customer-facing and authenticated frontend surface for Shop Assistant: a revenue-oriented landing page, secure Auth-owned login handoff, a client dashboard for each authenticated user, and a role-protected admin panel where service configuration and operational content can be viewed and edited.

## Current Repository Finding

The service already has a static frontend served by Nest from `public/`: `index.html`, `login.html`, `register.html`, `admin.html`, `test.html`, and legal pages. Backend support already exists for JWT validation through `auth-microservice`, role-guarded admin prompt/model/settings APIs, profiles, saved criteria, sessions, messages, search runs, choices, leads, and legal pages.

The main gap is not absence of frontend, but incomplete productization and incomplete authenticated account boundaries for client history and dashboard use.

## Goal Impact

This task strengthens the product path from public marketing to paid/customer use while preserving the original AI shopping assistant intent: users express what they want, the system searches and compares real merchant offers, and authenticated users can return to their own profiles, saved criteria, and request history.

## Project Invariant Impact

- Real merchant URLs remain mandatory for search results and redirects.
- Auth remains the owner of identity, JWT validation, refresh, OAuth, magic links, and roles.
- Admin operations remain JWT and role protected.
- Client dashboard data must be scoped to the authenticated user.
- Legal transparency, cookie consent, and EU AI Act AI disclosure remain visible.
- Search provider and JWT secrets remain outside frontend bundles, docs, logs, and source.

## Sensitive-Data Classification

Allowed in source/docs: route names, UI labels, aggregate counts, synthetic examples, API contract shapes, role names, non-secret environment key names.

Restricted at runtime: user query text, search history, profile names, saved criteria, choices, lead messages, voice metadata, JWT access tokens, refresh tokens.

Forbidden in source/docs/logs: JWTs, refresh tokens, API keys, `.env` values, production user queries, raw voice transcripts, contact details, raw personal search histories.

## Contract/Schema Impact

Expected backend contract additions:

- authenticated client dashboard endpoints for the current user, such as `GET /api/me/dashboard`, `GET /api/me/sessions`, `GET /api/me/sessions/:id`, and current-user session creation/query helpers;
- session ownership checks before exposing messages, results, choices, and agent communications to client views;
- admin settings endpoints may expand beyond agent execution mode, but must stay role-protected;
- optional Prisma changes only if existing `Session`, `Message`, `SearchRun`, `Choice`, `AccountProfile`, and `SavedSearchCriteria` models cannot support required dashboard state.

## Privacy/Legal Impact

The public landing page must preserve privacy/cookie/terms links and visible AI-system transparency. Client dashboard must avoid showing another user's sessions by ID guessing. Admin views must not expose raw personal data unless the operator role explicitly needs it and the view follows the project privacy policy.

## External Service Boundary Impact

- Login/register should prefer Auth-hosted UI (`https://auth.alfares.cz/login` and `/register`) with validated HTTPS `return_url`, `client_id`, and `state` instead of local credential collection.
- Shop Assistant validates tokens through `auth-microservice` via `POST /auth/validate`.
- Auth-owned role claims drive admin authorization: `global:superadmin` and `app:shop-assistant:admin`.
- AI/search work remains delegated to `ai-microservice`; search provider keys do not move into this service.

## Replay/Determinism Impact

Frontend rendering and dashboard API behavior must be deterministic from persisted database state and the authenticated user id. External search results remain nondeterministic and should be validated by shape, ownership, real URL presence, and failure handling rather than exact result order.

## Scope Breakdown

### Scope A: Discovery And Gate

- Inventory current static frontend, auth integration, admin APIs, profile/saved criteria APIs, session persistence, deployment path, and legal pages.
- Complete pre-coding gate evidence.
- Decide whether to continue with static HTML or introduce a built frontend app only after deployment and build implications are documented.

### Scope B: Auth Shell And Token Handoff

- Replace unsafe local credential collection with Auth-hosted login/register redirects or an approved token handoff flow.
- Add callback handling that validates `state`, stores tokens according to the selected client security model, refreshes when supported, and never puts tokens in logs.
- Add authenticated nav states and route guards for client/admin pages.

### Scope C: Commercial Landing Page

- Improve `/` as a buyer-focused landing page with clear value, product workflow, proof/metrics placeholders, pricing/contact CTA, AI transparency, and legal links.
- Keep the first screen useful and specific to Shop Assistant, not a generic marketing page.
- Preserve lead submission behavior and cookie consent.

### Scope D: Client Dashboard

- Add `/dashboard.html` or equivalent route for authenticated users.
- Show the current user's sessions, request/search history, saved criteria, profiles, selected products, merchant redirects, and recent assistant messages.
- Allow starting a new search, rerunning saved criteria, managing profiles, and continuing/refining previous requests.
- Add backend ownership checks and current-user dashboard APIs before exposing history.

### Scope E: Admin Panel Expansion

- Keep existing prompt/model/settings management.
- Add admin overview for service metrics, sessions/search health, failed searches, lead request status, agent communication diagnostics, and editable application settings.
- Ensure all admin APIs use `JwtAuthGuard` and `RolesGuard` with Auth-owned role claims.
- Avoid broad raw data exports by default.

### Scope F: Settings Application

- Define which settings are runtime-only, persisted in DB, or environment-owned.
- Apply editable settings through services in a way that is observable, validated, and reversible.
- Do not make secret values editable through the frontend.

### Scope G: Validation, Security, And Release

- Build and smoke-test public, dashboard, and admin routes.
- Test unauthorized, authenticated non-admin, and admin access paths.
- Verify no token leaks in URLs after callback cleanup, logs, docs, or screenshots.
- Record validation evidence and do not deploy without explicit owner approval.

## Non-Goals

- Do not move identity, passwords, OAuth, magic links, or role assignment into Shop Assistant.
- Do not expose search provider keys or JWT secrets to frontend code.
- Do not fabricate product data, merchant URLs, prices, or availability.
- Do not remove legal pages, cookie consent, or AI transparency.
- Do not deploy to production without explicit owner approval in the active session.

## Acceptance Criteria

- Public landing page is present, legally compliant, and conversion-oriented.
- Authenticated users can access only their own dashboard data.
- Unauthenticated visitors cannot access dashboard or admin data.
- Non-admin authenticated users cannot access admin APIs or admin UI data.
- Admin users can view and edit supported prompts/models/settings and operational service data.
- Settings changes are validated and demonstrably applied to the application path they control.
- Build and focused auth/security smoke checks pass, with evidence recorded.

## Required Context

- `public/index.html`
- `public/login.html`
- `public/register.html`
- `public/admin.html`
- `public/test.html`
- `public/privacy.html`
- `public/cookies.html`
- `public/terms.html`
- `src/auth/`
- `src/admin/`
- `src/sessions/`
- `src/profiles/`
- `src/leads/`
- `prisma/schema.prisma`
- `auth-microservice/docs/UNIFIED_AUTH_CONTRACT.md`

## Required Gates

- Shop Assistant pre-coding gate.
- Auth boundary and RBAC gate.
- Client data ownership gate.
- Privacy/legal gate.
- Settings safety gate.
- Completion and validation evidence gate.
