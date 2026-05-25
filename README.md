# QuickSupply

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![Playwright](https://img.shields.io/badge/Playwright-E2E-45BA4B)

Supply-cover scheduling prototype for schools, teachers/TAs, and agency staff.

QuickSupply models the awkward part of school cover: requests arrive at short notice, eligibility matters, offers should go out in the right order, and every portal needs to stay current without someone chasing status in messages.

## Quick Read

| Area | Detail |
|:---|:---|
| What it is | Three-sided booking workflow for school cover |
| Who uses it | Schools, supply teachers/TAs, and agency coordinators |
| What to inspect | Sequential assignment engine, live status updates, seeded demo data |
| Portfolio view | [Idea Store](https://matthewpaver.github.io/MatthewPaver/store/) |
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

That is the point of the app: model the operational handoff, not just store cover requests.

## What To Notice

- The workflow is not a simple CRUD app. It handles ranked offers, decline paths, timeouts, manual override, cancellation, and booking state.
- The product is split into real user surfaces: a school portal, teacher portal, and agency dashboard.
- Server-Sent Events push operational changes to the right audience: agency, teacher, or school.
- The seeded dataset is built for demos: Liverpool schools, varied teacher profiles, compliance flags, availability, and requests in different states.
- The production notes cover the unglamorous but important bits: auth, cron, email, rate limiting, retention, and moving from SQLite to Postgres.
- `src/lib/operations-agents.ts` adds deterministic operations reviewers for cover matching, compliance expiry, timesheet disputes, cancellation risk, and agency handoff summaries.

## Quick Start

```bash
nvm use 22
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` if you want to override local defaults.

## Demo Login

When `NEXT_PUBLIC_DEMO_MODE=true`, the login page lets you click straight into seeded users. When demo mode is off, sign in with email and password. Seeded passwords are printed by `pnpm db:seed`; password reset is available from the login screen.

Seed data includes:

- 5 Liverpool schools
- 12 teachers/TAs with ratings, compliance, driving, and availability differences
- 3 agency staff
- 7 cover requests across pending, offering, filled, and cancelled states

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

`src/lib/assignment-engine.ts` ranks eligible teachers using preferred-teacher status, agency rating, school reviews, proximity, driving ability, and previous work history. Offers are sequential, not broadcast, so the workflow behaves like a real agency process rather than a notification blast.

`src/lib/sse-manager.ts` handles live channels for `agency`, `teacher:{id}`, and `school:{id}`. Offer expiry is checked through `/api/cron`.

## Tech Stack

| Layer | Technology |
|:---|:---|
| App | Next.js 15, App Router, TypeScript |
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

For real users, disable demo mode and set:

- `SESSION_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_DEMO_MODE=false`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL`
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for distributed rate limiting

Run `pnpm db:migrate` and `pnpm db:seed` before first use. SQLite is fine for the local demo; use Postgres for multi-instance or serverless production.

`/api/cron` expires offers, removes expired password-reset tokens, and prunes old read notifications. The included GitHub Actions workflow can call it when `APP_CRON_URL` and `APP_CRON_SECRET` are set.

## Status

`v1.0 MVP complete`

Shipped core workflow:

- School, teacher, and agency portals
- Real-time sequential offer engine
- Booking management and cancellation
- School-to-teacher reviews
- Agency teacher management
- Email and in-app notifications
- Endpoint validation and rate limiting
- Password reset flow

`v1.1 operability` is in progress: agency school management, review submission UI, and tooling improvements.

## Branding

Desian Education:

- Purple `#4c0673`
- Blue `#1863DC`
- Accent `#c879f1`
- Logo: `public/desian-logo.svg`
