# Repository Agent Instructions

Shared rules live here:

- Codex profile: `/home/ssf/.codex/AGENTS.md`
- Cross-agent standard: `/home/ssf/.ai-agent-standards/CROSS_AGENT_AUTOMATION_STANDARD.md`
- Repository operations: `AGENT_OPERATIONS.md`

Read those first, then follow the repository-specific notes below and the current planning/status files.


## Repository-Specific Notes

# Agents: shop-assistant

## Intent Preservation System

Before any implementation work, agents must read and follow the Shop Assistant Intent Preservation System:

- `docs/intent-preservation/README.md`
- `docs/intent-preservation/TRACEABILITY_MATRIX.md`
- `docs/intent-preservation/PRE_CODING_GATE.md`
- the selected task document under `docs/intent-preservation/tasks/`
- the matching execution plan, context package, coding prompt, and validation report

Coding must not start until the pre-coding gate has traceability, invariant impact, sensitive-data classification, contract/schema impact, privacy/legal impact, replay/determinism impact, external-service boundary impact, validation commands, and a pass or pass-with-documented-risk result.

Preserve the product intent from `BUSINESS.md`, `SYSTEM.md`, `README.md`, `TASKS.md`, and `STATE.json`. Do not fabricate merchant URLs, expose secrets or raw production personal data, weaken admin JWT protection, remove GDPR/ePrivacy/EU AI Act transparency, or deploy to production without explicit owner approval in the active session.

## Coordinator Config

```yaml
model_tier: cheap
cycle_interval_minutes: 60
max_tasks_per_cycle: 5
```

## Worker Pool Config

```yaml
max_concurrent_workers: 2
default_model_tier: free
allowed_mcp_servers: [filesystem, postgres]
```

## Active Agents
<!-- Coordinator-maintained -->
