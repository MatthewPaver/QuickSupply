# QuickSupply Technical Research Document

**Date:** 2026-03-27
**Version:** 0.1.0 (pre-production)
**Platform:** Next.js 16 App Router with SQLite + Drizzle ORM

---

## 1. Architecture Overview

### App Router Structure

QuickSupply is a Next.js 16 application using the App Router with a **three-portal pattern** — each user role (agency, school, teacher) has its own isolated route tree under `src/app/`:

```
src/app/
  agency/        # 14 pages: dashboard, requests, teachers, schools, bookings, agents, settings
  school/        # 4 pages: dashboard, requests, new request, history
  teacher/       # 4 pages: dashboard, jobs, profile, availability
  api/           # ~30 route handlers across auth, SSE, CRUD, cron
  layout.tsx     # Root layout (Geist fonts, theme provider, Toaster)
```

Each portal has its own `layout.tsx` that enforces role-based access via `requireSession(role)` at the server component level. The agency portal has the richest UI (desktop sidebar + mobile hamburger nav), while the school and teacher portals are lighter.

### Three-Portal Pattern

- **Agency portal** (`/agency/*`): Full administrative control — manages teachers, schools, cover requests, assignment workflow, bookings, settings, and agent accounts. This is the operational hub.
- **School portal** (`/school/*`): Schools submit cover requests, view their request status, and review booking history.
- **Teacher portal** (`/teacher/*`): Teachers manage availability, accept/decline job offers, update profile preferences.

All three portals share a single authentication system — a unified login page (`/`) that routes users to their portal based on role.

### SSE Real-Time System

Real-time updates use Server-Sent Events (SSE) via three dedicated API routes:

- `/api/sse/agency` — broadcasts to all logged-in agency users
- `/api/sse/school/[id]` — per-school channel
- `/api/sse/teacher/[id]` — per-teacher channel

The `SSEManager` (`src/lib/sse-manager.ts`) is a singleton class using an in-memory pub/sub model:
- Channels are identified by string keys (e.g., `"agency"`, `"teacher:abc123"`, `"school:xyz456"`)
- Listeners register via `subscribe()` and receive events via callback
- The singleton is persisted across hot reloads in dev via `globalThis`
- SSE routes use `ReadableStream` with 30-second heartbeat intervals
- Events are typed via `SSEEvent` (10 event types covering the full offer/booking lifecycle)

---

## 2. Technology Evaluation

### Next.js 16.1.6 — Stable, Well-Suited

- **Maturity:** Production-ready. Next.js 16 is GA with stable App Router, Server Components, and Server Actions.
- **Suitability:** Excellent fit for a multi-portal SaaS app. The App Router's nested layouts map naturally to the three-portal pattern. Server Components handle data fetching for dashboards; Client Components power interactive forms and real-time UI.
- **Risk:** The `output: "standalone"` config in `next.config.ts` enables containerized deployments but requires attention to SQLite file paths and native module bundling (see Deployment section).
- **Sentry integration** via `@sentry/nextjs` v10 wraps the config cleanly.

### React 19.2.3 — Stable

- **Maturity:** React 19 is GA. The project uses `react-hook-form` (v7.71) with `@hookform/resolvers` for form handling, which is fully compatible.
- **Suitability:** Server Components reduce client bundle size; Client Components are used judiciously for interactivity (forms, SSE listeners, notifications).
- **Patterns:** The codebase correctly separates server (data-fetching layouts/pages) from client (interactive) components.

### Drizzle ORM 0.45.1 + better-sqlite3 — Good, With Caveats

- **Maturity:** Drizzle ORM is stable and actively maintained. The `better-sqlite3` driver is synchronous, which is both a strength (simple, no connection pool management) and a constraint (blocks the event loop during queries).
- **Suitability:** Good for the current scale. The schema uses Drizzle's `sqliteTable` helpers cleanly. Type inference via `InferSelectModel` provides end-to-end type safety.
- **Migration tooling:** Drizzle Kit manages migrations (`drizzle/` directory, 8 migrations to date). The journal-based approach is solid for a single-database deployment.
- **Concern:** Synchronous queries can block the Node.js event loop under load. For the expected user count (dozens of concurrent users for a supply teaching agency), this is acceptable.

### SQLite (via better-sqlite3 12.6.2) — Appropriate for Current Stage

- **Maturity:** SQLite is battle-tested. `better-sqlite3` is the most performant Node.js binding.
- **Suitability:** Ideal for development and early production with a single server instance. WAL mode is enabled (`journal_mode = WAL`), which provides good concurrent read performance. Foreign keys are enforced.
- **Limitations:** See Section 5 (Scalability).

### Tailwind CSS v4 — Modern, Well-Configured

- **Maturity:** Tailwind v4 uses the new CSS-first configuration model (`@import "tailwindcss"` + `@theme inline`). The project uses `@tailwindcss/postcss` for build integration.
- **Design system:** A custom "Desian Education" branded theme is defined using OKLCH color space in CSS custom properties. This includes brand purple (#4c0673) as primary, blue (#1863DC) as secondary, and light purple (#c879f1) as accent. shadcn/ui-compatible token names are used throughout.
- **UI components:** Built on Radix UI primitives (v1.4.3) with `class-variance-authority`, `clsx`, and `tailwind-merge` — the standard shadcn/ui stack.
- **Animations:** Custom utility classes (`qs-enter`, `qs-pop`, `qs-live-pulse`) with `prefers-reduced-motion` respect.

### Supporting Libraries — All Appropriate

| Library | Version | Purpose | Assessment |
|---------|---------|---------|------------|
| `zod` | ^4.3.6 | Input validation | Excellent. Zod v4 is used for all API request validation with structured field error responses. |
| `bcryptjs` | ^3.0.3 | Password hashing | Appropriate. Pure JS implementation avoids native compilation issues. |
| `ulid` | ^3.0.2 | ID generation | Good. ULIDs are time-sortable, which is useful for chronological ordering. |
| `date-fns` | ^4.1.0 | Date formatting | Standard choice. v4 is tree-shakeable. |
| `resend` | ^6.9.3 | Transactional email | Good fit. Gracefully degrades (no-op) when `RESEND_API_KEY` is unset. |
| `lucide-react` | ^0.575.0 | Icons | Standard for shadcn/ui projects. |
| `sonner` | ^2.0.7 | Toast notifications | Clean integration with shadcn/ui. |
| `next-themes` | ^0.4.6 | Theme switching | Standard. |
| `@upstash/ratelimit` + `@upstash/redis` | ^2.0.8 / ^1.36.3 | Rate limiting | Excellent. Dual-mode: Upstash Redis in production, in-memory fallback in dev. |
| `@playwright/test` | ^1.58.2 | E2E testing | Industry-standard. Route-checking script (`e2e-check-routes.mjs`) exists. |

---

## 3. Integration Patterns

### SSE System Architecture

The SSE system follows a clean publisher/subscriber pattern:

1. **Publisher (assignment engine):** When the engine creates an offer, accepts a booking, or expires an offer, it calls `sseManager.emit(channel, event)` to push events to connected clients.
2. **Broker (`SSEManager`):** In-memory singleton mapping channel names to Sets of listener callbacks. No persistence — events are fire-and-forget.
3. **Consumer (SSE route handlers):** Each portal has an SSE endpoint that subscribes to its channel, converts events to `text/event-stream` format, and pipes them through a `ReadableStream`. Heartbeats every 30 seconds prevent proxy/LB timeouts.
4. **Client (React hooks):** Client components connect via `EventSource`, parse incoming `data:` lines, and update local state or trigger refetches.

**Event flow example (teacher accepts offer):**
```
Teacher clicks Accept -> POST /api/offers { offerId, response: "accepted" }
  -> handleTeacherResponse() in assignment-engine.ts
    -> Updates offer status to "accepted"
    -> Creates booking record
    -> Updates coverRequest status to "filled"
    -> sseManager.emit("agency", { type: "request_filled", ... })
    -> sseManager.emit("school:{schoolId}", { type: "request_filled", ... })
    -> createNotification() for school + all agents (persisted + email)
```

### Auth Flow Across Portals

1. **Single login endpoint** (`POST /api/auth/login`): Accepts email + password, searches agents -> teachers -> schools (in priority order). Deactivated accounts are rejected.
2. **Session creation:** HMAC-SHA256 signed cookie (`qs_session`). Payload is base64-encoded JSON containing `{ userId, role, name }`. 24-hour TTL. HttpOnly, Secure (in production), SameSite=Lax.
3. **Portal guard:** Each portal's `layout.tsx` calls `requireSession(role)` as a server-side check. If the session is missing or the role doesn't match, the user is redirected to `/`. This means:
   - No middleware.ts exists — auth is enforced at the layout level
   - API routes individually check session where needed
4. **Logout:** `POST /api/auth` with no body (or specific endpoint) calls `destroySession()` which deletes the cookie.
5. **Password reset:** Token-based flow via `/api/auth/forgot-password` and `/api/auth/reset-password`. Tokens are hashed (SHA256) before storage, expire after a configured TTL, and are cleaned up by the cron job.

**Security note:** The session is a signed cookie, not encrypted. The payload (userId, role, name) is visible to the client if they decode the base64 portion, but it cannot be tampered with due to the HMAC signature. This is acceptable since the payload contains no secrets.

### Assignment Engine — Sequential Offer Processing

The assignment engine (`src/lib/assignment-engine.ts`) implements a ranked sequential offer model:

1. **Ranking** (`rankTeachersForRequest`): Evaluates all active, compliant teachers against a cover request. Filters include: role match, compliance status, availability (specific date overrides recurring patterns), blacklist, existing bookings on the date, distance limit, emergency availability, contact-night-before preference, and prior decline/expiry. Teachers are scored on a weighted composite:
   - Preferred teacher: +200 points
   - Agency rating: agencyRating * 20 (max ~100)
   - School review average: schoolReviewAvg * 10 (max 50)
   - Distance (inverse): min(30, 30 / max(distance, 0.5))
   - Can drive: +25
   - Previously worked at school: +15

2. **Sequential offering** (`offerToNextTeacher`): Offers go out one at a time, not in parallel. Each offer has a configurable response window (default: 60 min for next-day, 7 min for emergency). Response windows are stored in `app_config`.

3. **Auto-advance:** When a teacher declines or an offer expires, the engine re-ranks (to account for any changes since initial ranking) and offers to the next teacher. If all teachers are exhausted, the request reverts to "pending" for manual intervention.

4. **Manual override** (`manualAssign`): Agency staff can bypass the ranking and directly offer to any teacher, withdrawing any active offers first.

5. **Offer expiry** (`checkExpiredOffers`): Called by the cron endpoint (`/api/cron`), this sweeps all pending offers whose `expiresAt` has passed, marks them expired, and auto-advances.

---

## 4. Database Design

### Schema Analysis

The schema has 11 tables organized into three groups:

**Core Entities (3 tables):**
- `schools` — includes geocoding (lat/lng), phase classification, contact info, password hash, active flag
- `teachers` — extensive profile: geocoding, driving ability, distance preference, role type, compliance status (DBS, right to work), agency rating, preferences (emergency, night-before, long-term)
- `agents` — simple: name, email, password hash, admin flag

**Relationships (3 tables):**
- `agent_teacher_assignments` — many-to-many between agents and teachers (composite PK)
- `teacher_availability` — supports both specific-date and recurring day-of-week patterns. Specific dates override recurring patterns in the ranking algorithm.
- `teacher_blacklisted_schools` — many-to-many with optional reason (composite PK)

**Workflow (3 tables):**
- `cover_requests` — the core entity: school + date + role + time + status (pending/offering/filled/cancelled). Supports preferred teacher and emergency flag.
- `assignment_offers` — tracks each offer in the sequential chain: teacher, timestamps (offered/expires/response), status, order position
- `bookings` — confirmed assignments with cancellation tracking (who cancelled, reason)

**Supporting (2 tables + 1 config):**
- `school_teacher_reviews` — 1-5 star rating + comment + wouldRebook, linked to a specific booking
- `notification_log` — polymorphic recipient (teacher/school/agent) + type + read status
- `app_config` — key-value store for runtime configuration (response window durations)
- `password_reset_tokens` — token-based password reset with expiry

### ID Strategy

All entity IDs use ULIDs (Universally Unique Lexicographically Sortable Identifiers) stored as text. This provides:
- No auto-increment contention
- Time-sortable without a separate timestamp index
- Safe for distributed ID generation (future-proofing)

### Indexing Strategy

The current indexing is minimal:
- **Primary keys** on all entity tables (text IDs)
- **Composite primary keys** on junction tables (`agent_teacher_assignments`, `teacher_blacklisted_schools`)
- **`notification_log`**: Composite index on `(read, created_at)` for efficiently querying unread notifications
- **`password_reset_tokens`**: Unique index on `token_hash`, composite index on `(user_id, role)`, index on `expires_at`

**Missing indexes (potential concern):**
- `cover_requests.school_id` — frequently joined/filtered by school
- `cover_requests.date` — filtered by date in availability checks
- `cover_requests.status` — filtered by status on dashboard views
- `assignment_offers.cover_request_id` — joined to cover requests frequently
- `assignment_offers.teacher_id` — filtered by teacher in the jobs view
- `assignment_offers.status` — filtered for pending offers in expiry checks
- `bookings.cover_request_id` — joined to cover requests
- `bookings.teacher_id` — filtered by teacher
- `teacher_availability.teacher_id` — filtered during ranking
- `school_teacher_reviews.school_id` + `teacher_id` — filtered during ranking

At the current scale (likely hundreds of rows per table), the lack of indexes is not a performance problem. SQLite's full table scans on small tables are fast. However, indexes should be added before scaling beyond a few thousand rows per table.

### Migration Approach

Drizzle Kit manages schema migrations:
- 8 migrations to date (initial schema through review/rebook additions)
- Migrations stored in `drizzle/` with JSON snapshots in `drizzle/meta/`
- CLI commands: `pnpm db:generate` (create migration), `pnpm db:migrate` (apply)
- Seed scripts: `pnpm db:seed`, `pnpm db:seed-demo`, `pnpm db:reset`
- Studio: `pnpm db:studio` for visual inspection

---

## 5. Scalability Considerations

### SQLite Limitations

| Concern | Impact | Severity |
|---------|--------|----------|
| **Single-writer** | SQLite allows only one write at a time. WAL mode helps (readers don't block writer), but concurrent writes queue. Under heavy write load, this becomes a bottleneck. | Medium (at current scale: low) |
| **Single-file** | The database is a single file on the local filesystem. This prevents horizontal scaling (multiple server instances cannot share the same SQLite file). | High (blocks multi-instance deployment) |
| **No connection pooling** | `better-sqlite3` uses synchronous, blocking calls. Each query blocks the Node.js event loop. The assignment engine's `rankTeachersForRequest` executes ~8 queries sequentially. | Medium (acceptable for <50 concurrent users) |
| **Serverless incompatibility** | Vercel's serverless functions have ephemeral filesystems. SQLite on Vercel requires either a read-only database bundled with the deployment or an external file store (Turso, LiteFS). | High (see Deployment section) |
| **No built-in replication** | No read replicas. All reads and writes go through the same file. | Low (not needed at current scale) |

### SSE Connection Limits

- **Per-server cap:** Each SSE connection holds an open HTTP connection. Node.js defaults to a process-level limit (typically ~16,000 concurrent connections). For a supply teaching agency with ~50 concurrent users, this is not a concern.
- **Proxy/LB timeouts:** The 30-second heartbeat should keep connections alive through most reverse proxies. Vercel's edge network has specific timeout behaviors for streaming responses.
- **Memory:** Each SSE connection holds a listener function in the `SSEManager` Map. Memory footprint is negligible at expected scale.
- **No reconnection logic in manager:** If the server restarts, all SSE connections drop. Clients must reconnect. `EventSource` handles this natively with automatic reconnection, but any events emitted during the disconnect are lost.

### Potential Migration Path to Postgres

If the application needs to scale beyond a single server instance, the recommended migration path:

1. **Option A — Turso (LibSQL):** Drop-in replacement for SQLite with edge replication. Drizzle ORM supports Turso natively via `drizzle-orm/libsql`. This would require changing the driver in `src/lib/db/index.ts` and updating `drizzle.config.ts`, but the schema remains unchanged. This is the lowest-friction option.

2. **Option B — PostgreSQL:** Full migration to Postgres (e.g., Neon, Supabase, or managed RDS). Requires:
   - Converting schema from `sqliteTable` to `pgTable`
   - Changing integer booleans to native `boolean` columns
   - Replacing `real` with `doublePrecision` or `numeric`
   - Replacing `integer("x", { mode: "timestamp" })` with `timestamp` columns
   - Updating raw SQL fragments (e.g., `sql\`${bookings.cancelledAt} IS NULL\``)
   - Adding connection pooling (pg-pool or Prisma-style pooling)
   - Converting synchronous DB calls to async (required for pg drivers)

3. **Option C — LiteFS / Litestream:** Keep SQLite but replicate to S3/GCS for durability and read replicas. This maintains the simplicity of SQLite but adds operational complexity.

---

## 6. Security Posture

### Authentication Implementation

| Aspect | Status | Notes |
|--------|--------|-------|
| Password hashing | Good | `bcryptjs` with default cost factor |
| Session management | Good | HMAC-SHA256 signed cookies, HttpOnly, Secure (prod), SameSite=Lax, 24h TTL |
| Session secret | Good | `SESSION_SECRET` env var required in production; dev fallback is clearly unsafe |
| Role enforcement | Good | `requireSession(role)` in every portal layout; API routes check session individually |
| Timing-safe comparison | Good | `timingSafeEqual` used for signature verification |
| Account deactivation | Good | Deactivated teachers and schools are rejected at login |

### Rate Limiting

| Endpoint | Limit | Window | Backend |
|----------|-------|--------|---------|
| Login | 5 attempts | 15 min | Upstash Redis (prod) / in-memory (dev) |
| API (general) | 20 requests | 1 min | Upstash Redis (prod) / in-memory (dev) |
| Password reset request | 3 attempts | 15 min | Upstash Redis (prod) / in-memory (dev) |
| Password reset confirm | 10 attempts | 15 min | Upstash Redis (prod) / in-memory (dev) |

Rate limiting is applied to login, offer response, assignment actions, cover request creation, and password reset endpoints. Client identification uses `X-Forwarded-For` -> `X-Real-IP` -> `"anonymous"` fallback. The in-memory fallback is process-local and resets on restart, but this is acceptable for development.

### Input Validation

All API endpoints use Zod schemas (`src/lib/api-validation.ts`) with a centralized `validateBody()` helper that returns structured field errors. Schemas cover:
- Login, forgot-password, reset-password
- Cover request creation (with date/time refinements)
- Offer responses (discriminated union)
- Assignment actions (discriminated union with 5 action types)
- Teacher profile updates
- Teacher availability (recurring + specific dates)
- Agency CRUD (teachers, schools, compliance, credentials, status)
- Settings, reviews

### Areas for Improvement

| Gap | Risk | Recommendation |
|-----|------|----------------|
| **No middleware.ts** | Auth checks are per-layout/per-route, not centralized. A missed check on an API route would expose it. | Add middleware.ts with route-pattern matching to enforce auth on `/agency/*`, `/school/*`, `/teacher/*`, and their API counterparts. |
| **No CSRF protection** | SameSite=Lax cookies mitigate most CSRF attacks, but do not fully protect against same-site cross-origin attacks. | Consider adding a CSRF token for state-changing POST/PATCH/DELETE requests, or use the `Double Submit Cookie` pattern. |
| **Session not encrypted** | Payload (userId, role, name) is base64-readable. Not a vulnerability (it's signed), but leaks user metadata to client-side inspection. | Consider encrypting the payload or switching to opaque session tokens with server-side session storage. |
| **No password complexity enforcement** | Minimum 8 characters only. | Add complexity rules (uppercase, number, special character) or adopt a passphrase-based policy. |
| **Cron secret via query param** | The cron endpoint accepts the secret as a query parameter (`?secret=`), which can appear in server logs. | Prefer header-only authentication for the cron endpoint. |

---

## 7. Performance Patterns

### Turbopack Development

- `next dev --turbopack` is configured in `package.json`. Turbopack provides significantly faster HMR and cold starts compared to Webpack during development.
- TypeScript compilation with `strict: true` and `incremental: true` in `tsconfig.json`.

### Server Components for Data Fetching

Portal layouts and pages are server components by default:
- Dashboard pages fetch data directly from the database at render time
- No client-side data fetching libraries (no SWR, no React Query) — data comes from server components
- Layouts call `requireSession()` which reads the cookie server-side

This pattern minimizes client bundle size and eliminates loading states for initial page renders.

### Client Components for Interactivity

Client components are used for:
- Forms (react-hook-form + zod resolvers)
- SSE listeners (EventSource connections)
- Notification bell (polling/SSE updates)
- Sign-out button (client-side cookie deletion)
- Calendar/date picker (react-day-picker)
- Toast notifications (sonner)

### Assignment Engine Performance

The `rankTeachersForRequest` function executes ~8 database queries:
1. Fetch the cover request
2. Fetch the school's coordinates
3. Fetch all active teachers
4. Fetch blacklisted teachers for this school
5. Fetch existing bookings for this date
6. Fetch all teacher availability records
7. Fetch school reviews for this school
8. Fetch previous bookings at this school

All queries are synchronous (better-sqlite3). For a typical agency with 50-200 teachers, this completes in <10ms. The ranking itself is O(n) with simple arithmetic scoring.

**Potential optimization:** Queries 3 and 6 fetch all records and filter in JavaScript. For larger datasets, these should use SQL WHERE clauses to reduce data transfer.

---

## 8. Technical Debt

### Items Requiring Attention for Production Readiness

| Item | Priority | Effort | Description |
|------|----------|--------|-------------|
| **Add middleware.ts** | High | Low | Centralize auth enforcement to prevent accidentally unprotected routes. Currently auth is per-layout, which is fragile as routes are added. |
| **Add database indexes** | Medium | Low | Add indexes on frequently queried foreign keys and status columns (see Section 4). |
| **SSE event persistence** | Medium | Medium | Events emitted while a client is disconnected are lost. Consider a short-lived event buffer or last-event-ID support for reconnection. |
| **Error monitoring** | Low | Done | Sentry is already integrated (`@sentry/nextjs` v10). Server and edge configs exist. |
| **E2E test coverage** | Medium | Medium | Playwright is configured but test coverage breadth is unknown. The `e2e-check-routes.mjs` script checks route accessibility but likely doesn't cover workflows. |
| **Assignment engine — fetch optimization** | Low | Low | `rankTeachersForRequest` fetches all teachers and all availability records. Add SQL-level filtering for larger datasets. |
| **In-memory rate limiting in production** | Medium | Low | If Upstash is not configured, rate limiting falls back to in-memory (process-local). Ensure Upstash is configured for any multi-instance deployment. |
| **No request idempotency** | Low | Medium | Cover request creation, offer responses, and booking cancellations have no idempotency keys. Double-submits could create duplicate records. |
| **Password reset token cleanup** | Low | Done | Handled by the cron job (`cleanupExpiredPasswordResetTokens`). |
| **Notification cleanup** | Low | Done | Old read notifications cleaned by cron (configurable retention, default 30 days). |
| **`db.sqlite` in repo root** | Low | Low | The `.gitignore` should exclude `*.db` and `*.sqlite` files. Currently `db.sqlite` appears as an untracked file. |

---

## 9. Deployment Considerations

### Vercel Compatibility

| Feature | Compatibility | Notes |
|---------|---------------|-------|
| App Router | Full | Vercel is the primary platform for Next.js. |
| Server Components | Full | Natively supported. |
| SSE streaming | Partial | Vercel Serverless Functions have a 25-second timeout (Hobby) or 5-minute timeout (Pro). SSE connections will be terminated at the timeout boundary. Vercel Edge Functions have longer streaming support but cannot run `better-sqlite3` (native module). |
| SQLite | Incompatible | Vercel serverless functions have ephemeral filesystems. `better-sqlite3` requires a writable filesystem and native binary compilation. The database file will not persist across invocations. |
| `output: "standalone"` | Partial | This mode bundles the app for container deployment, not Vercel's default serverless mode. On Vercel, this may cause unexpected behavior. |
| Sentry | Full | The `withSentryConfig` wrapper is compatible with Vercel's build pipeline. |
| Cron | Full | Vercel Cron Jobs can call `/api/cron` on a schedule with the `CRON_SECRET`. |

### SQLite in Serverless — The Core Deployment Challenge

The most significant deployment constraint is SQLite's incompatibility with serverless platforms:

1. **Vercel Functions:** Ephemeral filesystem. Each invocation gets a fresh filesystem, so the database file is lost. This is fundamentally incompatible with a writable SQLite database.

2. **Solutions:**
   - **Turso/LibSQL:** Drizzle-native. Edge-compatible. Closest drop-in replacement. Provides a hosted SQLite-compatible database with HTTP-based access.
   - **Docker/VPS deployment:** Use the `output: "standalone"` config to deploy as a Docker container on Railway, Fly.io, Render, or a VPS. SQLite works perfectly in this model with a persistent volume.
   - **PlanetScale/Neon/Supabase:** Full Postgres migration (higher effort, see Section 5).

3. **Recommended path:** For initial production deployment, use a **Docker container on Railway or Fly.io** with a persistent volume. This requires zero code changes and preserves SQLite's simplicity. Plan a Turso migration if edge deployment or horizontal scaling becomes necessary.

### Edge Runtime Constraints

- `better-sqlite3` is a native Node.js module (C++ bindings). It cannot run in Vercel's Edge Runtime or Cloudflare Workers.
- The `serverExternalPackages: ["better-sqlite3"]` config in `next.config.ts` correctly excludes it from bundling, but this only helps with the Node.js runtime, not edge.
- SSE routes use `force-dynamic` export, which disables static generation. These must run in the Node.js runtime.

### Environment Variables Required for Production

| Variable | Required | Purpose |
|----------|----------|---------|
| `SESSION_SECRET` | Yes | HMAC key for cookie signing. Must be a strong random string. |
| `DATABASE_URL` | No (defaults to `./quicksupply.db`) | Path to SQLite database file. |
| `CRON_SECRET` | Yes (prod) | Protects the `/api/cron` endpoint. |
| `UPSTASH_REDIS_REST_URL` | Recommended | Upstash Redis URL for distributed rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Upstash Redis auth token. |
| `RESEND_API_KEY` | Recommended | Resend API key for transactional email. No-op if unset. |
| `FROM_EMAIL` | No | Sender address for emails. Defaults to Resend sandbox. |
| `SENTRY_ORG` | Recommended | Sentry organization slug. |
| `SENTRY_PROJECT` | Recommended | Sentry project slug. |
| `SENTRY_AUTH_TOKEN` | Recommended | Sentry auth token for source maps. |
| `NOTIFICATION_RETENTION_DAYS` | No | Days to keep read notifications (default: 30). |

---

## Summary

QuickSupply is a well-structured, early-stage Next.js 16 application with solid architectural foundations. The three-portal pattern, SSE real-time system, and sequential assignment engine are cleanly implemented. The primary technical risks are:

1. **SQLite deployment:** The biggest blocker for production deployment on serverless platforms. A Docker/VPS deployment or Turso migration is needed.
2. **Missing middleware.ts:** Auth enforcement is per-layout, which is fragile. Adding centralized middleware is a high-priority, low-effort improvement.
3. **Missing indexes:** Not a problem at current scale but should be added proactively before production load.
4. **SSE reliability:** Events are fire-and-forget with no persistence. Disconnected clients miss events and rely on page refresh to catch up. This is acceptable for an MVP but should be addressed for production reliability.

The technology choices are mature, appropriate for the use case, and internally consistent. The codebase demonstrates good engineering practices: typed schemas, validated inputs, rate-limited endpoints, signed sessions, and comprehensive notification flows.
