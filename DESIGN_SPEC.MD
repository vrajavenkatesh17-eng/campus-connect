DESIGN_SPEC v2 (single source of truth; replaces earlier color tokens)

1. BRAND: "Wine & Ivory". Calm, editorial, expensive. One accent (wine). Champagne-gold is decoration only: 1px hairlines, rank #1 and certificate seal. Never gold text on ivory.
TOKENS (CSS variables, light | dark)
bg #FBF8F5 | #0D0809      surface #FFFFFF | #161012      surface-2 #F5EFEA | #1F1719
line #E8DFD8 | #33282C     ink #1C1417 | #F6EFEA         muted #6B5E63 | #B3A5AA
primary #7A1230 | #C95D78  primary-hover #5F0E26 | #DB7A92   primary-soft #F6E9EC | #2A1519
on-primary #FFFFFF | #1A0A0F   gold #A8803F | #D4B27A (decor only)
success #1F8A5B | #4CC38A   warning #B7791F | #E0A84A   danger #C0392B | #F0776A   info #2F6FB5 | #6FA8E8
Page background: bg token plus ONE static radial wine tint at the top (light rgba(122,18,48,.05), dark rgba(212,91,122,.08)). No animated backgrounds outside /login.
TYPE: UI = Inter Variable. Page titles (H1/H2) only = Fraunces Variable (self-hosted via @fontsource-variable). Scale 12/13/14/16/20/24/32/40. H1 32/40 weight 600, tracking -0.01em. Numbers use tabular figures.
SHAPE: radius 12 controls, 20 cards, 999 pills. Spacing grid 8px. Light shadow: 0 1px 2px rgba(60,20,30,.04), 0 8px 24px -12px rgba(60,20,30,.12). Dark: no shadow, 1px line + inset 0 1px 0 rgba(255,255,255,.04).
BUTTONS: primary (solid wine), secondary (surface + line), ghost, danger. Heights 32/40/48; 44px minimum touch target on mobile. Visible focus ring (2px primary, 2px offset) in both themes.

2. APP SHELL
TOP BAR: 64px, sticky, surface at 80% opacity with backdrop blur, 1px line bottom plus a 1px gold gradient hairline under it. Left: 36px logo mark + "Campus Connect" (Fraunces 18) + "Francis Xavier Engineering College" 11px uppercase muted (hidden under 1280px). Center: GooeyNav (md, framed). Right: theme toggle, notification bell with unread badge (opens a panel using Animated List, "Mark all read", link to /notifications), user chip (avatar + first name + role Badge) opening a menu: Profile, Theme, Sign out. NO separate logout icon.
GOOEYNAV ITEMS: Student: Home, Events, Calendar, Passport, Profile. Coordinator: Dashboard, Calendar, Profile. Admin: Dashboard, Calendar, Profile. Controlled by route; never full page reloads.
MOBILE (<768): logo, bell, avatar, hamburger drawer containing the same items as plain links. No GooeyNav.
SIDEBAR (admin and coordinator, only inside the Dashboard area; students have none): 264px, sticky below the top bar (top 88px), surface card radius 20, padding 12. Group labels 11px uppercase muted. Item: 44px high, radius 12, icon 20 + label 14/500, gap 12. Active = primary-soft background + primary text + 3px primary bar on the left. Hover = surface-2. Count badges on the right (pending items). NO user card inside the sidebar. 1024-1279px: collapse to a 72px icon rail with tooltips. Under 1024px: off-canvas drawer opened by a "Menu" button in PageHeader.
ADMIN SIDEBAR: OVERVIEW: Analytics & KPIs | MANAGE: User Management (pending-requests badge), Event Proposals (pending badge), Venues & Capacity | INSIGHTS: Feedback Reports, Activity Logs | SYSTEM: Platform Settings. (Profile Settings lives in the user menu and Profile page, not here.)
COORDINATOR SIDEBAR: OVERVIEW: Overview | EVENTS: My Events, Create Event, Registrations, Attendance | ENGAGE: Points & Recognition, Learning Materials, Volunteers, Feedback.

3. PAGE ANATOMY (every page, no exceptions)
PageContainer max-width 1280, side padding 24 (16 on mobile), 12-column grid, gutter 24, section gap 32, card padding 24 (20 on mobile). PageHeader: small breadcrumb, H1 (Fraunces), subtitle (muted), actions on the right. Grid children use min-w-0; content has no fixed heights; long text truncates with a title attribute; no horizontal page scroll. States: skeleton (surface-2 shimmer), empty (icon + one line + action), error (message + retry). Tables: sticky header, 48px rows, hover surface-2, row actions in a menu, search + pagination, and a card list under 768px. Forms: label above, 44px inputs, helper 13px muted, errors in danger with an icon, sticky action bar.

4. ROLE LAYOUTS
LOGIN (/login): as specified in Step A (Silk, Lanyard, past-events carousel).
STUDENT HOME: row 1 = greeting (Fraunces) + "Next event" hero (span 8: poster, title, speaker, venue, Counter countdown, register state) and a side stack (span 4: points and rank, certificates count). Row 2 = "Upcoming events": filters (Glide Select + Rubber Segment) and a 3-column grid of event cards (Spotlight Card). Row 3 = "My registrations" (Tear Ticket passes) + notifications (Animated List). Row 4 = Achievement Passport MagicBento (events attended, points, rank, certificates, timeline).
EVENT DETAIL: hero (Tilted Card poster left; right: status badge, title, speaker, date/venue, Counter countdown, seats gauge, register / Hold-to-cancel). Below: About, Speaker (Profile Card), Materials (Folder, only after attendance), Feedback (Peek Rating + anonymous Squish Switch, only after attendance and event end).
COORDINATOR OVERVIEW: KPI strip (My events, Pending approval, Registrations, Avg attendance), "Next event" card with Start attendance (opens full-screen rotating QR) and live count, then My Events table and the registrants list.
ADMIN ANALYTICS: PageHeader with date range (Glide Select) and Export menu (CSV, PDF, Excel). ONE KPI strip (Total users, Sessions, Registrations, Avg occupancy, Pending requests; Counter numbers). Then MagicBento (4 columns, rowHeight 260) in this exact order: Trend (colSpan 2, rowSpan 2), Capacity, Lifecycle (rowSpan 2), Demographics, Departments (colSpan 2), Faculty, Feedback. Then a collapsed "Detailed data" accordion (department and event tables). Remove the old duplicate tabs and the second KPI strip.
USER MANAGEMENT: Rubber Segment [All users | Pending coordinator requests], search, role filter, table.
PROFILE: left = ReflectiveCard (sticky on desktop); right = sections: Personal details, Academic details, Preferences (theme, notifications), Account (Google email, read-only). Save bar sticky on mobile.
CALENDAR: month grid with event chips colored by status tokens + day agenda panel.

5. COMPONENT POLICY: WebGL canvases visible at once <= 2 on desktop, <= 1 on mobile; /login uses a simple header (logo + "Back to home") so GooeyNav is not mounted there; shaders only on /login; heavy components lazy-loaded with static fallbacks.

6. CONSISTENCY CONTRACT
- Only shared components: PageContainer, PageHeader, Card, Section, DataTable, Field, Badge, EmptyState, Skeleton, ConfirmDialog. If a page needs something new, add it to the shared set first, never inline.
- No hex/rgb values, no inline color styles, no dark: utilities, no arbitrary px classes in src (except the token file and untouched React Bits files).
- Create `npm run check:ui` that fails on those patterns, and a dev-only route /dev/ui-kit showing every shared component in both themes.
- Create a Playwright smoke test (free): every route x light/dark x 360/768/1280px; it fails on console errors, horizontal overflow, or missing h1.