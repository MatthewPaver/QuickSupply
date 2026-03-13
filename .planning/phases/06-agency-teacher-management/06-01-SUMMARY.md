---
phase: 06-agency-teacher-management
plan: "01"
subsystem: ui, api
tags: [nextjs, drizzle-orm, zod, bcryptjs, postcodes-io, react, shadcn]

# Dependency graph
requires: []
provides:
  - POST /api/agency/teachers — create teacher with geocoded postcode and bcrypt password
  - PATCH /api/agency/teachers/[id] — update teacher fields with optional postcode re-geocoding
  - TeacherForm shared client component for create and edit
  - /agency/teachers/new page
  - /agency/teachers/[id]/edit page
  - "New Teacher" button on teachers list page
  - "Edit Profile" button on teacher detail page
affects: [07-agency-school-management, 08-compliance-availability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Agency API routes use getSession() + role check before validateBody() for auth+validation"
    - "Postcodes.io geocoding called inline in POST/PATCH before DB write; invalid postcode returns 400 with fieldErrors.postcode"
    - "Shared form component handles both create (POST) and edit (PATCH) via mode prop; field errors shown inline below each input"

key-files:
  created:
    - src/app/api/agency/teachers/route.ts
    - src/app/api/agency/teachers/[id]/route.ts
    - src/components/agency/teacher-form.tsx
    - src/app/agency/teachers/new/page.tsx
    - src/app/agency/teachers/[id]/edit/page.tsx
  modified:
    - src/lib/api-validation.ts
    - src/app/agency/teachers/page.tsx
    - src/app/agency/teachers/[id]/page.tsx

key-decisions:
  - "No Switch UI component available — used native HTML checkboxes with Tailwind styling for boolean flags"
  - "Edit page is a server component that loads teacher from DB and passes initialData to TeacherForm; no client-side fetch on page load"

patterns-established:
  - "TeacherForm: mode prop controls POST vs PATCH URL, teacherId required for edit, initialData for pre-population"
  - "fieldErrors key in API 400 response maps field name to string[]; form clears errors on field change"

requirements-completed: [TCH-01, TCH-02]

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 6 Plan 01: Agency Teacher Create/Edit Forms Summary

**Agency staff can create and edit teacher profiles via /agency/teachers/new and /agency/teachers/[id]/edit, with postcodes.io geocoding, bcrypt password hashing, and Zod-validated API routes**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-13T09:43:28Z
- **Completed:** 2026-03-13T09:47:06Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- POST /api/agency/teachers creates teacher with live geocoding from postcodes.io, bcrypt-hashed password, and duplicate email check
- PATCH /api/agency/teachers/[id] updates any core field with optional re-geocoding when postcode changes
- TeacherForm shared component covers all 12 fields with inline error display, loading state, and success toast navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add agency teacher API routes (POST create, PATCH update) and Zod schemas** - `a4450a0` (feat)
2. **Task 2: Build shared TeacherForm component and new/edit pages** - `334f384` (feat)

**Plan metadata:** (added in final commit)

## Files Created/Modified
- `src/lib/api-validation.ts` - Added agencyCreateTeacherSchema and agencyUpdateTeacherSchema
- `src/app/api/agency/teachers/route.ts` - POST endpoint with geocoding, bcrypt, duplicate check
- `src/app/api/agency/teachers/[id]/route.ts` - PATCH endpoint with optional geocoding
- `src/components/agency/teacher-form.tsx` - Shared create/edit form with field-level errors
- `src/app/agency/teachers/new/page.tsx` - New teacher page using TeacherForm mode="create"
- `src/app/agency/teachers/[id]/edit/page.tsx` - Edit teacher page with DB pre-load and mode="edit"
- `src/app/agency/teachers/page.tsx` - Added "New Teacher" button linking to /agency/teachers/new
- `src/app/agency/teachers/[id]/page.tsx` - Added "Edit Profile" button linking to edit page

## Decisions Made
- No shadcn Switch component in the project — used native HTML checkboxes with Tailwind for the five boolean flags (canDrive, emergencyAvailable, contactNightBeforeOnly, longTermWilling, canDrive).
- Edit page loads teacher server-side and passes initialData to TeacherForm; no client-side fetch needed on page load.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TCH-01 (create teacher) and TCH-02 (edit teacher) requirements complete
- Agency staff can now create and manage teacher profiles through the UI
- Ready for Phase 6 Plan 02 (compliance/availability management or school management)

---
*Phase: 06-agency-teacher-management*
*Completed: 2026-03-13*
