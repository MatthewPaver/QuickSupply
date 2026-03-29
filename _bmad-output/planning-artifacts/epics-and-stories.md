# QuickSupply V2 Roadmap — Epics & Stories

> Generated: 2026-03-27
> Baseline: MVP (auth, school/teacher/agency portals, assignment engine, SSE notifications, reviews)

---

## Epic 1: Agency Analytics Dashboard

Provide agency staff with actionable reporting and data visualization to track operational performance and identify improvement areas.

### Story 1.1: Fill Rate Report

**As an** agency manager, **I want to** see the percentage of cover requests that were successfully filled over a configurable date range, **so that** I can measure operational effectiveness and spot declining trends.

**Acceptance Criteria:**
- [ ] Given the agency dashboard, when I navigate to Analytics, then I see a fill-rate chart with daily/weekly/monthly toggles
- [ ] Given a date range filter, when I apply it, then the chart and summary statistics update to reflect only that period
- [ ] Given the fill rate data, when I view the summary, then I see total requests, filled count, unfilled count, and fill-rate percentage
- [ ] Given the chart, when I hover over a data point, then I see the exact count and percentage for that period

**Technical Notes:**
- Aggregate from `coverRequests` table; status = `filled` vs total minus `cancelled`
- Use a lightweight chart library (e.g., Recharts) rendered client-side
- Add `/api/agency/analytics/fill-rate` endpoint returning pre-aggregated JSON

**Priority:** P1
**Estimate:** L

---

### Story 1.2: Response Time Metrics

**As an** agency manager, **I want to** see average teacher response times to offers, **so that** I can evaluate whether offer windows are appropriately configured and identify slow-responding teachers.

**Acceptance Criteria:**
- [ ] Given the analytics page, when I view response time metrics, then I see the median and mean time from `offeredAt` to `responseAt` across all offers
- [ ] Given the metrics, when I filter by date range, then the values recalculate for offers within that period
- [ ] Given the metrics, when I view the breakdown, then I see a distribution histogram (e.g., <5 min, 5-15 min, 15-30 min, >30 min)
- [ ] Given the page, when I click a teacher name in the breakdown table, then I navigate to that teacher's detail page

**Technical Notes:**
- Derive from `assignmentOffers` where `status` in (`accepted`, `declined`) and `responseAt` is non-null
- Exclude `expired` offers from response-time averages (they hit the window limit, not a human response)

**Priority:** P2
**Estimate:** M

---

### Story 1.3: Teacher Utilization Report

**As an** agency manager, **I want to** see how frequently each teacher is booked relative to their declared availability, **so that** I can identify underutilized teachers and balance workload.

**Acceptance Criteria:**
- [ ] Given the analytics page, when I view teacher utilization, then I see a table with each teacher's available days, booked days, and utilization percentage for the selected period
- [ ] Given the table, when I sort by utilization, then I can quickly find underutilized or overbooked teachers
- [ ] Given a teacher row, when I click it, then I navigate to that teacher's detail page showing their booking history

**Technical Notes:**
- Join `teacherAvailability` (available days) against `bookings` (booked days) per teacher
- Consider only non-cancelled bookings
- Cache or materialize for performance if dataset grows

**Priority:** P2
**Estimate:** M

---

### Story 1.4: School Satisfaction Scores

**As an** agency manager, **I want to** see aggregated satisfaction scores per school based on their teacher reviews, **so that** I can identify which schools are consistently happy or unhappy with the service.

**Acceptance Criteria:**
- [ ] Given the analytics page, when I view school satisfaction, then I see each school's average rating, total reviews, and would-rebook percentage
- [ ] Given the table, when I sort by average rating ascending, then I can prioritize outreach to dissatisfied schools
- [ ] Given a school row, when I click it, then I navigate to the school detail page

**Technical Notes:**
- Aggregate from `schoolTeacherReviews` grouped by `schoolId`
- `wouldRebook` percentage = count(wouldRebook=true) / total reviews per school

**Priority:** P2
**Estimate:** S

---

### Story 1.5: Analytics Dashboard Landing Page

**As an** agency manager, **I want to** see a single dashboard page with key metric cards (fill rate, avg response time, active teachers, pending requests), **so that** I get an at-a-glance overview without navigating to individual reports.

**Acceptance Criteria:**
- [ ] Given I navigate to `/agency/analytics`, then I see summary cards for: today's fill rate, 7-day avg response time, active teacher count, and open pending requests
- [ ] Given the dashboard, when I click any card, then I navigate to the corresponding detailed report
- [ ] Given the dashboard, when data is loading, then I see skeleton placeholders instead of a blank page

**Technical Notes:**
- New route: `src/app/agency/analytics/page.tsx`
- Each card calls its own API endpoint; use React Suspense for parallel loading
- Add link to agency sidebar navigation

**Priority:** P1
**Estimate:** M

---

## Epic 2: Timesheet & Financial Module

Enable end-to-end timesheet workflow from teacher submission through agency approval, with pay rate management and invoice generation.

### Story 2.1: Timesheet Submission (Teacher)

**As a** teacher, **I want to** submit a timesheet for each completed booking recording my actual hours, **so that** I can be paid accurately.

**Acceptance Criteria:**
- [ ] Given a past booking that has no timesheet, when I navigate to my jobs page, then I see a "Submit Timesheet" button next to that booking
- [ ] Given the timesheet form, when I enter arrival time, departure time, and break duration, then the system calculates total billable hours
- [ ] Given valid data, when I submit, then the timesheet is saved with status `submitted` and I see a confirmation
- [ ] Given an already-submitted timesheet, when I view the booking, then I see the timesheet details and status instead of the submit button

**Technical Notes:**
- New `timesheets` table: `id`, `bookingId`, `teacherId`, `arrivalTime`, `departureTime`, `breakMinutes`, `totalHours`, `status` (submitted/approved/disputed/paid), `submittedAt`, `approvedAt`, `notes`
- Drizzle migration required
- API: `POST /api/teacher/timesheets`

**Priority:** P1
**Estimate:** L

---

### Story 2.2: Timesheet Approval (Agency)

**As an** agency staff member, **I want to** review and approve or dispute submitted timesheets, **so that** only verified hours proceed to invoicing.

**Acceptance Criteria:**
- [ ] Given pending timesheets exist, when I navigate to `/agency/timesheets`, then I see a list of timesheets with status `submitted`, sorted by date
- [ ] Given a submitted timesheet, when I click "Approve", then the status changes to `approved` and the teacher is notified
- [ ] Given a submitted timesheet, when I click "Dispute" and enter a reason, then the status changes to `disputed` and the teacher is notified with the dispute reason
- [ ] Given a disputed timesheet, when the teacher resubmits, then it reappears in my queue as `submitted`

**Technical Notes:**
- API: `PATCH /api/agency/timesheets/[id]` with action `approve` or `dispute`
- Notification via existing `notificationLog` + SSE system
- Add a new notification type `timesheet` to the enum

**Priority:** P1
**Estimate:** M

---

### Story 2.3: Pay Rate Management

**As an** agency manager, **I want to** configure hourly pay rates per role type (teacher vs TA) and school, **so that** timesheets are costed correctly.

**Acceptance Criteria:**
- [ ] Given the agency settings page, when I navigate to "Pay Rates", then I see default rates for teacher and TA roles
- [ ] Given the pay rates page, when I set a school-specific override, then that rate applies to timesheets for bookings at that school
- [ ] Given a timesheet is approved, when the system calculates cost, then it uses the school-specific rate if one exists, otherwise the default rate
- [ ] Given I update a rate, when future timesheets are calculated, then they use the new rate (existing approved timesheets are unaffected)

**Technical Notes:**
- New `payRates` table: `id`, `roleType` (teacher/ta), `schoolId` (nullable for defaults), `hourlyRate`, `effectiveFrom`, `createdAt`
- Use the most recent `effectiveFrom <= booking.date` rate

**Priority:** P1
**Estimate:** M

---

### Story 2.4: Invoice Generation

**As an** agency manager, **I want to** generate invoices for schools based on approved timesheets within a billing period, **so that** I can bill schools accurately.

**Acceptance Criteria:**
- [ ] Given I select a school and date range, when I click "Generate Invoice", then the system creates an invoice summing all approved timesheets for that school in that period
- [ ] Given a generated invoice, when I view it, then I see line items per booking (date, teacher name, hours, rate, line total) and a grand total
- [ ] Given a generated invoice, when I click "Download PDF", then a formatted PDF is downloaded
- [ ] Given a generated invoice, when I mark it as "Sent", then its status updates and it no longer appears in the "To Send" queue

**Technical Notes:**
- New `invoices` table: `id`, `schoolId`, `periodStart`, `periodEnd`, `totalAmount`, `status` (draft/sent/paid), `createdAt`
- New `invoiceLineItems` table: `id`, `invoiceId`, `timesheetId`, `description`, `hours`, `rate`, `amount`
- PDF generation: use a server-side library (e.g., `@react-pdf/renderer` or `pdfmake`)

**Priority:** P2
**Estimate:** XL

---

### Story 2.5: Margin Tracking

**As an** agency manager, **I want to** see the margin (charge rate minus pay rate) per booking and in aggregate, **so that** I can monitor profitability.

**Acceptance Criteria:**
- [ ] Given a charge rate is configured per school, when I view a timesheet, then I see both the pay cost and charge amount with the margin shown
- [ ] Given the financial dashboard, when I view the margin report, then I see total revenue, total pay cost, and gross margin for the selected period
- [ ] Given the margin report, when I drill down by school, then I see per-school margin breakdown

**Technical Notes:**
- Extend `payRates` concept to include `chargeRate` per school/role, or create a separate `chargeRates` table
- Margin = (chargeRate - payRate) x hours per timesheet

**Priority:** P3
**Estimate:** L

---

## Epic 3: Compliance Document Management

Provide structured document management for teacher compliance records with automated expiry tracking and verification workflows.

### Story 3.1: DBS Certificate Upload

**As a** teacher, **I want to** upload my DBS certificate document, **so that** the agency has it on file and can verify my compliance.

**Acceptance Criteria:**
- [ ] Given my profile page, when I navigate to the "Documents" section, then I see an upload area for DBS certificate
- [ ] Given I select a file (PDF or image), when I upload it, then the file is stored and linked to my profile with status `pending_verification`
- [ ] Given a successful upload, when I view the documents section, then I see the uploaded file name, upload date, and current verification status
- [ ] Given an existing document, when I upload a replacement, then the old document is archived and the new one becomes the active version

**Technical Notes:**
- New `complianceDocuments` table: `id`, `teacherId`, `documentType` (dbs/right_to_work/qualification/reference), `fileName`, `filePath`, `status` (pending_verification/verified/rejected/expired), `expiryDate`, `uploadedAt`, `verifiedAt`, `verifiedBy`
- Store files on local filesystem initially (under `/uploads/compliance/`); abstract storage for future S3 migration
- Max file size: 10MB; accepted types: PDF, JPG, PNG

**Priority:** P1
**Estimate:** L

---

### Story 3.2: Automated Expiry Alerts

**As an** agency manager, **I want to** receive automated alerts when teacher compliance documents are approaching expiry, **so that** I can proactively request renewals before teachers become non-compliant.

**Acceptance Criteria:**
- [ ] Given a document has an expiry date, when it is 30 days from expiry, then the agency receives a notification
- [ ] Given a document has an expiry date, when it is 7 days from expiry, then the teacher also receives a notification
- [ ] Given a document has expired, when the expiry date passes, then the teacher's `complianceStatus` is automatically set to `expired` and the teacher is excluded from new offers
- [ ] Given the compliance dashboard, when I view alerts, then I see a sorted list of upcoming expirations across all teachers

**Technical Notes:**
- Implement as a scheduled task (cron job or Next.js API route called by external scheduler)
- Check `complianceDocuments.expiryDate` daily
- Use existing notification system for alerts
- Update `teachers.complianceStatus` and `teachers.dbsStatus` on expiry

**Priority:** P1
**Estimate:** M

---

### Story 3.3: Document Verification Workflow

**As an** agency staff member, **I want to** review uploaded documents and mark them as verified or rejected with notes, **so that** we maintain auditable compliance records.

**Acceptance Criteria:**
- [ ] Given documents are pending verification, when I navigate to `/agency/compliance/documents`, then I see a queue of unverified documents
- [ ] Given a pending document, when I click "Verify" and optionally set an expiry date, then the document status changes to `verified` and the teacher's compliance status is recalculated
- [ ] Given a pending document, when I click "Reject" with a reason, then the document status changes to `rejected` and the teacher is notified to re-upload
- [ ] Given I verify or reject a document, when I view the audit trail, then I see who took the action and when

**Technical Notes:**
- `verifiedBy` references `agents.id`
- Recalculate teacher `complianceStatus`: if all required document types are verified and not expired, set to `compliant`; otherwise `pending` or `expired`

**Priority:** P1
**Estimate:** M

---

### Story 3.4: Compliance Dashboard

**As an** agency manager, **I want to** see a compliance overview showing all teachers' document statuses and upcoming expirations, **so that** I can manage the entire compliance portfolio at a glance.

**Acceptance Criteria:**
- [ ] Given I navigate to `/agency/compliance`, then I see a summary: count of compliant, pending, and expired teachers
- [ ] Given the dashboard, when I view the upcoming expirations section, then I see documents expiring in the next 30/60/90 days grouped by teacher
- [ ] Given the dashboard, when I click a teacher row, then I navigate to that teacher's document detail view
- [ ] Given the dashboard, when I filter by status (compliant/pending/expired), then the teacher list updates accordingly

**Technical Notes:**
- New routes: `src/app/agency/compliance/page.tsx` and `src/app/agency/compliance/documents/page.tsx`
- Add "Compliance" link to agency sidebar

**Priority:** P1
**Estimate:** M

---

## Epic 4: Push Notifications & PWA

Transform QuickSupply into a Progressive Web App with push notifications for time-sensitive events like new offers and booking confirmations.

### Story 4.1: Service Worker Registration

**As a** user (teacher, school, or agent), **I want** the application to register a service worker, **so that** it can support push notifications and offline caching.

**Acceptance Criteria:**
- [ ] Given any user visits the app in a supported browser, when the page loads, then a service worker is registered
- [ ] Given the service worker is registered, when the app is served, then static assets (shell HTML, CSS, JS) are cached for offline access
- [ ] Given the service worker updates, when a new version is deployed, then the user is prompted to refresh for the latest version

**Technical Notes:**
- Create `public/sw.js` with Workbox or manual cache strategies
- Use `next-pwa` or custom service worker registration in the root layout
- Cache strategy: network-first for API calls, cache-first for static assets

**Priority:** P2
**Estimate:** M

---

### Story 4.2: Push Notification Opt-In

**As a** teacher, **I want to** opt in to push notifications, **so that** I receive immediate alerts when new offers are sent to me.

**Acceptance Criteria:**
- [ ] Given I am logged in, when I visit my profile settings, then I see a "Enable Push Notifications" toggle
- [ ] Given I toggle notifications on, when the browser prompts for permission and I allow, then my push subscription is saved to the server
- [ ] Given I have opted in, when a new offer is created for me, then I receive a push notification with the offer details
- [ ] Given I toggle notifications off, when I save, then my subscription is removed and I no longer receive push notifications

**Technical Notes:**
- New `pushSubscriptions` table: `id`, `userId`, `userRole`, `endpoint`, `p256dhKey`, `authKey`, `createdAt`
- Use the Web Push API with VAPID keys stored in environment variables
- Server-side: `web-push` npm package to send notifications
- Hook into the existing notification creation flow to also trigger push

**Priority:** P1
**Estimate:** L

---

### Story 4.3: Offline Support

**As a** teacher, **I want** the app to load and show my upcoming bookings even when I am offline, **so that** I can check my schedule without a network connection.

**Acceptance Criteria:**
- [ ] Given I have previously loaded the teacher dashboard, when I go offline and open the app, then I see my cached dashboard with a "You are offline" banner
- [ ] Given I am offline, when I try to perform a write action (e.g., accept offer), then I see a clear message that the action requires connectivity
- [ ] Given I come back online, when the app detects connectivity, then the offline banner disappears and data refreshes

**Technical Notes:**
- Cache key API responses (`/api/teacher/bookings`, `/api/teacher/offers`) in the service worker
- Use `navigator.onLine` and `online`/`offline` events for the banner
- Read-only offline experience; no offline queue for writes in V2

**Priority:** P3
**Estimate:** L

---

### Story 4.4: Install Prompt (Add to Home Screen)

**As a** user, **I want to** install QuickSupply on my device's home screen, **so that** I can access it like a native app without opening a browser.

**Acceptance Criteria:**
- [ ] Given the app meets PWA install criteria (manifest, service worker, HTTPS), when a user visits, then the browser's install prompt can be triggered
- [ ] Given a first-time user visits, when they have used the app 3+ times, then a custom install banner appears suggesting they add it to their home screen
- [ ] Given the user dismisses the banner, when they visit again, then the banner does not reappear for 30 days

**Technical Notes:**
- Create `public/manifest.json` with app name, icons, theme color, display: standalone
- Capture the `beforeinstallprompt` event to show a custom install UI
- Store dismissal timestamp in `localStorage`

**Priority:** P3
**Estimate:** S

---

### Story 4.5: Notification Preferences

**As a** user, **I want to** configure which types of notifications I receive (offers, confirmations, cancellations, reminders), **so that** I am not overwhelmed by alerts I don't care about.

**Acceptance Criteria:**
- [ ] Given I navigate to notification settings, then I see toggles for each notification category: offers, booking confirmations, cancellations, reminders, timesheets
- [ ] Given I disable "reminders", when a reminder notification would be sent, then it is suppressed for me
- [ ] Given I update preferences, when I save, then my choices persist across sessions
- [ ] Given the settings page, when I view it, then I see my current preference state accurately reflected

**Technical Notes:**
- New `notificationPreferences` table: `id`, `userId`, `userRole`, `category`, `pushEnabled`, `inAppEnabled`
- Default all preferences to enabled on account creation
- Check preferences before sending push and before writing to `notificationLog`

**Priority:** P2
**Estimate:** M

---

## Epic 5: Enhanced Teacher Matching

Improve the assignment engine's ranking algorithm with richer teacher data and intelligent matching to increase fill rates and school satisfaction.

### Story 5.1: Subject Specialization Tracking

**As an** agency manager, **I want to** record each teacher's subject specializations, **so that** the assignment engine can prioritize teachers who match the requested subject.

**Acceptance Criteria:**
- [ ] Given the teacher profile edit page, when I edit specializations, then I can select multiple subjects from a predefined list
- [ ] Given a teacher has subject specializations recorded, when a cover request specifies a subject, then teachers with a matching specialization are ranked higher
- [ ] Given a teacher's profile, when I view it, then I see their listed specializations

**Technical Notes:**
- New `teacherSubjects` junction table: `teacherId`, `subject` (text), with composite primary key
- Predefined subjects list: English, Mathematics, Science, History, Geography, MFL, Art, Music, PE, Computing, RE, PSHE, DT, Drama, Early Years
- Modify ranking query in the assignment engine to boost score for subject match

**Priority:** P1
**Estimate:** M

---

### Story 5.2: School Preference Learning

**As an** agency manager, **I want** the system to learn school-teacher preferences from booking history and reviews, **so that** future assignments favour pairings that have worked well.

**Acceptance Criteria:**
- [ ] Given a school has reviewed a teacher with 4+ stars and would-rebook = true, when a new request comes from that school, then that teacher receives a ranking boost
- [ ] Given a school has reviewed a teacher with 1-2 stars or would-rebook = false, when a new request comes from that school, then that teacher receives a ranking penalty
- [ ] Given the teacher detail page, when I view school affinity, then I see a list of schools with affinity scores derived from review history

**Technical Notes:**
- Calculate affinity score from `schoolTeacherReviews`: weighted sum of rating + wouldRebook bonus
- Incorporate into existing ranking algorithm as a multiplier
- No new tables needed; compute at query time from existing `schoolTeacherReviews`

**Priority:** P2
**Estimate:** M

---

### Story 5.3: AI-Assisted Ranking

**As an** agency manager, **I want** the system to use a composite scoring model that weighs multiple factors (distance, availability, compliance, reviews, subject match, school preference), **so that** the best-fit teacher is offered first.

**Acceptance Criteria:**
- [ ] Given the assignment engine runs, when it ranks candidates, then it computes a composite score from: distance (closer = higher), agency rating, subject match, school affinity, compliance freshness
- [ ] Given the agency settings page, when I view ranking weights, then I can adjust the relative weight of each factor (e.g., distance weight = 0.3, rating weight = 0.25)
- [ ] Given I change a weight, when the next assignment runs, then the new weights are applied

**Technical Notes:**
- Refactor the existing ranking logic into a scoring function with configurable weights
- Store weights in `appConfig` table (key: `ranking_weights`, value: JSON)
- No ML model in V2; "AI-assisted" refers to the multi-factor weighted scoring

**Priority:** P2
**Estimate:** L

---

### Story 5.4: Historical Performance Weighting

**As an** agency manager, **I want** teacher ranking to factor in historical performance metrics (acceptance rate, cancellation rate, punctuality from timesheets), **so that** reliable teachers are prioritized.

**Acceptance Criteria:**
- [ ] Given a teacher has accepted 9 of 10 offers, when the ranking runs, then their high acceptance rate contributes positively to their score
- [ ] Given a teacher has cancelled 3 bookings in the last month, when the ranking runs, then their high cancellation rate contributes negatively
- [ ] Given timesheets are enabled, when a teacher's average arrival is after the booking start time, then a punctuality penalty is applied to their score
- [ ] Given the teacher detail page, when I view performance metrics, then I see acceptance rate, cancellation rate, and average punctuality

**Technical Notes:**
- Compute metrics from `assignmentOffers` (acceptance rate), `bookings` (cancellation rate), and `timesheets` (punctuality) tables
- Cache computed metrics periodically or calculate on-demand with date-bounded queries
- Feed into the composite scoring function from Story 5.3

**Priority:** P3
**Estimate:** L

---

## Epic 6: Multi-Agency Support

Enable QuickSupply to serve multiple agencies on a single deployment with data isolation, agency onboarding, and optional cross-agency features.

### Story 6.1: Agency Isolation (Multi-Tenancy)

**As a** platform administrator, **I want** all data to be scoped to an agency, **so that** multiple agencies can use the same QuickSupply instance without seeing each other's data.

**Acceptance Criteria:**
- [ ] Given an agency staff member is logged in, when they query any data (schools, teachers, requests, bookings), then they only see records belonging to their agency
- [ ] Given a new agency is created, when it is provisioned, then it has its own isolated dataset
- [ ] Given a teacher belongs to Agency A, when Agency B searches teachers, then that teacher does not appear (unless shared — see Story 6.3)

**Technical Notes:**
- New `agencies` table: `id`, `name`, `slug`, `logoUrl`, `primaryColor`, `isActive`, `createdAt`
- Add `agencyId` foreign key to: `schools`, `teachers`, `agents`, `coverRequests`, `bookings`, `timesheets`, `payRates`, `invoices`
- This is a significant migration; all existing queries need a `WHERE agencyId = ?` filter
- Middleware extracts `agencyId` from session and injects into all data access functions
- Existing single-agency data migrated to a default agency record

**Priority:** P1
**Estimate:** XL

---

### Story 6.2: Agency Onboarding Flow

**As a** platform administrator, **I want** a self-service onboarding flow for new agencies, **so that** they can sign up and start using QuickSupply without manual database provisioning.

**Acceptance Criteria:**
- [ ] Given a new agency visits the signup page, when they complete the registration form (agency name, admin email, password), then a new agency and admin agent account are created
- [ ] Given the onboarding is complete, when the admin logs in for the first time, then they see a setup wizard to add their first school and teacher
- [ ] Given an agency is onboarded, when they reach the dashboard, then they see empty-state prompts guiding next steps

**Technical Notes:**
- New route: `/onboarding/page.tsx` with multi-step form
- Create `agencies` + initial `agents` record in a transaction
- Send welcome email via existing Resend integration
- Setup wizard can reuse existing school/teacher creation forms

**Priority:** P2
**Estimate:** L

---

### Story 6.3: Cross-Agency Teacher Sharing (Opt-In)

**As an** agency manager, **I want to** opt in to sharing specific teachers with other agencies on the platform, **so that** teachers get more work and hard-to-fill requests have a larger candidate pool.

**Acceptance Criteria:**
- [ ] Given an agency manager views a teacher's profile, when they toggle "Shared on platform", then that teacher becomes visible to other agencies for matching purposes
- [ ] Given a shared teacher is booked by another agency, when the booking is created, then the originating agency is recorded and revenue-sharing rules apply
- [ ] Given an agency manager, when they search for teachers, then shared teachers from other agencies appear with a "Shared" badge and their home agency name
- [ ] Given a teacher is shared, when their home agency revokes sharing, then they are immediately removed from other agencies' candidate pools

**Technical Notes:**
- New `sharedTeachers` table: `id`, `teacherId`, `homeAgencyId`, `sharedAt`, `revokedAt`
- Extend teacher search queries: include teachers from `sharedTeachers` where `revokedAt IS NULL` and `homeAgencyId != currentAgencyId`
- Revenue sharing is out of scope for V2; track the `homeAgencyId` on bookings for future billing

**Priority:** P3
**Estimate:** XL

---

### Story 6.4: Agency Branding

**As an** agency manager, **I want to** customize the application's appearance with my agency's logo and primary color, **so that** schools and teachers see a branded experience.

**Acceptance Criteria:**
- [ ] Given the agency settings page, when I upload a logo and select a primary color, then the changes are saved to my agency profile
- [ ] Given branding is configured, when a school or teacher in my agency logs in, then they see my agency's logo in the header and the primary color applied to buttons and accents
- [ ] Given no branding is configured, when users log in, then they see the default QuickSupply branding

**Technical Notes:**
- Store `logoUrl` and `primaryColor` on the `agencies` table
- Apply branding via CSS custom properties set in the root layout based on session agency
- Logo stored in `/uploads/branding/` or served from the `agencies` record

**Priority:** P3
**Estimate:** M

---

## Priority Summary

| Priority | Stories |
|----------|---------|
| P1 | 1.1, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.2, 5.1, 6.1 |
| P2 | 1.2, 1.3, 1.4, 2.4, 4.1, 4.5, 5.2, 5.3, 6.2 |
| P3 | 2.5, 4.3, 4.4, 5.4, 6.3, 6.4 |

## Estimation Summary

| Size | Stories |
|------|---------|
| S | 1.4, 4.4 |
| M | 1.2, 1.3, 1.5, 2.2, 2.3, 3.2, 3.3, 3.4, 4.1, 4.5, 5.1, 5.2, 5.3, 6.4 |
| L | 1.1, 2.1, 2.5, 3.1, 4.2, 4.3, 5.4, 6.2 |
| XL | 2.4, 6.1, 6.3 |
