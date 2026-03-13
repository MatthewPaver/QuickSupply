# Phase 8: Review Submission UI - Research

**Researched:** 2026-03-13
**Domain:** Review submission form, schema migration, rating aggregation, assignment engine integration
**Confidence:** HIGH

---

## Summary

Phase 8 is largely a completion and extension of work already started in the codebase. The `schoolTeacherReviews` table, the `ReviewForm` client component, and the `/api/school/reviews` POST route all exist — but they are incomplete relative to the Phase 8 requirements.

Three gaps must be closed. First, the `wouldRebook` (yes/no toggle) field does not exist in the schema or anywhere in the codebase; a migration is required to add it. Second, the `ReviewForm` component sends only `bookingId` and `rating` to the API — it never sends `comment` (even though the textarea renders in the read-only view), and does not capture `wouldRebook`; both the form and the API route need updating. Third, the assignment engine uses `teacher.agencyRating` (an agency-set field, currently hardcoded to 3.0 at creation) as its primary rating signal — the requirements say new reviews must "immediately update the teacher's average rating used in assignment engine scoring", meaning the POST review handler must recalculate and write `agencyRating` from the `schoolTeacherReviews` table after each insert/update.

The teacher's agency profile page (`/agency/teachers/[id]/page.tsx`) already loads reviews and displays a computed average as a secondary line — it does NOT display individual review cards with comment/rebook data. RVW-05 requires the review (rating, comment, rebook flag) to appear there; a "Reviews" card section needs adding to that page.

**Primary recommendation:** One plan is sufficient. Add the DB migration, update schema, fix the API route and `ReviewForm`, then add the reviews card to the agency teacher detail page and update `agencyRating` on review save.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RVW-01 | School sees a "Leave Review" prompt on completed bookings not yet reviewed | `SchoolHistoryPage` already renders `ReviewForm` when `review == null`; needs `wouldRebook` column to gate correctly |
| RVW-02 | School can submit 1-5 star rating and see confirmation on submission | `ReviewForm` star widget + `toast.success` already implemented; needs comment + rebook wired up |
| RVW-03 | School can optionally add a written comment (max 500 chars) | `ReviewForm` currently never sends comment; `Textarea` component available; schema `comment` column exists |
| RVW-04 | School can indicate whether they would rebook the teacher (yes/no) | `wouldRebook` field missing from schema, migration needed, form toggle needed |
| RVW-05 | Submitted review appears on teacher's agency profile page | Agency teacher detail already shows computed avg; individual review cards (rating, comment, rebook flag) must be added |
| RVW-06 | New reviews immediately update teacher's average rating in assignment engine scoring | `agencyRating` on teachers table is the signal used by engine; must be recalculated and written on every review POST |
</phase_requirements>

---

## Standard Stack

### Core (already in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 | ORM + migrations | Project standard; all schema changes go through `drizzle-kit generate` |
| drizzle-kit | ^0.31.9 | Schema migration CLI | Used for all prior migrations (0000–0006) |
| zod | ^4.3.6 | Request body validation | All API routes use `validateBody` + a named schema in `api-validation.ts` |
| next.js | 16.1.6 | App router, server components, API routes | Project framework |
| react-hook-form | ^7.71.2 | Client form state | Used across project forms |
| sonner | ^2.0.7 | Toast notifications | Used for all form success/error feedback |
| lucide-react | ^0.575.0 | Icons (Star, ThumbsUp, etc.) | All icons across the project |
| better-sqlite3 | ^12.6.2 | SQLite driver | Project DB (not PostgreSQL until v2) |

### UI Components (already installed via radix-ui)

| Component | File | Purpose |
|-----------|------|---------|
| `Textarea` | `src/components/ui/textarea.tsx` | Comment input field |
| `Button` | `src/components/ui/button.tsx` | Submit, toggle buttons |
| `Card/CardHeader/CardContent` | `src/components/ui/card.tsx` | Reviews section card on teacher profile |
| `Badge` | `src/components/ui/badge.tsx` | Rebook flag display |

**No new dependencies needed.** All required UI primitives already exist.

---

## Architecture Patterns

### Recommended Project Structure (changes only)

```
drizzle/
└── 0007_review_rebook.sql           # New migration: add would_rebook column

src/
├── lib/
│   ├── db/schema.ts                 # Add wouldRebook field to schoolTeacherReviews
│   └── api-validation.ts            # Add wouldRebook to reviewSchema
├── app/
│   ├── api/school/reviews/route.ts  # Handle wouldRebook + update agencyRating
│   └── agency/teachers/[id]/page.tsx  # Add reviews card (RVW-05)
└── components/
    └── school/review-form.tsx       # Add comment textarea + rebook toggle
```

### Pattern 1: Drizzle Migration

Every schema change follows the same migration pattern used in phases 6 and 7.

**What:** Run `pnpm drizzle-kit generate` to produce a new SQL migration file, then `pnpm drizzle-kit migrate` to apply it. The migration file is committed with the code.

**Example migration file (0007_review_rebook.sql):**
```sql
ALTER TABLE `school_teacher_reviews` ADD `would_rebook` integer DEFAULT 0 NOT NULL;
```

**Drizzle schema addition:**
```typescript
// In schoolTeacherReviews table definition, add:
wouldRebook: integer("would_rebook", { mode: "boolean" }).notNull().default(false),
```

**Source:** Verified against existing migrations 0003–0006 in `drizzle/` directory.

### Pattern 2: API Route with Zod Validation + agencyRating Update

The `POST /api/school/reviews` route already validates with `reviewSchema` and does insert/update. It needs:
1. `wouldRebook` field added to the schema and INSERT/UPDATE
2. After insert/update: recompute `agencyRating` as the average of ALL `schoolTeacherReviews.rating` for that teacher (across all schools), then `db.update(teachers).set({ agencyRating: avg }).where(eq(teachers.id, teacherId)).run()`

**Updated reviewSchema in api-validation.ts:**
```typescript
export const reviewSchema = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
  rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  comment: z.string().max(500, "Comment must be 500 characters or fewer").nullable().optional(),
  wouldRebook: z.boolean().optional().default(false),
});
```

**agencyRating recalculation (after each review save):**
```typescript
// Source: assignment engine pattern — teacher.agencyRating * 20 is the primary score component
const allTeacherReviews = db
  .select({ rating: schoolTeacherReviews.rating })
  .from(schoolTeacherReviews)
  .where(eq(schoolTeacherReviews.teacherId, booking.teacherId))
  .all();

const newAvg = allTeacherReviews.length > 0
  ? allTeacherReviews.reduce((sum, r) => sum + r.rating, 0) / allTeacherReviews.length
  : 3.0; // fall back to neutral default

db.update(teachers)
  .set({ agencyRating: newAvg })
  .where(eq(teachers.id, booking.teacherId))
  .run();
```

### Pattern 3: ReviewForm Client Component Update

The existing `ReviewForm` in `src/components/school/review-form.tsx` already uses:
- `useState` for rating and hover
- `fetch` to `POST /api/school/reviews`
- `router.refresh()` on success
- `toast.success` / `toast.error`

It must be extended to:
- Add a `comment` state string (empty default), wired to a `<Textarea>` with `maxLength={500}`
- Add a `wouldRebook` state boolean, rendered as a pair of buttons (Yes / No) or a `<Button variant="outline">` toggle
- Include both in the POST body
- Show character count hint on the textarea (e.g. `{comment.length}/500`)

The read-only "already reviewed" view should also show `wouldRebook` (e.g. a "Would rebook: Yes/No" line).

**No shadcn Switch available** (confirmed in STATE.md decision 06-01). Use native button toggle for yes/no rebook.

### Pattern 4: Agency Teacher Detail Reviews Card (RVW-05)

The agency teacher detail page (`/agency/teachers/[id]/page.tsx`) already:
- Queries `schoolTeacherReviews` for the teacher
- Computes `avgRating`
- Shows a summary "School reviews: X.X / 5.0 (N reviews)"

It does NOT render individual review entries. Add a new `<Card>` section below the existing cards:

```tsx
// After the "Recent Bookings" card:
{reviews.length > 0 && (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">School Reviews</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded border p-3 text-sm space-y-1">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className={`h-3 w-3 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
              ))}
              {review.wouldRebook && (
                <Badge variant="outline" className="ml-2 border-green-300 text-green-700 text-xs">Would rebook</Badge>
              )}
            </div>
            {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
            <div className="text-xs text-muted-foreground">
              {format(new Date(review.createdAt), "d MMM yyyy")}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

The page is a server component — no client changes needed for this display.

### Anti-Patterns to Avoid

- **Don't recompute `agencyRating` only from the just-submitted review.** Compute it as the mean of ALL reviews for that teacher so edits/corrections are idempotent.
- **Don't skip the schema migration and add `wouldRebook` as optional at the API layer only.** The field must be persisted; a null column without migration will cause SQLite errors at runtime.
- **Don't add a separate "average rating" computed column.** `agencyRating` on the teachers table is the authoritative field consumed by the assignment engine; recalculate and write it there directly.
- **Don't use `router.push` after review submit.** The page uses `router.refresh()` which re-fetches server component data in place — this is the established pattern in `ReviewForm`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema migration | Manual SQL file | `pnpm drizzle-kit generate` + commit generated file | Project has 7 migrations already; consistent tooling |
| Request body validation | Manual type-checking | `validateBody(request, reviewSchema)` from `api-validation.ts` | All routes use this; fieldErrors response format is standard |
| Toast notifications | Custom success/error UI | `toast.success()` / `toast.error()` from sonner | STATE.md (07-02) established `toast.success` as the newer pattern |
| Star rating display | Custom SVG or emoji | Lucide `Star` with `fill-amber-400` CSS class | Already established in both `ReviewForm` and `AgencyTeacherDetailPage` |
| Session/auth checking | Custom session logic | `getSession()` / `requireSession("school")` from `@/lib/auth` | All routes use this pattern |

---

## Common Pitfalls

### Pitfall 1: Forgetting to include `wouldRebook` in the UPDATE branch

**What goes wrong:** The POST handler has two branches — insert (new review) and update (existing). If `wouldRebook` is only added to the INSERT values but not to `db.update(...).set(...)`, editing a review will silently reset the rebook flag.

**How to avoid:** Add `wouldRebook` to both the `.values({...})` call and the `.set({...})` call.

**Warning signs:** Review form re-submit changes rating but rebook flag disappears from profile view.

---

### Pitfall 2: Rating average includes reviews from before `agencyRating` was computed from reviews

**What goes wrong:** `agencyRating` starts at 3.0 (hardcoded at teacher creation). When the first review is submitted, the average computed from `schoolTeacherReviews` may jump sharply if the first rating is very high/low. This is expected, but the planner must be clear: after Phase 8, `agencyRating` is owned by the review aggregation, not agency staff.

**How to avoid:** The current schema has no separate "manual agency rating" field. The field is re-used as computed average. This is acceptable for v1.1 per requirements scope. Agency staff currently cannot manually edit `agencyRating` (no UI for it), so no regression.

---

### Pitfall 3: `comment` field sent as `null` vs `undefined` vs empty string

**What goes wrong:** The existing API route does `comment: comment ?? existing.comment` — if a school submits with an empty string (`""`), that will be saved as empty string not null, which is benign but can render as a blank comment block in UI.

**How to avoid:** Normalise in Zod: `comment: z.string().max(500).nullable().optional()` and in the handler: `comment: comment?.trim() || null`. Update the form to not send `comment` in the body if it is empty.

---

### Pitfall 4: `schoolTeacherReviews` has no unique constraint on `bookingId`

**What goes wrong:** The schema has no `uniqueIndex` on `bookingId`. The handler manually checks for an existing review via `db.select().where(eq(...bookingId...)).get()` and branches on insert vs update. This is fine as-is but the logic depends on `bookingId` being a natural unique key per review. Do NOT add a second insert path.

**How to avoid:** Keep the existing check-then-upsert pattern. Do not use `INSERT OR REPLACE` which would bypass the foreign key for `id`.

---

### Pitfall 5: `wouldRebook` default value on migration

**What goes wrong:** Adding a `NOT NULL` column to an existing table in SQLite requires a `DEFAULT` value. Without it, `ALTER TABLE ADD COLUMN` will fail on existing rows.

**How to avoid:** Migration must be `ADD \`would_rebook\` integer DEFAULT 0 NOT NULL`. Drizzle-kit generates this correctly from the schema definition; verify the generated SQL before running.

---

## Code Examples

### Verified pattern: existing review route structure
```typescript
// Source: src/app/api/school/reviews/route.ts (verified by direct read)
// Pattern: validate → fetch booking → auth check → upsert → return ok
const parsed = await validateBody(request, reviewSchema);
if (!parsed.success) return parsed.response;
const { bookingId, rating, comment } = parsed.data;
// ... fetch booking, check ownership
// insert or update
return NextResponse.json({ ok: true });
```

### Verified pattern: assignment engine rating usage
```typescript
// Source: src/lib/assignment-engine.ts line 171 (verified by direct read)
score += teacher.agencyRating * 20;           // primary rating signal
if (schoolReviewAvg) score += schoolReviewAvg * 10; // per-school signal (secondary)
```

Note: `schoolReviewAvg` is computed per-request from `schoolTeacherReviews` for the requesting school only. `agencyRating` is the cross-school aggregate stored on the teacher row. Both are used. Phase 8 must update `agencyRating` so the aggregate is fresh.

### Verified pattern: migration file format
```sql
-- Source: drizzle/0006_school_active.sql (verified by direct read)
ALTER TABLE `schools` ADD `is_active` integer DEFAULT 1 NOT NULL;
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Manual SQL migration files | `drizzle-kit generate` produces migration file from schema diff | Planner must: update schema.ts first, then run generate |
| `toast` inline success message (06-02 pattern) | `toast.success()` from sonner (07-02 pattern) | Use sonner toast in all new form feedback |
| No rebook field anywhere | Add `wouldRebook` column to `schoolTeacherReviews` | One migration, one schema change, one API/form update |

**Existing but incomplete (not deprecated):**
- `ReviewForm`: built but missing comment input + rebook toggle + comment in POST body
- `POST /api/school/reviews`: built but missing `wouldRebook` persistence + `agencyRating` recalculation
- Agency teacher detail page: shows review summary but not individual review cards

---

## Open Questions

1. **Should `agencyRating` blend school reviews with an agency-set manual rating?**
   - What we know: `agencyRating` starts at 3.0 and is never manually updated by agency staff (no UI for it). Assignment engine uses it as a score multiplier (`* 20`).
   - What's unclear: Whether the agency wants to override the computed average (e.g., for new teachers with no reviews).
   - Recommendation: Per requirements scope, recalculate `agencyRating = mean(all school reviews)` on each review save. Keep the 3.0 default for teachers with no reviews (fallback already coded in assignment engine logic at line 172).

2. **Where should the `wouldRebook` toggle appear in the read-only "already reviewed" view?**
   - What we know: `ReviewForm` renders a static star display when `existingRating != null`. Comment is shown inline.
   - Recommendation: Add a "Would rebook: Yes / No" text line alongside the stars and comment in the read-only view.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright (^1.58.2) |
| Config file | `playwright.config.ts` |
| Quick run command | `pnpm e2e --project=chromium` |
| Full suite command | `pnpm e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RVW-01 | "Leave Review" prompt visible on completed unreviewed booking | e2e smoke | `pnpm e2e --project=chromium -g "review"` | ❌ Wave 0 |
| RVW-02 | Star rating submission shows toast confirmation | e2e | `pnpm e2e --project=chromium -g "review"` | ❌ Wave 0 |
| RVW-03 | Comment field present, max 500 chars enforced | e2e | `pnpm e2e --project=chromium -g "review"` | ❌ Wave 0 |
| RVW-04 | Rebook toggle captured in submission | e2e | `pnpm e2e --project=chromium -g "review"` | ❌ Wave 0 |
| RVW-05 | Review appears on teacher agency profile | e2e | `pnpm e2e --project=chromium -g "review"` | ❌ Wave 0 |
| RVW-06 | `agencyRating` on teacher updates after review | manual-only (DB inspection) | N/A — requires DB query verification | N/A |

**RVW-06 rationale for manual-only:** The assignment engine scoring is internal and not surfaced in UI in a directly testable form without seeding a full assignment flow. A reviewer should verify via the agency teacher detail page that the displayed "Agency rating" updates after a review is submitted, or inspect the DB directly.

### Sampling Rate

- **Per task commit:** `pnpm e2e --project=chromium -g "smoke"` (existing smoke tests)
- **Per wave merge:** `pnpm e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `e2e/review-submission.spec.ts` — covers RVW-01 through RVW-05: login as school, navigate to history, submit review with rating + comment + rebook, verify confirmation toast, navigate to agency teacher profile and verify review appears

*(No new test framework install needed — Playwright is already configured)*

---

## Sources

### Primary (HIGH confidence)

- Direct file reads: `src/lib/db/schema.ts` — full schema including `schoolTeacherReviews`, `teachers.agencyRating`
- Direct file reads: `src/app/api/school/reviews/route.ts` — existing review API
- Direct file reads: `src/components/school/review-form.tsx` — existing review form
- Direct file reads: `src/lib/assignment-engine.ts` — verified `agencyRating * 20` scoring formula
- Direct file reads: `src/app/agency/teachers/[id]/page.tsx` — verified existing reviews display
- Direct file reads: `drizzle/0006_school_active.sql` — migration format pattern
- Direct file reads: `src/lib/api-validation.ts` — existing `reviewSchema` definition
- Direct file reads: `.planning/STATE.md` — decision 06-01 (no Switch component), 07-02 (toast.success pattern)

### Secondary (MEDIUM confidence)

- `package.json` dependency list — confirms Textarea, drizzle-kit, zod versions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries read from actual package.json and src files
- Architecture: HIGH — patterns derived from existing working code in the same repo
- Pitfalls: HIGH — identified from actual schema and code gaps, not speculation

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable internal codebase; no external API drift risk)
