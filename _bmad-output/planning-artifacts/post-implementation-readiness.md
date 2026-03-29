# QuickSupply Post-Implementation Readiness Re-check

**Date:** 2026-03-29
**Scope:** Verify resolution of original readiness caveats, PRD/architecture alignment, and implementation gaps
**Baseline:** Readiness Report dated 2026-03-27

---

## 1. Original Caveats — Resolution Status

The readiness report identified three caveats that had to be addressed before proceeding with V2 implementation:

### Caveat 1: Add Missing Stories

> "Add missing stories for school timesheet sign-off (V2-TIM-02), the Enhanced Scheduling epic (V2-SCHED-01/02/03), analytics export (V2-ANA-04), and SMS notifications (V2-PUSH-03) before those epics begin implementation."

**Status: PARTIALLY RESOLVED**

Evidence from the built pages and code:

| Missing Story | Built? | Notes |
|---|---|---|
| School timesheet sign-off (V2-TIM-02) | No | No school-facing timesheet page exists. `src/app/school/` has no timesheets route. The agency can approve/dispute timesheets, but schools cannot sign off on hours. **Still a gap.** |
| Enhanced Scheduling (V2-SCHED-01/02/03) | No | No multi-day booking, recurring templates, or calendar view pages exist. Not yet implemented or storied. |
| Analytics export (V2-ANA-04) | No | No CSV/PDF export functionality found in any analytics page. Analytics pages exist but lack export capability. |
| SMS notifications (V2-PUSH-03) | No | SMS log viewer exists (MVP), but no SMS sending integration has been built. |

**However**, significant V2 features HAVE been implemented without these stories being formally added to the epics document:

| Implemented Feature | Corresponding Story/Epic |
|---|---|
| Timesheet submission (teacher) | Story 2.1 |
| Timesheet approval/dispute (agency) | Story 2.2 |
| Pay rate management | Story 2.3 |
| Invoice generation | Story 2.4 |
| Margin tracking | Story 2.5 |
| Compliance document upload | Story 3.1 |
| Compliance document verification | Story 3.3 |
| Compliance dashboard | Story 3.4 |
| Automated expiry alerts | Story 3.2 |
| Subject specialization tracking | Story 5.1 |
| School preference learning (affinity scoring) | Story 5.2 |
| AI-assisted ranking (configurable weights) | Story 5.3 |
| Analytics dashboard landing page | Story 1.5 |
| Fill rate report | Story 1.1 |
| Response time metrics | Story 1.2 |
| Teacher utilization report | Story 1.3 |
| School satisfaction scores | Story 1.4 |
| Teacher performance page | Not in stories |
| School analytics page | Not in stories |

**Verdict:** The missing stories were not added to the epics document, but the project pressed ahead with implementation of other V2 features. The four originally flagged gaps remain unaddressed. The school timesheet sign-off gap (V2-TIM-02) is the most significant since the timesheet module is otherwise complete.

---

### Caveat 2: Update Architecture for File Upload

> "Update the architecture document with file upload handling patterns before starting the Compliance Document Management epic (Epic 3)."

**Status: RESOLVED (in code, not in documentation)**

Evidence:
- `src/lib/file-storage.ts` implements a clear file upload abstraction with:
  - MIME type validation (PDF, JPG, PNG)
  - 10MB file size limit
  - Per-teacher directory structure (`uploads/compliance/{teacherId}/`)
  - Timestamped filename sanitisation
  - Delete capability
  - URL generation helper
- `src/app/api/teacher/documents/route.ts` handles multipart form upload via `request.formData()`
- `src/app/api/agency/compliance/file/route.ts` serves files with path traversal protection
- `src/components/teacher/document-upload-form.tsx` exists for the UI

The architecture document (`architecture.md`) has **NOT** been updated to describe file upload patterns. The implementation is solid but the documentation gap remains.

**Verdict:** Functionally resolved. The architecture document should be updated to reflect the implemented patterns, but this does not block further work.

---

### Caveat 3: Extend UX Design System for Charts

> "Extend the UX design system with chart/data-visualization component specifications before starting the Analytics Dashboard epic (Epic 1)."

**Status: RESOLVED (in code, not in design documentation)**

Evidence from the built pages:
- `src/app/agency/analytics/page.tsx` — Analytics landing with summary cards
- `src/app/agency/analytics/fill-rate/page.tsx` — Fill rate chart
- `src/app/agency/analytics/response-time/page.tsx` — Response time metrics
- `src/app/agency/analytics/utilization/page.tsx` — Teacher utilization
- `src/app/agency/analytics/satisfaction/page.tsx` — School satisfaction
- `src/app/agency/analytics/margins/page.tsx` — Margin tracking

The chart implementations are built. Whether they follow a formally extended UX design system is unclear without reading the UX document, but the pages exist and are functional.

**Verdict:** Functionally resolved. A UX documentation update would be beneficial for consistency going forward.

---

## 2. PRD Requirements vs Built Code

### 2.1 MVP Functional Requirements (PRD Section 6)

| PRD Requirement | Built? | Evidence |
|---|---|---|
| **School Portal** | | |
| SCH-AUTH-01/02/03 | Yes | `/login`, `/forgot-password`, `/reset-password` pages |
| SCH-DASH-01/02/03 | Yes | `/school/dashboard` page |
| SCH-REQ-01/02/03/04/05 | Yes | `/school/requests/new` page |
| SCH-HIST-01/02 | Yes | `/school/requests` and `/school/history` pages |
| SCH-REV-01/02/03 | Yes | Review submission implemented (phase 08 commits) |
| **Teacher Portal** | | |
| TCH-AUTH-01/02/03 | Yes | Shared auth pages |
| TCH-DASH-01/02/03 | Yes | `/teacher/dashboard` page |
| TCH-JOB-01/02/03/04/05 | Yes | `/teacher/jobs` page |
| TCH-AVAIL-01/02/03 | Yes | `/teacher/availability` page |
| TCH-PROF-01/02/03 | Yes | `/teacher/profile` page |
| **Agency Portal** | | |
| AGN-AUTH-01/02/03 | Yes | Shared auth + `/agency/agents` page |
| AGN-DASH-01/02/03 | Yes | `/agency/dashboard` page |
| AGN-REQ-01/02/03/04/05/06/07 | Yes | `/agency/requests` + `[id]` detail page |
| AGN-BOOK-01/02/03 | Yes | `/agency/bookings` page |
| AGN-TCH-01/02/03/04/05/06/07/08 | Yes | `/agency/teachers` + `[id]` detail + edit + new pages |
| AGN-SCH-01/02/03/04/05 | Yes | `/agency/schools` + `[id]` detail + edit + new pages |
| AGN-AGT-01/02 | Yes | `/agency/agents` page |
| AGN-SET-01 | Yes | `/agency/settings` page |
| AGN-SMS-01 | Partial | SMS log viewer exists but SMS sending is not implemented |
| **Cross-Cutting** | | |
| ASN-01 through ASN-07 | Yes | `assignment-engine.ts` implements all requirements |
| AUTH-01 through AUTH-06 | Yes | Full auth system implemented |
| NOTIF-01 through NOTIF-05 | Yes | SSE + notification log + email notifications |

**MVP Verdict:** All MVP functional requirements are implemented. The only partial item is SMS sending (SMS log viewer exists but sending is V2).

### 2.2 V2 Requirements vs Built Code

| V2 Requirement | Status | Evidence |
|---|---|---|
| V2-ANA-01 (Agency analytics) | Built | 5 analytics sub-pages |
| V2-ANA-02 (School reporting) | Built | `/school/analytics` page |
| V2-ANA-03 (Teacher reporting) | Built | `/teacher/performance` page |
| V2-ANA-04 (Export CSV/PDF) | **Not built** | No export functionality |
| V2-TIM-01 (Timesheet submission) | Built | `/teacher/timesheets` + API |
| V2-TIM-02 (School sign-off) | **Not built** | No school timesheet page |
| V2-TIM-03 (Agency timesheet dashboard) | Built | `/agency/timesheets` page |
| V2-TIM-04 (Export for payroll) | Built | Invoice generation at `/agency/invoices` |
| V2-DOC-01 (Document upload) | Built | Teacher document upload + file storage |
| V2-DOC-02 (Automated alerts) | Built | `compliance-checks.ts` cron |
| V2-DOC-03 (Compliance dashboard) | Built | `/agency/compliance` + `/agency/compliance/documents` |
| V2-DOC-04 (Compliance history) | Partial | Verification audit trail exists (`verifiedAt`, `verifiedBy`), but no dedicated history view |
| V2-PUSH-01 (Web push) | **Not built** | No service worker or push subscription |
| V2-PUSH-02 (PWA manifest) | **Not built** | No manifest.json or service worker |
| V2-PUSH-03 (SMS notifications) | **Not built** | No SMS integration |
| V2-SCHED-01 (Multi-day bookings) | **Not built** | |
| V2-SCHED-02 (Recurring templates) | **Not built** | |
| V2-SCHED-03 (Calendar views) | **Not built** | |
| V2-MULTI-01/02/03 | **Not built** | No multi-tenancy |

**V2 Verdict:** Strong progress on Analytics (Epic 1), Timesheets (Epic 2), Compliance (Epic 3), and Enhanced Matching (Epic 5). PWA/Push (Epic 4), Enhanced Scheduling, and Multi-Agency (Epic 6) are untouched.

---

## 3. Architecture Alignment

### 3.1 Implemented Code vs Architecture Decisions

| Architecture Decision | Aligned? | Notes |
|---|---|---|
| ADR-001: Monolithic Next.js | Yes | All code in single Next.js app |
| ADR-002: SQLite for MVP | Yes | `better-sqlite3` + Drizzle ORM used throughout |
| ADR-003: SSE over WebSocket | Yes | `sseManager` used for all real-time events |
| ADR-004: Cookie sessions | Yes | HMAC-signed cookies via `auth.ts` |
| ADR-005: Sequential offer model | Yes | One pending offer per request at any time |
| ADR-006: ULID primary keys | Yes | `ulid()` used in all entity creation |
| ADR-007: No middleware.ts | Yes | Auth checks at route/component level |
| ADR-008: Upstash + in-memory fallback | Yes | Rate limiting with fallback |
| ADR-009: Resend email | Yes | Fire-and-forget email dispatch |
| ADR-010: OKLCh color space | Presumed | (Design system, not verified in this audit) |

### 3.2 New Patterns Not in Architecture Document

| Pattern | Description | Should Be Documented? |
|---|---|---|
| **File upload via FormData** | `request.formData()` with local filesystem storage in `uploads/compliance/` | Yes |
| **Compliance document lifecycle** | `pending_verification -> verified/rejected -> expired`, with archival | Yes |
| **Pay rate lookup strategy** | School-specific > default, by `effectiveFrom` date | Yes |
| **Invoice generation** | From approved timesheets with line items | Yes |
| **Dual compliance recalculation** | Two separate implementations in different files | Should be consolidated, then documented |
| **Teacher subjects junction table** | `teacherSubjects` with subject matching in ranking | Yes |
| **Configurable ranking weights** | `appConfig` JSON key `ranking_weights` | Partially covered (architecture mentions appConfig but not ranking weights) |
| **Activity log** | `logActivity()` calls throughout the codebase | Yes |

---

## 4. New Gaps Introduced During Implementation

### 4.1 Code Quality Gaps

| # | Gap | Severity | Description |
|---|---|---|---|
| **GAP-01** | Duplicate compliance recalculation logic | Medium | Two divergent implementations of `recalculateComplianceStatus` (see Edge Case Analysis EC-20). The `compliance-checks.ts` version distinguishes "expired" from "pending"; the route version only returns "compliant" or "pending". |
| **GAP-02** | No database transactions | High | Multi-step writes (booking creation, invoice generation, cancellation) are not wrapped in transactions. See Edge Case Analysis EC-45. |
| **GAP-03** | No timesheet resubmission after dispute | Medium | Story 2.2 specifies teachers should be able to resubmit disputed timesheets, but the API rejects any submission for a booking that already has a timesheet record, regardless of status. |
| **GAP-04** | Timesheet for future bookings allowed | Low | No date validation prevents submitting a timesheet before the booking date has passed. |

### 4.2 Feature Gaps

| # | Gap | Severity | Description |
|---|---|---|---|
| **GAP-05** | School timesheet sign-off | High | The entire timesheet workflow bypasses school verification. Teachers submit, agency approves — schools have no involvement. V2-TIM-02 is a critical piece of the trust chain. |
| **GAP-06** | Document archival on re-upload | Low | Story 3.1 specifies old documents should be archived when a replacement is uploaded. The current implementation creates a new record without archiving the old one. |
| **GAP-07** | Invoice PDF download | Medium | Story 2.4 specifies "Download PDF" capability. The invoice pages exist, but no PDF generation or download endpoint was found. |
| **GAP-08** | No compliance history view | Low | V2-DOC-04 calls for a compliance history log. The data model stores audit fields (`verifiedAt`, `verifiedBy`, `uploadedAt`) but no dedicated UI shows the history timeline. |

### 4.3 Documentation Gaps

| # | Gap | Description |
|---|---|---|
| **GAP-09** | Architecture document not updated for V2 features | File upload, pay rates, invoicing, compliance documents, and the teacher matching enhancements are all implemented but not reflected in the architecture document. |
| **GAP-10** | Epics & Stories not updated | Stories that have been implemented are not marked as complete. New features built outside the epics document (school analytics, teacher performance, ranking weight configuration UI) are not tracked. |
| **GAP-11** | New database tables not in architecture ER diagram | `timesheets`, `payRates`, `invoices`, `invoiceLineItems`, `complianceDocuments`, `teacherSubjects` are all missing from the architecture document's data model section. |

---

## 5. Non-Functional Requirements Coverage

### 5.1 Performance (PRD Section 7.1)

| NFR | Status | Assessment |
|---|---|---|
| PERF-01: TTI < 2s | Likely met | React Server Components with streaming. Not formally measured. |
| PERF-02: API < 500ms | At risk | Ranking algorithm does full-table scans (see EC-11, EC-12). For 500+ teachers, this could exceed 500ms under load. |
| PERF-03: SSE < 1s | Likely met | In-memory pub/sub is near-instant. |
| PERF-04: Ranking < 500ms for 500 teachers | At risk | Same as PERF-02. The O(n) scans multiply with re-ranking on decline. |
| PERF-05: Cron < 5s | Likely met | Expiry check is a simple query + per-offer processing. |

**Recommendation:** Add performance benchmarks for the ranking algorithm with realistic data volumes (200-500 teachers, 50-100 bookings per day).

### 5.2 Security (PRD Section 7.2)

| NFR | Status | Assessment |
|---|---|---|
| SEC-01: HTTPS | Deployment concern | Not enforced in code. Depends on reverse proxy / hosting. |
| SEC-02: bcrypt (cost >= 10) | Met | `bcryptjs` is used with default cost factor (10). |
| SEC-03: Cookie flags | Met | `httpOnly`, `secure`, `sameSite: lax` configured in auth.ts. |
| SEC-04: Rate limiting | Met | Upstash Redis + in-memory fallback. Four rules defined. |
| SEC-05: Zod validation | Met | All mutating endpoints use Zod schemas via `validateBody()`. |
| SEC-06: SQL injection prevention | Met | Drizzle ORM parameterised queries used throughout. |
| SEC-07: No sensitive data in responses | Met | Password hashes never returned in API responses. |
| SEC-08: Hashed reset tokens | Met | `password_reset_tokens` table stores hashed tokens. |
| SEC-09: Sentry monitoring | Met | Sentry SDK integrated. |

**New security concerns from V2 implementation:**
- File upload MIME type validation trusts client headers (EC-42)
- Uploaded filenames stored unsanitised (EC-38)
- No `X-Content-Type-Options: nosniff` on file serving (EC-41)
- Path traversal protection is present and adequate (EC-39)

### 5.3 Accessibility (PRD Section 7.3)

| NFR | Status | Assessment |
|---|---|---|
| A11Y-01: WCAG 2.1 AA target | Not measured | No automated accessibility testing found (Playwright tests exist but likely do not cover a11y). |
| A11Y-02: Semantic HTML, ARIA | Likely met | Radix UI primitives provide accessible semantics. Not audited page-by-page. |
| A11Y-03: Keyboard navigable | Likely met | Radix handles focus management. Custom components not verified. |
| A11Y-04: Contrast ratios | Likely met | OKLCh color system designed for contrast. Not formally tested. |
| A11Y-05: Form labels | Likely met | react-hook-form with Zod. Not verified for screen reader announcements. |

**Recommendation:** Add axe-core or similar automated a11y testing to the Playwright suite to verify WCAG compliance.

### 5.4 Scalability (PRD Section 7.4)

| NFR | Status | Assessment |
|---|---|---|
| SCALE-01: 200 teachers, 100 schools, 50 requests/day | Met | SQLite + in-memory SSE handle this scale. |
| SCALE-02: PostgreSQL migration path | Planned | Architecture documents the migration path. Not yet executed. |
| SCALE-03: Stateless API | Met | Session in cookie, no server-side session store. SSE is the only stateful component. |

**New scalability concern:** The invoice generation route loads ALL invoice line items into memory (EC-29) and uses `NOT IN` with a potentially large ID list. This will degrade as invoice volume grows.

---

## 6. Updated Risk Assessment

| Risk | Likelihood | Impact | Status |
|---|---|---|---|
| SQLite write contention with V2 write volume | Medium | High | **Increased.** Timesheets, invoices, compliance documents all add significant write load. |
| File storage on local filesystem | Medium | Medium | **Unchanged.** Storage abstraction exists in `file-storage.ts` but is tightly coupled to local FS. |
| V2 scope creep | Confirmed | Medium | The project has implemented features beyond the original stories (school analytics, teacher performance, margin tracking). Scope has expanded organically. |
| Data integrity from missing transactions | Medium | High | **New risk.** No database transactions anywhere. A crash during booking creation or invoice generation could leave inconsistent data. |
| Duplicate business logic | Medium | Medium | **New risk.** Two compliance recalculation functions with different behavior. As the codebase grows, divergent logic will cause subtle bugs. |

---

## 7. Readiness Verdict

### READY WITH REMAINING CAVEATS

The project has made substantial progress since the original readiness report. The MVP is fully implemented, and significant V2 functionality (Analytics, Timesheets, Compliance, Enhanced Matching) has been built and is functional. However, the following items require attention:

### Must-fix before production

1. **Add database transactions** to all multi-step write operations (booking creation, invoice generation, booking cancellation). This is a data integrity risk that could produce inconsistent state on server crash. (GAP-02)

2. **Consolidate `recalculateComplianceStatus`** into a single shared function. The current divergence means a teacher's compliance status could be calculated differently depending on which code path runs. (GAP-01)

3. **Fix the cron/acceptance race condition** by adding a `WHERE status = 'pending'` guard to the expiry UPDATE query. (Edge Case EC-05)

### Should-fix before broader rollout

4. **Add school timesheet sign-off** (V2-TIM-02). Without this, the timesheet workflow lacks school verification, which is a trust gap for invoicing.

5. **Enable timesheet resubmission** after dispute. The current implementation blocks resubmission for any booking that already has a timesheet. (GAP-03)

6. **Update the architecture document** to reflect all V2 tables, file upload patterns, and new API routes. (GAP-09, GAP-11)

7. **Add file upload security hardening**: magic-byte validation, filename sanitisation, `X-Content-Type-Options: nosniff`. (EC-38, EC-41, EC-42)

### Deferred (acceptable for initial V2 launch)

8. Invoice PDF download capability (GAP-07)
9. Analytics CSV/PDF export (V2-ANA-04)
10. PWA, push notifications, SMS integration (Epic 4)
11. Multi-day bookings, recurring templates, calendar views (V2-SCHED)
12. Multi-agency support (Epic 6)
13. Performance optimisation of the ranking algorithm for 500+ teacher scale (EC-11, EC-12)

---

## Appendix: Built Pages Inventory

```
src/app/page.tsx                                    # Landing / redirect
src/app/login/page.tsx                              # Unified login
src/app/forgot-password/page.tsx                    # Password reset request
src/app/reset-password/page.tsx                     # Password reset form
src/app/privacy/page.tsx                            # Privacy policy

# School Portal (5 pages)
src/app/school/dashboard/page.tsx
src/app/school/requests/page.tsx
src/app/school/requests/new/page.tsx
src/app/school/history/page.tsx
src/app/school/analytics/page.tsx                   # V2 - school reporting

# Teacher Portal (5 pages)
src/app/teacher/dashboard/page.tsx
src/app/teacher/jobs/page.tsx
src/app/teacher/availability/page.tsx
src/app/teacher/profile/page.tsx
src/app/teacher/timesheets/page.tsx                 # V2 - timesheet submission
src/app/teacher/performance/page.tsx                # V2 - performance metrics

# Agency Portal (22 pages)
src/app/agency/dashboard/page.tsx
src/app/agency/requests/page.tsx
src/app/agency/requests/[id]/page.tsx
src/app/agency/bookings/page.tsx
src/app/agency/teachers/page.tsx
src/app/agency/teachers/new/page.tsx
src/app/agency/teachers/[id]/page.tsx
src/app/agency/teachers/[id]/edit/page.tsx
src/app/agency/schools/page.tsx
src/app/agency/schools/new/page.tsx
src/app/agency/schools/[id]/page.tsx
src/app/agency/schools/[id]/edit/page.tsx
src/app/agency/agents/page.tsx
src/app/agency/settings/page.tsx
src/app/agency/settings/pay-rates/page.tsx          # V2 - pay rate management
src/app/agency/settings/ranking/page.tsx            # V2 - ranking weight config
src/app/agency/timesheets/page.tsx                  # V2 - timesheet dashboard
src/app/agency/invoices/page.tsx                    # V2 - invoice list
src/app/agency/invoices/[id]/page.tsx               # V2 - invoice detail
src/app/agency/compliance/page.tsx                  # V2 - compliance dashboard
src/app/agency/compliance/documents/page.tsx        # V2 - document verification queue
src/app/agency/analytics/page.tsx                   # V2 - analytics landing
src/app/agency/analytics/fill-rate/page.tsx         # V2 - fill rate chart
src/app/agency/analytics/response-time/page.tsx     # V2 - response time metrics
src/app/agency/analytics/utilization/page.tsx       # V2 - teacher utilization
src/app/agency/analytics/satisfaction/page.tsx      # V2 - school satisfaction
src/app/agency/analytics/margins/page.tsx           # V2 - margin tracking
src/app/agency/activity/page.tsx                    # Activity feed

Total: 44 pages (17 MVP + 27 V2/additional)
```
