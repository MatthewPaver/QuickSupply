# QuickSupply V2 Sprint Plan

**Created:** 2026-03-27
**Methodology:** BMAD (AI-assisted agile)
**Baseline:** MVP complete (auth, school/teacher/agency portals, assignment engine, SSE notifications, reviews)

---

## 1. Sprint Overview

| Parameter | Value |
|---|---|
| **Sprint cadence** | 2-week sprints |
| **Team** | Solo developer + AI-assisted development (BMAD method) |
| **Total V2 scope** | 6 epics, 24 stories |
| **Planned sprints** | 6 sprints (12 weeks) |
| **Deferred to V3** | Epic 6 (Multi-Agency Support) — 4 stories |
| **V2 delivery stories** | 20 stories across 5 epics |

### Sprint Sequence Rationale

| Sprint | Epic | Rationale |
|---|---|---|
| 1 | Analytics Dashboard | Highest business value, zero schema dependencies — reads existing data |
| 2 | Compliance Documents | Regulatory requirement, independent of other V2 features |
| 3 | Timesheets Part 1 | New schema tables needed before financial features |
| 4 | Timesheets Part 2 + Financial | Depends on Sprint 3 schema and workflows |
| 5 | Push Notifications & PWA | Independent infrastructure work, no data dependencies |
| 6 | Enhanced Teacher Matching | Benefits from analytics data (Sprint 1) and timesheets (Sprint 3-4) for historical performance |

---

## 2. Sprint 1: Analytics Foundation

**Dates:** Weeks 1–2
**Epic:** Epic 1 — Agency Analytics Dashboard
**Goal:** Deliver a complete analytics section for agency managers with actionable charts, tables, and data export.

### Stories

| ID | Story | Size | Priority |
|---|---|---|---|
| 1.5 | Analytics Dashboard Landing Page | M | P1 |
| 1.1 | Fill Rate Report | L | P1 |
| 1.2 | Response Time Metrics | M | P2 |
| 1.3 | Teacher Utilization Report | M | P2 |
| 1.4 | School Satisfaction Scores | S | P2 |

### Entry Criteria

- MVP is deployed and stable with production data flowing (cover requests, bookings, reviews)
- No blocking bugs in the agency portal
- Recharts (or chosen chart library) evaluated and selected

### Key Technical Decisions

1. **Chart library selection** — Recharts is suggested in Story 1.1 tech notes. Confirm it meets all charting needs (bar, line, histogram, table) before starting.
2. **API design pattern** — Establish a consistent pattern for analytics endpoints (`/api/agency/analytics/*`) including date-range filtering, aggregation intervals, and response shape.
3. **Caching strategy** — Decide whether analytics queries run live against SQLite or use materialized/cached aggregations. For MVP data volumes, live queries are likely sufficient.
4. **Navigation update** — Add "Analytics" link to the agency sidebar; decide on icon and placement.

### Definition of Done

- [ ] `/agency/analytics` route renders a dashboard with four summary metric cards
- [ ] Each card links to its detailed report page
- [ ] Fill rate chart displays with daily/weekly/monthly toggles and date range filter
- [ ] Response time page shows mean/median and distribution histogram
- [ ] Teacher utilization table shows available days, booked days, and utilization percentage with sorting
- [ ] School satisfaction table shows average rating, review count, and would-rebook percentage
- [ ] All pages show skeleton loading states during data fetch
- [ ] Clickable teacher/school names navigate to their detail pages
- [ ] All new API endpoints have Zod input validation
- [ ] No regressions in existing agency portal functionality
- [ ] Code review passed via `bmad-code-review`

---

## 3. Sprint 2: Compliance Document Management

**Dates:** Weeks 3–4
**Epic:** Epic 3 — Compliance Document Management
**Goal:** Enable structured document upload, verification, and automated expiry tracking for teacher compliance records (DBS, right-to-work, qualifications).

### Stories

| ID | Story | Size | Priority |
|---|---|---|---|
| 3.1 | DBS Certificate Upload | L | P1 |
| 3.3 | Document Verification Workflow | M | P1 |
| 3.2 | Automated Expiry Alerts | M | P1 |
| 3.4 | Compliance Dashboard | M | P1 |

### Entry Criteria

- Sprint 1 complete (no hard dependency, but avoids parallel schema changes)
- File storage approach decided (local filesystem with abstraction layer for future S3 migration)
- Upload size limits and accepted file types confirmed (10MB; PDF, JPG, PNG per tech notes)

### Key Technical Decisions

1. **File storage abstraction** — Create a storage service interface (`uploadFile`, `getFileUrl`, `deleteFile`) with a local filesystem implementation under `/uploads/compliance/`. This enables future migration to S3/R2 without changing calling code.
2. **New schema: `complianceDocuments` table** — Drizzle migration with columns: `id`, `teacherId`, `documentType` (enum: dbs, right_to_work, qualification, reference), `fileName`, `filePath`, `status` (enum: pending_verification, verified, rejected, expired), `expiryDate`, `uploadedAt`, `verifiedAt`, `verifiedBy`.
3. **Cron extension** — Extend the existing `/api/cron` endpoint to run daily expiry checks against `complianceDocuments.expiryDate`, updating teacher `complianceStatus` and sending notifications at 30-day and 7-day thresholds.
4. **Teacher compliance recalculation** — Define the business rule: a teacher is `compliant` only when all required document types are verified and not expired. Decide which document types are required vs optional.
5. **Document versioning** — When a teacher uploads a replacement, the old document should be archived (soft-delete or status change), not physically deleted.

### Definition of Done

- [ ] Teachers can upload PDF/JPG/PNG documents (max 10MB) via their profile Documents section
- [ ] Uploaded documents display file name, upload date, and verification status
- [ ] Replacement uploads archive the previous version
- [ ] Agency staff see a verification queue at `/agency/compliance/documents` with pending documents
- [ ] Agency staff can verify (with optional expiry date) or reject (with reason) documents
- [ ] Verification/rejection records the acting agent and timestamp for audit trail
- [ ] Teacher `complianceStatus` recalculates automatically after verification actions
- [ ] Automated alerts fire at 30 days (agency) and 7 days (teacher) before document expiry
- [ ] Expired documents auto-update status and exclude teacher from new offers
- [ ] Compliance dashboard at `/agency/compliance` shows compliant/pending/expired counts with filterable teacher list
- [ ] "Compliance" link added to agency sidebar
- [ ] Drizzle migration generated and applied cleanly
- [ ] Code review passed via `bmad-code-review`

---

## 4. Sprint 3: Timesheet Module — Part 1

**Dates:** Weeks 5–6
**Epic:** Epic 2 — Timesheet & Financial Module (stories 2.1, 2.2)
**Goal:** Deliver the core timesheet workflow: teacher submission of hours and agency approval/dispute cycle.

### Stories

| ID | Story | Size | Priority |
|---|---|---|---|
| 2.1 | Timesheet Submission (Teacher) | L | P1 |
| 2.2 | Timesheet Approval (Agency) | M | P1 |

### Entry Criteria

- Sprints 1–2 complete
- Schema design for `timesheets` table finalized and reviewed
- Notification type `timesheet` added to the enum in `notificationLog`
- Existing booking data available for testing timesheet submission against past bookings

### Key Technical Decisions

1. **New schema: `timesheets` table** — Drizzle migration: `id`, `bookingId` (FK), `teacherId` (FK), `arrivalTime`, `departureTime`, `breakMinutes`, `totalHours` (computed), `status` (submitted/approved/disputed/paid), `submittedAt`, `approvedAt`, `disputeReason`, `notes`.
2. **Hours calculation** — `totalHours = (departureTime - arrivalTime - breakMinutes) / 60`. Validate that departure > arrival and breakMinutes >= 0.
3. **Dispute/resubmit flow** — When an agency disputes a timesheet, the teacher can edit and resubmit. The resubmission resets status to `submitted` and clears the dispute reason. Preserve an audit trail (consider whether to track revision history in V2 or defer to V3).
4. **Notification integration** — Add `timesheet` to the notification type enum. Notify teacher on approval/dispute. Notify agency on submission.
5. **SSE events** — Emit timesheet-related events to agency and teacher channels.

### Definition of Done

- [ ] Teachers see "Submit Timesheet" button next to past bookings without a timesheet on their jobs page
- [ ] Timesheet form captures arrival time, departure time, break duration; auto-calculates billable hours
- [ ] Submitted timesheets show details and status instead of the submit button
- [ ] Agency staff see submitted timesheets at `/agency/timesheets` sorted by date
- [ ] Agency staff can approve timesheets (status -> `approved`, teacher notified)
- [ ] Agency staff can dispute timesheets with a reason (status -> `disputed`, teacher notified with reason)
- [ ] Teachers can edit and resubmit disputed timesheets (reappears in agency queue)
- [ ] All API endpoints validated with Zod schemas
- [ ] `timesheets` table migration applied cleanly
- [ ] SSE events emitted for timesheet status changes
- [ ] Code review passed via `bmad-code-review`

---

## 5. Sprint 4: Timesheet Module — Part 2 + Financial

**Dates:** Weeks 7–8
**Epic:** Epic 2 — Timesheet & Financial Module (stories 2.3, 2.4, 2.5)
**Goal:** Add pay rate configuration, invoice generation from approved timesheets, and margin tracking for agency profitability analysis.

### Stories

| ID | Story | Size | Priority |
|---|---|---|---|
| 2.3 | Pay Rate Management | M | P1 |
| 2.4 | Invoice Generation | XL | P2 |
| 2.5 | Margin Tracking | L | P3 |

### Entry Criteria

- Sprint 3 complete — `timesheets` table exists with functional submission/approval workflow
- Approved timesheets exist in the system for testing invoice generation
- PDF generation library evaluated and selected (e.g., `@react-pdf/renderer` or `pdfmake`)

### Key Technical Decisions

1. **New schema: `payRates` table** — `id`, `roleType` (teacher/ta), `schoolId` (nullable for defaults), `hourlyRate` (integer in pence to avoid floating-point), `effectiveFrom` (date), `createdAt`. Lookup rule: most recent `effectiveFrom <= booking.date` with school-specific override taking precedence over default.
2. **Charge rates** — Decide between extending `payRates` with a `chargeRate` column vs a separate `chargeRates` table. A single table with both `payRate` and `chargeRate` columns is simpler and recommended.
3. **New schema: `invoices` + `invoiceLineItems` tables** — `invoices`: `id`, `schoolId`, `periodStart`, `periodEnd`, `totalAmount`, `status` (draft/sent/paid), `createdAt`. `invoiceLineItems`: `id`, `invoiceId`, `timesheetId`, `description`, `hours`, `rate`, `amount`.
4. **PDF generation** — Server-side PDF rendering. Evaluate `@react-pdf/renderer` for React-based templates vs `pdfmake` for JSON-defined layouts. Consider bundle size impact.
5. **Currency handling** — Store all monetary values as integers in pence (GBP) to avoid floating-point precision issues. Format for display only at the presentation layer.
6. **Invoice idempotency** — Prevent duplicate invoicing: a timesheet should only appear on one invoice. Add `invoiceId` FK to `timesheets` table or track via `invoiceLineItems` join.

### Definition of Done

- [ ] Agency settings page includes "Pay Rates" section with default rates for teacher and TA roles
- [ ] School-specific rate overrides can be configured and take precedence over defaults
- [ ] Rate lookup uses the most recent effective rate for the booking date
- [ ] Invoice generation selects a school + date range and creates an invoice from approved timesheets
- [ ] Generated invoices display line items (date, teacher, hours, rate, line total) and grand total
- [ ] PDF download produces a formatted invoice document
- [ ] Invoice status workflow: draft -> sent -> paid
- [ ] Margin report shows per-timesheet and aggregate margins (charge rate - pay rate) x hours
- [ ] Per-school margin breakdown available
- [ ] All monetary values stored as integers (pence) and displayed formatted (£X.XX)
- [ ] Drizzle migrations for `payRates`, `invoices`, `invoiceLineItems` applied cleanly
- [ ] Code review passed via `bmad-code-review`

---

## 6. Sprint 5: Push Notifications & PWA

**Dates:** Weeks 9–10
**Epic:** Epic 4 — Push Notifications & PWA
**Goal:** Transform QuickSupply into an installable PWA with push notifications for time-sensitive events and basic offline support.

### Stories

| ID | Story | Size | Priority |
|---|---|---|---|
| 4.1 | Service Worker Registration | M | P2 |
| 4.2 | Push Notification Opt-In | L | P1 |
| 4.5 | Notification Preferences | M | P2 |
| 4.4 | Install Prompt (Add to Home Screen) | S | P3 |
| 4.3 | Offline Support | L | P3 |

### Entry Criteria

- Sprints 1–4 complete (no hard dependency, but PWA should wrap the full feature set)
- VAPID key pair generated and stored in environment variables
- `web-push` npm package evaluated
- Target browser matrix confirmed for service worker and push API support

### Key Technical Decisions

1. **Service worker strategy** — Decide between `next-pwa` plugin or a custom `public/sw.js`. Given Next.js 16 App Router, a custom service worker may offer more control. Use Workbox for caching strategies.
2. **Cache strategy** — Network-first for API calls (ensures fresh data), cache-first for static assets (JS, CSS, images). Define explicit cache names and versioning for cache busting on deployments.
3. **New schema: `pushSubscriptions` table** — `id`, `userId`, `userRole`, `endpoint`, `p256dhKey`, `authKey`, `createdAt`. Composite unique index on `(userId, userRole, endpoint)`.
4. **New schema: `notificationPreferences` table** — `id`, `userId`, `userRole`, `category` (offers, booking_confirmations, cancellations, reminders, timesheets), `pushEnabled`, `inAppEnabled`. Default all to enabled.
5. **Push integration** — Hook into the existing notification creation flow. Before sending, check `notificationPreferences`. If push is enabled for the category, look up `pushSubscriptions` and send via `web-push`.
6. **Offline scope** — Read-only offline experience for V2. Cache teacher dashboard and bookings. Show "You are offline" banner. Block write actions with a clear message.
7. **PWA manifest** — `public/manifest.json` with app name ("QuickSupply"), icons in multiple sizes, `display: standalone`, theme color matching Desian Education brand purple.

### Definition of Done

- [ ] Service worker registers on all supported browsers and caches static assets
- [ ] Service worker updates prompt users to refresh for the latest version
- [ ] Push notification opt-in toggle appears in profile settings for all user roles
- [ ] Granting browser push permission saves subscription to server
- [ ] New offers trigger push notifications to opted-in teachers
- [ ] Revoking opt-in removes the subscription
- [ ] Notification preferences page shows toggles per category (offers, confirmations, cancellations, reminders, timesheets)
- [ ] Disabled categories suppress both push and in-app notifications
- [ ] `manifest.json` present with correct metadata and icons
- [ ] Custom install banner appears after 3+ visits, respects 30-day dismissal
- [ ] Previously loaded teacher dashboard renders offline with cached data and "offline" banner
- [ ] Write actions show a connectivity-required message when offline
- [ ] Online/offline transitions handled gracefully (banner appears/disappears, data refreshes)
- [ ] Code review passed via `bmad-code-review`

---

## 7. Sprint 6: Enhanced Teacher Matching

**Dates:** Weeks 11–12
**Epic:** Epic 5 — Enhanced Teacher Matching
**Goal:** Improve the assignment engine's ranking algorithm with subject specialization, school preference learning, configurable weights, and historical performance data.

### Stories

| ID | Story | Size | Priority |
|---|---|---|---|
| 5.1 | Subject Specialization Tracking | M | P1 |
| 5.2 | School Preference Learning | M | P2 |
| 5.3 | AI-Assisted Ranking (Composite Scoring) | L | P2 |
| 5.4 | Historical Performance Weighting | L | P3 |

### Entry Criteria

- Sprints 1–4 complete (analytics data and timesheets provide inputs for performance metrics)
- Current assignment engine ranking logic reviewed and understood
- Predefined subject list confirmed with the agency
- Existing `schoolTeacherReviews` data available for preference learning

### Key Technical Decisions

1. **New schema: `teacherSubjects` junction table** — `teacherId` (FK), `subject` (text), composite primary key. Predefined subject list: English, Mathematics, Science, History, Geography, MFL, Art, Music, PE, Computing, RE, PSHE, DT, Drama, Early Years.
2. **Ranking algorithm refactor** — Refactor `src/lib/assignment-engine.ts` scoring into a modular function with named factor contributions. Each factor should be independently testable.
3. **Configurable weights** — Store ranking weights in `appConfig` table as JSON (key: `ranking_weights`). Default weights: `{ distance: 0.25, rating: 0.20, subjectMatch: 0.15, schoolAffinity: 0.15, compliance: 0.10, acceptance: 0.10, punctuality: 0.05 }`. Agency can adjust via settings UI.
4. **School affinity calculation** — Derive from `schoolTeacherReviews`: `affinityScore = (avgRating / 5) * 0.7 + (wouldRebookRate) * 0.3`. No new tables needed.
5. **Performance metrics** — Compute from existing tables: acceptance rate from `assignmentOffers`, cancellation rate from `bookings`, punctuality from `timesheets` (arrival vs booking start time). Cache expensive calculations or compute with bounded date ranges (last 90 days).
6. **Backward compatibility** — The refactored ranking must produce equivalent results to the current algorithm when new factors have no data (e.g., no subject specializations recorded, no timesheets yet). Add feature flags if needed.

### Definition of Done

- [ ] Teacher profile edit page includes multi-select for subject specializations from the predefined list
- [ ] Teacher detail page displays listed specializations
- [ ] Cover requests with a specified subject rank teachers with matching specializations higher
- [ ] School-teacher affinity scores are computed from review history and visible on teacher detail page
- [ ] Positive review history (4+ stars, would-rebook) boosts ranking for that school's requests
- [ ] Negative review history (1-2 stars, would-not-rebook) applies a ranking penalty
- [ ] Agency settings page shows ranking weight configuration with sliders or numeric inputs
- [ ] Weight changes apply to subsequent assignment engine runs
- [ ] Composite scoring function combines all factors: distance, rating, subject match, school affinity, compliance, acceptance rate, cancellation rate, punctuality
- [ ] Teacher detail page shows performance metrics (acceptance rate, cancellation rate, avg punctuality)
- [ ] Ranking results are equivalent to current algorithm when new data factors are absent
- [ ] `teacherSubjects` migration applied cleanly
- [ ] Assignment engine has unit tests covering the new scoring factors
- [ ] Code review passed via `bmad-code-review`

---

## 8. Backlog — Epic 6: Multi-Agency Support (Deferred to V3)

### Stories Deferred

| ID | Story | Size | Priority |
|---|---|---|---|
| 6.1 | Agency Isolation (Multi-Tenancy) | XL | P1 |
| 6.2 | Agency Onboarding Flow | L | P2 |
| 6.3 | Cross-Agency Teacher Sharing | XL | P3 |
| 6.4 | Agency Branding | M | P3 |

### Reason for Deferral

Multi-agency support is a **foundational architectural change**, not an incremental feature. Story 6.1 alone requires:

- Adding `agencyId` foreign key to every major table (schools, teachers, agents, coverRequests, bookings, timesheets, payRates, invoices)
- Updating **every existing query** with `WHERE agencyId = ?` filtering
- Middleware or data-access-layer changes to inject `agencyId` from session context
- A data migration to assign all existing records to a default agency
- Comprehensive regression testing across all portals

This scope is better handled as a dedicated V3 initiative where it can receive focused attention and thorough testing, rather than being squeezed into the V2 sprint cycle alongside feature development.

### Prerequisites for V3

1. **V2 complete and stable** — All V2 features must be working in production before introducing multi-tenancy
2. **PostgreSQL migration** — Multi-agency data volumes likely exceed SQLite's practical limits; the planned PostgreSQL migration (see Architecture ADR-002) should happen before or alongside V3
3. **Test coverage** — Comprehensive E2E tests (Playwright) covering all portals to catch regressions from the `agencyId` scoping changes
4. **Revenue model** — Business decision on pricing per agency, resource limits, and whether cross-agency sharing (Story 6.3) is a V3 or V4 feature

---

## 9. Sprint Ceremonies

Each sprint follows the BMAD workflow with four key ceremonies.

### 9.1 Story Creation — `bmad-create-story`

**When:** Sprint planning (day 1 of each sprint)
**Process:**
1. Select stories from this sprint plan by ID
2. Run `bmad-create-story` for each story, providing the epic context and acceptance criteria from the epics-and-stories document
3. Output: detailed story file in `_bmad-output/implementation-artifacts/stories/` with technical breakdown, subtasks, and test criteria
4. Review generated stories for completeness before development begins

### 9.2 Development — `bmad-dev-story`

**When:** Throughout the sprint (days 1–12)
**Process:**
1. Pick the next story from the sprint backlog (prioritized order)
2. Run `bmad-dev-story` with the story file as input
3. AI assists with implementation: schema changes, API endpoints, UI components, tests
4. Developer reviews AI output, makes adjustments, and commits
5. Each story is developed on a feature branch and merged via PR

### 9.3 Code Review — `bmad-code-review`

**When:** Before merging each story's PR
**Process:**
1. Run `bmad-code-review` against the feature branch diff
2. AI reviews for: correctness, security, performance, accessibility, consistency with existing patterns
3. Address any findings before merge
4. Merge to main after review passes

### 9.4 Retrospective — `bmad-retrospective`

**When:** End of each sprint (day 14)
**Process:**
1. Run `bmad-retrospective` with the sprint's completed stories and any issues encountered
2. Review: what went well, what could improve, velocity assessment
3. Adjust subsequent sprint plans based on findings
4. Document any technical debt incurred and add to backlog if needed

### Sprint Rhythm

| Day | Activity |
|---|---|
| 1 | Sprint planning: create stories via `bmad-create-story`, prioritize |
| 2–5 | Development block 1: implement stories via `bmad-dev-story` |
| 5 | Mid-sprint check: assess progress, adjust scope if needed |
| 6–11 | Development block 2: continue implementation, code reviews |
| 12 | Final code reviews, bug fixes, polish |
| 13 | Integration testing, regression checks |
| 14 | Sprint retrospective via `bmad-retrospective`, plan handoff |

---

## 10. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| **Sprint 4 (Invoice/PDF) runs long** | XL story + 2 others may exceed capacity | Descope margin tracking (2.5) to Sprint 5 or backlog if needed |
| **File upload complexity (Sprint 2)** | Local storage abstraction adds overhead | Start with simplest implementation; abstract later |
| **Assignment engine refactor (Sprint 6)** | Ranking changes could regress fill rates | Add comprehensive unit tests; keep current algorithm as fallback |
| **PWA browser compatibility (Sprint 5)** | Service worker support varies | Define minimum browser matrix; graceful degradation for unsupported browsers |
| **Schema migration conflicts** | Multiple sprints add tables | Run migrations sequentially; never skip a migration |
| **Solo developer burnout** | 12 weeks of sustained development | Use AI-assisted development to reduce cognitive load; keep scope realistic |

---

*This sprint plan is a living document. Adjust sprint contents based on retrospective findings and changing business priorities.*
