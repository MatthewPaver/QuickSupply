# QuickSupply PRD Validation Report

**PRD Version:** 1.0 (MVP)
**Validated:** 2026-03-29
**Validator:** BMAD PRD Validation Workflow
**PRD Location:** `_bmad-output/planning-artifacts/prd.md`

---

## Overall Rating: 4.2 / 5.0

The PRD is well-structured, thorough, and implementation-ready. It covers all required sections with strong specificity in most areas. The main gaps are around edge cases, data retention policies, and a few under-specified non-functional requirements.

---

## Section-by-Section Assessment

### 1. Executive Summary — 5/5

**Findings:**
- Problem statement is clear, domain-specific, and grounded in real operational pain (7:30 AM confirmation for 8:30 AM starts).
- Solution overview correctly positions the product as a sequential assignment engine, not a marketplace.
- Target market is well-scoped: small-to-medium UK supply agencies, primary education focus, single-city catchment.

**Issues:** None.

---

### 2. Vision and Goals — 4/5

**Findings:**
- Five business objectives are specific and measurable.
- KPIs table includes concrete targets with timeframes (MVP + 3 months).
- "Mean time from request to confirmed booking < 10 minutes" is a strong north-star metric.

**Issues:**
- **KPI baseline missing.** The PRD states the current workflow takes "30+ minutes of phone calls" but does not establish baseline measurements for other KPIs (e.g., current double-booking rate, current fill rate). Without baselines, it is difficult to measure improvement.
- **Uptime target of 99.5%** during 06:00-18:00 GMT allows for ~36 minutes of downtime per month during the critical operating window. Given that the 7:00-8:30 AM window is make-or-break for same-day requests, a stricter target for that sub-window may be warranted.

---

### 3. Target Users and Personas — 5/5

**Findings:**
- Three distinct personas covering all three portal user types.
- Each persona includes age, tech comfort, goals, pain points, and key scenarios.
- Personas are realistic and grounded in UK supply teaching domain knowledge.
- Key scenarios align well with the user journeys in Section 4.

**Issues:** None. This is an exemplary personas section.

---

### 4. User Journeys — 4/5

**Findings:**
- Three detailed step-by-step journeys covering the primary happy paths: school submits request, teacher accepts offer, agency processes morning rush.
- Journeys reference specific UI elements (dashboards, SSE updates, countdown timers) providing clear implementation guidance.
- The agency journey (Journey 3) covers multiple request types and edge cases (no eligible teachers, cancellation and re-offering).

**Issues:**
- **Missing unhappy-path journeys.** There is no journey for: a teacher whose offer expires without response, a school that submits a request and it goes unfilled, or an agency handling a compliance issue that blocks an assignment. These scenarios are documented as requirements elsewhere but would benefit from narrative journeys.
- **Review journey is tacked on.** Journey 1 ends with a review step (step 9) that occurs "after the booking date passes." This is a separate interaction session from the morning request flow and would be clearer as its own mini-journey.

---

### 5. Domain Model — 5/5

**Findings:**
- Entity relationship diagram (ASCII) clearly shows all major entities and their relationships.
- 11 entities documented with key attributes listed in a structured table.
- Relationships are explicit: cardinality, optional fields (preferredTeacherId?), and junction tables (agentTeacherAssignments) all documented.
- Foreign key relationships are traceable from the model to the functional requirements.

**Issues:** None. The domain model is comprehensive and consistent with the requirements.

---

### 6. Functional Requirements — 4/5

**Findings:**
- 53 individually numbered requirements across 6 sub-sections (School, Teacher, Agency, Assignment Engine, Auth, Notifications).
- Each requirement has a unique ID (e.g., SCH-REQ-01, ASN-04) enabling traceability.
- Requirements are specific enough to implement: field lists, status enums, validation rules, and algorithm scoring factors are all explicit.
- The assignment engine section (6.4) is particularly strong, with clear scoring weights, hard filters, and auto-advance logic documented.

**Issues:**
- **SCH-REQ-02 ambiguity.** "Teachers who have previously worked at the school" is not defined. Does this mean teachers who have had a confirmed booking at the school, or teachers who were offered? The implementation criteria should reference a specific data condition (e.g., exists in `bookings` table with `cancelledAt IS NULL`).
- **NOTIF-03 is incomplete.** Email notifications are listed for "new request (to agents)" and "password reset," but there is no specification for email notification to teachers when they receive an offer. Given that Constraint 3 acknowledges teachers may not have the browser open, email-to-teacher on new offer seems like a significant gap.
- **AGN-SMS-01 is under-specified.** "View log of SMS notifications sent" implies SMS is being sent, but no requirement specifies when or how SMS notifications are triggered. The SMS log viewer exists but the SMS sending requirements are absent.
- **No requirement for concurrent request handling.** What happens if a school submits two requests for the same date and role? Can the same teacher be offered for both simultaneously? The sequential offering logic (ASN-04) applies per-request but cross-request collision is not addressed.

---

### 7. Non-Functional Requirements — 4/5

**Findings:**
- Six well-organized categories: Performance, Security, Accessibility, Scalability, Reliability, Compliance.
- Performance targets are measurable: page load < 2s, API < 500ms, SSE < 1s, ranking < 500ms for 500 teachers.
- Security requirements are comprehensive: bcrypt, HTTPS, rate limiting, Zod validation, SQL injection prevention, Sentry monitoring.
- GDPR compliance addressed with data minimisation and right to erasure.
- Accessibility targets WCAG 2.1 AA with specific criteria (contrast ratios, keyboard navigation, ARIA labels).

**Issues:**
- **COMP-02 is vague.** "Full data deletion procedure to be documented" is a deferred obligation, not a requirement. The PRD should specify what data deletion entails (e.g., anonymize vs hard-delete, cascade behavior for bookings/reviews, retention period).
- **COMP-07 is unverifiable as stated.** "Data stored in UK-hosted infrastructure (or compliant jurisdiction)" should specify the actual hosting provider or at minimum require documentation of the hosting location. "Compliant jurisdiction" is legally ambiguous.
- **No load testing requirement.** PERF-01 through PERF-05 specify targets but there is no requirement to validate them through load testing. SCALE-01 targets "50 requests/day" but peak-hour concurrency is not modeled.
- **REL-04 fallback is vague.** "Falls back to polling or manual refresh" — which one? Polling with what interval? This should be specified to avoid inconsistent implementations.
- **No backup/recovery requirement.** For a system managing time-critical bookings, there is no specification for database backup frequency, recovery time objective (RTO), or recovery point objective (RPO).

---

### 8. Scope -- Current MVP — 4/5

**Findings:**
- Comprehensive checklist of implemented features organized by portal.
- Cross-cutting concerns (auth, SSE, notifications, cron, Sentry, Playwright) all listed.
- Clear boundary between what is built and what is planned (V2 roadmap in Section 9).

**Issues:**
- **No feature toggle or phased rollout mechanism mentioned.** For an MVP launching to real users, the ability to disable features that cause issues in production is important.
- **"Playwright E2E test infrastructure" is ambiguous.** Does this mean tests exist and pass, or that the infrastructure is set up but tests are pending? The success criteria (Section 11) require E2E tests to pass, so this should be more precise.

---

### 9. Scope -- V2 Roadmap — 4/5

**Findings:**
- Six well-defined feature areas with individually numbered requirements (V2-ANA-01 through V2-MULTI-03).
- Each feature area has 3-4 specific requirements.
- The roadmap covers logical next steps: analytics, timesheets, compliance docs, push notifications, scheduling, multi-agency.

**Issues:**
- **V2-SCHED-01 (multi-day bookings) is high-impact but low-detail.** This would require significant changes to the assignment engine, availability checking, and booking model. It deserves more analysis before being listed as a V2 item.
- **No prioritization within V2.** All six areas are listed equally. The sprint plan (separate document) provides sequencing, but the PRD itself should indicate relative priority.

---

### 10. Constraints and Assumptions — 5/5

**Findings:**
- Five technical constraints clearly documented with mitigation paths (SQLite to PostgreSQL, single-process SSE to Redis Pub/Sub, cron-based expiry with interval guidance).
- Eight business assumptions explicitly stated, covering single-agency mode, UK focus, agency-mediated model, no payment processing, and agency-created accounts.
- Geocoding approach (pre-computed Haversine, no real-time routing) is an important technical constraint that is well-documented.

**Issues:** None. This is a strong section that prevents scope creep by making assumptions explicit.

---

### 11. Success Criteria — 4/5

**Findings:**
- Five categories of success criteria: functional completeness, operational readiness, user adoption, quality benchmarks, user satisfaction.
- Criteria are specific and measurable: "at least 5 schools and 20 teachers onboarded," "at least 20 cover requests processed end-to-end," "zero double-booking incidents."
- User adoption targets are realistic for an MVP launch: 3 schools, 10 teachers, 1 consultant within 4 weeks.

**Issues:**
- **No timeline for success criteria evaluation.** "MVP Launch + 3 months" is stated for KPIs in Section 2, but Section 11 mixes "at launch" criteria (functional completeness) with "within 4 weeks" criteria (user adoption) without a clear evaluation schedule.
- **"Qualitative feedback" criterion is not actionable.** "Confirms the platform is faster and more reliable" is subjective. A structured feedback form or specific questions would make this verifiable.
- **Missing rollback criteria.** What conditions would trigger a rollback to the previous phone-based workflow? If the platform causes missed bookings, what is the threshold for reverting?

---

## Cross-Cutting Findings

### Traceability: 4/5

Every functional requirement can be traced to a persona pain point or business objective. The requirement IDs (SCH-*, TCH-*, AGN-*, ASN-*, AUTH-*, NOTIF-*) provide clean traceability. However, the V2 roadmap requirements (V2-*) are not explicitly linked back to business objectives or KPIs.

### Consistency: 4/5

Requirements are internally consistent with two minor exceptions:
1. The domain model shows `agentTeacherAssignments` but the functional requirements (AGN-AGT-02) describe this only briefly. The purpose and workflow for agent-teacher assignments could be clearer.
2. NOTIF-04 lists notification types including "reminder" but no requirement specifies what triggers a reminder notification or what it contains.

### Testability: 4/5

Most requirements are testable. The assignment engine requirements (ASN-01 through ASN-07) are particularly well-specified with exact scoring weights and filter logic. Weaker areas include accessibility requirements (A11Y-01 "WCAG 2.1 Level AA compliance target" -- is "target" the same as "requirement"?) and the vague "data deletion procedure to be documented."

---

## Missing Requirements for the Domain

Given the UK supply teaching context, the following gaps are notable:

1. **Safeguarding incident reporting.** The PRD tracks compliance status but has no mechanism for recording or reporting safeguarding concerns that arise during a booking.
2. **Teacher cancellation/no-show handling.** AGN-BOOK-02 covers agency-initiated cancellation, but there is no explicit workflow for when a teacher fails to show up at the school.
3. **Half-day bookings and split-day cover.** UK schools frequently need morning-only or afternoon-only cover. While start/end times are captured, there is no concept of AM/PM sessions which is how schools typically think about cover.
4. **School term dates and holiday awareness.** The system does not account for school term dates, which would prevent requests on non-school days and improve availability calculations.
5. **Ofsted-related compliance requirements.** Supply agencies operating in UK education may need to demonstrate compliance processes for Ofsted inspections. The PRD does not address audit-readiness for regulatory inspections.

---

## Summary Table

| Section | Rating | Key Issue |
|---------|--------|-----------|
| Executive Summary | 5/5 | -- |
| Vision and Goals | 4/5 | Missing KPI baselines |
| Personas | 5/5 | -- |
| User Journeys | 4/5 | No unhappy-path journeys |
| Domain Model | 5/5 | -- |
| Functional Requirements | 4/5 | SMS requirements gap, concurrent request collision |
| Non-Functional Requirements | 4/5 | No backup/recovery, vague data deletion |
| Scope (MVP) | 4/5 | Test coverage ambiguity |
| Scope (V2) | 4/5 | No prioritization within roadmap |
| Constraints and Assumptions | 5/5 | -- |
| Success Criteria | 4/5 | No rollback criteria |

---

## Recommendations

1. **Add unhappy-path user journeys** for offer expiry, unfilled requests, and compliance blocks.
2. **Define SMS notification triggers** or remove SMS log from the MVP scope if SMS is not being sent.
3. **Specify data retention and deletion policy** with concrete timelines and cascade behavior.
4. **Add backup/recovery requirements** with RTO and RPO targets.
5. **Establish KPI baselines** before launch to enable meaningful measurement.
6. **Address concurrent request collision** in the assignment engine specification.
7. **Add school term awareness** to prevent out-of-term requests and improve availability logic.

---

*This report was generated as part of the BMAD PRD validation workflow.*
