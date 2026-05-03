# CLAUDE.md (shop-assistant)

→ Ecosystem: [../shared/CLAUDE.md](../shared/CLAUDE.md) | Reading order: `BUSINESS.md` → `SYSTEM.md` → `AGENTS.md` → `TASKS.md` → `STATE.json`

---

## shop-assistant

**Purpose**: AI shopping assistant "Я хочу" — voice/text product search with iterative refinement, global price comparison, and merchant redirect.  
**Ports**: 4500 (blue) · 4501 (green)  
**Stack**: NestJS (backend, 45xx) · Next.js (frontend) · PostgreSQL · Prisma

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

**Ops**: `docker compose logs -f` · `./scripts/deploy.sh`
