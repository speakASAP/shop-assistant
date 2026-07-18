# Project Graph Schema

    id: SA-GRAPH-SCHEMA
    status: draft
    owner: shop-assistant-owner
    created: 2026-06-12
    last_updated: 2026-06-12
    completeness_level: complete
    upstream:
      - docs/README.md
    downstream:
      - graph/project_graph.example.yaml
    related_adrs: []

## Node Types

constitution, vision, business_case, system, subsystem, feature, task, goal_impact, execution_plan, context_package, prompt, validation_report, audit, operation, governance.

## Edge Types

upstream, downstream, validates, constrains, implements, derives_from.
