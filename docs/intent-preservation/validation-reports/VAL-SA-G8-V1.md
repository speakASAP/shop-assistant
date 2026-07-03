# VAL-SA-G8-V1

Status: passed
Owner: SA-G8-V1 release-validation worker
Created: 2026-07-03
Validated: 2026-07-03
Branch: `codex/sa-g8-v1-release-validation`

## Intent Preservation Chain

Vision: Shop Assistant converts natural language or voice shopping intent into truthful comparable merchant options while preserving privacy and legal transparency.

Goal Impact: `GOAL-SA-G8` moves Shop Assistant from pilot-ready MVP to sellable user-facing service.

System: NestJS backend, static frontend, PostgreSQL/Prisma, hosted Auth, ai-microservice, leads-microservice, logging, Kubernetes production at `https://shop-assistant.alfares.cz`.

Feature: Sales-readiness release validation for public routes, hosted Auth surfaces, customer APIs, admin APIs, non-admin RBAC denial, Agent Flow RBAC, and account ownership isolation.

Task: `SA-G8-V1` release validation gate.

Execution Plan: `EP-SA-G8-SALES-READINESS` final validation workstream.

Coding Prompt: `PROMPT-SA-G8-SALES-READINESS`.

Code: No application code changes were required. Existing SA-G7 verifier scripts provided safe token-file validation. This document records the SA-G8-V1 evidence.

Validation: Passed; see command evidence below.

## Validation Evidence

### Repository Preflight

Command:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && pwd && git status --short --branch && git branch --show-current && git log -1 --oneline'
```

Result:

```text
/home/ssf/Documents/Github/shop-assistant
## main...origin/main
main
51c50bc docs: add SA-G8 sales readiness plan
```

### Current No-Secret Smoke

Command:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && BASE_URL=https://shop-assistant.alfares.cz REQUIRE_TOKEN_SMOKE=0 SMOKE_CURL_MAX_TIME=12 ./scripts/sa-g7-live-smoke.sh'
```

Result summary:

```text
Public route availability: PASS, including /, /health, dashboard/admin/login/register, diagnostics, and legal aliases.
Public copy/auth-surface checks: PASS, including hosted Auth handoff, no local password form, no persistent token write, and public landing settings contract.
Unauthenticated protection: PASS, protected account/admin/agent endpoints returned 401 and disabled local auth endpoints returned 404.
Token-backed sections: SKIP expected, because no token files were supplied for this no-secret run.
Failures: 0
Skipped optional checks: 3
```

### Strict Customer/Admin/Non-Admin Token Smoke

Command:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && OUTPUT_ENV=/tmp/sa-g8-v1-smoke.env TOKEN_DIR=/tmp/sa-g8-v1-smoke-tokens BASE_URL=https://shop-assistant.alfares.cz REQUIRE_TOKEN_SMOKE=1 SMOKE_CURL_MAX_TIME=12 ./scripts/sa-g7-strict-token-smoke.sh'
```

Result summary:

```text
Token helper: wrote env file containing token-file paths only; wrote token files under /tmp/sa-g8-v1-smoke-tokens; exported key names only.
Public route/copy/auth-surface checks: PASS.
Unauthenticated protection: PASS.
Customer-token checks: PASS for /api/me, dashboard, sessions, choices, profiles, saved criteria, and customer dashboard/account contract.
Admin-token checks: PASS for overview, settings, prompts, AI models, operations sessions/leads/profiles/saved criteria, settings metadata, admin models contract, and admin list contracts.
Non-admin forbidden checks: PASS with HTTP 403 for protected admin surfaces.
Agent Flow checks: SKIP because AGENT_FLOW_SESSION_ID was not supplied in this run.
Failures: 0
Skipped optional checks: 2
```

### Agent Flow Strict Token Smoke

Command:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && OUTPUT_ENV=/tmp/sa-g8-v1-agent-flow.env TOKEN_DIR=/tmp/sa-g8-v1-agent-flow-tokens BASE_URL=https://shop-assistant.alfares.cz REQUIRE_TOKEN_SMOKE=1 SMOKE_CURL_MAX_TIME=12 ./scripts/sa-g7-agent-flow-strict-smoke.sh'
```

Result summary:

```text
Created smoke Agent Flow session id for strict checks.
Token helper: wrote env file containing token-file paths only; wrote token files under /tmp/sa-g8-v1-agent-flow-tokens; exported key names only.
Public route/copy/auth-surface checks: PASS.
Unauthenticated protection: PASS.
Customer-token checks: PASS.
Admin-token checks: PASS, including GET /api/sessions/:id/agent-communications admin -> HTTP 200.
Non-admin forbidden checks: PASS, including GET /api/sessions/:id/agent-communications non-admin -> HTTP 403.
Failures: 0
Skipped optional checks: 0
```

### Two-Account Ownership Negative Smoke

Command shape:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && set -a && . /tmp/sa-g8-v1-smoke.env && set +a && node <inline ownership verifier>'
```

The verifier read `CUSTOMER_TOKEN_FILE` and `NON_ADMIN_TOKEN_FILE`, created minimal synthetic resources under the non-admin account, attempted cross-account access with the customer token, and cleaned up the deletable fixtures with the owning token. Token values and fixture IDs were not printed.

Result:

```text
PASS owner creates profile fixture -> HTTP 201
PASS owner creates account session fixture -> HTTP 201
PASS owner creates saved-criteria fixture -> HTTP 201
PASS cross-account profile update denied -> HTTP 404
PASS cross-account session detail denied -> HTTP 404
PASS cross-account session feedback denied -> HTTP 404
PASS cross-account saved criteria read denied -> HTTP 404
PASS cross-account saved criteria run denied -> HTTP 404
Failures: 0
```

### Diff Hygiene

Command:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/shop-assistant && git diff --check'
```

Result: passed with no output.

## Sensitive Data Check

- No raw JWTs were printed.
- Token-backed checks used token files and env files containing only token-file paths.
- Token files were written under `/tmp/sa-g8-v1-smoke-tokens` and `/tmp/sa-g8-v1-agent-flow-tokens` on the remote host.
- No raw production queries, lead contacts, profile PII, database URLs, or Vault secret values were exported in the evidence.
- The ownership verifier printed only HTTP status evidence and did not print resource IDs.

## Skipped Checks And Blockers

- No release-gate validation checks remain skipped after the Agent Flow strict smoke.
- `[MISSING: owner approval for production deploy]` remains outside this validation worker scope; no deploy was requested or run.

## Result

Release validation gate status: PASS for current deployed `https://shop-assistant.alfares.cz` runtime.

Evidence covers no-secret smoke, customer-token account checks, admin-token operations checks, non-admin forbidden checks, Agent Flow RBAC, and two-account ownership negative tests.

## Final Integrated Orchestrator Gate - 2026-07-03

After merging the SA-G8 workstreams into `main`, the orchestrator reran the release gate against the integrated source state.

Integrated commits on `main` at validation time:

- `4ed47cb docs: record SA-G8 billing entitlement blocker`
- `b41ca52 Improve SA-G8 conversion UX`
- `fbd1074 feat: add privacy retention and search rate limits`
- `6085a13 Improve SA-G8 search recovery`

Commands:

```bash
git status --short --branch
git diff --check
npm run build
DATABASE_URL=postgresql://user:pass@localhost:5432/shop_assistant npx prisma validate
node scripts/sa-g8-s1-search-quality-probes.js
BASE_URL=https://shop-assistant.alfares.cz REQUIRE_TOKEN_SMOKE=0 SMOKE_CURL_MAX_TIME=12 ./scripts/sa-g7-live-smoke.sh
OUTPUT_ENV=/tmp/sa-g8-final-smoke.env TOKEN_DIR=/tmp/sa-g8-final-smoke-tokens BASE_URL=https://shop-assistant.alfares.cz REQUIRE_TOKEN_SMOKE=1 SMOKE_CURL_MAX_TIME=12 ./scripts/sa-g7-strict-token-smoke.sh
OUTPUT_ENV=/tmp/sa-g8-final-agent-flow.env TOKEN_DIR=/tmp/sa-g8-final-agent-flow-tokens BASE_URL=https://shop-assistant.alfares.cz REQUIRE_TOKEN_SMOKE=1 SMOKE_CURL_MAX_TIME=12 ./scripts/sa-g7-agent-flow-strict-smoke.sh
git status --short --branch
```

Result summary:

- `git diff --check`: pass.
- `npm run build`: pass.
- `npx prisma validate`: pass with non-secret placeholder `DATABASE_URL`.
- `node scripts/sa-g8-s1-search-quality-probes.js`: pass; no-result path attempted 4 searches with 3 recovery queries and `rawQueryLogged=false`; result-preservation path kept 1 valid HTTP/HTTPS result, `invalidUrlCount=0`, `firstResultPosition=1`.
- No-secret live smoke: `Failures: 0`, expected token sections skipped.
- Strict token smoke: `Failures: 0`, only Agent Flow skipped in that run because it is covered by the dedicated agent-flow wrapper.
- Agent Flow strict token smoke: `Failures: 0`, `Skipped optional checks: 0`; admin Agent Flow API returned `200`, non-admin returned `403`.
- Final repository status: `## main...origin/main` with no dirty files before this report append.

Sensitive-data handling:

- Token-backed checks used token-file envs under `/tmp` and did not print token values.
- No raw production queries, lead contacts, profile PII, database URLs, Vault values, or JWT values were added to this report.

Integrated release-gate status: PASS for source validation and live auth/API smoke. Production deployment of the newly merged source was not run in this orchestrator pass.
