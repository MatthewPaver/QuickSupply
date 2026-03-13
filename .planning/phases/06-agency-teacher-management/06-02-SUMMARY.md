---
phase: 06-agency-teacher-management
plan: "02"
subsystem: ui, api, database
tags: [drizzle, sqlite, nextjs, react, bcrypt, zod]

# Dependency graph
requires:
  - phase: 06-01
    provides: Teacher create/edit forms and CRUD API routes; teacher detail page scaffold
provides:
  - DBS status, expiry, right-to-work columns on teachers table (migration 0003)
  - PATCH /api/agency/teachers/[id]/compliance endpoint with Zod validation
  - POST /api/agency/teachers/[id]/credentials endpoint with bcrypt hashing + email conflict check
  - TeacherComplianceForm component for managing DBS/compliance fields
  - TeacherCredentialsForm component for setting/resetting teacher login credentials
  - Teacher detail page updated to render both new management cards
affects: [07-school-management, assignment-workflow, teacher-auth]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PATCH /api/agency/teachers/[id]/[sub-resource] pattern for sub-resource updates"
    - "Client form with inline field errors + router.refresh() after mutation"
    - "Drizzle .run() for write operations (update), .get()/.all() for reads"

key-files:
  created:
    - drizzle/0003_teacher_management.sql
    - src/app/api/agency/teachers/[id]/compliance/route.ts
    - src/app/api/agency/teachers/[id]/credentials/route.ts
    - src/components/agency/teacher-compliance-form.tsx
    - src/components/agency/teacher-credentials-form.tsx
  modified:
    - src/lib/db/schema.ts
    - src/lib/api-validation.ts
    - src/app/agency/teachers/[id]/page.tsx

key-decisions:
  - "dbsExpiry field is conditionally shown only when dbsStatus is 'clear' or 'expired'"
  - "TeacherCredentialsForm includes client-side confirmPassword validation before API call"
  - "Email conflict check in credentials route returns structured fieldErrors on the email field"

patterns-established:
  - "Sub-resource routes at /api/agency/teachers/[id]/[sub-resource] for scoped operations"
  - "All agency routes check session.role === 'agent' before processing"

requirements-completed: [TCH-03, TCH-04, TCH-05]

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 06 Plan 02: Teacher Compliance & Credentials Management Summary

**DBS status/expiry/right-to-work compliance fields added to teachers table plus two agency management cards (compliance + login credentials) on the teacher detail page backed by dedicated PATCH and POST API routes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-13T09:49:01Z
- **Completed:** 2026-03-13T09:53:01Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added dbsStatus, dbsExpiry, rightToWork columns to teachers table via Drizzle migration (0003_teacher_management.sql) — migration applied cleanly
- Created PATCH /api/agency/teachers/[id]/compliance with Zod validation for all five compliance fields
- Created POST /api/agency/teachers/[id]/credentials with bcrypt hashing and email-conflict detection returning structured fieldErrors
- Built TeacherComplianceForm and TeacherCredentialsForm "use client" components with inline error display and router.refresh() after success
- Updated teacher detail page to render both new cards after the existing Contact & Details and Weekly Availability cards

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend DB schema, write migration, add compliance and credentials API routes** - `ce56424` (feat)
2. **Task 2: Build compliance and credentials management cards on teacher detail page** - `0280866` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/lib/db/schema.ts` - Added dbsStatus, dbsExpiry, rightToWork fields to teachers table definition
- `drizzle/0003_teacher_management.sql` - ALTER TABLE migration adding three new columns
- `src/lib/api-validation.ts` - Added agencyUpdateComplianceSchema and agencySetCredentialsSchema
- `src/app/api/agency/teachers/[id]/compliance/route.ts` - PATCH endpoint for DBS/compliance fields
- `src/app/api/agency/teachers/[id]/credentials/route.ts` - POST endpoint to set/reset teacher login credentials
- `src/components/agency/teacher-compliance-form.tsx` - Compliance management form with DBS/right-to-work selects, conditional expiry date input, notes textarea
- `src/components/agency/teacher-credentials-form.tsx` - Login credentials form with email, password, confirm password inputs
- `src/app/agency/teachers/[id]/page.tsx` - Added imports and TeacherComplianceForm + TeacherCredentialsForm cards to detail grid

## Decisions Made
- dbsExpiry input is conditionally rendered only when dbsStatus is "clear" or "expired" — avoids storing a stale date when DBS is pending or not set
- TeacherCredentialsForm performs client-side password confirmation check before hitting the API to avoid unnecessary round-trips
- Email conflict in credentials route returns a fieldErrors object on the `email` key, matching the same error contract used throughout the app

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Compliance fields and management UI are now complete for agency staff
- Teacher login credentials can be set/reset by agency staff from the detail page
- Teachers created in 06-01 with a password can now have credentials updated without recreating them
- Ready for subsequent phases (school management, booking workflow enhancements)

---
*Phase: 06-agency-teacher-management*
*Completed: 2026-03-13*
