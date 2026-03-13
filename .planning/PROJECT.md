# QuickSupply by Desian Education

## What This Is

A supply teaching workforce scheduling application that connects schools, supply teachers/TAs, and the Desian Education agency in a real-time sequential assignment workflow. Schools submit cover requests, the agency ranks and offers to teachers one-at-a-time via an intelligent assignment engine, and teachers accept or decline with countdown timers — all in real-time across three role-specific portals.

## Core Value

Schools can submit a cover request and have it filled by the best available teacher through a sequential, real-time assignment workflow managed by the agency.

## Current State

**Version:** v1.1 (in progress)
**Codebase:** ~10,200 lines TypeScript
**Stack:** Next.js 16 (App Router), TypeScript, SQLite/Drizzle ORM, Tailwind CSS v4, shadcn/ui
**Status:** v1.0 MVP shipped. Building admin CRUD and review UI for real-world operability.

## Current Milestone: v1.1 — Operability

**Goal:** Make the app operable without seeding — agency can manage their own data, schools can submit real reviews.

**Target features:**
- Agency admin CRUD for teachers and schools
- School review submission UI on completed bookings
- README updated to reflect MVP-complete status

## Requirements

### Validated

- ✓ Three-portal architecture (school, teacher, agency) with role-based auth — v1.0
- ✓ School can submit cover requests with date, time, role, year group, notes, preferred teacher — v1.0
- ✓ Sequential assignment engine ranks teachers by score (preferred +200, rating x20, reviews x10, proximity, driving, history) — v1.0
- ✓ Teachers receive offers one-at-a-time with configurable countdown timers (7min emergency, 60min standard) — v1.0
- ✓ Teachers can accept or decline offers; engine auto-advances on decline/expiry — v1.0
- ✓ Agency can manually assign teachers, override bookings, cancel bookings — v1.0
- ✓ Real-time SSE updates across all three portals without page refresh — v1.0
- ✓ Countdown timers sync with server-side expiry via SSE events — v1.0
- ✓ Browser OS-level notifications when teacher receives offer with tab unfocused — v1.0
- ✓ Mobile-first teacher portal with bottom nav bar and large tap targets — v1.0
- ✓ Loading skeletons, illustrated empty states, error boundaries on all routes — v1.0
- ✓ Agency SMS log drawer and call simulation modal — v1.0
- ✓ Preferred teacher availability shown on cover request form — v1.0
- ✓ Withdraw offer + auto-refresh assignment panel on decline — v1.0
- ✓ Notification bell with unread count badge across all portals — v1.0
- ✓ Filter/search on agency requests and teachers pages — v1.0
- ✓ School teacher review form (star-rating on completed bookings) — v1.0
- ✓ Centralised Zod validation on all API routes with structured field-level errors — v1.0
- ✓ Cookie-based session auth with HMAC-SHA256 signing — v1.0
- ✓ Password reset flow via email (Resend) — v1.0
- ✓ Rate limiting on login (5/15min), API (20/min), password reset (3/15min) — v1.0
- ✓ Teacher availability management (recurring patterns + specific dates) — v1.0
- ✓ Teacher blacklisting per school — v1.0
- ✓ Notification logging (DB audit trail + email via Resend) — v1.0
- ✓ Demo mode with click-to-sign-in for presentations — v1.0
- ✓ E2E tests with Playwright — v1.0
- ✓ Docker containerization with standalone build — v1.0

### Active

- [ ] Agency can create new teacher profiles with all required fields (name, role, email, phone, address, compliance docs)
- [ ] Agency can edit existing teacher profiles
- [ ] Agency can create new school profiles (name, address, contact, phase)
- [ ] Agency can edit existing school profiles
- [ ] Agency can manage teacher compliance status and expiry dates
- [ ] School can submit a star rating and written review for a completed booking
- [ ] Submitted reviews appear on teacher profile and feed into assignment engine scoring
- [ ] README updated to reflect MVP-complete status and remove outdated Priority checklists

### Out of Scope

- OAuth/social login — email/password sufficient; custom HMAC session working
- Real SMS integration (Twilio) — simulated for MVP; production feature v1.2
- PostgreSQL migration — SQLite sufficient for single-instance demo/pilot; v1.2
- Background job runner (BullMQ/Inngest) — cron polling adequate for current scale; v1.2
- Multi-day booking support — single-date covers only; v2.0
- Drag-and-drop agent-teacher reassignment — simple UI sufficient
- Dashboard analytics (fill rate, response rates) — v2.0
- Activity/audit log timeline — notification log covers basic audit needs
- Teacher/school delete — soft-delete or deactivation only; hard delete too risky
- Document upload for compliance — file fields only for v1.1; upload infrastructure v1.2

## Context

- **Client**: Desian Education (desian.co.uk) — Liverpool-based supply teaching agency
- **Stack**: Next.js 16 (App Router), TypeScript, SQLite/Drizzle ORM, Tailwind CSS v4, shadcn/ui
- **Deployment target**: Vercel (or similar); currently SQLite file-based, single-instance
- **Seed data**: 5 Liverpool schools, 12 teachers/TAs, 3 agency staff, 7 sample requests
- **Known tech debt**: No unit tests for Zod schemas or assignment engine scoring

## Constraints

- **Tech stack**: Next.js 16 + SQLite + Drizzle ORM — not changing for v1.1
- **Database**: SQLite single-writer — no concurrent multi-instance deployment
- **Branding**: Must use Desian Education colours and logo throughout
- **Demo mode**: Must maintain click-to-sign-in demo mode alongside real auth
- **Real-time**: SSE-only (no WebSocket) — browser EventSource API

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SQLite over PostgreSQL | Simpler for demo/pilot, no external DB needed | ⚠️ Revisit for production scale |
| HMAC session cookies over JWT/NextAuth | Lighter weight, works for current scope | ⚠️ Revisit for production |
| Sequential offers (not broadcast) | Business requirement — one teacher at a time | ✓ Good |
| SSE over WebSocket | Simpler server-side, sufficient for one-way updates | ✓ Good |
| Countdown timers (7min/60min) | Business requirement — configurable per request type | ✓ Good |
| Drizzle ORM over Prisma | Better SQLite support, lighter weight | ✓ Good |
| Client-side filter components (RequestsFilter, TeachersFilter) | Serialisable data passed from server pages | ✓ Good |
| Centralised `validateBody()` helper in api-validation.ts | Consistent structured errors across all routes | ✓ Good |
| Zod discriminated union for assignment actions | Type-safe per-action field access | ✓ Good |

---
*Last updated: 2026-03-13 after v1.1 milestone start*
