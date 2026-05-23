# QuickSupply Architecture Document

**Version:** 1.0
**Last Updated:** 2026-03-27
**Status:** Living document reflecting current implementation

---

## 1. System Overview

QuickSupply is a **supply teacher management platform** built for Desian Education, a UK-based supply teaching agency. It replaces manual phone/SMS-based workflows with a web application that automates the process of matching schools needing cover with available supply teachers.

The system operates as a **monolithic Next.js 16 application** with three role-based portals:

- **School Portal** (`/school/*`) — Schools submit cover requests, view booking history, and review teachers after assignments.
- **Teacher Portal** (`/teacher/*`) — Teachers manage availability, receive and respond to job offers, and maintain their profile preferences.
- **Agency Portal** (`/agency/*`) — Agency staff manage the teacher and school rosters, configure system settings, oversee cover requests, trigger the automated assignment engine, and manually intervene when needed.

All three portals share a single codebase, a single deployment, and a single SQLite database. Authentication determines which portal a user accesses after login. There is one unified login page at `/login`.

### Core Workflow

1. A school submits a cover request (date, role, subject, times).
2. Agency staff review the request and either start the automated offering sequence or manually assign a teacher.
3. The assignment engine ranks eligible teachers by a weighted scoring algorithm and sends offers sequentially.
4. Each teacher receives a time-limited offer (configurable window). If they decline or the offer expires, the system auto-advances to the next ranked teacher.
5. When a teacher accepts, a booking is created and both the school and agency are notified in real time via SSE.
6. After the booking date passes, the school can submit a review with a star rating and "would rebook" flag.

---

## 2. Architecture Diagram

```
+------------------------------------------------------------------+
|                        CLIENT BROWSERS                           |
|                                                                  |
|  +----------------+  +-----------------+  +-------------------+  |
|  | School Portal  |  | Teacher Portal  |  |  Agency Portal    |  |
|  | /school/*      |  | /teacher/*      |  |  /agency/*        |  |
|  +-------+--------+  +--------+--------+  +---------+---------+  |
|          |                     |                     |            |
+----------+---------------------+---------------------+------------+
           |                     |                     |
           v                     v                     v
+------------------------------------------------------------------+
|                     NEXT.JS 16 APP ROUTER                        |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                    React Server Components                  |  |
|  |  (Server-rendered pages with streaming, Suspense boundaries)|  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                     API Route Layer                         |  |
|  |  /api/auth/*          Authentication & sessions             |  |
|  |  /api/requests        Cover request CRUD                    |  |
|  |  /api/assignments     Assignment engine actions             |  |
|  |  /api/offers          Teacher offer responses               |  |
|  |  /api/agency/*        Agency management endpoints           |  |
|  |  /api/teacher/*       Teacher profile & availability        |  |
|  |  /api/school/*        School-specific endpoints             |  |
|  |  /api/notifications   Notification retrieval & marking      |  |
|  |  /api/settings        App config (response windows, etc.)   |  |
|  |  /api/sse/*           Server-Sent Events streams            |  |
|  |  /api/cron            Scheduled maintenance tasks           |  |
|  |  /api/health          Health check                          |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                  Business Logic Layer                       |  |
|  |                                                             |  |
|  |  assignment-engine.ts  — Ranking, offering, accept/decline  |  |
|  |  notifications.ts      — Persistent log + email dispatch    |  |
|  |  sse-manager.ts        — In-memory pub/sub for SSE          |  |
|  |  distance.ts           — Haversine distance calculation     |  |
|  |  rate-limit.ts         — Upstash Redis / in-memory fallback |  |
|  |  api-validation.ts     — Zod schemas for all endpoints      |  |
|  |  auth.ts               — HMAC-signed cookie sessions        |  |
|  |  email.ts              — Resend transactional email          |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                    Data Access Layer                        |  |
|  |  Drizzle ORM (type-safe, synchronous better-sqlite3 driver) |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
+------------------------------+-----------------------------------+
                               |
                               v
                  +------------------------+
                  |    SQLite Database      |
                  |   (WAL mode, FK on)     |
                  |   quicksupply.db        |
                  +------------------------+

External Services:
  +-------------------+     +-------------------+
  | Upstash Redis     |     | Resend Email      |
  | (rate limiting)   |     | (transactional)   |
  +-------------------+     +-------------------+

  +-------------------+
  | Sentry            |
  | (error tracking)  |
  +-------------------+
```

---

## 3. Technology Decisions

### Next.js 16 App Router (v16.1.6)

**Why:** Server-first rendering model with React Server Components reduces client-side JavaScript. The App Router provides nested layouts that map naturally to the three-portal structure. Turbopack development server offers fast iteration. Standalone output mode simplifies deployment.

**Trade-offs accepted:**
- No middleware.ts in use (auth checks happen at the API/page level instead) — this avoids the edge runtime constraint that would conflict with better-sqlite3.
- SSE endpoints require `force-dynamic` to prevent static optimization.

### SQLite + better-sqlite3 + Drizzle ORM

**Why:** Zero-ops database for an MVP. No external database server to provision. Synchronous better-sqlite3 driver is faster than async alternatives for single-server workloads. Drizzle provides full TypeScript type safety with minimal abstraction. WAL mode enables concurrent reads during writes.

**Trade-offs accepted:**
- Single-server constraint: SQLite does not support multi-process writes, ruling out horizontal scaling.
- Serverless limitation: Vercel's ephemeral filesystem means SQLite requires a persistent volume or a switch to Turso/PostgreSQL for production.
- Known scalability ceiling of approximately 100 concurrent users before write contention becomes an issue.

### Server-Sent Events (SSE) over WebSocket

**Why:** The real-time requirements are unidirectional (server-to-client notifications). SSE is simpler to implement, works over standard HTTP, requires no special infrastructure, and auto-reconnects natively in browsers. The in-memory `SSEManager` singleton handles pub/sub with channel-based routing.

**Trade-offs accepted:**
- In-memory pub/sub means SSE state is lost on server restart.
- Not compatible with multi-instance deployments without adding Redis Pub/Sub as a backing store.
- Maximum of ~6 concurrent SSE connections per domain in HTTP/1.1 browsers (HTTP/2 removes this limit).

### Cookie-based Sessions over JWT

**Why:** httpOnly cookies prevent XSS-based token theft. HMAC-SHA256 signed payloads provide tamper detection without server-side session storage. `sameSite: lax` provides baseline CSRF protection. 24-hour expiry balances security with usability for daily-use workflows.

**Trade-offs accepted:**
- Stateless sessions mean no server-side revocation (logout deletes the cookie but a captured token remains valid until expiry).
- Session payload is base64-encoded JSON (userId, role, name) — not encrypted, only signed. Sensitive data should not be added to the session.

### OKLCh Color Space

**Why:** Perceptually uniform color space ensures consistent visual contrast across the UI. The Desian Education brand colors (purple `#4c0673`, blue `#1863DC`, light purple `#c879f1`) are defined in OKLCh for predictable lightness adjustments in light/dark themes. Modern CSS `oklch()` is supported in all target browsers.

**Trade-offs accepted:**
- Older browsers (pre-2023) do not support `oklch()`. Acceptable for a business application targeting modern browsers.

### Additional Technology Choices

| Technology | Purpose | Rationale |
|---|---|---|
| **Tailwind CSS v4** | Styling | Utility-first, design-system-friendly, v4 uses CSS-native `@theme` |
| **Radix UI** | Accessible primitives | Headless components ensure WCAG compliance without opinionated styling |
| **Zod v4** | Runtime validation | Type-safe schema validation on all API inputs; integrates with react-hook-form |
| **react-hook-form** | Form state | Performant uncontrolled forms, native Zod resolver |
| **date-fns** | Date manipulation | Tree-shakeable, immutable, locale-aware |
| **ULID** | Primary keys | Time-sortable, URL-safe, no coordination needed |
| **bcryptjs** | Password hashing | Pure JS bcrypt (no native dependency issues) |
| **Resend** | Transactional email | Simple API, generous free tier, graceful no-op when unconfigured |
| **Upstash Redis** | Rate limiting | Serverless Redis with built-in rate limiter SDK; in-memory fallback for dev |
| **Sentry** | Error tracking | Automatic source maps, Next.js SDK integration |
| **Playwright** | E2E testing | Cross-browser testing with reliable selectors |

---

## 4. Data Architecture

### 4.1 Entity-Relationship Diagram

```
+-------------------+       +-------------------------+       +------------------+
|     schools       |       |    cover_requests       |       |    teachers      |
+-------------------+       +-------------------------+       +------------------+
| id (PK, ULID)    |<------o| school_id (FK)          |       | id (PK, ULID)   |
| name              |       | id (PK, ULID)           |o----->| first_name       |
| address           |       | date (ISO YYYY-MM-DD)   |       | last_name        |
| postcode          |       | role_needed (enum)      |       | email            |
| lat, lng          |       | subject                 |       | phone            |
| contact_name      |       | key_stage               |       | password_hash    |
| contact_email     |       | start_time (HH:MM)      |       | postcode         |
| contact_phone     |       | end_time (HH:MM)        |       | lat, lng         |
| password_hash     |       | notes                   |       | can_drive        |
| phase (enum)      |       | preferred_teacher_id(FK)|       | max_distance_mi  |
| created_at        |       | status (enum)           |       | role_type (enum) |
| is_active         |       | is_emergency            |       | emergency_avail  |
+-------------------+       | created_at              |       | contact_night..  |
        |                   +-------------------------+       | agency_rating    |
        |                              |                      | compliance_*     |
        |                              |                      | dbs_status/expiry|
        |                   +----------+----------+           | right_to_work    |
        |                   |                     |           | long_term_willing|
        |          +--------v--------+   +--------v--------+  | created_at       |
        |          | assignment_     |   |    bookings      |  | is_active        |
        |          | offers          |   +------------------+  +------------------+
        |          +-----------------+   | id (PK, ULID)   |         |
        |          | id (PK, ULID)   |   | cover_request_id|         |
        |          | cover_request_id|   | teacher_id (FK) |         |
        |          | teacher_id (FK) |   | confirmed_at    |         |
        |          | offered_at      |   | cancelled_at    |         |
        |          | expires_at      |   | cancelled_by    |         |
        |          | status (enum)   |   | cancel_reason   |         |
        |          | response_at     |   | created_at      |         |
        |          | offer_order     |   +------------------+         |
        |          | created_at      |          |                     |
        |          +-----------------+          |                     |
        |                                      |                     |
        |          +---------------------------+|                     |
        |          |                            |                     |
        |  +-------v-------------------+        |                     |
        |  | school_teacher_reviews    |        |                     |
        +->| id (PK, ULID)            |        |                     |
           | school_id (FK)           |        |                     |
           | teacher_id (FK)          |<-------+---------------------+
           | booking_id (FK)          |
           | rating (1-5)             |
           | comment                  |
           | would_rebook             |
           | created_at               |
           +---------------------------+

+---------------------------+     +---------------------------+
| teacher_availability      |     | teacher_blacklisted_      |
+---------------------------+     | schools                   |
| id (PK, ULID)            |     +---------------------------+
| teacher_id (FK)           |     | teacher_id (PK, FK)       |
| date (ISO, nullable)      |     | school_id  (PK, FK)       |
| day_of_week (0-6, nullable|     | reason                    |
| is_available               |     +---------------------------+
| is_recurring               |
| created_at                 |     +---------------------------+
+---------------------------+     | agent_teacher_assignments |
                                  +---------------------------+
+---------------------------+     | agent_id (PK, FK)         |
| agents                    |     | teacher_id (PK, FK)       |
+---------------------------+     +---------------------------+
| id (PK, ULID)            |
| name                      |     +---------------------------+
| email                     |     | notification_log          |
| password_hash             |     +---------------------------+
| is_admin                  |     | id (PK, ULID)            |
| created_at                |     | recipient_type (enum)     |
+---------------------------+     | recipient_id              |
                                  | type (enum)               |
+---------------------------+     | title                     |
| app_config                |     | body                      |
+---------------------------+     | read (boolean)            |
| key (PK)                  |     | related_entity_type       |
| value (JSON string)       |     | related_entity_id         |
+---------------------------+     | created_at                |
                                  +---------------------------+
+---------------------------+     IDX: (read, created_at)
| password_reset_tokens     |
+---------------------------+
| id (PK, ULID)            |
| user_id                   |
| role (enum)               |
| token_hash (UNIQUE)       |
| expires_at                |
| created_at                |
+---------------------------+
IDX: (user_id, role)
IDX: (expires_at)
```

### 4.2 Key Design Decisions

| Decision | Rationale |
|---|---|
| **ULID primary keys** | Time-sortable (no need for `ORDER BY created_at` in many queries), URL-safe, globally unique without coordination. Generated via the `ulid` npm package. |
| **ISO date strings** for calendar dates (`YYYY-MM-DD`) | Dates like cover request dates and DBS expiry are calendar dates with no timezone component. Storing as text avoids timezone conversion bugs. |
| **Integer timestamps** for event times (`created_at`, `offered_at`, etc.) | Drizzle's `{ mode: "timestamp" }` stores Unix epoch integers but exposes `Date` objects in TypeScript. Efficient for comparisons and sorting. |
| **Enum columns as text with constraints** | SQLite lacks native enums. Drizzle enforces valid values at the ORM level; the database stores plain text. |
| **Composite primary keys** for junction tables | `agent_teacher_assignments` and `teacher_blacklisted_schools` use `(entity1_id, entity2_id)` composite PKs to enforce uniqueness without a surrogate key. |
| **Soft-delete pattern** for bookings | `cancelled_at` + `cancelled_by` instead of row deletion preserves audit trail. Cover requests use a status enum (`pending` / `offering` / `filled` / `cancelled`). |
| **`app_config` key-value table** | Runtime-configurable values (response window durations) without code deployment. Values are JSON-encoded strings. |

### 4.3 Indexing Strategy

Currently minimal, reflecting the MVP's small data volume:

- **`notification_log`**: Composite index on `(read, created_at)` for the unread-notifications query.
- **`password_reset_tokens`**: Unique index on `token_hash` for O(1) token lookup; index on `(user_id, role)` for cleanup; index on `expires_at` for expiry sweeps.
- **Primary keys** and **foreign keys** provide implicit indexes on all relationship columns.

As data grows, the following indexes should be added:
- `cover_requests(date, status)` for dashboard date-range queries.
- `bookings(teacher_id, cover_request_id)` for teacher schedule lookups.
- `assignment_offers(cover_request_id, status)` for offer-chain traversal.

### 4.4 Migration Approach

Drizzle Kit manages schema migrations:

```
pnpm db:generate   # Generates SQL migration from schema diff
pnpm db:migrate    # Applies pending migrations
pnpm db:studio     # Opens Drizzle Studio for data inspection
```

Migration files are stored in `/drizzle/` with sequential numbering. Current migrations:

| Migration | Description |
|---|---|
| `0000_chief_madripoor.sql` | Initial schema (all core tables) |
| `0001_password_reset_tokens.sql` | Forgot-password flow |
| `0002_security_hardening.sql` | Additional security indexes |
| `0003_teacher_management.sql` | Teacher management fields |
| `0004_teacher_active.sql` | `is_active` flag on teachers |
| `0005_school_phase.sql` | School `phase` enum column |
| `0006_school_active.sql` | `is_active` flag on schools |
| `0007_review_rebook.sql` | `would_rebook` on reviews |

Snapshot JSON files in `/drizzle/meta/` track schema state for diff computation.

---

## 5. API Architecture

### 5.1 Route Structure

Routes are organized by concern, with agency-specific management routes namespaced under `/api/agency/`:

```
/api
  /auth
    /login          POST    — Email/password authentication
    /forgot-password POST   — Request password reset email
    /reset-password  POST   — Consume reset token, set new password
    route.ts         POST   — Demo/dev login (by userId)
                     DELETE — Logout (destroy session)

  /requests          GET    — List cover requests (scoped by role)
                     POST   — Create cover request (school only)

  /assignments       POST   — Assignment engine actions:
                              start_offering, manual_assign,
                              cancel_booking, withdraw_offer,
                              rank_teachers (agency only)

  /offers            PATCH  — Teacher responds: accept or decline

  /teacher
    /profile         PATCH  — Update teacher preferences
    /availability    POST   — Set recurring + specific-date availability
    /availability/check GET — Check teacher availability for a date
    /offers          GET    — List offers for current teacher

  /school
    /reviews         POST   — Submit post-booking review

  /agency
    /teachers        GET    — List all teachers
                     POST   — Create new teacher
    /teachers/[id]   GET    — Teacher detail
                     PATCH  — Update teacher profile
    /teachers/[id]/compliance   PATCH  — Update DBS, right-to-work, compliance
    /teachers/[id]/credentials  POST   — Set/reset teacher login credentials
    /teachers/[id]/status       PATCH  — Activate/deactivate teacher
    /schools         GET    — List all schools
                     POST   — Create new school
    /schools/[id]    GET    — School detail
                     PATCH  — Update school profile
    /schools/[id]/credentials   POST   — Set/reset school login credentials
    /schools/[id]/status        PATCH  — Activate/deactivate school
    /sms-log         GET    — SMS log placeholder

  /notifications     GET    — Fetch notifications (paginated, unread count)
                     PATCH  — Mark notifications as read

  /settings          GET    — Read app config (agency only)
                     POST   — Update app config (agency only)

  /sse
    /agency          GET    — SSE stream for agency dashboard
    /school/[id]     GET    — SSE stream for a specific school
    /teacher/[id]    GET    — SSE stream for a specific teacher

  /cron              GET    — Scheduled maintenance (secret-protected)
  /health            GET    — Health check
  /me                GET    — Current session info
```

### 5.2 Auth Pattern

There is no `middleware.ts`. Authentication is handled at the route level:

```typescript
// API routes — manual session check
const session = await getSession();
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
if (session.role !== "agent") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

// Server Components — redirect on failure
const session = await requireSession("school");  // redirects to / if not school
```

This approach was chosen because the `middleware.ts` edge runtime cannot use `better-sqlite3` or Node.js crypto APIs. All auth logic runs in the Node.js runtime.

### 5.3 Request/Response Conventions

**Input validation:** Every mutating endpoint validates its body against a Zod schema via the `validateBody()` helper. On failure, the response includes structured field-level errors:

```json
{
  "error": "Validation failed",
  "fieldErrors": {
    "date": ["Date cannot be in the past"],
    "roleNeeded": ["roleNeeded must be 'teacher' or 'ta'"]
  }
}
```

**Success responses:** JSON with relevant data. POST endpoints return the created entity's `id`. Action endpoints return `{ success: boolean, message: string }`.

**Error responses:** JSON with `{ error: string }` and appropriate HTTP status codes (400, 401, 403, 404, 429, 500).

**Rate limiting:** Applied via `getClientIdentifier()` (extracts IP from `x-forwarded-for` or `x-real-ip`) and Upstash Redis rate limiters with in-memory fallback. Login is limited to 5 attempts per 15 minutes; general API calls to 20 per minute.

### 5.4 SSE Endpoints and Event Types

Three SSE endpoints serve role-specific real-time streams:

| Endpoint | Channel | Consumers |
|---|---|---|
| `/api/sse/agency` | `"agency"` | All agency staff |
| `/api/sse/school/[id]` | `"school:{id}"` | Specific school |
| `/api/sse/teacher/[id]` | `"teacher:{id}"` | Specific teacher |

**Event types emitted:**

| Event | Channel(s) | Trigger |
|---|---|---|
| `new_request` | agency | School submits cover request |
| `offer_sent` | agency | Offer dispatched to teacher |
| `new_offer` | teacher:{id} | Teacher receives offer |
| `offer_declined` | agency | Teacher declines |
| `offer_expired` | agency | Offer time window elapsed |
| `offer_withdrawn` | teacher:{id} | Agency withdraws offer |
| `request_filled` | agency, school:{id} | Teacher accepts offer |
| `booking_cancelled` | agency | Booking cancelled |
| `notification` | any | Generic notification push |

SSE connections send heartbeat comments (`: heartbeat\n\n`) every 30 seconds to prevent proxy/load-balancer timeouts.

---

## 6. Business Logic Layer

### 6.1 Assignment Engine

The assignment engine (`src/lib/assignment-engine.ts`) is the core business logic. It implements a **sequential offer model**: teachers are ranked, then offers are sent one at a time with expiry windows.

#### Ranking Algorithm

Teachers are filtered, then scored. The scoring weights are:

| Factor | Points | Notes |
|---|---|---|
| **Preferred teacher** | +200 | School-requested preference dominates |
| **Agency rating** | rating * 20 | Range 0-100 (rating is 0.0-5.0) |
| **School review average** | avg * 10 | Per-school rating for this teacher, range 0-50 |
| **Distance (inverse)** | min(30, 30 / distance) | Closer teachers score higher, capped at 30 |
| **Can drive** | +25 | Indicates reliability for travel |
| **Previously worked at school** | +15 | Familiarity bonus |

**Hard filters (exclusions):**
- Role mismatch (teacher vs. TA)
- Non-compliant (DBS, right-to-work)
- Already booked on the same date
- Blacklisted at the requesting school
- Already declined/expired for this request
- Emergency request but teacher not emergency-available
- Teacher set to "contact night before only" and request is for a future date beyond tomorrow
- Beyond teacher's maximum travel distance (haversine calculation)
- Teacher is deactivated (`is_active = false`)

**Availability check priority:** Specific date override > Recurring day-of-week pattern > Default available.

#### Sequential Offer Flow

```
School submits request
        |
        v
Agency triggers "Start Offering" (or "Manual Assign")
        |
        v
rankTeachersForRequest() — produces scored, sorted list
        |
        v
offerToNextTeacher(order=1) — creates assignment_offer row
        |                      sets cover_request.status = "offering"
        |                      emits SSE to teacher + agency
        |                      creates notification + email
        v
   Teacher responds?
   /           \
  v             v
ACCEPT        DECLINE (or EXPIRE via cron)
  |               |
  v               v
Create          Mark offer declined/expired
booking         Re-rank teachers (fresh query)
Set status      offerToNextTeacher(order=N+1)
= "filled"          |
Notify all     All exhausted? -> status = "pending"
                                  manual intervention needed
```

#### Configurable Response Windows

Stored in `app_config` table, read at offer time:
- `next_day_response_window_minutes`: default 60 minutes (standard requests)
- `morning_response_window_minutes`: default 7 minutes (emergency/same-day requests)

#### Expiry Handling

The `/api/cron` endpoint (called by external scheduler) runs `checkExpiredOffers()`:
1. Finds all `pending` offers where `expires_at <= now`.
2. Marks them as `expired`.
3. Auto-advances to the next teacher in the ranked list.
4. Emits SSE events to the agency dashboard.

Additional cron tasks: cleanup of expired password reset tokens and old read notifications.

### 6.2 Notification System

Dual-channel notifications:

1. **Persistent log** (`notification_log` table) — Every notification is stored with recipient, type, title, body, and read status. The client polls or receives SSE pushes to display unread counts and notification lists.

2. **Email** (Resend) — When `RESEND_API_KEY` is configured, each notification also triggers a transactional email. Email dispatch is fire-and-forget (errors are logged but do not block the caller). In development without the API key, emails are logged to console.

3. **SSE** — Real-time push to connected clients. The `SSEManager` singleton maintains an in-memory map of `channel -> Set<listener>`. Events are emitted by the assignment engine and request handlers.

### 6.3 Review/Rating System

Post-booking reviews flow:
1. Schools submit reviews via `POST /api/school/reviews` with `bookingId`, `rating` (1-5), optional `comment`, and `wouldRebook` flag.
2. The review is stored in `school_teacher_reviews` linked to the school, teacher, and booking.
3. Upon submission, the teacher's `agency_rating` is recalculated as the average of all their review ratings across all schools.
4. The `agency_rating` feeds back into the assignment engine's scoring algorithm (weight: rating * 20).

---

## 7. Security Architecture

### 7.1 Cookie-Based Sessions

- **Signing:** HMAC-SHA256 with `SESSION_SECRET` environment variable. In development, a hardcoded fallback is used.
- **Cookie flags:** `httpOnly: true`, `secure: true` (production), `sameSite: "lax"`, `path: "/"`, `maxAge: 86400` (24 hours).
- **Payload:** Base64-encoded JSON `{ userId, role, name }`. Signed but not encrypted.
- **Verification:** Timing-safe comparison of HMAC signatures to prevent timing attacks.

### 7.2 Password Hashing

- **Algorithm:** bcrypt via `bcryptjs` (pure JavaScript implementation).
- **Usage:** All user types (schools, teachers, agents) have `password_hash` columns. Passwords are hashed at creation time (seed scripts, agency credential endpoints).

### 7.3 Rate Limiting

Two-tier rate limiting system:

| Rule | Limit | Window | Purpose |
|---|---|---|---|
| `login` | 5 requests | 15 minutes | Brute-force prevention |
| `api` | 20 requests | 1 minute | General abuse prevention |
| `passwordResetRequest` | 3 requests | 15 minutes | Email enumeration prevention |
| `passwordResetConfirm` | 10 requests | 15 minutes | Token brute-force prevention |

**Primary store:** Upstash Redis (serverless, fixed-window algorithm).
**Fallback:** In-memory `Map<string, Entry>` with periodic pruning. Automatically activates when Upstash credentials are not configured or Upstash is unreachable.

**Client identification:** `x-forwarded-for` header (first IP), then `x-real-ip`, then `"anonymous"` fallback.

### 7.4 CSRF Protection

- `sameSite: "lax"` cookies prevent cross-origin form submissions.
- All mutating operations use `POST`/`PATCH`/`DELETE` methods (not `GET`), which `sameSite: "lax"` blocks from cross-origin contexts.
- API routes consume JSON bodies (not form-encoded), adding an implicit barrier since cross-origin `<form>` submissions cannot send `application/json`.

### 7.5 Input Validation

Every mutating API endpoint validates its request body against a Zod schema defined in `src/lib/api-validation.ts`. The `validateBody()` helper returns structured field-level errors. This prevents injection, type confusion, and malformed data from reaching the database layer.

Validation includes:
- Email format validation
- Date format enforcement (`YYYY-MM-DD`)
- Time format enforcement (`HH:MM`)
- Enum value constraints
- String length limits
- Numeric range constraints
- Business rule refinements (e.g., date not in past, start time before end time)

### 7.6 Role-Based Access Control

Access control is enforced at the API route level:

| Resource | School | Teacher | Agent |
|---|---|---|---|
| Create cover requests | Own school only | No | No |
| List cover requests | Own school only | No | All |
| Assignment actions | No | No | All |
| Respond to offers | No | Own offers only | No |
| Manage teachers/schools | No | No | All |
| Update availability | No | Own profile only | No |
| Submit reviews | Own bookings only | No | No |
| App settings | No | No | All |
| SSE streams | Own school channel | Own teacher channel | Agency channel |

Deactivated teachers and schools are blocked from login and from creating requests.

### 7.7 Additional Security Measures

- **`poweredByHeader: false`** in Next.js config removes the `X-Powered-By` header.
- **Password reset tokens** are stored as hashes (not plaintext) with expiry timestamps.
- **Foreign key enforcement** is enabled at the SQLite level (`PRAGMA foreign_keys = ON`).
- **Sentry** captures unhandled errors with source maps for post-mortem analysis.

---

## 8. Deployment Architecture

### 8.1 Primary Target: Traditional Node.js Server

Given SQLite's requirement for a persistent filesystem, the primary deployment target is a **traditional Node.js server** (VPS, Docker container, or similar):

```
next build          # Produces standalone output in .next/standalone/
node .next/standalone/server.js   # Runs the production server
```

The `output: "standalone"` config in `next.config.ts` creates a self-contained deployment artifact with all dependencies bundled.

**Persistent volume** must be mounted for:
- `quicksupply.db` — the SQLite database file
- `quicksupply.db-wal` — WAL journal file
- `quicksupply.db-shm` — shared memory file

### 8.2 Alternative: Vercel (with caveats)

Vercel deployment is possible but requires replacing SQLite:
- **Option A:** Turso (libSQL, SQLite-compatible protocol over HTTP) — minimal code changes via Drizzle's Turso driver.
- **Option B:** PostgreSQL (Neon, Supabase, Vercel Postgres) — Drizzle's dialect abstraction makes the migration straightforward.

SSE endpoints work on Vercel's serverless functions with streaming responses, but connection duration is limited by function timeout (default 10s, configurable up to 300s on Pro plans).

### 8.3 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | Production | HMAC key for cookie signing |
| `DATABASE_URL` | No | SQLite file path (default: `./quicksupply.db`) |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis auth token |
| `RESEND_API_KEY` | No | Resend API key for transactional email |
| `FROM_EMAIL` | No | Email sender address (default: Resend onboarding) |
| `CRON_SECRET` | Production | Bearer token for `/api/cron` endpoint |
| `NOTIFICATION_RETENTION_DAYS` | No | Days to keep read notifications (default: 30) |
| `SENTRY_ORG` | No | Sentry organization slug |
| `SENTRY_PROJECT` | No | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | No | Sentry auth token for source map uploads |
| `NODE_ENV` | Auto | `development` or `production` |

### 8.4 Sentry Error Tracking

The `@sentry/nextjs` SDK (v10) wraps the Next.js config via `withSentryConfig()`. In CI environments, source maps are uploaded automatically. The `silent` flag suppresses build output when not in CI.

### 8.5 Cron / Scheduled Tasks

The `/api/cron` endpoint handles periodic maintenance:
- **Expire stale offers** and auto-advance to next teacher.
- **Clean up expired password reset tokens.**
- **Purge old read notifications** (configurable retention period).

In production, this endpoint must be called by an external scheduler (Vercel Cron, GitHub Actions cron, systemd timer, etc.) with the `CRON_SECRET` as a Bearer token or query parameter. In development, it is open.

---

## 9. Scalability Path

### Current: SQLite (MVP)

- **Capacity:** ~100 concurrent users, ~10,000 bookings.
- **Bottleneck:** Single-writer constraint. WAL mode allows concurrent reads but writes are serialized.
- **SSE:** In-memory pub/sub, single process only.
- **Rate limiting:** In-memory fallback works for single instance; Upstash Redis already available for distributed limiting.

### Next: PostgreSQL Migration

When the application outgrows SQLite:

1. **Change Drizzle dialect** from `sqlite` to `pg` in `drizzle.config.ts`.
2. **Update schema** from `sqliteTable` to `pgTable` — column types are largely compatible. `integer({ mode: "boolean" })` becomes native `boolean`; `integer({ mode: "timestamp" })` becomes `timestamp`.
3. **Update db driver** from `better-sqlite3` to `node-postgres` or `@neondatabase/serverless`.
4. **Generate fresh migrations** from the updated schema.
5. **Migrate data** from SQLite to PostgreSQL (one-time ETL script).

Drizzle's query builder API remains identical across dialects — application code changes are minimal.

### Future: Scaling Beyond Single Server

| Concern | Solution |
|---|---|
| **Database connections** | PgBouncer or Neon's built-in connection pooling |
| **Read scaling** | PostgreSQL read replicas for dashboard queries |
| **SSE multi-instance** | Redis Pub/Sub backing store for SSEManager |
| **Rate limiting** | Already using Upstash Redis (horizontally scalable) |
| **Edge caching** | Vercel Edge Network for static assets, ISR for semi-static pages |
| **Search** | Full-text search via PostgreSQL `tsvector` or dedicated search service |
| **Background jobs** | Move cron tasks to a proper job queue (BullMQ, Inngest) |
| **Email volume** | Upgrade from Resend free tier; add queue for bulk sends |

---

## 10. Architecture Decision Records (ADRs)

### ADR-001: Monolithic Next.js Application

**Status:** Accepted
**Context:** The application serves three user roles (schools, teachers, agency staff) with shared business logic (assignment engine, notifications). A microservices architecture would add deployment and coordination complexity disproportionate to the application's scale.
**Decision:** Build as a single Next.js application with role-based routing.
**Consequences:** Simpler deployment and development. All code changes ship together. Scaling is vertical (bigger server) until the PostgreSQL migration enables horizontal scaling.

### ADR-002: SQLite for MVP Database

**Status:** Accepted (with planned migration path)
**Context:** The MVP targets a single agency with ~50 schools and ~200 teachers. PostgreSQL would require provisioning and managing a database server. SQLite requires zero ops.
**Decision:** Use SQLite with better-sqlite3 (synchronous driver) and WAL mode.
**Consequences:** Zero database administration. Faster development iteration. Cannot deploy to serverless platforms without modification. Planned migration to PostgreSQL when user base exceeds ~100 concurrent users.

### ADR-003: SSE Instead of WebSocket

**Status:** Accepted
**Context:** Real-time updates flow in one direction: server to client. The agency dashboard needs to see new requests and offer status changes. Teachers need to receive offer notifications. Schools need booking confirmations.
**Decision:** Use Server-Sent Events with an in-memory pub/sub manager.
**Consequences:** Simpler implementation (no WebSocket library, no connection upgrade handling). Works with standard HTTP proxies and load balancers. Auto-reconnect built into the browser `EventSource` API. Cannot send messages from client to server over the same connection (not needed — clients use POST requests for actions).

### ADR-004: Cookie Sessions over JWT

**Status:** Accepted
**Context:** JWTs in `localStorage` are vulnerable to XSS. JWTs in cookies provide no advantage over signed cookies and add complexity (refresh tokens, token size). The application is a traditional web app, not an API consumed by mobile clients.
**Decision:** HMAC-SHA256 signed cookies with `httpOnly`, `secure`, `sameSite: lax`.
**Consequences:** Immune to XSS-based token theft. No refresh token flow needed. Cannot be used by non-browser clients without cookie support. Stateless — no server-side session store, but also no server-side revocation.

### ADR-005: Sequential Offer Model

**Status:** Accepted
**Context:** The agency's existing workflow sends offers to one teacher at a time, waiting for a response before moving to the next. Broadcasting to all teachers simultaneously could cause race conditions and double-bookings.
**Decision:** Rank teachers, then offer sequentially with configurable time windows. Auto-advance on decline or expiry.
**Consequences:** No double-booking risk. Slower fill time (each offer waits for response or expiry). Mitigated by short emergency windows (7 minutes) and configurable standard windows (default 60 minutes). Agency can manually intervene at any point.

### ADR-006: ULID Primary Keys

**Status:** Accepted
**Context:** Auto-incrementing integers leak information (record count, creation order). UUIDs are not time-sortable. The application needs IDs that are URL-safe, globally unique, and sortable by creation time.
**Decision:** Use ULIDs (Universally Unique Lexicographically Sortable Identifiers) for all primary keys.
**Consequences:** Natural chronological ordering without a separate `created_at` index for many queries. 26-character string representation. Slight storage overhead vs. integers, negligible at MVP scale.

### ADR-007: No Middleware.ts

**Status:** Accepted
**Context:** Next.js middleware runs in the Edge Runtime, which does not support Node.js native modules (`better-sqlite3`, `crypto.createHmac`). The auth system uses both.
**Decision:** Perform all authentication and authorization checks within API route handlers and Server Components using `getSession()` and `requireSession()`.
**Consequences:** Slightly more boilerplate per route (manual session checks). Full access to Node.js APIs. No cold-start overhead from edge function invocation.

### ADR-008: Upstash Redis with In-Memory Fallback

**Status:** Accepted
**Context:** Rate limiting needs to work in development (without Redis) and in production (with distributed state). Upstash provides a serverless Redis with a rate-limiting SDK.
**Decision:** Use Upstash Redis when configured; fall back to an in-memory `Map` store otherwise.
**Consequences:** Zero-config development experience. Production-ready rate limiting with distributed state. Graceful degradation — if Upstash becomes unreachable, the system falls back to in-memory limiting (logged once) rather than failing open or blocking requests.

### ADR-009: Resend for Transactional Email

**Status:** Accepted
**Context:** Email notifications supplement in-app and SSE notifications. The MVP needs a simple email service with a generous free tier.
**Decision:** Use Resend with fire-and-forget dispatch. No-op when API key is not configured.
**Consequences:** Zero-config for local development (emails logged to console). Production email delivery with minimal code. Fire-and-forget means email failures are logged but do not block the notification flow.

### ADR-010: OKLCh Color Space for Theme

**Status:** Accepted
**Context:** The Desian Education brand uses specific purple and blue colors. Traditional hex/RGB color manipulation produces perceptually uneven results (e.g., 50% lightness in HSL does not look 50% bright). The UI needs consistent contrast ratios for accessibility.
**Decision:** Define all theme colors in OKLCh (CSS `oklch()` function), a perceptually uniform color space.
**Consequences:** Predictable lightness and chroma adjustments. Consistent contrast ratios for WCAG compliance. Requires modern browsers (Safari 15.4+, Chrome 111+, Firefox 113+). Acceptable for a business application that does not target legacy browsers.

---

*This document reflects the architecture as implemented. It should be updated as the system evolves, particularly when migrating from SQLite to PostgreSQL or adopting multi-instance deployment.*

---

## V2 Addendum — Sprint 7-8 Additions

*Added: 2026-03-29*

The following sections document the V2 features, tables, and API routes added after the initial Sprint 1-6 delivery.

---

### A1. V2 Data Architecture

Ten new tables were added to support V2 features. All follow existing conventions (ULID primary keys, integer timestamps, text enums).

| Table | Purpose | Key Columns |
|---|---|---|
| **`timesheets`** | Teacher-submitted time records per booking | `booking_id` (unique), `teacher_id`, `arrival_time`, `departure_time`, `break_minutes`, `total_hours`, `status` (submitted/approved/disputed/paid), `dispute_reason` |
| **`pay_rates`** | Configurable pay and charge rates per role/school | `role_type` (teacher/ta), `school_id` (nullable for defaults), `pay_rate`, `charge_rate`, `effective_from` |
| **`invoices`** | School invoices for a billing period | `school_id`, `period_start`, `period_end`, `total_pay_amount`, `total_charge_amount`, `status` (draft/sent/paid) |
| **`invoice_line_items`** | Individual line items linking invoices to timesheets | `invoice_id`, `timesheet_id`, `hours`, `pay_rate`, `charge_rate`, `pay_amount`, `charge_amount` |
| **`compliance_documents`** | Uploaded compliance files (DBS, right-to-work, etc.) | `teacher_id`, `document_type`, `file_name`, `file_path`, `status` (pending_verification/verified/rejected/expired), `expiry_date`, `verified_by`, `archived_at` |
| **`teacher_subjects`** | Subject specializations per teacher (composite PK) | `teacher_id`, `subject` |
| **`push_subscriptions`** | Web Push API subscriptions for PWA notifications | `user_id`, `user_role`, `endpoint`, `p256dh_key`, `auth_key` |
| **`notification_preferences`** | Per-user notification channel preferences | `user_id`, `user_role`, `category` (offers/booking_confirmations/cancellations/reminders/timesheets), `push_enabled`, `in_app_enabled` |
| **`request_templates`** | Saved cover request templates per school | `school_id`, `name`, `role_needed`, `subject`, `key_stage`, `start_time`, `end_time`, `notes` |
| **`activity_log`** | Fire-and-forget audit trail of system actions | `actor_id`, `actor_role`, `action` (14 enum values), `entity_type`, `entity_id`, `details` (JSON) |

**New indexes added in V2:**
- `pay_rates`: `(role_type, school_id)`, `(effective_from)`
- `invoices`: `(school_id)`, `(status)`
- `timesheets`: unique on `(booking_id)`, `(teacher_id)`, `(status)`
- `invoice_line_items`: `(invoice_id)`
- `compliance_documents`: `(teacher_id)`, `(status)`, `(expiry_date)`
- `push_subscriptions`: unique on `(user_id, user_role, endpoint)`
- `notification_preferences`: unique on `(user_id, user_role, category)`
- `activity_log`: `(actor_id)`, `(action)`, `(created_at)`

---

### A2. V2 API Routes

The following API routes were added in V2, organized by feature area:

```
/api
  /agency
    /timesheets          GET    — List all timesheets (filterable by status)
    /timesheets/[id]     PATCH  — Approve or dispute a timesheet
    /pay-rates           GET    — List pay rates
                         POST   — Create/update pay rate
    /invoices            GET    — List invoices
                         POST   — Generate invoice for a school/period
    /invoices/[id]       GET    — Invoice detail with line items
                         PATCH  — Update invoice status (send/mark paid)
    /invoices/[id]/pdf   GET    — Render invoice as PDF
    /compliance
      /documents         GET    — List compliance documents (filterable)
      /documents/[id]    PATCH  — Verify, reject, or update a document
      /file              POST   — Upload compliance document file
    /teachers/[id]
      /subjects          GET    — List teacher subjects
                         PUT    — Set teacher subject specializations
    /settings
      /ranking-weights   GET    — Get assignment ranking weights
                         PUT    — Update ranking weights
    /search              GET    — Full-text search across teachers/schools (q= param)

  /teacher
    /timesheets          GET    — List own timesheets
                         POST   — Submit timesheet for a booking
    /documents           GET    — List own compliance documents
    /bookings-pending-timesheet  GET  — Bookings awaiting timesheet submission

  /school
    /templates           GET    — List school's request templates
                         POST   — Create a request template
    /templates/[id]      PATCH  — Update a template
                         DELETE — Delete a template

  /push
    /subscribe           POST   — Register a push subscription
    /unsubscribe         POST   — Remove a push subscription

  /notification-preferences  GET   — Get notification preferences
                             PUT   — Update notification preferences
```

Total: approximately 20 new endpoints across 15 route files.

---

### A3. V2 Feature Architecture

#### Analytics (Sprint 7)

Server Components query aggregated data directly from the database and pass results to Recharts-based client chart components. Six drill-down pages exist under `/agency/analytics/*` (fill-rate, response-time, utilization, satisfaction, cancellation-rate, margins). A date-range filter is applied server-side. School analytics are available at `/school/analytics`. CSV export endpoints render data as downloadable files.

#### Compliance Management (Sprint 7)

Teachers or agency staff upload compliance documents (DBS certificates, right-to-work proofs, qualifications, references). Files are stored on the local filesystem under a controlled uploads directory. The upload endpoint validates file types using **magic byte inspection** (not just file extension) to prevent disguised malicious files. Agency staff verify or reject documents via a review workflow. A cron task checks `expiry_date` and automatically transitions documents to `expired` status.

#### Timesheets (Sprint 7)

After a booking is completed, teachers submit timesheets recording arrival/departure times and break duration. Total hours are calculated server-side. Agency staff can approve or dispute timesheets. Disputed timesheets can be resubmitted by teachers. The `/api/teacher/bookings-pending-timesheet` endpoint lists bookings that still need timesheet submission.

#### Financial — Pay Rates, Invoices, Margins (Sprint 7)

Pay rates and charge rates are configurable per role type and optionally per school, with an effective date for rate changes. Invoice generation aggregates approved timesheets for a school within a billing period, creating line items with calculated pay and charge amounts. Margin tracking derives from the spread between charge rates and pay rates. PDF invoice rendering is available via `/api/agency/invoices/[id]/pdf`.

#### PWA — Progressive Web App (Sprint 7)

A service worker provides offline detection and an offline banner UI. Web Push API integration allows browser push notifications via the `push_subscriptions` table. Users can configure notification preferences per category (offers, booking confirmations, cancellations, reminders, timesheets) through the `notification_preferences` table. The app includes a `manifest.json` for installability.

#### Enhanced Matching (Sprint 7)

The assignment engine ranking weights are now configurable via `/api/agency/settings/ranking-weights` instead of being hardcoded. New scoring factors include **subject specialization** matching (via `teacher_subjects`) and **school affinity scoring** (weighted history of successful bookings at a school). Agency staff can tune weights through the settings UI without code changes.

#### Activity Log (Sprint 7)

A fire-and-forget audit trail records significant system actions to the `activity_log` table. The logging function is non-blocking -- failures are caught and logged but never propagate to the caller. Fourteen action types are tracked (offers, bookings, teacher/school CRUD, compliance updates, timesheet actions, invoice generation, settings changes). The agency activity page at `/agency/activity` displays a filterable, paginated log.

#### Search — Command Palette (Sprint 8)

A Cmd+K / Ctrl+K command palette provides instant search across teachers and schools from the agency portal. The search trigger is available as a button in the agency navigation. The frontend uses debounced input to query `/api/agency/search?q=` which performs server-side text matching and returns JSON results.

#### Request Templates (Sprint 8)

Schools can save frequently-used cover request configurations as templates. Templates store role, subject, key stage, times, and notes. When creating a new request, schools can select a saved template to pre-fill the form. CRUD operations are available via `/api/school/templates`.

#### Review Submission UI (Sprint 8)

Schools can submit post-booking reviews with a comment textarea, star rating, and "would rebook" toggle. Reviews are displayed in read-only mode on the agency teacher detail page under a School Reviews card. The `wouldRebook` flag feeds into the teacher's agency rating recalculation.

---

### A4. V2 Security Enhancements

| Enhancement | Description |
|---|---|
| **Magic byte file validation** | Compliance document uploads are validated by inspecting the first bytes of the file (magic numbers) to verify the actual file type matches the declared content type. This prevents upload of disguised executable or script files. |
| **Conditional UPDATE race guards** | Timesheet approval and compliance verification endpoints use conditional UPDATE statements that check the current `status` value in the WHERE clause, preventing concurrent mutations from silently overwriting each other. |
| **`db.transaction` for multi-step writes** | Invoice generation and other multi-table mutations are wrapped in database transactions to ensure atomicity. If any step fails, all changes are rolled back. |
| **Resolved path traversal defense** | File upload paths are resolved and validated to ensure they remain within the designated uploads directory, preventing `../` path traversal attacks that could write to arbitrary filesystem locations. |
