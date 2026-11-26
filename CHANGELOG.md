# Changelog — Campus Connect FXEC
All notable changes to the Campus Connect Institutional Event Management System are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-26

### Added
- **S-M 1 5-Step Event Wizard**: Built multi-step guided event proposal wizard via `AppStepper` with real-time venue conflict checking, private draft auto-saving, department targeting, and dual 4:5 + 16:9 poster previews.
- **S-M 2 Live QR Projector Screen (`/coordinator/events/:id/live`)**: High-contrast fixed dark surround (`#0D0809`), 30-second animated SVG ring countdown, real-time turnout counter, Screen Wake Lock API, and `AppSlideConfirm` to conclude attendance.
- **S-M 3 Dedicated Mobile QR Scanner (`/student/scan`)**: Responsive viewfinder with laser frame guide, audio chime & haptic feedback, HTTPS detection, and 6 distinct result states with manual attendance fallback notice.
- **S-M 5 Production Certificate PDF Engine**: Institutional A4 landscape layout, ivory background (`#FBF8F5`), wine + gold hairline borders, embedded Fraunces & JetBrains Mono TTF fonts, FXEC official seal, and verification QR code linking to `/verify/:code`.
- **S-N 1 Lenis Smooth Scroll**: Conditional Lenis smooth scrolling active strictly on public pages (`/`, `/events`, `/login`, `/gallery`, `/help`), with native scrolling in portals and auto-pause on modal/drawer open and `prefers-reduced-motion`.
- **S-Q Shared Moments Gallery**: Deployed `<MomentsSection/>` across public landing and role dashboards (`/student`, `/coordinator`, `/admin`) with 3-tier fallback (approved photos -> past posters -> seed.json) and WebGL2 liquid carousel with CSS scroll-snap fallback.
- **S-O Comprehensive Handover Suite**: Delivered `README.md`, `docs/ADMIN_GUIDE.md`, `docs/COORDINATOR_GUIDE.md`, `docs/STUDENT_GUIDE.md`, `docs/OPERATIONS.md`, `docs/OWNERSHIP_TRANSFER_CHECKLIST.md`, and in-app `/help` knowledge base.
- **High-Resolution Anti-Aliased Logo**: Generated 253-level alpha smoothed circular PNG of Francis Xavier Engineering College emblem and updated cache-busting meta tags.

### Changed
- Refactored `index.html` with cache-busted icon paths (`/fxec-logo.png?v=2`).
- Integrated `/help` route and updated global navigation footer.
- Enhanced `eventService.js` with `checkVenueAvailability` RPC and draft persistence.

### Security & Compliance
- Enforced zero raw elements across the design system.
- Maintained worst-pixel contrast compliance (Body > 4.5:1, Headings > 3:1).
- Maintained strict RLS isolation and anonymous feedback protection.
