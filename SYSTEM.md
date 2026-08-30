# System: Shop Assistant

```yaml
id: SYSTEM-shop-assistant
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - BUSINESS.md
  - docs/01_vision/VISION.md
downstream:
  - docs/06_architecture/INTEGRATION_CONTRACT.md
  - docs/11_tasks/TASK-001-bootstrap-service.md
```

## purpose

shop-assistant is the ecosystem's AI shopping assistant, orchestrating voice/text-driven, iteratively refined, multi-product/multi-profile search with real merchant redirect, plus lead capture and gated billing.

## responsibilities

- Create sessions and accept user queries (text or audio URL)
- Use ai-microservice for ASR (speech-to-text) and LLM (query extraction/refinement, agent orchestration)
- Call external search (delegated via ai-microservice's Serper integration) for web search; store and return results
- Refine search from user feedback; record chosen product and return redirect URL
- Capture and forward contact-form/voice leads to leads-microservice and ai-microservice for analysis
- Provide an admin panel for AI agent prompt/model management
- Implement runtime-gated billing/entitlement via payments-microservice

## non-responsibilities

- It does not itself run external search API calls directly; Serper/API keys are configured in ai-microservice, not shop-assistant
- It does not store user voice/text search content beyond the session
- It does not own payment provider execution (delegated to payments-microservice)

## inputs

- User text/voice queries via POST /api/sessions/:id/query
- User feedback via POST /api/sessions/:id/feedback
- Contact-form/voice lead submissions via POST /api/leads/submit
- Admin prompt/model CRUD via authenticated /api/admin/* routes

## outputs

- Refined search results and merchant redirect URLs
- Lead submissions forwarded to leads-microservice and ai-microservice
- Stored sessions, messages, search runs, results, choices, agent prompts, and lead requests in PostgreSQL
- Structured logs to logging-microservice

## dependencies

- ai-microservice via AI_SERVICE_URL for ASR, LLM query extraction/refinement, agent prompts, lead analysis (POST /api/process-submission), and delegated external web search
- auth-microservice via AUTH_SERVICE_URL for JWT validation of admin and optional user-bound sessions
- PostgreSQL via DB_*/DATABASE_URL and Prisma for sessions, messages, search data, lead requests, and (future) profiles/saved criteria
- logging-microservice via LOGGING_SERVICE_URL for central logging
- leads-microservice via LEADS_SERVICE_URL for contact/voice lead submissions
- payments-microservice via PAYMENTS_SERVICE_URL/PAYMENTS_API_KEY (or unified PAYMENT_* variables), gated by SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE
- Optional Redis via REDIS_HOST/REDIS_PORT/REDIS_PASSWORD/REDIS_DB (declared in .env.example but no code reference found)

## upstream traceability

This system implements the approved intent in `BUSINESS.md` and the product vision in `docs/01_vision/VISION.md`.

## downstream artifacts

- `docs/06_architecture/INTEGRATION_CONTRACT.md`
- `docs/11_tasks/TASK-001-bootstrap-service.md`
- `docs/12_validation/VAL-TASK-001-bootstrap-service.md`
- `docs/21_execution_plans/EP-TASK-001-bootstrap-service.md`

## validation criteria

- GET /health passes
- Search latency target < 2s
- Search results must resolve to real merchant URLs (no fabricated links) per BUSINESS.md constraint
- Billing/entitlement build/Prisma/diff/no-secret validation passed per TASKS.md SA-G8-B2 (live payment creation remains gated by runtime keys, callback token, public URL allowlist, and owner-approved checkout smoke)

## open questions

- Live authenticated checkout smoke for the billing/entitlement flow remains pending owner approval before enabling SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE in production (TASKS.md SA-G8-B2).
