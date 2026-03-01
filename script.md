# QuickSupply Demo Script — Full Walkthrough

Use this script to narrate a complete demo of **QuickSupply** by Desian Education. The demo runs in one pass: you **create a cover request** in the School portal, then walk through the **Agency** portal (where that request appears and can be assigned), then the **Teacher** portal. Steps are listed in click order so you always know what to do next.

**Before you start**

1. **Node:** Use Node.js 22 (`nvm use` if you use `.nvmrc`, then `node -v`). Next.js requires Node >=20.9 and this repo is pinned to 22.
2. Run the app: `pnpm dev` and open [http://localhost:3000](http://localhost:3000).
3. For a clean slate (no existing requests), run:
   ```bash
   pnpm db:clear-requests
   ```
   That clears all cover requests, offers, and bookings but keeps schools, teachers, and agents.
4. **Optional — show "Request Previous Teacher" with data:** After `pnpm db:clear-requests`, run `pnpm db:seed-demo`. That adds one past filled request and booking so St. Mary's has one previous teacher on the form. If you skip this, the **Request Previous Teacher** section still appears with an empty-state message.
5. To use pre-seeded data (7 sample requests) instead, run `pnpm db:migrate` then `pnpm db:seed` and skip the "create a request" steps.

**Demo readiness (run before presenting)**
- `pnpm build` — must succeed.
- `pnpm e2e` — automated checks (smoke routes + full demo flow: school create → agency assign → teacher accept → filled verification).
- Optional: full script walkthrough (create request → agency assign → teacher accept).

---

## 1. Introduction

**[Show the landing page.]**

- "This is **QuickSupply** — a supply teaching workforce app from **Desian Education**. It connects schools, supply teachers and TAs, and the agency in one real-time workflow."
- "There are three portals — School, Teacher, and Agency — each with its own dashboard. Let's start with the School Portal."
- **[Click the "School Portal" card.]**

**[On the login page — showing only school users.]**

- "Each portal has its own sign-in page. We can see the three schools registered on the system. Clicking any one signs you straight in — no passwords needed."

---

## 2. School Portal — Create a Request

**[Click "St. Mary's Catholic Primary".]**

- "I'm now in the School Portal as St. Mary's. Along the top we have Dashboard, New Request, All Requests, and History."

**Dashboard (brief)**

- "The Dashboard shows three cards — Active Requests, Filled Today, and Total Filled — plus a New Cover Request button."
- "Below that we'd see any open requests and recent history. With a clean database there's nothing here yet, so let's create one."
- **[Click "New Request" in the nav.]**

**New Cover Request — fill and submit**

- "This is the New Cover Request form. We'll fill it in so we have a request to follow through the whole workflow."
- **[Pick a date.]** "I'll pick a date — let's say tomorrow. If I picked today, the Emergency checkbox would auto-tick and a note would appear about the shorter response window."
- "I'll leave Emergency unticked for now — you can toggle it on or off at any time."
- **[Select role.]** "Role Needed — I'll choose Teacher. The other option is Teaching Assistant."
- **[Select year group.]** "Year Group — I'll pick Year 4. The options are EYFS and Years 1 through 6."
- **[Set times.]** "Start Time and End Time — let's say 8:30 to 3:30. The form checks that end is after start."
- "Down here we have Request Previous Teacher. If this school has had cover through QuickSupply before, those teachers appear here. Otherwise there's a short message saying they'll show up once cover has been arranged. And Additional Notes is for anything the agency or teacher should know."
- **[Click "Submit Cover Request".]** "I'll hit Submit. We're taken to All Requests and our new request appears at the top — status Pending."

**Confirm on School**

- "On All Requests we can see the row: role, year group, date, times, Pending. Emergency requests would show an EMERGENCY label. Filled ones show the teacher's name or 'Cover Arranged'."
- **[Click "Dashboard" in the nav.]**
- "Back on the Dashboard, Active Requests now shows our request. The school side is done — the agency will take it from here."
- "In a full rollout we'd add email or SMS notifications so the agency is alerted the moment a request comes in. For the demo, everything updates live in the app."
- **[Click the sign-out icon to return to the landing page.]**

---

## 3. Agency Portal — In Nav Order

**[Click the "Agency Dashboard" card, then click "Sarah Mitchell (Admin)".]**

- "I'm now in the Agency Portal. On desktop the sidebar has Dashboard, Requests, Teachers, Schools, Bookings, Agents, and Settings. On smaller screens it collapses into a hamburger menu. There's also a notification bell up in the top bar. Let's walk through each page."

**Dashboard**

- "The Dashboard has four cards at the top: Pending, Being Offered, Filled Today, and Emergencies."
- "Below that, Active Requests lists everything that needs action. Our new request is right here — school name, role, date, and time. Each row is clickable."
- **[Click "Requests" in the sidebar.]**

**Requests (list)**

- "Requests is the full list from all schools, newest first. Our request is at the top. Emergency requests show an EMERGENCY label."
- **[Click the row for the request we created.]**

**Request detail (assignment)**

- "This is the request detail page. At the top we have the school name, a status badge, and an EMERGENCY label if applicable. Request Details shows the date, role, year group, times, and any notes."
- "Offer History tracks everyone we've offered this job to — their name, status, and timestamps."
- "When a request is filled, we'd see a Current Booking card with the assigned teacher, their phone number, and a Cancel Booking button."
- "Right now it's pending, so we see the Eligible Teachers panel. This is a ranked list — each teacher has a score, distance, rating, and any Preferred or Previous badges. Teachers who are too far away are automatically filtered out."
- "From here we can Start Sequential Offering — the system offers to one teacher at a time with a countdown. There's a confirmation step before it kicks off. Or we can manually assign a specific teacher. The phone icon opens a call dialog."
- "To see the full loop: click Assign on a teacher, sign in as that teacher, open their Jobs page, and click Accept. The request shows as Filled here and on the school's dashboard."
- **[Click "Teachers" in the sidebar.]**

**Teachers**

- "Teachers and TAs lists everyone on the books — name, role type, rating, postcode, whether they drive, emergency availability, phone, and compliance status. Click any row to see their full profile."
- **[Click one teacher.]**

**Teacher detail**

- "The teacher detail page shows their contact info, postcode, role type, compliance status, and their assigned agent."
- "Below that we see their preferences — whether they can drive, their max travel distance, emergency availability, and so on."
- "And further down: Weekly Availability, Blacklisted Schools, Recent Bookings, and School Reviews. All of this feeds into the ranking when we assign jobs."
- **[Click "Schools" in the sidebar.]**

**Schools**

- "Schools lists every registered school — name, postcode, contact name, phone, and how many requests they've submitted."
- **[Click "Bookings".]**

**Bookings**

- "Bookings shows confirmed bookings — school, teacher, role, year group, date, and time. Each one is marked Confirmed or Cancelled. Once our request is filled it will appear here."
- **[Click "Agents".]**

**Agents**

- "Agents shows agency staff — name, role, email, and which teachers are assigned to them."
- **[Click "Settings".]**

**Settings**

- "Settings controls the response windows — how long a teacher has to accept or decline an offer."
- "There are two windows: Morning and Emergency for same-day requests, and Next Day and Standard for advance bookings. The form always shows the current values. Changing these updates the countdown that teachers see on their Jobs page."
- **[Sign out and return to the landing page.]**

---

## 4. Teacher Portal

**[Click the "Teacher Portal" card, then click "Sarah Johnson".]**

- "I'm now in the Teacher Portal. On desktop the nav is Dashboard, Availability, Jobs, and Profile. On mobile it's a bottom bar in this order: Dashboard, Jobs, Availability, Profile. For this demo, we'll go Dashboard → Jobs → Availability → Profile."

**Dashboard**

- "The Dashboard welcomes the teacher by name. If they have an active offer, it appears right at the top — school, date, time, and a link to respond."
- "Below that, Today shows today's assignment if they have one, and Upcoming Bookings lists future dates."
- **[Click "Jobs" in the nav.]**

**Jobs**

- "Jobs is where teachers respond to offers. Each pending offer shows the school, date, role, times, and a live countdown."
- "Emergency offers are marked URGENT. Clicking Accept or Decline brings up a confirmation before it goes through."
- "If the countdown runs out, the buttons grey out and a message explains the offer has expired. The system then automatically moves on to the next teacher."
- "Below that, Offer History shows past offers and their outcomes."
- **[Click "Availability" in the nav.]**

**Availability**

- "Availability has recurring day toggles for the working week, plus a calendar for blocking off specific dates."
- "Hit Save and the agency won't offer jobs on days this teacher has blocked."
- **[Click "Profile" in the nav.]**

**Profile**

- "At the top of the Profile page, the teacher can see their Compliance Status — whether they're compliant, pending, or expired. This is managed by the agency; in a full build, teachers would upload their DBS and right-to-work documents here for the agency to verify."
- "Below that, Profile and Preferences has three sections."
- "Transport — whether they can drive and their maximum travel distance."
- "Availability — emergency availability, whether they prefer contact the night before, and whether they're willing to do long-term placements."
- "And Role Type — Teacher, TA, or Both."
- "These preferences feed into the ranking. So for example, a teacher who sets a 10-mile max won't be offered a school 15 miles away. Hit Save to update."
- **[Sign out.]**

---

## 5. Closing

- "That's the full walkthrough. We created a request in the School portal, walked through every page of the Agency portal, and covered the Teacher portal — dashboard, jobs, availability, and profile."
- "Everything updates in real time across all three portals. In a full rollout we'd layer on email and SMS notifications for new requests, offers, and confirmations."
- "Thanks for watching — any questions?"

---

## Quick reference

| Role    | Example user                | Nav (in order) |
|--------|-----------------------------|-----------------|
| School | St. Mary's Catholic Primary | Dashboard → New Request → All Requests → History |
| Agency | Sarah Mitchell (Admin)      | Dashboard → Requests → [request] → Teachers → [teacher] → Schools → Bookings → Agents → Settings |
| Teacher | Sarah Johnson              | Desktop: Dashboard → Availability → Jobs → Profile. Mobile: Dashboard → Jobs → Availability → Profile |

**Tip:** Use two browser windows to show the live loop: school creates the request, agency assigns, teacher accepts. Then show the request as **Filled** on the agency request detail and on the school's Dashboard and All Requests.
