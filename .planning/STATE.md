# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Schools can submit a cover request and have it filled by the best available teacher through a sequential, real-time assignment workflow managed by the agency.
**Current focus:** v1.1 Operability — Phase 7: Agency School Management

## Current Position

Phase: 7 — Agency School Management
Plan: 02 (complete)
Status: Plan 07-02 complete — school credentials, deactivation/reactivation, login guard, and cover request guard shipped
Last activity: 2026-03-13 — 07-02 executed (SCH-03, SCH-04 complete)

```
v1.1 Progress: [          ] 0% (0/3 phases complete)
```

## Accumulated Context

### Decisions

All key decisions logged in PROJECT.md Key Decisions table.

- 06-01: No shadcn Switch component available — used native HTML checkboxes for boolean teacher preference flags
- 06-01: TeacherForm edit page loads teacher server-side and passes initialData; no client-side fetch on page load
- 06-02: dbsExpiry input conditionally rendered only when dbsStatus is 'clear' or 'expired'
- 06-02: TeacherCredentialsForm performs client-side password confirmation check before API call
- 06-02: Email conflict in credentials route returns structured fieldErrors on the email key
- 06-03: Migration path in plan was drizzle/migrations/ but project stores migrations in drizzle/ root — corrected automatically
- 06-03: isActive guard in login/route.ts added in POST handler (not inside findUserByEmail) to preserve function signature
- 06-03: Assignment engine isActive filter applied at DB query level, not in JS loop
- 07-01: SchoolForm two-card layout (School Details, Contact Information) matches plan spec
- 07-01: schools list rows wrapped in Link (not nested <a>) for full-row navigation
- 07-01: phase column inserted between passwordHash and createdAt in schools table
- 07-02: School credentials route uses contactEmail field (matching schema field name, not email)
- 07-02: School isActive guard in login/route.ts added after teacher isActive guard, mirroring 06-03 pattern
- 07-02: SchoolCredentialsForm uses toast.success for success feedback (newer pattern vs inline message)
- 07-02: Inactive schools remain visible in list so agency can find and reactivate them

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-13
Stopped at: Completed 07-02-PLAN.md — school credentials, deactivation/reactivation, login guard, cover request guard
Resume file: None
