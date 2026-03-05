# External Integrations

## Database

### SQLite with Drizzle ORM
- **Library**: `better-sqlite3` v12.6.2 (embedded SQLite driver)
- **ORM**: `drizzle-orm` v0.45.1 with TypeScript support
- **Configuration**: `drizzle.config.ts`
  - Dialect: SQLite
  - Database file: `./quicksupply.db` or configurable via `DATABASE_URL` environment variable

### Database Setup & Connection
- **File**: `src/lib/db/index.ts`
- **Initialization**:
  - Creates SQLite connection with WAL (Write-Ahead Logging) journaling
  - Enables foreign key constraints: `PRAGMA foreign_keys = ON`
  - Initializes Drizzle ORM with full schema

### Schema & Models
- **Location**: `src/lib/db/schema.ts`
- **Core Entities**:
  - `schools`: School/agency accounts with geolocation and contact info
  - `teachers`: Supply teacher profiles with availability and compliance tracking
  - `agents`: Administrator accounts with optional admin privileges
  - `agentTeacherAssignments`: Agent-to-teacher assignment mapping
  - `teacherAvailability`: Daily/recurring availability patterns
  - `teacherSpecializations`: Subject/role specialization tags
  - `supplyRequests`: Open supply positions from schools
  - `supplyOffers`: Teacher responses to requests
  - `requestNotifications`: Read/unread notification tracking
  - `passwordResetTokens`: Time-limited reset token storage
  - Additional tables for compliance tracking, communications, and audit logs

### Migrations
- **Location**: `drizzle/` directory
- **Migration files**:
  - `0000_chief_madripoor.sql`: Initial schema with core tables
  - `0001_password_reset_tokens.sql`: Password reset token table and functionality
  - `0002_security_hardening.sql`: Additional security constraints and indexes
- **Tools**:
  - `drizzle-kit generate`: Auto-generates SQL from TypeScript schema
  - `drizzle-kit migrate`: Applies migrations to database
  - `drizzle-kit studio`: Web UI for database inspection

## Authentication

### Session Management
- **Location**: `src/lib/auth.ts`
- **Method**: Encrypted cookie-based session tokens
- **Implementation**:
  - Uses `crypto.createHmac` with SHA256 for signing
  - Session format: Base64-encoded JSON payload + HMAC signature
  - Separator: Payload and signature separated by dot (`.`)
  - Timing-safe comparison via `timingSafeEqual` to prevent timing attacks

### Session Storage
- **Cookie name**: `qs_session`
- **Settings**:
  - `httpOnly`: true (prevents JavaScript access)
  - `secure`: true in production (HTTPS only)
  - `sameSite`: lax (CSRF protection)
  - `maxAge`: 24 hours
  - `path`: `/`

### Session Secret
- **Environment variable**: `SESSION_SECRET`
- **Requirement**: Must be set in production (long random string)
- **Development**: Falls back to unsafe default if not set
- **Generation**: Recommended via `openssl rand -hex 32`

### Password Hashing
- **Library**: `bcryptjs` v3.0.3
- **Used for**: School and teacher password storage
- **Rounds**: Default bcrypt salt rounds (10-12)

### User Roles
- **Types**: `school` | `teacher` | `agent`
- **Session payload**: Includes userId, role, and name
- **Validation**: Strict type checking on session deserialization

### Password Reset Flow
- **Location**: `src/app/forgot-password/` and `src/app/reset-password/`
- **Database table**: `passwordResetTokens`
- **Token generation**: ULID format with expiration timestamp
- **Features**:
  - Forgot password request endpoint: `POST /api/auth/forgot-password`
  - Password reset confirmation: `POST /api/auth/reset-password`
  - Email-based verification using Resend
  - Rate limiting on both request and confirmation steps

## Email

### Service Provider
- **Provider**: Resend (resend.com)
- **Package**: `resend` v6.9.3
- **Configuration**:
  - API key: `RESEND_API_KEY` environment variable
  - From address: `FROM_EMAIL` environment variable (defaults to onboarding@resend.dev)

### Email Features
- **Location**: `src/lib/email.ts`
- **Function**: `sendNotificationEmail(to, subject, body)`
- **Implementation**:
  - Sends plain-text emails via Resend API
  - No-op behavior: Returns true if API key not configured (development mode)
  - Error handling: Catches and logs failures, returns false on error
  - Graceful degradation in development (no-op with console logging)

### Email Use Cases
- Notification emails for supply requests
- Password reset links and confirmations
- User account alerts and communications
- Compliance status updates
- Sent via endpoints in `src/app/api/auth/` and `src/app/api/notifications/`

### Production Considerations
- Email domain must be verified in Resend account for production
- Recommended from address: `notifications@yourdomain.com`
- Base URL for links: `NEXT_PUBLIC_APP_URL` environment variable

## Rate Limiting

### Service Provider
- **Primary**: Upstash Redis (distributed rate limiting)
- **Library**: `@upstash/ratelimit` v2.0.8 and `@upstash/redis` v1.36.3
- **Fallback**: In-memory rate limiting (per-instance)
- **Configuration**:
  - `UPSTASH_REDIS_REST_URL`: Upstash REST endpoint
  - `UPSTASH_REDIS_REST_TOKEN`: Upstash authentication token

### Implementation
- **Location**: `src/lib/rate-limit.ts`
- **Strategy**:
  - Upstash Redis priority if credentials provided
  - Automatic fallback to in-memory Map if Upstash unavailable
  - Memory pruning every 60 seconds to clean expired entries

### Rate Limit Rules
- **Login**: 5 attempts per 15 minutes (IP-based)
- **API**: 20 requests per 1 minute (IP-based)
- **Password Reset Request**: 3 requests per 15 minutes (IP-based)
- **Password Reset Confirmation**: 10 attempts per 15 minutes (IP-based)

### Client Identification
- **Function**: `getClientIdentifier(request)`
- **Priority**:
  1. `x-forwarded-for` header (first address if comma-separated)
  2. `x-real-ip` header (reverse proxy)
  3. Fallback to `"anonymous"` if no headers present
- **Prefix format**: `qs:rl:{rule}:{identifier}`

### HTTP Responses
- **Rate limited**: Returns 429 (Too Many Requests)
- **Applied endpoints**: `/api/auth/*`, `/api/requests`, `/api/offers`, etc.

## Error Monitoring

### Service Provider
- **Provider**: Sentry (sentry.io)
- **Package**: `@sentry/nextjs` v10.40.0
- **Configuration files**:
  - `src/sentry.server.config.ts` (server-side initialization)
  - `src/sentry.edge.config.ts` (edge runtime support)
  - `next.config.ts` (Next.js integration via `withSentryConfig`)

### Environment Variables
- **Initialization**:
  - `NEXT_PUBLIC_SENTRY_DSN`: Client and server DSN for error capture
  - Must be public-facing (NEXT_PUBLIC prefix)

- **Source map upload (CI/CD)**:
  - `SENTRY_ORG`: Sentry organization slug
  - `SENTRY_PROJECT`: Sentry project slug
  - `SENTRY_AUTH_TOKEN`: Authentication token for source map uploads

### Sentry Configuration
- **DSN**: Loaded from `NEXT_PUBLIC_SENTRY_DSN`
- **Traces sample rate**:
  - Development: 1.0 (100% of traces)
  - Production: 0.1 (10% of traces for performance monitoring)
- **Debug mode**: Disabled in all environments

### Features Enabled
- Error tracking and crash reporting
- Performance monitoring via tracing
- Source maps for production debugging
- Replay recordings (configurable)
- Browser extensions suppress hydration warnings (e.g., Grammarly)

### Integration Points
- Automatic Next.js integration via `withSentryConfig` wrapper
- Error boundaries capture React errors
- API routes capture server errors
- Client-side errors captured automatically

## Real-time Updates

### Server-Sent Events (SSE)
- **Location**: `src/lib/sse-manager.ts` and `src/app/api/sse/`
- **Implementation**: Custom SSE manager with pub/sub pattern

### SSE Manager
- **Class**: `SSEManager` (singleton)
- **Methods**:
  - `subscribe(channel, listener)`: Returns unsubscribe function
  - `emit(channel, event)`: Broadcast event to all subscribers
  - `getChannelCount()`: Get active channel count
- **Persistence**: Preserved across hot reloads in development via global state

### Event Format
- **Type**: `SSEEvent` from `src/types`
- **Properties**:
  - Event type/action
  - Data payload
  - Auto-populated timestamp
  - Channel-based routing

### Use Cases
- Real-time notification delivery to connected clients
- Supply request updates (new offers, acceptances)
- Teacher availability status changes
- Compliance status updates
- Assignment notifications

### Client Connection
- **Endpoint**: `/api/sse/{userId}` or similar
- **Protocol**: HTTP/1.1 with `text/event-stream` MIME type
- **Reconnection**: Browser handles automatic reconnection on disconnect

### API Routes Using SSE
- Notifications channel for user updates
- Assignment notifications
- Request status changes
- Real-time data delivery without polling

## API Route Organization

### Directory Structure
- **`/api/auth/`**: Authentication (login, logout, password reset)
- **`/api/school/`**: School-specific endpoints
- **`/api/teacher/`**: Teacher-specific endpoints
- **`/api/agency/`**: Agency management endpoints
- **`/api/requests/`**: Supply request CRUD
- **`/api/offers/`**: Supply offer CRUD
- **`/api/assignments/`**: Assignment management
- **`/api/settings/`**: User settings and preferences
- **`/api/me/`**: Current user information
- **`/api/notifications/`**: Notification management and SSE
- **`/api/sse/`**: Server-sent events endpoints
- **`/api/cron/`**: Scheduled tasks (offer expiration, etc.)
- **`/api/health/`**: Health check endpoint

### Middleware & Request Handling
- **Error handling**: Sentry integration captures exceptions
- **Rate limiting**: Applied per endpoint based on rule type
- **Authentication**: Session verification via `requireSession()`
- **CORS**: Handled by Next.js defaults
- **Cron security**: Optional secret via `CRON_SECRET` environment variable
