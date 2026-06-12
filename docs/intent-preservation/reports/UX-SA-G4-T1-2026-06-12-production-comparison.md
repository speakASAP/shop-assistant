# UX Report: SA-G4-T1 Production Aggregate Versus Synthetic Baseline

```yaml
id: UX-SA-G4-T1-2026-06-12-PRODUCTION-COMPARISON
status: draft
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/intent-preservation/tasks/SA-G4-T1.md
  - docs/intent-preservation/reports/UX-SA-G4-T1-2026-06-12-synthetic-rerun.md
  - reports/ux/sa-g4-t1-aggregate-metrics-2026-06-12.json
  - reports/ux/sa-g4-t1-production-aggregate-metrics-2026-06-12.json
downstream:
  - docs/intent-preservation/validation-reports/VAL-SA-BACKLOG.md
related_adrs: []
```

## Scope

Compare the deterministic synthetic UX metrics baseline with aggregate-only production metrics collected from the running Shop Assistant pod.

## Data Source And Redaction

Synthetic baseline:

- `reports/ux/sa-g4-t1-aggregate-metrics-2026-06-12.json`

Production aggregate:

- `reports/ux/sa-g4-t1-production-aggregate-metrics-2026-06-12.json`

Comparison output:

- `reports/ux/sa-g4-t1-production-vs-synthetic-comparison-2026-06-12.json`

Production collection command:

```bash
kubectl exec -n statex-apps shop-assistant-569dc45879-tsjjh -- sh -lc "cd /app && NODE_PATH=/app/node_modules node /tmp/aggregate-ux-production-metrics.js"
```

The production query selected aggregate counts, rates, distributions, first/last session timestamps, and grouped agent error routes only. It did not select raw message content, query text, profile names, lead details, JWTs, secrets, database URLs, or agent communication content.

## Metric Comparison

| Metric | Synthetic | Production | Delta |
| --- | ---: | ---: | ---: |
| Sessions | 12 | 0 | -12 |
| Sessions with at least one query message | 12 | 0 | -12 |
| Search runs | 14 | 0 | -14 |
| Search results | 28 | 0 | -28 |
| Zero-result search runs | 4 | 0 | -4 |
| Choices | 5 | 0 | -5 |
| Feedback messages | 3 | 0 | -3 |
| Agent errors | 3 | 0 | -3 |
| Account profiles | 2 | 0 | -2 |
| Saved criteria | 3 | 0 | -3 |
| Zero-result run rate | 28.6% | 0.0% | -28.6 |
| Session choice rate | 41.7% | 0.0% | -41.7 |
| Feedback-after-results rate | 33.3% | 0.0% | -33.3 |
| Profile adoption rate | 33.3% | 0.0% | -33.3 |
| Agent-error session rate | 25.0% | 0.0% | -25.0 |

Production first session timestamp: none.

Production last session timestamp: none.

## Interpretation

The synthetic baseline proves the aggregate metric mechanics work and can produce nonzero funnel, choice, feedback, profile, saved-criteria, and agent-error signals without exposing sensitive content.

The production aggregate still contains no persisted session traffic. This means live UX prioritization cannot yet be based on observed behavior frequency. The likely issue remains instrumentation, traffic routing, environment/database mismatch, or lack of users entering the persisted session flow.

## Recommendations

1. Add a production-safe write-path check for session creation.
   Evidence type: production aggregate comparison.
   Reason: production has zero `Session` rows after the synthetic metrics validation, so the first operational question is whether public/test flows write to the expected database.

2. Keep aggregate metrics available as an admin-only diagnostic.
   Evidence type: synthetic baseline.
   Reason: once production traffic exists, these metrics will show funnel, choice, feedback, profile, saved-criteria, and agent-error signals without raw content export.

3. Generate isolated staging API traffic before inserting any synthetic records into production persistence.
   Evidence type: privacy/invariant review.
   Reason: staging can validate end-to-end write behavior without polluting production diagnostics or creating synthetic result records that might be confused with real offers.

4. Do not treat synthetic rates as live UX frequencies.
   Evidence type: comparison result.
   Reason: synthetic rates are fixture coverage values; production live frequency remains unknown while production counts are zero.

## Non-Recommendations

- Do not export raw production messages, search text, voice transcripts, profile names, lead details, JWTs, secrets, or agent communication content.
- Do not insert fake merchant results into production persistence.
- Do not weaken admin JWT protection or public legal transparency.
- Do not deploy without owner approval in the active session.

## Follow-Up Validation

Run isolated staging traffic through the public session API and then rerun:

```bash
node scripts/aggregate-ux-production-metrics.js
node scripts/compare-ux-metrics.js
```

If staging produces nonzero rows while production remains zero, inspect deployment routing and database environment alignment.
