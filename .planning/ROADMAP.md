# Roadmap: QuickSupply

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-03-07) — [archive](.planning/milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Operability** — Phases 6–8 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–5) — SHIPPED 2026-03-07</summary>

- [x] Phase 1: Real-Time & SSE Integration (3/3 plans) — completed 2026-03-06 (pre-existing)
- [x] Phase 2: Responsive Design & UI Polish (3/3 plans) — completed 2026-03-06 (pre-existing)
- [x] Phase 3: Agency Tools & Cover Request Enhancements (3/3 plans) — completed 2026-03-06 (pre-existing)
- [x] Phase 4: Notifications & Search (2/2 plans) — completed 2026-03-06
- [x] Phase 5: Reviews & Input Validation (2/2 plans) — completed 2026-03-06

</details>

### 🚧 v1.1 Operability (In Progress)

- [ ] **Phase 6: Agency Teacher Management** (3 plans)
- [ ] **Phase 7: Agency School Management** (0 plans)
- [ ] **Phase 8: Review Submission UI** (0 plans)

---

## Phase Details

### Phase 6: Agency Teacher Management
**Goal**: Agency staff can create, edit, and fully manage teacher accounts — including credentials and compliance status — without seeding or developer access.
**Depends on**: Nothing (extends existing agency portal)
**Requirements**: TCH-01, TCH-02, TCH-03, TCH-04, TCH-05, TCH-06, TCH-07, DOC-01
**Success Criteria** (what must be TRUE):
  1. Agency staff can open a "New Teacher" form, fill in core fields (name, role, email, phone, address, driving licence), and see the new teacher appear in the teachers list
  2. Agency staff can open an existing teacher's profile and save updated core fields, with changes reflected immediately
  3. Agency staff can set or update a teacher's DBS check status, expiry date, and right-to-work status, and the compliance badge on the teachers list updates accordingly
  4. Agency staff can create login credentials (email + temporary password) for a teacher so that teacher can sign in to their portal
  5. Agency staff can deactivate a teacher (preventing login and hiding them from the assignment engine) and later reactivate them
  6. README accurately describes the v1.0 MVP-complete state with no outdated Priority checklists
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — Create/edit teacher forms + API routes (TCH-01, TCH-02)
- [ ] 06-02-PLAN.md — Compliance management + login credentials (TCH-03, TCH-04, TCH-05)
- [ ] 06-03-PLAN.md — Deactivate/reactivate + README update (TCH-06, TCH-07, DOC-01)

### Phase 7: Agency School Management
**Goal**: Agency staff can create and manage school accounts without developer intervention, enabling real schools to be onboarded to the platform.
**Depends on**: Phase 6
**Requirements**: SCH-01, SCH-02, SCH-03, SCH-04
**Success Criteria** (what must be TRUE):
  1. Agency staff can create a new school profile (name, address, phase, contact name/email/phone) and see it appear in the schools list
  2. Agency staff can open an existing school's profile and save updated fields, with changes reflected immediately
  3. Agency staff can create login credentials (email + temporary password) for a school contact so that school can sign in and submit cover requests
  4. Agency staff can deactivate a school account (preventing login and hiding the school from the cover request flow)
**Plans**: TBD

### Phase 8: Review Submission UI
**Goal**: Schools can submit structured reviews on completed bookings, and those reviews immediately update the teacher's rating and feed into assignment engine scoring.
**Depends on**: Phase 7
**Requirements**: RVW-01, RVW-02, RVW-03, RVW-04, RVW-05, RVW-06
**Success Criteria** (what must be TRUE):
  1. School sees a "Leave Review" prompt on any completed booking that has not yet been reviewed
  2. School can submit a 1–5 star rating via the review form and see a confirmation on submission
  3. School can optionally add a written comment (up to 500 characters) alongside the star rating
  4. School can indicate whether they would rebook the teacher (yes/no toggle), and that preference is captured with the review
  5. The submitted review (rating, comment, rebook flag) appears on the teacher's agency profile page immediately after submission
  6. The teacher's average rating shown across the platform updates immediately after a new review is submitted, and the updated score feeds into the next assignment engine ranking
**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 6. Agency Teacher Management | 1/3 | In Progress|  |
| 7. Agency School Management | 0/0 | Not started | - |
| 8. Review Submission UI | 0/0 | Not started | - |
