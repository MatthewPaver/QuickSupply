# QuickSupply V2 Sprint Retrospective

**Date:** 2026-03-29
**Sprint scope:** V2 Roadmap -- all 20 stories across 5 epics
**Planned cadence:** 6 x 2-week sprints (12 weeks)
**Actual cadence:** All 20 stories delivered in a compressed AI-assisted session
**Method:** BMAD (AI-assisted agile)

---

## 1. What Went Well

### Comprehensive feature delivery
All 20 V2 stories across 5 epics were implemented and routes are present in the codebase:
- **Epic 1 (Analytics):** `/agency/analytics`, `/agency/analytics/fill-rate`, `/agency/analytics/response-time`, `/agency/analytics/utilization`, `/agency/analytics/satisfaction`, plus `/school/analytics`
- **Epic 2 (Timesheets & Financial):** `/teacher/timesheets`, `/agency/timesheets`, `/agency/settings/pay-rates`, `/agency/invoices`, `/agency/invoices/[id]`, `/agency/analytics/margins`
- **Epic 3 (Compliance):** `/agency/compliance`, `/agency/compliance/documents`
- **Epic 4 (PWA):** Service worker, manifest, dark mode, landing page redesign
- **Epic 5 (Enhanced Matching):** `/agency/settings/ranking`, `/teacher/performance`

### Bonus features beyond the original V2 scope
Routes exist that were not part of the original 20 stories:
- `/school/analytics` (school-facing analytics, not in V2 scope)
- `/teacher/performance` (teacher-facing performance metrics)
- `/agency/activity` (activity feed page)
- Dark mode support
- Landing page redesign

### E2E test coverage
8 Playwright spec files cover the V2 features:
- `e2e/v2-analytics.spec.ts`
- `e2e/v2-compliance.spec.ts`
- `e2e/v2-timesheets.spec.ts`
- `e2e/v2-financial.spec.ts`
- `e2e/v2-pwa.spec.ts`
- `e2e/v2-matching.spec.ts`
- Plus existing `smoke.spec.ts` and `full-demo-flow.spec.ts`

### Clean architectural patterns
- Consistent route structure under `src/app/` with role-based grouping (agency/, school/, teacher/)
- Drizzle migrations tracked in `drizzle/meta/`
- Zod validation referenced throughout the sprint plan

### PRD and sprint plan alignment
The sprint plan's deferred Epic 6 (Multi-Agency Support) was a sound architectural decision. The rationale documented in the sprint plan -- that adding `agencyId` to every table is a foundational change requiring its own focused initiative -- demonstrates good scope discipline.

---

## 2. What Could Improve

### No unit tests
The project has zero unit tests in `src/`. All testing is E2E via Playwright. This is a significant gap:
- The assignment engine (`src/lib/assignment-engine.ts`) was refactored for enhanced matching (Epic 5) but has no unit tests verifying the scoring function, weight application, or edge cases.
- Financial calculations (pay rates, invoice line items, margin computation) involve currency arithmetic that is fragile without unit test coverage.
- Compliance status recalculation logic (when does a teacher become non-compliant?) needs isolated testing.

### Sprint ceremonies were skipped
The sprint plan defined four ceremonies: story creation, development, code review, and retrospective. The compressed delivery bypassed:
- **Individual story files** were not created via `bmad-create-story` for V2 features (the `_bmad-output/implementation-artifacts/stories/` directory was not populated for V2).
- **Per-story code review** via `bmad-code-review` was not run for each story.
- **Mid-sprint retrospectives** were not conducted.

### Commit granularity
The core V2 implementation was delivered in a single commit:
```
181c7da feat(v2): implement complete V2 roadmap — analytics, compliance, timesheets, invoices, PWA, enhanced matching
```
This makes it impossible to:
- Revert a single feature without reverting all V2 work.
- Trace a bug to a specific feature's implementation.
- Review changes at a meaningful granularity.

A 20-story sprint should have produced at minimum 20 commits (one per story), ideally more.

### No accessibility audit
The PRD requires WCAG 2.1 Level AA compliance (A11Y-01 through A11Y-05). There is no evidence of:
- Automated accessibility testing (e.g., axe-core integration in Playwright tests).
- Manual keyboard navigation testing.
- Screen reader testing.
- Color contrast verification for the new dark mode.

---

## 3. Velocity Assessment

### Planned vs. actual

| Metric | Planned | Actual |
|--------|---------|--------|
| Duration | 12 weeks (6 sprints) | Single session |
| Stories delivered | 20 | 20 + bonus features |
| Commits per story | 1+ each | ~1 for all 20 |
| Code reviews | 20 | 0 formal reviews |
| Retrospectives | 6 | 0 (this is the first) |

### Is this velocity sustainable?

No. The compressed delivery traded process discipline for speed. Specifically:

1. **No iterative feedback loop.** The sprint plan assumed real users would be providing feedback between sprints (e.g., analytics data informing Sprint 6's matching improvements). Delivering everything at once bypasses this learning cycle.
2. **Review debt accumulates.** Without per-story code review, defects compound across features rather than being caught early.
3. **Testing is surface-level.** E2E tests verify that pages render and basic flows work, but do not exercise edge cases, error handling, or concurrent operations.
4. **Knowledge is concentrated.** A single-session delivery means only the AI and the developer have context on implementation decisions. No documentation of trade-offs, alternative approaches considered, or known limitations was produced per-story.

### Recommendation
For V3 (Multi-Agency Support), return to the 2-week sprint cadence with proper ceremonies. Multi-tenancy is a cross-cutting architectural change that requires careful, incremental implementation with regression testing at each step.

---

## 4. Technical Debt Incurred

### High priority

| Debt Item | Impact | Effort to Resolve |
|-----------|--------|-------------------|
| Zero unit tests for assignment engine, financial calculations, and compliance logic | Bugs in ranking or invoicing will not be caught until E2E or production | M -- write unit tests for `assignment-engine.ts`, pay rate lookups, and compliance recalculation |
| Single mega-commit for V2 | Cannot isolate feature-level regressions or partial reverts | Cannot be resolved retroactively |
| SQLite in production | Write contention under concurrent use; no multi-agency path | L -- PostgreSQL migration (planned for V3) |
| `db.sqlite` committed/tracked | Database file in repo root; should be in `.gitignore` | S -- add to `.gitignore`, remove from tracking |

### Medium priority

| Debt Item | Impact | Effort to Resolve |
|-----------|--------|-------------------|
| No accessibility testing automation | WCAG AA compliance is aspirational, not verified | M -- add axe-core to Playwright tests |
| No error boundary testing | Unknown behavior when API calls fail or SSE disconnects | M -- add error boundary components and test failure modes |
| No load/performance testing | PERF-01 through PERF-05 targets are unverified | M -- set up k6 or similar for critical endpoints |
| File upload storage is local filesystem | Not portable across deployments, no CDN, no backup | M -- implement storage abstraction per sprint plan recommendation |
| Cron-based offer expiry is fragile | If cron job fails, expired offers do not auto-advance | S -- add monitoring/alerting for cron failures |

### Low priority

| Debt Item | Impact | Effort to Resolve |
|-----------|--------|-------------------|
| No feature flags | Cannot disable a V2 feature without code changes | M -- implement feature flag system |
| PDF invoice generation library choice undocumented | No ADR for the PDF approach taken | S -- document the decision |
| Dark mode added without design system audit | Potential contrast issues in new and existing components | S -- audit all components in dark mode |

---

## 5. Quality Assessment

### Test coverage

| Category | Status | Notes |
|----------|--------|-------|
| Unit tests | None | No files matching `src/**/*.test.{ts,tsx}` |
| E2E tests | 8 V2 spec files + 2 existing | `v2-analytics`, `v2-compliance`, `v2-timesheets`, `v2-financial`, `v2-pwa`, `v2-matching`, `smoke`, `full-demo-flow` |
| Integration tests | None | No API route tests outside of E2E |
| Accessibility tests | None | No axe-core or similar integration |
| Performance tests | None | No load testing infrastructure |

### Route coverage
45 `page.tsx` files exist in `src/app/`. The E2E tests would need to cover at minimum the critical paths through these routes. Without running the tests, coverage cannot be precisely measured, but 8 spec files for 45 routes suggests significant gaps.

### Code review findings
No formal code review was conducted for V2 features. The sprint plan specified `bmad-code-review` as a gate before merging each story's PR, but V2 was delivered as a single commit to main without feature branches or PRs.

### Architectural observations
- Route structure is clean and follows Next.js App Router conventions.
- Role-based grouping (`agency/`, `school/`, `teacher/`) provides clear separation.
- The project uses 44+ routes, which is substantial for a solo-developer project -- maintenance burden should be monitored.

---

## 6. Recommendations for V3

### Process changes

1. **Restore sprint cadence.** Multi-agency support (Epic 6) requires incremental delivery with regression testing after each story. The four stories (6.1-6.4) should each be their own sprint or paired carefully.
2. **Enforce feature branches and PRs.** Every story gets a branch, a PR, and a `bmad-code-review` before merge. No exceptions for "small" changes.
3. **Create story files before coding.** Use `bmad-create-story` to produce detailed implementation plans. This is especially critical for Story 6.1 (Agency Isolation) which touches every table and query.
4. **Run retrospectives.** Even with AI-assisted development, retrospectives after each sprint catch process issues early.

### Technical changes

1. **Migrate to PostgreSQL before starting V3.** Multi-agency data isolation on SQLite is not viable. Do the migration as a standalone sprint before any V3 feature work.
2. **Add unit test infrastructure.** Set up Vitest (or Jest), write tests for the assignment engine and financial calculations, and establish a minimum coverage threshold before V3 development begins.
3. **Add axe-core to Playwright.** Every E2E test should run an accessibility check. This can be done by adding `@axe-core/playwright` and calling `checkA11y()` on each page.
4. **Implement a data access layer with tenant scoping.** Rather than adding `WHERE agencyId = ?` to every query, create a scoped data access layer that automatically injects the agency context. Design this before writing any V3 code.
5. **Add database backup automation.** Before multi-agency, establish automated backups with tested restore procedures.

### Scope recommendations

1. **Story 6.1 (Agency Isolation) should be split** into sub-stories: schema migration, query scoping, middleware, data migration, and regression testing. Each is a meaningful unit of work.
2. **Story 6.3 (Cross-Agency Teacher Sharing) should be deferred to V4.** It adds complexity to the isolation model and has unclear business requirements (revenue sharing is explicitly out of scope).
3. **Consider a "V2.5" stabilization sprint** before V3: resolve the high-priority technical debt items (unit tests, accessibility, performance testing) so V3 starts from a solid foundation.

---

## Action Items

| # | Action | Priority | Owner |
|---|--------|----------|-------|
| 1 | Add unit tests for assignment engine scoring function | High | Dev |
| 2 | Add unit tests for financial calculations (pay rates, invoicing, margins) | High | Dev |
| 3 | Add `db.sqlite` to `.gitignore` and remove from tracking | High | Dev |
| 4 | Set up axe-core accessibility testing in Playwright | Medium | Dev |
| 5 | Audit dark mode for contrast and component consistency | Medium | Dev |
| 6 | Document V2 architecture decisions (PDF library, storage approach, caching) | Medium | Dev |
| 7 | Plan PostgreSQL migration as a prerequisite for V3 | High | Dev |
| 8 | Split Story 6.1 into implementable sub-stories | High | Dev |
| 9 | Defer Story 6.3 (Cross-Agency Sharing) to V4 | Medium | Product |
| 10 | Run V2 E2E tests and fix any failures before V3 starts | High | Dev |

---

*This retrospective was generated as part of the BMAD sprint retrospective workflow.*
