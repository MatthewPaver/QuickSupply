---
phase: 08-review-submission-ui
plan: 01
subsystem: ui, api, database
tags: [drizzle, sqlite, zod, react, review, rating]

# Dependency graph
requires:
  - phase: 07-agency-school-management
    provides: schools table with isActive, school auth system, coverRequests and bookings workflow
provides:
  - wouldRebook boolean column in school_teacher_reviews via migration 0007
  - reviewSchema with wouldRebook and comment max(500) validation
  - POST /api/school/reviews persists all three fields and recalculates agencyRating
  - ReviewForm with star rating, comment textarea (500-char), Yes/No rebook toggle
  - Read-only review display shows rating, comment, and would-rebook status
affects:
  - assignment-engine (agencyRating signal updated by review submissions)
  - school portal history page

# Tech tracking
tech-stack:
  added: []
  patterns:
    - JS reduce for average calculation rather than drizzle aggregator
    - Drizzle migration applied via sqlite3 directly when journal was out of sync
    - wouldRebook ?? existing.wouldRebook on UPDATE prevents field reset from partial submits

key-files:
  created:
    - drizzle/0007_review_rebook.sql
  modified:
    - src/lib/db/schema.ts
    - src/lib/api-validation.ts
    - src/app/api/school/reviews/route.ts
    - src/components/school/review-form.tsx
    - src/app/school/history/page.tsx
    - drizzle/meta/_journal.json

key-decisions:
  - "08-01: Applied 0003-0006 pending DB migrations directly via sqlite3 — drizzle journal was out of sync with actual migration files on disk"
  - "08-01: Used JS reduce for agencyRating mean calculation instead of drizzle avg() aggregator (simpler, no extra import)"
  - "08-01: wouldRebook defaults to false on submit when user makes no selection (null state means unselected in UI only)"
  - "08-01: comment normalised to null when empty string to avoid storing blank strings"

patterns-established:
  - "Review submit: collect rating + comment + wouldRebook, POST all three, recalculate agencyRating in same request"
  - "Rebook toggle: native button pair with conditional colour classes — no shadcn Switch (unavailable per 06-01 decision)"

requirements-completed: [RVW-01, RVW-02, RVW-03, RVW-04, RVW-06]

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 8 Plan 01: Review Submission UI Summary

**wouldRebook field added end-to-end: SQLite migration, Drizzle schema, Zod validation, API route with agencyRating recalculation, and ReviewForm with textarea and Yes/No toggle**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-14T13:55:35Z
- **Completed:** 2026-03-14T14:00:47Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- DB migration `0007_review_rebook.sql` adds `would_rebook INTEGER DEFAULT 0 NOT NULL` to school_teacher_reviews
- API route now persists wouldRebook in both INSERT and UPDATE paths, and recalculates `agencyRating` as mean of all teacher reviews after every save
- ReviewForm ships with Textarea (500-char counter), Yes/No rebook toggle buttons, and corrected success check (`data.ok` not `data.success`)

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration + schema + Zod update for wouldRebook** - `1986848` (feat)
2. **Task 2: API route — persist wouldRebook + recalculate agencyRating** - `e6b82d6` (feat)
3. **Task 3: ReviewForm comment textarea, rebook toggle, read-only display** - `691f952` (feat)

## Files Created/Modified
- `drizzle/0007_review_rebook.sql` - Migration: ALTER TABLE school_teacher_reviews ADD would_rebook
- `drizzle/meta/_journal.json` - Updated to include migrations 0003-0007 (was missing 0003-0006)
- `src/lib/db/schema.ts` - Added wouldRebook boolean field to schoolTeacherReviews
- `src/lib/api-validation.ts` - reviewSchema: wouldRebook optional boolean, comment max(500)
- `src/app/api/school/reviews/route.ts` - wouldRebook in insert/update, agencyRating recalculation, teachers import
- `src/components/school/review-form.tsx` - Added existingWouldRebook prop, comment state, wouldRebook state, Textarea, toggle buttons, fixed data.ok check, read-only display
- `src/app/school/history/page.tsx` - Added existingWouldRebook={review?.wouldRebook ?? null} prop at ReviewForm call site

## Decisions Made
- Applied migrations 0003-0006 directly via sqlite3 because the drizzle journal was out of sync with the actual migration files on disk (those files existed but had no journal entries and were never applied to the DB)
- Used JS `reduce` for agencyRating mean calculation — simpler than importing drizzle's `avg()` aggregator
- wouldRebook submits as `false` when user makes no selection (null state is UI-only, not stored)
- comment normalised to null when blank to prevent empty strings in DB

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed drizzle-kit generate producing incorrect migration with extra ALTER TABLE statements**
- **Found during:** Task 1 (DB migration)
- **Issue:** drizzle journal was missing entries for migrations 0003-0006 which existed on disk but had never been applied or tracked. drizzle-kit generate produced a file that tried to add all those columns plus would_rebook, which would have failed on any DB with those columns already present.
- **Fix:** Deleted bad generated file, applied pending 0003-0006 migrations directly via sqlite3, wrote 0007_review_rebook.sql manually, updated journal to include all entries 0003-0007
- **Files modified:** drizzle/0007_review_rebook.sql, drizzle/meta/_journal.json
- **Verification:** `sqlite3 .schema school_teacher_reviews` confirms would_rebook present; `npx tsc --noEmit` passes
- **Committed in:** 1986848 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — out-of-sync drizzle journal)
**Impact on plan:** Required fix to produce a correct migration file. No scope creep.

## Issues Encountered
- Drizzle meta journal had only 3 entries (0000, 0001, 0002) despite 7 migration files on disk. The DB was also missing columns from 0003-0006. Resolved by applying all pending migrations directly and updating the journal.

## User Setup Required
None - no external service configuration required. Migration was applied to local DB during execution.

## Next Phase Readiness
- All RVW-01 through RVW-04 and RVW-06 requirements are complete
- Review submission form is fully wired: star rating, comment, would-rebook toggle, server persistence, agencyRating recalculation
- Assignment engine already consumes agencyRating at score calculation (line 171 of assignment-engine.ts)

---
*Phase: 08-review-submission-ui*
*Completed: 2026-03-14*
