# Retrospective

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-13
**Phases:** 5 | **Plans:** 13 (11 pre-existing + 2 implemented)

### What Was Built

- Real-time SSE integration across all three portals with OS-level browser notifications
- Mobile-first teacher portal with bottom nav, loading skeletons, empty states, error boundaries
- Agency simulation tools: SMS log drawer, call simulation modal, withdraw offer, auto-refresh
- Filter/search on agency requests and teachers pages
- Notification bell with unread badge across all portals
- Centralised Zod validation on all API routes with structured field-level errors

### What Worked

- **Brownfield GSD approach**: Treating pre-existing code as "plans complete" and only executing the delta (2 plans) was efficient — avoided unnecessary rewrites
- **Single-session execution**: Phase 4 and 5 work completed in one session; clean separation of concerns made execution fast
- **Centralised validation helper**: `validateBody()` pattern in `api-validation.ts` made Zod adoption consistent across all routes with minimal per-route boilerplate
- **Client-side filter components**: Serialising filter state from server pages kept data fetching clean and avoided client/server boundary issues

### What Was Inefficient

- **No SUMMARY.md files for pre-existing phases**: GSD tooling can't fully track pre-existing phases (no plan/summary cycle). Stats had to be manually corrected at milestone completion
- **REQUIREMENTS.md checkboxes not updated during execution**: All 27 requirements stayed unchecked even after being confirmed complete — creates false signal in tooling
- **README not updated**: Priority 1/2 checklists in README still show pre-MVP state; should have been updated when work completed

### Patterns Established

- Brownfield GSD: initialise with `docs:` commits for pre-existing phases, execute only delta work
- API validation: all routes use `validateBody(schema, req)` returning `{ data, error }` with field-level Zod errors
- Filter pattern: `*Filter` client components receive serialised props from server page components

### Key Lessons

- Mark REQUIREMENTS.md checkboxes during execution (not just in traceability table) — tooling relies on checkbox state
- Update README alongside planning docs when requirements are satisfied
- For brownfield projects, create lightweight SUMMARY.md stubs for pre-existing phases to keep GSD tooling accurate

### Cost Observations

- Model mix: balanced profile (sonnet executor)
- Sessions: ~2 focused sessions
- Notable: Brownfield project with minimal new code — high ratio of validation/documentation to implementation

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Sessions | Notes |
|-----------|--------|-------|----------|-------|
| v1.0 MVP | 5 | 13 | ~2 | Brownfield; 11/13 plans pre-existing |
