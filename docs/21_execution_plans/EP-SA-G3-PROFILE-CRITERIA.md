# EP-SA-G3-PROFILE-CRITERIA: Saved Criteria Session Traceability

## Scope

Implement SA-G3-T1 as a narrow persistence and current-user API traceability slice.

## Files

- `prisma/schema.prisma`
- `prisma/migrations/20260613_add_session_saved_criteria_trace/migration.sql`
- `src/sessions/sessions.service.ts`
- `src/profiles/saved-criteria.service.ts`
- `src/me/me.service.ts`
- `docs/12_validation/VAL-SA-G3-PROFILE-CRITERIA.md`
- `TASKS.md`
- `STATE.json`

## Validation

- `npm run prisma:generate`
- `npm run build`
- focused sensitive-data scan

## Rollout

Do not deploy or apply the migration without explicit owner approval.
