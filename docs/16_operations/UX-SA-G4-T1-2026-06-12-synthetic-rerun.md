# UX Report: SA-G4-T1 Synthetic Usage Metrics Rerun

```yaml
id: UX-SA-G4-T1-2026-06-12-SYNTHETIC-RERUN
status: draft
owner: shop-assistant-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/11_tasks/SA-G4-T1.md
  - docs/16_operations/UX-SA-G4-T1-2026-06-12.md
  - TASKS.md
downstream:
  - docs/12_validation/VAL-SA-BACKLOG.md
related_adrs: []
```

## Scope

Rerun aggregate UX metrics after generating deterministic, privacy-safe synthetic usage evidence.

## Data Source And Redaction

Synthetic fixture:

- `reports/ux/sa-g4-t1-synthetic-usage-2026-06-12.json`

Aggregate metrics output:

- `reports/ux/sa-g4-t1-aggregate-metrics-2026-06-12.json`

Generation commands:

```bash
node scripts/generate-synthetic-ux-usage.js
node scripts/aggregate-ux-metrics.js
```

No production raw queries, voice transcripts, lead contact details, profile names tied to real identities, JWTs, secrets, or user identifiers were used. All fixture values are synthetic. Fixture result URLs intentionally use the reserved `synthetic.invalid` domain so they cannot be mistaken for real merchant URLs or user-facing offer evidence.

## Aggregate UX Metrics

| Metric | Count |
| --- | ---: |
| Sessions | 12 |
| User-bound sessions | 9 |
| Profile-scoped sessions | 4 |
| Priority-scoped sessions | 8 |
| Sessions with at least one query message | 12 |
| Search runs | 14 |
| Search results | 28 |
| Zero-result search runs | 4 |
| Choices | 5 |
| Messages | 27 |
| Feedback messages | 3 |
| Agent communications | 28 |
| Agent errors | 3 |
| Account profiles | 2 |
| Saved criteria | 3 |
| Sessions using saved criteria | 3 |

## Aggregate Rates

| Rate | Value |
| --- | ---: |
| Query session rate | 100.0% |
| Zero-result run rate | 28.6% |
| Session choice rate | 41.7% |
| Choice rate among sessions with results | 55.6% |
| Feedback-after-results rate | 33.3% |
| Profile adoption rate | 33.3% |
| Saved-criteria session rate | 25.0% |
| Agent-error session rate | 25.0% |

## Distribution Metrics

| Distribution | Average | P50 | P90 | Max |
| --- | ---: | ---: | ---: | ---: |
| Search runs per session | 1.17 | 1 | 2 | 2 |
| Results per search run | 2.00 | 2 | 4 | 5 |

Result-count buckets:

| Bucket | Search runs |
| --- | ---: |
| 0 | 4 |
| 1-2 | 5 |
| 3-4 | 4 |
| 5+ | 1 |

Agent errors by aggregate route:

| Route | Count |
| --- | ---: |
| search->presentation | 3 |

## Interpretation

This synthetic rerun proves the aggregate metric definitions can produce useful funnel signals without exposing sensitive session content. It does not prove real user behavior frequency.

The most actionable synthetic signals are:

1. Zero-result and recovery paths must be first-class metrics. A 28.6% fixture zero-result rate is intentionally high to verify that empty states appear in the report.
2. Choice rate should be tracked both across all sessions and among sessions with results. The synthetic run shows a 41.7% overall session choice rate and 55.6% result-session choice rate.
3. Feedback-after-results is measurable without raw feedback content. The synthetic run records only counts and content type.
4. Profile and saved-criteria adoption can be tracked through identifiers and counts without exposing profile names.
5. Agent errors can be grouped by route and message type without exporting agent content.

## Prioritized Recommendations

1. Add the aggregate metrics script to routine validation or admin-only reporting.
   Evidence type: synthetic aggregate run.
   Reason: the same metric definitions now produce nonzero funnel, choice, feedback, profile, saved-criteria, and agent-error signals without raw content.

2. Keep production and synthetic metrics separated.
   Evidence type: privacy/invariant review.
   Reason: synthetic result URLs are intentionally non-merchant placeholders and must never be interpreted as real offer quality evidence.

3. Add a production-safe synthetic health check only if it is isolated from user-visible sessions.
   Evidence type: synthetic fixture limitation.
   Reason: inserting fake search results into production persistence could pollute admin diagnostics unless records are clearly namespaced and excluded from normal user flows.

4. Continue to report the real production aggregate window separately.
   Evidence type: previous aggregate report.
   Reason: the production database previously had zero persisted sessions; synthetic fixtures validate metric mechanics, not live adoption.

## Non-Recommendations

- Do not use synthetic fixture URLs as merchant result evidence.
- Do not export raw production messages, search text, voice transcripts, lead content, profile names, JWTs, secrets, or agent communication content.
- Do not weaken admin JWT protection or public legal transparency.
- Do not deploy without owner approval in the active session.

## Follow-Up Validation

Run the aggregate script against an owner-approved redacted production extract or an isolated staging database seeded through the public API. Compare production and synthetic outputs while preserving separate labels for `real-redacted`, `aggregate-production`, and `synthetic-fixture` evidence.
