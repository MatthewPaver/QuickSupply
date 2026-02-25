# Booking and Offer Logic — Deep Dive

This document summarises how offers and bookings work in QuickSupply so you can reason about edge cases and tests.

## 1. State model

- **Cover request** has status: `pending` | `offering` | `filled` | `cancelled`.
- **Assignment offer** has status: `pending` | `accepted` | `declined` | `expired` | `withdrawn`.
- **Booking** links a request to a teacher once an offer is **accepted**. Cancelled bookings keep a row with `cancelledAt` set.

## 2. When is a booking created?

**Only when a teacher accepts an offer.** There is no other path:

- **Start Sequential Offering** → creates a **pending offer** for the first ranked teacher → teacher sees it on Jobs → Accept → **booking created**, request → `filled`.
- **Manual Assign (Send offer)** → creates a **pending offer** for the chosen teacher → same flow: Accept → **booking created**, request → `filled`.

So both agency actions create an **offer**; the **booking** is created only on **Accept**. Declining or expiring does not create a booking.

## 3. Who can be offered a request?

**Ranking** (`rankTeachersForRequest`) filters teachers by:

- **Role**: request `roleNeeded` (teacher/ta) must match teacher `roleType` (teacher / ta / both).
- **Compliance**: must be `compliant`.
- **Not already booked on that date**: any non-cancelled booking on the same **date** (any request) excludes the teacher (no double-booking same day).
- **Not blacklisted** for that school.
- **Not already declined or expired** for this request (we don’t re-offer the same request to the same teacher).
- **Emergency**: if request is emergency, teacher must be `emergencyAvailable`.
- **Contact night before only**: if set, we only include for today/tomorrow.
- **Availability**: recurring or specific-date availability; if no data, default is available.

**Preferred teacher**: If the school set `preferredTeacherId` and that teacher is not in the list (e.g. filtered by availability), we **add them at the top** provided they pass the **hard** filters only: role, compliance, not booked that date, not blacklisted, not declined/expired. So the preferred teacher can still be offered even if they’re marked unavailable that day; the agency can send the offer and the teacher can accept or decline.

## 4. Preferred teacher and role

- **Form**: Only previous teachers whose **role** matches the selected “Role needed” are shown (teacher / TA / both). So the school cannot select a TA-only for a Teacher request or vice versa.
- **API**: When creating a request, if `preferredTeacherId` is set we **validate** that the teacher exists and their role matches `roleNeeded`. If not, we return **400** with a clear message. So even if the client sent a bad value, the server rejects it.

## 5. Offer order and decline

- Each offer has an `offerOrder` (1, 2, 3, …).
- When a teacher **declines** (or offer **expires**), we call `offerToNextTeacher(requestId, ranked, offerOrder + 1)`. The **ranked** list is recomputed (so declined/expired are excluded). We offer to `ranked[nextOrder - 1]`. So we move down the **current** ranked list, not a fixed list.
- If `nextOrder > ranked.length`, we set the request back to **pending** and stop (“All teachers exhausted”).

## 6. Cancelled bookings

- When the agency **cancels a booking**, we set `bookings.cancelledAt` (and optional reason). We set the request back to **pending**.
- **Existing-bookings** checks use `cancelledAt IS NULL`, so cancelled bookings do not block that teacher from being offered again on the same date.

## 7. No double-booking same request

- Only one **pending** offer per request at a time. Before creating a new offer (manual or next in sequence), we **withdraw** any existing pending offers for that request. So only one teacher has an active offer at once.
- A **booking** is created only when an offer is **accepted**. So we never create two bookings for the same request.

## 8. Summary table

| Action                    | Creates offer? | Creates booking? | Request status   |
|---------------------------|----------------|------------------|------------------|
| School submits request    | No             | No               | pending          |
| Agency: Start Sequential | Yes (1st)      | No               | offering         |
| Agency: Assign (manual)   | Yes (chosen)   | No               | offering         |
| Teacher: Accept           | No             | Yes              | filled           |
| Teacher: Decline          | No             | No               | offering (next)  |
| Offer expires             | No             | No               | offering (next)  |
| Agency: Cancel booking    | No             | No (cancel row)  | pending          |

## 9. Testing suggestions

- **E2E route script**: `pnpm e2e:routes` (or `node scripts/e2e-check-routes.mjs`) with dev server running — hits all portals and key routes.
- **Codex / GitHub**: Add a small API or Playwright test that: creates a request with preferred teacher, starts offering, asserts teacher sees offer; accepts and asserts booking exists and request is filled; or use GitHub Actions to run e2e route check on push.
- **MCP**: Sentry (errors), SQLite/Postgres (inspect data), Memory (store test scenarios) can support debugging and regression checks.
