---
phase: 06-agency-teacher-management
plan: "03"
subsystem: ui, api, database
tags: [drizzle, sqlite, nextjs, react, teachers, deactivation, assignment-engine]

# Dependency graph
requires:
  - phase: 06-02
    provides: Teacher compliance and credentials management UI and API routes
provides:
  - isActive boolean field on teachers table with migration
  - PATCH /api/agency/teachers/[id]/status endpoint for toggling teacher active status
  - TeacherStatusToggle client component on teacher detail page
  - Deactivated teacher blocked at login (401) and excluded from assignment engine
  - Inactive teachers visually distinguished on teachers list with Inactive badge and opacity
  - README updated to v1.0 MVP-complete status (no Priority checklists)
affects: [assignment-engine, login-flow, teachers-list, teacher-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - isActive soft-delete pattern: boolean flag on entity, checked at login and assignment eligibility
    - Status toggle component: "use client" button that PATCHes API and calls router.refresh()

key-files:
  created:
    - drizzle/0004_teacher_active.sql
    - src/app/api/agency/teachers/[id]/status/route.ts
    - src/components/agency/teacher-status-toggle.tsx
  modified:
    - src/lib/db/schema.ts
    - src/lib/api-validation.ts
    - src/lib/assignment-engine.ts
    - src/app/api/auth/login/route.ts
    - src/app/agency/teachers/[id]/page.tsx
    - src/components/agency/teachers-filter.tsx
    - src/components/agency/teacher-row.tsx
    - README.md

key-decisions:
  - "Migration placed in drizzle/ root (not drizzle/migrations/) matching the existing file convention in this project"
  - "isActive guard added in POST handler of login/route.ts (after findUserByEmail) rather than inside findUserByEmail, to avoid changing that function's return type"
  - "Assignment engine filters isActive=true at the DB query level (db.select().where(eq(teachers.isActive, true))) for efficiency, not in the JS loop"

patterns-established:
  - "Status toggle pattern: client component with loading state, window.confirm for destructive actions, toast feedback, router.refresh() for server-side data refresh"
  - "Inactive entity display: opacity-50 on row + explicit badge label, entity kept visible in list for reactivation"

requirements-completed: [TCH-06, TCH-07, DOC-01]

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 6 Plan 03: Teacher Deactivation + README Cleanup Summary

**Teacher deactivation via isActive flag wired into login guard, assignment engine filter, detail page toggle, and list visual distinction — README updated to v1.0 MVP-complete**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-13T09:54:43Z
- **Completed:** 2026-03-13T09:59:13Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Added `isActive` boolean to teachers schema with SQLite migration; deactivated teachers blocked at `/api/auth/login` with clear 401 message
- Assignment engine now filters `isActive = true` at query level, excluding deactivated teachers from all offer sequencing
- Teacher detail page shows Deactivate/Reactivate button (`TeacherStatusToggle`) and a red deactivated banner; teachers list shows inactive entries with `opacity-50` and "Inactive" badge plus a status filter dropdown
- README "What's Left To Do" Priority 1/2/3/4 section replaced with v1.0 MVP-complete status block

## Task Commits

1. **Task 1: Add isActive field, migration, status API, and wire into login + assignment engine** - `776d696` (feat)
2. **Task 2: Add deactivate/reactivate toggle, update teachers list, and clean README** - `c78735a` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `drizzle/0004_teacher_active.sql` - ALTER TABLE adding is_active column defaulting to 1
- `src/lib/db/schema.ts` - isActive field added to teachers table
- `src/lib/api-validation.ts` - agencyTeacherStatusSchema added
- `src/app/api/agency/teachers/[id]/status/route.ts` - PATCH endpoint to toggle teacher active status
- `src/lib/assignment-engine.ts` - isActive=true filter on eligible teacher query
- `src/app/api/auth/login/route.ts` - isActive guard for teacher login (401 with clear message)
- `src/components/agency/teacher-status-toggle.tsx` - Deactivate/Reactivate client component
- `src/app/agency/teachers/[id]/page.tsx` - Banner + toggle on detail page
- `src/components/agency/teachers-filter.tsx` - isActive type, status filter dropdown
- `src/components/agency/teacher-row.tsx` - isActive type, opacity-50 + Inactive badge
- `README.md` - MVP-complete status replaces Priority checklists

## Decisions Made
- Migration placed in `drizzle/` root to match existing file convention (not `drizzle/migrations/` as written in plan — plan's path was incorrect).
- isActive guard added in the POST handler of login/route.ts after `findUserByEmail` returns, keeping `findUserByEmail` unchanged.
- Assignment engine filter applied at query level (`where(eq(teachers.isActive, true))`) rather than post-query for efficiency.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration path corrected from drizzle/migrations/ to drizzle/**
- **Found during:** Task 1
- **Issue:** Plan specified `drizzle/migrations/0004_teacher_active.sql` but the project stores migrations directly in `drizzle/` (files 0000-0003 all there)
- **Fix:** Created file at correct path `drizzle/0004_teacher_active.sql`
- **Files modified:** drizzle/0004_teacher_active.sql
- **Verification:** `pnpm db:migrate` applied successfully
- **Committed in:** `776d696` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking path correction)
**Impact on plan:** Essential correction to apply the migration. No scope changes.

## Issues Encountered
None beyond the migration path deviation above.

## User Setup Required
None - no external service configuration required. Migration applies automatically via `pnpm db:migrate`.

## Next Phase Readiness
- Phase 06 plan 03 complete: teacher management fully operational (create, edit, compliance, credentials, deactivate/reactivate)
- Existing seeded teachers all have `isActive = true` (default) — no data migration needed
- Ready for any remaining Phase 06 plans or Phase 07

## Self-Check: PASSED

All created files verified on disk. Both task commits (776d696, c78735a) present in git history.

---
*Phase: 06-agency-teacher-management*
*Completed: 2026-03-13*
