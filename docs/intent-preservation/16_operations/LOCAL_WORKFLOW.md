# Local And Remote Workflow

    id: SA-OPS-LOCAL-WORKFLOW
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - AGENTS.md
      - scripts/deploy.sh
    downstream:
      - docs/intent-preservation/PRE_CODING_GATE.md
    related_adrs: []

## Remote Work Rule

Shop Assistant work is performed on alfares under /home/ssf/Documents/Github/shop-assistant.

## Pre-Coding Flow

Select a task, verify IPS traceability, fill execution plan, context package, coding prompt, and validation report draft, run the pre-coding gate, then edit only files in scope.

## Deployment Flow

Deployment uses ./scripts/deploy.sh only after explicit owner approval in the active session.

## Secret Rule

Do not commit .env, env backups, or secret values from Kubernetes or production configuration.
