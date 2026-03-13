---
phase: 07-agency-school-management
plan: "02"
subsystem: api, ui, database
tags: [drizzle, sqlite, bcryptjs, nextjs, react, zod, sonner]

# Dependency graph
requires:
  - phase: 07-01
    provides: School create/edit forms, school API routes, phase column migration
provides:
  - isActive boolean field on schools table (migration 0006_school_active.sql)
  - POST /api/agency/schools/[id]/credentials — set/reset school login credentials
  - PATCH /api/agency/schools/[id]/status — deactivate/reactivate school account
  - School deactivation guard in login route (schools cannot sign in when deactivated)
  - School deactivation guard in cover requests route (deactivated schools get 403)
  - SchoolCredentialsForm component (login credentials card on school detail page)
  - SchoolStatusToggle component (deactivate/reactivate button on school detail page)
  - Deactivation banner on school detail page
  - Inactive indicator (opacity + badge) on schools list
affects:
  - School login flow
  - Cover request submission
  - Agency school management UI

# Tech tracking
tech-stack:
  added: []
  patterns:
    - School isActive guard mirrors teacher isActive guard pattern from phase 06-03
    - Credentials route uses contactEmail field (vs email field for teachers)
    - Status toggle uses window.confirm for destructive action, no confirm for reactivation

key-files:
  created:
    - drizzle/0006_school_active.sql
    - src/app/api/agency/schools/[id]/credentials/route.ts
    - src/app/api/agency/schools/[id]/status/route.ts
    - src/components/agency/school-credentials-form.tsx
    - src/components/agency/school-status-toggle.tsx
  modified:
    - src/lib/db/schema.ts
    - src/lib/api-validation.ts
    - src/app/api/auth/login/route.ts
    - src/app/api/requests/route.ts
    - src/app/agency/schools/[id]/page.tsx
    - src/app/agency/schools/page.tsx

key-decisions:
  - "07-02: School credentials route uses contactEmail field (not email) matching schema field name"
  - "07-02: School isActive guard in login/route.ts added after teacher isActive guard, mirroring 06-03 pattern"
  - "07-02: SchoolCredentialsForm uses toast.success for success feedback (vs inline message in TeacherCredentialsForm)"
  - "07-02: Inactive schools shown in list with opacity-50 and Inactive badge, not filtered out"

patterns-established:
  - "School deactivation mirrors teacher deactivation pattern (isActive field, status route, login guard)"
  - "Agency credentials routes check email conflict against same entity type before update"

requirements-completed: [SCH-03, SCH-04]

# Metrics
duration: 25min
completed: 2026-03-13
---

# Phase 7 Plan 02: School Credentials and Deactivation Summary

**School login credential management and account deactivation/reactivation using isActive field, two API routes, login/request guards, and agency UI components**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-13T15:15:00Z
- **Completed:** 2026-03-13T15:41:37Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Added isActive column to schools table with migration 0006_school_active.sql
- Agency staff can set/reset school login credentials (email + hashed password) via POST /api/agency/schools/[id]/credentials
- Agency staff can deactivate/reactivate schools via PATCH /api/agency/schools/[id]/status; deactivated schools cannot sign in (login returns 401) or submit cover requests (requests returns 403)
- School detail page shows credentials card, deactivate/reactivate button, and red deactivation banner
- Schools list shows deactivated schools greyed out with an "Inactive" badge

## Task Commits

Each task was committed atomically:

1. **Task 1: isActive field, migration, API routes, login guard, cover request guard** - `c300862` (feat)
2. **Task 2: Credentials form, status toggle, school detail and list page updates** - `3c40151` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `drizzle/0006_school_active.sql` - ALTER TABLE schools ADD is_active column defaulting to 1
- `src/lib/db/schema.ts` - Added isActive boolean field to schools table
- `src/lib/api-validation.ts` - Added agencySetSchoolCredentialsSchema and agencySchoolStatusSchema
- `src/app/api/agency/schools/[id]/credentials/route.ts` - POST endpoint: validates agent session, checks email uniqueness, bcrypt-hashes password, updates contactEmail + passwordHash
- `src/app/api/agency/schools/[id]/status/route.ts` - PATCH endpoint: validates agent session, toggles isActive
- `src/app/api/auth/login/route.ts` - Added school isActive guard before bcrypt comparison
- `src/app/api/requests/route.ts` - Added deactivated school guard before cover request insertion
- `src/components/agency/school-credentials-form.tsx` - Client component: email + password fields with confirm check, fieldErrors display, toast.success on save
- `src/components/agency/school-status-toggle.tsx` - Client component: deactivate (with confirm dialog) / reactivate button with loading state
- `src/app/agency/schools/[id]/page.tsx` - Added deactivation banner, status toggle in header, credentials card
- `src/app/agency/schools/page.tsx` - Added opacity-50 and Inactive badge for deactivated schools

## Decisions Made
- School credentials route uses `contactEmail` field (matching schema field name) rather than `email` as used for teachers
- isActive guard in login route added immediately after teacher isActive guard, mirroring the 06-03 pattern
- SchoolCredentialsForm uses `toast.success` for success feedback (aligns with plan spec; TeacherCredentialsForm uses inline message — school version follows newer pattern)
- Inactive schools remain visible in the list so agency can find and reactivate them

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Node.js version mismatch: better-sqlite3 was compiled against Node 25 (NODE_MODULE_VERSION 141) but nvm default was Node 22. Resolved by running db:migrate and build with `nvm use 25`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- School login credentials and account lifecycle management are complete (SCH-03, SCH-04)
- Phase 07 plan 03 (if any) can build on school isActive state
- All school management features for v1.1 agency operability are shipped

## Self-Check: PASSED

All created files confirmed on disk. Both task commits (c300862, 3c40151) confirmed in git log.

---
*Phase: 07-agency-school-management*
*Completed: 2026-03-13*
