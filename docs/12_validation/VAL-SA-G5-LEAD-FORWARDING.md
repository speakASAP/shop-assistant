# Validation Report: SA-G5 Lead Forwarding Resilience

    id: VAL-SA-G5-LEAD-FORWARDING
    status: deployed_live_lead_smoke_passed
    owner: shop-assistant-owner
    created: 2026-06-13
    task: docs/11_tasks/SA-G5-T1.md

## Pre-Coding Gate

- Goal checked: `GOAL-SA-G5` requires local lead save plus forwarding to leads and AI services.
- Feature checked: `FEAT-004` requires local save before forwarding, environment-only secrets, and named validation evidence.
- Selected slice: preserve public lead capture during downstream forwarding failure and make integration state visible to protected operations.

## Validation Log

- 2026-06-13: Added additive Prisma migration `20260613_add_lead_forwarding_status` for lead forwarding and AI analysis status/error/timestamp fields.
- 2026-06-13: Updated public lead submission so local save remains durable if leads-microservice forwarding fails; public fallback response is generic and does not expose downstream errors.
- 2026-06-13: Updated AI analysis forwarding to persist `sent`, `skipped`, or `failed` state without blocking lead capture.
- 2026-06-13: Exposed integration status fields through protected admin operations lead list/detail responses.
- 2026-06-13: `npm run prisma:generate` passed.
- 2026-06-13: Static secret-hygiene scan of touched SA-G5 files found no embedded secret values; matches were environment-token handling and docs warnings only.
- 2026-06-13: `npm run build` passed.
- 2026-06-13: `npx prisma validate` passed.

## Deployment

- 2026-06-13: Owner approved deployment.
- 2026-06-13: First Docker build failed in `npm run build` with `EMFILE: too many open files, watch '/app/public'` because Nest asset watching was enabled in `nest-cli.json`.
- 2026-06-13: Fixed build hardening by changing Nest asset `watchAssets` to `false`; `npm run build` passed and commit `9dafe1c` was pushed.
- 2026-06-13: Docker image build passed and was pushed as `localhost:5000/shop-assistant:latest` with registry push digest `sha256:a71aa4ec6c15dbf378461b161bf57474eef5f44f0442704edc523d2fcd934011`.
- 2026-06-13: `./scripts/deploy.sh` preflight passed, manifests applied, and rollout restart began.
- 2026-06-13: Rollout timed out while new pod `shop-assistant-65988f784d-c226c` stayed in `ContainerCreating` / image `Pulling` before app startup; no application logs were available.
- 2026-06-13: Kubernetes events showed cluster/runtime pull and pod sandbox delays across multiple services, indicating a node/container-runtime deployment blocker rather than an SA-G5 application crash.
- 2026-06-13: Production remained available from old pod `shop-assistant-5b699c65f6-szhz2`; `curl -I https://shop-assistant.alfares.cz/` returned HTTP 200.
- 2026-06-13: Rolled back the timed-out rollout with `kubectl rollout undo deployment/shop-assistant -n statex-apps`; deployment reported successfully rolled out on the previous ready replica.

## Deployment Result

SA-G5 image is built and pushed, but production is not running the SA-G5 pod because the rollout was blocked before container startup by the node/runtime image pull/create path. Prisma migration `20260613_add_lead_forwarding_status` was not applied during this failed rollout.

## Deployment Retry

- 2026-06-13: Retried approved deployment after the stuck rollout artifact cleared.
- 2026-06-13: Rollout completed successfully on pod `shop-assistant-5d8d7f76f7-zkj9j`.
- 2026-06-13: Running pod image is `localhost:5000/shop-assistant@sha256:a71aa4ec6c15dbf378461b161bf57474eef5f44f0442704edc523d2fcd934011`.
- 2026-06-13: `https://shop-assistant.alfares.cz/health` returned `{"status":"ok"}`.
- 2026-06-13: `npx prisma migrate status` inside the deployed pod reported 11 migrations and database schema up to date.
- 2026-06-13: Deploy script bundled SA-G7 frontend/auth smoke still reported pre-existing copy/auth-surface failures, but health and rollout passed; SA-G5 validation was run separately.

## Live SA-G5 Smoke

- Run id: `sa-g5-live-smoke-20260613170041`.
- Request id: `a2c3726c-235f-48a1-a8d4-35066e4d184d`.
- Public response: `status=new`, `confirmationSent=true`, `leadForwardingStatus=sent`, `aiAnalysisStatus=failed`, downstream lead id present, AI submission id absent.
- Database row: `leadForwardingStatus=sent`, no lead forwarding error, `leadForwardedAt=2026-06-13T17:00:44.000Z`, `aiAnalysisStatus=failed`, AI analysis error captured, `triageStatus=new`.
- Result: lead capture and leads-microservice forwarding passed; AI analysis failure was non-blocking and persisted as designed.
