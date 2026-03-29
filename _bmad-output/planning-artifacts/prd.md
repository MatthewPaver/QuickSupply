# QuickSupply — Product Requirements Document

**Product:** QuickSupply
**Company:** Desian Education
**Version:** 1.0 (MVP)
**Last Updated:** 2026-03-27
**Status:** In Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Goals](#2-vision--goals)
3. [Target Users & Personas](#3-target-users--personas)
4. [User Journeys](#4-user-journeys)
5. [Domain Model](#5-domain-model)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Scope — Current MVP](#8-scope--current-mvp)
9. [Scope — V2 Roadmap](#9-scope--v2-roadmap)
10. [Constraints & Assumptions](#10-constraints--assumptions)
11. [Success Criteria](#11-success-criteria)

---

## 1. Executive Summary

### Problem Statement

UK supply teaching agencies coordinate cover between schools and supply staff using a patchwork of phone calls, WhatsApp messages, spreadsheets, and fragmented legacy software. This manual workflow is slow, error-prone, and poorly suited to the time-critical nature of supply booking — where a school may need a teacher confirmed by 7:30 AM for an 8:30 AM start. The result is unfilled requests, double-bookings, frustrated office managers, and teachers missing opportunities because they were not contacted in time.

### Solution Overview

QuickSupply is a real-time supply teaching workforce scheduling platform that connects UK primary schools, supply teachers and teaching assistants, and their staffing agency through a single web application. It replaces phone/text coordination with a structured, sequential assignment engine: schools submit cover requests, the agency ranks and offers to teachers one at a time with configurable response windows, and teachers accept or decline from their own portal. The entire lifecycle — from request submission to confirmed booking and post-booking review — is managed within the platform.

### Target Market

- **Primary audience:** Small-to-medium UK supply teaching agencies (1-10 consultants) serving primary, nursery, and special schools.
- **End users:** School office managers and headteachers, supply teachers and teaching assistants on the agency's books, and agency consultants/administrators.
- **Geography:** United Kingdom, with initial focus on localised agency catchment areas (typically a single city or county).

---

## 2. Vision & Goals

### Product Vision

To become the essential operating system for UK supply teaching agencies — replacing manual coordination with an intelligent, real-time platform that fills every cover request with the right teacher, faster and more reliably than phone-based workflows.

### Business Objectives

1. **Reduce time-to-fill** for cover requests from an average of 30+ minutes of phone calls to under 5 minutes of automated sequential offering.
2. **Eliminate double-bookings** through enforced single-offer-at-a-time logic and real-time availability tracking.
3. **Increase teacher utilisation** by surfacing all eligible teachers ranked by suitability, distance, and preference rather than relying on the consultant's memory.
4. **Improve school satisfaction** through transparent request tracking, preferred-teacher support, and post-booking review workflows.
5. **Provide agency oversight** with a centralised dashboard showing all requests, offers, bookings, and compliance status in real time.

### Success Metrics (KPIs)

| Metric | Target (MVP Launch + 3 months) |
|--------|-------------------------------|
| Mean time from request submission to confirmed booking | < 10 minutes |
| Percentage of requests filled without manual intervention | > 60% |
| Double-booking incidents per month | 0 |
| School portal adoption (active schools submitting via platform) | > 80% of agency's school clients |
| Teacher portal adoption (teachers responding to offers via platform) | > 70% of agency's active teachers |
| School satisfaction (average review rating) | >= 4.0 / 5.0 |
| System uptime | 99.5% during operating hours (06:00-18:00 GMT) |

---

## 3. Target Users & Personas

### Persona 1: Sarah — School Office Manager

- **Role:** Office Manager at Greenfield Primary School
- **Age:** 38
- **Tech comfort:** Moderate; uses email, school MIS, and basic web apps daily
- **Goals:**
  - Submit cover requests quickly when a teacher calls in sick, often before 7:30 AM
  - Know as soon as possible whether cover has been arranged
  - Request specific teachers who have worked well at the school before
  - Provide feedback after a booking to influence future assignments
- **Pain points:**
  - Currently phones the agency and waits for a callback, sometimes chasing multiple times
  - No visibility into whether the agency is actively working on her request
  - Cannot easily indicate teacher preferences beyond a verbal mention
- **Key scenarios:** Emergency same-day requests, next-day planned absence cover, reviewing teachers after a booking

### Persona 2: James — Supply Teacher

- **Role:** Qualified primary teacher registered with the agency
- **Age:** 29
- **Tech comfort:** High; uses smartphone apps and web platforms daily
- **Goals:**
  - Receive job offers promptly and respond from his phone
  - Control which days he is available and how far he is willing to travel
  - Avoid being contacted about schools he has had bad experiences with
  - See his upcoming bookings in one place
- **Pain points:**
  - Misses phone calls from the agency while teaching or commuting
  - Gets offered jobs at schools too far from home
  - No single view of his upcoming work schedule
- **Key scenarios:** Accepting a same-morning emergency offer, setting weekly recurring availability, declining an offer and seeing the next one go to someone else

### Persona 3: Claire — Agency Consultant

- **Role:** Senior Recruitment Consultant at Desian Education
- **Age:** 34
- **Tech comfort:** High; manages multiple concurrent tasks across tools
- **Goals:**
  - See all incoming requests across all schools in one dashboard
  - Quickly identify the best teacher for each request based on distance, rating, compliance, and school preference
  - Trigger the automated offering sequence or manually assign a specific teacher
  - Monitor offer progress in real time (who was offered, when it expires, who declined)
  - Manage teacher compliance (DBS checks, right to work) and school onboarding
- **Pain points:**
  - Juggles phone calls, texts, and a spreadsheet simultaneously during the morning rush
  - Relies on memory for which teachers have worked well at which schools
  - No audit trail of who was offered what and when
- **Key scenarios:** Morning rush processing 10+ requests, onboarding a new teacher, deactivating a non-compliant teacher, cancelling a booking and re-offering

---

## 4. User Journeys

### Journey 1: School Submits a Cover Request (Sarah)

1. Sarah logs into the School Portal at 7:00 AM.
2. She navigates to "New Request" from her dashboard.
3. She selects the date (today), role needed (Teacher), key stage (KS1), start/end times, and adds a note ("Year 2 — maths and literacy planned, plans on desk").
4. She optionally selects a preferred teacher from a dropdown showing previous teachers who match the role.
5. She marks the request as "Emergency" (same-day).
6. She submits. The system confirms with a request ID.
7. Her dashboard shows the request as "Pending". She receives real-time SSE updates as the status changes.
8. When the request moves to "Offering", she sees it update. When it becomes "Filled", she sees the teacher's name.
9. After the booking date passes, a review prompt appears on her dashboard. She rates the teacher 1-5 stars, leaves a comment, and indicates whether she would rebook.

### Journey 2: Teacher Receives and Accepts an Offer (James)

1. James logs into the Teacher Portal. His dashboard shows his upcoming bookings and any pending offers.
2. A new offer arrives (via SSE push). The Jobs page shows the offer card: school name, date, role, key stage, times, and a countdown timer showing time remaining to respond.
3. James reviews the details. He taps "Accept".
4. The offer card updates to "Accepted". The booking appears on his dashboard with school name, address, date, and times.
5. If he had tapped "Decline", the system would automatically offer to the next ranked teacher. James would see the offer removed from his Jobs page.

### Journey 3: Agency Processes the Morning Rush (Claire)

1. Claire logs into the Agency Portal at 6:45 AM. The dashboard shows a summary: pending requests, active offers, today's bookings, and compliance alerts.
2. Three new requests have come in overnight. She opens the Requests page, which lists all requests sorted by urgency.
3. For the first request (emergency, KS2 teacher needed at Oakwood Primary), she clicks into the request detail. The system shows a ranked list of eligible teachers with scores, distances, ratings, and whether the school has requested a preferred teacher.
4. She clicks "Start Sequential Offering". The system sends an offer to the top-ranked teacher with a 7-minute response window (emergency setting).
5. The dashboard updates in real time: "Offer sent to James Carter — expires 07:12". After 4 minutes, James accepts. The request status changes to "Filled".
6. For the second request (next-day, TA needed), Claire sees the school's preferred teacher is ranked first. She clicks "Send Offer" next to that teacher (manual assign). The offer goes out with a 60-minute window.
7. The third request has no eligible teachers after filtering. Claire sees "No eligible teachers found" and may need to contact teachers offline or adjust filters.
8. Later, a school calls to cancel tomorrow's booking. Claire navigates to Bookings, finds the booking, and cancels it with a reason. The request returns to "Pending" for re-offering.

---

## 5. Domain Model

### Entity Relationship Overview

```
schools ──────────< coverRequests >────── assignmentOffers >────── bookings
   │                    │                        │                    │
   │                    │ preferredTeacherId?     │                    │
   │                    └────────────────────────>│<───────────────────┘
   │                                             │
   │              teachers ──────────────────────┘
   │                 │
   │                 ├──< teacherAvailability
   │                 │
   └─────────────────┼──< teacherBlacklistedSchools
                     │
                     ├──< schoolTeacherReviews >──── bookings
                     │
                     └──< agentTeacherAssignments >──── agents
```

### Key Entities

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| **School** | A registered school that submits cover requests. | name, address, postcode, lat/lng (geocoded), contactName/Email/Phone, phase (primary/secondary/all-through/nursery/special), isActive |
| **Teacher** | A supply teacher or TA on the agency's books. | firstName, lastName, postcode, lat/lng, canDrive, maxDistanceMiles, roleType (teacher/ta/both), emergencyAvailable, contactNightBeforeOnly, agencyRating (1-5), complianceStatus, dbsStatus, dbsExpiry, rightToWork, longTermWilling, isActive |
| **Agent** | An agency staff member (consultant or admin). | name, email, isAdmin |
| **Cover Request** | A school's request for supply cover on a specific date. | schoolId, date, roleNeeded (teacher/ta), subject, keyStage, startTime, endTime, notes, preferredTeacherId, status (pending/offering/filled/cancelled), isEmergency |
| **Assignment Offer** | A time-limited offer sent to a single teacher for a specific request. | coverRequestId, teacherId, offeredAt, expiresAt, status (pending/accepted/declined/expired/withdrawn), offerOrder |
| **Booking** | A confirmed assignment linking a teacher to a cover request. | coverRequestId, teacherId, confirmedAt, cancelledAt, cancelledBy, cancellationReason |
| **School Teacher Review** | A school's post-booking review of a teacher. | schoolId, teacherId, bookingId, rating (1-5), comment, wouldRebook |
| **Teacher Availability** | A teacher's available/unavailable status for a specific date or recurring day of week. | teacherId, date (specific) or dayOfWeek (recurring), isAvailable, isRecurring |
| **Teacher Blacklisted Schools** | Schools a teacher should not be offered to. | teacherId, schoolId, reason |
| **Notification Log** | In-app notification records for all user types. | recipientType, recipientId, type, title, body, read, relatedEntityType/Id |
| **App Config** | System-wide configuration key-value pairs (e.g., response window durations). | key, value (JSON-encoded) |
| **Password Reset Tokens** | Time-limited tokens for forgot-password flow. | userId, role, tokenHash, expiresAt |
| **Agent-Teacher Assignments** | Many-to-many link between agents and their assigned teachers. | agentId, teacherId |

### Key Relationships

- A **school** has many **cover requests**; a cover request belongs to one school.
- A **cover request** has many **assignment offers** (sequential, one at a time active); each offer targets one **teacher**.
- An accepted **assignment offer** creates exactly one **booking**. A booking links one cover request to one teacher.
- A **school** can review a **teacher** after each **booking** (one review per booking).
- A **teacher** has many **availability** records (specific dates and recurring patterns).
- A **teacher** can be blacklisted from many **schools** (and vice versa).
- An **agent** can be assigned to many **teachers** (agent-teacher assignments).

---

## 6. Functional Requirements

### 6.1 School Portal

#### 6.1.1 Authentication
- **SCH-AUTH-01:** Schools log in with email and password.
- **SCH-AUTH-02:** Schools can request a password reset via email (forgot-password flow with time-limited token).
- **SCH-AUTH-03:** Session is maintained via secure, HTTP-only cookie.

#### 6.1.2 Dashboard
- **SCH-DASH-01:** Display summary cards: pending requests, active offers, today's bookings, total bookings this term.
- **SCH-DASH-02:** Show list of recent/active cover requests with current status (pending, offering, filled, cancelled).
- **SCH-DASH-03:** Real-time updates via SSE when request status changes (e.g., offering -> filled).

#### 6.1.3 Cover Request Submission
- **SCH-REQ-01:** Form fields: date, role needed (Teacher/TA), subject (optional), key stage (optional), start time, end time, notes (free text), preferred teacher (optional dropdown), emergency flag.
- **SCH-REQ-02:** Preferred teacher dropdown shows only teachers who have previously worked at the school and whose role matches the selected "Role needed".
- **SCH-REQ-03:** Validation: date must not be in the past; start time must be before end time; role needed is required.
- **SCH-REQ-04:** Deactivated schools cannot submit cover requests (403 error with clear message).
- **SCH-REQ-05:** On submission, request is created with status "pending" and the agency is notified in real time (SSE + in-app notification + email).

#### 6.1.4 Request History
- **SCH-HIST-01:** List all past and current cover requests with status, date, role, and assigned teacher (if filled).
- **SCH-HIST-02:** Filter by status (pending, offering, filled, cancelled).

#### 6.1.5 Teacher Reviews
- **SCH-REV-01:** After a booking date has passed, the school can submit a review: rating (1-5 stars), comment (free text), and "would rebook" toggle.
- **SCH-REV-02:** One review per booking. Reviews are read-only after submission.
- **SCH-REV-03:** Reviews feed into the teacher's school-specific rating, which influences future ranking.

### 6.2 Teacher Portal

#### 6.2.1 Authentication
- **TCH-AUTH-01:** Teachers log in with email and password.
- **TCH-AUTH-02:** Forgot-password flow with email-based reset token.
- **TCH-AUTH-03:** Session via secure HTTP-only cookie.

#### 6.2.2 Dashboard
- **TCH-DASH-01:** Show upcoming confirmed bookings (date, school name, address, times, role).
- **TCH-DASH-02:** Show any pending offers with countdown timer.
- **TCH-DASH-03:** Real-time SSE updates for new offers, withdrawn offers, and booking confirmations.

#### 6.2.3 Jobs (Offer Management)
- **TCH-JOB-01:** Display all pending offers with details: school name, date, role, key stage, times, notes, and time remaining.
- **TCH-JOB-02:** Teacher can accept an offer. On accept: booking is created, request status changes to "filled", school and agency are notified.
- **TCH-JOB-03:** Teacher can decline an offer. On decline: system automatically offers to the next ranked teacher; agency is notified.
- **TCH-JOB-04:** Expired offers are automatically marked and the next teacher is offered (via cron-triggered expiry check).
- **TCH-JOB-05:** Only the teacher who was offered can respond (enforced server-side).

#### 6.2.4 Availability Management
- **TCH-AVAIL-01:** Teachers can set recurring weekly availability (available/unavailable per day of week).
- **TCH-AVAIL-02:** Teachers can set specific-date overrides (e.g., unavailable on 15 April even though Tuesdays are normally available).
- **TCH-AVAIL-03:** If no availability data exists for a date, the teacher defaults to "available".

#### 6.2.5 Profile Management
- **TCH-PROF-01:** Teachers can view and update: phone, postcode, canDrive, maxDistanceMiles, roleType, emergencyAvailable, contactNightBeforeOnly, longTermWilling.
- **TCH-PROF-02:** Postcode changes trigger lat/lng recalculation.
- **TCH-PROF-03:** Teachers cannot edit compliance fields (DBS, right to work, agency rating) — these are agency-managed.

### 6.3 Agency Portal

#### 6.3.1 Authentication
- **AGN-AUTH-01:** Agents log in with email and password.
- **AGN-AUTH-02:** Admin agents can manage other agents (CRUD).
- **AGN-AUTH-03:** Forgot-password flow with email-based reset token.

#### 6.3.2 Dashboard
- **AGN-DASH-01:** Summary cards: pending requests (count), active offers (count), today's bookings (count), compliance alerts (teachers with expiring DBS or pending compliance).
- **AGN-DASH-02:** Real-time SSE updates for all events: new requests, offers sent/accepted/declined/expired, bookings confirmed/cancelled.
- **AGN-DASH-03:** Activity feed showing recent events across all requests.

#### 6.3.3 Request Management
- **AGN-REQ-01:** List all cover requests across all schools with filters: status, date, school, role needed.
- **AGN-REQ-02:** Request detail page shows: full request details, school info, current status, offer history (who was offered, when, outcome), and if filled the booking details.
- **AGN-REQ-03:** "Rank Teachers" action: display a ranked list of eligible teachers for the request, showing score, distance, agency rating, school review average, whether previously worked at school, and preferred status.
- **AGN-REQ-04:** "Start Sequential Offering" action: begin the automated offering sequence starting with the top-ranked teacher.
- **AGN-REQ-05:** "Send Offer" (manual assign): send an offer directly to a chosen teacher, withdrawing any active pending offer first.
- **AGN-REQ-06:** "Withdraw Offer" action: withdraw the current pending offer and return request to "pending".
- **AGN-REQ-07:** Configurable response windows: `morning_response_window_minutes` (default 7 min for emergency), `next_day_response_window_minutes` (default 60 min for standard).

#### 6.3.4 Booking Management
- **AGN-BOOK-01:** List all bookings with filters: date range, school, teacher, status (active/cancelled).
- **AGN-BOOK-02:** Cancel a booking with a reason. On cancellation: booking is marked cancelled, request returns to "pending", school and teacher are notified.
- **AGN-BOOK-03:** Cancelled bookings do not block re-offering the same teacher on the same date.

#### 6.3.5 Teacher Management
- **AGN-TCH-01:** List all teachers with search and filters: compliance status, DBS status, role type, active/inactive.
- **AGN-TCH-02:** Create new teachers (name, email, phone, postcode, role type, etc.) and generate login credentials.
- **AGN-TCH-03:** Edit teacher profiles including all fields.
- **AGN-TCH-04:** Update compliance fields: complianceStatus (compliant/pending/expired), complianceNotes, dbsStatus, dbsExpiry, rightToWork.
- **AGN-TCH-05:** Activate/deactivate teachers. Deactivated teachers are excluded from ranking and cannot receive offers.
- **AGN-TCH-06:** Teacher detail page shows: profile, compliance status, booking history, school reviews received, and agency rating.
- **AGN-TCH-07:** View school reviews for a teacher including rating, comment, and wouldRebook data. Reviews influence the teacher's ranking score.
- **AGN-TCH-08:** Manage teacher blacklisted schools.

#### 6.3.6 School Management
- **AGN-SCH-01:** List all schools with search and active/inactive filter.
- **AGN-SCH-02:** Create new schools (name, address, postcode, contact details, phase) and generate login credentials.
- **AGN-SCH-03:** Edit school profiles.
- **AGN-SCH-04:** Activate/deactivate schools. Deactivated schools cannot submit cover requests.
- **AGN-SCH-05:** School detail page shows: profile, request history, and booking stats.

#### 6.3.7 Agent Management
- **AGN-AGT-01:** Admin agents can list, create, and manage other agents.
- **AGN-AGT-02:** Agents can be assigned to specific teachers (agent-teacher assignments).

#### 6.3.8 Settings
- **AGN-SET-01:** Configure system-wide settings via the app_config table: response window durations, and other operational parameters.

#### 6.3.9 SMS Log
- **AGN-SMS-01:** View log of SMS notifications sent (for audit and troubleshooting).

### 6.4 Cross-Cutting: Assignment Engine

- **ASN-01:** The ranking algorithm scores eligible teachers based on: preferred teacher bonus (+200), agency rating (x20), school review average (x10), distance (inverse, max 30 points), can drive (+25), previously worked at school (+15).
- **ASN-02:** Hard filters exclude teachers who: do not match the role, are not compliant, are already booked on the date, are blacklisted for the school, have already declined/expired for this request, are not emergency-available (if emergency), or are outside their max travel distance.
- **ASN-03:** Preferred teacher override: if the school's preferred teacher passes hard filters but was excluded by soft filters (e.g., availability), they are added at the top of the ranked list.
- **ASN-04:** Sequential offering: offers go out one at a time. Only one pending offer exists per request at any moment.
- **ASN-05:** Auto-advance: when an offer is declined or expires, the system automatically offers to the next ranked teacher. The ranked list is recomputed each time (so new information is considered).
- **ASN-06:** Exhaustion: if all eligible teachers have been offered and declined/expired, the request returns to "pending" and the agency is notified for manual intervention.
- **ASN-07:** Offer expiry is checked via a cron endpoint (`/api/cron`) that identifies pending offers past their `expiresAt` timestamp and triggers auto-advance.

### 6.5 Cross-Cutting: Authentication & Authorization

- **AUTH-01:** Three distinct user roles: school, teacher, agent. Each has a separate login flow sharing the same login page with role selection.
- **AUTH-02:** Cookie-based session management with secure, HTTP-only cookies.
- **AUTH-03:** Password hashing using bcrypt.
- **AUTH-04:** Rate limiting on all API endpoints to prevent brute force and abuse (Upstash Redis-backed).
- **AUTH-05:** Role-based access control enforced server-side on every API route: schools can only access their own data, teachers can only respond to their own offers, agents can access all data.
- **AUTH-06:** Forgot-password flow: user requests reset, receives email with tokenised link (via Resend), token is hashed and stored with expiry, reset page validates token and allows new password.

### 6.6 Cross-Cutting: Notifications

- **NOTIF-01:** In-app notifications stored in `notification_log` table with read/unread status.
- **NOTIF-02:** Real-time push via Server-Sent Events (SSE) with per-user channels: `teacher:{id}`, `school:{id}`, and a shared `agency` channel.
- **NOTIF-03:** Email notifications via Resend for critical events: new request (to agents), password reset.
- **NOTIF-04:** Notification types: offer, accepted, declined, expired, cancellation, reminder, filled.
- **NOTIF-05:** Notifications include related entity references for deep linking.

---

## 7. Non-Functional Requirements

### 7.1 Performance

- **PERF-01:** Page load time (Time to Interactive) < 2 seconds on standard broadband (10 Mbps).
- **PERF-02:** API response time < 500ms for all CRUD operations under normal load.
- **PERF-03:** SSE event delivery latency < 1 second from trigger to client receipt.
- **PERF-04:** Ranking algorithm must complete in < 500ms for up to 500 teachers.
- **PERF-05:** Cron-based offer expiry check must complete in < 5 seconds.

### 7.2 Security

- **SEC-01:** All traffic served over HTTPS.
- **SEC-02:** Passwords hashed with bcrypt (cost factor >= 10).
- **SEC-03:** Session cookies: Secure, HttpOnly, SameSite=Lax.
- **SEC-04:** API rate limiting: per-IP and per-session limits to prevent abuse.
- **SEC-05:** Input validation on all API endpoints using Zod schemas.
- **SEC-06:** SQL injection prevention via Drizzle ORM parameterised queries.
- **SEC-07:** No sensitive data (passwords, tokens) returned in API responses.
- **SEC-08:** Password reset tokens are hashed before storage; tokens expire after a configurable window.
- **SEC-09:** Error monitoring and alerting via Sentry.

### 7.3 Accessibility

- **A11Y-01:** WCAG 2.1 Level AA compliance target for all portals.
- **A11Y-02:** Semantic HTML, proper heading hierarchy, ARIA labels on interactive elements.
- **A11Y-03:** Keyboard navigable: all actions achievable without a mouse.
- **A11Y-04:** Colour contrast ratios meeting AA standards (4.5:1 for normal text).
- **A11Y-05:** Form fields with associated labels and error messages announced to screen readers.

### 7.4 Scalability

- **SCALE-01:** MVP targets a single agency with up to 200 teachers, 100 schools, and 50 requests/day.
- **SCALE-02:** SQLite is acceptable for MVP; architecture is designed for migration to PostgreSQL for multi-agency or higher scale.
- **SCALE-03:** Stateless API design (session in cookie, SSE managed in-process) allows horizontal scaling with session-store migration.

### 7.5 Reliability

- **REL-01:** Automated E2E tests (Playwright) covering critical paths: login, submit request, accept offer, cancel booking.
- **REL-02:** Database migrations managed via Drizzle Kit with version-controlled migration files.
- **REL-03:** Error tracking and alerting via Sentry with source maps.
- **REL-04:** Graceful degradation: if SSE connection drops, the UI falls back to polling or manual refresh.

### 7.6 Compliance

- **COMP-01:** GDPR compliance: personal data (teacher details, school contacts) processed lawfully under legitimate interest or contract. Data minimisation applied — only necessary fields collected.
- **COMP-02:** Right to erasure: deactivation mechanism exists; full data deletion procedure to be documented.
- **COMP-03:** Privacy policy page accessible from the application.
- **COMP-04:** Safeguarding: compliance fields (DBS status, DBS expiry, right to work) tracked per teacher. Only compliant teachers can be offered work.
- **COMP-05:** DBS expiry tracking: the system stores DBS expiry dates and can flag expiring/expired checks (compliance alert basis for V2 automation).
- **COMP-06:** Audit trail: all offers, responses, bookings, and cancellations are timestamped and stored with full history.
- **COMP-07:** Data stored in UK-hosted infrastructure (or compliant jurisdiction).

---

## 8. Scope — Current MVP

The following features are implemented and functional in the current codebase:

### School Portal
- Login / logout / forgot-password / reset-password
- Dashboard with request summary and real-time status updates (SSE)
- Cover request submission form with preferred teacher selection, emergency flag, and all fields
- Request history with status filtering
- Post-booking teacher review (rating, comment, wouldRebook)

### Teacher Portal
- Login / logout / forgot-password / reset-password
- Dashboard with upcoming bookings and pending offers
- Jobs page: view pending offers with details, accept or decline
- Availability management: recurring weekly patterns and specific-date overrides
- Profile management: editable personal and preference fields

### Agency Portal
- Login / logout / forgot-password / reset-password
- Dashboard with summary cards and real-time event feed (SSE)
- Request management: list, filter, detail view with ranked teacher list
- Assignment engine: start sequential offering, manual assign (send offer), withdraw offer
- Booking management: list bookings, cancel with reason
- Teacher management: list, create, edit, view detail (profile + compliance + reviews), activate/deactivate, credential generation
- School management: list, create, edit, view detail, activate/deactivate, credential generation
- Agent management (admin only)
- Settings management (response window configuration)
- SMS log viewer

### Cross-Cutting
- Cookie-based authentication with role-based access control
- Bcrypt password hashing
- Zod-based API input validation
- Rate limiting (Upstash Redis)
- SSE real-time event streaming (per-user and agency-wide channels)
- In-app notification system with read/unread tracking
- Email notifications via Resend (new requests, password resets)
- Sequential assignment engine with ranking, auto-advance on decline/expiry, and preferred teacher support
- Cron endpoint for expired offer detection and auto-advance
- Sentry error monitoring
- Playwright E2E test infrastructure
- Database migrations via Drizzle Kit
- Privacy policy page

---

## 9. Scope — V2 Roadmap

The following features are planned for near-term development after MVP launch:

### 9.1 Analytics & Reporting
- **V2-ANA-01:** Agency analytics dashboard: fill rate by school, average time-to-fill, teacher utilisation rates, request volume trends (daily/weekly/monthly).
- **V2-ANA-02:** School-level reporting: requests submitted vs filled, preferred teacher hit rate, average review scores given.
- **V2-ANA-03:** Teacher-level reporting: acceptance rate, average response time, schools worked at, earnings summary.
- **V2-ANA-04:** Exportable CSV/PDF reports for agency management and school invoicing support.

### 9.2 Timesheets & Invoicing Support
- **V2-TIM-01:** Digital timesheet submission by teachers after each booking: actual start/end times, breaks.
- **V2-TIM-02:** School sign-off on timesheets (confirmation that teacher attended and times are accurate).
- **V2-TIM-03:** Agency timesheet dashboard: pending sign-offs, discrepancies, approved timesheets.
- **V2-TIM-04:** Export approved timesheets for payroll and invoicing integration.

### 9.3 Compliance Document Management
- **V2-DOC-01:** Document upload and storage: DBS certificates, right-to-work evidence, qualification certificates, references.
- **V2-DOC-02:** Automated compliance alerts: email/in-app notifications when DBS is expiring (30/14/7 days before expiry).
- **V2-DOC-03:** Compliance dashboard: agency-wide view of all teachers' compliance status with traffic-light indicators.
- **V2-DOC-04:** Compliance history log: track when documents were uploaded, verified, and by whom.

### 9.4 Push Notifications & Mobile
- **V2-PUSH-01:** Web push notifications (service worker) for teachers receiving new offers — critical for same-morning emergency requests.
- **V2-PUSH-02:** Progressive Web App (PWA) manifest for add-to-home-screen on mobile devices.
- **V2-PUSH-03:** SMS notifications for offer alerts (integration with SMS provider, building on existing SMS log infrastructure).

### 9.5 Enhanced Scheduling
- **V2-SCHED-01:** Multi-day and long-term booking support: a single request can span multiple days (e.g., a week of maternity cover).
- **V2-SCHED-02:** Recurring request templates: schools can create standing arrangements (e.g., "every Wednesday, TA, KS1").
- **V2-SCHED-03:** Calendar views for teachers (personal schedule) and agency (all bookings across all schools).

### 9.6 Multi-Agency Support
- **V2-MULTI-01:** Tenant isolation: support multiple agencies on the same platform, each with their own schools, teachers, and configuration.
- **V2-MULTI-02:** Agency onboarding and self-service registration.
- **V2-MULTI-03:** Database migration from SQLite to PostgreSQL for multi-tenant scalability.

---

## 10. Constraints & Assumptions

### Technical Constraints

1. **SQLite for MVP:** The application uses SQLite (via better-sqlite3 and Drizzle ORM) as the primary database. This is appropriate for a single-agency deployment but will require migration to PostgreSQL for multi-agency or high-concurrency scenarios. SQLite's write lock is acceptable given the expected write volume (< 100 writes/minute peak).

2. **Single-process SSE:** Server-Sent Events are managed in-process (in-memory SSE manager). This means SSE only works with a single server process. Horizontal scaling will require an external pub/sub layer (e.g., Redis Pub/Sub).

3. **No native mobile app:** The MVP is a responsive web application only. Push notifications require a service worker (V2) or SMS integration. Teachers may miss time-sensitive offers if they do not have the browser open.

4. **Cron-based offer expiry:** Offer expiry relies on a cron endpoint (`/api/cron`) being called at regular intervals. If the cron job fails or is delayed, expired offers may not auto-advance promptly. The interval should be 1-2 minutes during operating hours.

5. **Email dependency:** Password resets and agent notifications rely on the Resend email service. Email delivery failures could block password resets.

### Business Assumptions

1. **Single-agency mode:** The MVP serves one agency (Desian Education). All schools and teachers in the system belong to this agency.

2. **UK primary education focus:** The initial market is UK primary, nursery, and special schools. The data model supports secondary and all-through phases but the UI and workflows are optimised for the primary context (key stages, typical hours, etc.).

3. **Agency-mediated model:** The agency remains the central actor. Schools do not directly contact or hire teachers. The agency controls teacher compliance, ranking, and offering. Schools can express preferences but the agency makes the assignment decision.

4. **Compliance is agency-managed:** Teachers cannot self-certify compliance. The agency manually updates DBS status, right-to-work verification, and overall compliance status. Automated compliance verification (e.g., DBS update service integration) is V2.

5. **No payment processing:** The platform does not handle payments, invoicing, or payroll. It tracks bookings which feed into the agency's existing financial processes offline. Timesheet and invoicing support are V2.

6. **Teacher accounts are agency-created:** Teachers do not self-register. The agency creates teacher accounts and provides credentials. This ensures only vetted, compliant teachers have access.

7. **School accounts are agency-created:** Schools do not self-register. The agency onboards schools and provides credentials.

8. **Geocoding is pre-computed:** School and teacher postcodes are geocoded to lat/lng at creation time. The system uses Haversine distance for ranking. Real-time geocoding or route-based distance calculation is not in scope.

---

## 11. Success Criteria

The MVP launch is considered successful when the following criteria are met:

### Functional Completeness
- [ ] All three portals (School, Teacher, Agency) are fully functional with the features listed in Section 8.
- [ ] The sequential assignment engine correctly ranks, offers, auto-advances, and creates bookings without manual database intervention.
- [ ] Real-time updates (SSE) are working across all portals — status changes propagate within 1 second.
- [ ] Post-booking review flow is complete: schools can rate teachers, and ratings influence future ranking.

### Operational Readiness
- [ ] At least 5 schools and 20 teachers are onboarded with real data.
- [ ] The agency has processed at least 20 cover requests end-to-end through the platform (from submission to confirmed booking).
- [ ] No critical or high-severity bugs remain open.
- [ ] E2E tests pass on all critical paths (login, submit request, offer sequence, accept, decline, cancel).
- [ ] Sentry is configured and receiving error reports in production.
- [ ] Cron job for offer expiry is running reliably at 1-2 minute intervals.

### User Adoption (within 4 weeks of launch)
- [ ] At least 3 schools are actively submitting requests through the platform instead of phoning.
- [ ] At least 10 teachers have accepted or declined offers through their portal.
- [ ] At least 1 agency consultant is using the dashboard as their primary tool for morning rush processing.

### Quality Benchmarks
- [ ] Mean time-to-fill for platform-submitted requests is under 15 minutes.
- [ ] Zero double-booking incidents.
- [ ] System uptime exceeds 99% during operating hours (06:00-18:00 GMT Mon-Fri).
- [ ] No data loss incidents.

### User Satisfaction
- [ ] Qualitative feedback from at least 2 schools, 5 teachers, and 1 agency consultant confirms the platform is faster and more reliable than the previous phone-based workflow.
- [ ] No user-reported accessibility blockers that prevent task completion.

---

*This document is maintained by the QuickSupply product team at Desian Education. For questions or change requests, contact the project lead.*
