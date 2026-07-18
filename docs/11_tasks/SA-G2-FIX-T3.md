# SA-G2-FIX-T3: Admin Operations Redaction By Default

id: SA-G2-FIX-T3
status: complete
owner: shop-assistant-owner
created: 2026-06-15
last_updated: 2026-06-15
upstream: SA-G2-T1, VAL-SA-G2-LEGAL-PRIVACY-AUDIT, GOAL-SA-G2

## Objective

Reduce default exposure of sensitive operational data in protected admin operations detail responses while preserving explicit admin access for troubleshooting.

## Scope

- Redact session message content, latest query text, raw search payload summaries, agent communication content/metadata, lead messages, contact methods, and lead metadata by default.
- Keep admin operations routes JWT and role protected.
- Add an explicit `includeSensitive=true` query parameter for authorized admins who need full detail.
- Update the admin UI to show redacted summaries first and require a reveal click before fetching full detail.
- Do not alter public legal pages, Auth ownership, search behavior, Prisma schema, or production deployment.

## Validation

- `npm run build`
- `git diff --check`
- Focused source scan for `includeSensitive`, `sensitiveDetailRedacted`, and redaction UI wiring.

## Parallel Execution

| Workstream | Status | Owner Role | Objective | Allowed Files | Validation Evidence |
| --- | --- | --- | --- | --- | --- |
| Backend redaction | complete | Admin API agent | Redact sensitive admin operations detail by default with explicit admin reveal. | `src/admin/operations.controller.ts` | Build and focused source scan. |
| Admin UI reveal | complete | Admin UX agent | Render redacted summaries first and fetch full detail only after reveal. | `public/admin.html` | Build and focused source scan. |
| Integration validation | complete | Orchestrator | Record IPS evidence and state. | `VAL-SA-G2-LEGAL-PRIVACY-AUDIT.md`, `TASKS.md`, `STATE.json` | Build, diff check, JSON parse. |

## Non-Goals

- Do not remove authorized admin access to full operational detail.
- Do not deploy without explicit owner approval.
- Do not read token files, `.env`, or raw production data.
