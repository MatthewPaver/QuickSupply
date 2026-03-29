# QuickSupply Edge Case Analysis

**Date:** 2026-03-29
**Scope:** Deep analysis of core business logic — every branching path examined for unhandled scenarios
**Files Analyzed:**
- `src/lib/assignment-engine.ts`
- `src/lib/compliance-checks.ts`
- `src/lib/pay-rate-lookup.ts`
- `src/app/api/agency/invoices/route.ts`
- `src/app/api/teacher/timesheets/route.ts`
- `src/app/api/agency/compliance/documents/[id]/route.ts`
- `src/lib/file-storage.ts`
- `src/app/api/agency/compliance/file/route.ts`
- `src/app/api/teacher/documents/route.ts`

---

## 1. assignment-engine.ts

### 1.1 Empty / Null / Undefined Inputs

| Scenario | Handling | Status |
|---|---|---|
| `rankTeachersForRequest("")` or invalid requestId | Returns `[]` (request lookup returns undefined) | OK |
| Request exists but `schoolId` references a deleted school | Returns `[]` (school lookup returns undefined) | OK |
| No active teachers in the system | Returns `[]` | OK |
| `handleTeacherResponse` with non-existent offerId | Returns `{ success: false, message: "Offer not found." }` | OK |
| `manualAssign` with non-existent requestId or teacherId | Returns appropriate error messages | OK |

### 1.2 Date Boundary Issues

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-01** | **DST-sensitive day-of-week calculation** | Medium | Line 103: `new Date(request.date + "T00:00:00").getDay()` constructs a Date in local timezone. If the server is in a timezone that observes DST, dates near the transition (e.g., `2026-03-29T00:00:00` in the UK) could compute the wrong `dayOfWeek` because the constructor may shift the date. The `request.date` is a string like `"2026-03-29"` but appending `T00:00:00` without a timezone makes it local. For UK servers during the BST spring-forward, `00:00:00` might not exist, causing the Date to shift to `23:00:00` of the prior day, yielding the wrong `getDay()`. |
| **EC-02** | **`contactNightBeforeOnly` boundary condition** | Low | Lines 199-206: The "night before" filter compares `requestDate > tomorrow`. This uses `new Date()` for "today" and calculates "tomorrow". If the cron job or API call happens at exactly midnight, the boundary between "today" and "tomorrow" may behave unexpectedly. Additionally, this uses local timezone via `setHours(0,0,0,0)`, which could differ from the server's operational timezone. |
| **EC-03** | **Offer expiry across midnight** | Low | `checkExpiredOffers()` compares `o.expiresAt <= now`. This is correct, but if the cron interval is long (e.g., 5 minutes) and an emergency offer window is 7 minutes, a teacher gets at most 2 extra minutes of grace time. Not a bug, but an operational consideration. |

### 1.3 Concurrency / Race Conditions

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-04** | **Two teachers cannot accept the same offer (by design)** | N/A | The sequential model means only one pending offer exists per request. However... |
| **EC-05** | **Race between teacher acceptance and cron-based expiry** | High | If a teacher calls `handleTeacherResponse("accepted")` at the same moment `checkExpiredOffers()` marks that offer as expired, both write to the same offer row. SQLite's single-writer lock serializes them, but the outcome depends on execution order: (1) If acceptance runs first, the offer is "accepted" and a booking is created, then the cron tries to expire it but `offer.status !== "pending"` is not checked — the cron's filter `o.expiresAt <= now` would still match it. The cron then marks it "expired" **after** a booking was already created, leading to a ghost booking with an "expired" offer. (2) If cron runs first, the offer is expired, and the teacher's acceptance fails gracefully ("Offer is no longer active"). **Mitigation needed:** `checkExpiredOffers()` should re-read each offer's status before marking it expired, or use a SQL `WHERE status = 'pending'` in the UPDATE. |
| **EC-06** | **Race between manual assign and sequential offering** | Medium | If an agent calls `manualAssign` while the automated sequence is advancing (e.g., a decline triggers `offerToNextTeacher`), both could create new offers for the same request simultaneously. The manual assign does withdraw active pending offers, but the timing gap between reading and writing could allow a second offer to be created. SQLite serialization reduces the window, but does not eliminate it. |
| **EC-07** | **Double booking on same date** | Low | The existing-bookings filter (lines 94-100) only filters non-cancelled bookings. But the booking check and the booking creation in `handleTeacherResponse` are not atomic. In theory, two different requests for the same date could both get accepted by the same teacher if the timing is extremely tight. SQLite's write serialization makes this very unlikely but not impossible at the application level. |

### 1.4 Deleted / Deactivated Entities

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-08** | **Deactivated teacher with an active offer** | Medium | If a teacher is deactivated while they have a pending offer, nothing withdraws that offer. The teacher might still be able to accept it (the `handleTeacherResponse` function does not check `teacher.isActive`). The ranking filters deactivated teachers from future offers, but does not clean up existing ones. |
| **EC-09** | **Deactivated school with pending request** | Low | If a school is deactivated while a cover request is in "pending" or "offering" status, the request remains active. Offers continue to be sent for a deactivated school's request. There is no check in `offerToNextTeacher` that the school is still active. |
| **EC-10** | **Deleted/missing teacher referenced by offer** | Low | In `handleTeacherResponse`, if the teacher has been deleted between offer creation and acceptance, the `teacher` lookup (line 429) returns undefined. The code handles this with a fallback (`teacher ? ... : "Unknown"`), so it does not crash, but a booking is created for a non-existent teacher. |

### 1.5 Scalability Concerns

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-11** | **O(n) scans for all tables** | Medium | `rankTeachersForRequest` loads ALL active teachers, ALL availability records, ALL reviews, ALL teacher subjects, and ALL existing bookings into memory. For 1000+ teachers with full availability records, this is potentially thousands of rows loaded synchronously for every ranking call. The Drizzle `.all()` calls are synchronous (better-sqlite3), so they block the Node.js event loop. |
| **EC-12** | **Re-ranking on every decline/expire** | Medium | Lines 479-481 and 690-692: When a teacher declines or an offer expires, the entire ranked list is recomputed from scratch. For a request that goes through 10 teachers, this means 10 full database scans. Combined with EC-11, this could cause noticeable latency during the morning rush. |
| **EC-13** | **Blacklist check uses `Array.includes`** | Low | Line 167: `blacklisted.includes(teacher.id)` is O(n) per teacher. With 200 teachers and a modest blacklist this is fine, but at scale a Set would be more appropriate. Same issue with `existingBookings.includes` on line 187. |

### 1.6 Data Integrity Issues

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-14** | **`getConfigValue` returns NaN silently** | Low | Line 63: `parseInt(row.value, 10)` returns NaN if the value is not a valid integer (e.g., malformed JSON or empty string). NaN is then used for the response window, producing `NaN * 60 * 1000 = NaN` for `expiresAt`, resulting in an `Invalid Date`. The offer would be created with an invalid expiry, and `checkExpiredOffers` would never match it (since `NaN <= now` is always false). The offer would hang forever. |
| **EC-15** | **offerOrder mismatch after re-ranking** | Low | When a decline triggers re-ranking (line 479-481), the `nextOrder` is `offer.offerOrder + 1`. But the re-ranked list may be different from the original (new teachers may have become available, others may have been booked). The `offerOrder` in `offerToNextTeacher` is used as an array index (`rankedList[offerOrder - 1]`). If the new ranked list is shorter than `offerOrder`, the function correctly returns "All eligible teachers exhausted." But if a teacher who was at position 3 in the old list is now at position 1 in the new list, they could be skipped — the function would offer to whoever is at `nextOrder - 1` in the new list. This is actually by design (the `declinedOrExpired` set prevents re-offering), but the `offerOrder` number becomes meaningless as a rank indicator. |
| **EC-16** | **Preferred teacher added at top even if already in list** | Low | Lines 279-308: The preferred teacher re-insertion block checks `!rankedIds.has(request.preferredTeacherId)` before adding. This correctly avoids duplicates. No issue here. |

### 1.7 Missing Null Checks

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-17** | **`teacher.lat` / `teacher.lng` or `school.lat` / `school.lng` could be null/NaN** | Medium | `haversineDistance` takes four numbers. If a teacher or school was created without geocoding (lat/lng are 0 or null), the distance calculation returns 0 (for lat=0, lng=0 — the Gulf of Guinea). A teacher at lat=0, lng=0 would appear to be 0 miles from any school at lat=0, lng=0, and would pass the max distance filter incorrectly. No null check is performed on lat/lng before calling haversineDistance. |

---

## 2. compliance-checks.ts

### 2.1 Edge Cases

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-18** | **Document with null expiryDate passes expiry check** | Low | `checkExpiringDocuments` filters on `gte(complianceDocuments.expiryDate, todayStr)` and `lte(complianceDocuments.expiryDate, in30Days)`. In SQLite, NULL values are excluded from these comparisons, so documents without expiry dates are correctly ignored. Line 79 adds an explicit `if (!doc.expiryDate) continue;` as a belt-and-suspenders check. Well handled. |
| **EC-19** | **`recalculateComplianceStatus` only checks `dbs` and `right_to_work`** | Low | Only these two document types are considered "required". If additional required types are added later (e.g., `safeguarding`), this array must be updated. Not a bug, but a maintenance concern. |
| **EC-20** | **Duplicate `recalculateComplianceStatus` implementations** | Medium | There are TWO different implementations of `recalculateComplianceStatus`: one in `compliance-checks.ts` (lines 167-221) and one in `documents/[id]/route.ts` (lines 127-159). They have **different logic**: the `compliance-checks.ts` version considers archived documents and distinguishes between `expired` and `pending` statuses; the route version simply checks for any verified DBS and verified right_to_work and returns either "compliant" or "pending" — it never sets "expired". If a document expires and the route version recalculates (e.g., after verifying a different document), it could incorrectly set a teacher with expired documents to "pending" instead of "expired". |
| **EC-21** | **`alreadyNotifiedToday` uses agent recipientId "all-agents"** | Low | Line 86 checks for an existing notification to `recipientId: "all-agents"`. But `notifyAllAgents` creates individual notifications for each agent. The deduplication check would never find a match because the actual recipientIds are individual agent IDs, not "all-agents". This means agency notifications are sent every time the cron runs, not once per day. |

---

## 3. pay-rate-lookup.ts

### 3.1 Edge Cases

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-22** | **roleType not validated against enum** | Low | The `roleType` parameter is cast to `"teacher" | "ta"` on line 28, but no runtime validation ensures it is actually one of those values. If an unexpected value is passed (e.g., `"both"`), the query returns no results and the function returns `null`, which is handled upstream. |
| **EC-23** | **No rate for a booking date far in the future** | Low | If `effectiveFrom` is set to a future date and a booking is created for today, no rate would match (`lte(payRates.effectiveFrom, bookingDate)` would exclude it). The function correctly returns `null`, and the invoice route returns a 400 error. |
| **EC-24** | **String comparison for dates** | Low | SQLite stores dates as text. The `lte` comparison works correctly for ISO `YYYY-MM-DD` strings because lexicographic ordering matches chronological ordering. No issue. |

---

## 4. Invoice Generation (agency/invoices/route.ts)

### 4.1 Edge Cases

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-25** | **Invoice for overlapping periods** | Medium | Nothing prevents generating two invoices for the same school and overlapping date ranges. The deduplication is based on `invoiceLineItems.timesheetId` — timesheets already on any invoice are excluded. This means if you generate an invoice for Jan 1-31, then another for Jan 15-Feb 15, the second invoice would only include Feb 1-15 timesheets. This is correct but could be confusing to users who expect a clean period split. |
| **EC-26** | **`periodStart` after `periodEnd`** | Low | The Zod schema validates the date format but does not ensure `periodStart <= periodEnd`. If reversed, the query returns no results and the endpoint returns a 400 ("No approved timesheets found"). Not a crash, but a poor error message. |
| **EC-27** | **Rounding errors in pay calculation** | Low | Line 152: `Math.round(ts.totalHours * rates.payRate)`. Since `totalHours` is a float (e.g., `7.33`) and `payRate` is an integer (pence), the multiplication could produce floating-point imprecision. `Math.round` mitigates this, but for financial calculations, using integer arithmetic throughout would be more robust. |
| **EC-28** | **Non-atomic invoice creation** | Medium | The invoice and its line items are inserted in separate statements (lines 172-188). If the process crashes after inserting the invoice but before all line items are written, the database would contain a partial invoice. There is no transaction wrapping the insert. |
| **EC-29** | **Large `notInArray` with many invoiced timesheets** | Low | Line 91: `notInArray(timesheets.id, invoicedTimesheetIds)` loads ALL invoice line items into memory first (line 77-78), then passes their IDs as an array to the SQL query. With thousands of invoiced timesheets, this generates a very long `NOT IN (...)` clause that could hit SQLite's parameter limits (default 999 variables per query). |

---

## 5. Timesheet Submission (teacher/timesheets/route.ts)

### 5.1 Edge Cases

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-30** | **Negative total hours** | Medium | Line 60-61: If `departureTime` is before `arrivalTime` (which the Zod refine prevents at the schema level), or if `breakMinutes` exceeds total minutes, `totalHours` could be negative or zero. The schema prevents departure < arrival and break > total time, but if validation is bypassed, negative hours would be stored. The Zod validation is the only guard here — no server-side revalidation after parsing. |
| **EC-31** | **Timesheet for future booking** | Low | Nothing prevents submitting a timesheet for a booking whose cover request date is in the future. A teacher could submit a timesheet before the actual work day. Consider adding a date check. |
| **EC-32** | **No ownership check on cover request** | N/A | The route checks `booking.teacherId !== session.userId` which is sufficient. The teacher can only submit timesheets for their own bookings. |
| **EC-33** | **Timesheet resubmission after dispute** | Low | The route checks for any existing timesheet for the booking (`where(eq(timesheets.bookingId, bookingId))`). If a timesheet was disputed, the teacher cannot resubmit because the check finds the existing disputed record. Story 2.2 mentions the teacher should be able to resubmit — this is a gap in the current implementation. |

---

## 6. Compliance Document Routes

### 6.1 Document Verification ([id]/route.ts)

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-34** | **Verify already-verified document** | Low | There is no status check preventing re-verification of an already-verified document. An agent could verify a document that was already verified, resetting `verifiedAt` and `verifiedBy`. Not harmful, but wasteful. |
| **EC-35** | **Reject with verification side-effects** | Low | If a DBS document is rejected after previously being verified (e.g., re-uploaded and rejected), the reject path does NOT revert `teachers.dbsStatus` to a non-clear state. The `recalculateComplianceStatus` at the end handles the overall compliance status but `dbsStatus` remains "clear" from the previous verification. |
| **EC-36** | **Verify without expiry date for DBS** | Medium | When verifying a DBS document, the `expiryDate` is optional. If omitted, `dbsExpiry` is set to null. The `checkExpiringDocuments` cron would never flag this document for renewal, and the teacher would remain compliant indefinitely. For DBS certificates that DO expire, this is a data quality risk. |

### 6.2 File Upload (teacher/documents/route.ts)

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-37** | **No archiving of previous document on upload** | Low | Story 3.1 specifies "when I upload a replacement, then the old document is archived." The current implementation inserts a new document record without archiving previous documents of the same type. Multiple pending documents of the same type could accumulate. |
| **EC-38** | **File name not sanitised** | Medium | `file.name` is used in the response and stored in the database. While the actual file on disk gets a sanitised name (`documentType-timestamp.ext`), the `fileName` field stores the original name. If the original name contains HTML/script characters, it could be an XSS vector if rendered unsafely in the UI. |

### 6.3 File Serving (compliance/file/route.ts)

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-39** | **Path traversal protection is adequate** | N/A | The route checks `startsWith("uploads/compliance/")` and `path.normalize` to block traversal. The double-check after normalize is good practice. |
| **EC-40** | **Only agents can view compliance files** | Low | The file serving route requires `session.role !== "agent"`. Teachers who uploaded their own documents cannot view them via this endpoint. They would need a separate route or the UI must rely on the file path stored in the database. This may or may not be intentional. |
| **EC-41** | **No Content-Security-Policy on served files** | Low | Serving uploaded PDFs/images without `Content-Security-Policy` headers or `X-Content-Type-Options: nosniff` could allow content-type sniffing attacks. The `Content-Type` is set based on extension, which is better than relying on the uploaded MIME type, but adding `nosniff` would be a defense-in-depth measure. |

### 6.4 file-storage.ts

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-42** | **MIME type validation trusts `file.type`** | Medium | Line 23: `ALLOWED_TYPES.has(file.type)` trusts the MIME type provided by the client, which can be spoofed. A malicious user could upload an executable with `type: "application/pdf"`. The extension-based naming on disk provides some mitigation (the file is saved as `.pdf`), but the content could still be malicious. Consider validating file magic bytes. |
| **EC-43** | **TOCTOU race in directory creation** | Low | Lines 31-33: `existsSync` followed by `mkdir` is a time-of-check-time-of-use pattern. In a concurrent environment, two uploads could both pass the `existsSync` check. However, `mkdir({ recursive: true })` is idempotent, so this is not actually a problem. |
| **EC-44** | **Disk space exhaustion** | Low | No check for available disk space before writing. If the disk is full, `writeFile` throws an error that propagates to the caller. The caller (teacher/documents/route.ts) catches this with a generic "Upload failed" message. |

---

## 7. Cross-Cutting Concerns

### 7.1 Transaction Safety

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-45** | **No database transactions anywhere** | High | Across all audited files, no Drizzle/SQLite transactions are used. Critical multi-step operations that should be atomic: (1) `handleTeacherResponse` — accept: update offer, create booking, update cover request (3 writes). (2) Invoice generation — insert invoice + N line items. (3) `cancelBooking` — update booking, update cover request. If the server crashes mid-operation, the database will be in an inconsistent state. SQLite supports transactions via Drizzle's `db.transaction()` API. |

### 7.2 Error Handling

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-46** | **SSE errors are not caught** | Low | `sseManager.emit()` calls throughout the assignment engine are not wrapped in try/catch. If the SSE manager throws (e.g., writing to a closed stream), the entire operation could fail, including database writes that follow the SSE call. SSE emission should be fire-and-forget with error catching. |
| **EC-47** | **Notification failures could halt offer flow** | Low | `createNotification()` calls are inline with the offer flow. If notification creation throws (e.g., DB constraint violation), the offer would appear to fail even though the database offer row was already created. |

### 7.3 Security

| # | Issue | Severity | Description |
|---|---|---|---|
| **EC-48** | **Cron endpoint not validated in expiry flow** | N/A | `checkExpiredOffers` is a library function, not a route. It is called from the cron route which has its own secret validation. No issue here. |
| **EC-49** | **IDOR check on offer response is route-level only** | Low | `handleTeacherResponse` does not itself verify the caller is the assigned teacher. The API route (`PATCH /api/offers`, line 26) correctly checks `offer.teacherId !== session.userId`. Any internal caller of `handleTeacherResponse` would bypass this check. Consider adding the check to the engine function as defense-in-depth. |

---

## 8. Summary of Findings by Severity

### High (3)

| # | Finding |
|---|---|
| EC-05 | Race between teacher acceptance and cron-based offer expiry could create ghost bookings |
| EC-45 | No database transactions for multi-step operations (booking creation, invoice generation, cancellation) |
| EC-20 | Duplicate `recalculateComplianceStatus` with divergent logic between `compliance-checks.ts` and document route |

### Medium (10)

| # | Finding |
|---|---|
| EC-01 | DST-sensitive day-of-week calculation in ranking |
| EC-06 | Race between manual assign and automated sequential offering |
| EC-08 | Deactivated teacher can still accept pending offers |
| EC-11 | O(n) full-table scans for all ranking data |
| EC-12 | Re-ranking on every decline/expire multiplies scan cost |
| EC-17 | Null/zero lat/lng produces incorrect distance calculations |
| EC-25 | No prevention of overlapping invoice periods |
| EC-28 | Non-atomic invoice creation (invoice + line items) |
| EC-38 | Uploaded file names not sanitised for XSS |
| EC-42 | MIME type validation trusts client-provided type |

### Low (20)

| # | Finding |
|---|---|
| EC-02, EC-03, EC-07, EC-09, EC-10, EC-13, EC-14, EC-15, EC-19, EC-21, EC-22, EC-23, EC-26, EC-27, EC-29, EC-30, EC-31, EC-33, EC-34, EC-35, EC-36, EC-37, EC-40, EC-41, EC-43, EC-44, EC-46, EC-47 | Various low-severity edge cases (see details above) |

---

## 9. Recommended Priority Fixes

1. **Wrap critical multi-step operations in `db.transaction()`** — booking acceptance, invoice generation, booking cancellation. (EC-45)
2. **Add `WHERE status = 'pending'` to the UPDATE in `checkExpiredOffers`** so it cannot overwrite an offer that was just accepted. (EC-05)
3. **Consolidate `recalculateComplianceStatus` into a single shared function** used by both `compliance-checks.ts` and the document verification route. (EC-20)
4. **Add `teacher.isActive` check in `handleTeacherResponse`** before creating a booking. (EC-08)
5. **Use UTC for all date calculations** in the assignment engine (`new Date(request.date + "T00:00:00Z")`) to avoid DST issues. (EC-01)
6. **Validate lat/lng is non-null and non-zero** before distance calculation, or add a fallback/exclusion. (EC-17)
7. **Sanitise `fileName`** stored in the database to prevent XSS. (EC-38)
8. **Add magic-byte validation** for uploaded files, not just MIME type trust. (EC-42)
9. **Add `X-Content-Type-Options: nosniff`** to file serving responses. (EC-41)
10. **Add `teacher.isActive` and school `isActive` checks** in offer acceptance and offering flows. (EC-08, EC-09)
