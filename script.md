# QuickSupply Demo Script — Full Walkthrough

Use this script to narrate a complete demo of QuickSupply by Desian Education. Run the app with `pnpm dev` and open [http://localhost:3000](http://localhost:3000). Demo data is pre-seeded: 5 schools, 12 teachers/TAs, 3 agency staff, and 7 cover requests in various states.

---

## 1. Introduction

### Landing page

**[Show the landing page.]**

- "This is **QuickSupply** — a supply teaching workforce scheduling app by **Desian Education**."
- "It connects **schools**, **supply teachers and TAs**, and the **agency** in one real-time workflow."
- "You see three portals: **School Portal**, **Teacher Portal**, and **Agency Dashboard**. Each has a short description. For the demo we use instant sign-in — no passwords."
- **[Click "Sign in with credentials →".]**

### Login page

- "On the **login** page we have demo users grouped by role: **Schools**, **Teachers & TAs**, and **Agency Staff**."
- "Clicking any user signs you in as that person and takes you straight to their dashboard. I’ll go through each portal and every screen so you see the full product."

---

## 2. School Portal — Every Screen

**[Under "Schools", click e.g. "St. Mary's Catholic Primary".]**

- "I’m now in the **School Portal** as St. Mary’s. The header shows the Desian logo, **QuickSupply**, and the main nav: **Dashboard**, **New Request**, and **All Requests**. On the right we see the school name and the logout icon."

---

### 2.1 School Dashboard

- "This is the **School Dashboard**. At the top we have the school name and a **New Cover Request** button."
- "The three **stat cards** show: **Active Requests** — anything pending or currently being offered; **Filled Today** — requests filled for today’s date; and **Total Filled** — all time."
- "The **Active Requests** section lists every request that’s still open. Each row shows role, subject, key stage, date, time, and whether it’s an emergency. The **status badge** can be Pending, Offering, Filled, or Cancelled. If there are no active requests, the empty state tells the user to create one."
- "**Recent History** shows the last few completed or cancelled requests, with a **View All** link. If there’s no history yet, it says so."
- **[Click "New Request" in the nav.]**

---

### 2.2 New Cover Request

- "This is the **New Cover Request** form. The school selects: **date**, **role** — teacher or TA — **subject**, **key stage**, **start and end time**. They can tick **Emergency** for same-day or urgent cover and add **notes**."
- "There’s an optional **Preferred teacher** dropdown — it lists teachers who’ve worked at this school before. The agency can try to assign them first."
- "Submitting creates the request and it appears on the dashboard and on All Requests. I won’t submit now; we’ll use existing data."
- **[Click "All Requests" in the nav.]**

---

### 2.3 School — All Requests

- "**All Requests** lists every cover request for this school, newest first. Each row shows role, subject, key stage, date, full time range, and status. For **emergency** requests there’s an EMERGENCY badge."
- "If a request is **Filled** and had a preferred teacher, we show who was assigned. If it was filled by the agency without a preference, it says ‘Cover Arranged’. Any notes appear at the bottom of the row."
- "Clicking a row doesn’t go to a detail page in the school portal — the main action for schools is here and on the dashboard. The agency is the one that opens individual requests to assign teachers."
- **[Click "Dashboard" then "History" in the nav — or use the link if visible.]**

---

### 2.4 School — Request History

- "**Request History** shows only **past** requests: status **Filled** or **Cancelled**. For each we see role, subject, key stage, date, time, and who covered it when it was filled. The status badge is on the right."
- "This gives the school a clear record of what was requested and the outcome. In a future version they could leave a star rating here for the teacher."
- **[Click the logout icon to return to the login page.]**

---

## 3. Agency Portal — Every Screen

**[Under "Agency Staff", click e.g. "Sarah Mitchell (Admin)".]**

- "I’m now in the **Agency Portal**. On desktop you see a **sidebar** with: Dashboard, Requests, Teachers, Schools, Bookings, Agents, and Settings. At the bottom we have the logged-in user and **Sign Out**. On a small screen the sidebar becomes a **menu** you open with the hamburger icon."

---

### 3.1 Agency Dashboard

- "The **Agency Dashboard** is the command centre. The **four stat cards** are: **Pending** — requests waiting to be worked; **Being Offered** — currently out to a teacher; **Filled Today**; and **Emergencies** — open requests marked emergency."
- "**Active Requests** lists the requests that need action — pending or being offered — with school name, role, subject, key stage, date and time. If one is currently being offered, we see ‘Offering to: [Teacher name]’. Each row is clickable and goes to the request detail page. If there are no active requests, the empty state explains that and links to Requests."
- "Below that, **Teachers** and **Schools** cards give quick numbers: total teachers, compliant vs pending vs expired compliance; total schools and active requests today."
- **[Click "Requests" in the sidebar.]**

---

### 3.2 Agency — Requests (list)

- "**Requests** is the full list of **all** cover requests from **all** schools, newest first. Each row shows: **school name**; EMERGENCY badge if applicable; **role**, subject, key stage; **date** and **time**; and **status**. If there’s a pending offer, we see ‘Offering to: [Teacher name]’."
- "Clicking a row takes us to the **request detail** page where we assign teachers or manage the booking."
- **[Click one request that is Pending or Offering.]**

---

### 3.3 Agency — Request detail (assignment)

- "This is the **request detail** page. At the top we have the **school name**, the **status** badge, and an EMERGENCY badge if it’s an emergency request."
- "**Request Details** (left) shows date, role, subject, key stage, start and end time, emergency flag, and notes."
- "**Offer history** lists every teacher we’ve offered this request to: order, name, status — pending, accepted, declined, expired, withdrawn — and timestamps. That’s the audit trail for this request."
- "If the request is **filled**, we see **Booking** info: who’s assigned and when it was confirmed, plus a **Cancel Booking** button with a warning that the school won’t be notified automatically."
- "If it’s **pending** or **offering**, the **Assignment** panel shows **Eligible Teachers**: a ranked list with score, distance, school review average, whether they’re preferred or have worked at the school before, compliance, and **Assign** and **phone** actions. We can **Start Sequential Offering** so the system offers to one teacher at a time with a countdown, or **manually assign** someone. Once we start offering, the teacher sees the offer on their Jobs page and can accept or decline; if they decline or time runs out, the engine moves to the next. We can also cancel the request from here."
- **[Go back to the list: click "Requests" in the sidebar, then "Teachers".]**

---

### 3.4 Agency — Teachers

- "**Teachers & TAs** lists every registered teacher and TA. The header shows how many are registered. Each row has: **initials**, **name**, **role type** (teacher, TA, or both), **agency rating**, **postcode**, whether they **drive**, and **Emergency OK** if they do same-day. On the right we have a **phone** link and a **compliance** badge — Compliant, Pending, or Expired."
- "Clicking a row opens that person’s **profile** so the agency can see availability, blacklist, bookings, and reviews."
- **[Click one teacher.]**

---

### 3.5 Agency — Teacher detail

- "This is the **teacher detail** page. We see their **name**, **compliance** badge, **phone** and **email** links, **postcode**, and **role type**. There are badges for **can drive**, **emergency available**, **contact night before only**, and **long-term willing**. **Assigned agent** shows which agency staff looks after them."
- "**Recurring availability** shows which weekdays they’re usually available. **Blacklisted schools** lists any schools they won’t work at and the reason. **Recent bookings** shows past work — school, date, role, subject. **School reviews** shows star ratings from schools and an average if we have any."
- "This helps the agency decide who to offer a request to and whether they’re eligible for a given school and date."
- **[Click "Schools" in the sidebar.]**

---

### 3.6 Agency — Schools

- "**Schools** lists every registered school. For each we see: **name**, **postcode**, **contact name**, and a **phone** link. The right column shows how many **requests** that school has ever submitted — useful for seeing who uses the system most."
- "There’s no edit form in the demo; it’s a reference list for the agency."
- **[Click "Bookings" in the sidebar.]**

---

### 3.7 Agency — Bookings

- "**Bookings** lists every **confirmed** booking: school name, teacher name, role, subject, key stage, date, and time. Each row has a status: **Confirmed** (green) or **Cancelled** (red) if the agency cancelled it later."
- "This is the master list of who’s covering what and when. Cancelled bookings stay in the list so we keep a record."
- **[Click "Agents" in the sidebar.]**

---

### 3.8 Agency — Agents

- "**Agents** shows all **agency staff**. Each card has the agent’s **name**, **Admin** badge if they’re an admin, and **email**. Under that we see how many **teachers are assigned** to them and a list of those teachers’ names."
- "So we can see who’s responsible for which teachers — useful for handover and workload."
- **[Click "Settings" in the sidebar.]**

---

### 3.9 Agency — Settings

- "**Settings** is where we configure **response windows** — how long a teacher has to respond to an offer. **Morning / Emergency (minutes)** is for same-day or emergency requests — typically a short window, e.g. 7 minutes. **Next Day / Standard (minutes)** is for advance requests — e.g. 60 minutes. The labels explain that. We can change the numbers and click **Save Settings**; a toast confirms when it’s saved."
- "These values drive the countdown the teacher sees on their Jobs page."
- **[Sign out and return to the login page.]**

---

## 4. Teacher Portal — Every Screen

**[Under "Teachers & TAs", click e.g. "Sarah Johnson".]**

- "I’m now in the **Teacher Portal**. The header has the logo and, on desktop, **Dashboard**, **Availability**, **Jobs**, and **Profile**. On mobile there’s a **bottom nav bar** with the same four sections so it’s easy to use on a phone."

---

### 4.1 Teacher Dashboard

- "The **Teacher Dashboard** welcomes the teacher by first name and shows whether they’re marked as **emergency available** or **standard availability**."
- "If they have an **active job offer**, a highlighted card appears at the top with the school, date, time, role, and a link to the **Jobs** page to accept or decline. There may be an URGENT badge and an expiry time."
- "**Today** shows today’s assignment if they have one — school, time, role, subject — in a green-highlighted box. If not, it says ‘No assignment today.’"
- "**Upcoming Bookings** lists future dates: school, role, subject, date and time. If there are none, the empty state says accepted offers will show here and links to Job Offers."
- **[Click "Jobs" in the nav.]**

---

### 4.2 Teacher — Jobs

- "The **Jobs** page is where teachers see and respond to offers. At the top we show how many **active offers** they have."
- "Each **pending offer** is in a card: **school name**, full **date**, **role**, **subject**, **key stage**, **time**, and an URGENT badge if it’s emergency. There’s a **countdown** — time remaining to respond — and two big buttons: **Accept** and **Decline**. Accepting creates the booking and fills the request; declining lets the agency offer to the next teacher. If they don’t respond in time, the offer expires and the same thing happens."
- "**Offer History** lists past offers: school, date, role, subject, and outcome — Accepted, Declined, or Expired. So they have a record of what they’ve been offered and what they did."
- **[Click "Availability" in the nav.]**

---

### 4.3 Teacher — Availability

- "**Availability** lets teachers set when they’re available. **Recurring** is a row of weekday toggles — Sun through Sat — so they can say which days they’re normally free. **Specific dates** is a calendar: they can click dates to mark them as unavailable (e.g. appointments, other work). The agency uses this so we don’t offer them days they’ve blocked."
- "**Save** persists the recurring days and the unavailable dates. A toast confirms when it’s saved."
- **[Click "Profile" in the nav.]**

---

### 4.4 Teacher — Profile

- "**Profile & Preferences** holds the teacher’s work preferences. **Transport**: ‘I can drive’ and **max distance** in miles. **Availability**: **Emergency available** (same-day), **Contact night before only**, and **Long-term willing**. **Role type**: Teacher, TA, or Both. Each has a short description. Changing any option and clicking **Save** updates their profile; a toast confirms."
- "The agency uses this when ranking and offering — e.g. distance, emergency availability, and role type all feed into who gets the offer."
- **[Sign out.]**

---

## 5. Closing

- "That’s **every screen** in QuickSupply: **School** — dashboard, new request, all requests, history; **Agency** — dashboard, requests list, request detail with assignment, teachers list and teacher detail, schools, bookings, agents, and settings; **Teacher** — dashboard, jobs, availability, and profile."
- "The flow is: **school** submits a request → **agency** sees it on the dashboard and Requests, opens the request, and either starts sequential offering or manually assigns a **teacher** → the **teacher** sees the offer on Jobs and accepts or declines with a countdown. QuickSupply keeps it all in sync and is built with **Next.js**, **SQLite**, and **server-sent events**, branded for **Desian Education**."
- "Thank you. Any questions?"

---

## Quick reference: Demo logins

| Role   | Example user                | Portal entry        |
|--------|-----------------------------|---------------------|
| School | St. Mary's Catholic Primary | Dashboard, New Request, All Requests, History |
| Agency | Sarah Mitchell (Admin)     | Dashboard, Requests, Teachers, Schools, Bookings, Agents, Settings |
| Teacher | Sarah Johnson             | Dashboard, Jobs, Availability, Profile |

**Tip:** Use two browser windows to show the flow live — e.g. school submits a request, then switch to agency to assign, then to teacher to accept.
