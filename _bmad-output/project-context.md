---
project_name: 'QuickSupply'
user_name: 'Matt'
date: '2026-03-27'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 42
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in QuickSupply. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Runtime:** Next.js 16.1.6 (App Router) + React 19.2.3
- **Language:** TypeScript 5 (strict mode)
- **Database:** SQLite via better-sqlite3 12.6.2 + Drizzle ORM 0.45.1
- **Styling:** Tailwind CSS v4 + OKLCh color system
- **Component Library:** shadcn/ui (Radix UI primitives)
- **Forms:** React Hook Form 7 + Zod 4 validation
- **Icons:** Lucide React 0.575
- **Date Handling:** date-fns 4.1
- **Auth:** Cookie-based sessions (custom, not NextAuth)
- **Email:** Resend 6.9
- **Rate Limiting:** Upstash Redis + Ratelimit
- **Monitoring:** Sentry 10.40
- **Testing:** Playwright (E2E)
- **IDs:** ULID (not UUID)
- **Package Manager:** pnpm
- **Dev Server:** Turbopack (`next dev --turbopack`)

---

## Critical Implementation Rules

### Language-Specific Rules

- **TypeScript strict mode is ON** — no `any` types, no implicit returns, no unused variables
- **Path aliases:** Always use `@/*` for imports from `src/` — never relative paths beyond `./` or `../` within the same directory
- **IDs use ULID** — import from `ulid` package, never use `crypto.randomUUID()`
- **Async/await only** — no `.then()` chains in components or API routes; `.then()` is acceptable only in `useEffect` cleanup patterns
- **Zod for validation** — all API route inputs must be validated with Zod schemas before processing
- **Error handling:** API routes must return `{ error: string }` on failure, `{ success: true, ... }` on success — never throw unhandled errors from routes

### Framework-Specific Rules

- **App Router only** — no Pages Router patterns. All routes live under `src/app/`
- **Server Components by default** — only add `"use client"` when the component needs hooks, event handlers, or browser APIs
- **Three portals:** `school/`, `teacher/`, `agency/` — each has its own layout, nav, and component folder. Never share portal-specific components across portals
- **Shared components** go in `src/components/shared/` — these must be portal-agnostic
- **UI primitives** live in `src/components/ui/` — these are shadcn/ui components, modified only via the shadcn CLI or by editing in place. Never duplicate
- **SSE for real-time:** Each portal has an SSE endpoint (`/api/sse/school/[id]`, `/api/sse/teacher/[id]`, `/api/sse/agency`). Use the `useSSE` hook for client-side consumption
- **Toast for feedback:** Use `sonner` toast for all user-facing success/error messages — never `alert()` or inline messages (exception: field-level form validation errors)
- **Cookie auth pattern:** Use `requireSession(role)` from `@/lib/auth` in server components and API routes. It throws redirect on unauthorized — no need to handle the failure case
- **Drizzle queries:** Use the query builder pattern (`db.select().from().where()`) not the relational query API. Always call `.get()` for single rows, `.all()` for lists

### Design System Rules

- **Color system uses OKLCh** — defined in `globals.css` as CSS custom properties
- **Primary = Desian Purple** (`oklch(0.321 0.156 303.438)`) — CTAs, headings, links, active states
- **Secondary = Desian Blue** (`oklch(0.547 0.215 262.881)`) — teacher portal accents, supporting elements
- **Accent = Light Purple** (`oklch(0.912 0.082 303.438)`) — highlights, range selections
- **Never use hardcoded Tailwind colors** (e.g., `text-red-600`, `bg-green-50`). Use design tokens instead:
  - Errors/danger: `text-destructive`, `bg-destructive/10`, `border-destructive/30`
  - Success/positive: `text-emerald-*` (emerald is the project's semantic green)
  - Info/secondary: `text-secondary`, `bg-secondary/10`
  - Warning: `border-amber-200 bg-amber-50/80` (amber is acceptable for warning states)
- **All form inputs must use shadcn components** — `<Input>`, `<Select>`, `<Textarea>` — never raw HTML `<input>`, `<select>`, `<textarea>` with manual styling
- **Status badges:** Always use the `<StatusBadge>` component from `@/components/shared/status-badge` — never inline badge styling
- **Empty states:** Always use the `<EmptyState>` component from `@/components/shared/empty-state`
- **Loading states:** Use skeleton components (`DashboardSkeleton`, `ListPageSkeleton`, `PageSkeleton`) — never bare spinners
- **Animations:** Use `qs-enter` for page entrance, `qs-pop` for card appearance, `qs-live-pulse` for live indicators. All respect `prefers-reduced-motion`
- **`cn()` utility** for merging classes — always import from `@/lib/utils`

### Testing Rules

- **Playwright for E2E** — no unit test framework currently configured
- **Route smoke tests:** `pnpm e2e:routes` checks all routes return 200
- **Test files:** Live in `/tests/` directory (not colocated with source)
- **No mocking the database** — tests run against real SQLite

### Code Quality & Style Rules

- **File naming:** kebab-case for all files (e.g., `cover-request-form.tsx`, `assignment-panel.tsx`)
- **Component naming:** PascalCase for exports (e.g., `export function CoverRequestForm()`)
- **Component size limit:** If a component exceeds ~300 lines, extract sub-components into the same file as named functions below the main component
- **Date formatting:** Always use `date-fns` `format()` — never `toLocaleDateString()` or manual string building
- **No barrel exports** — import directly from the component file, not from `index.ts`
- **Prefer Server Components for data fetching** — fetch data in the page component, pass as props to client components

### Development Workflow Rules

- **Database migrations:** `pnpm db:generate` to create migration, `pnpm db:migrate` to apply
- **Seeding:** `pnpm db:seed` for initial data, `pnpm db:seed-demo` for demo scenarios
- **Build check:** Always run `pnpm build` before considering work complete — it catches type errors and import issues that `dev` misses
- **No `.env` in commits** — environment variables are documented in `.env.example`
- **SQLite file (`db.sqlite`)** is gitignored — never commit it

### Critical Don't-Miss Rules

- **Assignment engine is sequential** — offers go to one teacher at a time based on ranking. Never send parallel offers. The logic lives in `src/lib/assignment-engine.ts`
- **Offer expiry is time-based** — offers have an `expiresAt` timestamp. The cron endpoint `/api/cron` handles expiry. Client-side countdown is display-only
- **School reviews are per-booking** — a school reviews a teacher after each completed booking, not per-teacher. The `wouldRebook` boolean feeds into `agencyRating` recalculation
- **Three user roles only:** `school`, `teacher`, `agent` — these map to the three portals. There is no admin role
- **Notification system uses SSE** — not WebSocket, not polling. Each portal has its own SSE endpoint scoped to the user/entity ID
- **Interactive elements must be semantic** — use `<Link>` for navigation, `<button>` for actions. Never `<div role="button">` or `<div onClick>`
- **Accessibility:** All custom interactive components need `focus-visible:ring-[3px] focus-visible:ring-ring/50`. Dynamic content areas need `aria-live="polite"`

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-03-27
