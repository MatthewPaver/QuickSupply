# Requirements: QuickSupply v1.1

**Defined:** 2026-03-13
**Core Value:** Schools can submit a cover request and have it filled by the best available teacher through a sequential, real-time assignment workflow managed by the agency.

## v1.1 Requirements

Requirements for the Operability milestone. Phases continue from Phase 5 (v1.0 ended at Phase 5).

### Agency Teacher Management

- [ ] **TCH-01**: Agency can create a new teacher profile with core fields (name, role, email, phone, address, driving licence)
- [ ] **TCH-02**: Agency can edit an existing teacher's core profile fields
- [ ] **TCH-03**: Agency can set a teacher's compliance status (DBS check status + expiry date, right-to-work status)
- [ ] **TCH-04**: Agency can edit a teacher's compliance fields
- [ ] **TCH-05**: Agency can create login credentials for a new teacher (email + temporary password)
- [ ] **TCH-06**: Agency can deactivate a teacher account (prevents login and hides from assignment engine)
- [ ] **TCH-07**: Agency can reactivate a deactivated teacher account

### Agency School Management

- [ ] **SCH-01**: Agency can create a new school profile (name, address, phase, contact name/email/phone)
- [ ] **SCH-02**: Agency can edit an existing school's profile fields
- [ ] **SCH-03**: Agency can create login credentials for a new school contact (email + temporary password)
- [ ] **SCH-04**: Agency can deactivate a school account (prevents login and hides from cover request flow)

### Review Submission

- [ ] **RVW-01**: School sees a "Leave Review" prompt on completed bookings that haven't been reviewed yet
- [ ] **RVW-02**: School can submit a 1-5 star rating for a completed booking
- [ ] **RVW-03**: School can optionally add a written comment (max 500 chars) to the review
- [ ] **RVW-04**: School can indicate whether they would rebook the teacher (yes/no)
- [ ] **RVW-05**: Submitted review appears on the teacher's agency profile showing rating, comment, and rebook flag
- [ ] **RVW-06**: New reviews immediately update the teacher's average rating used in assignment engine scoring

### Documentation

- [ ] **DOC-01**: README updated to reflect v1.0 MVP-complete status and remove outdated Priority checklists

## v2 Requirements

Deferred to future release.

### Production Infrastructure

- **INFRA-01**: Migrate from SQLite to PostgreSQL with connection pooling
- **INFRA-02**: Real SMS integration via Twilio or AWS SNS
- **INFRA-03**: Background job runner (BullMQ/Inngest) for offer expiry and notifications
- **INFRA-04**: Unit tests for assignment engine scoring algorithm
- **INFRA-05**: Integration tests for full request → assign → booking workflow

### Advanced Features

- **ADV-01**: Multi-day booking support (date range instead of single date)
- **ADV-02**: Dashboard analytics (fill rate %, average time-to-fill, teacher response rates)
- **ADV-03**: Activity/audit log timeline on request detail page
- **ADV-04**: Drag-and-drop agent-teacher reassignment on agents page
- **ADV-05**: Distance/travel time display on assignment panel

### Auth Upgrade

- **AUTH-01**: Replace HMAC cookie sessions with signed JWT or NextAuth.js
- **AUTH-02**: Add OAuth login (Google) for teachers
- **AUTH-03**: Implement multi-factor authentication for agency staff

## Out of Scope

| Feature | Reason |
|---------|--------|
| Teacher/school hard delete | Too risky — deactivation covers the need safely |
| Document/file upload for compliance | Upload infrastructure complexity; text fields sufficient for v1.1 |
| Teacher self-registration | Agency-managed onboarding for v1.x |
| Real SMS (Twilio) | Production concern; v1.2 |
| PostgreSQL migration | v1.2 when deploying to production |
| Review categories (punctuality, etc.) | Adds complexity; overall rating + comment sufficient |
| Multi-day bookings | v2.0 |
| Dashboard analytics | v2.0 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TCH-01 | Phase 6 | Pending |
| TCH-02 | Phase 6 | Pending |
| TCH-03 | Phase 6 | Pending |
| TCH-04 | Phase 6 | Pending |
| TCH-05 | Phase 6 | Pending |
| TCH-06 | Phase 6 | Pending |
| TCH-07 | Phase 6 | Pending |
| DOC-01 | Phase 6 | Pending |
| SCH-01 | Phase 7 | Pending |
| SCH-02 | Phase 7 | Pending |
| SCH-03 | Phase 7 | Pending |
| SCH-04 | Phase 7 | Pending |
| RVW-01 | Phase 8 | Pending |
| RVW-02 | Phase 8 | Pending |
| RVW-03 | Phase 8 | Pending |
| RVW-04 | Phase 8 | Pending |
| RVW-05 | Phase 8 | Pending |
| RVW-06 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after v1.1 roadmap creation*
