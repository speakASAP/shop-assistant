# CP-SA-G7-FRONTEND: Frontend Productization Context Package

```yaml
id: CP-SA-G7-FRONTEND
status: complete
owner: shop-assistant-owner
created: 2026-06-13
last_updated: 2026-06-21
completeness_level: complete
upstream:
  - docs/intent-preservation/tasks/SA-G7-T1.md
  - docs/intent-preservation/execution-plans/EP-SA-G7-FRONTEND.md
downstream:
  - docs/intent-preservation/coding-prompts/PROMPT-SA-G7-FRONTEND.md
  - docs/intent-preservation/validation-reports/VAL-SA-G7-FRONTEND.md
related_adrs: []
```

## Task Summary

Create a production-quality frontend path for Shop Assistant: public commercial landing page, secure authenticated client dashboard, and role-protected admin control panel with editable safe settings.

## Source Documents

- `BUSINESS.md`
- `SYSTEM.md`
- `README.md`
- `TASKS.md`
- `STATE.json`
- `docs/intent-preservation/README.md`
- `docs/intent-preservation/PRE_CODING_GATE.md`
- `docs/intent-preservation/TRACEABILITY_MATRIX.md`
- `docs/intent-preservation/tasks/SA-G7-T1.md`
- `docs/intent-preservation/execution-plans/EP-SA-G7-FRONTEND.md`
- `auth-microservice/docs/UNIFIED_AUTH_CONTRACT.md`

## Current Behavior

- `src/main.ts` serves static assets from `dist/public` and sets `/api` as the global API prefix.
- `public/index.html` exists and includes commercial landing content, legal links, cookie consent, auth nav, and lead/request UI.
- `public/admin.html` exists and calls admin APIs for prompts, AI models, execution mode, and agent communication diagnostics.
- `public/login.html` and `public/register.html` exist locally, but Auth contract says applications should prefer Auth-hosted UI.
- `src/auth/AuthService` validates JWTs via `AUTH_SERVICE_URL/auth/validate`.
- `src/auth/JwtAuthGuard` attaches the Auth user to the request.
- `src/auth/RolesGuard` enforces role strings from Auth claims.
- `src/admin/*` endpoints are role-protected for `global:superadmin` and `app:shop-assistant:admin`.
- `src/profiles/*` and `src/profiles/saved-criteria*` endpoints are authenticated and scoped by `req.user.id`.
- `src/sessions/*` supports sessions, messages, search runs, results, choices, feedback, and agent communications, but read endpoints are public by session id.
- Prisma already stores `Session.userId`, `Session.profileId`, messages, search runs, choices, account profiles, and saved criteria.

## Required Behavior

- Public visitors can understand the offer, legal disclosures, and conversion path without authentication.
- Authenticated clients can see only their own dashboard data and can manage their own profiles and saved criteria.
- Admin users can manage prompts/models/settings and inspect operations only when Auth roles allow it.
- Editable settings are validated and applied to the actual runtime path they control.
- Tokens, secrets, raw production personal data, and provider credentials never enter source, docs, logs, or screenshots.

## Auth Contract Notes

- Auth-hosted UI base: `https://auth.alfares.cz`.
- Hosted login/register paths: `/login`, `/register`.
- Return flow uses HTTPS `return_url`, optional `client_id`, and opaque `state`.
- OAuth/magic-link success can return tokens in URL fragment; the application must parse, validate state, store according to client model, and remove tokens from URL.
- API calls send `Authorization: Bearer <accessToken>`.
- Auth owns roles and token validation.

## Known Gaps

- No complete client dashboard page exists.
- No authenticated current-user session history endpoint exists.
- Public session read endpoints allow access by session id and should not be used for account dashboard history.
- Local credential pages may conflict with the Auth-hosted UI preference.
- Admin panel is functional but not a comprehensive service control surface.
- Settings currently cover agent execution mode only and appear runtime-memory based.
- `SYSTEM.md` says Next.js frontend, but current build/deploy path is static HTML served by Nest.

## Constraints

- Keep source changes in `shop-assistant` unless owner separately approves auth-microservice changes.
- Do not add a frontend framework until build/deploy impact is scoped.
- Do not commit `.env`, secrets, production tokens, raw user queries, voice transcripts, or personal lead/contact data.
- Do not weaken public legal transparency or admin JWT/RBAC protection.
- Do not deploy without explicit owner approval.

## Validation Requirements

- `npm run build` after code changes.
- Route smoke checks for `/`, legal pages, dashboard, and admin.
- API checks for 401 unauthenticated dashboard/profile/admin calls.
- API checks for 403 authenticated non-admin admin calls when a test token is available.
- Browser checks for desktop/mobile layout and console errors after frontend changes.
- Sensitive-data scan of changed docs and frontend assets before completion.

## Closeout Status

Status as of 2026-06-21: complete. The context package is retained as the historical implementation context for SA-G7-T1. The known gaps listed below were closed by the implementation and validation slices recorded in `VAL-SA-G7-FRONTEND.md`, `TASKS.md`, and `STATE.json`.

Use the validation report and current source as the active context for follow-up work. New customer dashboard or admin improvements should start with a new task/context package instead of extending this closed package.
