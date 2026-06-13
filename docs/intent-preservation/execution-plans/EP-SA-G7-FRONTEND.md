# EP-SA-G7-FRONTEND: Commercial Frontend, Client Dashboard, And Admin Panel

```yaml
id: EP-SA-G7-FRONTEND
status: draft
source_task:
  - ../tasks/SA-G7-T1.md
owner: shop-assistant-owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: planning
```

## Metadata

Goal set: owner-requested frontend productization and authenticated dashboards for Shop Assistant.

Lifecycle state: planning complete enough to split into implementation goals; coding remains gated by the task-specific pre-coding evidence and narrowed file scope.

## Upstream Traceability

- Owner request from 2026-06-13.
- Original intent: `BUSINESS.md`, `README.md`.
- System boundaries: `SYSTEM.md`, `auth-microservice/docs/UNIFIED_AUTH_CONTRACT.md`.
- Current state: `STATE.json`.
- IPS matrix: `docs/intent-preservation/TRACEABILITY_MATRIX.md`.

## Current System Summary

Shop Assistant is a NestJS service that serves static HTML from `public/` and exposes JSON APIs under `/api`. The repository already has a landing page, local login/register pages, admin page, test page, legal pages, JWT validation through Auth, role-guarded admin APIs, profiles, saved criteria, sessions, search results, choices, lead forwarding, and Prisma persistence.

The service does not yet have a complete authenticated client dashboard. Session results/messages are currently retrievable by session id through public endpoints, so account history must be implemented with authenticated current-user APIs and ownership checks before a client dashboard is considered safe.

## Implementation Goals

### SA-G7-A: Frontend Architecture Decision

Decide whether this cycle continues static HTML or introduces a build-managed frontend. Default decision for the first implementation slice: keep static HTML because `package.json` currently builds only Nest, `main.ts` serves `dist/public`, and deployment already copies `public/` into `dist/public`.

Deliverables:

- document decision in validation report;
- no new frontend framework unless deployment/build changes are explicitly scoped.

### SA-G7-B: Auth Integration Shell

Deliverables:

- shared frontend auth helper for token handoff, token storage, logout, bearer requests, and role checks;
- login/register links redirect to Auth-hosted UI with HTTPS `return_url`, `client_id=shop-assistant`, and `state`;
- callback logic removes tokens from URL fragments after storage;
- guarded dashboard/admin page initialization.

Validation:

- unauthenticated dashboard/admin route redirects or blocks;
- token is sent only as `Authorization: Bearer`;
- no token appears in logs, docs, or page text.

### SA-G7-C: Client Dashboard API

Deliverables:

- authenticated current-user dashboard endpoints;
- session ownership checks for session history, messages, results, choices, and saved criteria actions;
- optional current-user session creation flow that derives `userId` from JWT instead of trusting body input.

Validation:

- unauthenticated request receives 401;
- authenticated user cannot fetch another user's session;
- existing public search flow remains compatible where intentionally public.

### SA-G7-D: Client Dashboard UI

Deliverables:

- dashboard route/page showing recent searches, saved criteria, profiles, selected merchant redirects, and request status;
- controls to start search, rerun saved criteria, manage profiles, and continue feedback;
- clear empty/error/loading states.

Validation:

- responsive smoke test for desktop and mobile;
- dashboard data comes from current-user APIs only.

### SA-G7-E: Landing Page Commercial Upgrade

Deliverables:

- sharpened landing copy, workflow, CTA, pricing/contact path, trust/legal notices, and AI transparency;
- preserve cookie consent, privacy/cookies/terms links, and lead submission integrations.

Validation:

- public page loads without auth;
- legal pages remain reachable;
- lead request flow still posts to `/api/leads/submit` if touched.

### SA-G7-F: Admin Panel Expansion

Deliverables:

- admin overview for prompts, models, execution mode, service metrics, sessions/search health, lead forwarding status, and agent communication diagnostics;
- editable safe settings with validation;
- no secret editing through browser UI.

Validation:

- unauthenticated receives 401;
- authenticated non-admin receives 403;
- admin roles can read/update allowed settings.

### SA-G7-G: Settings Persistence And Application

Deliverables:

- classify settings as environment-owned, runtime-only, or database persisted;
- implement only non-secret editable settings;
- ensure services read the setting source that admin updates.

Validation:

- setting update changes the corresponding runtime behavior or is rejected with a clear error;
- invalid values are rejected.

## File Scope

Expected source files:

- `public/index.html`
- `public/admin.html`
- `public/login.html`
- `public/register.html`
- `public/dashboard.html` if created
- `src/auth/`
- `src/admin/`
- `src/sessions/`
- `src/profiles/`
- `src/app.module.ts`
- `prisma/schema.prisma` only if required by persisted settings or dashboard state

Documentation and state files:

- `docs/intent-preservation/tasks/SA-G7-T1.md`
- `docs/intent-preservation/execution-plans/EP-SA-G7-FRONTEND.md`
- `docs/intent-preservation/context-packages/CP-SA-G7-FRONTEND.md`
- `docs/intent-preservation/coding-prompts/PROMPT-SA-G7-FRONTEND.md`
- `docs/intent-preservation/validation-reports/VAL-SA-G7-FRONTEND.md`
- `docs/intent-preservation/TRACEABILITY_MATRIX.md`
- `TASKS.md`
- `STATE.json`

## Files That Must Not Be Modified Without New Approval

- `.env` and secret files;
- `BUSINESS.md` immutable product intent;
- `auth-microservice` production source;
- Kubernetes manifests and deploy scripts unless operations scope is selected;
- legal page substance unless legal review scope is selected;
- unrelated repositories.

## Validation Commands

Minimum for every code slice:

```bash
npm run build
```

Focused checks to add per slice:

```bash
curl -I http://127.0.0.1:4500/
curl -I http://127.0.0.1:4500/privacy.html
curl -i http://127.0.0.1:4500/api/profiles
curl -i http://127.0.0.1:4500/api/admin/settings/agent-execution-mode
```

Browser validation is required for meaningful frontend changes: desktop and mobile screenshots, console error check, and route guard checks.

## Rollout Plan

1. Save this plan and gate artifacts.
2. Implement SA-G7-B and SA-G7-C first because secure auth and ownership boundaries are prerequisites for dashboard/admin UX.
3. Implement dashboard UI after current-user APIs exist.
4. Upgrade landing page and admin UI in separate slices.
5. Run build and focused security smoke tests.
6. Update validation report, `TASKS.md`, and `STATE.json`.
7. Commit and push from the remote repo when useful.
8. Deploy only after explicit owner approval in the active session.

## Rollback Plan

Revert the selected implementation slice only. Preserve validation notes by appending a rollback entry. Do not revert unrelated dirty worktree changes.
