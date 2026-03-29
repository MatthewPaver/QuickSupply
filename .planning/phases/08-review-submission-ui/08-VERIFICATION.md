---
phase: 08-review-submission-ui
verified: 2026-03-14T14:30:00Z
status: human_needed
score: 7/7 must-haves verified
human_verification:
  - test: "School portal — Leave Review prompt visible on completed unreviewed bookings"
    expected: "Booking history page shows 'Rate [teacher name]:' label with star widget for every filled booking that has no review yet"
    why_human: "ReviewForm conditionally renders the form vs read-only view based on existingRating; presence of bookings without reviews requires live DB state"
  - test: "Star selection, comment entry, and rebook toggle all function and submit successfully"
    expected: "Clicking a star highlights it, typing in the textarea updates the character counter, clicking Yes/No highlights the chosen button, Submit fires POST /api/school/reviews and a toast.success appears"
    why_human: "Client-side interaction and toast notification require browser execution"
  - test: "Read-only view after submission shows rating stars, comment, and 'Would rebook: Yes/No'"
    expected: "After router.refresh(), the ReviewForm switches to the read-only branch displaying all three fields"
    why_human: "Requires live round-trip: submit, refresh, verify rendered output"
  - test: "agencyRating on agency teacher profile reflects mean of submitted reviews"
    expected: "After submitting a 4-star review for a teacher with no prior reviews, 'Agency rating: 4.0 / 5.0' appears on the Contact & Details card"
    why_human: "Requires live DB write + page reload to confirm the recalculated value is persisted and rendered"
---

# Phase 8: Review Submission UI — Verification Report

**Phase Goal:** Schools can submit structured reviews on completed bookings, and those reviews immediately update the teacher's rating and feed into assignment engine scoring.
**Verified:** 2026-03-14T14:30:00Z
**Status:** human_needed — all automated checks passed; four browser-level behaviours require human confirmation
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | School portal shows a Leave Review prompt on any completed booking not yet reviewed | VERIFIED | `history/page.tsx` renders `<ReviewForm>` inside the booking block for all filled requests; form branch activates when `existingRating` is null/0 |
| 2 | School can submit a 1-5 star rating and see a toast.success confirmation | VERIFIED | `review-form.tsx` L53–61: POST fires, `data.ok` check gates `toast.success("Review submitted")` |
| 3 | School can type a comment (up to 500 chars) and it is saved with the review | VERIFIED | `review-form.tsx` Textarea with `maxLength={500}` + counter; `comment.trim() \|\| null` in POST body; `reviewSchema` has `z.string().max(500)`; route persists `normalisedComment` |
| 4 | School can toggle Would Rebook Yes/No and the value is saved with the review | VERIFIED | `review-form.tsx` L111–127: native button pair sets `wouldRebook` state; POST body includes `wouldRebook: wouldRebook ?? false`; route writes to both INSERT and UPDATE branches |
| 5 | After review submission, teacher's agencyRating reflects the mean of all school reviews | VERIFIED | `route.ts` L58–71: fetches all reviews for teacherId, computes JS reduce average, `db.update(teachers).set({ agencyRating: newAvg })` |
| 6 | Agency staff can view individual school reviews on a teacher's profile page | VERIFIED | `agency/teachers/[id]/page.tsx` L227–260: conditional `{reviews.length > 0 && <Card>...}` renders per-review stars, comment, rebook badge, and date |
| 7 | agencyRating signal feeds assignment engine scoring | VERIFIED | `assignment-engine.ts` L171: `score += teacher.agencyRating * 20` — uses the column updated by the review route |

**Score:** 7/7 truths verified (automated)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `drizzle/0007_review_rebook.sql` | ALTER TABLE migration adding would_rebook column | VERIFIED | Contains `ALTER TABLE \`school_teacher_reviews\` ADD \`would_rebook\` integer DEFAULT 0 NOT NULL` |
| `src/lib/db/schema.ts` | schoolTeacherReviews with wouldRebook field | VERIFIED | L158: `wouldRebook: integer("would_rebook", { mode: "boolean" }).notNull().default(false)` |
| `src/lib/api-validation.ts` | reviewSchema with wouldRebook + comment max(500) | VERIFIED | L137–142: `wouldRebook: z.boolean().optional().default(false)`, `comment: z.string().max(500, ...)` |
| `src/app/api/school/reviews/route.ts` | POST handler persisting wouldRebook and recalculating agencyRating | VERIFIED | Destructures `wouldRebook`; writes to both INSERT (L52) and UPDATE (L40) branches; agencyRating recalculation L58–71 |
| `src/components/school/review-form.tsx` | Form with star widget, comment textarea, rebook toggle, read-only display | VERIFIED | All three inputs present L72–133; read-only branch L26–46 shows stars, comment, and Would rebook label |
| `src/app/school/history/page.tsx` | ReviewForm call site passing existingWouldRebook prop | VERIFIED | L86–92: `existingWouldRebook={review?.wouldRebook ?? null}` passed |
| `src/app/agency/teachers/[id]/page.tsx` | School Reviews card section rendering individual review entries | VERIFIED | L227–260: conditional card with `reviews.map()`, stars, badge, comment, date |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `review-form.tsx` | `/api/school/reviews` | `fetch POST {bookingId, rating, comment, wouldRebook}` | WIRED | L53–57: fetch call includes all four fields; response handled L58–62 |
| `route.ts` | `schoolTeacherReviews` table | `db.insert / db.update` with wouldRebook field | WIRED | L39–55: both branches include `wouldRebook`; INSERT at L52, UPDATE at L40 |
| `route.ts` | `teachers.agencyRating` | `db.update(teachers).set({ agencyRating: newAvg })` | WIRED | L68–71: update fires after every INSERT or UPDATE; result is the JS-reduce mean |
| `history/page.tsx` | `review-form.tsx` | `existingWouldRebook={review?.wouldRebook ?? null}` prop | WIRED | L91: prop present at call site |
| `agency/teachers/[id]/page.tsx` | `schoolTeacherReviews` table | `db.select().from(schoolTeacherReviews).where(eq(...teacherId)).all()` | WIRED | L51: query present; `reviews.map()` at L234 renders the results |
| `assignment-engine.ts` | `teachers.agencyRating` | `score += teacher.agencyRating * 20` | WIRED | L171: signal consumed directly from the teachers row updated by the review route |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| RVW-01 | 08-01 | School sees a "Leave Review" prompt on completed bookings that haven't been reviewed yet | SATISFIED | `history/page.tsx` renders ReviewForm for all filled bookings; form displays when `existingRating` is null/0 |
| RVW-02 | 08-01 | School can submit a 1-5 star rating for a completed booking | SATISFIED | Star widget in `review-form.tsx` L76–94; Zod `rating: z.number().int().min(1).max(5)`; persisted by route |
| RVW-03 | 08-01 | School can optionally add a written comment (max 500 chars) | SATISFIED | Textarea with `maxLength={500}` and character counter; `z.string().max(500)` validation; persisted as `normalisedComment` |
| RVW-04 | 08-01 | School can indicate whether they would rebook the teacher | SATISFIED | Yes/No button pair in `review-form.tsx` L111–127; `wouldRebook` in schema, Zod, API route both branches |
| RVW-05 | 08-02 | Submitted review appears on the teacher's agency profile showing rating, comment, and rebook flag | SATISFIED | `agency/teachers/[id]/page.tsx` L227–260: stars, comment paragraph, "Would rebook" badge, date |
| RVW-06 | 08-01 | New reviews immediately update the teacher's average rating used in assignment engine scoring | SATISFIED | Route recalculates `agencyRating` on every save; assignment engine consumes it at L171 |

All 6 requirements satisfied. No orphaned requirements found for Phase 8.

---

## Anti-Patterns Found

No blockers or warnings detected.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No issues found |

Scanned files: `review-form.tsx`, `route.ts`, `history/page.tsx`, `agency/teachers/[id]/page.tsx`. No TODO/FIXME/placeholder comments, no empty return stubs, no missing response handling.

---

## Commit Verification

All four task commits claimed in SUMMARYs are confirmed present in git log:

| Commit | Description |
|--------|-------------|
| `1986848` | feat(08-01): DB migration + schema + Zod update for wouldRebook |
| `e6b82d6` | feat(08-01): API route — persist wouldRebook + recalculate agencyRating |
| `691f952` | feat(08-01): ReviewForm comment textarea, rebook toggle, read-only display |
| `a832d16` | feat(08-02): add School Reviews card to agency teacher detail page |

Note: commit `44e6711` (fix — thread existingWouldRebook to call site) touched only planning docs (PLAN.md and VALIDATION.md), not source files. It pre-dated the execution commits, so the source implementation was correct from the start.

---

## Human Verification Required

### 1. Leave Review Prompt Visibility (RVW-01)

**Test:** Log in as a school account, navigate to Booking History. Find a completed/filled booking.
**Expected:** A "Rate [teacher name]:" label with 5-star buttons is visible below the teacher name for any booking not yet reviewed.
**Why human:** Requires a filled booking with no existing review in the live database. The code path is correct but prompt visibility depends on runtime data state.

### 2. Form Interaction and Submission (RVW-02, RVW-03, RVW-04)

**Test:** Click a star (e.g. 4), type a short comment (confirm counter reads "N/500"), click "Yes" on the rebook toggle, then click Submit.
**Expected:** Selected star highlights amber, character counter increments, Yes button highlights green, a `toast.success("Review submitted")` notification appears, and the page refreshes to the read-only view.
**Why human:** Client-side state, hover effects, toast rendering, and router.refresh() outcome require browser execution.

### 3. Read-Only View After Submission (RVW-02, RVW-03, RVW-04)

**Test:** After submitting a review, observe the history page entry for that booking.
**Expected:** Stars are rendered in amber showing the submitted rating, the comment text is quoted, and "Would rebook: Yes" (or "No") appears as a small label.
**Why human:** Requires live round-trip — submit, refresh, verify rendered output matches persisted data.

### 4. agencyRating Update on Agency Profile (RVW-06)

**Test:** After submitting a review, log in as agency, navigate to the reviewed teacher's profile.
**Expected:** The "Agency rating: X.X / 5.0" value in the Contact & Details card reflects the mean of submitted reviews (e.g. a single 4-star review → 4.0). The "School Reviews" card shows the review entry.
**Why human:** Confirms the DB write propagated correctly and the agency page reads the updated value from the teachers table.

---

## Summary

All seven observable truths are verified by direct code inspection. All six RVW requirements have clear implementation evidence. The data layer (migration, schema, Zod), API layer (both branches, agencyRating recalculation), and UI layer (form inputs, read-only display, agency card) are fully wired with no stubs or placeholders. The assignment engine signal is confirmed active.

The `human_needed` status reflects four browser-level behaviours — form interaction, toast notification, read-only view render, and live agencyRating propagation — that cannot be confirmed without running the application. All code paths supporting these behaviours are substantive and correctly wired.

---

_Verified: 2026-03-14T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
