# QuickSupply by Desian Education

## What This Is

A supply teaching workforce scheduling application that connects schools, supply teachers/TAs, and the Desian Education agency in a real-time sequential assignment workflow. Schools submit cover requests, the agency ranks and offers to teachers one-at-a-time via an intelligent assignment engine, and teachers accept or decline with countdown timers — all in real-time across three role-specific portals.

## Core Value

Schools can submit a cover request and have it filled by the best available teacher through a sequential, real-time assignment workflow managed by the agency.

## Requirements

### Validated

- ✓ Three-portal architecture (school, teacher, agency) with role-based auth — existing
- ✓ School can submit cover requests with date, time, role, year group, notes, preferred teacher — existing
- ✓ Sequential assignment engine ranks teachers by score (preferred +200, rating x20, reviews x10, proximity, driving, history) — existing
- ✓ Teachers receive offers one-at-a-time with configurable countdown timers (7min emergency, 60min standard) — existing
- ✓ Teachers can accept or decline offers; engine auto-advances on decline/expiry — existing
- ✓ Agency can manually assign teachers, override bookings, cancel bookings — existing
- ✓ Real-time updates via SSE across all three portals — existing
- ✓ Cookie-based session auth with HMAC-SHA256 signing — existing
- ✓ Password reset flow via email (Resend) — existing
- ✓ Rate limiting on login (5/15min), API (20/min), password reset (3/15min) — existing
- ✓ Teacher availability management (recurring patterns + specific dates) — existing
- ✓ Teacher blacklisting per school — existing
- ✓ School teacher reviews (star ratings) — existing (seeded, no form)
- ✓ Notification logging (DB audit trail + email via Resend) — existing
- ✓ Demo mode with click-to-sign-in for presentations — existing
- ✓ Sentry error monitoring integration — existing
- ✓ Desian Education branding (purple #4c0673, blue #1863DC, accent #c879f1) — existing
- ✓ E2E tests with Playwright — existing
- ✓ Docker containerization with standalone build — existing

### Active

- [ ] SSE client hook integration for live dashboard updates without refresh
- [ ] Browser Notification API for OS-level alerts when tab unfocused
- [ ] Countdown timer sync with SSE events for accuracy
- [ ] Mobile-responsive teacher portal (bottom nav, larger tap targets)
- [ ] Loading skeletons on server components
- [ ] Illustrated empty state components
- [ ] Error boundaries in each route group
- [ ] Previous teacher availability indicator on cover request form
- [ ] Simulated SMS log drawer in agency dashboard
- [ ] Call simulation modal (animated ringing, connected state, timer)
- [ ] Notification bell with unread count badge in all portal nav bars
- [ ] School teacher reviews form (star-rating on completed bookings)
- [ ] Withdraw active offer button in assignment panel
- [ ] Auto-refresh assignment panel on teacher decline via SSE
- [ ] Filter/search on agency list pages (requests, teachers)
- [ ] Comprehensive Zod validation on all API routes

### Out of Scope

- OAuth/social login — email/password sufficient; custom HMAC session working
- Real SMS integration (Twilio) — simulated for MVP; production feature later
- PostgreSQL migration — SQLite sufficient for single-instance demo/pilot
- Background job runner (BullMQ/Inngest) — cron polling adequate for current scale
- Multi-day booking support — single-date covers only for v1
- Drag-and-drop agent-teacher reassignment — simple UI sufficient
- Dashboard analytics (fill rate, response rates) — enhancement, not MVP
- Activity/audit log timeline — notification log covers basic audit needs
- Teacher/school CRUD forms — all data seeded for demo; production feature later

## Context

- **Client**: Desian Education (desian.co.uk) — Liverpool-based supply teaching agency
- **Stack**: Next.js 16 (App Router), TypeScript, SQLite/Drizzle ORM, Tailwind CSS v4, shadcn/ui
- **Status**: Demo-ready end-to-end. Not yet MVP-complete per README Priority 1 & 2 checklists
- **Deployment target**: Vercel (or similar); currently SQLite file-based, single-instance
- **Seed data**: 5 Liverpool schools, 12 teachers/TAs, 3 agency staff, 7 sample requests

## Constraints

- **Tech stack**: Next.js 16 + SQLite + Drizzle ORM — established, not changing for this milestone
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

---
*Last updated: 2026-03-05 after GSD initialization (brownfield)*
