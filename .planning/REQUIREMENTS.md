# Requirements: QuickSupply

**Defined:** 2026-03-05
**Core Value:** Schools can submit a cover request and have it filled by the best available teacher through a sequential, real-time assignment workflow managed by the agency.

## v1 Requirements

Requirements to reach MVP-complete status. Each maps to roadmap phases.

### Real-Time UX (Polish)

- [ ] **RT-01**: Agency dashboard updates live when new requests are submitted, offers are sent, or bookings are confirmed — without page refresh
- [ ] **RT-02**: Teacher jobs page updates live when new offers arrive or existing offers expire — without page refresh
- [ ] **RT-03**: School dashboard updates live when request status changes (offering → filled) — without page refresh
- [ ] **RT-04**: Countdown timer on teacher offers syncs with server-side expiry via SSE events
- [ ] **RT-05**: Browser sends OS-level notification when teacher receives a new offer and tab is unfocused

### Responsive Design

- [ ] **RD-01**: Teacher portal renders mobile-first with bottom navigation bar and large tap targets
- [ ] **RD-02**: Agency dashboard is usable on tablet-sized screens (1024px+)
- [ ] **RD-03**: School portal forms and lists are responsive on mobile devices

### UI Polish

- [ ] **UI-01**: All server-component pages show shimmer loading skeletons while data loads
- [ ] **UI-02**: Empty states show illustrated components (no requests, no offers, no bookings) instead of plain text
- [ ] **UI-03**: Each route group has an error.tsx boundary that catches and displays errors gracefully

### Cover Request Enhancements

- [ ] **CR-01**: Cover request form shows availability status of preferred teacher for the selected date (available/unavailable/unknown)
- [ ] **CR-02**: Unavailable preferred teachers are visually greyed out with explanation text

### Agency Tools

- [ ] **AG-01**: Agency dashboard includes a persistent SMS log drawer showing all simulated SMS messages sent
- [ ] **AG-02**: Phone buttons open a call simulation modal with animated ringing state, connected state, and call timer
- [ ] **AG-03**: Assignment panel has a "Withdraw Current Offer" button that withdraws the active offer
- [ ] **AG-04**: Assignment panel auto-refreshes ranked teacher list when a teacher declines via SSE
- [ ] **AG-05**: Agency requests page supports filtering by status, date range, and text search
- [ ] **AG-06**: Agency teachers page supports filtering by role, compliance status, rating, and text search

### Notifications

- [ ] **NT-01**: Each portal nav bar includes a notification bell dropdown reading from notification_log table
- [ ] **NT-02**: Notification bell shows unread count badge
- [ ] **NT-03**: Clicking a notification marks it as read and navigates to the relevant resource

### Reviews

- [ ] **RV-01**: School history page shows a star-rating form for completed bookings that haven't been reviewed
- [ ] **RV-02**: Submitted reviews appear on the teacher's profile and factor into assignment engine scoring

### Input Validation

- [ ] **IV-01**: All API POST/PUT/PATCH routes validate request bodies with Zod schemas
- [ ] **IV-02**: Validation errors return structured error responses with field-level messages
- [ ] **IV-03**: Cover request form validates date is not in the past and time range is valid

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication Upgrade

- **AUTH-01**: Replace HMAC cookie sessions with signed JWT or NextAuth.js
- **AUTH-02**: Add OAuth login (Google) for teachers
- **AUTH-03**: Implement multi-factor authentication for agency staff

### Data Management

- **DATA-01**: Agency can create, edit, and delete teacher profiles via forms
- **DATA-02**: Agency can create, edit, and delete school records via forms
- **DATA-03**: Agency can manage teacher compliance status, expiry dates, and document uploads

### Advanced Features

- **ADV-01**: Multi-day booking support (date range instead of single date)
- **ADV-02**: Drag-and-drop agent-teacher reassignment on agents page
- **ADV-03**: Distance/travel time display on assignment panel with driving/walking icons
- **ADV-04**: Activity/audit log timeline on request detail page
- **ADV-05**: Dashboard analytics (fill rate %, average time-to-fill, teacher response rates)

### Production Infrastructure

- **PROD-01**: Migrate from SQLite to PostgreSQL with connection pooling
- **PROD-02**: Real SMS integration via Twilio or AWS SNS
- **PROD-03**: Background job runner (BullMQ/Inngest) for offer expiry and notifications
- **PROD-04**: Unit tests for assignment engine scoring algorithm
- **PROD-05**: Integration tests for full request → assign → booking workflow

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first; responsive design covers mobile use cases |
| Real-time chat between portals | SSE notifications sufficient; chat adds complexity |
| Video calling | Phone simulation adequate for demo; real telephony is v2+ |
| Multi-agency support | Single agency (Desian Education) for v1 |
| Payroll/invoicing | Out of scope for scheduling app; separate system |
| Teacher self-registration | All teachers onboarded by agency for v1 |
| Geofencing/GPS tracking | Location is pre-set in profiles; live tracking not needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RT-01 | Phase 1 | Pending |
| RT-02 | Phase 1 | Pending |
| RT-03 | Phase 1 | Pending |
| RT-04 | Phase 1 | Pending |
| RT-05 | Phase 1 | Pending |
| RD-01 | Phase 2 | Pending |
| RD-02 | Phase 2 | Pending |
| RD-03 | Phase 2 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |
| CR-01 | Phase 3 | Pending |
| CR-02 | Phase 3 | Pending |
| AG-01 | Phase 3 | Pending |
| AG-02 | Phase 3 | Pending |
| AG-03 | Phase 3 | Pending |
| AG-04 | Phase 3 | Pending |
| AG-05 | Phase 4 | Pending |
| AG-06 | Phase 4 | Pending |
| NT-01 | Phase 4 | Pending |
| NT-02 | Phase 4 | Pending |
| NT-03 | Phase 4 | Pending |
| RV-01 | Phase 5 | Pending |
| RV-02 | Phase 5 | Pending |
| IV-01 | Phase 5 | Pending |
| IV-02 | Phase 5 | Pending |
| IV-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 after GSD initialization (brownfield)*
