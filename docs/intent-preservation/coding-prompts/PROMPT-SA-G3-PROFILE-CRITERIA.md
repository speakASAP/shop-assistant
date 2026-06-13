# PROMPT-SA-G3-PROFILE-CRITERIA

Implement the smallest SA-G3 saved-criteria traceability slice in the remote `shop-assistant` repository.

Rules:

- Preserve user ownership boundaries.
- Keep saved criteria run behavior compatible.
- Add only nullable schema fields unless required otherwise.
- Do not expose raw production data or secrets.
- Run `npm run prisma:generate` and `npm run build`.
- Record validation evidence.
