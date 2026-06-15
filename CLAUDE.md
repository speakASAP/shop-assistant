# CLAUDE.md (shop-assistant)

→ Ecosystem: [../shared/CLAUDE.md](../shared/CLAUDE.md) | Reading order: `BUSINESS.md` → `SYSTEM.md` → `AGENTS.md` → `TASKS.md` → `STATE.json`

---

## Knowledge Retrieval — docs-rag-microservice (MANDATORY, query before reading files)

**Query the RAG before reading source files** — saves 2000-5000 tokens per answer.

```bash
kubectl -n statex-apps exec deployment/shop-assistant -- curl -s -X POST http://docs-rag-microservice:3397/retrieval/agent-context \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat ~/.claude/rag-token)" \
  -d '{"query": "YOUR QUESTION HERE", "maxTokens": 3000}'
```


---

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

## Central Instruction Source

Shared agent rules now live in `/home/ssf/.claude/CLAUDE.md`, `/home/ssf/Documents/Github/CLAUDE.md`, `/home/ssf/.codex/AGENTS.md`, and `/home/ssf/.ai-agent-standards/CROSS_AGENT_AUTOMATION_STANDARD.md`. Keep this file for repository-specific Claude constraints only; do not duplicate shared operating rules here.
