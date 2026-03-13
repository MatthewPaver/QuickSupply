# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Schools can submit a cover request and have it filled by the best available teacher through a sequential, real-time assignment workflow managed by the agency.
**Current focus:** v1.1 Operability — Phase 6: Agency Teacher Management

## Current Position

Phase: 6 — Agency Teacher Management
Plan: 02 (complete)
Status: Plan 06-02 complete — compliance management and credential-setting UI shipped
Last activity: 2026-03-13 — 06-02 executed (TCH-03, TCH-04, TCH-05 complete)

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

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-13
Stopped at: Completed 06-02-PLAN.md — teacher compliance management and credential-setting UI
Resume file: None
