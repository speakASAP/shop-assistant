# Shop Assistant Intent Traceability Matrix

```yaml
id: SA-IPS-TRACEABILITY
status: active
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - BUSINESS.md
  - SYSTEM.md
  - README.md
  - TASKS.md
  - STATE.json
  - prisma/schema.prisma
downstream:
  - docs/11_tasks/
  - docs/21_execution_plans/
  - docs/13_context_packages/
  - docs/14_prompts/
  - docs/12_validation/
related_adrs: []
```

## Purpose

This matrix preserves the chain from original Shop Assistant intent to executable implementation tasks.

## Core Intent To Goals

| Intent | Invariant | Goal | Current Status | Validation Evidence |
| --- | --- | --- | --- | --- |
| Voice/text requests must become useful product searches with iterative refinement. | Real merchant URLs, session-scoped search storage, approved AI/search boundary | SA-G1 Request-to-result quality | active | `README.md`, `BUSINESS.md`, `src/sessions/`, `TASKS.md` failed-search backlog |
| Public service must remain legally transparent and privacy-aware. | GDPR, ePrivacy/cookies, EU AI Act Art. 50, no secrets in docs/logs | SA-G2 Legal and privacy compliance | active | `README.md`, `public/privacy.html`, `public/cookies.html`, `public/terms.html`, `src/legal/` |
| Users must be able to express priorities, multiple products, profiles, and saved criteria. | User priority preservation, account profile boundary, saved reusable criteria | SA-G3 Multi-intent and profile search | implemented foundation, needs runtime quality evidence | `README.md`, `prisma/schema.prisma`, `src/profiles/`, `src/sessions/` |
| Admins must manage prompts/models and inspect agent communication safely. | JWT-protected admin operations, observable agent flow, no prompt secrets | SA-G4 Agent admin and observability | active | `README.md`, `src/admin/`, `public/admin.html`, `TASKS.md` UX report backlog |
| Contact and voice lead requests must be stored and forwarded to leads and AI services. | Local lead evidence, CRM forwarding, AI analysis forwarding, privacy handling | SA-G5 Lead capture integrations | implemented foundation | `README.md`, `prisma/schema.prisma`, `src/leads/`, `public/index.html` |
| Production service must remain deployable and observable. | Kubernetes health, environment-only secrets, owner-approved deploy | SA-G6 Operations and deployment | active | `SYSTEM.md`, `k8s/`, `scripts/deploy.sh`, `src/health/` |
| Public, authenticated client, and admin frontend must convert customers, protect account data, and expose editable safe settings. | Auth-owned identity/RBAC, client data ownership, legal transparency, no frontend secrets | SA-G7 Commercial frontend and dashboards | planned | `docs/11_tasks/SA-G7-T1.md`, `docs/21_execution_plans/EP-SA-G7-FRONTEND.md` |

## Goal To Task Traceability

| Goal | Task | Task Document | Execution Plan | Context Package | Coding Prompt | Validation Report |
| --- | --- | --- | --- | --- | --- | --- |
| SA-G1 | SA-G1-T1 Search Quality From Failed Searches | `docs/11_tasks/SA-G1-T1.md` | `docs/21_execution_plans/EP-SA-BACKLOG.md` | `docs/13_context_packages/CP-SA-BACKLOG.md` | `docs/14_prompts/PROMPT-SA-BACKLOG.md` | `docs/12_validation/VAL-SA-BACKLOG.md` |
| SA-G2 | SA-G2-T1 Legal, Privacy, And Secret-Surface Audit | docs/11_tasks/SA-G2-T1.md | docs/21_execution_plans/EP-SA-G2-LEGAL-PRIVACY-AUDIT.md | docs/13_context_packages/CP-SA-G2-LEGAL-PRIVACY-AUDIT.md | docs/14_prompts/PROMPT-SA-G2-LEGAL-PRIVACY-AUDIT.md | docs/12_validation/VAL-SA-G2-LEGAL-PRIVACY-AUDIT.md |
| SA-G4 | SA-G4-T1 UX Improvement Report From Session Data | `docs/11_tasks/SA-G4-T1.md` | `docs/21_execution_plans/EP-SA-BACKLOG.md` | `docs/13_context_packages/CP-SA-BACKLOG.md` | `docs/14_prompts/PROMPT-SA-BACKLOG.md` | `docs/12_validation/VAL-SA-BACKLOG.md` |
| Documentation standard | SA-DOCS-T1 Install Intent Preservation System | `docs/11_tasks/SA-DOCS-T1.md` | documentation-only change in this session | this folder and source docs | owner request from 2026-06-12 | `docs/12_validation/VAL-SA-IPS-INSTALL.md` |
| SA-G7 | SA-G7-T1 Commercial Frontend, Authenticated Client Dashboard, And Admin Control Panel | `docs/11_tasks/SA-G7-T1.md` | `docs/21_execution_plans/EP-SA-G7-FRONTEND.md` | `docs/13_context_packages/CP-SA-G7-FRONTEND.md` | `docs/14_prompts/PROMPT-SA-G7-FRONTEND.md` | `docs/12_validation/VAL-SA-G7-FRONTEND.md` |
| Future owner-approved goal | future task | create before coding | create before coding | create before coding | create before coding | create before completion |

## Protected Boundaries

- Future goals must not rewrite the original product intent in `BUSINESS.md`; treat it as immutable unless owner explicitly approves a change.
- Future goals must not fabricate search result URLs or merchant availability.
- Future goals must not move ASR, LLM provider secrets, search provider secrets, auth ownership, database ownership, or central logging ownership into this service unless an owner-approved integration contract says so.
- Future goals must not weaken JWT protection for admin prompt/model/profile operations.
- Future goals must not expose authenticated client dashboard data without deriving ownership from Auth-validated user identity.
- Future goals must not remove legal transparency notices or cookie/privacy/terms pages.
- Future goals must not deploy to production without owner approval in the active session.

## Missing Upstream Documents

The following README-linked files are absent and must not be cited as completed evidence until created:

- `docs/API.md`
- `docs/DEPLOYMENT.md`
- `docs/DEVELOPMENT.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/INTEGRATION.md`
- `docs/MODEL_AND_ROLE_MANAGEMENT.md`
- `docs/AI_VERIFICATION_PROMPT.md`
