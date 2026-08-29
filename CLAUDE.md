# Claude Instructions

Shared rules live here:

- Claude profile: `/home/ssf/.claude/CLAUDE.md`
- Shared ecosystem instructions: `/home/ssf/Documents/Github/CLAUDE.md`
- Codex profile: `/home/ssf/.codex/AGENTS.md`
- Cross-agent standard: `/home/ssf/.ai-agent-standards/CROSS_AGENT_AUTOMATION_STANDARD.md`
- Repository operations: `AGENT_OPERATIONS.md`

Read those first, then follow the repository-specific notes below and the current planning/status files.


## Repository-Specific Notes

# CLAUDE.md (shop-assistant)

→ Ecosystem: [../shared/CLAUDE.md](../shared/CLAUDE.md) | Reading order: `BUSINESS.md` → `SYSTEM.md` → `AGENTS.md` → `TASKS.md` → `STATE.json`

---

## Knowledge Retrieval

Use `docs-rag-microservice` for bounded discovery when it is healthy, then
verify deployment, security, database, integration and public-contract facts
against the cited Git source. Git remains authoritative.

Authority and fallback rules:
`/home/ssf/Documents/Github/shared/docs/DOCUMENTATION_AUTHORITY.md`.

Do not generate tokens in documentation or assume an unconfident/failed RAG
response means that source documentation does not exist.

## shop-assistant

**Purpose**: AI shopping assistant "Я хочу" — voice/text product search with iterative refinement, global price comparison, and merchant redirect.  
**Port**: 4500 · **Domain**: https://shop-assistant.alfares.cz  
**Stack**: NestJS (backend) · Next.js (frontend) · PostgreSQL · Prisma

### Key constraints
- Never store user voice/text searches beyond the session — privacy requirement
- External search API calls must be rate-limited (Serper API)
- Search results must link to real merchant URLs only — never fabricated links
- All ASR (voice-to-text) and LLM query refinement via ai-microservice

### Key integrations
| Service | Usage |
|---------|-------|
| ai-microservice:3380 | ASR (voice → text) + LLM refinement |
| auth-microservice:3370 | User auth |

**Ops**: `kubectl logs -n statex-apps -l app=shop-assistant -f` · `kubectl rollout restart deployment/shop-assistant -n statex-apps` · `./scripts/deploy.sh`
