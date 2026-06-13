# CP-SA-G3-PROFILE-CRITERIA

SA-G3 protects multi-recipient profiles and reusable saved criteria. Existing services already authenticate profile and criteria CRUD with `JwtAuthGuard` and user ownership checks. This slice adds durable traceability from a session created by saved criteria reuse back to the saved criteria template.

Constraints: no raw production personal data in docs, no cross-account exposure, no Auth or AI/search ownership changes, and no deployment without owner approval.
