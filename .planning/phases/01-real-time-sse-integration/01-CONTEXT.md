# Phase 1: Real-Time & SSE Integration - Context

**Gathered:** 2026-03-06
**Status:** Complete (already implemented)

<domain>
## Phase Boundary

Wire SSE hooks into all portals for live updates, sync countdown timers, add browser notifications.

</domain>

<decisions>
## Implementation Decisions

### Assessment: Phase Already Complete

Codebase analysis reveals all 5 requirements (RT-01 through RT-05) are already implemented:

1. **RT-01 (Agency live updates)**: `AgencyLiveRefresh` component mounted in agency dashboard and request detail pages. Uses `useSSE("/api/sse/agency")` → `router.refresh()` on every event.

2. **RT-02 (Teacher live updates)**: Teacher jobs page uses `useSSE` directly. Handles all offer events (`new_offer`, `offer_expired`, `offer_accepted`, `offer_declined`, `offer_withdrawn`) by calling `loadOffers()`.

3. **RT-03 (School live updates)**: `SchoolLiveRefresh` component mounted in school dashboard. Uses `useSSE("/api/sse/school/${schoolId}")` → `router.refresh()`.

4. **RT-04 (Countdown timer sync)**: Timer uses `setInterval(1000)`. When it detects local expiry, it triggers `loadOffers()`. When SSE `offer_expired` arrives, `loadOffers()` is also called. The sync gap is cosmetic only (client may show "Expired" a few seconds before cron runs server-side).

5. **RT-05 (Browser notifications)**: Teacher jobs page requests `Notification.permission` on mount and fires OS notifications when `new_offer` event arrives and `document.hidden` is true.

### Claude's Discretion

No changes needed. Phase is complete as-is.

</decisions>

<code_context>
## Existing Code

### Key Files
- `src/hooks/use-sse.ts` — SSE hook with reconnection + exponential backoff (max 30s)
- `src/lib/sse-manager.ts` — Server-side singleton pub/sub with channel-based routing
- `src/components/agency/agency-live-refresh.tsx` — Agency SSE subscriber
- `src/components/school/school-live-refresh.tsx` — School SSE subscriber
- `src/app/teacher/jobs/page.tsx` — Teacher SSE + countdown + browser notifications

### Integration Points
- Agency: mounted in `agency/dashboard/page.tsx` and `agency/requests/[id]/page.tsx`
- School: mounted in `school/dashboard/page.tsx`
- Teacher: inline in `teacher/jobs/page.tsx`

</code_context>

<specifics>
## Notes

The README "What's Left To Do" Priority 1 list is out of date for SSE items. These were implemented but the checklist was never updated.

</specifics>

<deferred>
## Deferred Ideas

- Expand SSE to additional agency pages (requests list, teachers list, bookings) — not needed for MVP
- Add SSE heartbeat/ping for connection health — enhancement

</deferred>

---

*Phase: 01-real-time-sse-integration*
*Context gathered: 2026-03-06*
