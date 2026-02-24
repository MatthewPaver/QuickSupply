# QuickSupply Demo Script

Use this script to narrate a live demo of QuickSupply by Desian Education. Run the app with `pnpm dev` and open [http://localhost:3000](http://localhost:3000). Demo data is pre-seeded: 5 schools, 12 teachers/TAs, 3 agency staff, and 7 cover requests in various states.

---

## 1. Introduction (Landing Page)

**[Show the landing page.]**

- "This is **QuickSupply** — a supply teaching workforce scheduling app by **Desian Education**."
- "It connects **schools**, **supply teachers and TAs**, and the **agency** in one real-time workflow."
- "There are three portals: **School**, **Teacher**, and **Agency**. For the demo we use instant sign-in — no passwords."
- **[Click "Sign in with credentials →"]** "I’ll sign in as different users to show each side of the flow."

---

## 2. School Portal

**[On the login page, under "Schools", click e.g. "St. Mary's Catholic Primary".]**

- "I’m now in the **School Portal** as St. Mary’s. Schools use this to request cover and track status."

**[School Dashboard]**

- "The dashboard shows **active requests**, **filled today**, and **total filled**. There’s a quick link to create a **New Cover Request**."
- "The **Active Requests** list shows anything pending or currently being offered by the agency. **Recent History** shows completed or cancelled requests."
- If the list is empty: "We’ve got an empty state here — the app tells the user to create a cover request to get started."

**[Optional: New Cover Request]**

- **[Click "New Request" in the nav or "New Cover Request" on the dashboard.]**
- "To request cover, the school picks the **date**, **role** — teacher or TA — **subject**, **key stage**, and **times**. They can mark it as **emergency** and add **notes**."
- "They can also request a **preferred teacher** from a list of people who’ve worked at the school before."
- **[Submit the form or skip and go to "All Requests".]**

**[All Requests]**

- **[Click "All Requests".]** "Here are all of this school’s requests. Each row shows role, date, time, status — Pending, Offering, Filled, or Cancelled — and for filled requests, who was assigned."
- "Next we’ll see how the agency handles one of these requests."

**[Sign out: click the logout icon and return to the login page.]**

---

## 3. Agency Dashboard

**[On the login page, under "Agency Staff", click e.g. "Sarah Mitchell (Admin)".]**

- "I’m now in the **Agency Dashboard**. This is the command centre: all requests, assignments, and overrides happen here."

**[Agency Dashboard]**

- "The top cards show **Pending** requests, ones **Being Offered**, **Filled Today**, and any **Emergencies**."
- "The **Active Requests** list shows requests that need action. Clicking a row opens the **request detail** page where we assign teachers."
- If there are no active requests: "The empty state explains that when schools submit requests they’ll appear here, and we can manage them from the Requests page."

**[Requests List]**

- **[Click "Requests" in the sidebar.]** "This is the full list of cover requests from all schools, with status and details."
- **[Click one request that is Pending or Offering.]** "I’ll open this request to show the assignment panel."

**[Request Detail & Assignment]**

- "At the top we see the **school**, **status**, and whether it’s an **emergency**. Below are **request details** — date, role, subject, times — and any **offer history**."
- "The **Assignment** panel is where we fill the request. We can **Start sequential offering** — the system ranks eligible teachers and offers to one at a time — or **manually assign** a specific teacher."
- "When we start offering, the chosen teacher gets an offer with a **countdown**; if they don’t respond in time, the engine moves to the next teacher. We can also **withdraw** or **cancel** from here."
- **[Optionally start offering or manually assign to show the flow.]** "Once a teacher accepts, the status becomes Filled and the school and teacher both see the booking."
- "On smaller screens the sidebar becomes a **menu** so the dashboard is still usable on a tablet or laptop."

**[Optional: Teachers & Schools]**

- **[Click "Teachers".]** "Agency staff can see all registered teachers and TAs — compliance status, contact details, and a link to their profile."
- **[Click "Schools".]** "Schools are listed here for reference. The main workflow is request → assign → accept/decline."

**[Sign out and return to login.]**

---

## 4. Teacher Portal

**[On the login page, under "Teachers & TAs", click e.g. "Sarah Johnson".]**

- "I’m now in the **Teacher Portal** as a supply teacher. Teachers use this to manage **availability**, see **job offers**, and **accept or decline** with a countdown."

**[Teacher Dashboard]**

- "If there’s an **active job offer**, it’s highlighted at the top with a link to the **Jobs** page to respond."
- "**Today** shows today’s assignment if they have one. **Upcoming Bookings** lists future dates. Empty states explain that accepted offers will show up here."

**[Jobs Page]**

- **[Click "Jobs" in the nav — or use the bottom nav on mobile.]** "On the **Jobs** page, **pending offers** appear with full details: school, date, role, subject, key stage, and time. There’s a **countdown** showing how long they have to respond."
- "They can **Accept** or **Decline**. Accepting creates a booking and the request is filled; declining lets the agency move to the next teacher in the sequence."
- "**Offer History** lists past offers and their outcome — accepted, declined, or expired."
- "The teacher portal is **mobile-friendly**: on phones there’s a **bottom navigation bar** so Jobs, Dashboard, Availability, and Profile are easy to reach with one thumb."

**[Availability & Profile]**

- **[Click "Availability".]** "Teachers set when they’re available so the agency only offers them suitable days."
- **[Click "Profile".]** "Profile holds their details and preferences. The demo uses pre-seeded data for all of this."

**[Sign out.]**

---

## 5. Closing

- "That’s the full loop: **school** submits a request, **agency** assigns via sequential offering or manual assign, **teacher** accepts or declines with a countdown. QuickSupply keeps everything in sync so schools get cover and teachers get clear, time-bound offers."
- "The app is built with **Next.js**, **SQLite**, and **server-sent events** for real-time updates, and it’s branded for **Desian Education** — the trusted education recruitment partner."
- "Thank you. Any questions?"

---

## Quick reference: Demo logins

| Role    | Example user                    | Use case                          |
|---------|----------------------------------|-----------------------------------|
| School  | St. Mary's Catholic Primary     | Dashboard, new request, all requests |
| Agency  | Sarah Mitchell (Admin)          | Dashboard, requests, assign teacher  |
| Teacher | Sarah Johnson                   | Dashboard, jobs, accept/decline     |

**Tip:** Use two browser windows or devices to show school + agency, or agency + teacher, at the same time (e.g. school submits, agency assigns, teacher sees offer and accepts).
