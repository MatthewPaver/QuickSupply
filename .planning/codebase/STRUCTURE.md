# Directory Structure

## Layout

```
/Users/mattpaver/Desktop/QuickSupply/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout (HTML shell, Toaster, CookieBanner)
│   │   ├── page.tsx                      # Home page (portal selection)
│   │   ├── global-error.tsx              # Global error boundary
│   │   ├── error.tsx                     # Root error page
│   │   │
│   │   ├── login/                        # Login portal (portal-filtered)
│   │   │   └── page.tsx
│   │   ├── forgot-password/              # Forgot password request
│   │   │   └── page.tsx
│   │   ├── reset-password/               # Password reset confirmation
│   │   │   └── page.tsx
│   │   ├── privacy/                      # Privacy policy
│   │   │   └── page.tsx
│   │   │
│   │   ├── agency/                       # Agency dashboard (requires agent role)
│   │   │   ├── layout.tsx                # Sidebar layout, nav, session guard
│   │   │   ├── error.tsx                 # Agency error boundary
│   │   │   ├── loading.tsx               # Route-level loading state
│   │   │   ├── nav-config.tsx            # Navigation menu configuration
│   │   │   ├── dashboard/                # Main live dashboard
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── requests/                 # Cover request management
│   │   │   │   ├── page.tsx              # List view
│   │   │   │   ├── loading.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Detail view with assignment panel
│   │   │   ├── agents/                   # Agent management
│   │   │   │   └── page.tsx
│   │   │   ├── teachers/                 # Teacher directory
│   │   │   │   ├── page.tsx              # List view
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Detail view with compliance, reviews
│   │   │   ├── schools/                  # School registry
│   │   │   │   └── page.tsx
│   │   │   ├── bookings/                 # Booking history
│   │   │   │   └── page.tsx
│   │   │   └── settings/                 # Configuration
│   │   │       └── page.tsx
│   │   │
│   │   ├── school/                       # School portal (requires school role)
│   │   │   ├── layout.tsx                # Top nav layout, session guard
│   │   │   ├── error.tsx                 # School error boundary
│   │   │   ├── loading.tsx               # Route-level loading state
│   │   │   ├── dashboard/                # Request submission & status
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── requests/                 # Request management
│   │   │   │   ├── page.tsx              # List & live status view
│   │   │   │   ├── loading.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx          # New request form
│   │   │   └── history/                  # Past requests & reviews
│   │   │       └── page.tsx
│   │   │
│   │   ├── teacher/                      # Teacher portal (requires teacher role)
│   │   │   ├── layout.tsx                # Bottom nav layout, session guard
│   │   │   ├── error.tsx                 # Teacher error boundary
│   │   │   ├── loading.tsx               # Route-level loading state
│   │   │   ├── dashboard/                # Upcoming assignments
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── jobs/                     # Pending job offers
│   │   │   │   ├── page.tsx              # Accept/decline offers
│   │   │   │   └── loading.tsx
│   │   │   ├── availability/             # Availability management
│   │   │   │   └── page.tsx
│   │   │   └── profile/                  # Profile & preferences
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                          # Next.js API routes
│   │       ├── auth/                     # Authentication
│   │       │   ├── route.ts              # Logout (DELETE /api/auth)
│   │       │   ├── login/
│   │       │   │   └── route.ts          # POST login
│   │       │   ├── forgot-password/
│   │       │   │   └── route.ts          # POST forgot password request
│   │       │   └── reset-password/
│   │       │       └── route.ts          # POST reset password confirmation
│   │       ├── sse/                      # Server-Sent Events streaming
│   │       │   ├── agency/
│   │       │   │   └── route.ts          # Agency dashboard stream
│   │       │   ├── school/[id]/
│   │       │   │   └── route.ts          # School-specific stream
│   │       │   └── teacher/[id]/
│   │       │       └── route.ts          # Teacher job offers stream
│   │       ├── assignments/
│   │       │   └── route.ts              # POST assignment engine actions
│   │       ├── requests/
│   │       │   └── route.ts              # GET/POST cover requests
│   │       ├── offers/
│   │       │   └── route.ts              # POST offer acceptance/decline
│   │       ├── teacher/                  # Teacher-specific endpoints
│   │       │   ├── profile/
│   │       │   │   └── route.ts          # GET/PUT teacher profile
│   │       │   ├── availability/
│   │       │   │   ├── route.ts          # GET/POST teacher availability
│   │       │   │   └── check/
│   │       │   │       └── route.ts      # GET check availability on date
│   │       │   └── offers/
│   │       │       └── route.ts          # GET teacher's pending offers
│   │       ├── school/
│   │       │   └── reviews/
│   │       │       └── route.ts          # POST school reviews for teacher
│   │       ├── agency/
│   │       │   └── sms-log/
│   │       │       └── route.ts          # GET SMS log (audit trail)
│   │       ├── notifications/
│   │       │   └── route.ts              # GET/PUT notifications
│   │       ├── settings/
│   │       │   └── route.ts              # GET/PUT app configuration
│   │       ├── me/
│   │       │   └── route.ts              # GET current session info
│   │       ├── health/
│   │       │   └── route.ts              # GET health check
│   │       └── cron/
│   │           └── route.ts              # GET maintenance tasks
│   │
│   ├── components/                       # React components
│   │   ├── ui/                           # Unstyled UI primitives (Radix + Tailwind)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── calendar.tsx              # Date picker (react-day-picker)
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx                 # Mobile drawer
│   │   │   ├── tooltip.tsx
│   │   │   └── sonner.tsx                # Toast notifications
│   │   │
│   │   ├── layout/                       # Layout components
│   │   │   └── (future layout variants)
│   │   │
│   │   ├── shared/                       # Cross-role shared components
│   │   │   ├── active-link-button.tsx    # Nav button with active state
│   │   │   ├── cookie-banner.tsx         # GDPR cookie notice
│   │   │   ├── dashboard-skeleton.tsx    # Skeleton loader for dashboards
│   │   │   ├── page-skeleton.tsx         # Skeleton loader for pages
│   │   │   ├── list-page-skeleton.tsx    # Skeleton for list pages
│   │   │   ├── notification-bell.tsx     # In-app notification icon
│   │   │   ├── sign-out-button.tsx       # Logout button
│   │   │   ├── empty-state.tsx           # Empty state UI
│   │   │   └── status-badge.tsx          # Status indicator badge
│   │   │
│   │   ├── agency/                       # Agency-specific components
│   │   │   ├── agency-desktop-nav.tsx    # Desktop sidebar navigation
│   │   │   ├── agency-mobile-nav.tsx     # Mobile top nav menu
│   │   │   ├── agency-live-refresh.tsx   # SSE subscription component
│   │   │   ├── assignment-panel.tsx      # Assignment actions (start offering, etc.)
│   │   │   ├── teacher-row.tsx           # Teacher display in requests
│   │   │   ├── call-modal.tsx            # Teacher call interface
│   │   │   └── sms-log-drawer.tsx        # SMS communication log
│   │   │
│   │   ├── school/                       # School-specific components
│   │   │   ├── school-top-nav.tsx        # Top navigation menu
│   │   │   ├── school-live-refresh.tsx   # SSE subscription component
│   │   │   ├── cover-request-form.tsx    # New request form
│   │   │   └── review-form.tsx           # Post-booking teacher review
│   │   │
│   │   └── teacher/                      # Teacher-specific components
│   │       ├── teacher-desktop-nav.tsx   # Desktop navigation
│   │       └── mobile-bottom-nav.tsx     # Mobile bottom tab bar
│   │
│   ├── lib/                              # Utility functions & helpers
│   │   ├── db/
│   │   │   ├── index.ts                  # Drizzle DB instance (singleton)
│   │   │   └── schema.ts                 # Drizzle table definitions (14 tables)
│   │   ├── auth.ts                       # Session management (HMAC cookies)
│   │   ├── assignment-engine.ts          # Core logic: ranking & offer sequencing
│   │   ├── sse-manager.ts                # In-memory pub/sub for SSE
│   │   ├── notifications.ts              # Notification creation & email dispatch
│   │   ├── rate-limit.ts                 # Upstash + in-memory rate limiting
│   │   ├── maintenance.ts                # Cron cleanup tasks
│   │   ├── email.ts                      # Resend email sending
│   │   ├── distance.ts                   # Haversine distance calculation
│   │   └── utils.ts                      # General utilities
│   │
│   ├── hooks/                            # Custom React hooks
│   │   └── use-sse.ts                    # SSE stream subscription with reconnect
│   │
│   ├── types/
│   │   └── index.ts                      # TypeScript type definitions
│   │
│   ├── instrumentation.ts                # Sentry server-side setup
│   ├── instrumentation-client.ts         # Sentry client-side setup
│   ├── sentry.server.config.ts           # Sentry server config
│   ├── sentry.edge.config.ts             # Sentry edge runtime config
│   └── proxy.ts                          # Proxy utilities (unused currently)
│
├── e2e/                                  # Playwright end-to-end tests
│   └── (test files)
│
├── drizzle/                              # Database migrations (generated)
│   ├── 0001_*.sql
│   ├── 0002_*.sql
│   └── ...
│
├── scripts/                              # Node.js utilities
│   ├── seed.ts                           # Populate demo data
│   ├── seed-demo-previous-teacher.ts     # Teacher demo data
│   ├── reset-db.ts                       # Drop all tables
│   ├── clear-requests.ts                 # Truncate requests for testing
│   └── e2e-check-routes.mjs              # Validate all routes exist
│
├── .github/                              # GitHub Actions CI/CD
├── .next/                                # Next.js build output
├── .planning/                            # Architecture documentation
│   └── codebase/
│       ├── STACK.md                      # Technology stack summary
│       ├── ARCHITECTURE.md               # (THIS FILE) Architecture & abstractions
│       └── STRUCTURE.md                  # (THIS FILE) Directory layout
│
├── public/                               # Static assets
│   ├── desian-logo.svg
│   └── favicon.ico
│
├── docs/                                 # External documentation
├── node_modules/                         # Dependencies (pnpm)
├── .git/                                 # Git repository
├── .env.local                            # Local environment variables
├── .env.example                          # Environment variable template
├── .gitignore                            # Git ignore rules
├── .nvmrc                                # Node version (18+)
├── .dockerignore                         # Docker ignore rules
│
├── package.json                          # NPM dependencies & scripts
├── pnpm-lock.yaml                        # Locked dependency versions
├── pnpm-workspace.yaml                   # Workspace config
│
├── tsconfig.json                         # TypeScript configuration
├── next.config.ts                        # Next.js configuration
├── drizzle.config.ts                     # Drizzle ORM configuration
├── playwright.config.ts                  # E2E test configuration
├── eslint.config.mjs                     # ESLint configuration
├── components.json                       # shadcn/ui CLI config
├── Dockerfile                            # Production Docker image
├── README.md                              # Project documentation
│
└── quicksupply.db (generated)            # SQLite database file
```

## Key Locations

### Where to Find What

**Authentication & Authorization**:
- `getSession()`, `createSession()`, `requireSession()` → `/src/lib/auth.ts`
- Session cookie validation → `/src/lib/auth.ts` (lines 60-78)
- Role-based access → `/src/app/*/layout.tsx` (call `requireSession("role")`)

**Database**:
- Schema definitions → `/src/lib/db/schema.ts`
- DB instance → `/src/lib/db/index.ts`
- Migrations → `/drizzle/`

**Business Logic**:
- Assignment ranking & offers → `/src/lib/assignment-engine.ts`
- Notifications (in-app + email) → `/src/lib/notifications.ts`
- Real-time events → `/src/lib/sse-manager.ts`
- Rate limiting → `/src/lib/rate-limit.ts`

**API Endpoints**:
- Login → `/src/app/api/auth/login/route.ts`
- Assignments → `/src/app/api/assignments/route.ts`
- Offers (teacher accept/decline) → `/src/app/api/offers/route.ts`
- SSE streams → `/src/app/api/sse/*/route.ts`

**UI Components**:
- Agency dashboard → `/src/app/agency/dashboard/page.tsx`
- Cover request form → `/src/components/school/cover-request-form.tsx`
- Assignment panel (start offering) → `/src/components/agency/assignment-panel.tsx`
- Offer notifications → `/src/components/shared/notification-bell.tsx`

**Layouts & Navigation**:
- Agency sidebar → `/src/app/agency/layout.tsx`
- School top nav → `/src/app/school/layout.tsx`
- Teacher mobile nav → `/src/app/teacher/layout.tsx`

**Hooks**:
- SSE subscription → `/src/hooks/use-sse.ts`

**Types**:
- All type definitions → `/src/types/index.ts`

**Configuration**:
- Next.js config → `/next.config.ts` (Sentry, standalone output)
- TypeScript paths → `/tsconfig.json` (`@/*` → `./src/*`)
- Database config → `/drizzle.config.ts`

**Scripts**:
- Seed demo data → `/scripts/seed.ts`
- Database migration → `/scripts/db-migrate.ts`
- Validate routes → `/scripts/e2e-check-routes.mjs`

**Testing**:
- E2E tests → `/e2e/` directory
- Playwright config → `/playwright.config.ts`

**Environment**:
- Example variables → `/.env.example`
- Local overrides → `/.env.local`

## Naming Conventions

### File Naming

**Pages & Routes**:
- `page.tsx` → Route endpoint (App Router convention)
- `layout.tsx` → Route segment layout
- `loading.tsx` → Route-level loading skeleton
- `error.tsx` → Error boundary for route
- `route.ts` → API endpoint

**Components**:
- PascalCase: `CoverRequestForm`, `AgencyDesktopNav`, `AssignmentPanel`
- Location suffix: `agency-live-refresh.tsx`, `teacher-desktop-nav.tsx`
- UI components grouped in `ui/` directory

**Utilities**:
- Camel case: `assignment-engine.ts`, `sse-manager.ts`, `rate-limit.ts`
- Descriptive names: `distance.ts`, `notifications.ts`, `maintenance.ts`

**Types**:
- Single `index.ts` in `/types/` directory
- Exported interfaces: `Session`, `RankedTeacher`, `SSEEvent`, `CoverRequest`, etc.

**Database**:
- Table names: plural snake_case (`cover_requests`, `teacher_availability`)
- Column names: camelCase in TS, snake_case in SQL
- Enum values: lowercase (`"pending"`, `"offering"`, `"filled"`)

### Component Naming

**Conventions**:
- Page components named after their route: `/school/requests/page.tsx` exports unnamed default
- Feature components namespaced by role: `agency-desktop-nav.tsx`, `teacher-mobile-nav.tsx`, `school-top-nav.tsx`
- Shared components in `shared/`: `notification-bell.tsx`, `empty-state.tsx`
- UI components in `ui/`: `button.tsx`, `card.tsx`, `dialog.tsx`

**Component Exports**:
```typescript
// Pages (default export)
export default function SchoolDashboard() { ... }

// Reusable components (named export)
export function CoverRequestForm() { ... }
export function AgencyDesktopNav() { ... }

// UI primitives (named export)
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
```

### API Route Organization

**Pattern**: `POST /api/[domain]/[action]`
- `/api/auth/login` → User login
- `/api/auth/forgot-password` → Password reset request
- `/api/teacher/profile` → Teacher CRUD
- `/api/assignments` → Assignment engine actions (query param or body)
- `/api/sse/[role]/[id]` → Real-time stream for role/entity

**Body Params** (POST):
```typescript
// Standard actions param pattern
{ action: "start_offering", requestId, teacherId, ... }
{ action: "manual_assign", requestId, teacherId }
{ action: "rank_teachers", requestId }
```

### Constants & Configuration

**Enums**:
```typescript
type UserRole = "school" | "teacher" | "agent"
type RequestStatus = "pending" | "offering" | "filled" | "cancelled"
type OfferStatus = "pending" | "accepted" | "declined" | "expired" | "withdrawn"
```

**Configuration**:
- Database path: `process.env.DATABASE_URL || ./quicksupply.db`
- Session secret: `process.env.SESSION_SECRET` (required in production)
- Cron secret: `process.env.CRON_SECRET` (required in production)
- Upstash Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Resend API: `process.env.RESEND_API_KEY`
- Sentry: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

### URL Patterns

**Dynamic routes** use brackets:
- `/agency/requests/[id]` → Detail view for request
- `/agency/teachers/[id]` → Teacher profile
- `/api/sse/school/[id]` → SSE stream for school
- `/api/sse/teacher/[id]` → SSE stream for teacher

### Import Paths

**Alias configuration** in `tsconfig.json`:
```json
"paths": { "@/*": ["./src/*"] }
```

**Usage**:
```typescript
import { db } from "@/lib/db"
import { CoverRequestForm } from "@/components/school/cover-request-form"
import type { Session } from "@/types"
```

**Avoid relative imports** in favor of `@/` alias for consistency.
