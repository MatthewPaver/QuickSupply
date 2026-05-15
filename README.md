# QuickSupply by Desian Education

Supply teaching workforce scheduling app. Connects schools, supply teachers/TAs, and the agency in a real-time sequential assignment workflow.

## Status

`MVP application`

QuickSupply is a product-style scheduling system with seeded demo data, multi-portal workflows, real-time updates, and production hardening notes.

## Portfolio Signal

- Three-sided workflow across schools, teachers/TAs, and agency staff
- Sequential assignment engine with ranking, timeouts, decline handling, and agency override
- Server-Sent Events for live operational updates
- Production notes for auth, cron, email, rate limiting, data deletion, and SQLite-to-Postgres migration

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

1. **Environment:** Set `SESSION_SECRET` (e.g. `openssl rand -hex 32`), `CRON_SECRET`, and `NEXT_PUBLIC_DEMO_MODE=false` (or omit it). Set `RESEND_API_KEY` and `FROM_EMAIL` for notification emails; set `NEXT_PUBLIC_APP_URL` to your app URL (e.g. `https://app.quicksupply.com`) for password-reset links. For distributed production rate limiting, also set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (otherwise rate limiting is in-memory per instance).
2. **Database:** Run `pnpm db:migrate` then `pnpm db:seed`. Seeded users get a default password (see seed output; document it or change it after first login). For multi-instance or serverless hosting, plan a migration from SQLite to Postgres and set `DATABASE_URL` accordingly.
3. **Deploy:** Deploy to Vercel (or similar); add all env vars in the dashboard. Note: SQLite file storage is not suitable for serverless; use Postgres for production at scale.
4. **Cron:** Call `/api/cron` with `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>` to expire offers, remove expired password-reset tokens, and prune old read notifications (configurable via `NOTIFICATION_RETENTION_DAYS`, default 30). This repo includes a scheduled GitHub Actions workflow (`.github/workflows/app-cron.yml`) that can do this automatically when `APP_CRON_URL` and `APP_CRON_SECRET` are set in repository secrets.
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

## Status: v1.0 MVP Complete

QuickSupply v1.0 shipped 2026-03-07. All core workflow features are in production:
- Real-time sequential offer engine with SSE push
- School, teacher, and agency portals
- Booking management with cancellation
- School-to-teacher review system
- Agency teacher management (create, edit, compliance, deactivate)
- Notification system with email + in-app
- Rate limiting and input validation on all endpoints
- Password reset flow

### v1.1 Operability (in progress)

- Agency school management (create, edit, deactivate schools)
- Review submission UI for schools
- README and tooling improvements

See `.planning/ROADMAP.md` for the full v1.1 plan.

### MCP & tooling

- **Sentry MCP** — Configure `NEXT_PUBLIC_SENTRY_DSN` for error tracking and Seer analysis.
- **SQLite MCP** — Point at `./quicksupply.db` for ad-hoc queries without Drizzle Studio.
- **Route check script** — `pnpm e2e:routes` smoke-tests all screens. Run with `pnpm dev` up.

### Branding (Desian Education — [desian.co.uk](https://www.desian.co.uk))
- **Desian purple** `#4c0673` — primary (buttons, links, headings, logo treatment)
- **Desian blue** `#1863DC` — secondary brand (`--desian-blue` / `bg-desian-blue`)
- **Desian light purple** `#c879f1` — accent (highlights, gradients)
- **Logo:** `public/desian-logo.svg`
