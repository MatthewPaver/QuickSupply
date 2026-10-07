# QuickSupply

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![Playwright](https://img.shields.io/badge/Playwright-E2E-45BA4B)

Historical product case study: redesigning an outdated Liverpool supply-teacher booking workflow for schools, teachers/TAs, and agency staff.

**No setup needed:** [watch the booking walkthrough](https://matthewpaver.github.io/preview.html?app=quicksupply). Follow the same request across the school, agency and teacher views. Run the code only if you want to inspect the implementation; the security boundaries in [Quick Start](#quick-start) apply.

QuickSupply started from a specific local observation, not a generic marketplace prompt. A Liverpool supply-teaching booking process relied on dated screens and manual coordination. The prototype asks what a clearer three-sided journey could look like when cover arrives at short notice, eligibility matters, offers should go out in the right order, and everyone needs the same current status.

This repository is preserved as a working portfolio case study. It demonstrates product discovery, workflow modelling and implementation. It is not presented as a live agency, a validated startup, or a current view of the whole UK supply-teaching market. See [`CASE_STUDY.md`](CASE_STUDY.md) for the evidence, decisions, and limits.

## Quick Read

| Area | Detail |
|:---|:---|
| What it is | Working redesign case study for a dated local booking workflow |
| Who uses it | Schools, supply teachers/TAs, and agency coordinators |
| What to inspect | Sequential assignment engine, live status updates, seeded demo data |
| Portfolio view | [Watch the recorded case study](https://matthewpaver.github.io/preview.html?app=quicksupply) |
| Tests | `pnpm test`, `pnpm e2e`, `pnpm e2e:routes` |
| Stack | `Next.js` `TypeScript` `Drizzle` `SQLite` `SSE` `Playwright` |

## Practical Test

Can a same-day cover request move from a school to an agency to an eligible teacher without everyone chasing status in messages?

The useful check is the full path:

1. A school creates a cover request.
2. The assignment engine ranks eligible teachers.
3. One offer goes out at a time.
4. Declines, timeouts, overrides, and cancellations update the right portal.
5. School, agency, and teacher all see the current state.

That is the point of the case study: make the operational handoff testable, not just draw better booking screens.

## What This Shows

- Translating an observed service problem into separate school, coordinator, and teacher journeys.
- Modelling a stateful operational process with eligibility, sequential offers, timeouts, overrides, cancellations, reviews, timesheets, and audit history.
- Building the unglamorous parts needed for a credible walkthrough: migrations, seeded data, route checks, end-to-end tests, rate limits, notifications, and a production boundary.
- Knowing where the evidence stops. The demo proves the workflow can be built and explained. It does not prove demand, procurement fit, safeguarding acceptance, or commercial viability.

## What To Notice

- The workflow is not a simple CRUD app. It handles ranked offers, decline paths, timeouts, manual override, cancellation, and booking state.
- The product is split into real user surfaces: a school portal, teacher portal, and agency dashboard.
- Server-Sent Events push operational changes to the right audience: agency, teacher, or school.
- The seeded dataset is built for demos: explicitly fictional Liverpool-area schools and contacts, varied teacher profiles, coherent compliance documents, subjects, availability, and requests in different states.
- The production notes cover the unglamorous but important bits: auth, cron, email, rate limiting, retention, and moving from SQLite to Postgres.
- `src/lib/operations-agents.ts` adds deterministic operations reviewers for cover matching, compliance expiry, timesheet disputes, cancellation risk, and agency handoff summaries.

## Quick Start

Use a fresh local demo database and fictional data only. Demo identity sign-in requires both an explicit server flag and the UI flag. This is not a production service for real schools or teachers; seeded passwords are public, and deployment requires a separate security review.

```bash
nvm use 22
corepack pnpm install --frozen-lockfile
export DATABASE_URL=./quicksupply-demo.db
export DEMO_MODE=true NEXT_PUBLIC_DEMO_MODE=true
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Use the pinned pnpm 10 release through Corepack. An older global pnpm can reject the workspace settings or handle native build approvals differently. If Corepack is unavailable, `npx --yes pnpm@10.34.5` can replace `corepack pnpm` in these commands. Do not seed an existing database containing work you need to keep; use a separate `DATABASE_URL` for a fresh demo.

Copy `.env.example` to `.env.local` if you want to override local defaults.

For browser verification, install Chromium with `corepack pnpm exec playwright install chromium`. Against the running demo, use `CI=1 BASE_URL=http://localhost:3000 corepack pnpm exec playwright test e2e/full-demo-flow.spec.ts e2e/offline-navigation.spec.ts --workers=1 --retries=0`. This completes the school, agency and teacher journey through visible controls and checks that the offline warning cannot block sign-out. It creates a fictional booking, so use the separate demo database above. Without `BASE_URL`, `corepack pnpm e2e` builds the app and starts it on port 3200 against a throwaway seeded database (`/tmp/quicksupply-e2e.db`) with demo mode on, and runs the full suite; your own `.env.local` database is not touched.

## Demo Login

Set both `DEMO_MODE=true` (server) and `NEXT_PUBLIC_DEMO_MODE=true` (UI) for click-through fictional accounts. If either is off, the demo-session endpoint rejects the request without issuing a cookie. The public flag is build-time configuration; the server flag can disable demo sign-in at runtime.

For email/password login, the fictional seeded school is `mersey-view@schools.quicksupply.example` with password `Password1!`. These credentials are public demonstration data, never production accounts. Switch roles with the demo buttons to explore the other portals.

Seed data includes:

- 5 fictional Liverpool-area schools (all names and contacts are demo data)
- 12 teachers/TAs with ratings, compliance, driving, and availability differences
- 3 agency staff
- 8 cover requests across pending, offering, filled, and cancelled states

The UK `01632 960xxx` numbers and `.example` email domains are non-contactable demo values. No real school identity is used.

## DfE market context

`pnpm data:dfe` downloads the official Department for Education **Teacher vacancies — school level** CSV and commits only aggregate Liverpool, North West and England context to [`data/market-context/dfe-teacher-vacancies.json`](data/market-context/dfe-teacher-vacancies.json). The output records the source URL, SHA-256, academic year and limitations and excludes school names/URNs.

This data helps explain the setting; it does **not** rank individual teachers. Annual recorded vacancies are also not a proxy for live supply-cover bookings, so the app keeps the evidence boundary explicit.

## Architecture

```text
School request
    |
    v
Assignment engine
    |
    +--> Rank eligible teachers
    +--> Offer one candidate at a time
    +--> Advance on decline or timeout
    +--> Allow agency override
    |
    v
Booking + live updates
```

### Three Portals

| Portal | Purpose |
|:---|:---|
| `/school/*` | Create cover requests, request preferred teachers, track status |
| `/teacher/*` | Manage availability, accept or decline timed offers |
| `/agency/*` | Coordinate requests, assign teachers, override bookings |

### Core Logic

`src/lib/assignment-engine.ts` first enforces role, compliance, booking, blacklist, decline, emergency, contact-timing, availability and travel rules. Only eligible teachers are ranked using preferred-teacher status, agency rating, school reviews, proximity, driving ability, subject match and previous work history. Preference can no longer reinsert someone who failed an operational constraint. Offers are sequential, not broadcast.

`src/lib/sse-manager.ts` handles live channels for `agency`, `teacher:{id}`, and `school:{id}`. Offer expiry is checked through `/api/cron`.

## Tech Stack

| Layer | Technology |
|:---|:---|
| App | Next.js 16, App Router, TypeScript |
| Data | SQLite, Drizzle ORM |
| UI | Tailwind CSS v4, shadcn/ui |
| Live updates | Server-Sent Events |
| Testing | Playwright, route smoke tests |
| Notifications | In-app notifications, Sonner, Browser Notification API |

## Useful Commands

```bash
pnpm dev           # Start dev server
pnpm build         # Production build
pnpm db:generate   # Generate Drizzle migrations
pnpm db:migrate    # Apply migrations
pnpm db:seed       # Seed demo data
pnpm db:reset      # Delete database file
pnpm db:studio     # Open Drizzle Studio
pnpm setup         # Migrate + seed
pnpm e2e:routes    # Smoke-test all screens
pnpm e2e           # Playwright E2E
pnpm e2e:ui        # Playwright UI mode
```

## Production Notes

The settings below describe the intended production boundary, not a completed deployment checklist. Set `DEMO_MODE=false` and rebuild with `NEXT_PUBLIC_DEMO_MODE=false`; replace all seeded credentials and use a non-demo database. A deployment still needs a separate security review and:

- `SESSION_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_DEMO_MODE=false`
- `DEMO_MODE=false`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL`
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for distributed rate limiting

Run production migrations before first use, but do not run the fictional demo seed against a production database. The seed refuses `NODE_ENV=production` unless the destructive override is exactly `SEED_ALLOW_PRODUCTION=1`. SQLite is fine for the local demo; use Postgres for multi-instance or serverless production.

`/api/cron` expires offers, removes expired password-reset tokens, and prunes old read notifications. The included GitHub Actions workflow (`Run maintenance hook`) is manual-only (`workflow_dispatch`) and calls it when `APP_CRON_URL` and `APP_CRON_SECRET` are set. Use the hosting platform's scheduler for recurring production runs.

## Status

`Portfolio case study complete; product validation paused`

Shipped core workflow:

- School, teacher, and agency portals
- Real-time sequential offer engine
- Booking management and cancellation
- School-to-teacher reviews
- Agency teacher management
- Email and in-app notifications
- Endpoint validation and rate limiting
- Password reset flow

The application is maintained as a reproducible demo rather than an active product roadmap. A commercial restart should begin with fresh interviews and workflow observation at Liverpool schools, agencies, and teacher pools, not another feature sprint.

Brand names and logos are illustrative product assets and are not granted under the code licence.
