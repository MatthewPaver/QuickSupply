# Story 1.1 — Agency Analytics Dashboard Page

**Epic:** 1 — Agency Analytics Dashboard
**Priority:** P1
**Estimate:** L
**Status:** Ready for Implementation

---

## Story Description

**As an** agency consultant, **I want to** see key performance metrics on a dashboard, **so that** I can monitor agency effectiveness and identify issues at a glance.

This story creates the analytics landing page (`/agency/analytics`) with summary metric cards and a date-range filter. It is the entry point for the analytics epic; subsequent stories (1.2-1.4) add detailed drill-down reports for each metric.

---

## Acceptance Criteria

```gherkin
Feature: Agency Analytics Dashboard

  Background:
    Given I am logged in as an agent
    And I navigate to "/agency/analytics"

  Scenario: View analytics dashboard with key metrics
    Given the analytics page loads
    Then I see summary metric cards for:
      | Metric              | Source                                              |
      | Fill Rate           | filled requests / total non-cancelled requests       |
      | Avg Response Time   | mean time between offeredAt and responseAt           |
      | Teacher Utilization  | bookings per active teacher                          |
      | School Satisfaction | average review rating across all reviews              |
      | Cancellation Rate   | cancelled bookings / total bookings                  |
    And each metric card shows a numeric value and a contextual label

  Scenario: Metrics are calculated from real data
    Given booking, offer, and review data exists in the database
    When I view the dashboard
    Then all metrics are calculated from actual coverRequests, assignmentOffers, bookings, and schoolTeacherReviews data
    And fill rate displays as a percentage (e.g., "78%")
    And avg response time displays in human-readable format (e.g., "12 min")
    And teacher utilization displays as a ratio (e.g., "3.2 bookings/teacher")
    And school satisfaction displays as a rating (e.g., "4.2 / 5")
    And cancellation rate displays as a percentage (e.g., "5%")

  Scenario: Filter metrics by date range
    Given I see a date range picker with "from" and "to" fields
    When I select a date range and apply it
    Then all metric cards update to reflect only data within that range
    And cover requests are filtered by their "date" column
    And offers are filtered by their "offeredAt" timestamp
    And bookings are filtered by their "confirmedAt" timestamp
    And reviews are filtered by their "createdAt" timestamp

  Scenario: Default date range
    Given I have not selected a date range
    Then the dashboard defaults to the last 30 days

  Scenario: No data exists for selected period
    Given no cover requests, bookings, or reviews exist in the selected date range
    Then I see appropriate empty states for each metric card
    And fill rate shows "No requests" instead of "0%"
    And avg response time shows "No offers" instead of "0 min"
    And teacher utilization shows "No bookings"
    And school satisfaction shows "No reviews"
    And cancellation rate shows "No bookings"

  Scenario: Loading state
    Given the page is loading data
    Then I see skeleton placeholders for each metric card
    And the skeletons match the final card layout dimensions

  Scenario: Analytics is accessible from navigation
    Given I am on any agency page
    Then I see "Analytics" in the sidebar navigation
    And clicking it navigates me to "/agency/analytics"
```

---

## Technical Implementation Plan

### Architecture

The analytics page follows the existing pattern: a server component page that fetches data directly via Drizzle, with an optional client component for the date-range filter that triggers a page reload with search params.

**Data flow:**
1. Page reads `searchParams.from` and `searchParams.to` (ISO date strings)
2. If absent, defaults to 30 days ago through today
3. Server component queries all five metrics from the database
4. Results are rendered as stat cards

No separate API route is needed for the initial implementation. The server component queries the database directly, consistent with the existing dashboard pattern (`src/app/agency/dashboard/page.tsx`). A dedicated API route (`/api/agency/analytics`) will be added in a follow-up if client-side interactivity (e.g., live chart updates) requires it.

### Metric Calculations

All queries are scoped to the selected date range.

#### 1. Fill Rate
```
Source: coverRequests table
Formula: COUNT(status = 'filled') / COUNT(status != 'cancelled') * 100
Filter: coverRequests.date BETWEEN from AND to
```

#### 2. Average Response Time
```
Source: assignmentOffers table
Filter: status IN ('accepted', 'declined') AND responseAt IS NOT NULL
         AND offeredAt BETWEEN from AND to
Formula: AVG(responseAt - offeredAt) in minutes
Note: Exclude 'expired' offers (they hit the window limit, not a human response)
```

#### 3. Teacher Utilization
```
Source: bookings table + teachers table
Filter: bookings where cancelledAt IS NULL
         AND booking's coverRequest.date BETWEEN from AND to
Formula: COUNT(bookings) / COUNT(active teachers)
Note: Active teachers = teachers.isActive = true
```

#### 4. School Satisfaction
```
Source: schoolTeacherReviews table
Filter: createdAt BETWEEN from AND to
Formula: AVG(rating)
Additional: COUNT(wouldRebook = true) / COUNT(*) as rebook percentage
```

#### 5. Cancellation Rate
```
Source: bookings table
Filter: booking's coverRequest.date BETWEEN from AND to
Formula: COUNT(cancelledAt IS NOT NULL) / COUNT(*) * 100
```

### UI Design

```
+----------------------------------------------------------+
| Analytics                           [From] [To] [Apply]  |
+----------------------------------------------------------+
| +----------+ +----------+ +----------+ +----------+ +--+ |
| | Fill     | | Avg Resp | | Teacher  | | School   | |Can| |
| | Rate     | | Time     | | Util.    | | Satisf.  | |cel| |
| |          | |          | |          | |          | |   | |
| |  78%     | |  12 min  | |  3.2/t   | |  4.2/5   | | 5%| |
| | 94/120   | | median:  | | 64 total | | 28 rev.  | |3/ | |
| | requests | | 9 min    | | bookings | | 82% reb. | |60 | |
| +----------+ +----------+ +----------+ +----------+ +--+ |
+----------------------------------------------------------+
```

- **Stat cards:** Reuse existing `Card`, `CardHeader`, `CardTitle`, `CardContent` pattern from the dashboard
- **Icons:** Use Lucide icons (`TrendingUp`, `Clock`, `Users`, `Star`, `XCircle`)
- **Date picker:** Client component using two `<Input type="date">` fields and an "Apply" `<Button>` that updates URL search params via `useRouter().push()`
- **Responsive:** Cards in a 5-column grid on desktop (`md:grid-cols-5`), 2-column on tablet (`sm:grid-cols-2`), stacked on mobile
- **Animations:** `qs-pop` on each card for entrance animation
- **Empty states:** Inline within each card (grey text, no `EmptyState` component needed for individual cards)

### Navigation Update

Add an "Analytics" item to the agency nav config between "Dashboard" and "Requests":

```typescript
{ href: "/agency/analytics", label: "Analytics", icon: BarChart3 },
```

---

## Database Changes

**None required.** All metrics are computed from existing tables:
- `coverRequests` (fill rate, date filtering)
- `assignmentOffers` (response time)
- `bookings` (utilization, cancellation rate)
- `teachers` (active teacher count)
- `schoolTeacherReviews` (satisfaction scores)

### Performance Considerations

- All queries are read-only aggregations over modest data volumes (MVP scale: ~50 schools, ~200 teachers, ~10,000 bookings max)
- Date range filtering keeps query result sets small
- No indexes are needed beyond the existing PK/FK indexes at MVP scale
- If performance degrades, add composite indexes:
  - `cover_requests(date, status)`
  - `bookings(cover_request_id)` (already indexed via FK)
  - `school_teacher_reviews(created_at)`

---

## Files to Create/Modify

### CREATE

| File | Purpose |
|------|---------|
| `src/app/agency/analytics/page.tsx` | Server component: fetches metrics, renders stat cards. Reads `searchParams.from` and `searchParams.to` for date filtering. |
| `src/app/agency/analytics/loading.tsx` | Loading skeleton using `DashboardSkeleton` component. |
| `src/components/agency/analytics-date-filter.tsx` | Client component (`"use client"`): date range inputs + Apply button. Uses `useRouter().push()` to update URL search params. |

### MODIFY

| File | Change |
|------|--------|
| `src/app/agency/nav-config.tsx` | Add `{ href: "/agency/analytics", label: "Analytics", icon: BarChart3 }` after the Dashboard item. Import `BarChart3` from `lucide-react`. |

---

## Implementation Notes

### Query Patterns

Follow the existing Drizzle query builder pattern used in `dashboard/page.tsx`:

```typescript
// Example: fill rate query
const requests = db
  .select()
  .from(coverRequests)
  .where(
    and(
      gte(coverRequests.date, fromDate),
      lte(coverRequests.date, toDate)
    )
  )
  .all();

const filled = requests.filter((r) => r.status === "filled").length;
const total = requests.filter((r) => r.status !== "cancelled").length;
const fillRate = total > 0 ? Math.round((filled / total) * 100) : null;
```

### Date Filter Component

The date filter is a client component that manipulates URL search params:

```typescript
"use client";
// Uses useRouter and useSearchParams
// On "Apply", pushes new URL: /agency/analytics?from=2026-03-01&to=2026-03-27
// On mount, reads current searchParams to populate input defaults
```

### Auth Pattern

Follow the existing pattern:
```typescript
await requireSession("agent");
```

### Formatting Conventions

- Response time: Use `date-fns` `formatDuration` or manual formatting for minutes
- Percentages: Round to nearest integer, append `%`
- Ratings: One decimal place (e.g., `4.2`)
- Counts: Integer with contextual label (e.g., `94 / 120 requests`)

---

## Testing Criteria

| Test | Type | Description |
|------|------|-------------|
| Page renders with metrics | Smoke | Navigate to `/agency/analytics`, verify 5 stat cards render with numeric values |
| Skeleton shown during load | Visual | `loading.tsx` renders `DashboardSkeleton` component |
| Date range filtering | Functional | Apply `from=2026-03-01&to=2026-03-15`, verify metrics reflect only that range |
| Default date range | Functional | No search params results in last 30 days of data |
| Empty state display | Edge case | Select a future date range with no data, verify each card shows appropriate empty text |
| Nav item present | Smoke | Verify "Analytics" appears in the agency sidebar navigation |
| Nav item links correctly | Smoke | Click "Analytics" in nav, verify navigation to `/agency/analytics` |
| Responsive layout | Visual | Cards stack correctly on mobile viewport (< 640px) |
| Auth protection | Security | Unauthenticated request to `/agency/analytics` redirects to login |
| Non-agent role blocked | Security | Teacher/school session cannot access the page |
| Build passes | CI | `pnpm build` completes without errors |

---

## Definition of Done

- [ ] All five metric cards render on `/agency/analytics` with correct calculations
- [ ] Date range filter works with URL search params (from/to)
- [ ] Default range is last 30 days when no params provided
- [ ] Empty states shown when no data exists for the selected period
- [ ] Loading skeleton appears during page load
- [ ] "Analytics" nav item visible in agency sidebar between Dashboard and Requests
- [ ] Page is auth-protected via `requireSession("agent")`
- [ ] Responsive layout: 5 cols desktop, 2 cols tablet, 1 col mobile
- [ ] No TypeScript errors (`pnpm build` passes)
- [ ] Code follows project conventions (path aliases, Drizzle query builder, Lucide icons, shadcn/ui components, OKLCh design tokens)

---

## Dependencies

- **Upstream:** None (reads existing data only)
- **Downstream:** Stories 1.2 (Fill Rate Report), 1.3 (Response Time Metrics), 1.4 (School Satisfaction Scores), 1.5 (Analytics Landing Page) can use this page as a starting point and add drill-down navigation from the metric cards

---

## Out of Scope

- Charts/graphs (deferred to Stories 1.1-1.4 detailed reports)
- Export/download functionality
- Comparison with previous period (e.g., "vs last month")
- Real-time updates via SSE (metrics are computed on page load)
- Dedicated API route (server component queries directly; API route added later if needed)
