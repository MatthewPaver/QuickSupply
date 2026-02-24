# QuickSupply Demo Script — Full Walkthrough

Use this script to narrate a complete demo of **QuickSupply** by Desian Education. It walks through every screen and then **creates one cover request with you step by step** so you see the full journey from submission to assignment.

**Before you start:**  
Run the app with `pnpm dev` and open [http://localhost:3000](http://localhost:3000). To remove any submissions you’ve already made and start with a clean slate, run:

```bash
pnpm db:clear-requests
```

That clears all cover requests, offers, bookings, and related data but keeps schools, teachers, and agents. If you prefer to use pre-seeded demo data (7 sample requests), skip that and run `pnpm db:seed` after a fresh `pnpm db:migrate` instead.

---

## 1. Introduction

### Landing page

**[Show the landing page.]**

- "This is **QuickSupply** — a supply teaching workforce app from **Desian Education**. It brings **schools**, **supply teachers and TAs**, and the **agency** into one real-time workflow."
- "You’ll see three portals: **School**, **Teacher**, and **Agency**. For the demo we use instant sign-in — no passwords — so we can move quickly."
- **[Click "Sign in with credentials →".]**

### Login page

- "On the **login** page we’ve got demo users by role: **Schools**, **Teachers & TAs**, and **Agency Staff**. Clicking someone signs you in as that person and takes you straight to their dashboard. We’ll go through each portal and then **create a real request together** so you see the full loop."

---

## 2. School Portal — Overview

**[Under "Schools", click e.g. "St. Mary's Catholic Primary".]**

- "I’m in the **School Portal** as St. Mary’s. Up top you see the Desian logo, **QuickSupply**, and the nav: **Dashboard**, **New Request**, and **All Requests**, and **History**. On the right we’ve got the school name and logout."

---

### 2.1 School Dashboard

- "This is the **School Dashboard**. There’s a **New Cover Request** button and three **stat cards**: **Active Requests**, **Filled Today**, and **Total Filled**."
- "**Active Requests** lists anything that’s still open — pending or being offered. Each row shows role, subject, key stage, date, time, and status; emergency requests get an **EMERGENCY** badge. If there’s nothing active, we’ll see an empty state inviting the school to create one."
- "**Recent History** shows the last few completed or cancelled requests, with a **View All** link that goes to **Request History**. Once we’ve created our request and it’s filled, we’ll see it here too."

---

### 2.2 New Cover Request (form only — we’ll submit in Section 2.5)

- "I’ll skip submitting for now — in a moment we’ll **create a request together** and fill in every field. The form has: **date**, **role** (teacher or TA), **subject**, **key stage**, **start and end time**, and an **Emergency request** checkbox that auto-checks when the date is today. There’s optional **Preferred teacher** (teachers who’ve worked at this school before) and **notes**."
- **[Click "All Requests" in the nav.]**

---

### 2.3 School — All Requests

- "**All Requests** lists every cover request for this school, newest first. Each row shows role, subject, key stage, date, time range, and status; emergency ones get an **EMERGENCY** badge."
- "If a request is **Filled** and had a preferred teacher, we show who was assigned; otherwise it says ‘Cover Arranged’. Notes appear at the bottom of the row. Clicking a row doesn’t open a detail page — the agency is the one that opens individual requests to assign teachers."
- **[Click History in the nav, or View All from the Recent History section on the Dashboard.]**

---

### 2.4 School — Request History

- "**Request History** is for **past** requests only — status Filled or Cancelled. We see role, subject, key stage, date, time, and who covered it. Gives the school a clear record; in a full product they could add things like star ratings for the teacher here."
- **[Go back to the login page via the logout icon.]**

---

## 3. Creating a request together (end-to-end)

Do this **after** you’ve run `pnpm db:clear-requests` so there are no existing submissions. We’ll do every step so nothing is missed.

### 3.1 Sign in as the school

- "Let’s create a real request from start to finish. First, sign in as a school."
- **[On the login page, under "Schools", click "St. Mary's Catholic Primary".]**
- "We’re now in the School Portal as St. Mary’s."

### 3.2 Open the form

- **[In the nav, click "New Request".]**
- "This is the **New Cover Request** form. We’ll fill it in together."

### 3.3 Fill in the form (every field)

- **Date:** "Pick a **date** in the calendar — e.g. tomorrow or a future weekday. If you pick **today**, the **Emergency request** checkbox will auto-check and a red note will appear about the shorter response window."
- **Emergency:** "You can tick or untick **Emergency request** anytime — it’s the one that says ‘shorter response window’. For this demo we can leave it unchecked if we chose a future date."
- **Role:** "In **Role Needed**, choose **Teacher** or **Teaching Assistant** — e.g. **Teacher**."
- **Key Stage:** "Pick a **Key Stage** — e.g. **KS2**."
- **Subject:** "If you chose Teacher, **Subject** appears — pick one, e.g. **Maths**."
- **Times:** "Set **Start time** and **End time** — e.g. 08:30 and 15:30."
- **Preferred teacher (optional):** "If the school has had supply staff before, **Request Previous Teacher** shows a list; we can tap one to prefer them or leave it blank."
- **Notes (optional):** "In **Additional Notes** we can add anything the agency or teacher should know — e.g. ‘Year 4, curriculum pack in staffroom’."

### 3.4 Submit

- "When everything looks good, click **Submit Cover Request** at the bottom."
- "The app will take us to **All Requests** and refresh. Our new request appears at the top with status **Pending**."

### 3.5 Confirm it’s visible

- "**All Requests** — our new request is at the top. We can see role, subject, key stage, date, times, and **Pending**."
- **[Click "Dashboard" in the nav.]**
- "On the **Dashboard**, the **Active Requests** section now shows our request. So the school has done their bit — the ball is with the agency."

### 3.6 What happens next (and notifications)

- "In the **full product**, this is where we’d plug in **notifications**. For example: when a request comes in, the **agency** could get an **email** or **SMS** so they know to open the app. When the agency offers the job to a **teacher**, we could **email** or **text** them with the school, date, and time and a link to accept or decline. When the teacher **accepts**, the **school** could get an email or SMS: ‘Cover confirmed — Sarah Johnson, Maths, 25 Feb.’ Right now this is a **demo**, so we’re not actually sending emails or texts — everything is real-time in the app. But the flow and data are all there; in production you’d hook in your preferred provider — e.g. SendGrid or Twilio — and optionally add in-app notifications too."
- "Next we’ll switch to the **Agency** side to assign a teacher to this request, then to the **Teacher** to accept. So keep this tab or remember we’re signed in as St. Mary’s; we’ll come back to the school view at the end."

---

## 4. Agency Portal — Every Screen

**[From the login page, under "Agency Staff", click e.g. "Sarah Mitchell (Admin)".]**

- "I’m now in the **Agency Portal**. On desktop you see a **sidebar**: Dashboard, Requests, Teachers, Schools, Bookings, Agents, Settings. On a small screen that becomes a **menu** behind the hamburger icon."

---

### 4.1 Agency Dashboard

- "The **Agency Dashboard** is the command centre. Four **stat cards**: **Pending**, **Being Offered**, **Filled Today**, and **Emergencies**. **Active Requests** lists what needs action — including the request we just created — with school name, role, subject, key stage, date and time. If something’s being offered we see ‘Offering to: [Teacher name]’. Each row is clickable and goes to the request detail. Below that, **Teachers** and **Schools** cards give quick numbers."
- **[Click "Requests" in the sidebar.]**

---

### 4.2 Agency — Requests (list)

- "**Requests** is the full list from **all** schools, newest first. We should see our new request at the top — school name, role, subject, key stage, date, time, status. Emergency requests show an **EMERGENCY** badge."
- **[Click the row for the request we created.]**

---

### 4.3 Agency — Request detail (assignment)

- "This is the **request detail** page. At the top: **school name**, **status** badge, and **EMERGENCY** if we marked it emergency. **Request Details** (left) shows date, role, subject, key stage, times, and notes; the **EMERGENCY** badge at the top indicates emergency requests."
- "**Offer history** lists everyone we’ve offered this request to — order, name, status, timestamps. If it’s **filled**, we see **Current Booking** with who’s assigned and their phone; the **Assignment** panel shows **Cancel Booking** (with a warning that the school won’t be notified — you’d call the teacher). If it’s **pending** or **offering**, the **Assignment** panel shows **Eligible Teachers**: a ranked list with **score**, **distance**, agency rating, school review when available, **Preferred** and **Previous** badges, compliance, and **Assign** and **phone** actions. We can **Start Sequential Offering** so the system offers to one teacher at a time with a countdown, or **manually assign** someone. The teacher then sees the offer on their **Jobs** page and can accept or decline; if they decline or time runs out, we move to the next. We can also cancel the request from here."
- "**Phone links** on each teacher row are there so the agency can call them if needed — in a full system we could add one-tap **SMS** or **email** from this screen too."
- "To **complete the loop**: click **Start Sequential Offering** (or **Assign** on one teacher). Sign out, sign in as that teacher, open **Jobs**, and click **Accept**. Then check the agency request again — status **Filled**, **Booking** visible — and the school **Dashboard** and **All Requests** to see the request filled and who was assigned."
- **[If you’re only touring screens, go back to "Requests" then "Teachers".]**

---

### 4.4 Agency — Teachers

- "**Teachers & TAs** lists everyone: initials, name, role type, agency rating, postcode, drive, **Emergency OK**. Each row has a **phone** link and a **compliance** badge. Clicking a row opens their **profile**."
- **[Click one teacher.]**

---

### 4.5 Agency — Teacher detail

- "**Teacher detail**: name, compliance, **phone** link and **email**, postcode, role type, and badges — can drive, emergency available, contact night before only, long-term willing. **Assigned agent** (shown as ’Agent: …’) is who looks after them. We’ve got **Weekly availability**, **Blacklisted schools**, **Recent bookings**, and **School reviews**. So the agency can decide who to offer the job to and whether they’re eligible."
- **[Click "Schools" in the sidebar.]**

---

### 4.6 Agency — Schools

- "**Schools** lists every school — name, postcode, contact name, **phone** link, and how many **requests** they’ve ever submitted. Handy to see who uses the system most."
- **[Click "Bookings".]**

---

### 4.7 Agency — Bookings

- "**Bookings** is the list of **confirmed** bookings: school, teacher, role, subject, key stage, date, time; status **Confirmed** or **Cancelled**. Once our request is filled, it’ll show up here."
- **[Click "Agents", then "Settings".]**

---

### 4.8 Agency — Agents & Settings

- "**Agents** shows agency staff, who’s admin, and which teachers are assigned to whom. **Settings** is where we set **response windows** — how long a teacher has to respond. **Morning / Emergency** is for same-day or emergency (e.g. 7 minutes); **Next Day / Standard** for advance requests (e.g. 60 minutes). Changing the numbers and clicking **Save Settings** updates the countdown the teacher sees on their Jobs page."
- **[Sign out and return to the login page.]**

---

## 5. Teacher Portal — Every Screen

**[Under "Teachers & TAs", click e.g. "Sarah Johnson".]**

- "**Teacher Portal**: header with logo and, on desktop, Dashboard, Availability, Jobs, Profile. On mobile there’s a **bottom nav** with the same four sections."

---

### 5.1 Teacher Dashboard

- "The **Teacher Dashboard** welcomes them by first name and shows **emergency available** or **standard availability**. If they have an **active offer**, a card at the top shows the school, date, time, role and a link to **Jobs** to accept or decline — with an URGENT badge and expiry if it’s emergency. **Today** shows today’s assignment if they have one; **Upcoming Bookings** lists future dates. Empty states guide them to Job Offers if there’s nothing yet."
- **[Click "Jobs".]**

---

### 5.2 Teacher — Jobs

- "**Jobs** is where teachers see and respond to offers. Each **pending offer** is in a card: school name, date, role, subject, key stage, time, and an **URGENT** badge if it’s emergency. There’s a **countdown** and two buttons: **Accept** and **Decline**. Accepting creates the booking and fills the request; declining lets the agency offer to the next person. **Offer History** lists past offers and outcomes. Again — in a full build we’d notify them by **email** or **phone** when a new offer lands so they don’t have to keep the app open."
- **[Click "Availability", then "Profile".]**

---

### 5.3 Teacher — Availability & Profile

- "**Availability**: recurring weekday toggles and a calendar for specific unavailable dates. **Profile** holds transport (can drive, max distance), emergency available, contact night before only, long-term willing, and role type. The agency uses this for ranking and offering."
- **[Sign out.]**

---

## 6. Closing

- "That’s **every screen** in QuickSupply: **School** — dashboard, new request, all requests, history; **Agency** — dashboard, requests, request detail with assignment, teachers, teacher detail, schools, bookings, agents, settings; **Teacher** — dashboard, jobs, availability, profile. We’ve also **created a request together** and seen where it appears and how the agency would assign and the teacher would accept."
- "In a **full rollout** we’d add **notifications** — email and SMS for new requests, new offers, and confirmations — and optionally in-app alerts. This demo keeps everything in-app and real-time so we can show the flow without external dependencies. QuickSupply is built with **Next.js**, **SQLite**, and **server-sent events**, and is branded for **Desian Education**."
- "Thanks for watching. Any questions?"

---

## Quick reference

| Role    | Example user                | Main nav |
|--------|-----------------------------|----------|
| School | St. Mary's Catholic Primary | Dashboard, New Request, All Requests, History |
| Agency | Sarah Mitchell (Admin)      | Dashboard, Requests, Teachers, Schools, Bookings, Agents, Settings |
| Teacher | Sarah Johnson              | Dashboard, Jobs, Availability, Profile |

**Tip:** Use two browser windows to show the flow live — school creates the request, then agency assigns, then teacher accepts. After the teacher accepts, flip back to the agency request detail (status **Filled**, **Booking** visible) and to the school Dashboard and All Requests to show the updated status.
