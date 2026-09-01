# Tasks: Shop Assistant

This file is the concise human-readable work queue. Detailed task contracts live under `docs/11_tasks/` and execution records remain linked there.

## Active
- None currently active per STATE.json (tasks_active not reported as nonzero; last_milestone reflects completed work).

## Ready Next
- Live authenticated checkout smoke for the SA-G8-B2 billing/entitlement flow, gated by runtime keys, callback token, public URL allowlist, and owner approval.
- IPS adoption profile completed 2026-08-30; run the planning validator before further scope changes

## Blocked
- Live payment creation remains gated by runtime keys, callback token, public URL allowlist, and an owner-approved checkout smoke test (TASKS.md SA-G8-B2).

## completed

- 2026-07-03 SA-G8-B2 billing/entitlement contract and safe core implemented
- 2026-06-21 SA-G7-T1 commercial frontend, authenticated client dashboard, and role-protected admin control panel closed
- 2026-06-14 SA-G2-FIX-T2 public session ownership boundary hardening
- 2026-06-14 SA-G2-FIX-T1 documentation and legal/privacy surface hardening
- 2026-06-12 SA-DOCS-T1 Intent Preservation System installed under docs/intent-preservation

## handoff

Current machine-readable state: [`STATE.json`](STATE.json). See TASKS.md's goal history (SA-G1..SA-G8) for the live cadence and the open owner-gated billing checkout follow-up.
