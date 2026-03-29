# QuickSupply -- Brainstorming Session

**Date:** 2026-03-27
**Product:** QuickSupply by Desian Education
**Domain:** Supply teaching workforce scheduling platform
**Participants:** Product & Engineering

---

## 1. Current Product Capabilities

QuickSupply is a three-portal web application (Agency, School, Teacher) built on Next.js 16 with a SQLite/Drizzle ORM backend. It automates the core workflow of a supply teaching agency -- matching schools that need cover with available teachers.

### What exists today

**Agency portal (primary operator)**
- Dashboard with live overview of requests, bookings, and offers
- Teacher management: CRUD, compliance tracking (DBS status, right-to-work), agency rating, activation/deactivation, credential management
- School management: CRUD, contact details, geolocation, phase classification, credential management, activation/deactivation
- Cover request pipeline: view all requests, drill into individual requests, see ranked teacher lists, start automated offering sequences, manually assign teachers, withdraw offers, cancel bookings
- Agent management: multiple agency staff accounts with admin flag
- Configurable settings (response windows, offer timing)
- Bookings list view
- Real-time SSE event stream for live updates
- In-app notification system with read/unread tracking

**School portal**
- Dashboard showing active requests and bookings
- Create new cover requests (date, role type, subject/key stage, time window, preferred teacher, emergency flag, notes)
- Request history
- Review system: rate teachers after bookings (1-5 stars, comment, would-rebook toggle)
- Real-time SSE updates when requests are filled

**Teacher portal**
- Dashboard with upcoming jobs and pending offers
- Jobs page: view and respond to offers (accept/decline)
- Availability calendar: set recurring weekly patterns and date-specific overrides
- Profile management (contact details, travel preferences, role type, emergency availability, long-term willingness)
- Real-time SSE updates for new offers

**Assignment engine**
- Multi-factor teacher ranking: preferred teacher bonus, agency rating, school-specific review average, distance (haversine), driving ability, previous experience at the school
- Hard filters: role match, compliance status, blacklist, existing bookings, availability, max travel distance, emergency availability, contact-night-before preference
- Sequential offering with configurable response windows (separate timers for emergency vs. next-day)
- Automatic cascade: when a teacher declines or an offer expires, the system auto-advances to the next ranked teacher
- Manual assignment override for agency staff
- Offer withdrawal and booking cancellation flows

**Infrastructure**
- Authentication with bcrypt password hashing, cookie-based sessions
- Password reset flow (forgot-password with email via Resend)
- Rate limiting (Upstash Redis)
- Sentry error monitoring
- Cron endpoint for expired offer checking
- Playwright E2E test suite
- Privacy policy page
- Health check endpoint

---

## 2. Gap Analysis -- What Is Missing for Production Readiness

### Critical gaps

| Area | Gap | Severity |
|------|-----|----------|
| **Database** | SQLite (better-sqlite3) is single-writer, not suitable for concurrent production workloads. No connection pooling, no horizontal scaling. | Critical |
| **Authentication** | Custom cookie-based auth with no CSRF tokens visible, no session expiry/rotation, no MFA. | Critical |
| **Deployment** | No Dockerfile, no CI/CD pipeline, no environment configuration management beyond .env. | High |
| **Data validation** | Zod is installed but coverage of API input validation across all routes is unclear. | High |
| **Audit trail** | No logging of who changed what, when. No admin action history. Compliance-sensitive operations lack an audit log. | High |
| **File uploads** | No document storage (DBS certificates, CVs, qualification evidence). Only metadata fields exist. | High |
| **Multi-tenancy** | Hardcoded to a single agency. No tenant isolation. | Medium |
| **Backup & recovery** | SQLite file on disk with no backup strategy. | Critical |
| **Accessibility** | No evidence of WCAG compliance testing. | Medium |
| **Internationalisation** | Hardcoded English strings. Date/time formatting is ISO-based, not locale-aware. | Low |

### Functional gaps

- **No timesheet or payroll tracking** -- bookings are confirmed but hours worked and payment are untracked.
- **No invoicing or financial data** -- pay rates, margins, and school billing are absent.
- **No reporting or analytics** -- no aggregate views of fill rates, response times, teacher utilisation, or revenue.
- **No document upload** -- DBS status is a text enum; there is no way to upload or store the actual certificate.
- **No SMS/push notifications** -- only in-app notifications and email (Resend). Teachers who are not logged in will miss urgent offers.
- **No teacher-side school reviews** -- the review system is one-directional (school reviews teacher).
- **No long-term/multi-day booking support** -- each cover request is a single date.
- **No calendar export** -- teachers cannot sync bookings to Google Calendar or iCal.
- **No search or filtering** on list pages (teachers, schools, requests).

---

## 3. Feature Ideas -- Near-term (0-3 months)

### 3.1 Reporting & Analytics Dashboard for Agencies

**Problem:** Agency managers have no visibility into operational KPIs. They cannot answer "What is our fill rate this month?" or "Which teachers decline the most?"

**Proposed features:**
- Fill rate by week/month (requests filled vs. total)
- Average time-to-fill (request created to booking confirmed)
- Teacher response rates and average response times
- Offer cascade depth (how many teachers are typically offered before one accepts)
- School activity breakdown (requests per school, repeat vs. new)
- Teacher utilisation heat map (days worked per teacher per month)
- Exportable CSV/PDF reports

**Technical notes:** All data already exists in the `cover_requests`, `assignment_offers`, and `bookings` tables. This is primarily a read-side feature with aggregation queries.

### 3.2 Timesheet Management and Payroll Integration

**Problem:** After a booking is confirmed and the day passes, there is no way to record actual hours worked, handle early finishes or no-shows, or generate payroll data.

**Proposed features:**
- Post-booking timesheet entry: actual start/end time, break deductions
- School confirmation of hours (digital sign-off)
- Timesheet status workflow: submitted, school-approved, agency-approved, paid
- Weekly timesheet summary for teachers
- Export to payroll systems (CSV initially, API integration later)
- Pay rate configuration per teacher and per school/role

**New schema:** `timesheets` table linked to `bookings`, with status enum and approval timestamps.

### 3.3 Teacher Availability Calendar Improvements

**Problem:** The current availability system supports recurring weekly patterns and date overrides, but lacks features teachers expect from a modern scheduling tool.

**Proposed features:**
- Visual month-view calendar showing availability, bookings, and offers in a unified view
- Bulk date selection (e.g., "mark entire half-term as unavailable")
- Holiday/term-date awareness (auto-grey-out school holidays)
- "Preferred schools" or "preferred areas" for specific days
- Calendar sync: export bookings as .ics feed for Google Calendar / Outlook
- Availability sharing: teachers can send a link to their availability (read-only)

### 3.4 Push Notifications (Mobile PWA)

**Problem:** Teachers miss time-sensitive offers because they are not logged into the web app. The current SSE-based notification system requires an open browser tab. Emergency offers with 7-minute windows are especially vulnerable.

**Proposed features:**
- Service worker registration for web push (VAPID keys)
- Push notification for: new offer, offer expiring soon, booking confirmed, booking cancelled
- Notification preferences: teachers can opt in/out per category
- PWA manifest with install prompt for "Add to Home Screen"
- Offline indicator and graceful degradation

**Technical notes:** Next.js 16 supports service workers. Web Push API + a push service (e.g., web-push npm package) would replace or supplement SSE for critical alerts.

### 3.5 Multi-Agency Support

**Problem:** The system is hardcoded for a single agency operation. There is no tenant isolation -- all agents see all data.

**Proposed features:**
- Agency entity with branding (name, logo, primary colour)
- All core tables gain an `agency_id` foreign key
- Scoped queries: agents only see their own agency's teachers, schools, and requests
- Super-admin role for platform-level management
- Per-agency configuration (response windows, branding, email templates)

**Technical notes:** This is a significant schema migration. A phased approach is advisable -- add the column as nullable first, backfill, then enforce NOT NULL.

---

## 4. Feature Ideas -- Medium-term (3-9 months)

### 4.1 Mobile App (React Native or Enhanced PWA)

**Problem:** Supply teachers are mobile-first users. They check their phone at 6:30 AM to see if they have work. A full native or near-native mobile experience is expected.

**Options:**
- **Enhanced PWA** (lower cost): service worker caching, offline support, home-screen install, push notifications. Reuses existing Next.js codebase.
- **React Native** (higher fidelity): shared TypeScript types, dedicated mobile UX, native push, biometric login. Requires a separate codebase and API-first backend.

**Recommendation:** Start with PWA. If adoption metrics justify it, build React Native for teacher portal only (the highest-frequency mobile use case).

### 4.2 Automated Compliance Document Management

**Problem:** DBS certificates, right-to-work documents, and qualification evidence are currently tracked as enum fields (e.g., `dbs_status: "clear"`) with no actual document storage. Agencies are legally required to hold copies of these documents and track expiry dates.

**Proposed features:**
- Document upload with categorisation (DBS, right-to-work, QTS, references, safeguarding)
- Expiry date tracking with automated alerts (30-day, 14-day, 7-day warnings)
- Auto-transition of compliance status when a document expires
- Document viewer in agency portal (PDF/image preview)
- Bulk compliance report: which teachers have expiring documents this month
- Integration with DBS Update Service API for real-time status checks

**Technical notes:** Requires file storage (S3 or similar), a `documents` table, and a cron job for expiry checks.

### 4.3 School Rating/Review System for Teachers

**Problem:** Reviews are one-directional. Teachers have no structured way to flag issues at schools (poor facilities, late communication, safety concerns). This creates an information asymmetry.

**Proposed features:**
- Post-booking teacher-to-school review (rating + comment)
- Reviews visible only to agency staff (not publicly visible to schools -- avoids retaliation concerns)
- Agency dashboard: flag schools with consistently low teacher ratings
- Optional: anonymous aggregated feedback shared with schools ("Your average teacher rating is 3.2/5")

**Schema change:** New `teacher_school_reviews` table, mirroring the existing `school_teacher_reviews` structure.

### 4.4 Financial Module (Invoicing, Pay Rates, Margins)

**Problem:** The platform tracks bookings but not money. Agencies need to invoice schools and pay teachers, tracking margins per booking.

**Proposed features:**
- Pay rate configuration: per-teacher base rate, per-school charge rate, role-based modifiers
- Automatic margin calculation per booking
- Invoice generation: weekly or monthly school invoices with booking line items
- Teacher pay statements
- Financial dashboard: revenue, cost, margin by period
- Integration hooks for accounting software (Xero, QuickBooks -- CSV export initially)

**New schema:** `pay_rates`, `invoices`, `invoice_lines`, `pay_runs` tables.

### 4.5 Geographic Mapping and Route Optimisation

**Problem:** The system calculates haversine distance but does not account for actual travel time, traffic, or public transport accessibility. Teachers who do not drive may be close by air but far by bus.

**Proposed features:**
- Map view of teachers relative to a school (using Mapbox or Google Maps)
- Driving/transit time estimates via routing API
- Teacher ranking factor: replace raw distance with estimated travel time
- Cluster visualisation: show agency coverage by area
- "Dead zones" identification: areas with schools but no nearby teachers

---

## 5. Feature Ideas -- Long-term (9-18 months)

### 5.1 AI-Powered Teacher Matching

**Problem:** The current ranking algorithm is rule-based with fixed weights (preferred +200, rating x20, distance-based, etc.). It does not learn from outcomes.

**Proposed approach:**
- Train a model on historical booking outcomes: which teacher-school pairings lead to high reviews, re-bookings, and low cancellations
- Factor in implicit signals: response speed patterns, time-of-day preferences, subject expertise inferred from booking history
- Predict teacher likelihood of accepting an offer (reduce cascade depth)
- Recommend optimal offer timing (some teachers respond faster in the evening vs. early morning)
- A/B test AI ranking against current rule-based ranking

**Technical considerations:** Start with a simple logistic regression or gradient-boosted model. Feature engineering from existing data. Run inference at ranking time. Could use a lightweight ML library server-side or call an external prediction API.

### 5.2 Predictive Demand Forecasting for Schools

**Problem:** Schools often submit cover requests at the last minute. Agencies could staff more effectively if they could predict demand.

**Proposed features:**
- Historical demand patterns per school (e.g., "School X averages 3 requests per week in January")
- Seasonal trend analysis (flu season, SATs period, end-of-term)
- Proactive teacher pre-allocation: suggest teachers to keep available based on predicted demand
- Alerts: "Based on historical patterns, School X is likely to need cover tomorrow -- ensure teachers are available in the area"
- Integration with school absence data if available

### 5.3 Integration with School MIS Systems (SIMS, Arbor)

**Problem:** Schools currently submit cover requests manually through the QuickSupply portal. If they already record staff absences in their Management Information System, this creates double-entry.

**Proposed features:**
- API integration with Arbor (REST API available) and SIMS (via Wonde middleware)
- Auto-create cover requests when a school marks a teacher as absent in their MIS
- Sync booking confirmations back to the MIS
- Pull school timetable data to auto-populate subject and key stage fields

**Considerations:** MIS integrations are complex and vary per school. Wonde provides a standardised abstraction layer over multiple MIS platforms and would be the recommended integration partner.

### 5.4 White-Label Solution for Different Agencies

**Problem:** Multiple supply teaching agencies operate with similar workflows. A white-label version of QuickSupply could be sold as SaaS.

**Proposed features:**
- Configurable branding: logo, colours, email templates, domain
- Per-tenant feature flags
- Isolated data with shared infrastructure (multi-tenant architecture from section 3.5 is a prerequisite)
- Self-service agency onboarding
- Tiered pricing based on teacher count or booking volume
- Custom domain support with SSL

**Business model shift:** From internal tool to B2B SaaS product. Requires significant investment in ops, billing, and support.

### 5.5 Marketplace Mode (Direct School-to-Teacher)

**Problem:** Some schools and teachers may prefer a direct relationship without agency intermediation, particularly for long-term or recurring arrangements.

**Proposed features:**
- "Marketplace" tier where schools can browse compliant teachers directly
- Teachers set their own day rates
- Platform takes a transaction fee instead of a margin
- Hybrid model: agency-managed teachers coexist with self-managed teachers
- Automated compliance verification remains platform-managed

**Risks:** This cannibalises the core agency business model. Should only be pursued if the strategic direction is to become a platform rather than an agency tool. Would require careful positioning and possibly a separate product brand.

---

## 6. Product Vision -- QuickSupply in 12 Months

By March 2027, QuickSupply should be a **production-grade, mobile-ready supply teaching platform** that handles the complete operational lifecycle: from cover request through teacher matching, booking confirmation, timesheet submission, to invoicing and payment.

### Target state

- **Database:** Migrated from SQLite to PostgreSQL (or Turso/LibSQL for edge compatibility), deployed on managed infrastructure with automated backups.
- **Mobile:** PWA with push notifications, installable on teacher phones. Teachers can accept offers, view schedules, and submit timesheets from their phone in under 30 seconds.
- **Compliance:** Document upload and expiry tracking fully operational. Agencies can demonstrate regulatory compliance with a single report.
- **Financial:** Pay rates, invoicing, and margin tracking built in. Agencies can generate weekly invoices and teacher pay runs without leaving the platform.
- **Analytics:** Agency managers have a dashboard showing fill rates, response times, teacher utilisation, and revenue -- updated in real time.
- **Scale:** Multi-agency architecture in place, with at least one external agency onboarded as a pilot customer beyond Desian Education.

### Key metrics to target

| Metric | Current | 12-Month Target |
|--------|---------|-----------------|
| Time from request to booking | Unknown (untracked) | < 15 minutes (non-emergency) |
| Teacher offer acceptance rate | Unknown | > 70% on first offer |
| Mobile offer response rate | N/A (no mobile) | > 85% within response window |
| Fill rate | Unknown | > 95% |
| Schools onboarded | Seed data | 50+ active schools |
| Teachers on platform | Seed data | 200+ compliant teachers |

---

## 7. Risk Assessment

### Technical risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **SQLite breaks under concurrent load** | High | Critical | Migrate to PostgreSQL or Turso before scaling beyond a single agency. This is the single most urgent technical risk. |
| **SSE connections do not scale** | Medium | High | SSE works for tens of users but not hundreds. Evaluate Redis Pub/Sub or a managed WebSocket service (e.g., Ably, Pusher) as user count grows. |
| **No automated backups** | High | Critical | A corrupted or lost SQLite file means total data loss. Implement daily backups immediately, even before a DB migration. |
| **Custom auth vulnerabilities** | Medium | Critical | The auth system is hand-rolled. Consider migrating to a proven auth library (NextAuth/Auth.js, Clerk, or Lucia) to reduce attack surface. |
| **Single-server deployment** | High | High | The app appears designed for single-process deployment. Add health checks, graceful shutdown, and consider containerisation for reliability. |
| **No CI/CD pipeline** | Medium | Medium | Manual deployments increase risk of human error. Set up GitHub Actions for lint, test, build, and deploy. |

### Market risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Established competitors** (ClassCover, Teacher Booker, Eteach) | High | High | Differentiate on speed (AI matching, instant offers) and agency-first design. Avoid competing on price alone. |
| **Schools prefer direct hiring** | Medium | Medium | The marketplace mode (section 5.5) hedges this risk, but should be pursued cautiously. |
| **Low teacher adoption** | Medium | High | Mobile PWA with push notifications is essential. Teachers will not check a desktop website at 6:30 AM. |
| **Agency resistance to new tools** | Medium | Medium | Offer white-glove onboarding, data migration, and a parallel-run period where the old process runs alongside QuickSupply. |

### Regulatory risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Safeguarding non-compliance** | Low (if managed) | Critical | DBS certificate tracking is metadata-only today. Must add document uploads and expiry enforcement before going live with real schools. Keeping Children Safe in Education (KCSIE) requirements are non-negotiable. |
| **GDPR / data protection** | Medium | High | Teacher PII (addresses, phone numbers, DBS data) is stored. Need: data retention policy, right-to-erasure workflow, data processing agreements with schools, privacy impact assessment. A privacy page exists but operational GDPR processes do not. |
| **IR35 / employment status** | Low | Medium | Supply teachers are typically employed by the agency, not self-employed. The platform should not inadvertently create an employment relationship between school and teacher. Legal review needed before marketplace mode. |
| **Agency Worker Regulations (AWR)** | Medium | High | After 12 weeks in the same school, supply workers gain equal pay rights. The platform should track cumulative weeks per teacher-school pair and alert agencies approaching the 12-week threshold. |

---

## Appendix: Current Technical Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Radix UI, Tailwind CSS 4, Lucide icons |
| Database | SQLite via better-sqlite3 |
| ORM | Drizzle ORM 0.45 |
| Auth | Custom (bcrypt, cookie sessions) |
| Email | Resend |
| Real-time | Server-Sent Events (custom SSE manager) |
| Rate limiting | Upstash Redis |
| Monitoring | Sentry |
| Forms | React Hook Form + Zod |
| Testing | Playwright (E2E) |
| IDs | ULID |
