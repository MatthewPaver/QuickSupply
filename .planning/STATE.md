# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Schools can submit a cover request and have it filled by the best available teacher through a sequential, real-time assignment workflow managed by the agency.
**Current focus:** v1.1 Operability — Phase 6: Agency Teacher Management

## Current Position

Phase: 6 — Agency Teacher Management
Plan: 03 (complete)
Status: Plan 06-03 complete — teacher deactivation, assignment engine guard, and README cleanup shipped
Last activity: 2026-03-13 — 06-03 executed (TCH-06, TCH-07, DOC-01 complete)

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

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-13
Stopped at: Completed 06-03-PLAN.md — teacher deactivation, assignment engine guard, and README cleanup
Resume file: None
