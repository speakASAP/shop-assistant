# CP-SA-BACKLOG: Shop Assistant Backlog Context Package

```yaml
id: CP-SA-BACKLOG
status: draft
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md
downstream:
  - docs/intent-preservation/coding-prompts/PROMPT-SA-BACKLOG.md
  - docs/intent-preservation/validation-reports/VAL-SA-BACKLOG.md
related_adrs: []
```

## Task Summary

Use this context package when implementing the current Shop Assistant backlog: failed-search quality improvement or UX improvement reporting from session data.

## Source Documents

- `BUSINESS.md`
- `SYSTEM.md`
- `README.md`
- `TASKS.md`
- `STATE.json`
- `docs/intent-preservation/README.md`
- `docs/intent-preservation/TRACEABILITY_MATRIX.md`
- `docs/intent-preservation/PRE_CODING_GATE.md`
- `docs/intent-preservation/tasks/SA-G1-T1.md`
- `docs/intent-preservation/tasks/SA-G4-T1.md`
- `docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md`

## Relevant Files

- `prisma/schema.prisma`
- `src/sessions/sessions.controller.ts`
- `src/sessions/sessions.service.ts`
- `src/sessions/ai.service.ts`
- `src/sessions/search.service.ts`
- `src/sessions/agent-queue.service.ts`
- `src/profiles/profiles.controller.ts`
- `src/profiles/saved-criteria.controller.ts`
- `src/admin/prompts.controller.ts`
- `src/admin/ai-models.controller.ts`
- `src/leads/leads.controller.ts`
- `src/leads/leads.service.ts`
- `public/index.html`
- `public/test.html`
- `public/admin.html`
- `public/privacy.html`
- `public/cookies.html`
- `public/terms.html`

## Current Behavior

The repository documents and implements a NestJS service with static public/admin/test pages, Prisma persistence, session query/feedback APIs, prompt/model admin, profile and saved criteria support, lead submission forwarding, legal pages, and Kubernetes deployment. `TASKS.md` currently lists two backlog items: failed-search quality analysis and a UX improvement report from session data.

## Required Behavior

Future backlog work must preserve voice/text request handling, iterative feedback refinement, real merchant result URLs, user priorities, multi-product intent, profiles, saved criteria, lead forwarding, admin prompt/model management under JWT, agent communication observability, GDPR/ePrivacy/EU AI Act transparency, environment-only secret handling, and owner-approved production deployment.

## Constraints

- Do not store secrets or raw production personal data in docs, prompts, reports, tests, or logs.
- Do not fabricate product URLs, prices, availability, or merchant identity.
- Do not weaken admin JWT protection.
- Do not remove legal pages or AI transparency notice.
- Do not deploy without owner approval.
- Do not treat absent README-linked docs as existing evidence.

## Known Risks

- The README links several docs that are currently absent.
- Search quality analysis can expose sensitive raw query text if not aggregated or anonymized.
- External search results are nondeterministic, so validation must focus on contracts and truthfulness.
- Admin/testing pages may contain diagnostic flows that should not become public sensitive data exports.

## Validation Commands

```bash
npm run build
```

Remote equivalent:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && npm run build'
```

For documentation/reporting tasks, add a file existence check and sensitive-data scan before completion.
