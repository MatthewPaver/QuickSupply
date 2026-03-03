# QuickSupply by Desian Education

Supply teaching workforce scheduling app. Connects schools, supply teachers/TAs, and the agency in a real-time sequential assignment workflow.

## Quick Start

```bash
# Requires Node.js 22+ and pnpm
nvm use 22
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

Copy `.env.example` to `.env.local` if you want to override defaults.

## Production setup

For production (real users, no demo click-to-sign-in):

1. **Environment:** Set `SESSION_SECRET` (e.g. `openssl rand -hex 32`), `CRON_SECRET`, and `NEXT_PUBLIC_DEMO_MODE=false` (or omit it). Set `RESEND_API_KEY` and `FROM_EMAIL` for notification emails; set `NEXT_PUBLIC_APP_URL` to your app URL (e.g. `https://app.quicksupply.com`) for password-reset links.
2. **Database:** Run `pnpm db:migrate` then `pnpm db:seed`. Seeded users get a default password (see seed output; document it or change it after first login). For multi-instance or serverless hosting, plan a migration from SQLite to Postgres and set `DATABASE_URL` accordingly.
3. **Deploy:** Deploy to Vercel (or similar); add all env vars in the dashboard. Note: SQLite file storage is not suitable for serverless; use Postgres for production at scale.
4. **Cron:** Call `/api/cron` with `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>` to expire offers (e.g. Vercel Cron or GitHub Actions).
5. **Data deletion:** Users can request account deletion. `DELETE /api/me` (with a valid session) anonymises the current user's PII (name, email, phone set to "deleted") and disables login. Link to this from profile/settings or document for support.

## Demo Login

When `NEXT_PUBLIC_DEMO_MODE=true` (default in .env.example), click any user on the login page to sign in instantly. When demo mode is off, sign in with email and password (seeded users have a default password printed by `pnpm db:seed`; use "Forgot password?" to set a new one). Seeded with:
- **5 Liverpool schools** (St. Mary's, Kensington Primary, Broadgreen International, All Saints, Mossley Hill)
- **12 teachers/TAs** with varied profiles (ratings, compliance, driving, availability patterns)
- **3 agency staff** (Sarah Mitchell - Admin, James Powell, Emma Rodriguez)
- **7 cover requests** in various states (pending, offering, filled, cancelled)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database | SQLite via Drizzle ORM |
| UI | shadcn/ui + Tailwind CSS v4 |
| Real-time | Server-Sent Events (SSE) |
| Notifications | Sonner toasts + Browser Notification API |

## Architecture

### Three Portals

- **School Portal** (`/school/*`) - Submit cover requests, request preferred teachers, track status
- **Teacher Portal** (`/teacher/*`) - Manage availability, accept/decline job offers with countdown timer
- **Agency Dashboard** (`/agency/*`) - Command centre: manage all requests, assign teachers, override bookings

### Sequential Assignment Engine (`src/lib/assignment-engine.ts`)

The core business logic:
1. **Ranks eligible teachers** by score (preferred teacher +200, agency rating x20, school reviews x10, proximity, driving ability, previous work history)
2. **Offers sequentially** - one teacher at a time, NOT broadcast
3. **Auto-advances** on decline or timeout (7 min emergency, 60 min standard - configurable)
4. **Agency can override** at any point: manual assign, withdraw offer, cancel booking

### Database (12 tables)

Schema in `src/lib/db/schema.ts`. Key tables: schools, teachers, agents, cover_requests, assignment_offers, bookings, teacher_availability, teacher_blacklisted_schools, school_teacher_reviews, notification_log, app_config

### Real-time (SSE)

Three channels: `agency`, `teacher:{id}`, `school:{id}`. Events flow from server actions through the SSE manager to connected clients. Offer expiry checked every 30s via `/api/cron` polling.

## Project Structure

```
src/
  app/
    page.tsx              # Landing page (portal selector)
    login/                # Quick-login with demo users
    school/               # School portal pages
    teacher/              # Teacher portal pages
    agency/               # Agency dashboard pages
    api/                  # REST + SSE endpoints
  components/
    ui/                   # shadcn/ui components
    school/               # School-specific components
    teacher/              # Teacher-specific components
    agency/               # Agency-specific components (assignment panel)
    shared/               # Status badges, etc
  lib/
    db/schema.ts          # Drizzle ORM schema
    db/index.ts           # Database connection
    assignment-engine.ts  # Sequential assignment algorithm
    sse-manager.ts        # SSE pub/sub
    auth.ts               # Cookie session auth
    distance.ts           # Haversine distance calculation
  types/index.ts          # Shared TypeScript types
scripts/
  seed.ts                 # Demo data seeder
  reset-db.ts             # Database reset
```

## Scripts

```bash
pnpm dev           # Start dev server (Turbopack)
pnpm build         # Production build
pnpm db:generate   # Generate Drizzle migrations
pnpm db:migrate    # Apply migrations
pnpm db:seed       # Seed demo data
pnpm db:reset      # Delete database file
pnpm db:studio     # Open Drizzle Studio (DB browser)
pnpm setup         # Migrate + seed (first-time setup)
pnpm e2e:routes    # Smoke-test all screens (run with dev server up)
pnpm e2e           # Playwright E2E (starts dev server if needed, or run pnpm dev first)
pnpm e2e:ui        # Playwright UI mode
```

---

## What's Left To Do (Developer Notes)

### Priority 1: Polish & Bug Fixes
- [ ] **SSE client hook** - Create `src/hooks/use-sse.ts` hook and wire it into the agency dashboard, teacher jobs page, and school dashboard for live UI updates without page refresh
- [ ] **Browser Notification API** - Request permission on login, fire OS notifications when tab is unfocused (especially for teacher new-offer events)
- [ ] **Countdown timer accuracy** - The teacher jobs page countdown works client-side but should sync with SSE events to handle expiry correctly
- [ ] **Responsive design pass** - Teacher portal needs mobile-first treatment (bottom nav bar, larger tap targets). Agency dashboard is desktop-only currently
- [ ] **Loading skeletons** - Add shimmer loading states to server components
- [ ] **Empty states** - Some pages show plain text for empty states; add illustrated empty state components
- [ ] **Error boundaries** - Add `error.tsx` files to each route group

### Priority 2: Missing Features (MVP scope)
- [ ] **Previous teacher availability indicator** - The cover request form shows previous teachers but doesn't yet grey out unavailable ones (needs an API call to check availability for the selected date)
- [ ] **Simulated SMS log drawer** - Add a persistent drawer to the agency dashboard showing all "SMS messages" that would have been sent
- [ ] **Call simulation modal** - The phone buttons currently use `tel:` links; add a modal with animated ringing, connected state, and call timer
- [ ] **Notification bell** - Add a notification dropdown to each portal's nav bar reading from the `notification_log` table, with unread count badge
- [ ] **School teacher reviews UI** - Currently reviews are seeded only; add a simple star-rating form to the school history page for completed bookings
- [ ] **Withdraw active offer button** - Agency can start sequential offering but the UI doesn't yet have a dedicated "Withdraw Current Offer" button (the API supports it via `manualAssign` which withdraws first)
- [ ] **Auto-refresh after decline** - When a teacher declines, the engine re-ranks but the assignment panel should refresh automatically via SSE

### Priority 3: Enhancements (Beyond MVP)
- [ ] **Proper authentication** - Replace base64 cookie with signed JWT or NextAuth
- [ ] **Teacher/school CRUD** - Currently all data is seeded; add forms for agency to create/edit teachers and schools
- [ ] **Agent-teacher reassignment UI** - The agents page shows assignments but doesn't support drag-and-drop reassignment
- [ ] **Filter/search on list pages** - Agency requests and teachers pages need status filters, date range pickers, and text search
- [ ] **Compliance management** - Add forms for updating compliance status, expiry dates, document uploads
- [ ] **Long-term booking support** - Multi-day bookings (date range instead of single date)
- [ ] **Travel/distance display** - Show distance from teacher to school on the assignment panel with driving/walking icons
- [ ] **Activity/audit log** - Show a timeline of all actions taken on a request (who offered, when, responses, overrides)
- [ ] **Dashboard analytics** - Fill rate %, average time-to-fill, teacher response rates

### Priority 4: Production Readiness
- [ ] **PostgreSQL migration** - Replace SQLite with PostgreSQL for multi-user concurrent access
- [ ] **Real SMS integration** - Twilio or similar for actual SMS notifications
- [ ] **Background job runner** - Replace client-side cron polling with a proper job queue (BullMQ/Inngest) for offer expiry
- [ ] **Deployment** - Dockerfile, Railway/Render config, environment variable management
- [ ] **Testing** - Unit tests for assignment engine, integration tests for API routes; E2E with Playwright is set up (`pnpm e2e`)
- [ ] **Rate limiting** - Protect API endpoints
- [ ] **Input sanitization** - Add Zod validation to all API route handlers

### Error monitoring (Sentry)

Sentry is integrated: set `NEXT_PUBLIC_SENTRY_DSN` (and optionally `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` for source maps) to send errors and replays. Without a DSN, the app runs as before; with a DSN, the Sentry MCP can list issues, fetch stack traces, and run Seer analysis.

### MCP & tooling that could improve QuickSupply

- **Sentry MCP** – With [Sentry](https://sentry.io) configured (see above), the Sentry MCP can list issues, fetch stack traces, and run Seer analysis for root cause and fix suggestions. Fits well with "Error boundaries" and production debugging.
- **SQLite MCP** – If pointed at `./quicksupply.db`, you can run ad-hoc queries (e.g. cover request stats, teacher counts) from the IDE without opening Drizzle Studio. Useful for debugging and one-off reports.
- **Postgres MCP** – When you complete the "PostgreSQL migration" (Priority 4), a Postgres MCP connected to the same DB enables read-only queries and exploration from the editor.
- **Browser / E2E MCP** – A browser automation MCP (e.g. Playwright-based or Cursor’s browser MCP) lets you drive the app through the UI for regression testing and verifying flows (school request → agency assign → teacher accept). Complements the route-check script below.
- **GitHub + Cursor skills** – The `gh-fix-ci` and `gh-address-comments` skills help fix failing PR checks and address review comments. Add a GitHub Actions workflow that runs `pnpm build`, `pnpm lint`, and `pnpm e2e:routes` (with dev server) to get fast feedback on PRs.
- **Route check script** – `pnpm e2e:routes` runs `scripts/e2e-check-routes.mjs`: it logs in as school, teacher, and agent and requests every screen. Run it with the dev server up (`pnpm dev`) to confirm all routes return 200. Good for quick smoke tests; for full E2E use Playwright as in the Testing todo.

### Branding (Desian Education – [desian.co.uk](https://www.desian.co.uk))
- **Desian purple** `#4c0673` – primary (buttons, links, headings, logo treatment)
- **Desian blue** `#1863DC` – secondary brand (e.g. Teacher Portal accent, `--desian-blue` / `bg-desian-blue`)
- **Desian light purple** `#c879f1` – accent (highlights, gradients)
- **Logo:** `public/desian-logo.svg` – used on landing, login, and all three portal layouts (with `brightness-0` for dark-on-light)
- All colours are in `src/app/globals.css`; primary/accent drive the theme; toasts use primary for success

### MVP readiness (per this README’s “What’s Left To Do”)

**Core product:** The app is **demo-ready**. All three portals work end-to-end: schools submit requests, agency assigns via the sequential engine, teachers accept/decline with countdown, and SSE + cron support real-time behaviour. The assignment engine, DB schema, and auth are in place.

**Not yet MVP-complete** by the README’s own Priority 1 & 2 lists:

- **Priority 1 (Polish & bug fixes):** SSE client hook, browser notifications, countdown/SSE sync, responsive teacher portal, loading skeletons, empty states, and error boundaries are still unchecked. Until these are addressed, the experience is functional but not polished (e.g. no live UI updates without refresh, no OS notifications, teacher UX not mobile-first).
- **Priority 2 (MVP scope):** Previous-teacher availability on the form, SMS log drawer, call simulation modal, notification bell, school reviews UI, “Withdraw offer” button, and auto-refresh on decline are still unchecked. These are called out as MVP scope in the README.

**Conclusion:** For a **demo or internal pilot**, the app is ready. For **MVP as defined in this README** (all Priority 1 polish + Priority 2 features done), it is **not yet ready** – work through the Priority 1 and Priority 2 checklists above to reach that bar.
