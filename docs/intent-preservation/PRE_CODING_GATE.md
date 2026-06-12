# Shop Assistant Pre-Coding Gate

```yaml
id: SA-IPS-PRE-CODING-GATE
status: active
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/intent-preservation/README.md
  - docs/intent-preservation/TRACEABILITY_MATRIX.md
  - BUSINESS.md
  - SYSTEM.md
  - README.md
downstream:
  - docs/intent-preservation/execution-plans/
  - docs/intent-preservation/validation-reports/
related_adrs: []
```

## Purpose

This gate prevents coding from starting from vague intent. It must be completed for every Shop Assistant implementation task before source files are edited.

## Required Inputs

- selected task from `TASKS.md` or an owner-approved task document;
- task document from `docs/intent-preservation/tasks/`;
- preserved intent from `BUSINESS.md`, `SYSTEM.md`, and `README.md`;
- traceability matrix from `docs/intent-preservation/TRACEABILITY_MATRIX.md`;
- current machine state from `STATE.json`;
- current git and remote working-tree status;
- relevant source, Prisma, public, deployment, and script files listed by the execution plan.

## Blocking Checks

Coding is blocked when any of these checks fail:

- no selected task or goal;
- selected task does not map to preserved Shop Assistant intent;
- task has no upstream traceability;
- task has no goal impact statement;
- project invariant impact is missing;
- sensitive-data classification is missing;
- contract/schema impact is missing;
- replay, idempotency, or determinism impact is missing for state-changing work;
- legal/privacy impact is missing for public UX, AI, session, lead, profile, saved criteria, or logging work;
- AI/search provider boundary is ambiguous;
- external service ownership boundary is ambiguous;
- execution plan is missing;
- context package is missing;
- coding prompt is missing;
- validation commands are not listed;
- owner approval is missing for production deployment or secret changes.

## Required Evidence

Record this evidence in the task or validation report:

```text
Gate:
Date:
Goal:
Task:
Repository root:
Git status:
Remote status:
Execution plan:
Context package:
Coding prompt:
Invariants checked:
Sensitive-data classification:
Contract/schema impact:
Privacy/legal impact:
Replay/determinism impact:
External service boundary impact:
Validation commands:
Result:
```

## Shop-Assistant-Specific Checks

For search and result-ranking work, verify before coding:

- result URLs remain real merchant URLs;
- no fabricated price, availability, or merchant data is introduced;
- search provider credentials remain outside this repository;
- rate limiting and failure behavior are considered;
- multi-product and priority behavior remains traceable to the user request.

For AI and prompt work, verify before coding:

- ASR and LLM ownership remains in `ai-microservice`;
- prompt examples do not contain secrets, production user data, or real customer identifiers;
- agent communication logs are limited to diagnostic content that is acceptable under the project privacy rules;
- model/role admin changes stay JWT-protected.

For session, profile, saved criteria, and lead work, verify before coding:

- retention and storage scope are explicit;
- profile access is scoped by authenticated user identity;
- lead forwarding to leads and AI services is preserved when in scope;
- request bodies, attachments, and voice metadata are not written to logs beyond approved diagnostic metadata.

For public UI and legal work, verify before coding:

- EU AI Act transparency remains prominent where users interact with AI;
- privacy, cookie, and terms pages remain reachable;
- cookie consent behavior is not weakened;
- public pages do not leak environment values or secrets.

For deployment and operations work, verify before coding:

- `.env` and Kubernetes secrets are not committed;
- health endpoint remains available;
- production deployment has explicit owner approval in the active session;
- rollback and post-deploy checks are listed in the execution plan.

## Gate Result Policy

- `pass`: coding may start inside the execution-plan file scope.
- `pass-with-documented-risk`: coding may start only when the risk does not alter behavior, privacy, legal compliance, or ownership boundaries.
- `fail`: coding must not start. Fill missing docs, split the task, or ask the owner.
