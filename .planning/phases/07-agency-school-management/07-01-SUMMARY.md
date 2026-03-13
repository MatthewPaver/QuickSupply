---
phase: 07-agency-school-management
plan: "01"
subsystem: ui, api, database
tags: [next.js, drizzle, sqlite, zod, shadcn, postcodes-io, bcryptjs]

# Dependency graph
requires:
  - phase: 06-agency-teacher-management
    provides: TeacherForm/teacher API route patterns that school management mirrors
provides:
  - POST /api/agency/schools with postcode geocoding and duplicate email guard
  - GET/PATCH /api/agency/schools/[id] for school detail and updates
  - SchoolForm client component (create/edit modes, two-card layout)
  - /agency/schools/new page
  - /agency/schools/[id] detail page with Edit School button
  - /agency/schools/[id]/edit page pre-populated server-side
  - schools.phase column (enum: primary/secondary/all-through/nursery/special)
  - agencyCreateSchoolSchema and agencyUpdateSchoolSchema Zod schemas
affects:
  - 07-02 (isActive deactivation — adds isActive to schools table)
  - school login route (schools now have a phase field on insert)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "School management pages mirror teacher management (server component page → client SchoolForm component)"
    - "POST route geocodes postcode via postcodes.io before insert; PATCH re-geocodes only when postcode changes"
    - "Migrations stored in drizzle/ root (not drizzle/migrations/)"

key-files:
  created:
    - drizzle/0005_school_phase.sql
    - src/app/api/agency/schools/route.ts
    - src/app/api/agency/schools/[id]/route.ts
    - src/components/agency/school-form.tsx
    - src/app/agency/schools/new/page.tsx
    - src/app/agency/schools/[id]/page.tsx
    - src/app/agency/schools/[id]/edit/page.tsx
  modified:
    - src/lib/db/schema.ts
    - src/lib/api-validation.ts
    - src/app/agency/schools/page.tsx

key-decisions:
  - "SchoolForm organises fields into two Card sections (School Details, Contact Information) matching the plan spec"
  - "schools list page rows are wrapped in Link (not a nested <a> inside a div) to enable full-row navigation"
  - "phase column added between passwordHash and createdAt in schema, matching plan interface spec"

patterns-established:
  - "School CRUD follows identical structure to teacher CRUD (Phase 6)"

requirements-completed:
  - SCH-01
  - SCH-02

# Metrics
duration: 6min
completed: 2026-03-13
---

# Phase 7 Plan 01: Agency School Management Summary

**School create/edit forms with geocoding via postcodes.io, phase column migration, and agency school API routes (POST/GET/PATCH)**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-13T15:29:35Z
- **Completed:** 2026-03-13T15:34:40Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Added `phase` column to schools table with migration 0005_school_phase.sql applied cleanly
- Created POST /api/agency/schools and GET/PATCH /api/agency/schools/[id] with agent-only auth, geocoding, and duplicate contactEmail guard
- Delivered SchoolForm shared component (create/edit modes, per-field validation errors, two-card layout)
- Added /agency/schools/new, /agency/schools/[id] detail, and /agency/schools/[id]/edit pages
- Updated schools list with New School button, clickable rows linking to detail page, and phase badge per row

## Task Commits

Each task was committed atomically:

1. **Task 1: Phase column migration, API routes, Zod schemas** - `c176998` (feat)
2. **Task 2: SchoolForm component, new/edit/detail pages, schools list update** - `cc34c99` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `drizzle/0005_school_phase.sql` - Migration adding phase column to schools table
- `src/lib/db/schema.ts` - Added phase column to schools table definition
- `src/lib/api-validation.ts` - Added agencyCreateSchoolSchema and agencyUpdateSchoolSchema
- `src/app/api/agency/schools/route.ts` - POST endpoint: auth check, validation, geocoding, duplicate guard, insert
- `src/app/api/agency/schools/[id]/route.ts` - GET endpoint for detail; PATCH endpoint with conditional re-geocoding
- `src/components/agency/school-form.tsx` - Shared client form component for create and edit modes
- `src/app/agency/schools/new/page.tsx` - New school page (server component, requireSession("agent"))
- `src/app/agency/schools/[id]/page.tsx` - School detail page with cover request count and Edit School button
- `src/app/agency/schools/[id]/edit/page.tsx` - Edit school page pre-loaded with server-side data
- `src/app/agency/schools/page.tsx` - Updated list: New School button, linked rows, phase badge

## Decisions Made
- SchoolForm two-card layout (School Details, Contact Information) as specified in plan
- schools list rows converted from div to Link for full-row navigation (cleaner UX than inner link)
- phase column inserted between passwordHash and createdAt matching plan interface spec

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `pnpm` not on PATH in the executor shell; resolved by calling `drizzle-kit` and `next` via `node node_modules/...` directly — same pattern used in Phase 6.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- School create/edit/detail fully functional; ready for 07-02 (school deactivation and credential reset)
- Management card placeholder on detail page signals where 07-02 controls will appear

## Self-Check: PASSED

All created files exist on disk. Both task commits (c176998, cc34c99) confirmed in git log.
