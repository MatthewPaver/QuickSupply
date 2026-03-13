---
phase: 07-agency-school-management
verified: 2026-03-13T00:00:00Z
status: passed
score: 11/11 must-haves verified
re_verification: false
---

# Phase 7: Agency School Management Verification Report

**Phase Goal:** Agency can create and edit school profiles through the UI, with login credentials and activation controls.
**Verified:** 2026-03-13
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Agency staff can open /agency/schools/new, fill in all fields, submit, and see the new school in the schools list | VERIFIED | `new/page.tsx` renders `SchoolForm mode="create"`, which POSTs to `/api/agency/schools`; route inserts school and returns 201; form on success calls `router.push("/agency/schools")` |
| 2 | Agency staff can open /agency/schools/[id]/edit, change any core field, submit, and see changes reflected | VERIFIED | `edit/page.tsx` server-loads school and passes `initialData` to `SchoolForm mode="edit"`; form PATCHes `/api/agency/schools/${schoolId}`; on success routes to detail page |
| 3 | Form validation rejects missing required fields with inline error messages per field | VERIFIED | `school-form.tsx` renders per-field `<p className="text-xs text-red-600">` from API `fieldErrors`; Zod schema on API enforces all required fields |
| 4 | New school has lat/lng geocoded from postcode via postcodes.io before DB insert | VERIFIED | POST route fetches `https://api.postcodes.io/postcodes/${...}` and returns 400 with `fieldErrors.postcode` on failure; inserts `lat`/`lng` from response on success |
| 5 | Schools list page shows a New School button linking to /agency/schools/new | VERIFIED | `schools/page.tsx` line 27-29: `<Link href="/agency/schools/new"><Button>New School</Button></Link>` |
| 6 | Agency staff can set or reset a school's login credentials from the school detail page | VERIFIED | `school-credentials-form.tsx` POSTs to `/api/agency/schools/${schoolId}/credentials`; route bcrypt-hashes password and updates `contactEmail` + `passwordHash` |
| 7 | Agency staff can deactivate a school account — the school contact can no longer sign in after deactivation | VERIFIED | `school-status-toggle.tsx` PATCHes `/api/agency/schools/${schoolId}/status`; login route lines 76-81 guard: `isActive === false` returns 401 |
| 8 | Agency staff can reactivate a deactivated school account | VERIFIED | Same toggle sends `{ isActive: true }`; login guard only blocks when `isActive === false` |
| 9 | Deactivated schools are visually distinguished on the schools list | VERIFIED | `schools/page.tsx` line 39: `opacity-50` class applied when `!s.isActive`; line 44-48: `Inactive` badge rendered |
| 10 | Deactivated schools cannot submit new cover requests (POST /api/requests returns 403) | VERIFIED | `requests/route.ts` lines 36-39: queries `schools.isActive` and returns 403 when `isActive === false` |
| 11 | Demo mode is not broken — demo school sign-in still works | VERIFIED | Login guard only applies in `/api/auth/login`; summary notes demo uses `/api/auth` (demoLoginSchema); guard is not present in that route |

**Score:** 11/11 truths verified

---

## Required Artifacts

### Plan 07-01 Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `src/app/api/agency/schools/route.ts` | POST endpoint to create a new school | VERIFIED | 63 lines; exports `POST`; auth check, geocoding, duplicate email guard, insert |
| `src/app/api/agency/schools/[id]/route.ts` | GET + PATCH endpoints for school detail and updates | VERIFIED | 63 lines; exports `GET` and `PATCH`; agent-only auth, conditional re-geocoding on PATCH |
| `src/components/agency/school-form.tsx` | Shared form component for create and edit | VERIFIED | 293 lines; both modes wired; per-field error display; Select for phase; two-card layout |
| `src/app/agency/schools/new/page.tsx` | New school page using school-form | VERIFIED | 15 lines; `requireSession("agent")` + `<SchoolForm mode="create" />` |
| `src/app/agency/schools/[id]/edit/page.tsx` | Edit school page using school-form | VERIFIED | 35 lines; server-loads school, passes `initialData`, renders `<SchoolForm mode="edit">` |
| `src/app/agency/schools/[id]/page.tsx` | School detail page showing profile fields + management controls | VERIFIED | 66 lines; renders school details, cover count, `SchoolCredentialsForm`, `SchoolStatusToggle`, deactivation banner |
| `drizzle/0005_school_phase.sql` | ALTER TABLE adding phase column | VERIFIED | `ALTER TABLE schools ADD phase text DEFAULT 'primary' NOT NULL` |
| `src/lib/db/schema.ts` (phase column) | phase field on schools table | VERIFIED | Line 26: `phase: text("phase", { enum: [...] }).notNull().default("primary")` |

### Plan 07-02 Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `src/lib/db/schema.ts` (isActive) | isActive boolean field on schools table | VERIFIED | Line 28: `isActive: integer("is_active", { mode: "boolean" }).notNull().default(true)` |
| `drizzle/0006_school_active.sql` | ALTER TABLE adding isActive column defaulting to true | VERIFIED | `ALTER TABLE schools ADD is_active integer DEFAULT 1 NOT NULL` |
| `src/app/api/agency/schools/[id]/credentials/route.ts` | POST endpoint to set/reset school login credentials | VERIFIED | 44 lines; exports `POST`; email uniqueness check, bcrypt hash, updates contactEmail + passwordHash |
| `src/app/api/agency/schools/[id]/status/route.ts` | PATCH endpoint to toggle school active status | VERIFIED | 28 lines; exports `PATCH`; agent-only auth, updates `isActive` |
| `src/components/agency/school-credentials-form.tsx` | Set/reset credentials card on school detail page | VERIFIED | 126 lines; confirm-password client-side check, fieldErrors display, toast.success on save |
| `src/components/agency/school-status-toggle.tsx` | Deactivate/Reactivate button on school detail page | VERIFIED | 56 lines; window.confirm for deactivation, loading state, router.refresh on success |

---

## Key Link Verification

### Plan 07-01 Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `school-form.tsx` | `POST /api/agency/schools` | fetch in onSubmit | WIRED | Line 92-96: url set to `/api/agency/schools` when `mode === "create"`; method `POST`; response parsed for fieldErrors |
| `school-form.tsx` | `PATCH /api/agency/schools/${schoolId}` | fetch in onSubmit | WIRED | Line 95: `` `/api/agency/schools/${schoolId}` `` when `mode === "edit"`; method `PATCH` |
| `src/app/api/agency/schools/route.ts` | `https://api.postcodes.io/postcodes/{postcode}` | fetch for geocoding before DB insert | WIRED | Lines 24-33: geocoding fetch present; `lat`/`lng` extracted and used in insert; returns 400 on failure |

### Plan 07-02 Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `school-credentials-form.tsx` | `POST /api/agency/schools/[id]/credentials` | fetch in onSubmit | WIRED | Line 35: `` fetch(`/api/agency/schools/${schoolId}/credentials`, { method: "POST", ... }) `` |
| `school-status-toggle.tsx` | `PATCH /api/agency/schools/[id]/status` | fetch in onClick | WIRED | Line 27: `` fetch(`/api/agency/schools/${schoolId}/status`, { method: "PATCH", ... }) `` |
| `src/app/api/auth/login/route.ts` | `schools.isActive` | isActive check before session creation | WIRED | Lines 76-81: guard queries `schools.isActive`, returns 401 when `false`; runs before `createSession()` |
| `src/app/api/requests/route.ts` | `schools.isActive` | isActive check before cover request insert | WIRED | Lines 36-39: guard queries `schools.isActive`, returns 403 when `false`; runs before `db.insert(coverRequests)` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SCH-01 | 07-01 | Agency can create a new school profile (name, address, phase, contact name/email/phone) | SATISFIED | POST `/api/agency/schools` + `/agency/schools/new` page + `SchoolForm mode="create"` |
| SCH-02 | 07-01 | Agency can edit an existing school's profile fields | SATISFIED | PATCH `/api/agency/schools/[id]` + `/agency/schools/[id]/edit` page + `SchoolForm mode="edit"` with server-loaded `initialData` |
| SCH-03 | 07-02 | Agency can create login credentials for a new school contact (email + temporary password) | SATISFIED | POST `/api/agency/schools/[id]/credentials` + `SchoolCredentialsForm` on detail page |
| SCH-04 | 07-02 | Agency can deactivate a school account (prevents login and hides from cover request flow) | SATISFIED | PATCH `/api/agency/schools/[id]/status` + login guard returning 401 + requests guard returning 403 + `SchoolStatusToggle` UI |

No orphaned requirements. All four phase-7 requirements claimed across plans and verified in codebase.

---

## Anti-Patterns Found

Scanned all 12 files modified across both plans.

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| None | — | — | No TODO/FIXME/placeholder comments found. No empty return stubs. No console.log-only implementations. All handlers make real API calls and process responses. |

---

## Human Verification Required

The following items cannot be verified programmatically and require a running application:

### 1. Postcode geocoding error display

**Test:** Submit the new school form with an invalid UK postcode (e.g. "ZZ99 ZZZ").
**Expected:** The postcode field shows an inline red error "Invalid or unrecognised postcode".
**Why human:** Requires a live network call to postcodes.io and observation of rendered field error.

### 2. Duplicate contactEmail validation feedback

**Test:** Attempt to create a second school using an email address already registered to an existing school.
**Expected:** The contactEmail field shows "A school with this contact email already exists".
**Why human:** Requires an existing school in the DB and observation of form behaviour.

### 3. Deactivation prevents sign-in

**Test:** Deactivate a school via the detail page toggle, then attempt to sign in with that school's credentials at the login form.
**Expected:** Login fails with "This school account has been deactivated. Please contact the agency."
**Why human:** Requires end-to-end session flow across two browser actions.

### 4. SchoolStatusToggle confirmation dialog

**Test:** Click "Deactivate School" on a school detail page.
**Expected:** Browser confirm dialog appears before the PATCH is sent. Cancelling the dialog makes no change.
**Why human:** `window.confirm` behaviour requires a real browser; cannot be asserted via grep.

### 5. Edit form pre-population

**Test:** Navigate to `/agency/schools/[id]/edit` for an existing school.
**Expected:** All fields (name, address, postcode, phase, contact name/email/phone) are pre-filled with existing values.
**Why human:** Requires visual inspection of a rendered form with real DB data.

---

## Notes

- The SUMMARY for plan 07-01 documents migration files under `drizzle/` (no `migrations/` subdirectory), which differs from the PLAN frontmatter path `drizzle/migrations/0005_school_phase.sql`. Actual files exist at `drizzle/0005_school_phase.sql` and `drizzle/0006_school_active.sql` — this is the correct path for this project. Not a defect.
- All four task commits documented in SUMMARYs are confirmed in git log.
- The `school-credentials-form.tsx` uses bare `<input>` elements (not shadcn `Input`) for the three credential fields. This is a minor deviation from the plan spec but does not affect functionality — the component works correctly and is styled consistently with the design system via className.

---

_Verified: 2026-03-13_
_Verifier: Claude (gsd-verifier)_
