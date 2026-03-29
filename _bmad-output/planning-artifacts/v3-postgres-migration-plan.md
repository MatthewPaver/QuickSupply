# V3 PostgreSQL Migration Plan

## Overview

Migrate QuickSupply from SQLite (better-sqlite3) to PostgreSQL (postgres.js) to enable:
1. Multi-agency support (concurrent writes, horizontal scaling)
2. Production deployment on Vercel/Railway without SQLite file persistence issues
3. Connection pooling for higher concurrency

## Scope

- **22 tables** to migrate
- **100+ `.all()` calls** across 48 files to convert (SQLite sync → Postgres async)
- **`.get()` calls** to convert to `[0]` array access
- New `agencies` table with `agencyId` FK on core entities

## Migration Strategy

### Phase 1: Schema Conversion (schema.ts)
- `sqliteTable` → `pgTable`
- `integer("col", { mode: "boolean" })` → `boolean("col")`
- `integer("col", { mode: "timestamp" })` → `timestamp("col")`
- `real("col")` → `doublePrecision("col")`
- Add `agencies` table
- Add `agencyId` FK to: schools, teachers, agents, payRates, invoices

### Phase 2: Connection Layer (db/index.ts)
- Remove `better-sqlite3` import
- Add `postgres` (postgres.js) driver
- Update `drizzle()` call to use `drizzle-orm/postgres-js`
- Connection string from `DATABASE_URL` env var

### Phase 3: Query API Migration (48 files)
The critical change: SQLite Drizzle is **synchronous** (`.all()`, `.get()`, `.run()`), Postgres Drizzle is **async** (`await` the query).

For each file:
- `.all()` → remove it, `await` the query (returns array)
- `.get()` → add `.limit(1)`, `await`, then `[0]`
- `.run()` → `await` the query
- Add `async` to any function that wasn't already async

**Estimated effort:** 100+ call sites across 48 files. Use a codemod script.

### Phase 4: Data Migration
1. Set up PostgreSQL instance (Neon, Supabase, or Railway)
2. Create tables via `drizzle-kit push`
3. ETL script to read from SQLite → insert into Postgres
4. Convert integer timestamps to proper `timestamp` values
5. Create default agency record, assign all existing data to it

### Phase 5: Multi-Tenancy Scoping
After `agencyId` is on all core tables:
- Add middleware or data-access helper to inject `agencyId` from session
- Update every query with `.where(eq(table.agencyId, agencyId))`
- Agency onboarding flow (create agency, create first agent)
- Agency branding (logo, primary color)

## Dependencies
- PostgreSQL instance (Neon free tier for dev, dedicated for prod)
- `postgres` npm package (already installed)
- Updated `drizzle.config.ts` dialect
- Comprehensive E2E test coverage (28 tests exist)

## Risk Mitigation
- Run both databases in parallel during transition
- Feature flag for new agency code path
- Full E2E test suite must pass on Postgres before cutting over
- Keep SQLite as fallback for local development

## Files Requiring Changes

### Schema & Config (3 files)
- `src/lib/db/schema.ts` — full rewrite
- `src/lib/db/index.ts` — driver swap
- `drizzle.config.ts` — dialect change

### Query API (48 files with .all()/.get()/.run())
See grep results for full list. Key files:
- `src/lib/assignment-engine.ts` (13 .all() calls)
- `src/app/agency/teachers/[id]/page.tsx` (8 .all() calls)
- `src/app/agency/analytics/page.tsx` (7 .all() calls)
- All API routes, all page server components
