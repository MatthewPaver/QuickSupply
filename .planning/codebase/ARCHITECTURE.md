# Architecture

## Pattern

QuickSupply uses **Next.js 16 App Router with TypeScript**, built on:
- **Server Components**: Default pattern for pages and layouts with `requireSession()` auth guards
- **Client Components**: Marked with `"use client"` for interactive UI and real-time streams
- **API Routes**: RESTful endpoints at `/app/api/**` handling business logic
- **Streaming & SSE**: Real-time updates via Server-Sent Events for dashboards and job notifications
- **SQLite + Drizzle ORM**: Type-safe database with migrations and schema management

## Layers

### UI Layer → API Layer → Database Layer

```
┌─────────────────────────────────────────┐
│         React Components (UI)            │
│  - Server Components (pages, layouts)    │
│  - Client Components (forms, modals)     │
│  - Shared UI components (buttons, etc.)  │
└──────────────┬──────────────────────────┘
               │ HTTP requests
┌──────────────v──────────────────────────┐
│      API Routes (/app/api/**)            │
│  - Authentication & Authorization        │
│  - Rate limiting                         │
│  - Business logic orchestration          │
│  - SSE streaming & notifications         │
└──────────────┬──────────────────────────┘
               │ Drizzle ORM
┌──────────────v──────────────────────────┐
│   SQLite Database (better-sqlite3)       │
│  - 14 tables with foreign keys           │
│  - WAL mode & foreign key constraints    │
│  - Drizzle migrations in drizzle/        │
└─────────────────────────────────────────┘
```

**Connection Points:**
- **Pages** (Server Components) fetch auth session via `getSession()` or `requireSession()`, then optionally call API routes
- **Client Components** use React hooks (`useSSE`, form submission) to call `/app/api/**` endpoints
- **API Routes** use `db` singleton from `/lib/db` to query/mutate data via Drizzle ORM
- **Auth Middleware**: `requireSession(expectedRole)` in layouts prevents unauthorized access

## Data Flow

### Request Lifecycle: UI → API → DB → Response

**Example: School submits a cover request**

1. **UI**: User fills form in `CoverRequestForm` component (`/components/school/cover-request-form.tsx`)
2. **HTTP POST**: Form posts to `/api/requests` with `{ schoolId, date, roleNeeded, ... }`
3. **API Route** (`/app/api/requests/route.ts`):
   - Validates session (must be "school" role)
   - Rate limits caller by IP
   - Parses JSON body
   - Validates schema with Zod
   - Calls `db.insert(coverRequests).values({...}).run()`
   - Emits SSE event via `sseManager.emit("agency", { type: "new_request", ... })`
   - Notifies all agents via `notifyAllAgents()`
   - Returns `{ id, status, ... }`
4. **DB**: SQLite stores record in `cover_requests` table with auto-generated ULID
5. **Response**: Client receives response, updates UI, navigates to request detail page
6. **SSE Stream**: `/api/sse/agency` subscribers receive real-time notification
7. **Notifications**: Agent receives in-app notification via `NotificationBell` component + email (if Resend configured)

**Example: Agency triggers assignment engine**

1. **UI**: Agent clicks "Start Offering" in `AgencyDashboard`
2. **HTTP POST**: `/api/assignments` with `{ action: "start_offering", requestId: "..." }`
3. **API Route** validates session (agent only), calls `startOfferingSequence(requestId)`
4. **Assignment Engine** (`/lib/assignment-engine.ts`):
   - Fetches cover request and school data
   - Calls `rankTeachersForRequest(requestId)` to score all available teachers
   - Loops through ranked teachers, creating `assignmentOffers` with expiry timestamps
   - Updates `coverRequests.status` to "offering"
   - Emits SSE events for each offer sent
5. **DB**: Inserts rows into `assignmentOffers` table
6. **Teacher's SSE Stream**: `/api/sse/teacher/[id]` subscribers see "new_offer" event
7. **Teacher App**: Displays offer notification, teacher can accept/decline

## Key Abstractions

### Assignment Engine (`/lib/assignment-engine.ts`)

**Purpose**: Ranks teachers and manages offer lifecycle

**Key Functions**:
- `rankTeachersForRequest(requestId: string)`: Returns sorted `RankedTeacher[]` with scoring factors:
  - Distance from school (haversine calculation)
  - Availability (recurring or specific date)
  - Blacklisted schools (exclusions)
  - Previous work history at school
  - School review averages
  - Compliance status

- `startOfferingSequence(requestId)`: Creates sequential offers to ranked teachers
- `manualAssign(requestId, teacherId)`: Direct assignment by agent
- `withdrawCurrentOffer(requestId)`: Withdraws pending offer
- `cancelBooking(bookingId, reason)`: Soft-deletes booking with reason tracking
- `checkExpiredOffers()`: Cron-triggered expiry check

### SSE Manager (`/lib/sse-manager.ts`)

**Purpose**: In-memory pub/sub for real-time updates

**Pattern**: Singleton pattern, persists across hot reloads in dev

**Channels**:
- `"agency"`: All agency dashboard updates (new requests, offer events)
- `"school:{schoolId}"`: School-specific updates (request status changes)
- `"teacher:{teacherId}"`: Teacher-specific updates (new offers, acceptance confirmations)

**Events** (from `/types/index.ts`):
```
type: "new_request" | "offer_sent" | "new_offer" | "offer_accepted" |
      "offer_declined" | "offer_expired" | "request_filled" |
      "booking_cancelled" | "offer_withdrawn" | "notification"
```

### Auth System (`/lib/auth.ts`)

**Session Cookie Format**: HMAC-signed JSON payload (24-hour max age)

```typescript
// Cookie: qs_session=<base64-json>.<sha256-signature>
interface Session {
  userId: string;      // ULID of school/teacher/agent
  role: "school" | "teacher" | "agent"
  name: string        // For display
}
```

**Key Functions**:
- `getSession()`: Extracts and verifies signed cookie, returns Session or null
- `createSession()`: Creates signed cookie with HMAC-SHA256
- `requireSession(expectedRole?)`: Server-only, throws redirect if not authenticated
- `destroySession()`: Deletes cookie

**Security**:
- HMAC timing-safe comparison prevents forgery
- HttpOnly flag prevents JavaScript access
- Secure flag in production (HTTPS only)
- SameSite=Lax for CSRF protection

### Rate Limiting (`/lib/rate-limit.ts`)

**Dual Backend**: Upstash Redis (production) with in-memory fallback

**Rules**:
- `login`: 5 attempts per 15 minutes (per IP)
- `api`: 20 requests per minute (per IP)
- `passwordResetRequest`: 3 per 15 min
- `passwordResetConfirm`: 10 per 15 min

**Key Functions**:
- `rateLimitLogin(identifier)`: Returns boolean (true = limited)
- `rateLimitApi(identifier)`: For high-value mutations
- `getClientIdentifier(request)`: Extracts IP from headers or defaults to "anonymous"

### Notification System (`/lib/notifications.ts`)

**Dual Delivery**: In-app (DB) + Email (Resend API, fire-and-forget)

**Types**: "offer" | "accepted" | "declined" | "expired" | "cancellation" | "reminder" | "filled"

**Key Functions**:
- `createNotification(options)`: Inserts log entry + sends email if configured
- `notifyAllAgents()`: Broadcasts to all agents
- Stores in `notification_log` table with read status

### Maintenance (`/lib/maintenance.ts`)

**Cron-triggered cleanup**:
- `cleanupExpiredPasswordResetTokens()`: Deletes expired password reset tokens
- `cleanupOldReadNotifications()`: Deletes read notifications older than retention days (default 30)

Called from `/api/cron` endpoint (requires `CRON_SECRET` in production)

## Entry Points

### Main Application Pages

**Public Routes**:
- `/`: Home page (`/src/app/page.tsx`) - Portal selection
- `/login`: Portal-filtered login (`/src/app/login/page.tsx`)
- `/forgot-password`: Password reset request
- `/reset-password`: Password reset confirmation
- `/privacy`: Privacy policy

**Agency Routes** (require session + agent role):
- `/agency/dashboard`: Live request & assignment dashboard
- `/agency/requests`: Request list & detail view (`[id]`)
- `/agency/agents`: Agent management
- `/agency/teachers`: Teacher directory & blacklist management (`[id]`)
- `/agency/schools`: School registry & contact management
- `/agency/bookings`: Booking history & cancellation
- `/agency/settings`: Agency configuration

**School Routes** (require session + school role):
- `/school/dashboard`: Request submission & status
- `/school/requests`: Live request list & history
- `/school/requests/new`: New request form
- `/school/history`: Past requests with review capability

**Teacher Routes** (require session + teacher role):
- `/teacher/dashboard`: Upcoming assignments
- `/teacher/jobs`: Pending job offers with accept/decline
- `/teacher/availability`: Availability calendar (recurring + date-specific)
- `/teacher/profile`: Profile & preferences (distance, compliance, role type)

### API Routes

**Authentication** (`/app/api/auth/**`):
- `POST /api/auth/login`: Login endpoint (all roles)
- `POST /api/auth/forgot-password`: Request password reset token
- `POST /api/auth/reset-password`: Confirm password reset
- `POST /api/auth`: Logout (session destroy)

**Real-Time Streaming** (`/app/api/sse/**`):
- `GET /api/sse/agency`: Agency dashboard SSE stream
- `GET /api/sse/school/[id]`: School-specific updates
- `GET /api/sse/teacher/[id]`: Teacher job offers & status

**Assignments** (`/app/api/assignments`):
- `POST /api/assignments`: Assignment engine actions (start_offering, manual_assign, rank_teachers, etc.)

**Requests** (`/app/api/requests`):
- `POST /api/requests`: School creates cover request
- `GET /api/requests`: List requests (filtered by role)

**Offers** (`/app/api/offers`):
- `POST /api/offers`: Teacher accepts/declines offer

**Teacher Profile** (`/app/api/teacher/**`):
- `GET /api/teacher/profile`: Get teacher profile
- `PUT /api/teacher/profile`: Update profile
- `GET /api/teacher/availability/check`: Check availability on date
- `POST /api/teacher/availability`: Upsert availability
- `GET /api/teacher/offers`: Get pending offers

**Notifications** (`/app/api/notifications`):
- `GET /api/notifications`: List notifications for current user
- `PUT /api/notifications`: Mark as read

**Reviews** (`/app/api/school/reviews`):
- `POST /api/school/reviews`: School leaves review for teacher after booking

**Settings** (`/app/api/settings`):
- `GET /api/settings`: Get app config (offer expiry, max distance, etc.)
- `PUT /api/settings`: Update config (agents only)

**System** (`/app/api/**`):
- `GET /api/health`: Health check (public)
- `GET /api/cron`: Maintenance tasks (requires CRON_SECRET)
- `GET /api/me`: Get current session info

### Cron Endpoints

- **POST `/api/cron`** (protected by `CRON_SECRET`):
  - Checks expired offers and updates statuses
  - Cleans up expired password reset tokens
  - Deletes read notifications older than retention period
  - Called regularly by external scheduler (Vercel Cron, GitHub Actions)

## Database Schema Overview

**Core Entities**:
- `schools`: School directory (name, address, contact, geolocation)
- `teachers`: Teacher registry (name, location, preferences, compliance)
- `agents`: Agency staff (name, email, admin flag)

**Relationships**:
- `agentTeacherAssignments`: M-M mapping of agents to their teachers
- `teacherBlacklistedSchools`: Teacher exclusions per school

**Workflow**:
- `coverRequests`: Cover request from school (status: pending → offering → filled → cancelled)
- `assignmentOffers`: Individual offers to teachers (status: pending → accepted/declined/expired/withdrawn)
- `bookings`: Confirmed assignments (soft-delete via `cancelledAt`)

**Support**:
- `teacherAvailability`: Recurring or date-specific availability
- `schoolTeacherReviews`: Post-booking ratings
- `notificationLog`: In-app notification history with read status
- `passwordResetTokens`: Temporary tokens for password recovery (with expiry)
- `appConfig`: Key-value configuration store

## Technology Stack

**Framework**: Next.js 16 with Turbopack (dev), standalone build (prod)

**Styling**: TailwindCSS 4 with PostCSS, Radix UI for accessibility

**Database**: SQLite (better-sqlite3), Drizzle ORM with migrations

**Auth**: HMAC-signed session cookies, bcryptjs password hashing

**Real-Time**: Server-Sent Events (native EventSource API)

**Rate Limiting**: Upstash Redis (with in-memory fallback)

**Email**: Resend API for transactional emails

**Error Tracking**: Sentry (NextJS integration)

**Testing**: Playwright E2E tests, ESLint for linting

**Scripting**: tsx for Node.js scripts (seed, migrate, reset)
