# UX Report: SA-G4-T1 Production Session Write-Path Check

```yaml
id: UX-SA-G4-T1-2026-06-13-WRITE-PATH-CHECK
status: draft
owner: shop-assistant-owner
created: 2026-06-13
last_updated: 2026-06-13
completeness_level: complete
upstream:
  - docs/11_tasks/SA-G4-T1.md
  - docs/16_operations/UX-SA-G4-T1-2026-06-12-production-comparison.md
  - reports/ux/sa-g4-t1-production-aggregate-metrics-2026-06-12.json
downstream:
  - docs/12_validation/VAL-SA-BACKLOG.md
related_adrs: []
```

## Scope

Verify whether the public production API can create a persisted session in the same database read by aggregate UX metrics.

## Data Source And Redaction

Write-path request:

```bash
curl -sS -i -X POST https://shop-assistant.alfares.cz/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"userId":"synthetic-write-path-check-2026-06-13","priorities":["price","quality"]}'
```

The request created one explicitly namespaced synthetic health-check session and did not submit query text, audio, feedback, choices, leads, profile names, or merchant results.

Aggregate output after the check:

- `reports/ux/sa-g4-t1-production-aggregate-metrics-2026-06-13-write-path.json`

Comparison output after the check:

- `reports/ux/sa-g4-t1-write-path-vs-synthetic-comparison-2026-06-13.json`

## Result

The public API returned `HTTP 201` with a synthetic session ID.

The aggregate production metrics then changed from zero persisted sessions to:

| Metric | Count |
| --- | ---: |
| Sessions | 1 |
| User-bound sessions | 1 |
| Priority-scoped sessions | 1 |
| Profile-scoped sessions | 0 |
| Query-message sessions | 0 |
| Search runs | 0 |
| Search results | 0 |
| Choices | 0 |
| Messages | 0 |
| Agent communications | 0 |

Production first session timestamp: `2026-06-13T03:48:23.996Z`.

Production last session timestamp: `2026-06-13T03:48:23.996Z`.

## Interpretation

The production session creation write path is working: `POST /api/sessions` writes to the same production database used by aggregate UX metrics.

The broader UX funnel remains unverified because this privacy-safe check intentionally stopped before query submission. There are still no persisted messages, search runs, search results, choices, feedback messages, profiles, saved criteria, or agent communications in production aggregate metrics.

## Recommendations

1. Treat the prior all-zero production result as lack of persisted user traffic, not a broken session-create write path.
   Evidence type: production write-path check.
   Reason: the health-check session appeared in aggregate metrics immediately after the public API returned `201`.

2. Verify query/search telemetry next in staging or with a controlled synthetic query that cannot be mistaken for real customer traffic.
   Evidence type: remaining zero funnel metrics.
   Reason: session creation works, but the query, search-run, result, feedback, choice, and agent-communication paths remain unmeasured in production.

3. Keep the synthetic health-check namespace excluded from future behavioral UX interpretation.
   Evidence type: privacy/invariant review.
   Reason: `synthetic-write-path-check-2026-06-13` is operational evidence, not user behavior.

## Non-Recommendations

- Do not submit fake merchant results into production persistence.
- Do not export raw production messages, query text, voice transcripts, lead details, real profile names, JWTs, secrets, or agent communication content.
- Do not weaken admin JWT protection or public legal transparency.
- Do not deploy without owner approval in the active session.

## Follow-Up Validation

Run an isolated staging query or owner-approved controlled production query, then rerun:

```bash
node scripts/aggregate-ux-production-metrics.js
node scripts/compare-ux-metrics.js
```

The next check should prove whether `Message`, `SearchRun`, `SearchResult`, and `AgentCommunication` records are persisted through the end-to-end query flow.
