# VAL-SA-BACKLOG: Current Backlog Validation Report

```yaml
id: VAL-SA-BACKLOG
status: draft
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md
downstream:
  - TASKS.md
  - STATE.json
related_adrs: []
```

## Artifact Validated

Future selected Shop Assistant backlog task.

## Validation Scope

Planned scope depends on selected task:

- SA-G1-T1: failed-search quality analysis, response-quality improvement, real URL preservation, synthetic or anonymized checks, build verification.
- SA-G4-T1: privacy-safe UX improvement report, data-safety checks, optional build verification if code changes.

## Evidence

No implementation evidence yet. This report is prepared as the required validation target for future backlog work.

## Gate Evidence

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

## Sensitive-Data Scan Evidence

To be filled during implementation. Required: confirm no `.env` values, JWTs, API keys, raw production user queries, voice transcripts, lead contact details, or personal profile data were added to docs/tests/reports.

## Passed Criteria

To be filled during implementation.

## Failed Criteria

To be filled during implementation.

## Deviations

To be filled during implementation.

## Recommendation

Do not mark the selected backlog task complete until validation evidence is recorded here and `TASKS.md` plus `STATE.json` are updated.

## SA-G1-T1 Completion Evidence - 2026-06-12

Gate:
Date: 2026-06-12
Goal: SA-G1 Request-to-result quality
Task: SA-G1-T1 Search Quality From Failed Searches
Repository root: /home/ssf/Documents/Github/shop-assistant
Git status: existing unrelated remote changes present in .env.example, AGENTS.md, STATE.json, TASKS.md, k8s/external-secret.yaml, and docs/; SA-G1-T1 source change is src/sessions/search.service.ts
Remote status: edited directly on alfares
Execution plan: docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md
Context package: docs/intent-preservation/context-packages/CP-SA-BACKLOG.md
Coding prompt: docs/intent-preservation/coding-prompts/PROMPT-SA-BACKLOG.md
Invariants checked: real merchant URL truthfulness, no fabricated result data, ai-microservice search ownership, privacy-safe logging, no deployment
Sensitive-data classification: implementation used synthetic/common query-pattern recovery only; no raw production user queries, voice transcripts, lead details, JWTs, or secret values were added
Contract/schema impact: no API response shape, Prisma schema, external-service contract, legal page, admin auth, or deployment contract changed
Privacy/legal impact: no public legal or cookie behavior changed; query logging remains preview-only and does not add raw data exports
Replay/determinism impact: local query normalization, result URL filtering, dedupe, and recovery-query generation are deterministic; external search remains nondeterministic and is validated by result shape and real URL checks
External service boundary impact: search remains delegated to ai-microservice /api/shop-assistant/search; this repository added only local input/result hygiene and bounded empty-result recovery
Validation commands:
- npm run build
- rg -n --glob "!node_modules/**" --glob "!*package-lock*" "(AIza|AKIA|BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY|jwt|secret|password|token|api[_-]?key)" src/sessions/search.service.ts docs/intent-preservation/validation-reports/VAL-SA-BACKLOG.md TASKS.md STATE.json || true
Result: pass. Build completed successfully. Secret scan found only the existing AI_SERVICE_TOKEN environment-variable reference in src/sessions/search.service.ts and no secret value.

Passed criteria:
- Failed-search behavior now retries up to two deterministic recovery queries only after the first search returns no usable results.
- Search results are filtered to HTTP/HTTPS URLs with non-empty titles and deduped before persistence/presentation.
- Result positions are reassigned after filtering so returned positions remain stable.
- ai-microservice remains the owner of external search execution.
- No deployment was run.

Failed criteria:
- None.

Deviations:
- No production failed-search data was inspected. The owner approval selected the task; implementation used privacy-safe synthetic/common failed-query patterns because no redacted production evidence source was provided in the session.

Recommendation:
SA-G1-T1 can be treated as complete for this bounded improvement. Start SA-G4-T1 next using approved/redacted session evidence before generating the UX improvement report.

## SA-G4-T1 Completion Evidence - 2026-06-12

Gate:
Date: 2026-06-12
Goal: SA-G4 Agent admin and observability
Task: SA-G4-T1 UX Improvement Report From Session Data
Repository root: /home/ssf/Documents/Github/shop-assistant
Git status: existing unrelated remote changes present; SA-G4-T1 report artifact is docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-12.md
Remote status: edited directly on alfares
Execution plan: docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md
Context package: docs/intent-preservation/context-packages/CP-SA-BACKLOG.md
Coding prompt: docs/intent-preservation/coding-prompts/PROMPT-SA-BACKLOG.md
Invariants checked: privacy-safe analytics, legal transparency preservation, admin JWT boundary preservation, no raw diagnostic export, no deployment
Sensitive-data classification: aggregate counts only; no raw session messages, queries, profile names, lead data, JWTs, secrets, or agent communication content exported
Contract/schema impact: report-only task; no API, Prisma, UI, auth, legal, deployment, or external-service contract changed
Privacy/legal impact: report recommends preserving GDPR, ePrivacy/cookie, and EU AI Act notices and avoiding raw personal data exports
Replay/determinism impact: metrics query is deterministic aggregate SQL; production database currently contains zero session rows, so behavioral recommendations are limited
External service boundary impact: database access used the running Kubernetes pod environment; no secret values were printed; logging and database ownership unchanged
Validation commands:
- kubectl exec -n statex-apps shop-assistant-569dc45879-tsjjh -- sh -lc "cd /app && NODE_PATH=/app/node_modules node /tmp/sa-g4-metrics.js"
- rg -n --glob "!node_modules/**" --glob "!*package-lock*" "(AIza|AKIA|BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY|jwt|secret|password|token|api[_-]?key)" docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-12.md docs/intent-preservation/validation-reports/VAL-SA-BACKLOG.md TASKS.md STATE.json || true
Result: pass with documented limitation. Aggregate metrics returned zero sessions, zero messages, zero search runs, zero choices, zero profiles, and zero saved criteria. Report was generated from aggregate evidence plus static workflow inspection.

Passed criteria:
- Report source and anonymization method are documented.
- Recommendations map to preserved Shop Assistant workflows and intent.
- No raw personal data or secrets are included in the report.
- No code changes were made for SA-G4-T1.

Failed criteria:
- None.

Deviations:
- The current production database has no session data, so the report cannot rank UX issues by observed behavioral frequency. It documents this as the primary UX/telemetry finding.

Recommendation:
SA-G4-T1 can be treated as complete as a report-only task. Next work should create or run a synthetic/real privacy-safe usage path and then regenerate aggregate UX metrics.

## SA-G4-T1 Synthetic Usage Metrics Rerun - 2026-06-12

Gate:
Date: 2026-06-12
Goal: SA-G4 Agent admin and observability
Task: Generate privacy-safe synthetic usage, then rerun aggregate UX metrics
Repository root: /home/ssf/Documents/Github/shop-assistant
Git status: existing unrelated remote changes present; this rerun added scripts/generate-synthetic-ux-usage.js, scripts/aggregate-ux-metrics.js, reports/ux/sa-g4-t1-synthetic-usage-2026-06-12.json, reports/ux/sa-g4-t1-aggregate-metrics-2026-06-12.json, and docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-12-synthetic-rerun.md
Remote status: edited directly on alfares
Execution plan: docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md
Context package: docs/intent-preservation/context-packages/CP-SA-BACKLOG.md
Coding prompt: docs/intent-preservation/coding-prompts/PROMPT-SA-BACKLOG.md
Invariants checked: privacy-safe analytics, no production raw data export, no fake merchant evidence, admin JWT boundary preservation, no deployment
Sensitive-data classification: synthetic fixture only; no raw production user queries, voice transcripts, lead contact details, profile names tied to real users, JWTs, secrets, or agent communication content exported
Contract/schema impact: no API, Prisma schema, public UI, admin auth, legal, deployment, or external-service contract changed; added standalone validation scripts and report artifacts only
Privacy/legal impact: synthetic usage is separated from production metrics and uses reserved synthetic.invalid URLs so records cannot be mistaken for real merchant offers
Replay/determinism impact: fixture generation uses fixed IDs, timestamps, and counts; aggregate metrics are deterministic for a given fixture
External service boundary impact: no AI/search provider, auth, logging, leads, or database-server ownership boundary changed; no production deployment
Validation commands:
- node scripts/generate-synthetic-ux-usage.js
- node scripts/aggregate-ux-metrics.js
- npm run build
- rg -n --glob "!node_modules/**" --glob "!package-lock.json" "(AIza|AKIA|BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY|jwt|secret|password|token|api[_-]?key)" scripts/generate-synthetic-ux-usage.js scripts/aggregate-ux-metrics.js docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-12-synthetic-rerun.md reports/ux/sa-g4-t1-synthetic-usage-2026-06-12.json reports/ux/sa-g4-t1-aggregate-metrics-2026-06-12.json TASKS.md STATE.json || true
Result: pass. Synthetic fixture and aggregate metrics generated successfully; build completed successfully; sensitive-data scan found only policy wording in documentation/state, not secret values.

Passed criteria:
- Generated deterministic synthetic usage with 12 sessions, 14 search runs, 28 synthetic results, 5 choices, 3 feedback messages, 2 profiles, and 3 saved criteria.
- Reran aggregate UX metrics and recorded counts, rates, distributions, and agent-error routes.
- Kept synthetic result URLs on the reserved synthetic.invalid domain and documented that they are not real merchant evidence.
- No production raw traffic was exported or inserted into the database.
- No deployment was run.

Failed criteria:
- None.

Deviations:
- Real redacted production traffic was not used because no owner-approved redacted extract was available in the session. The rerun uses privacy-safe synthetic fixture evidence.

Recommendation:
Use the synthetic fixture as a repeatable validation baseline. For behavior prioritization, next compare it with an owner-approved redacted production extract or isolated staging traffic generated through the public API.

## SA-G4-T1 Production Aggregate Comparison - 2026-06-12

Gate:
Date: 2026-06-12
Goal: SA-G4 Agent admin and observability
Task: Compare synthetic aggregate UX metrics with owner-approved aggregate-only production metrics
Repository root: /home/ssf/Documents/Github/shop-assistant
Git status: existing unrelated remote changes present; this comparison added scripts/aggregate-ux-production-metrics.js, scripts/compare-ux-metrics.js, reports/ux/sa-g4-t1-production-aggregate-metrics-2026-06-12.json, reports/ux/sa-g4-t1-production-vs-synthetic-comparison-2026-06-12.json, and docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-12-production-comparison.md
Remote status: edited directly on alfares
Execution plan: docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md
Context package: docs/intent-preservation/context-packages/CP-SA-BACKLOG.md
Coding prompt: docs/intent-preservation/coding-prompts/PROMPT-SA-BACKLOG.md
Invariants checked: privacy-safe aggregate production metrics, no raw content export, no fake merchant evidence, admin JWT boundary preservation, no deployment
Sensitive-data classification: aggregate-only production counts/rates/distributions; no raw message content, query text, voice transcripts, lead details, real profile names, JWTs, secrets, database URLs, or agent communication content exported
Contract/schema impact: no API, Prisma schema, public UI, admin auth, legal, deployment, or external-service contract changed; added standalone aggregate/comparison scripts and report artifacts only
Privacy/legal impact: production query was run inside the Kubernetes pod so database credentials stayed in the runtime environment; report contains only aggregate counts and grouped agent routes
Replay/determinism impact: production aggregate query is deterministic for the current database state; comparison script is deterministic for the two input JSON files
External service boundary impact: no AI/search provider, auth, logging, leads, or database-server ownership boundary changed; no production deployment
Validation commands:
- kubectl cp scripts/aggregate-ux-production-metrics.js statex-apps/shop-assistant-569dc45879-tsjjh:/tmp/aggregate-ux-production-metrics.js
- kubectl exec -n statex-apps shop-assistant-569dc45879-tsjjh -- sh -lc "cd /app && NODE_PATH=/app/node_modules node /tmp/aggregate-ux-production-metrics.js" > reports/ux/sa-g4-t1-production-aggregate-metrics-2026-06-12.json
- node scripts/compare-ux-metrics.js
- npm run build
- rg -n --glob "!node_modules/**" --glob "!package-lock.json" "(AIza|AKIA|BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY|jwt|secret|password|token|api[_-]?key)" scripts/aggregate-ux-production-metrics.js scripts/compare-ux-metrics.js docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-12-production-comparison.md reports/ux/sa-g4-t1-production-aggregate-metrics-2026-06-12.json reports/ux/sa-g4-t1-production-vs-synthetic-comparison-2026-06-12.json TASKS.md STATE.json || true
Result: pass with documented production-data limitation. Synthetic baseline has nonzero fixture metrics; production aggregate still contains zero persisted sessions, messages, search runs, results, choices, profiles, saved criteria, and agent communications.

Passed criteria:
- Production aggregate query returned only aggregate JSON and no raw content.
- Comparison artifact records synthetic-versus-production deltas.
- Production first/last session timestamps are null, confirming no persisted production session window.
- No production synthetic rows were inserted.
- No deployment was run.

Failed criteria:
- None.

Deviations:
- The comparison used production aggregate counts rather than a real redacted row-level extract. This is intentional because aggregate-only evidence is sufficient and safer for the current question.

Recommendation:
Next verify the production/staging write path by generating isolated staging API traffic or an explicitly namespaced health-check session, then rerun the production aggregate script. If staging writes rows but production remains zero, inspect routing and database environment alignment.

## SA-G4-T1 Production Session Write-Path Check - 2026-06-13

Gate:
Date: 2026-06-13
Goal: SA-G4 Agent admin and observability
Task: Verify production/staging session write path because production aggregate UX funnel remained zero
Repository root: /home/ssf/Documents/Github/shop-assistant
Git status: existing unrelated remote changes present; this check added reports/ux/sa-g4-t1-production-aggregate-metrics-2026-06-13-write-path.json, reports/ux/sa-g4-t1-write-path-vs-synthetic-comparison-2026-06-13.json, and docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-13-write-path-check.md
Remote status: edited directly on alfares
Execution plan: docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md
Context package: docs/intent-preservation/context-packages/CP-SA-BACKLOG.md
Coding prompt: docs/intent-preservation/coding-prompts/PROMPT-SA-BACKLOG.md
Invariants checked: privacy-safe synthetic health-check session, no raw query/voice/lead/profile content, no fake merchant result insertion, admin JWT boundary preservation, no deployment
Sensitive-data classification: one explicitly namespaced synthetic session created through public API; aggregate-only production metrics exported
Contract/schema impact: no API, Prisma schema, public UI, admin auth, legal, deployment, or external-service contract changed
Privacy/legal impact: health-check used userId synthetic-write-path-check-2026-06-13 and priorities only; no query text, audio, feedback, choices, leads, profile names, merchant URLs, JWTs, secrets, or agent communication content submitted
Replay/determinism impact: session-create request is state-changing and intentionally leaves one synthetic health-check session as operational evidence; aggregate query is deterministic for the resulting database state
External service boundary impact: public Shop Assistant API and database persistence path verified; no AI/search provider, auth, logging, leads, or deployment boundary changed
Validation commands:
- curl -sS -i -X POST https://shop-assistant.alfares.cz/api/sessions -H "Content-Type: application/json" -d '{"userId":"synthetic-write-path-check-2026-06-13","priorities":["price","quality"]}'
- kubectl exec -n statex-apps shop-assistant-569dc45879-tsjjh -- sh -lc "cd /app && NODE_PATH=/app/node_modules node /tmp/aggregate-ux-production-metrics.js" > reports/ux/sa-g4-t1-production-aggregate-metrics-2026-06-13-write-path.json
- node scripts/compare-ux-metrics.js --production reports/ux/sa-g4-t1-production-aggregate-metrics-2026-06-13-write-path.json --output reports/ux/sa-g4-t1-write-path-vs-synthetic-comparison-2026-06-13.json
Result: pass with bounded scope. Public POST /api/sessions returned HTTP 201, and aggregate production metrics changed to 1 session, 1 user-bound session, and 1 priority-scoped session. Query/search/result/choice/message telemetry remains zero because no query was submitted.

Passed criteria:
- Production session-create write path is confirmed.
- Metrics database and public API persistence path align for Session records.
- No production raw traffic was exported.
- No fake merchant results were inserted.
- No deployment was run.

Failed criteria:
- None.

Deviations:
- This check used controlled production session creation rather than staging because the owner approved proceeding with the write-path comparison and the check does not submit sensitive content or external search traffic.

Recommendation:
Next verify end-to-end query/search persistence in staging or with a controlled synthetic production query that is explicitly excluded from behavioral UX interpretation.


## SA-G1-T1 Follow-Up Evidence - 2026-06-13

Gate:
Date: 2026-06-13
Goal: SA-G1 Request-to-result quality follow-up after SA-G7 live validation
Task: SA-G1-T1 Search Quality From Failed Searches
Repository root: /home/ssf/Documents/Github/shop-assistant
Git status: dirty worktree already contained SA-G7 validation/deploy changes and prior SA-G4 report artifacts; this SA-G1 source change is src/sessions/sessions.service.ts
Remote status: edited directly on alfares/192.168.88.53
Execution plan: docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md
Context package: docs/intent-preservation/context-packages/CP-SA-BACKLOG.md
Coding prompt: docs/intent-preservation/coding-prompts/PROMPT-SA-BACKLOG.md
Invariants checked: real merchant URL truthfulness, no fabricated product data, ai-microservice search ownership, privacy-safe failed-search analysis, no deployment for this follow-up slice
Sensitive-data classification: production failed-search analysis exported only hashed query fingerprints, counts, query lengths, and timestamps; no raw query text, voice transcript, lead content, contact details, JWT, or secret was exported
Contract/schema impact: no Prisma schema or endpoint contract change; query responses keep existing fields and add deterministic assistant message content when results are empty
Privacy/legal impact: legal pages and AI transparency unchanged; zero-result guidance explicitly states that only real HTTP/HTTPS merchant URLs will be shown
Replay/determinism impact: no-result response is deterministic from the refined query; external search remains nondeterministic
External service boundary impact: search remains delegated to ai-microservice; this service only improves local response handling after no usable results are returned
Validation commands:
- npm run build
- privacy-safe production zero-result aggregate query from pod using sha256 fingerprints only
- sensitive-data scan of changed source/report/state/task files
Result: pass. Build completed successfully. Sensitive-data scan matched only prior validation command text in VAL-SA-BACKLOG.md and no new secret values.

Privacy-safe failed-search analysis:

- Data window/source: latest 200 zero-result SearchRun records from the production database, queried inside the running shop-assistant pod.
- Export method: normalized query text was hashed with sha256 and truncated to 12 hex characters; raw query text was not printed or written to docs.
- Zero-result runs sampled: 4.
- Unique failed-search fingerprints: 4.
- Top fingerprint counts: 71758aeee575=1, 33bd9b8ec8c5=1, 4233e845abd4=1, 0540222beba1=1.
- Query length range across exported fingerprints: 36 to 140 characters.

Implementation:

- Added deterministic buildNoResultsMessage(queryText) in src/sessions/sessions.service.ts.
- Single-intent searches with zero usable results now save an assistant message that explains no usable merchant results were found and asks for concrete refinements such as category, brand/model/size/material/color, budget, or delivery location.
- Multi-intent searches where all intents produce zero usable results now use the same deterministic guidance for the combined query.
- Successful result paths still use ai-microservice formatting and price comparison.
- Empty-result paths now log an agent communication response with resultCount=0 after recovery attempts.

Passed criteria:

- Failed-search analysis method is privacy-safe and recorded.
- Response quality improves the named failure category: zero usable merchant results after recovery.
- No fabricated merchant URLs, products, prices, or availability are introduced.
- Build passes.

Remaining risks:

- The current production failed-search dataset is small: only 4 zero-result runs were available in the sampled window.
- This follow-up has not been deployed; deployment should wait for owner approval if this exact response change is to be activated in production.
- Remaining SA-G7 live authenticated checks still require valid customer/admin/non-admin accounts.


## SA-G1-T1 Deployment Evidence - 2026-06-13

Deployment evidence:

- Owner approved deployment of the SA-G1 no-results response change in the active session on 2026-06-13.
- Ran the repository deployment script from /home/ssf/Documents/Github/shop-assistant.
- Deployment preflight passed.
- Rollout completed successfully.
- New pod observed running: shop-assistant-7f6fb76c76-fks5p.
- Total deployment time reported by script: 54.30s.

Post-deploy smoke:

- Health check returned 200.
- Synthetic zero-result attempt 1 used session 56f7ba3f-5bc1-4339-85b8-5fe2df35fc16 and returned 10 results, so the no-results branch was not exercised.
- Synthetic zero-result attempt 2 used session a35fa3fe-9e1d-45d2-9ba5-c0e9f16fdce2 and returned 10 results, so the no-results branch was not exercised.
- Both attempts confirm the deployed query path remains healthy and still returns real result rows when ai/search finds usable URLs.

Result:

- Deployment: pass.
- Live route health: pass.
- Live no-results branch validation: inconclusive because the delegated search service found results for both synthetic impossible-product attempts.
- Source/build validation remains the evidence for the deterministic no-results branch until an actual zero-result query is observed or a controlled lower-level smoke harness is added.

## SA-G4-T1 Query Persistence Validation Harness - 2026-06-13

Gate:
Date: 2026-06-13
Goal: SA-G4 Agent admin and observability
Task: SA-G4-T1 UX Improvement Report From Session Data follow-up
Repository root: /home/ssf/Documents/Github/shop-assistant
Git status: clean before this slice except the newly added validation harness
Remote status: edited directly on alfares
Execution plan: docs/intent-preservation/execution-plans/EP-SA-BACKLOG.md
Context package: docs/intent-preservation/context-packages/CP-SA-BACKLOG.md
Coding prompt: docs/intent-preservation/coding-prompts/PROMPT-SA-BACKLOG.md
Invariants checked: privacy-safe aggregate/session-shape validation, real HTTP/HTTPS result URL check, no fabricated merchant data, no admin auth or legal page changes, no deployment
Sensitive-data classification: validation script emits session ids, timestamps, booleans, counts, result URL scheme counts, search-run ids/counts, and agent route/count buckets only
Contract/schema impact: no API, Prisma schema, public UI, admin auth, legal, deployment, or external-service contract changed; added local script contract for read-only SESSION_ID inspection or explicitly enabled synthetic query mode
Privacy/legal impact: script does not print query text, message content, profile names, lead details, contact data, JWTs, secrets, merchant URLs, database URLs, or raw production personal data
Replay/determinism impact: read-only SESSION_ID mode is deterministic for current database state; synthetic mode is state-changing and requires RUN_SYNTHETIC_QUERY=1 plus SYNTHETIC_QUERY
External service boundary impact: database-server remains persistence owner; AI/search remains delegated to ai-microservice; script only validates persisted evidence shape
Validation commands:
- node scripts/verify-query-persistence.js --help
- node --check scripts/verify-query-persistence.js
- npm run build
- kubectl cp scripts/verify-query-persistence.js statex-apps/$POD:/tmp/verify-query-persistence.js
- kubectl exec -n statex-apps $POD -- sh -lc "cd /app && SESSION_ID=a35fa3fe-9e1d-45d2-9ba5-c0e9f16fdce2 NODE_PATH=/app/node_modules node /tmp/verify-query-persistence.js"
Result: pass. The read-only production pod validation emitted sanitized counts only and did not export raw query/message/result URL content.

Implementation:

- Added scripts/verify-query-persistence.js.
- The script supports existing-session read-only validation with SESSION_ID.
- The script supports controlled synthetic query validation only when RUN_SYNTHETIC_QUERY=1 and SYNTHETIC_QUERY are supplied.
- Output is intentionally sanitized for IPS compliance.

Read-only validation result for existing documented smoke session a35fa3fe-9e1d-45d2-9ba5-c0e9f16fdce2:

- messages: 3
- userMessages: 1
- assistantMessages: 2
- tableMessages: 1
- searchRuns: 1
- searchResults: 10
- zeroResultSearchRuns: 0
- agentCommunications: 11
- agentErrors: 0
- httpResultUrls: 10
- invalidResultUrls: 0
- result: pass

Passed criteria:

- Query path persistence can now be verified repeatably without printing sensitive content.
- Existing production query evidence confirms Message, SearchRun, SearchResult, and AgentCommunication records persisted for one documented smoke session.
- Persisted result URLs satisfy the HTTP/HTTPS shape check for the validated session.
- Build passed.

Remaining risks:

- This harness validates persistence shape, not business relevance of merchant results.
- Broader live customer/admin/non-admin token checks remain skipped until safe tokens are supplied.
- Synthetic query mode is available but should be used only when an explicitly namespaced write is acceptable.
