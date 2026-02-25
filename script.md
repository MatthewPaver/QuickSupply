# QuickSupply Demo Script — Full Walkthrough

Use this script to narrate a complete demo of **QuickSupply** by Desian Education. The demo runs in one pass: you **create a cover request** in the School portal, then walk through the **Agency** portal (where that request appears and can be assigned), then the **Teacher** portal. Each portal is covered in **nav order** so you always know what to click next.

**Before you start**

1. Run the app: `pnpm dev` and open [http://localhost:3000](http://localhost:3000).
2. For a clean slate (no existing requests), run:
   ```bash
   pnpm db:clear-requests
   ```
   That clears all cover requests, offers, and bookings but keeps schools, teachers, and agents.
3. **Optional — show "Request Previous Teacher" with data:** After `pnpm db:clear-requests`, run `pnpm db:seed-demo`. That adds one past filled request and booking so St. Mary's has one previous teacher on the form. If you skip this, the **Request Previous Teacher** section still appears with an empty-state message.
4. To use pre-seeded data (7 sample requests) instead, run `pnpm db:migrate` then `pnpm db:seed` and skip the "create a request" steps.

---

## 1. Introduction

**[Show the landing page.]**

- "This is **QuickSupply** — a supply teaching workforce app from **Desian Education**. It connects **schools**, **supply teachers and TAs**, and the **agency** in one real-time workflow."
- "There are three portals: **School**, **Teacher**, and **Agency**. We use instant sign-in for the demo — no passwords."
- **[Click "Sign in with credentials →".]**

**[On the login page.]**

- "Demo users are grouped by role: **Schools**, **Teachers & TAs**, and **Agency Staff**. Clicking a user signs you in and takes you to their dashboard. We’ll create a request as a school, then go through the Agency and Teacher portals in order."

---

## 2. School Portal — Create a Request

**[Under "Schools", click "St. Mary's Catholic Primary".]**

- "I’m in the **School Portal** as St. Mary’s. The nav has **Dashboard**, **New Request**, **All Requests**, and **History**; on the right, the school name and logout."

**Dashboard (brief)**

- "The **Dashboard** shows three stat cards — **Active Requests**, **Filled Today**, **Total Filled** — and a **New Cover Request** button. **Active Requests** lists open requests; **Recent History** shows the last few completed or cancelled, with **View All** going to Request History. With a clean DB there’s nothing here yet."
- **[Click "New Request" in the nav.]**

**New Cover Request — fill and submit**

- "This is the **New Cover Request** form. We’ll fill it in and submit so we have one request to follow through Agency and Teacher."
- **Date:** "Pick a **date** — e.g. tomorrow or another future weekday. If you pick **today**, the **Emergency request** checkbox auto-checks and a red note appears about the shorter response window."
- **Emergency:** "You can tick or untick **Emergency request** anytime. For this run we can leave it unchecked if the date is in the future."
- **Role:** "Choose **Role Needed** — **Teacher** or **Teaching Assistant** (e.g. Teacher)."
- **Year group:** "Pick a **Year group** (e.g. Year 4). Primary only: EYFS and Years 1–6."
- **Times:** "Set **Start time** and **End time** (e.g. 08:30–15:30)."
- **Optional:** "**Request Previous Teacher** is always shown. If the school has had cover through QuickSupply before, those teachers appear here; otherwise we see a short message that they’ll appear after cover is arranged. We can leave it blank or, if you ran **pnpm db:seed-demo**, pick the one teacher shown. **Additional Notes** is for anything the agency or teacher should know."
- "Click **Submit Cover Request**. The app takes us to **All Requests**; our new request appears at the top with status **Pending**."

**Confirm on School**

- "On **All Requests** we see the new row: role, year group, date, times, **Pending**. Emergency requests would show an **EMERGENCY** badge; filled ones show who was assigned or ‘Cover Arranged’ and notes if any."
- **[Click "Dashboard" in the nav.]**
- "On the **Dashboard**, **Active Requests** now shows our request. The school side is done; the agency will assign a teacher."
- "In a **full product** we’d add **notifications** — email or SMS to the agency when a request lands, to the teacher when they’re offered the job, and to the school when cover is confirmed. This demo is in-app only; the flow is ready for you to plug in e.g. SendGrid or Twilio."
- **[Click the logout icon to return to the login page.]**

---

## 3. Agency Portal — In Nav Order

**[Under "Agency Staff", click "Sarah Mitchell (Admin)".]**

- "I’m in the **Agency Portal**. On desktop the **sidebar** has: Dashboard, Requests, Teachers, Schools, Bookings, Agents, Settings. On small screens it’s a **menu** behind the hamburger icon. We’ll go through each in order."

**Dashboard**

- "The **Agency Dashboard** has four stat cards: **Pending**, **Being Offered**, **Filled Today**, and **Emergencies**. **Active Requests** lists what needs action — our new request is here — with school name, role, year group, date and time. If something’s being offered we see ‘Offering to: [Teacher name]’. Each row is clickable."
- **[Click "Requests" in the sidebar.]**

**Requests (list)**

- "**Requests** is the full list from all schools, newest first. Our request is at the top with school name, role, year group, date, time, status. Emergency requests show an **EMERGENCY** badge."
- **[Click the row for the request we created.]**

**Request detail (assignment)**

- "This is the **request detail** page. At the top: **school name**, **status** badge, and **EMERGENCY** if it’s an emergency. **Request Details** (left) shows date, role, year group, times, and notes."
- "**Offer history** lists everyone we’ve offered this request to — order, name, status, timestamps. If the request is **filled**, we see **Current Booking** with who’s assigned and their phone; the **Assignment** panel shows **Cancel Booking** (with a warning that the school won’t be notified). If it’s **pending** or **offering**, the **Assignment** panel shows **Eligible Teachers**: a ranked list with score, distance, agency rating, school review when available, **Preferred** and **Previous** badges, compliance, and **Assign** and **phone** actions. We can **Start Sequential Offering** (one teacher at a time with a countdown) or **manually assign**. Phone links let the agency call teachers; in production you could add one-tap SMS or email."
- "To **complete the loop** later: click **Start Sequential Offering** or **Assign** on one teacher, then sign in as that teacher, open **Jobs**, and **Accept**. Then the request shows **Filled** here and on the school’s Dashboard and All Requests."
- **[Click "Teachers" in the sidebar.]**

**Teachers**

- "**Teachers & TAs** lists everyone: initials, name, role type, agency rating, postcode, drive, **Emergency OK**, **phone** link, and **compliance** badge. Clicking a row opens their profile."
- **[Click one teacher.]**

**Teacher detail**

- "**Teacher detail**: name, compliance, **phone** link and **email**, postcode, role type, and badges — can drive, emergency available, contact night before only, long-term willing. **Assigned agent** (shown as ‘Agent: …’) looks after them. **Weekly availability**, **Blacklisted schools**, **Recent bookings**, and **School reviews** help the agency decide who to offer jobs to."
- **[Click "Schools" in the sidebar.]**

**Schools**

- "**Schools** lists every school: name, postcode, contact name, **phone** link, and how many **requests** they’ve ever submitted."
- **[Click "Bookings".]**

**Bookings**

- "**Bookings** lists **confirmed** bookings: school, teacher, role, year group, date, time; status **Confirmed** or **Cancelled**. Once our request is filled it appears here."
- **[Click "Agents".]**

**Agents**

- "**Agents** shows agency staff: name, **Admin** badge, email, and how many **teachers** are assigned to each, with their names."
- **[Click "Settings".]**

**Settings**

- "**Settings**: **response windows** — how long a teacher has to respond. **Morning / Emergency** (e.g. 7 minutes) for same-day or emergency; **Next Day / Standard** (e.g. 60 minutes) for advance requests. **Save Settings** updates the countdown teachers see on their Jobs page."
- **[Sign out and return to the login page.]**

---

## 4. Teacher Portal — In Nav Order

**[Under "Teachers & TAs", click e.g. "Sarah Johnson".]**

- "**Teacher Portal**: on desktop the nav is Dashboard, Availability, Jobs, Profile; on mobile a **bottom nav** with the same four. We’ll go through in order."

**Dashboard**

- "The **Teacher Dashboard** welcomes them by first name and shows **emergency available** or **standard availability**. If they have an **active offer**, a card at the top shows the school, date, time, role and a link to **Jobs** (with URGENT badge and expiry if emergency). **Today** shows today’s assignment if any; **Upcoming Bookings** lists future dates. Empty states point them to Job Offers if there’s nothing yet."
- **[Click "Jobs" in the nav.]**

**Jobs**

- "**Jobs** is where teachers see and respond to offers. Each **pending offer** is in a card: school name, date, role, year group, time, **URGENT** badge if emergency, **countdown**, and **Accept** / **Decline**. Accepting fills the request; declining lets the agency offer to the next. **Offer History** lists past offers and outcomes. In a full build we’d notify by email or phone when a new offer lands."
- **[Click "Availability" in the nav.]**

**Availability**

- "**Availability**: **recurring** weekday toggles and a **calendar** for specific unavailable dates. **Save** persists changes. The agency uses this so we don’t offer them days they’ve blocked."
- **[Click "Profile" in the nav.]**

**Profile**

- "**Profile & Preferences**: **Transport** (can drive, max distance), **Availability** (emergency available, contact night before only, long-term willing), **Role type** (Teacher, TA, Both). The agency uses this for ranking and offering. **Save** updates the profile."
- **[Sign out.]**

---

## 5. Closing

- "That’s the full demo: we **created a request** in the School portal, then walked the **Agency** portal in nav order — dashboard, requests, request detail with assignment, teachers, teacher detail, schools, bookings, agents, settings — and the **Teacher** portal — dashboard, jobs, availability, profile. In a full rollout we’d add **notifications** (email/SMS for new requests, offers, and confirmations). QuickSupply is built with **Next.js**, **SQLite**, and **server-sent events**, and is branded for **Desian Education**."
- "Thanks for watching. Any questions?"

---

## Quick reference

| Role    | Example user                | Nav (in order) |
|--------|-----------------------------|-----------------|
| School | St. Mary's Catholic Primary | Dashboard → New Request → All Requests → History |
| Agency | Sarah Mitchell (Admin)      | Dashboard → Requests → [request] → Teachers → [teacher] → Schools → Bookings → Agents → Settings |
| Teacher | Sarah Johnson              | Dashboard → Jobs → Availability → Profile |

**Tip:** Use two browser windows to show the live loop: school creates the request, agency assigns, teacher accepts. Then show the request as **Filled** on the agency request detail and on the school Dashboard and All Requests.
