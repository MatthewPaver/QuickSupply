# QuickSupply Implementation Readiness Report

**Date:** 2026-03-27
**Scope:** Cross-artifact alignment check for MVP + V2 planning
**Artifacts Reviewed:** PRD, Architecture, Epics & Stories, UX Design

---

## 1. PRD <> Architecture Alignment

### Functional Requirements with Clear Architectural Support

All MVP functional requirements in the PRD (Sections 6.1-6.6) have corresponding architectural support:

| PRD Area | Architecture Coverage |
|---|---|
| Three-portal auth (SCH-AUTH, TCH-AUTH, AGN-AUTH) | Cookie-based sessions, HMAC-SHA256 signing, role-based access control matrix (Architecture Section 7) |
| Cover request submission (SCH-REQ) | API route `POST /api/requests`, Zod validation, SSE event `new_request` |
| Sequential assignment engine (ASN-01 through ASN-07) | Full business logic layer (Architecture Section 6.1) with ranking algorithm, hard filters, sequential offer flow, and cron-based expiry |
| Teacher availability (TCH-AVAIL) | `teacher_availability` table with date/day-of-week pattern, API routes under `/api/teacher/availability` |
| Notifications (NOTIF-01 through NOTIF-05) | Dual-channel system: persistent `notification_log` + SSE + optional email via Resend (Architecture Section 6.2) |
| Reviews (SCH-REV) | `school_teacher_reviews` table, `POST /api/school/reviews`, rating recalculation into `agency_rating` (Architecture Section 6.3) |
| Rate limiting (AUTH-04, SEC-04) | Upstash Redis with in-memory fallback, four rate-limit rules defined (Architecture Section 7.3) |
| Password reset (AUTH-06) | `password_reset_tokens` table with hashed tokens, Resend email dispatch, dedicated API routes |

### PRD Requirements Not Addressed by Architecture

| Gap | Severity | Notes |
|---|---|---|
| **AGN-SMS-01 (SMS Log)** | Low | PRD mentions an SMS log viewer. Architecture lists `/api/agency/sms-log` as a "placeholder" endpoint. No SMS sending infrastructure is documented. Acceptable for MVP since actual SMS sending is V2 (V2-PUSH-03). |
| **SCH-REQ-04 (Deactivated school 403)** | None | Covered implicitly by RBAC section (deactivated schools blocked from login and requests). |

**Verdict:** No significant gaps. All PRD functional requirements have architectural backing.

### Architecture Decisions Not Driven by PRD Requirements

| Decision | Assessment |
|---|---|
| ADR-006: ULID Primary Keys | Not explicitly required by PRD, but a sound technical decision. No conflict. |
| ADR-007: No Middleware.ts | Implementation constraint driven by the SQLite + Edge Runtime incompatibility. Not a PRD concern. |
| ADR-010: OKLCh Color Space | Design system decision, not a PRD requirement. Aligns with A11Y-04 (contrast ratios). |
| Scalability Path (Section 9) | Forward-looking. Aligns with SCALE-02 (PostgreSQL migration path) and V2-MULTI-03. |

**Verdict:** All architecture-only decisions are justified technical choices. None contradict PRD requirements.

---

## 2. PRD <> Epics/Stories Alignment

### Critical Finding: Epics & Stories Cover V2 Only

The Epics & Stories document explicitly states its baseline as "MVP (auth, school/teacher/agency portals, assignment engine, SSE notifications, reviews)" and covers **only V2 roadmap features**. There are no stories for MVP functional requirements.

This is **by design** -- the PRD Section 8 states that all MVP features are "implemented and functional in the current codebase." The epics/stories document is a V2 planning artifact, not an MVP backlog.

### V2 PRD Requirements Covered by Stories

| PRD V2 Requirement | Stories Covering It |
|---|---|
| V2-ANA-01: Agency analytics dashboard | 1.1, 1.2, 1.3, 1.5 |
| V2-ANA-02: School-level reporting | 1.4 |
| V2-ANA-03: Teacher-level reporting | 1.2, 1.3 |
| V2-ANA-04: Exportable reports | Not explicitly covered (see gaps below) |
| V2-TIM-01: Timesheet submission | 2.1 |
| V2-TIM-02: School sign-off on timesheets | Not covered (see gaps below) |
| V2-TIM-03: Agency timesheet dashboard | 2.2 |
| V2-TIM-04: Export for payroll/invoicing | 2.4 (invoice generation) |
| V2-DOC-01: Document upload/storage | 3.1 |
| V2-DOC-02: Automated compliance alerts | 3.2 |
| V2-DOC-03: Compliance dashboard | 3.4 |
| V2-DOC-04: Compliance history log | 3.3 (verification workflow includes audit trail) |
| V2-PUSH-01: Web push notifications | 4.2 |
| V2-PUSH-02: PWA manifest | 4.4 |
| V2-PUSH-03: SMS notifications | Not covered (see gaps below) |
| V2-SCHED-01: Multi-day bookings | Not covered (see gaps below) |
| V2-SCHED-02: Recurring request templates | Not covered (see gaps below) |
| V2-SCHED-03: Calendar views | Not covered (see gaps below) |
| V2-MULTI-01: Tenant isolation | 6.1 |
| V2-MULTI-02: Agency onboarding | 6.2 |
| V2-MULTI-03: PostgreSQL migration | 6.1 (mentioned in technical notes) |

### Stories Not Traced to PRD V2 Requirements

| Story | Assessment |
|---|---|
| 2.3: Pay Rate Management | Not in PRD. Extends the timesheet concept into financial territory. Reasonable addition. |
| 2.5: Margin Tracking | Not in PRD. Business intelligence feature beyond PRD scope. |
| 4.3: Offline Support | Not in PRD V2. Logical extension of PWA work. |
| 4.5: Notification Preferences | Not in PRD. Good UX enhancement for notification system. |
| 5.1-5.4: Enhanced Teacher Matching | Not in PRD V2. These extend the existing assignment engine. Valuable but unplanned. |
| 6.3: Cross-Agency Teacher Sharing | Not in PRD. Ambitious feature beyond basic multi-tenancy. |
| 6.4: Agency Branding | Not in PRD. Natural complement to multi-agency support. |

### Gap Analysis

| Missing Coverage | PRD Ref | Severity |
|---|---|---|
| **Exportable CSV/PDF reports** | V2-ANA-04 | Medium -- no story covers the generic export capability for analytics |
| **School sign-off on timesheets** | V2-TIM-02 | High -- this is a core part of the timesheet workflow and has no story |
| **SMS notifications for offers** | V2-PUSH-03 | Medium -- PRD calls this out specifically; no story addresses SMS integration |
| **Multi-day/long-term bookings** | V2-SCHED-01 | Medium -- significant feature with no story coverage |
| **Recurring request templates** | V2-SCHED-02 | Low -- convenience feature |
| **Calendar views** | V2-SCHED-03 | Medium -- called out in PRD but no story |

---

## 3. Architecture <> Stories Alignment

### Stories Aligned with Architecture Decisions

| Story | Architecture Alignment |
|---|---|
| 1.x (Analytics) | Queries against existing schema via Drizzle ORM. New API endpoints follow established patterns. Chart library (Recharts) is client-side, consistent with RSC architecture. |
| 2.x (Timesheets) | New tables follow existing patterns (ULID PKs, Drizzle schema, migrations). API routes follow `/api/agency/*` namespace convention. |
| 3.x (Compliance Docs) | File storage on local filesystem aligns with the VPS deployment model (Architecture Section 8.1). Notes mention future S3 migration. |
| 4.x (PWA/Push) | Service worker and Web Push are browser APIs that don't conflict with the Next.js architecture. `web-push` npm package runs server-side in Node.js runtime. |
| 6.1 (Multi-tenancy) | Story correctly identifies the need to add `agencyId` FK across all tables. Architecture Section 9 already documents the PostgreSQL migration path. |

### Stories Requiring Undocumented Architectural Changes

| Story | Undocumented Change | Severity |
|---|---|---|
| **3.1 (DBS Certificate Upload)** | File upload handling is not documented in the architecture. The API layer (Section 5) only describes JSON request/response patterns. Multipart form upload, file validation, and storage directory management need architectural documentation. | Medium |
| **4.1 (Service Worker)** | Service worker cache strategy and its interaction with Next.js RSC streaming are not addressed. The architecture's SSE system may need special handling to work correctly with service worker interception. | Medium |
| **6.1 (Multi-tenancy)** | The `agencyId` injection middleware pattern described in the story ("middleware extracts agencyId from session and injects into all data access functions") contradicts ADR-007 (no middleware.ts). The story likely means application-level middleware functions, not Next.js middleware, but this should be clarified. | Low |
| **2.4 (Invoice PDF Generation)** | Server-side PDF generation adds a new dependency type not covered in the architecture's technology decisions table. | Low |

---

## 4. UX <> Stories Alignment

### Stories Referencing UX Design System

The UX design document describes the MVP design system. V2 stories should build on these established patterns:

| Story | UX Alignment |
|---|---|
| 1.5 (Analytics Dashboard) | Should use Card components for metric cards, skeleton loading via `DashboardSkeleton`, and chart colors from the UX chart palette (`--chart-1` through `--chart-5`). Story mentions Suspense boundaries -- aligns with UX Section 4.5. |
| 2.1 (Timesheet Submission) | Form submission should follow the async pattern (UX Section 4.1): loading state, toast feedback, validation hints. |
| 3.4 (Compliance Dashboard) | New agency sidebar item ("Compliance") -- should follow `ActiveLinkButton` pattern from `nav-config.tsx`. StatusBadge already supports compliance statuses (`compliant`, `pending-compliance`, `expired-compliance`). |
| 4.4 (Install Prompt) | Custom install banner should use the existing toast or Card component patterns rather than introducing a new notification paradigm. |

### UX Patterns Not Addressed by Any Story

| UX Pattern | Assessment |
|---|---|
| **Dark Mode** (UX Section 7) | No story covers dark mode implementation. The UX document provides detailed implementation guidance. Consider adding a story if dark mode is desired for V2. |
| **CallModal** | Already implemented in MVP. No V2 story modifies it. |
| **CookieBanner** | Already implemented. No changes needed. |

### UX Gaps in Stories

| Story | UX Gap |
|---|---|
| **3.1 (Document Upload)** | No mention of drag-and-drop upload UX, file preview, or progress indicator patterns. These are common expectations for document upload interfaces and should be designed. |
| **4.2 (Push Notification Opt-In)** | The toggle interaction pattern should be specified -- is it a Switch component (not currently in the UI library), a toggle button pair, or something else? |
| **1.1 (Fill Rate Chart)** | Chart interaction patterns (hover tooltips, date range picker) are not part of the existing UX design system. A chart component specification should be added. |

---

## 5. Readiness Checklist

- [x] **PRD is complete and approved** -- Comprehensive PRD covering all three portals, cross-cutting concerns, NFRs, constraints, and success criteria.
- [x] **Architecture covers all technical decisions** -- 10 ADRs, full data model, API route structure, security architecture, deployment guide, and scalability path.
- [x] **All MVP requirements have corresponding stories** -- N/A: MVP is already implemented. The PRD Section 8 confirms all MVP features are built.
- [ ] **V2 epics are properly scoped and prioritized** -- Partially. Six epics with 24 stories are well-structured with P1/P2/P3 priorities and size estimates. However, five PRD V2 requirements lack story coverage (see Section 2 gaps).
- [x] **UX design system is documented** -- Thorough design system covering colors, typography, spacing, components, layout patterns, interaction patterns, and accessibility.
- [x] **Non-functional requirements are testable** -- Performance targets (PERF-01 through PERF-05) have specific numeric thresholds. Security requirements are concrete. Accessibility target (WCAG 2.1 AA) is measurable.
- [x] **Security requirements are addressed in architecture** -- Architecture Section 7 covers sessions, password hashing, rate limiting, CSRF, input validation, RBAC, and additional hardening measures.
- [x] **Data model supports all functional requirements** -- Complete ER diagram with all entities, relationships, key design decisions, indexing strategy, and migration history.

---

## 6. Risks & Gaps

### Misalignments Found

| # | Misalignment | Severity | Recommended Action |
|---|---|---|---|
| 1 | **Missing story: School timesheet sign-off (V2-TIM-02)** | High | Add Story 2.6 covering school confirmation of teacher timesheets. This is a critical step in the timesheet workflow -- without it, timesheets lack school verification. |
| 2 | **Missing story: Enhanced Scheduling epic (V2-SCHED-01/02/03)** | Medium | Create Epic 7 with stories for multi-day bookings, recurring templates, and calendar views. These are significant features called out in the PRD V2 roadmap. |
| 3 | **Missing story: CSV/PDF export for analytics (V2-ANA-04)** | Medium | Add a cross-cutting story for export functionality that can serve analytics, timesheets, and bookings. |
| 4 | **Missing story: SMS notifications (V2-PUSH-03)** | Medium | Add Story 4.6 for SMS integration. The SMS log infrastructure already exists in the MVP. |
| 5 | **File upload architecture undocumented** | Medium | Update architecture document to cover multipart upload handling, file storage strategy, and content validation before implementing Story 3.1. |
| 6 | **Dark mode has no story** | Low | If dark mode is desired for V2, add a story. The UX document provides implementation guidance. If not planned, note as a deliberate deferral. |
| 7 | **Chart/data-viz patterns not in UX design system** | Low | Extend UX design document with chart component specifications before implementing Epic 1 stories. |
| 8 | **Story 6.1 middleware terminology** | Low | Clarify that "middleware" in Story 6.1 refers to application-level helper functions, not Next.js middleware.ts, to avoid confusion with ADR-007. |

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| SQLite write contention under load if V2 features increase write volume (timesheets, documents, invoices) | Medium | High | Prioritize PostgreSQL migration (referenced in Story 6.1 and Architecture Section 9) before or alongside heavy-write V2 features. |
| File storage on local filesystem limits deployment options | Medium | Medium | Architecture already notes future S3 migration. Implement storage abstraction layer from the start in Story 3.1. |
| V2 scope creep: 24 stories plus gaps could expand significantly | Medium | Medium | Enforce P1-first delivery. Stories 5.1-5.4 (Enhanced Teacher Matching) and 6.3 (Cross-Agency Sharing) are net-new features not in the PRD -- treat as stretch goals. |
| SSE scalability with more connected users in multi-agency mode | Low | High | Architecture documents Redis Pub/Sub migration path. Should be implemented as part of or before Story 6.1. |

---

## 7. Verdict

### READY WITH CAVEATS

**The QuickSupply planning artifacts are substantially aligned and the project is ready to proceed with V2 implementation**, subject to the following caveats:

1. **Add missing stories** for school timesheet sign-off (V2-TIM-02), the Enhanced Scheduling epic (V2-SCHED-01/02/03), analytics export (V2-ANA-04), and SMS notifications (V2-PUSH-03) before those epics begin implementation.

2. **Update the architecture document** with file upload handling patterns before starting the Compliance Document Management epic (Epic 3).

3. **Extend the UX design system** with chart/data-visualization component specifications before starting the Analytics Dashboard epic (Epic 1).

The MVP is fully implemented and documented. The V2 planning is thorough with well-structured epics, prioritized stories, and clear technical notes. The gaps identified are additions to an otherwise solid foundation, not fundamental misalignments.
