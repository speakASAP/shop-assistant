# Shop Assistant

## status

shop-assistant is an active production service (STATE.json: stage active) providing the "Я хочу" AI shopping assistant with voice/text search, iterative refinement, and merchant redirect.

## documentation authority

- `BUSINESS.md` for goals, constraints, and success metrics
- `SYSTEM.md` for architecture, endpoints, and integrations
- `docs/DEVELOPMENT.md` for architecture, MVP scope, and workflows
- `docs/API.md`, `docs/DEPLOYMENT.md`, `docs/INTEGRATION.md`, `docs/MODEL_AND_ROLE_MANAGEMENT.md` for detailed operational contracts
- `docs/01_vision/VISION.md` for durable product direction

## capabilities

- Voice or text product search with iterative refinement via feedback
- Global internet search for best price via ai-microservice-delegated Serper integration, redirect to merchant product page
- Multi-product search in one request (query parsed into multiple search intents)
- Multi-profile/recipient search per account
- Optional saved search criteria for reuse
- Contact-form/voice lead capture stored in shop-assistant DB (LeadRequest) and forwarded to leads-microservice and ai-microservice for analysis
- Admin panel for CRUD of AI agent prompts and model/role management
- Billing/entitlement (checkout, callback) implemented behind runtime-gated payment creation (SA-G8-B2)

## interfaces

- `POST /api/leads/submit`, `POST /api/sessions`, `POST /api/sessions/:id/query`, `POST /api/sessions/:id/feedback`, `GET /api/sessions/:id/results`, `GET /api/sessions/:id/choice/:productId`, `GET /api/sessions/:id/choice/:productId/redirect`, `GET /api/sessions/:id/messages`, `GET /api/sessions/:id/agent-communications`
- Admin (JWT required): `GET/POST /api/admin/prompts`, `GET/PUT/DELETE /api/admin/prompts/:id`, `GET /api/admin/ai-models`
- `GET /health`, `GET /test.html`, `GET /admin.html`, `GET /debug.html`
- Domain: shop-assistant.alfares.cz, Ports: 4500 (blue) / 4501 (green)

## development

- Stack: NestJS backend, Next.js frontend, PostgreSQL, Prisma
- See docs/DEVELOPMENT.md for architecture, MVP scope, and workflows
- Container runs `prisma migrate deploy` on startup

## configuration

- All configuration via `.env`; see `.env.example` for keys (no secrets in example)
- Backup `.env` before changes; never commit `.env`
- Company/legal info loaded from `.env` at runtime (COMPANY_LEGAL_NAME, COMPANY_ICO, COMPANY_DIC, COMPANY_ADDRESS, COMPANY_PHONE, LEGAL_EMAIL, PRIVACY_EMAIL, DPO_EMAIL, LEGAL_JURISDICTION)
- Billing/payments gated by SHOP_ASSISTANT_BILLING_ENABLE_PAYMENT_CREATE, PAYMENTS_SERVICE_URL/PAYMENTS_API_KEY (or PAYMENT_* unified variables)

## deployment

- Deploy command: `./scripts/deploy.sh`
- Uses docker-compose.blue.yml and docker-compose.green.yml; calls nginx-microservice/scripts/blue-green/deploy-smart.sh shop-assistant
- Target: Kubernetes (k3s) `statex-apps` namespace
- First deploy requires creating the `shop_assistant` PostgreSQL database before `prisma migrate deploy` runs on container start

## health and observability

- Health endpoint: `GET /health`
- Structured logging via `logging-microservice` (`LOGGING_SERVICE_URL`)
- EU AI Act (Art. 50) transparency notice and cookie/privacy/terms legal pages served at the landing page
