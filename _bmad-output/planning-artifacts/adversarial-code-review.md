# QuickSupply V2 Adversarial Code Review

**Date:** 2026-03-29
**Reviewer:** BMAD Code Review (3-Layer Adversarial)
**Scope:** All V2 API routes, business logic libraries, and spec compliance
**Files Reviewed:** 24 source files across API routes and lib modules

---

## CRITICAL Findings

### C-1: Race Condition -- Duplicate Timesheet Submission (TOCTOU)

**File:** `src/app/api/teacher/timesheets/route.ts`, lines 47-55 and 66-80
**Description:** The POST handler checks for an existing timesheet (line 47-55) then inserts a new one (line 66-80) without a transaction or database-level unique constraint enforcement at the application layer. Two concurrent requests for the same `bookingId` can both pass the existence check and both insert, creating duplicate timesheets.
**Impact:** Financial data corruption -- duplicate pay entries for the same booking.
**Suggested Fix:** Wrap the check-and-insert in a SQLite transaction (`db.transaction()`), or add a UNIQUE constraint on `timesheets.bookingId` in the schema and handle the constraint violation error.

---

### C-2: Race Condition -- Double-Accept on Offers

**File:** `src/lib/assignment-engine.ts`, lines 396-461
**Description:** `handleTeacherResponse()` reads the offer status (line 400-402), checks it is "pending" (line 402), then updates it and creates a booking. Two concurrent accept requests for the same offer can both pass the status check and create duplicate bookings for the same cover request.
**Impact:** A single cover request could end up with multiple bookings, causing double-assignment of teachers.
**Suggested Fix:** Use a transaction with a conditional update: `UPDATE assignmentOffers SET status='accepted' WHERE id=? AND status='pending'` and check `changes` count. Only proceed if exactly 1 row was updated.

---

### C-3: Race Condition -- Invoice Generation Can Double-Invoice Timesheets

**File:** `src/app/api/agency/invoices/route.ts`, lines 76-81 and 95-112
**Description:** The POST handler collects all existing `invoiceLineItems` (line 76-80), builds an exclusion list, then queries for eligible timesheets and inserts new line items -- all without a transaction. Concurrent invoice generation requests for overlapping periods could both see the same timesheets as "not yet invoiced" and include them in separate invoices.
**Impact:** Financial data corruption -- timesheets billed on multiple invoices.
**Suggested Fix:** Wrap the entire read-check-insert flow in a database transaction.

---

### C-4: File Upload MIME Type Relies on Client-Provided `file.type`

**File:** `src/lib/file-storage.ts`, line 23
**Description:** The MIME type validation `ALLOWED_TYPES.has(file.type)` trusts the `Content-Type` provided by the client in the multipart form data. An attacker can upload any file (e.g., an executable or HTML with embedded JavaScript) by setting the MIME type header to `application/pdf` while the actual content is something else.
**Impact:** Stored XSS or malicious file hosting if the compliance file serving route delivers the content inline (which it does -- see `Content-Disposition: inline` at `src/app/api/agency/compliance/file/route.ts` line 52).
**Suggested Fix:** Validate file content by checking magic bytes (file signatures) in addition to the declared MIME type. For defense in depth, also set `Content-Security-Policy` headers on served files and use `Content-Disposition: attachment` instead of `inline`.

---

## HIGH Findings

### H-1: Path Traversal Bypass via Encoded Sequences

**File:** `src/app/api/agency/compliance/file/route.ts`, lines 27-35
**Description:** The path traversal protection checks `filePath.startsWith("uploads/compliance/")` and then `normalised.includes("..")`. However, `path.normalize()` on some platforms may not catch all encoded traversal sequences (e.g., null bytes or OS-specific path separators). Additionally, the check `normalised.startsWith("uploads/compliance/")` after normalize could be bypassed if `process.cwd()` contains symlinks. The real security boundary should be comparing the resolved absolute path.
**Suggested Fix:** Use `path.resolve(process.cwd(), normalised)` and verify the resulting absolute path starts with `path.resolve(process.cwd(), "uploads/compliance/")`. This is the canonical path traversal defense.

```typescript
const resolvedBase = path.resolve(process.cwd(), "uploads/compliance");
const resolvedPath = path.resolve(process.cwd(), normalised);
if (!resolvedPath.startsWith(resolvedBase + path.sep)) {
  return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
}
```

---

### H-2: File Extension Not Validated on Upload

**File:** `src/lib/file-storage.ts`, line 35
**Description:** The uploaded file's extension is extracted from the original filename (`file.name.split(".").pop()`) but never validated against the allowed types. A file named `malware.exe` with a spoofed MIME type of `application/pdf` would be saved as `dbs-1234567890.exe`. The compliance file serving route then serves it with a MIME type based on extension, and `.exe` would fall through to `application/octet-stream`.
**Suggested Fix:** Validate that the file extension matches one of the allowed extensions (`pdf`, `jpg`, `jpeg`, `png`). Reject files with non-matching extensions.

---

### H-3: No File Size Limit on Compliance File Serving

**File:** `src/app/api/agency/compliance/file/route.ts`, line 45
**Description:** `readFile(fullPath)` reads the entire file into memory. While uploads are limited to 10MB, if a file was placed on disk through other means or the limit was changed, this could lead to memory exhaustion.
**Suggested Fix:** Check file size with `stat()` before reading and enforce a maximum. Consider streaming the response instead of buffering the entire file.

---

### H-4: Invoice Amount Calculation Uses `Math.round` on Pence -- Potential Rounding Errors

**File:** `src/app/api/agency/invoices/route.ts`, lines 152-153
**Description:** `Math.round(ts.totalHours * rates.payRate)` and `Math.round(ts.totalHours * rates.chargeRate)` -- when `totalHours` is a float (e.g., 7.33) and rates are integers in pence (e.g., 1500), floating-point multiplication can produce results like `10995.000000000002` or `10994.999999999998`, causing off-by-one-penny rounding inconsistencies.
**Impact:** Small but cumulative financial discrepancies across many invoices.
**Suggested Fix:** Use integer arithmetic throughout. Store hours as minutes (integer) and compute `(minutes * rateInPence) / 60` with explicit rounding rules, or use a decimal library.

---

### H-5: Timesheet Total Hours Can Be Negative

**File:** `src/app/api/teacher/timesheets/route.ts`, lines 58-61
**Description:** If `departureTime` is earlier than `arrivalTime` (e.g., arrival "17:00", departure "08:00"), or if `breakMinutes` exceeds the total duration, `totalMinutes` becomes negative. The negative value is stored in the database and propagated to invoice calculations.
**Suggested Fix:** Validate that `departureTime > arrivalTime` and that `breakMinutes < totalMinutesBeforeBreak`. Return a 400 error if either condition fails.

---

### H-6: Agency Timesheet Status Filter Accepts Arbitrary Strings

**File:** `src/app/api/agency/timesheets/route.ts`, line 45
**Description:** `statusFilter` is cast to the union type `"submitted" | "approved" | "disputed" | "paid"` without validation. If an arbitrary string is passed (e.g., `?status=nonsense`), the query executes with an impossible filter and returns an empty result set. While not a security vulnerability, it masks bugs.
**Suggested Fix:** Validate the `status` query parameter against the allowed values before using it.

---

### H-7: No Pagination on List Endpoints

**Files:** Multiple API routes including:
- `src/app/api/teacher/timesheets/route.ts` (GET)
- `src/app/api/agency/timesheets/route.ts` (GET)
- `src/app/api/agency/invoices/route.ts` (GET)
- `src/app/api/agency/pay-rates/route.ts` (GET)
- `src/app/api/agency/compliance/documents/route.ts` (GET)

**Description:** All list endpoints return `.all()` without any `LIMIT` or pagination. As data grows, these queries will return unbounded result sets, causing performance degradation and potential memory issues.
**Suggested Fix:** Add cursor-based or offset pagination with a default limit (e.g., 50 records).

---

## MEDIUM Findings

### M-1: Assignment Engine Loads All Data Into Memory

**File:** `src/lib/assignment-engine.ts`, lines 83-161
**Description:** `rankTeachersForRequest()` loads ALL active teachers, ALL availability records, ALL reviews, ALL teacher subjects, and ALL bookings into memory before filtering. For a single-agency deployment this is manageable, but will not scale. In the multi-agency future (Epic 6), this becomes a significant performance issue.
**Suggested Fix:** Push more filtering into SQL queries (e.g., filter teachers by role type and compliance status in the query, filter availability by teacher IDs, etc.).

---

### M-2: `getConfigValue` Parses Integer Without NaN Guard

**File:** `src/lib/assignment-engine.ts`, lines 61-64
**Description:** `parseInt(row.value, 10)` returns `NaN` if the stored config value is not a valid integer. This `NaN` then propagates into offer expiry time calculations (`windowMinutes * 60 * 1000`), producing an `Invalid Date` for `expiresAt`.
**Suggested Fix:** Add a `Number.isFinite()` check and fall back to the default value.

```typescript
const parsed = parseInt(row.value, 10);
return Number.isFinite(parsed) ? parsed : fallback;
```

---

### M-3: Teacher Document List Filters in JavaScript, Not SQL

**File:** `src/app/api/teacher/documents/route.ts`, lines 90-95
**Description:** The GET handler fetches all documents for a teacher and then filters `archivedAt === null` in JavaScript with `.filter()`. This should be a SQL `WHERE` clause for correctness (strict equality with `null` in JS) and performance.
**Suggested Fix:** Use `isNull(complianceDocuments.archivedAt)` in the Drizzle query's `.where()` clause.

---

### M-4: Compliance Status Recalculation Is Duplicated

**Files:** `src/app/api/agency/compliance/documents/[id]/route.ts` (lines 127-159) and `src/lib/compliance-checks.ts` (lines 167-221)
**Description:** Two independent implementations of `recalculateComplianceStatus()` exist with slightly different logic. The one in the API route checks for verified DBS AND verified right_to_work. The one in `compliance-checks.ts` has a more nuanced three-state model (compliant/pending/expired) that also considers expired documents. If one is updated and the other is not, compliance statuses will become inconsistent.
**Suggested Fix:** Consolidate into a single shared function in a common module and import it in both locations.

---

### M-5: Pay Rate Lookup Casts `roleType` Unsafely

**File:** `src/lib/pay-rate-lookup.ts`, lines 28, 49
**Description:** `roleType as "teacher" | "ta"` -- the function accepts `string` but casts to the union type without validation. If a new role type is introduced (e.g., "specialist"), the query silently returns no results and invoice generation fails with a confusing error.
**Suggested Fix:** Validate `roleType` at the function boundary and throw a descriptive error for unrecognized values.

---

### M-6: `dayOfWeek` Calculation Is Timezone-Dependent

**File:** `src/lib/assignment-engine.ts`, line 103
**Description:** `new Date(request.date + "T00:00:00").getDay()` creates a date in the local timezone of the server. If the server runs in UTC (as is common for cloud deployments) and the intended timezone is UK local time, dates near midnight could produce the wrong day-of-week during BST (British Summer Time).
**Suggested Fix:** Explicitly parse dates in the target timezone (e.g., "Europe/London") or use a date library that handles timezone-aware day-of-week calculations.

---

### M-7: `contactNightBeforeOnly` Logic Uses Server Local Time

**File:** `src/lib/assignment-engine.ts`, lines 199-205
**Description:** The comparison `if (requestDate > tomorrow) continue;` uses `new Date()` which is server-local time. Same timezone issue as M-6 -- "night before" semantics depend on the business timezone (UK), not the server's system timezone.
**Suggested Fix:** Use UK-timezone-aware date comparisons.

---

### M-8: Offer Auto-Advance After Decline Re-Ranks, Potentially Changing Order

**File:** `src/lib/assignment-engine.ts`, lines 479-481
**Description:** When a teacher declines, the system calls `rankTeachersForRequest()` again with `nextOrder`. But the re-ranking may produce a different ordered list than the original (due to new bookings, availability changes, etc.), so `offerOrder` no longer corresponds to the same position. This could result in skipping teachers or offering to the same teacher twice (though the `declinedOrExpired` filter prevents the latter).
**Suggested Fix:** Store the original ranked list in the database or use a deterministic ranking approach. Alternatively, document this as intentional "dynamic re-ranking" behavior.

---

### M-9: Invoice PDF Exposes Internal Pay Rates and Gross Margin

**File:** `src/lib/invoice-pdf.tsx`, lines 280-310
**Description:** The generated PDF includes both pay rates and charge rates with a gross margin calculation. If this PDF is sent to schools (its intended purpose), it reveals the agency's profit margin and what teachers are being paid -- commercially sensitive information.
**Suggested Fix:** Create separate school-facing and internal invoice views. The school-facing PDF should only show charge rates and charge amounts.

---

### M-10: Search Route Does Not Escape SQL LIKE Special Characters

**File:** `src/app/api/agency/search/route.ts`, line 28
**Description:** `const likeQuery = '%' + query + '%'` -- if the user searches for `%` or `_`, these are LIKE wildcards and will match unintended records. While not a security issue (parameterized queries prevent injection), it produces incorrect search results.
**Suggested Fix:** Escape `%`, `_`, and `\` characters in the search query before wrapping with `%`.

---

### M-11: Push Subscription Delete-Then-Insert Is Not Atomic

**File:** `src/app/api/push/subscribe/route.ts`, lines 36-56
**Description:** The upsert pattern (delete existing, then insert new) is not wrapped in a transaction. If the process crashes between the delete and insert, the subscription is lost.
**Suggested Fix:** Wrap in a transaction or use an INSERT ... ON CONFLICT pattern.

---

## LOW Findings

### L-1: Story 2.2 AC4 Not Implemented -- Disputed Timesheet Resubmission

**Spec:** Story 2.2, Acceptance Criteria 4: "Given a disputed timesheet, when the teacher resubmits, then it reappears in my queue as submitted"
**Description:** There is no API endpoint for a teacher to resubmit a disputed timesheet. The teacher timesheets POST route checks for existing timesheets and rejects duplicates (409). There is no mechanism to update a disputed timesheet back to "submitted" status.
**Suggested Fix:** Add a PATCH endpoint for teachers to resubmit disputed timesheets (updating arrival/departure/break and resetting status to "submitted").

---

### L-2: Story 2.5 Partially Implemented -- No Margin Report Drill-Down

**Spec:** Story 2.5, AC3: "Given the margin report, when I drill down by school, then I see per-school margin breakdown"
**Description:** The margins analytics page exists (`src/app/agency/analytics/margins/page.tsx`) but the per-school drill-down functionality is not visible as a dedicated API endpoint or page route.
**Suggested Fix:** Add a school-level margin breakdown endpoint and corresponding UI drill-down.

---

### L-3: Story 3.4 AC2 Missing -- 30/60/90 Day Expiration Grouping

**Spec:** Story 3.4, AC2: "I see documents expiring in the next 30/60/90 days grouped by teacher"
**Description:** The compliance dashboard page exists but there is no API endpoint that returns documents grouped by teacher with 30/60/90 day expiration windows. The compliance checks library only handles 7-day and 30-day windows for notifications.
**Suggested Fix:** Add a dedicated API endpoint for the compliance dashboard that groups upcoming expirations by teacher and by time window (30/60/90 days).

---

### L-4: Story 4.1 Not Fully Verified -- Service Worker Registration

**Spec:** Story 4.1: Service Worker Registration
**Description:** Could not verify if `public/sw.js` exists or if service worker registration is implemented in the root layout. No route.ts or page.tsx file appears to handle service worker concerns.
**Suggested Fix:** Verify service worker implementation exists. If not, add it as planned.

---

### L-5: Story 4.3 and 4.4 Not Implemented

**Spec:** Stories 4.3 (Offline Support) and 4.4 (Install Prompt)
**Description:** These are P3 stories and may be intentionally deferred. No implementation evidence found in the codebase.
**Status:** Expected -- these are P3 priority items.

---

### L-6: Story 5.4 Not Implemented -- Historical Performance Weighting

**Spec:** Story 5.4: "acceptance rate, cancellation rate, and average punctuality" in ranking
**Description:** The assignment engine does not incorporate acceptance rate, cancellation rate, or punctuality metrics. The performance page exists (`src/app/teacher/performance/page.tsx`) but the ranking algorithm does not use these metrics.
**Status:** P3 story, likely intentionally deferred.

---

### L-7: Epic 6 Not Started -- Multi-Agency Support

**Spec:** Stories 6.1-6.4
**Description:** No `agencies` table, no `agencyId` foreign keys, no multi-tenancy middleware. All Epic 6 stories appear unimplemented.
**Status:** Expected -- this is a large-scope epic likely planned for later.

---

### L-8: Missing Readiness Report Gaps Still Open

**Spec:** Readiness report identified five missing stories (School Timesheet Sign-Off, Enhanced Scheduling, Analytics Export, SMS Notifications, Dark Mode).
**Description:** None of these gaps have been addressed in the current codebase. No school timesheet sign-off endpoint exists. No multi-day booking support. No CSV/PDF export for analytics. No SMS integration.
**Suggested Fix:** These should be tracked as planned work items.

---

### L-9: Activity Log `actorRole` Cast Is Unsafe

**File:** `src/lib/activity-log.ts`, line 23
**Description:** `actorRole as "school" | "teacher" | "agent"` -- the function accepts `string` but the call site in `assignment-engine.ts` passes `"agent"` for system-generated activities (line 387: `logActivity("system", "agent", ...)`). The actorId "system" is not a real user ID. While harmless for an audit log, it makes querying "who did this" unreliable.
**Suggested Fix:** Define a proper "system" actor type or use a sentinel ID that is documented.

---

### L-10: Request Templates Have No Update Endpoint

**File:** `src/app/api/school/templates/[id]/route.ts`
**Description:** Only DELETE is implemented. There is no PATCH/PUT endpoint to update an existing template. Schools can only create new templates or delete existing ones.
**Suggested Fix:** Add a PATCH endpoint for template updates if the UX expects edit functionality.

---

## Summary

| Severity | Count | Key Themes |
|----------|-------|------------|
| **CRITICAL** | 4 | Race conditions (3), file upload validation bypass (1) |
| **HIGH** | 7 | Path traversal, negative hours, no pagination, rounding errors |
| **MEDIUM** | 11 | Timezone bugs, duplicated logic, memory-intensive queries, data exposure |
| **LOW** | 10 | Spec gaps (mostly P3 deferred work), minor code quality issues |
| **Total** | 32 | |

### Top Priorities for Remediation

1. **Transaction safety** (C-1, C-2, C-3): Add database transactions around all check-then-write patterns. This is the single highest-impact class of bugs.
2. **File upload security** (C-4, H-1, H-2): Validate file content by magic bytes, validate extensions, and use `path.resolve()` for traversal protection.
3. **Input validation** (H-5, H-6): Reject negative timesheet hours and validate query parameter enum values.
4. **Financial accuracy** (H-4): Review rounding strategy for monetary calculations across all invoice and pay rate code.
