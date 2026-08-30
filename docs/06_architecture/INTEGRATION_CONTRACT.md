# Integration Contract: Shop Assistant

```yaml
id: INTEGRATION-CONTRACT-shop-assistant
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - SYSTEM.md
  - BUSINESS.md
downstream:
  - docs/11_tasks/TASK-001-bootstrap-service.md
  - docs/12_validation/VAL-TASK-001-bootstrap-service.md
```

## purpose

This contract records the ecosystem dependencies required for shop-assistant to operate as the voice/text AI shopping assistant, and the fallback behavior when a dependency degrades.

## capability decisions

| Capability | Component | Decision | Reason |
|---|---|---|---|
| auth | auth-microservice | required | README.md and SYSTEM.md document AUTH_SERVICE_URL for JWT validation of admin and optional user-bound sessions. |
| postgres | database-server (db-server-postgres) | required | README.md/SYSTEM.md document PostgreSQL via DB_*/DATABASE_URL and Prisma for sessions, messages, search runs, results, choices, agent prompts, and lead requests. |
| redis | database-server (db-server-redis) | not-applicable | .env.example declares optional REDIS_HOST/REDIS_PORT/REDIS_PASSWORD/REDIS_DB variables, but no code reference to Redis was found in src/; the service does not currently use Redis. |
| logging | logging-microservice | required | README.md/SYSTEM.md document LOGGING_SERVICE_URL for centralized logging of operations and errors. |
| notifications | notifications-microservice | not-applicable | No notifications-microservice integration is documented in README.md, SYSTEM.md, or .env.example; lead notifications are delegated via leads-microservice, not a direct notifications integration. |
| ai | ai-microservice | required | README.md/SYSTEM.md document AI_SERVICE_URL for ASR, LLM query extraction/refinement, agent prompts, delegated external web search, and lead analysis (POST /api/process-submission). |
| payments | payments-microservice | required | TASKS.md documents SA-G8-B2 billing/entitlement implementation with Prisma checkout/entitlement models and a runtime-gated payments client, and .env.example declares PAYMENTS_SERVICE_URL/PAYMENTS_API_KEY plus unified PAYMENT_* variables. |
| catalog | catalog-microservice | not-applicable | shop-assistant searches the open internet for products via ai-microservice-delegated search; it does not integrate with the internal catalog-microservice for its own product data. |
| orders | orders-microservice | not-applicable | No orders-microservice integration is documented; shop-assistant redirects users to external merchant pages rather than creating internal orders. |
| warehouse | warehouse-microservice | not-applicable | No warehouse/inventory integration exists in this repository. |
| invoices | invoices-microservice | not-applicable | No invoicing integration exists in this repository; billing uses payments-microservice's checkout/entitlement model directly. |
| object-storage | minio-microservice | not-applicable | No object-storage environment variable or code reference was found in .env.example or src/. |
| event-bus | RabbitMQ | not-applicable | No message-broker environment variable or code reference was found in .env.example or src/. |
| docs-rag | docs-rag-microservice | required | This service is a documentation-onboarded ecosystem repository and should be discoverable via docs-rag-microservice, consistent with other onboarded services. |
| monitoring | monitoring-microservice | required | Runtime health and rollout readiness must be observable through the shared monitoring model, consistent with the documented GET /health endpoint and blue/green deployment. |
| backups | backups-microservice | required | This service's PostgreSQL database (shop_assistant) holds production session, search, lead, and billing/entitlement data and requires backup coverage consistent with other ecosystem databases. |

## data ownership

shop-assistant owns session, message, search-run, result, choice, agent-prompt, and lead-request data in its own PostgreSQL database. leads-microservice owns downstream CRM/confirmation processing of forwarded lead data. payments-microservice owns payment provider execution; shop-assistant owns only its checkout/entitlement request state.

## authentication and authorization

- Admin routes (/api/admin/*) require JWT validation via auth-microservice.
- Public session/search endpoints do not require end-user authentication by default; optional userId association is supported when provided.

## synchronous dependencies

- ai-microservice calls for ASR, LLM refinement, agent orchestration, and delegated web search
- PostgreSQL reads/writes for session/search/lead/billing state
- auth-microservice JWT validation for admin routes
- payments-microservice checkout/entitlement calls, gated by SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE

## asynchronous dependencies

- Lead forwarding to leads-microservice for CRM and confirmations
- Structured log delivery to logging-microservice

## degraded operation

When ai-microservice is unavailable, voice transcription, query refinement, agent orchestration, and web search are all blocked since search is delegated to ai-microservice; no local fallback search exists. When payments-microservice is unavailable or the runtime gate is off, live payment creation is blocked as the safe default. When leads-microservice is unavailable, lead requests remain recorded in the local LeadRequest table for later forwarding.

## validation

- GET /health passes
- Search latency target < 2s
- All redirects resolve to real, non-fabricated merchant URLs
- Billing/entitlement build/Prisma/diff/no-secret validation passes; live checkout smoke requires owner approval
