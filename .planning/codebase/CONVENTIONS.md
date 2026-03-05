# Code Conventions

## Style

### TypeScript Configuration
- **Target**: ES2017 with strict mode enabled (`"strict": true`)
- **Module resolution**: Bundler with path aliases via `@/*` pointing to `./src/*`
- **JSX**: React 19 with `"jsx": "react-jsx"` configuration
- **File extensions**: `.ts` for utilities/server, `.tsx` for components

### Import Ordering
Imports follow a consistent pattern:
1. External packages (Next.js, React, third-party libraries)
2. Absolute imports using `@/` alias
3. Type imports grouped with `type` keyword when needed
4. Components before utilities before types

Example pattern (from `/Users/mattpaver/Desktop/QuickSupply/src/app/agency/dashboard/page.tsx`):
```typescript
import { db } from "@/lib/db";
import { coverRequests, teachers, schools } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import type { UserRole } from "@/types";
```

### Formatting and Code Style
- **Indentation**: 2 spaces (consistent across codebase)
- **String quotes**: Double quotes preferred
- **Semicolons**: Required
- **Comments**: JSDoc-style comments for public functions and exports
- **Console errors**: Logged with context tags (e.g., `console.error("[rate-limit] message")`)

### ESLint Configuration
- Uses ESLint 9 with Next.js recommended rules (`eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`)
- Ignores `.next/`, build directories, test artifacts, and auto-generated files
- File: `/Users/mattpaver/Desktop/QuickSupply/eslint.config.mjs`

---

## Naming

### Component Naming
- **Functional components**: PascalCase (e.g., `EmptyState`, `AgencyLiveRefresh`, `StatusBadge`)
- **File names**: Match component name or use kebab-case for utilities (e.g., `empty-state.tsx`, `assignment-engine.ts`)
- **UI Components**: Located in `/src/components/ui/` (Radix/shadcn-ui based)
- **Feature components**: Organized by feature (e.g., `/src/components/agency/`, `/src/components/school/`, `/src/components/teacher/`)
- **Shared components**: Placed in `/src/components/shared/` for cross-feature usage

### Page and Route Naming
- **Pages**: Using Next.js App Router with dynamic segments in brackets (e.g., `[id]/page.tsx`)
- **API routes**: Organized by feature with `route.ts` files (e.g., `/api/auth/login/route.ts`)
- **Loading states**: `loading.tsx` files colocated with pages (e.g., `/agency/requests/loading.tsx`)
- **Error boundaries**: `error.tsx` files at segment level (e.g., `/agency/error.tsx`, `/app/error.tsx`)

### Variable and Function Naming
- **Functions**: camelCase (e.g., `rankTeachersForRequest`, `createNotification`, `getSessionSecret`)
- **Constants**: UPPER_SNAKE_CASE for configuration (e.g., `SESSION_COOKIE`, `RULES`)
- **Database identifiers**: Text-based IDs using ULID format (e.g., `"teacher-1"`, `"school-1"`)
- **Type names**: PascalCase (e.g., `Session`, `UserRole`, `RankedTeacher`, `EmptyStateProps`)
- **Enums/unions**: Quoted literal unions for database compatibility (e.g., `{ enum: ["compliant", "pending", "expired"] }`)

### Database Field Naming
- **Column names**: snake_case in database (mapped to camelCase via Drizzle)
- **Schema exports**: Uppercase table names pluralized (e.g., `schools`, `teachers`, `coverRequests`)
- **Primary keys**: Always `id` as text type with ULID format
- **Timestamps**: `createdAt` field (integer mode with timestamp conversion)
- **Boolean fields**: Prefixed with descriptive verb/adjective (e.g., `isEmergency`, `canDrive`, `isAvailable`)

---

## Patterns

### Server Components (Default)
- **Default pattern**: All pages and layouts are Server Components by default
- **Usage**: Data fetching, authentication checks, database queries
- **Example**: `/Users/mattpaver/Desktop/QuickSupply/src/app/agency/dashboard/page.tsx` directly queries database with `db.select()` at component render time
- **Authentication**: Uses `requireSession()` with optional role parameter: `await requireSession("agent")`

### Client Components
- **Marked with**: `"use client"` directive at top of file
- **Usage**: Form handling, state management, interactivity
- **Examples**:
  - `/Users/mattpaver/Desktop/QuickSupply/src/components/shared/empty-state.tsx` - UI with conditional rendering
  - `/Users/mattpaver/Desktop/QuickSupply/src/app/login/page.tsx` - Form handling with `useState`

### Form Handling
- **Library**: react-hook-form with Zod for validation
- **Pattern**: Manual `fetch()` calls with `POST` requests (no form submission frameworks)
- **Error handling**: Inline error state with `useState`
- **Loading state**: Tracked with boolean flag during API call
- **Example** (from `/Users/mattpaver/Desktop/QuickSupply/src/app/login/page.tsx`):
```typescript
"use client";
const [email, setEmail] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError("");
  setLoading(true);
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) router.push(path);
    else setError(data?.error ?? "Error message");
  } finally {
    setLoading(false);
  }
}
```

### API Routes
- **Location**: `/src/app/api/` with feature-based subdirectories
- **Pattern**: Async `POST` or `GET` functions with `NextRequest`/`NextResponse`
- **Authentication**: Call `getSession()` and return 401 if not authenticated
- **Authorization**: Check `session.role` and return 403 if forbidden
- **Validation**: Manual JSON parsing with error handling
- **Rate limiting**: Call `rateLimitApi(identifier)` or `rateLimitLogin(identifier)` before processing
- **Response format**: `NextResponse.json({ ... })` with appropriate status codes

**Example** (from `/Users/mattpaver/Desktop/QuickSupply/src/app/api/requests/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  if (await rateLimitApi(identifier)) {
    return NextResponse.json({ error: "Too many requests..." }, { status: 429 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "school") return NextResponse.json({ error: "Forbidden..." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  // ... validation and processing
}
```

### Server-Sent Events (SSE)
- **Hook**: `useSSE(url, callback)` in `/src/hooks/use-sse.ts`
- **Pattern**: Client component subscribes to SSE endpoint, invokes callback on event
- **Reconnection**: Automatic exponential backoff (max 30 seconds) on disconnect
- **Heartbeat handling**: Silent error catching for non-JSON messages

**Example** (from `/Users/mattpaver/Desktop/QuickSupply/src/components/agency/agency-live-refresh.tsx`):
```typescript
"use client";
export function AgencyLiveRefresh() {
  const router = useRouter();
  useSSE("/api/sse/agency", (event) => {
    if (event.type === "notification") {
      window.dispatchEvent(new CustomEvent("qs-notification"));
    }
    router.refresh();
  });
  return null;
}
```

**SSE endpoints**: Located in `/src/app/api/sse/` with role-based subscriptions (agency, school, teacher)

### Database and Drizzle ORM
- **Database**: SQLite with better-sqlite3 driver
- **Schema file**: `/Users/mattpaver/Desktop/QuickSupply/src/lib/db/schema.ts`
- **Query pattern**: Direct synchronous queries using Drizzle (no async)
  ```typescript
  const request = db.select().from(coverRequests).where(eq(coverRequests.id, id)).get();
  ```
- **Type inference**: `InferSelectModel<typeof table>` for TypeScript safety
- **Type exports**: Located in `/src/types/index.ts` with `School`, `Teacher`, `Session`, etc.

### Assignment Engine
- **File**: `/Users/mattpaver/Desktop/QuickSupply/src/lib/assignment-engine.ts`
- **Pattern**: Complex business logic for teacher ranking
- **Ranking factors**:
  - Distance calculation (haversine formula)
  - School review averages per teacher
  - Previous work history
  - Availability matching (date/dayOfWeek)
  - Compliance status
  - Emergency availability
  - Teacher blacklist (per school)
  - Preferred teacher boost
- **Integration**: Called by agency assignment endpoints

### Authentication & Sessions
- **File**: `/Users/mattpaver/Desktop/QuickSupply/src/lib/auth.ts`
- **Method**: HMAC-SHA256 signed session cookies
- **Session format**: Base64-encoded JSON with signature (e.g., `payload.signature`)
- **Duration**: 24-hour maxAge with httpOnly and secure flags
- **Validation**: `requireSession(expectedRole?)` helper redirects unauthenticated users
- **Roles**: `"school"`, `"teacher"`, `"agent"` union type

### Rate Limiting
- **File**: `/Users/mattpaver/Desktop/QuickSupply/src/lib/rate-limit.ts`
- **Backend**: Upstash Redis with fallback to in-memory store
- **Rules**:
  - Login: 5 attempts per 15 minutes
  - API: 20 requests per 1 minute
  - Password reset request: 3 per 15 minutes
  - Password reset confirm: 10 per 15 minutes
- **Identifier**: Extracted from `x-forwarded-for` or `x-real-ip` headers
- **Memory pruning**: Automatic cleanup of expired entries

### Notifications
- **File**: `/Users/mattpaver/Desktop/QuickSupply/src/lib/notifications.ts`
- **Pattern**: Fire-and-forget email sending (non-blocking)
- **Types**: `"offer"`, `"accepted"`, `"declined"`, `"expired"`, `"cancellation"`, `"reminder"`, `"filled"`
- **Recipients**: Resolved per type (schools → `contactEmail`, teachers/agents → `email`)
- **Email provider**: Resend API integration

### Styling
- **Framework**: Tailwind CSS 4 with PostCSS
- **Component library**: Radix UI primitives via shadcn-ui components
- **Approach**: Utility-first with BEM-adjacent naming conventions
- **Custom animations**: `qs-enter`, `qs-pop` for entrance effects
- **Dark mode**: next-themes integration available for theme switching

---

## Error Handling

### Error Boundaries
- **Root boundary**: `/src/app/error.tsx` catches global errors
- **Segment boundaries**: `error.tsx` files at feature level (e.g., `/agency/error.tsx`, `/school/error.tsx`)
- **Pattern**: "Use client" component receiving `error` and `reset` props
- **UI**: Consistent error card with icon, message, and action buttons (Try Again / Dashboard / Login)

**Example** (from `/Users/mattpaver/Desktop/QuickSupply/src/app/error.tsx`):
```typescript
"use client";
export default function RootError({ error, reset }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="...">
      {/* Error UI with reset button */}
    </div>
  );
}
```

### API Error Responses
- **Status codes**:
  - `200` - Success
  - `400` - Bad request (validation errors)
  - `401` - Unauthorized (not logged in)
  - `403` - Forbidden (wrong role/permission)
  - `429` - Rate limited
  - `500` - Server error (logged)
- **Format**: `{ error: "message" }` for errors, `{ ok: true, ... }` for success
- **Validation errors**: Included in `error` field with context

**Example**:
```typescript
if (!email || !password) {
  return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
}
```

### Client-Side Error Handling
- **Form errors**: Caught in `catch` block, displayed in component state
- **JSON parsing**: Safe with `.catch(() => ({}))` fallback
- **Network errors**: Caught in try-finally blocks
- **Logging**: Console error statements with context tags for debugging

---

## State Management

### Server State
- **Pattern**: SQLite database is the source of truth
- **Synchronization**: SSE events notify clients of changes (real-time updates)
- **No client state cache**: Fresh data on each `router.refresh()` call
- **Scope**: All authenticated pages refresh when events arrive

### Client State
- **useState**: For form inputs, loading flags, and UI state
- **Scope**: Limited to component level (no global context)
- **Example**: Email/password state in login form, loading state during submission
- **Lifting state**: Props drilling for shared state between components

### Server-Side Event (SSE) Flow
1. Client subscribes to `/api/sse/{role}/{id}` endpoint
2. Server maintains open connections using Node EventEmitter pattern (`sseManager`)
3. When data changes (e.g., new offer), server emits event: `sseManager.emit("agency", { type: "new_offer", data: {...} })`
4. Client receives event, dispatches custom DOM event, triggers `router.refresh()`
5. Next.js re-fetches Server Component data and re-renders page

**File**: `/Users/mattpaver/Desktop/QuickSupply/src/lib/sse-manager.ts`

### Session State
- **Storage**: Signed HTTP-only cookie (`qs_session`)
- **Validation**: HMAC-SHA256 verification on each request
- **Access**: `getSession()` returns `{ userId, role, name }` or null
- **Enforcement**: `requireSession(expectedRole?)` redirects on auth failure
- **Persistence**: Maintained across page refreshes via cookie

### Data Fetching Pattern
- **Server Components**: Direct database queries (no caching)
- **Client Components**: Explicit `fetch()` to API endpoints
- **Revalidation**: Triggered by SSE events calling `router.refresh()`
- **No React Query/SWR**: Manual fetch patterns with local state management

---

## API and Integration Patterns

### Environment Variables
- **Public vars**: `NEXT_PUBLIC_*` prefix (accessible in browser)
- **Server vars**: Used in API routes (DATABASE_URL, SESSION_SECRET, RESEND_API_KEY, etc.)
- **Example**: `NEXT_PUBLIC_DEMO_MODE` controls demo user UI on login page

### External Services
- **Email**: Resend API for notifications (fire-and-forget, errors ignored)
- **Caching**: Upstash Redis for rate limiting (graceful fallback to memory)
- **Monitoring**: Sentry integration for error tracking (imported but not shown in sample code)
- **Database**: SQLite with migrations managed by Drizzle Kit

### Error Tracking and Logging
- **Sentry setup**: `/src/sentry.edge.config.ts` and `/src/sentry.server.config.ts` (basic setup)
- **Console logging**: Tagged with context (e.g., `[rate-limit]`, `[sse]`)
- **No structured logging**: Primarily console.error() and error boundary logs
