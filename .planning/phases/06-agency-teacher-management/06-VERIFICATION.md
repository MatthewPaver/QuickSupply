---
phase: 06-agency-teacher-management
verified: 2026-03-13T10:30:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
---

# Phase 6: Agency Teacher Management — Verification Report

**Phase Goal:** Agency staff can create, edit, and fully manage teacher accounts — including credentials and compliance status — without seeding or developer access.
**Verified:** 2026-03-13T10:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Agency staff can open /agency/teachers/new, fill in core fields, submit, and see the new teacher appear in the teachers list | VERIFIED | `new/page.tsx` renders `<TeacherForm mode="create" />`; form POSTs to `/api/agency/teachers`; route returns 201 with `{id}`; redirects to `/agency/teachers` |
| 2  | Agency staff can open /agency/teachers/[id]/edit, change any core field, submit, and see changes reflected on the teacher detail page | VERIFIED | `edit/page.tsx` loads teacher server-side, passes `initialData` to `<TeacherForm mode="edit">`; form PATCHes `/api/agency/teachers/${teacherId}`; redirects to `/agency/teachers/${teacherId}` |
| 3  | Form validation rejects missing required fields with inline error messages | VERIFIED | Zod schemas (`agencyCreateTeacherSchema`, `agencyUpdateTeacherSchema`) enforce all required fields; API returns `fieldErrors` map; `TeacherForm` displays per-field `<p className="text-xs text-red-600">` on error |
| 4  | New teacher has lat/lng geocoded from postcode via postcodes.io before DB insert | VERIFIED | POST handler fetches `https://api.postcodes.io/postcodes/{postcode}`, checks `geo.status !== 200`, stores `geo.result.latitude/longitude`; returns 400 with `fieldErrors.postcode` on invalid postcode |
| 5  | Agency staff can set a teacher's DBS status, DBS expiry, right-to-work, and compliance notes from the teacher detail page | VERIFIED | `TeacherComplianceForm` on detail page with selects for `complianceStatus`, `dbsStatus`, conditional `dbsExpiry` input, `rightToWork` select, notes textarea; PATCHes `/api/agency/teachers/${teacherId}/compliance` |
| 6  | Agency staff can save updated compliance fields and see the compliance badge on the teachers list update accordingly | VERIFIED | PATCH compliance route updates `complianceStatus` in DB; `router.refresh()` called after success; teachers list reads `complianceStatus` live from DB and displays via `StatusBadge` |
| 7  | Agency staff can set an email + temporary password for a teacher (set/reset credentials) | VERIFIED | `TeacherCredentialsForm` on detail page; POSTs to `/api/agency/teachers/${teacherId}/credentials`; bcrypt hashes password; email conflict check returns structured `fieldErrors.email` |
| 8  | Agency staff can deactivate an active teacher from the teacher detail page | VERIFIED | `TeacherStatusToggle` renders "Deactivate Teacher" button (variant="destructive") when `isActive=true`; `window.confirm()` guard; PATCHes `/api/agency/teachers/${teacherId}/status` with `{isActive: false}` |
| 9  | Agency staff can reactivate a deactivated teacher from the teacher detail page | VERIFIED | `TeacherStatusToggle` renders "Reactivate Teacher" button (variant="outline") when `isActive=false`; no confirmation required; PATCHes with `{isActive: true}` |
| 10 | Deactivated teachers are excluded from the assignment engine's eligible teacher list | VERIFIED | `assignment-engine.ts` line 39: `db.select().from(teachers).where(eq(teachers.isActive, true)).all()` — deactivated teachers never enter the ranking loop |
| 11 | Deactivated teachers are visually distinguished on the teachers list | VERIFIED | `teacher-row.tsx`: row has `opacity-50` class when `!t.isActive`; inline "Inactive" badge rendered with `bg-red-100 text-red-600`; `teachers-filter.tsx` includes "Active only" / "Inactive only" filter dropdown |
| 12 | README no longer contains the Priority 1/2/3/4 checklists — it reflects v1.0 MVP-complete status | VERIFIED | No "Priority" section found in README; `## Status: v1.0 MVP Complete` section present at line 120 |

**Score:** 12/12 truths verified

---

## Required Artifacts

| Artifact | Purpose | Status | Evidence |
|----------|---------|--------|----------|
| `src/app/api/agency/teachers/route.ts` | POST create teacher | VERIFIED | 67-line file; exports `POST`; geocoding + bcrypt + duplicate check + DB insert |
| `src/app/api/agency/teachers/[id]/route.ts` | PATCH update core fields | VERIFIED | 42-line file; exports `PATCH`; optional re-geocoding on postcode change |
| `src/components/agency/teacher-form.tsx` | Shared create/edit form | VERIFIED | 351-line "use client" component; 12 fields; inline errors; loading state; success toast + navigation |
| `src/app/agency/teachers/new/page.tsx` | New teacher page | VERIFIED | Server component; `requireSession("agent")`; renders `<TeacherForm mode="create">` |
| `src/app/agency/teachers/[id]/edit/page.tsx` | Edit teacher page | VERIFIED | Server component; loads teacher from DB; passes `initialData` to `TeacherForm`; `notFound()` guard |
| `src/lib/db/schema.ts` (dbsStatus, dbsExpiry, rightToWork) | DB compliance columns | VERIFIED | Lines 47-49: `dbsStatus`, `dbsExpiry`, `rightToWork` present with correct enum values |
| `drizzle/0003_teacher_management.sql` | Migration for compliance columns | VERIFIED | 3 `ALTER TABLE` statements for `dbs_status`, `dbs_expiry`, `right_to_work` |
| `src/app/api/agency/teachers/[id]/compliance/route.ts` | PATCH compliance fields | VERIFIED | 34-line file; exports `PATCH`; agent auth guard; `validateBody` + DB update; `{ ok: true }` |
| `src/app/api/agency/teachers/[id]/credentials/route.ts` | POST set/reset credentials | VERIFIED | 48-line file; exports `POST`; agent auth guard; email conflict check; bcrypt hash; DB update |
| `src/components/agency/teacher-compliance-form.tsx` | Compliance management card | VERIFIED | 174-line "use client" component; all 5 fields; conditional `dbsExpiry`; inline errors; `router.refresh()` |
| `src/components/agency/teacher-credentials-form.tsx` | Login credentials card | VERIFIED | 131-line "use client" component; email + password + confirm; client-side match check; `router.refresh()` |
| `src/lib/db/schema.ts` (isActive) | isActive boolean on teachers | VERIFIED | Line 52: `isActive: integer("is_active", { mode: "boolean" }).notNull().default(true)` |
| `drizzle/0004_teacher_active.sql` | Migration for isActive column | VERIFIED | `ALTER TABLE 'teachers' ADD 'is_active' integer DEFAULT 1 NOT NULL` |
| `src/app/api/agency/teachers/[id]/status/route.ts` | PATCH toggle active status | VERIFIED | 28-line file; exports `PATCH`; agent auth guard; `validateBody(agencyTeacherStatusSchema)`; DB update |
| `src/components/agency/teacher-status-toggle.tsx` | Deactivate/Reactivate button | VERIFIED | 56-line "use client" component; conditional label/variant; `window.confirm` for deactivation; loading state; `router.refresh()` |
| `README.md` | v1.0 MVP-complete status | VERIFIED | Priority 1/2/3/4 checklists absent; `## Status: v1.0 MVP Complete` present at line 120 |

---

## Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `src/app/agency/teachers/new/page.tsx` | POST /api/agency/teachers | fetch in onSubmit handler (TeacherForm) | WIRED | `teacher-form.tsx` line 102-106: URL = `/api/agency/teachers`, method = `POST` when `mode === "create"` |
| `src/app/agency/teachers/[id]/edit/page.tsx` | PATCH /api/agency/teachers/[id] | fetch in onSubmit handler (TeacherForm) | WIRED | `teacher-form.tsx` line 102-106: URL = `/api/agency/teachers/${teacherId}`, method = `PATCH` when `mode === "edit"` |
| `src/app/api/agency/teachers/route.ts` | postcodes.io | fetch for geocoding before DB insert | WIRED | Line 28: `fetch(\`https://api.postcodes.io/postcodes/${encodeURIComponent(...)}\`)` + status check + lat/lng extracted before `db.insert` |
| `src/components/agency/teacher-compliance-form.tsx` | PATCH /api/agency/teachers/[id]/compliance | fetch in onSubmit handler | WIRED | Line 48: `fetch(\`/api/agency/teachers/${teacherId}/compliance\`, { method: "PATCH" })` + response handling + `router.refresh()` |
| `src/components/agency/teacher-credentials-form.tsx` | POST /api/agency/teachers/[id]/credentials | fetch in onSubmit handler | WIRED | Line 36: `fetch(\`/api/agency/teachers/${teacherId}/credentials\`, { method: "POST" })` + response handling + `router.refresh()` |
| `src/app/agency/teachers/[id]/page.tsx` | teacher-compliance-form + teacher-credentials-form | import and render in page grid | WIRED | Lines 13-14: imports both; lines 169-183: renders both with correct props |
| `src/components/agency/teacher-status-toggle.tsx` | PATCH /api/agency/teachers/[id]/status | fetch in onClick handler | WIRED | Line 27: `fetch(\`/api/agency/teachers/${teacherId}/status\`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) })` + `router.refresh()` |
| `src/lib/assignment-engine.ts` | teachers.isActive | WHERE isActive=true filter | WIRED | Line 39: `db.select().from(teachers).where(eq(teachers.isActive, true)).all()` |
| `src/app/api/auth/login/route.ts` | teachers.isActive | isActive guard before password compare | WIRED | Lines 68-73: checks `user.role === "teacher"`, fetches `isActive`, returns 401 with clear message if `isActive === false` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TCH-01 | 06-01 | Agency can create a new teacher profile with core fields | SATISFIED | POST /api/agency/teachers + /agency/teachers/new page fully implemented |
| TCH-02 | 06-01 | Agency can edit an existing teacher's core profile fields | SATISFIED | PATCH /api/agency/teachers/[id] + /agency/teachers/[id]/edit page fully implemented |
| TCH-03 | 06-02 | Agency can set a teacher's compliance status (DBS check status + expiry date, right-to-work status) | SATISFIED | PATCH /api/agency/teachers/[id]/compliance + TeacherComplianceForm with all required fields |
| TCH-04 | 06-02 | Agency can edit a teacher's compliance fields | SATISFIED | Same route/form handles both set and update; pre-populated from `initialCompliance` prop |
| TCH-05 | 06-02 | Agency can create login credentials for a new teacher (email + temporary password) | SATISFIED | POST /api/agency/teachers/[id]/credentials + TeacherCredentialsForm with email conflict detection |
| TCH-06 | 06-03 | Agency can deactivate a teacher account (prevents login and hides from assignment engine) | SATISFIED | PATCH status endpoint; login guard checks `isActive`; assignment engine filters `isActive=true` |
| TCH-07 | 06-03 | Agency can reactivate a deactivated teacher account | SATISFIED | Same PATCH status endpoint with `{isActive: true}`; `TeacherStatusToggle` renders "Reactivate" when inactive |
| DOC-01 | 06-03 | README updated to reflect v1.0 MVP-complete status and remove outdated Priority checklists | SATISFIED | Priority 1/2/3/4 sections absent from README; `## Status: v1.0 MVP Complete` present |

All 8 phase requirements satisfied. No orphaned requirements found.

---

## Anti-Patterns Found

No blockers or stubs detected. Specific checks:

- No `return null` / `return {}` / placeholder returns in any of the 8 API routes or 5 components
- No `TODO` / `FIXME` / `PLACEHOLDER` comments in phase files
- No empty `onSubmit` handlers — all forms make real fetch calls and handle responses
- No static empty-array returns in API routes — all reads query the DB, all writes call `.run()`
- `TeacherComplianceForm` uses inline `setSuccessMessage` rather than `toast` from `sonner` (minor deviation from plan spec) — this is a cosmetic choice, not a functional gap; the success state is still communicated to the user

---

## Human Verification Required

The following behaviors are correct in code but require a running browser to fully confirm:

### 1. Create teacher end-to-end flow

**Test:** Sign in as agent, navigate to /agency/teachers/new, fill all fields with a valid UK postcode (e.g. "SW1A 1AA"), set a temporary password, submit.
**Expected:** Teacher appears in /agency/teachers list with correct name and compliance status "Pending".
**Why human:** Postcodes.io live network call and browser form submission cannot be verified statically.

### 2. Compliance badge update after PATCH

**Test:** Open a teacher detail page, change Compliance Status to "Compliant", save. Navigate to /agency/teachers list.
**Expected:** The teacher's compliance badge in the list shows "Compliant" immediately.
**Why human:** `router.refresh()` triggers a server-side re-render; badge state change requires live browser confirmation.

### 3. Deactivated teacher blocked at login

**Test:** Deactivate a teacher from their detail page. Attempt to sign in at /login with their email and password.
**Expected:** 401 response with message "This account has been deactivated. Please contact your agency."
**Why human:** Requires a real login attempt with matching credentials.

### 4. Assignment engine excludes deactivated teacher

**Test:** Deactivate a teacher. Trigger a cover request that would normally rank that teacher highly. Verify the deactivated teacher does not appear in the offer sequence.
**Expected:** Deactivated teacher is absent from the ranked list.
**Why human:** Requires a live assignment workflow run through the app.

---

## Summary

Phase 6 achieves its goal. All 12 observable truths are verified in the codebase:

- **Create/edit core profile (TCH-01, TCH-02):** Full-stack implementation with `TeacherForm`, two API routes, geocoding from postcodes.io, bcrypt password hashing, and Zod validation. "New Teacher" button on teachers list; "Edit Profile" button on teacher detail page.

- **Compliance management (TCH-03, TCH-04):** New `dbsStatus`, `dbsExpiry`, `rightToWork` columns added via migration 0003. `TeacherComplianceForm` wired to PATCH compliance endpoint. Conditional `dbsExpiry` field shown only when DBS status is clear/expired.

- **Credentials management (TCH-05):** `TeacherCredentialsForm` wired to POST credentials endpoint with email conflict detection and bcrypt hashing.

- **Deactivation/reactivation (TCH-06, TCH-07):** `isActive` column added via migration 0004. `TeacherStatusToggle` wired to PATCH status endpoint. Login route blocks inactive teachers before password comparison. Assignment engine filters `isActive=true` at the DB query level.

- **Visual distinction (TCH-06):** `teacher-row.tsx` applies `opacity-50` and "Inactive" badge for deactivated teachers. `teachers-filter.tsx` exposes Active/Inactive filter dropdown.

- **README (DOC-01):** Priority checklists removed; `## Status: v1.0 MVP Complete` section in place.

No stubs, missing artifacts, or broken key links found.

---

_Verified: 2026-03-13T10:30:00Z_
_Verifier: Claude (gsd-verifier)_
