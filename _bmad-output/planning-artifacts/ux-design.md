# QuickSupply UX Design Document

> Supply teaching workforce scheduling platform by Desian Education.
> Three-portal architecture: School, Teacher, Agency.

---

## 1. Design System Overview

### 1.1 Color Palette

QuickSupply uses an OKLCh-based color system aligned with the Desian Education brand (`desian.co.uk`). All color values are defined as CSS custom properties on `:root` using the `oklch()` function for perceptual uniformity.

#### Brand Colors

| Token            | Hex Equivalent | OKLCh Value                    | Usage                                       |
| ---------------- | -------------- | ------------------------------ | ------------------------------------------- |
| `--primary`      | `#4c0673`      | `oklch(0.321 0.156 303.438)`  | CTAs, headings, links, active nav states    |
| `--desian-blue`  | `#1863DC`      | `oklch(0.547 0.215 262.881)`  | Teacher portal accent, secondary elements   |
| `--accent`       | `#c879f1`      | `oklch(0.912 0.082 303.438)`  | Highlights, hover backgrounds, light accents |

#### Semantic Colors

| Token                    | OKLCh Value                    | Usage                                |
| ------------------------ | ------------------------------ | ------------------------------------ |
| `--background`           | `oklch(0.99 0.002 247.858)`   | Page background (near-white)         |
| `--foreground`           | `oklch(0.145 0.005 247.858)`  | Primary text (near-black)            |
| `--card`                 | `oklch(1 0 0)`                | Card surfaces (pure white)           |
| `--muted`                | `oklch(0.96 0.005 247.858)`   | Skeleton fills, disabled backgrounds |
| `--muted-foreground`     | `oklch(0.5 0.01 247.858)`     | Secondary text, captions             |
| `--destructive`          | `oklch(0.577 0.245 27.325)`   | Error states, cancel/delete actions  |
| `--border`               | `oklch(0.922 0.004 247.858)`  | Card borders, dividers               |
| `--input`                | `oklch(0.922 0.004 247.858)`  | Form input borders                   |
| `--ring`                 | `oklch(0.321 0.156 303.438)`  | Focus ring (matches primary)         |

#### Chart Colors (data visualisation)

| Token       | Maps To                        |
| ----------- | ------------------------------ |
| `--chart-1` | Primary purple                 |
| `--chart-2` | Desian blue                    |
| `--chart-3` | Light purple accent            |
| `--chart-4` | `oklch(0.685 0.169 237.323)`  |
| `--chart-5` | `oklch(0.769 0.131 303.438)`  |

#### Sidebar Colors

The sidebar palette mirrors the main palette with slight tonal adjustments:
- `--sidebar`: slightly darker than background (`oklch(0.985 ...)`)
- `--sidebar-primary`, `--sidebar-ring`: match `--primary`
- `--sidebar-accent`: slightly darker than `--accent`
- `--sidebar-border`: matches `--border`

#### StatusBadge Palette

Status badges use Tailwind utility colors (not the theme tokens) for maximum contrast within small badge surfaces:

| Status              | Border       | Background  | Text         | Dot          |
| ------------------- | ------------ | ----------- | ------------ | ------------ |
| pending             | amber-300    | amber-50    | amber-800    | amber-500    |
| offering            | blue-300     | blue-50     | blue-800     | blue-500     |
| filled / accepted / compliant | green-300 | green-50 | green-800  | green-500    |
| cancelled / declined / expired-compliance | rose-300 | rose-50 | rose-800 | rose-500 |
| expired / withdrawn | slate-300    | slate-100   | slate-700    | slate-500    |

### 1.2 Typography

**Font Stack:** Geist Sans (loaded via `next/font` as `--font-geist-sans`), falling back to `"Geist", "Avenir Next", "Segoe UI", sans-serif`. Monospace uses `--font-geist-mono`.

#### Type Scale

| Level             | Tailwind Classes                           | Usage                                    |
| ----------------- | ------------------------------------------ | ---------------------------------------- |
| Page title        | `text-3xl font-bold tracking-tight` (sm: `text-4xl`) | Landing page hero heading          |
| Section heading   | `text-base font-semibold` or CardTitle     | Card titles, panel headers               |
| Body              | `text-sm`                                  | Default paragraph, form labels           |
| Caption / helper  | `text-xs text-muted-foreground`            | Helper text, timestamps, descriptions    |
| Micro label       | `text-[11px] font-semibold uppercase tracking-wider` | Section labels ("Operations", "New", "Earlier") |
| Badge text        | `text-[11px] font-semibold`                | StatusBadge labels                       |
| Notification count| `text-[10px] font-bold`                    | Bell badge counter                       |

### 1.3 Spacing Scale

Tailwind CSS v4 default spacing scale is used throughout. Key recurring spacings:

- **gap-1.5 / gap-2**: Navigation button spacing, inline element gaps
- **gap-3 / gap-4**: Card content padding, grid gaps
- **gap-6**: Section vertical spacing (`space-y-6`)
- **px-4 py-4** (sm: `py-6`): Main content area padding
- **p-3**: Sidebar nav padding, compact card content
- **py-10 px-6**: Empty state generous padding

### 1.4 Border Radius

Base radius: `--radius: 0.625rem` (10px)

| Token         | Calculation              | Computed  | Usage                        |
| ------------- | ------------------------ | --------- | ---------------------------- |
| `--radius-sm` | `var(--radius) - 4px`    | 6px       | Small badges, compact inputs |
| `--radius-md` | `var(--radius) - 2px`    | 8px       | Buttons (via `rounded-md`)   |
| `--radius-lg` | `var(--radius)`          | 10px      | Cards, dialogs               |
| `--radius-xl` | `var(--radius) + 4px`    | 14px      | Landing page cards (`rounded-xl`) |

Additional: StatusBadge uses `rounded-full` for pill shape. Mobile bottom nav items and teacher selection cards use `rounded-lg`.

### 1.5 Shadow System

| Pattern                           | Usage                                          |
| --------------------------------- | ---------------------------------------------- |
| `shadow-xs`                       | Outline button variant default                 |
| `shadow-sm`                       | Active nav link subtle elevation               |
| `shadow-lg`                       | Sticky submit bar, cookie banner               |
| `hover:shadow-lg`                 | Landing page portal cards on hover             |
| `hover:-translate-y-0.5`          | Portal cards lift effect (combined with shadow) |
| Unread notification badge: `shadow` | Small shadow on bell count pill               |

### 1.6 Animation Library

Three custom animations defined in `globals.css`, exposed as Tailwind utilities:

#### `qs-enter` (360ms ease-out)
Fade-rise animation: element fades in while translating up 8px. Used for page-level content entrance.

#### `qs-pop` (280ms ease-out)
Faster variant of fade-rise. Used for cards that appear in sequence (cover request form steps, assignment panel).

#### `qs-live-pulse` (2.4s ease-in-out infinite)
Soft blue box-shadow pulse (`rgba(24, 99, 220, 0.08)` at 6px spread). Applied to StatusBadge in `offering` state to indicate real-time activity.

#### Built-in Animations
- `animate-pulse`: Skeleton loading shimmer, call modal phone icon
- `animate-spin`: Loader2 spinner during async operations
- `animate-in fade-in duration-200`: Skeleton wrapper entrance (Tailwind animate-in)

#### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .qs-enter, .qs-pop, .qs-live-pulse {
    animation: none !important;
  }
}
```

All three custom animations are suppressed for users who prefer reduced motion. Built-in Tailwind `animate-pulse` and `animate-spin` are not explicitly suppressed (Tailwind handles this via its own `motion-reduce:` variant).

---

## 2. Component Library

### 2.1 Base UI Components (shadcn/ui)

All base components live in `src/components/ui/` and follow the shadcn/ui pattern: unstyled Radix primitives wrapped with Tailwind classes via `class-variance-authority` (CVA).

#### Button (`button.tsx`)

Variants:
| Variant       | Appearance                                              |
| ------------- | ------------------------------------------------------- |
| `default`     | Purple background (`bg-primary`), white text            |
| `destructive` | Red background, white text                              |
| `outline`     | Bordered, transparent bg, hover shows accent            |
| `secondary`   | Light gray bg, dark text                                |
| `ghost`       | Transparent, hover shows accent bg                      |
| `link`        | Purple text with underline on hover                     |

Sizes:
| Size       | Height | Notes                                           |
| ---------- | ------ | ----------------------------------------------- |
| `xs`       | h-6    | Compact actions (e.g., filter tags)             |
| `sm`       | h-8    | Navigation links, secondary actions             |
| `default`  | h-9    | Standard form submit                            |
| `lg`       | h-10   | Primary CTAs (cover request submit)             |
| `icon`     | 36x36  | Icon-only buttons (notification bell)           |
| `icon-xs`  | 24x24  | Compact icon buttons                            |
| `icon-sm`  | 32x32  | Nav icon buttons                                |
| `icon-lg`  | 40x40  | Large icon buttons                              |

The `asChild` prop (via Radix Slot) allows wrapping `<Link>` or `<a>` elements while inheriting button styling.

#### Card (`card.tsx`)
Standard card with slots: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. White background, border, rounded corners.

#### Input (`input.tsx`)
Standard text input with border, focus ring matching primary.

#### Textarea (`textarea.tsx`)
Multi-line input. Used with `resize-none` class for review comments. Character count displayed as caption below.

#### Select (`select.tsx`)
Radix-based dropdown select with trigger, content, and items. Used for role selection, year group, filters.

#### Label (`label.tsx`)
Form label with `text-sm font-medium` styling. Automatic error styling via `peer-disabled:` and `aria-invalid:` states.

#### Badge (`badge.tsx`)
Inline label with variant support. StatusBadge wraps this with additional dot indicator and color config.

#### Dialog (`dialog.tsx`)
Modal overlay for confirmations and focused interactions. Uses `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`. Max-width defaults to `sm:max-w-lg`; CallModal narrows to `sm:max-w-xs`.

#### Sheet (`sheet.tsx`)
Slide-out panel used for agency mobile navigation. Opens from left side (`side="left"`) with 64-unit width (`w-64`).

#### Table (`table.tsx`)
Standard HTML table wrapper with consistent padding and border styling.

#### Tabs (`tabs.tsx`)
Radix tabs for switching between content panels.

#### Calendar (`calendar.tsx`)
Date picker used in cover request form. Disables past dates, weekends.

#### DropdownMenu (`dropdown-menu.tsx`)
Used for notification bell dropdown. Content is right-aligned (`align="end"`), max-width `w-96`.

#### Avatar (`avatar.tsx`)
User avatar with fallback. Used in teacher rows and ranked teacher items.

#### Separator, Tooltip
Standard utility components for visual dividers and hover tooltips.

#### Sonner Toaster (`sonner.tsx`)
Toast notification system with Desian branding:
- Success toasts: purple background (`--primary`)
- Error toasts: red background (`--destructive`)
- Normal toasts: popover background
- Icons: Lucide icons (CircleCheck, Info, TriangleAlert, OctagonX, Loader2)
- Theme integration: reads from `next-themes` for dark mode readiness

### 2.2 Shared Components

Located in `src/components/shared/`.

#### StatusBadge (`status-badge.tsx`)

Renders a colored pill badge with a dot indicator for 11 defined statuses plus a generic fallback:

**Request statuses:** `pending`, `offering`, `filled`, `cancelled`
**Offer statuses:** `accepted`, `declined`, `expired`, `withdrawn`
**Compliance statuses:** `compliant`, `pending-compliance`, `expired-compliance`

Key behaviors:
- `offering` status includes `qs-live-pulse` animation class
- Unknown status keys get a gray fallback with auto-capitalized label
- Dot indicator is a 6px circle colored to match the status
- Badge is `rounded-full` with `text-[11px] font-semibold`

#### EmptyState (`empty-state.tsx`)

Reusable placeholder for empty lists/sections.

Props:
- `icon`: Serializable icon name (`"file-text"`, `"briefcase"`, `"inbox"`) — not a component reference, so safe for Server Components
- `title`, `description`: Text content
- `actionLabel` + `actionHref` or `onAction`: Optional CTA button

Visual: Dashed border container, muted background, centered icon in primary-tinted circle, optional Button CTA.

#### ActiveLinkButton (`active-link-button.tsx`)

Navigation link that highlights when the current route matches.

Props:
- `href`, `label`, `icon`: Navigation target and display
- `exact`: If true, only highlights on exact path match; otherwise uses `startsWith`
- `onClick`: For closing mobile menus on navigation

Active state: `bg-primary/10 text-primary shadow-sm`
Inactive state: `text-muted-foreground hover:bg-muted`
Sets `aria-current="page"` when active.

#### NotificationBell (`notification-bell.tsx`)

Dropdown-based notification center.

Features:
- Fetches from `/api/notifications` on mount and when SSE `qs-notification` events fire
- Groups notifications into "New" (unread) and "Earlier" (read) sections
- Unread count badge: absolute-positioned red pill on bell icon (shows "9+" at cap)
- Marks all as read on dropdown close (PATCH request)
- Timestamps formatted as "Today, HH:mm", "Yesterday, HH:mm", or "d MMM HH:mm"
- De-duplicates concurrent fetch requests via ref

#### SignOutButton (`sign-out-button.tsx`)

Async sign-out with loading state.

- Shows Loader2 spinner while signing out
- Redirects to `/` on completion
- Optional `showLabel` prop for sidebar contexts (shows "Sign Out" text)

#### Skeleton Components

Three skeleton variants for loading states:

| Component           | Layout                                          | Usage                    |
| ------------------- | ----------------------------------------------- | ------------------------ |
| `PageSkeleton`      | Title + 3 stat cards + content card with 3 rows | Generic page loading     |
| `DashboardSkeleton` | Title area + 4 stat cards + content card with 5 rows (with avatars) | Dashboard pages |
| `ListPageSkeleton`  | Title + action button + content card with 8 rows | List/table pages        |

All use `animate-pulse` on `bg-muted` rectangles. Dashboard and List skeletons include `animate-in fade-in duration-200` for smooth entrance.

#### CookieBanner (`cookie-banner.tsx`)

Fixed bottom banner for cookie consent. Styled consistently with header (frosted glass, backdrop-blur). Sets a 1-year cookie on acceptance.

### 2.3 Portal-Specific Components

#### School Portal
- `SchoolTopNav`: Horizontal nav bar with ActiveLinkButtons (Dashboard, New Request, All Requests, History)
- `SchoolLiveRefresh`: Invisible SSE subscriber that auto-refreshes page data
- `CoverRequestForm`: Multi-step form with calendar, role select, time inputs, previous teacher picker, sticky submit bar
- `ReviewForm`: Star rating (1-5), optional comment textarea with character count, would-rebook toggle, read-only display for submitted reviews

#### Teacher Portal
- `TeacherDesktopNav`: Hidden on mobile (`hidden md:flex`), horizontal ActiveLinkButtons
- `TeacherMobileBottomNav`: Fixed bottom nav bar (hidden on md+), icon + label links with active indicator bar

#### Agency Portal
- `AgencyDesktopNav`: Vertical sidebar nav with "Operations" section label
- `AgencyMobileNav`: Hamburger menu opening a Sheet from the left
- `AssignmentPanel`: Complex panel showing ranked eligible teachers with scoring, call/assign actions, offering controls, cancel booking dialog
- `CallModal`: Simulated phone call dialog with "Open phone" and "End call" buttons
- `TeacherStatusToggle`, `SchoolStatusToggle`: Active/inactive toggles
- `TeachersFilter`, `RequestsFilter`: Filtering controls for list pages
- `TeacherForm`, `SchoolForm`: CRUD forms
- `TeacherComplianceForm`, `TeacherCredentialsForm`, `SchoolCredentialsForm`: Compliance management
- `SmsLogDrawer`: SMS history viewer
- `TeacherRow`: Table row component for teacher lists
- `AgencyLiveRefresh`: SSE subscriber for real-time updates

### 2.4 Component Usage Guidelines

1. **Always use `Button` for interactive actions.** Never style raw `<button>` elements except in specialized components (star rating, teacher selection cards).
2. **Use `Card` for content grouping.** Every distinct section of a page should be wrapped in a Card.
3. **Use `StatusBadge` for all status display.** Never manually render colored badges for request/offer/compliance states.
4. **Use `EmptyState` for empty lists.** Provide an icon, descriptive text, and an actionable CTA where possible.
5. **Use `toast` (Sonner) for feedback.** `toast.success()` for confirmations, `toast.error()` for failures. Never use alerts or inline error banners for transient feedback.
6. **Use `ActiveLinkButton` for all navigation links** within portal nav bars to ensure consistent active state highlighting and `aria-current` attributes.
7. **Use skeleton components during loading.** Wrap async content in `<Suspense fallback={<PageSkeleton />}>` or the appropriate skeleton variant.

---

## 3. Layout Patterns

### 3.1 Three-Portal Architecture

QuickSupply implements three distinct portals, each with its own layout, navigation pattern, and session requirement:

```
/               Landing page (no auth)
/login          Shared login (portal param)
/school/*       School portal (requireSession("school"))
/teacher/*      Teacher portal (requireSession("teacher"))
/agency/*       Agency portal (requireSession("agent"))
```

All portals share the same design system but use different navigation paradigms suited to their user type and task complexity.

### 3.2 School Portal Layout

**Pattern:** Top navigation bar with horizontal link buttons.

```
+------------------------------------------------------------------+
| [Logo] QuickSupply   [Dashboard] [New Request] [All] [History]   |
|                                         [Bell] [Name] [Sign Out] |
+------------------------------------------------------------------+
|                                                                  |
|   Main content (max-w-7xl, px-4, py-4 sm:py-6)                  |
|                                                                  |
+------------------------------------------------------------------+
```

- Header: sticky, z-40, frosted glass effect (`bg-background/95 backdrop-blur`)
- Header height: h-14 (mobile), h-16 (desktop)
- Nav wraps on small screens (`flex-wrap`)
- Right section wraps to full width on mobile (`w-full sm:w-auto`)
- Session name truncated at 140px on mobile

### 3.3 Teacher Portal Layout

**Pattern:** Desktop horizontal nav + mobile bottom tab bar.

```
Desktop:
+------------------------------------------------------------------+
| [Logo] QuickSupply   [Dashboard] [Availability] [Jobs] [Profile] |
|                                                [Bell] [Name] [x] |
+------------------------------------------------------------------+
|                                                                  |
|   Main content (max-w-7xl, px-4, py-6)                          |
|                                                                  |
+------------------------------------------------------------------+

Mobile:
+------------------------------------------------------------------+
| [Logo] QuickSupply                              [Bell] [...] [x] |
+------------------------------------------------------------------+
|                                                                  |
|   Main content (px-4, py-4, pb-20)  <-- extra bottom padding    |
|                                                                  |
+------------------------------------------------------------------+
| [Home]      [Jobs]      [Availability]      [Profile]            |
+------------------------------------------------------------------+  (fixed bottom)
```

- Desktop nav: `hidden md:flex` — only visible at md breakpoint and above
- Mobile bottom nav: `md:hidden` — fixed at bottom, z-50
- Bottom nav items: min-height 48px for touch targets, active state has a 2px top indicator bar
- Main content has `pb-20 md:pb-6` to prevent bottom nav overlap on mobile
- Uses `<Suspense>` wrappers with `PageSkeleton` fallback for async content

### 3.4 Agency Portal Layout

**Pattern:** Desktop sidebar + mobile hamburger sheet.

```
Desktop:
+----------+-------------------------------------------------------+
|          |                                                       |
| [Logo]   |   Main content (flex-1, p-6, bg-muted/[0.24])         |
| QS       |                                                       |
|----------|                                                       |
| Operations|                                                      |
| Dashboard |                                                      |
| Requests  |                                                      |
| Teachers  |                                                      |
| Schools   |                                                      |
| Bookings  |                                                      |
| Agents    |                                                      |
| Settings  |                                                      |
|          |                                                       |
|----------|                                                       |
| [Name]   |                                                       |
| [Bell]   |                                                       |
| [SignOut] |                                                       |
+----------+-------------------------------------------------------+

Mobile:
+------------------------------------------------------------------+
| [Hamburger]       [Logo] QuickSupply               [Bell]        |
+------------------------------------------------------------------+
|                                                                  |
|   Main content (p-4, bg-muted/[0.24])                           |
|                                                                  |
+------------------------------------------------------------------+
```

- Sidebar: fixed w-64, `hidden md:flex` as flex-col
- Mobile header: `md:hidden`, h-14
- Hamburger opens Sheet from left side, mirrors sidebar layout
- Main content has subtle tinted background (`bg-muted/[0.24]`) to differentiate from sidebar
- Agency nav items defined in `nav-config.tsx`: Dashboard, Requests, Teachers, Schools, Bookings, Agents, Settings
- Section label "Operations" in micro-label style

### 3.5 Responsive Breakpoints

| Breakpoint | Pixel   | Key Changes                                           |
| ---------- | ------- | ----------------------------------------------------- |
| Default    | < 640px | Single column, compact text, mobile nav               |
| `sm`       | 640px   | Slightly larger text, horizontal submit bar layout    |
| `md`       | 768px   | Multi-column grids, desktop nav visible, sidebar shown |
| `lg`       | 1024px  | Wider grids (3-4 columns for stat cards)              |

### 3.6 Container Widths

| Context          | Max Width  | Usage                                           |
| ---------------- | ---------- | ----------------------------------------------- |
| Main content     | `max-w-7xl` | School and Teacher main areas (80rem / 1280px)  |
| Landing page     | `max-w-4xl` | Portal cards grid, cookie banner                |
| Form dialogs     | `sm:max-w-lg` | Standard dialogs                             |
| Call modal       | `sm:max-w-xs` | Compact phone call simulation                |
| Empty state text | `max-w-sm`   | Description text within empty state           |

---

## 4. Interaction Patterns

### 4.1 Form Submission

All forms follow a consistent async submission pattern:

1. **Client-side validation** — Required fields checked before fetch. Validation hints shown inline (`text-destructive text-xs`).
2. **Loading state** — Button shows `Loader2` spinner with "Submitting..." / "Saving..." text. Button disabled via `disabled={loading}`.
3. **API call** — `fetch()` with JSON body to API route.
4. **Success** — `toast.success("message")` + `router.push()` to destination + `router.refresh()` for data revalidation.
5. **Error** — `toast.error()` with server error message or generic fallback. Form remains populated for retry.
6. **Network error** — Separate catch block with user-friendly message.

**Cover Request Form specifics:**
- Multi-step card layout (Date, Role, Times, Previous Teacher, Notes)
- Progress indicator card at top shows step completion status
- Sticky submit bar at bottom with summary and CTA
- Calendar disables past dates and weekends
- Previous teacher list auto-filters by selected role and checks availability via API
- Emergency flag auto-toggles for same-day requests

**Review Form specifics:**
- Interactive star rating (hover + click, 1-5)
- Comment textarea with 500-character limit and live counter
- Would-rebook binary toggle (Yes/No styled buttons)
- Switches to read-only display once submitted

### 4.2 Confirmation Dialogs

Used for destructive actions to prevent accidental data loss:

- **Cancel Booking**: Dialog with reason textarea, "Keep Booking" (outline) and "Confirm Cancellation" (destructive) buttons
- **Start Offering**: Inline confirmation panel (not a dialog) with description, Confirm (primary) and Cancel (outline) buttons

Pattern:
1. User clicks destructive action button
2. Dialog/panel appears with clear description of consequences
3. Two options: safe action (outline/secondary) and confirm (destructive/primary)
4. Loading spinner replaces button content during async operation
5. Dialog closes on success; toast confirms outcome

### 4.3 Real-Time Updates via SSE

QuickSupply uses Server-Sent Events for live data:

**Architecture:**
- `useSSE` custom hook connects to portal-specific SSE endpoints
- School: `/api/sse/school/{schoolId}`
- Agency: `/api/sse/agency`
- On event receipt: `router.refresh()` triggers React Server Component re-render
- Notification events dispatch `window.dispatchEvent(new CustomEvent("qs-notification"))` to trigger `NotificationBell` refetch

**Visual indicator:** The `offering` StatusBadge includes `qs-live-pulse` animation — a soft blue box-shadow pulse (2.4s cycle) indicating the system is actively sending offers.

### 4.4 Countdown Timers and Urgency Escalation

- Cover request form auto-detects same-day requests and defaults `isEmergency` to true
- Emergency banner with `AlertTriangle` icon and destructive-tinted background (`bg-destructive/10`)
- Agency assignment panel polls every 30 seconds when an active offer exists to check for expiry
- Offer statuses transition through: pending -> offering (with pulse) -> accepted/declined/expired

### 4.5 Skeleton Loading States

Three skeleton variants match the three primary page layouts:

1. **DashboardSkeleton** — 4 stat cards + content list with avatar placeholders
2. **ListPageSkeleton** — Title/action header + 8-row list with icon placeholders
3. **PageSkeleton** — 3 stat cards + content card with row placeholders

All skeletons:
- Use `animate-pulse` on `bg-muted` rectangles sized to match real content
- Wrapped in `animate-in fade-in duration-200` for smooth entrance
- Maintain layout stability (same height/width as loaded content)
- Used via `<Suspense fallback={<Skeleton />}>` in Next.js RSC architecture

### 4.6 Empty States

EmptyState component is used when lists have no items:

- Centered layout with dashed border and muted background
- Icon in a primary-tinted circle (40x40 outer, 24x24 icon)
- Short title (semibold) + descriptive body text
- Optional CTA button linking to the creation flow

Examples:
- "No previous teachers yet" in cover request form (contextual inline variant)
- Empty request lists, empty job lists
- No eligible teachers for assignment

### 4.7 Toast Notifications

Sonner toaster with Desian branding:

| Type      | Background    | Icon           | Usage                              |
| --------- | ------------- | -------------- | ---------------------------------- |
| `success` | Primary purple | CircleCheck   | "Cover request submitted", "Review submitted" |
| `error`   | Destructive red | OctagonX     | "Failed to submit", "Network error" |
| `info`    | Popover bg    | Info          | General informational messages     |
| `warning` | Popover bg    | TriangleAlert | Warning notices                    |

---

## 5. Accessibility Standards

### 5.1 Focus Management

**Focus rings:** All interactive elements use `focus-visible:ring-[3px] focus-visible:ring-ring/50` — a 3px semi-transparent purple ring that only appears on keyboard navigation (not mouse clicks).

Additional focus styles:
- `focus-visible:border-ring`: Border color change on focus
- `aria-invalid:ring-destructive/20`: Red ring for invalid form fields
- Landing page portal cards: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`

### 5.2 ARIA Attributes

| Attribute       | Usage                                                    |
| --------------- | -------------------------------------------------------- |
| `aria-current="page"` | ActiveLinkButton marks the current navigation item |
| `aria-label`    | Icon-only buttons (NotificationBell, SignOut, Call, Assign), star rating buttons, teacher selection cards |
| `aria-hidden`   | Decorative icons in mobile bottom nav                    |
| `aria-live`     | (Available for dynamic content regions)                  |
| `role="dialog"` | Cookie consent banner                                   |

### 5.3 Semantic HTML

- `<header>` for portal top bars
- `<nav>` with `aria-label="Primary"` for mobile bottom navigation
- `<main>` for primary content area
- `<aside>` for agency desktop sidebar
- `<article>` for individual notification items
- `<footer>` for landing page footer
- `<form>` wrapping all submission forms with `onSubmit` handlers
- `<label>` / `<Label>` associated with form inputs via `htmlFor`

### 5.4 Reduced Motion

Custom animations (`qs-enter`, `qs-pop`, `qs-live-pulse`) are fully suppressed via:

```css
@media (prefers-reduced-motion: reduce) {
  .qs-enter, .qs-pop, .qs-live-pulse {
    animation: none !important;
  }
}
```

Content remains accessible — elements appear immediately without animation. Tailwind's built-in `motion-reduce:` variant is available for additional suppression.

### 5.5 Touch Targets

- Mobile bottom nav items: `min-h-[48px]` minimum touch target (meets WCAG 2.5.8)
- `touch-manipulation` class on mobile nav links prevents double-tap zoom
- Button sizes: smallest is `h-6` (24px) for `xs` variant; standard is `h-9` (36px)

### 5.6 Color Contrast

- Primary purple (`#4c0673`) on white background: 10.5:1 contrast ratio (exceeds AAA)
- Muted foreground on white: approximately 4.6:1 (meets AA for normal text)
- StatusBadge colors use dark-800 text on light-50 backgrounds for high contrast within badges
- Destructive red on white: approximately 4.6:1 (meets AA)

### 5.7 Screen Reader Considerations

- `sr-only` class used for visually hidden dialog titles (CallModal)
- Notification count capped at "9+" to keep announcement brief
- Star rating buttons include explicit aria-labels ("1 star", "2 stars", etc.)
- Status dots are decorative (no aria attributes); the text label carries the meaning

---

## 6. User Flow Diagrams

### 6.1 School Flow

```
LOGIN
  |
  v
DASHBOARD
  |-- View summary stats (pending, offering, filled counts)
  |-- See recent requests with status badges
  |-- Live updates via SSE (SchoolLiveRefresh)
  |
  +---> NEW REQUEST
  |       |
  |       +-- Step 1: Select date (calendar, emergency toggle)
  |       +-- Step 2: Choose role (Teacher/TA) + year group
  |       +-- Step 3: Set start/end times
  |       +-- Step 4: Optionally select previous teacher
  |       +-- Step 5: Add notes
  |       +-- Submit via sticky bar
  |       |
  |       +-- SUCCESS --> toast + redirect to ALL REQUESTS
  |       +-- ERROR --> toast, stay on form
  |
  +---> ALL REQUESTS
  |       |
  |       +-- List of active requests with StatusBadge
  |       +-- Click request --> REQUEST DETAIL
  |                               |
  |                               +-- View status, assigned teacher
  |                               +-- Real-time status updates
  |
  +---> HISTORY
          |
          +-- Past/completed requests
          +-- REVIEW TEACHER
                |
                +-- Star rating (1-5)
                +-- Optional comment (500 chars)
                +-- Would rebook? (Yes/No)
                +-- Submit --> read-only display
```

### 6.2 Teacher Flow

```
LOGIN
  |
  v
DASHBOARD
  |-- View upcoming bookings
  |-- See pending offers with countdown
  |-- Quick stats
  |
  +---> JOBS
  |       |
  |       +-- List of offers and bookings
  |       +-- VIEW OFFER
  |              |
  |              +-- See school, date, times, role details
  |              +-- ACCEPT --> booking confirmed, toast
  |              +-- DECLINE --> offer declined, toast
  |              +-- Offer may EXPIRE if not responded in time
  |
  +---> AVAILABILITY
  |       |
  |       +-- Set available/unavailable dates
  |       +-- Calendar-based interface
  |
  +---> PROFILE
          |
          +-- View/edit personal details
          +-- See compliance status
```

### 6.3 Agency Flow

```
LOGIN
  |
  v
DASHBOARD
  |-- Overview stats (pending, offering, filled, today's bookings)
  |-- Quick action links
  |-- Live updates via SSE (AgencyLiveRefresh)
  |
  +---> REQUESTS
  |       |
  |       +-- Filterable list of all requests
  |       +-- Click request --> REQUEST DETAIL
  |              |
  |              +-- View request info, school details
  |              +-- ASSIGNMENT PANEL:
  |                    |
  |                    +-- View ranked eligible teachers (auto-scored)
  |                    |     |-- Score, distance, rating, compliance
  |                    |     |-- Preferred teacher badge
  |                    |     |-- Previous teacher badge
  |                    |     |-- Call button --> CallModal
  |                    |     +-- Assign button --> manual assign
  |                    |
  |                    +-- START SEQUENTIAL OFFERING
  |                    |     |-- Confirmation panel
  |                    |     +-- Confirm --> system sends offers in rank order
  |                    |
  |                    +-- ACTIVE OFFER state:
  |                    |     |-- Shows current offer recipient
  |                    |     |-- Withdraw offer option
  |                    |     |-- Auto-poll for expiry (30s)
  |                    |
  |                    +-- FILLED state:
  |                          |-- Success banner
  |                          +-- Cancel Booking --> confirmation dialog
  |
  +---> TEACHERS
  |       |
  |       +-- Filterable teacher list
  |       +-- Teacher detail: credentials, compliance, status toggle
  |
  +---> SCHOOLS
  |       |
  |       +-- School list with status toggles
  |       +-- School detail: credentials, settings
  |
  +---> BOOKINGS
  |       |
  |       +-- All bookings list
  |
  +---> AGENTS
  |       |
  |       +-- Agent user management
  |
  +---> SETTINGS
          |
          +-- System configuration
```

---

## 7. Dark Mode

### 7.1 Current State

Dark mode infrastructure is in place but not fully implemented:

**What exists:**
- `@custom-variant dark (&:is(.dark *))` defined in `globals.css` — enables the `.dark` class strategy
- `next-themes` integration in Sonner toaster (`useTheme()`)
- Several components include `dark:` variant classes:
  - Button: `dark:bg-input/30`, `dark:border-input`, `dark:hover:bg-input/50`, `dark:hover:bg-accent/50`
  - Focus rings: `dark:aria-invalid:ring-destructive/40`, `dark:focus-visible:ring-destructive/40`
  - Destructive button: `dark:bg-destructive/60`

**What is missing:**
- No `:root.dark` or `.dark` CSS variable overrides (no dark palette defined)
- No theme toggle UI component
- No `ThemeProvider` wrapper in root layout (or if present, defaulting to light)
- Status badge colors use hardcoded Tailwind colors (amber-50, green-50, etc.) that would need dark variants

### 7.2 Implementation Guidance

To fully implement dark mode:

1. **Define dark palette** — Add a `.dark` block in `globals.css` overriding all CSS custom properties:
   ```css
   .dark {
     --background: oklch(0.145 0.005 247.858);
     --foreground: oklch(0.985 0.002 247.858);
     --card: oklch(0.205 0.006 247.858);
     --card-foreground: oklch(0.985 0.002 247.858);
     --primary: oklch(0.769 0.131 303.438);  /* lighter purple for dark bg */
     --primary-foreground: oklch(0.145 0.005 247.858);
     /* ... remaining overrides */
   }
   ```

2. **Add ThemeProvider** — Wrap root layout in `next-themes` ThemeProvider with `attribute="class"`.

3. **Add theme toggle** — Place in header/sidebar using a Sun/Moon icon button.

4. **Update StatusBadge** — Add `dark:` variants for all status colors, or switch to CSS custom properties for badge colors.

5. **Update EmptyState** — The `bg-muted/30` and dashed border should remain readable in dark mode (likely works as-is since it uses theme tokens).

6. **Update qs-live-pulse** — Change the `rgba(24, 99, 220, ...)` hardcoded color to use a CSS custom property so it adapts to dark mode.

7. **Test contrast** — Ensure all text/background combinations meet WCAG AA in dark mode, particularly:
   - Muted foreground on dark card backgrounds
   - StatusBadge text on dark badge backgrounds
   - Toast text on branded backgrounds

---

## Appendix: File Reference

| Path | Purpose |
| ---- | ------- |
| `src/app/globals.css` | Design tokens, animations, base styles |
| `src/app/page.tsx` | Landing page |
| `src/app/school/layout.tsx` | School portal layout |
| `src/app/teacher/layout.tsx` | Teacher portal layout |
| `src/app/agency/layout.tsx` | Agency portal layout |
| `src/app/agency/nav-config.tsx` | Agency navigation items |
| `src/components/ui/*` | Base UI components (shadcn/ui) |
| `src/components/shared/*` | Shared cross-portal components |
| `src/components/school/*` | School-specific components |
| `src/components/teacher/*` | Teacher-specific components |
| `src/components/agency/*` | Agency-specific components |
