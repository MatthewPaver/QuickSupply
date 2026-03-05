# Concerns & Technical Debt

## Known Issues

### From README "What's Left To Do"

**Priority 1 (Polish & Bug Fixes):**
- SSE client hook not fully integrated (`src/hooks/use-sse.ts` exists but not wired into all portals for live updates)
- Browser Notification API not implemented (no OS notifications when tab unfocused)
- Countdown timer accuracy on teacher jobs page not synced with SSE events
- Responsive design gaps (teacher portal not mobile-first; agency dashboard is desktop-only)
- Missing loading skeletons on server components
- Empty states show plain text instead of illustrated components
- Error boundaries missing in route groups (`error.tsx` files incomplete)

**Priority 2 (MVP Scope):**
- Previous teacher availability indicator not checking availability on cover request form
- Simulated SMS log drawer not yet implemented
- Call simulation modal uses basic `tel:` links instead of modal UI
- Notification bell missing from nav bars (no unread count badge)
- School teacher reviews UI incomplete (seeded only, no form)
- Withdraw active offer button not in assignment panel UI
- Auto-refresh on decline missing (requires SSE integration in assignment panel)

**Priority 3 (Enhancements):**
- Session authentication is base64-encoded HMAC, not production-grade JWT/NextAuth
- No teacher/school CRUD (all data seeded)
- Agent-teacher reassignment UI lacks drag-and-drop
- No filter/search on list pages (agency requests, teachers pages)
- Compliance management forms missing
- Long-term multi-day booking support not implemented
- Travel/distance display incomplete
- Activity/audit log not implemented
- Dashboard analytics missing

**Priority 4 (Production Readiness):**
- PostgreSQL migration not completed (currently SQLite only)
- No real SMS integration (Twilio, etc.)
- Background job runner missing (using client-side cron polling instead of BullMQ/Inngest)
- Deployment configs incomplete
- Unit/integration testing missing (only E2E with Playwright exists)
- Input sanitization/Zod validation not comprehensive across API routes

---

## Security

### Authentication Weaknesses

1. **Session Cookie Design** (`src/lib/auth.ts`)
   - Uses base64-encoded JSON + HMAC-SHA256 signature
   - Works but is not industry-standard (JWT or NextAuth.js recommended)
   - No token refresh mechanism; 24-hour expiry is reasonable but rigid
   - Risk: Session hijacking if cookie stolen; no rotation strategy

2. **Development Default Secret**
   - Falls back to `dev-unsafe-secret-change-in-production` if `SESSION_SECRET` not set in dev
   - Only enforced in production; development fallback is unguarded
   - Risk: Accidental deployment of dev code with weak secret

3. **Login Endpoint** (`src/app/api/auth/login/route.ts`)
   - Uses `bcrypt.compareSync()` (blocking, but low volume)
   - No async/await for bcrypt comparison (minor performance concern in high-load)
   - Rate limited to 5 per 15 minutes per IP (adequate)
   - Risk: Timing attacks not completely mitigated (bcrypt is slow by design, but better to use async)

4. **Email User Enumeration** (`src/app/api/auth/forgot-password/route.ts`)
   - Returns generic "If that email is registered..." message (good)
   - But database queries expose whether email exists via response time
   - Rate limiting helps but timing attacks possible
   - Risk: User enumeration via response timing

5. **Compliance Status Not Verified on Session**
   - Session only stores `userId`, `role`, `name`
   - No check that teachers/agents remain compliant during long sessions
   - Risk: Non-compliant user can act if compliance status expires mid-session

### Input Validation Gaps

1. **Inconsistent Validation** (`src/app/api/requests/route.ts`)
   - No Zod schema validation on API routes
   - Manual type checking with `eslint-disable @typescript-eslint/no-explicit-any`
   - Fields like `date`, `subject`, `notes` not validated for length/format
   - Risk: Injection attacks, XSS if fields rendered without escaping

2. **API Route Handlers** (`src/app/api/assignments/route.ts`, `src/app/api/offers/route.ts`)
   - Minimal input validation (only required field checks)
   - No schema validation on POST/PATCH bodies
   - Risk: Malformed or oversized payloads not rejected early

3. **Assignment Engine Input** (`src/lib/assignment-engine.ts`)
   - Accepts request IDs without validation
   - No checks for string injection in query parameters
   - Risk: If ID format not enforced, could break queries

### Cron Endpoint Security

1. **`/api/cron` Authentication** (`src/app/api/cron/route.ts`)
   - Requires `CRON_SECRET` in non-dev environments
   - Secret checked against Bearer token or query param (both allowed)
   - Risk: Query param in logs/browser history exposes secret; Bearer auth preferred
   - Recommendation: Deprecate query param method

### Rate Limiting

1. **In-Memory Fallback** (`src/lib/rate-limit.ts`)
   - Falls back to in-memory store if Upstash Redis unavailable
   - Per-instance limits; multi-instance deployments not protected
   - Cleanup runs every 60 seconds (memory accumulation risk in long-running instances)
   - Risk: Rate limit evasion in distributed setup; memory leak in extreme scenarios

2. **Limited Scope**
   - Only protects login, password reset, and generic API rate limits
   - No per-user limits on cover request creation (only per IP)
   - Risk: Single user could spam requests to fill database

### Data Privacy

1. **Account Deletion** (`src/app/api/me/route.ts`)
   - PII anonymized (name, email, phone → "deleted")
   - Password set to unhashable placeholder
   - Bookings/reviews/notifications NOT anonymized
   - Risk: Historical records still link deleted user to activities

2. **Notification Log**
   - No user consent/opt-out for email notifications
   - All agent creation triggers email notification
   - Risk: GDPR compliance issue without explicit opt-in

### Session Hijacking Risks

1. **HTTPOnly + Secure Flags Set** (good)
2. **No CSRF Protection Visible**
   - No mention of CSRF tokens in POST handlers
   - Next.js provides some protection, but explicit checks absent
   - Risk: Cross-site request forgery on state-changing endpoints

---

## Performance

### Database Bottlenecks

1. **N+1 Queries in Assignment Engine** (`src/lib/assignment-engine.ts`)
   - `rankTeachersForRequest()` loads entire tables:
     - `db.select().from(teachers).all()` (all teachers)
     - `db.select().from(teacherAvailability).all()` (all availability records)
     - Multiple separate queries for blacklist, bookings, reviews
   - Then filters in JavaScript (memory-intensive)
   - Risk: Scales poorly; 1000+ teachers = massive memory/query time

2. **Synchronous Database Calls**
   - All `db.select()` and `db.insert()` are synchronous via `better-sqlite3`
   - No connection pooling visible
   - Risk: Blocking event loop; concurrent requests slow down

3. **Missing Indexes**
   - Only one index: `notification_log_read_created_at_idx`
   - Missing on `cover_requests(date, status)`, `assignmentOffers(coverRequestId, status)`, `bookings(teacherId, date)`
   - Risk: Full table scans on common queries

4. **SSE Memory Accumulation** (`src/lib/sse-manager.ts`)
   - Singleton instance holds all active SSE listeners in memory
   - No cleanup on connection drop/timeout
   - Risk: Memory leak if client disconnect not properly handled

### Cron Polling Issues

1. **Client-Side Polling**
   - Offer expiry checked via `/api/cron` polling
   - In production, typically needs external scheduler (Vercel Cron, GitHub Actions)
   - Without scheduler, offers don't expire until next cron call
   - Risk: Expired offers still showable to teachers

2. **No Background Job Queue**
   - No BullMQ, Inngest, or similar
   - All maintenance (offer expiry, token cleanup) runs synchronously in cron
   - Risk: Cron endpoint can hang if cleanup is slow

### Frontend Performance

1. **No Code Splitting Visible**
   - Next.js App Router should handle this, but not explicitly configured
   - All three portals (school, teacher, agency) bundled together
   - Risk: Initial JS bundle larger than necessary

2. **SSE Reconnection Logic**
   - `use-sse.ts` hook exists but integration incomplete
   - Manual reconnection/backoff not visible
   - Risk: Dropped connections not retried; UI goes stale

3. **Countdown Timer Client-Side**
   - Countdown on teacher jobs page uses `setInterval()` client-side
   - Drifts over time; no server sync
   - Risk: Timer expires but teacher thinks offer still active

---

## Technical Debt

### Authentication

1. **No JWT/NextAuth.js**
   - Custom session implementation is simpler but less battle-tested
   - No OAuth/social login (demo mode only)
   - No multi-factor authentication (MFA)

2. **Password Reset Flow**
   - Token stored as SHA256 hash (good)
   - But no rate limiting on password reset confirmation endpoint (only request)
   - Token validity not cryptographically bound to user

### Database

1. **SQLite in Production**
   - Schema locked to SQLite; no abstraction for multi-DB
   - Foreign key constraints not enforced by default (no `PRAGMA foreign_keys = ON` visible)
   - No transaction isolation (SQLite is single-writer)
   - Risk: Data inconsistency if concurrent writes attempted

2. **Drizzle ORM Usage**
   - Synchronous `.get()` and `.all()` calls throughout
   - No query builder optimization (raw SQL in critical paths)
   - Risk: Hard to scale; refactoring needed for async

3. **Schema Assumptions**
   - Dates stored as ISO strings (`YYYY-MM-DD`), not integers
   - Times stored as text (`HH:MM`), not seconds
   - Risk: Sorting/comparison bugs if not handled carefully

### State Management

1. **No Centralized State**
   - SSE manager is in-memory singleton
   - No Zustand, Redux, or Tanstack Query
   - Each portal (school, teacher, agency) manages state locally
   - Risk: Inconsistent data across portal refreshes

2. **SSE as Single Source of Truth**
   - Agency dashboard relies on SSE for live updates
   - If SSE disconnects, UI stale until manual refresh
   - No fallback polling visible

### Error Handling

1. **Sparse Error Boundaries**
   - Root-level `error.tsx` exists (`src/app/error.tsx`)
   - But layout-level error boundaries incomplete
   - No granular error recovery (e.g., failed SSE reconnection)
   - Risk: App-wide crashes not isolated

2. **API Error Responses**
   - Mix of 400, 401, 403, 429, 500 status codes
   - Error messages not localized
   - Some endpoints return generic "Invalid JSON body" vs detailed field errors

### Code Organization

1. **Component Size**
   - `src/components/agency/assignment-panel.tsx` likely large (assignment logic + UI)
   - `src/lib/assignment-engine.ts` does ranking + DB writes (mixed concerns)
   - Risk: Hard to test and refactor

2. **No Separation of Concerns**
   - API routes mix authorization, validation, business logic
   - Notifications created as side effects in multiple places
   - Risk: Logic duplication; hard to reason about

### Testing

1. **No Unit Tests**
   - Assignment engine logic not testable in isolation
   - No tests for scoring algorithm (e.g., preferred teacher weight, distance calculation)
   - Risk: Regressions on score updates

2. **E2E Tests Limited**
   - Two Playwright test files (`e2e/smoke.spec.ts`, `e2e/full-demo-flow.spec.ts`)
   - Route smoke test (`scripts/e2e-check-routes.mjs`) is basic
   - Risk: Edge cases (offer expiry timing, concurrent requests) not covered

3. **No Integration Tests**
   - Database seeding and workflow integration not tested
   - Request → Assignment → Booking flow not validated
   - Risk: Breaking changes discovered late

### Logging & Observability

1. **Minimal Structured Logging**
   - Some `console.log()` calls in email, SSE manager
   - No request tracing or correlation IDs
   - Risk: Hard to debug production issues

2. **Sentry Integration Conditional**
   - Optional via `NEXT_PUBLIC_SENTRY_DSN`
   - No enforced error monitoring in production
   - Risk: Errors not captured without manual Sentry setup

### Deployment

1. **SQLite File Storage in Docker**
   - Dockerfile includes `/app/data` volume mount for persistence
   - Single-instance only; multi-replica deployments lose data
   - Risk: Data loss if container recreated without volume

2. **Build Args Needed**
   - Dockerfile requires `NEXT_PUBLIC_DEMO_MODE`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SENTRY_DSN`
   - Defaults to `NEXT_PUBLIC_DEMO_MODE=false` and `http://localhost:3000`
   - Risk: Accidental demo mode in production if not overridden

3. **Runtime Database Migrations**
   - No migration runner visible in `Dockerfile` entrypoint
   - Drizzle migrations copied but not executed
   - Risk: Schema mismatch on deploy

### Dependencies

1. **Outdated or Pinned Versions**
   - Next.js 16.1.6 (current)
   - React 19.2.3 (current)
   - But `bcryptjs` 3.0.3 (not latest; `bcrypt` 5.x recommended for async)
   - Risk: Security patches delayed

2. **Missing Security Headers**
   - No visible `next.config.ts` security headers (HSTS, CSP, etc.)
   - Risk: XSS, clickjacking vulnerabilities

---

## Missing Features

### From README Priority Levels

**Priority 1 (Polish & Bug Fixes):**
- SSE client hook for agency dashboard, teacher jobs page, school dashboard
- Browser Notification API with permission request
- Countdown timer sync with SSE expiry events
- Mobile-first responsive design (teacher portal, agency dashboard)
- Loading skeletons for all server components
- Illustrated empty state components
- Error boundaries in each route group

**Priority 2 (MVP Scope):**
- API endpoint to check teacher availability for a given date
- SMS log drawer UI (persistent, lists simulated SMS)
- Call simulation modal (animated ringing, connected state, timer)
- Notification bell in nav bars with unread count
- School teacher review form (5-star rating, comment)
- Withdraw offer UI button (API supports, missing in UI)
- Auto-refresh assignment panel on teacher decline

**Priority 3 (Enhancements):**
- Proper JWT or NextAuth authentication
- Teacher/school CRUD forms (create, edit, delete)
- Agent-teacher reassignment with drag-and-drop
- Filter/search on agency pages (status, date range, text search)
- Compliance management forms (update status, dates, documents)
- Long-term booking support (date range instead of single date)
- Distance/travel display on assignment panel
- Activity/audit log timeline on requests
- Dashboard analytics (fill rate, avg time-to-fill, response rates)

**Priority 4 (Production Readiness):**
- PostgreSQL migration (schema, connection pooling, async queries)
- Real SMS integration (Twilio, AWS SNS, etc.)
- Background job runner (BullMQ, Inngest, or similar)
- Deployment guides and configs (Railway, Render, Heroku, etc.)
- Unit tests for assignment engine, scoring algorithm
- Integration tests for workflow (request → assign → book)
- Comprehensive Zod schema validation on all API routes

---

## Fragile Areas

### Assignment Scoring Algorithm (`src/lib/assignment-engine.ts`)

1. **Tight Coupling to Database**
   - Ranking logic loads entire tables in memory
   - Business rules scattered in conditionals (filtering, scoring)
   - Risk: Hard to test; slow with large datasets

2. **Hard-Coded Weights**
   - Preferred teacher: +200 points
   - Agency rating: ×20
   - School reviews: ×10
   - Distance: +30 max
   - Driving: +25
   - Previous work: +15
   - Risk: No way to tune without code change; no admin UI

3. **Floating-Point Math**
   - Distance calculation: `Math.min(30, 30 / Math.max(distanceMiles, 0.5))`
   - No rounding/precision handling
   - Risk: Score ties not deterministic

4. **Availability Checking**
   - Specific date availability overrides recurring pattern
   - If no data, defaults to available
   - Risk: Teacher unavailable but appears eligible; offer sent anyway

### Teacher Jobs Page (`src/app/teacher/jobs/page.tsx`)

1. **Countdown Timer Drifts**
   - Client-side `setInterval()` every 1 second
   - No sync with server time or SSE events
   - Risk: Timer hits zero but offer still pending; confusing UX

2. **Manual Refresh Needed**
   - SSE hook not fully integrated
   - User must refresh to see new offers
   - Risk: Teacher misses time-sensitive offers

### Agency Assignment Panel (`src/components/agency/assignment-panel.tsx`)

1. **Manual State Management**
   - Likely using `useState()` for offer sequence
   - No re-ranking on decline (requires API call + manual refresh)
   - Risk: Stale ranked list; wrong teacher offered next

2. **No Pagination/Virtualization**
   - If 100+ teachers, full list loaded
   - Risk: Slow rendering; memory bloat

### Cover Request Form (`src/components/school/cover-request-form.tsx`)

1. **No Availability Check on Preferred Teacher**
   - Form shows previous teachers but doesn't check if available
   - Risk: School picks unavailable preferred teacher; request fails

2. **No Form Validation Schema**
   - Manual validation likely
   - Risk: Invalid dates, times submitted

### Notification System

1. **Fire-and-Forget Email** (`src/lib/notifications.ts`)
   - `sendNotificationEmail().catch(() => {})` silently fails
   - No retry or fallback
   - Risk: Emails never sent if Resend fails

2. **No Unsubscribe/Preferences**
   - All agents get all notifications
   - No way to mute offer notifications
   - Risk: Alert fatigue; users might ignore critical alerts

### SSE Infrastructure

1. **In-Memory Listener Accumulation**
   - If client disconnects ungracefully, listener stays in `sseManager`
   - Risk: Memory leak; messages queued for disconnected clients

2. **No Heartbeat/Ping**
   - SSE connection can appear live but be dead
   - Risk: UI doesn't know connection dropped until next event

### Database Constraints

1. **No Foreign Key Enforcement**
   - SQLite foreign keys disabled by default
   - Orphaned records possible (e.g., deleted teacher still in bookings)
   - Risk: Data inconsistency; reporting queries break

2. **No Transactions Visible**
   - Assignment acceptance doesn't atomically:
     1. Accept offer
     2. Create booking
     3. Mark request filled
     4. Notify school
   - Risk: Partial state if process interrupted

---

## Performance Concerns

### Query Performance

1. **Full Table Loads**
   ```typescript
   const allTeachers = db.select().from(teachers).all();
   const allAvailability = db.select().from(teacherAvailability).all();
   ```
   - Called on every ranking (could be 100+ requests/day)
   - Loads all records, filters in JavaScript
   - Risk: O(n×m) complexity; slows exponentially with data

2. **Missing Indexes**
   - Queries like `WHERE coverRequestId = ? AND status = ?` have no index
   - Risk: Full table scans for each offer lookup

### Memory Usage

1. **SSE Listener Map**
   - Grows with concurrent connections
   - No automatic cleanup
   - Risk: Memory bloat in production

2. **Assignment Ranking Buffers**
   - `RankedTeacher[]` array holds all eligible teachers
   - Copied/filtered multiple times
   - Risk: Large arrays (1000+) cause garbage collection pauses

### Network

1. **SSE as Only Real-Time Channel**
   - No WebSocket fallback
   - SSE reconnection not optimal
   - Risk: Real-time updates lag on poor connections

2. **Countdown Timer Polling**
   - Browser polls `/api/cron` every ~30s (unclear from code)
   - Risk: Unnecessary traffic; cron is server-side, not client-side polling

---

## Environment & Deployment Risks

### Configuration

1. **Missing `SESSION_SECRET` in Production**
   - Defaults to development fallback if not set
   - No startup validation
   - Risk: Silently uses weak secret

2. **SQLite Path Hardcoded in Docker**
   - `DATABASE_URL=/app/data/quicksupply.db`
   - Can't override without rebuild
   - Risk: Multi-instance setups break

### Scaling Limitations

1. **Stateful SSE Manager**
   - Server restart loses all connections
   - Risk: Users must reconnect; brief downtime

2. **In-Memory Rate Limiting**
   - Per-instance only
   - Multi-instance deployments each have separate limits
   - Risk: Rate limit bypass via load balancer round-robin

3. **No Connection Pooling**
   - SQLite doesn't pool (single-writer)
   - Concurrent requests queue up
   - Risk: Slow response times under load

---

## Summary of High-Risk Areas

1. **Authentication**: Custom session implementation not production-grade; no JWT/NextAuth
2. **Input Validation**: Inconsistent/missing Zod schemas; manual validation error-prone
3. **Database**: SQLite doesn't scale; N+1 queries in assignment engine; no indexes
4. **Performance**: In-memory ranking with full table loads; SSE listener leak risk
5. **Testing**: No unit/integration tests; only E2E smoke tests
6. **Error Handling**: Sparse error boundaries; silent email failures
7. **Real-Time**: SSE integration incomplete; countdown timer drifts
8. **Deployment**: SQLite file storage; no runtime migrations; no multi-instance support

**Critical Path to Production:**
- Add input validation (Zod) to all API routes
- Implement PostgreSQL migration strategy
- Add unit tests for assignment engine
- Fix SSE integration and countdown timer sync
- Upgrade authentication to JWT/NextAuth
- Implement proper error boundaries and logging
- Add database indexes and optimize queries
