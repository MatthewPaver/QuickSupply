# Roadmap: QuickSupply

## Overview

QuickSupply is demo-ready but not yet MVP-complete. This roadmap addresses the 27 remaining v1 requirements across 5 phases, progressing from real-time infrastructure (the foundation everything else needs) through responsive design, agency tooling, notifications/search, and finally validation/reviews. Each phase builds on the previous, delivering incrementally testable value.

## Phases

- [x] **Phase 1: Real-Time & SSE Integration** - Already implemented: SSE hooks in all portals, countdown timers, browser notifications
- [ ] **Phase 2: Responsive Design & UI Polish** - Mobile-first teacher portal, loading skeletons, empty states, error boundaries
- [ ] **Phase 3: Agency Tools & Cover Request Enhancements** - SMS drawer, call modal, withdraw offer, auto-refresh, preferred teacher availability
- [ ] **Phase 4: Notifications & Search** - Notification bell with unread count, filter/search on agency pages
- [ ] **Phase 5: Reviews & Input Validation** - School review forms, Zod validation on all API routes

## Phase Details

### Phase 1: Real-Time & SSE Integration
**Goal**: All three portals update in real-time without page refresh; countdown timers are accurate; teachers get OS notifications for new offers
**Depends on**: Nothing (first phase)
**Requirements**: RT-01, RT-02, RT-03, RT-04, RT-05
**Success Criteria** (what must be TRUE):
  1. Agency dashboard shows new requests and offer events without page refresh
  2. Teacher jobs page shows new offers appearing and expiring in real-time
  3. School dashboard reflects request status changes (offering → filled) live
  4. Countdown timer matches server-side expiry within 1 second accuracy
  5. Browser notification fires when teacher receives offer with tab unfocused
**Plans**: TBD

Plans:
- [x] 01-01: Integrate use-sse hook into agency dashboard with event handlers (pre-existing)
- [x] 01-02: Integrate use-sse hook into teacher jobs page with countdown sync (pre-existing)
- [x] 01-03: Integrate use-sse hook into school dashboard and add Browser Notification API (pre-existing)

### Phase 2: Responsive Design & UI Polish
**Goal**: Teacher portal is mobile-first; all portals show polished loading and error states
**Depends on**: Phase 1 (SSE hooks must work before polishing around them)
**Requirements**: RD-01, RD-02, RD-03, UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. Teacher portal renders correctly on 375px-wide viewport with bottom navigation
  2. Agency dashboard is usable on 1024px tablet viewport
  3. All server-component pages show skeleton loading states
  4. Empty pages show illustrated empty states
  5. Route errors are caught by error.tsx boundaries and display recovery UI
**Plans**: TBD

Plans:
- [ ] 02-01: Mobile-responsive teacher portal with bottom nav bar
- [ ] 02-02: Responsive agency dashboard and school portal
- [ ] 02-03: Loading skeletons, empty states, and error boundaries across all routes

### Phase 3: Agency Tools & Cover Request Enhancements
**Goal**: Agency has full simulation tools (SMS, calls) and cover request form checks preferred teacher availability
**Depends on**: Phase 1 (auto-refresh needs SSE), Phase 2 (responsive layout)
**Requirements**: CR-01, CR-02, AG-01, AG-02, AG-03, AG-04
**Success Criteria** (what must be TRUE):
  1. Cover request form shows preferred teacher availability for selected date
  2. SMS log drawer opens from agency dashboard showing all simulated messages
  3. Phone buttons open call simulation modal with ringing animation and timer
  4. "Withdraw Current Offer" button appears on active offers in assignment panel
  5. Assignment panel refreshes automatically when teacher declines
**Plans**: TBD

Plans:
- [ ] 03-01: Preferred teacher availability check on cover request form
- [ ] 03-02: SMS log drawer and call simulation modal
- [ ] 03-03: Withdraw offer button and auto-refresh assignment panel on decline

### Phase 4: Notifications & Search
**Goal**: All portals have notification bells; agency pages support filtering and searching
**Depends on**: Phase 1 (SSE for real-time notification count)
**Requirements**: AG-05, AG-06, NT-01, NT-02, NT-03
**Success Criteria** (what must be TRUE):
  1. Notification bell visible in all three portal nav bars
  2. Unread count badge updates in real-time
  3. Clicking a notification marks it read and navigates to the resource
  4. Agency requests page can be filtered by status, date range, and text
  5. Agency teachers page can be filtered by role, compliance, rating, and text
**Plans**: TBD

Plans:
- [ ] 04-01: Notification bell component with dropdown and unread count
- [ ] 04-02: Filter/search on agency requests and teachers pages

### Phase 5: Reviews & Input Validation
**Goal**: Schools can review teachers; all API routes have comprehensive input validation
**Depends on**: Phase 2 (responsive forms), Phase 4 (notification for review reminders)
**Requirements**: RV-01, RV-02, IV-01, IV-02, IV-03
**Success Criteria** (what must be TRUE):
  1. School history page shows star-rating form for unreviewed completed bookings
  2. Submitted review appears on teacher profile and affects assignment engine score
  3. All API POST/PUT/PATCH routes reject invalid payloads with structured Zod errors
  4. Cover request form rejects past dates and invalid time ranges
**Plans**: TBD

Plans:
- [ ] 05-01: School teacher review form and integration with assignment engine
- [ ] 05-02: Zod validation schemas on all API routes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Real-Time & SSE Integration | 3/3 | Complete | 2026-03-06 (pre-existing) |
| 2. Responsive Design & UI Polish | 0/3 | Not started | - |
| 3. Agency Tools & Cover Request Enhancements | 0/3 | Not started | - |
| 4. Notifications & Search | 0/2 | Not started | - |
| 5. Reviews & Input Validation | 0/2 | Not started | - |
