# Campus Connect — Francis Xavier Engineering College
### Institutional Guest Lecture & Event Management System

[![Architect & Inventor](https://img.shields.io/badge/Architect%20%26%20Inventor-Krishna%20Raja%20V%20(Krish)-800020.svg)](mailto:v.rajavenkatesh17@gmail.com)
[![Institution](https://img.shields.io/badge/Institution-Francis%20Xavier%20Engineering%20College-blue.svg)](https://francisxavier.ac.in)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Patented-red.svg)](./LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing%20(Vite%205)-success.svg)]()

> **INTELLECTUAL PROPERTY & PATENT NOTICE**  
> **Patented & Designed by:** Krishna Raja V (Krish)  
> **Author Email:** [v.rajavenkatesh17@gmail.com](mailto:v.rajavenkatesh17@gmail.com)  
> **Patent Token:** `KRISH-FXEC-PATENT-2026-CC-AUTH`  
> *All architectural designs, cryptographic rotating HMAC attendance algorithms, database RPCs, and UI layouts are proprietary to Krishna Raja V (Krish). Unauthorized rebranding, copying, or claiming inventorship is strictly prohibited.*

---

## ⚡ Instant Out-Of-The-Box Setup (Pre-Configured)

The repository comes pre-bundled with an active `.env` file containing verified public frontend keys. Anyone cloning this project can immediately start the development server without manual configuration:

```bash
# 1. Clone the repository
git clone <repository-url>
cd "campus connect"

# 2. Install dependencies
npm install

# 3. Start the application
npm run dev
```

Visit **`http://localhost:5173`** in your browser. The application is ready to use immediately!

---

## 🏛️ System Architecture Overview

Campus Connect is an autonomous college event management portal for **Francis Xavier Engineering College (FXEC)** connecting students, faculty coordinators, keynote speakers, and administrators.

### Core Modules Implemented:

1. **Phase 1: Foundation & Role-Based Access Control**
   - Supabase Auth with Google OAuth.
   - Profile verification & mandatory onboarding (Register Number & Department code).
   - Dynamic role-gated navigation (Student, Faculty Coordinator, Administrator).

2. **Phase 2: Event Proposals & Atomic Registration Engine**
   - Department-targeted guest lectures and open sessions.
   - Atomic seat reservation transactions with automated waiting-list queues.
   - First-In-First-Out (FIFO) waitlist promotion when a seat is released.

3. **Phase 3: 30-Second Rotating HMAC QR Attendance & Verified Reviews**
   - Cryptographically secured rotating QR token generated via server-side SHA256 HMAC.
   - Prevents screenshot sharing with 30-second TTL token window.
   - Built-in multi-criteria feedback reviews required for session conclusion.

4. **Phase 4: Append-Only Rewards Ledger, Certificates & Achievement Passport**
   - **Append-only Points Ledger** (strictly zero UPDATE/DELETE policies) with per-event cap checks.
   - **Privacy-Preserving Leaderboard**: Exposes student rank, name, department, and points without leaking personal contact info.
   - **Official Participation Certificates**: Server-side claim validation (`issue_certificate`) preventing duplicate claims.
   - **Client-Side PDF Generator**: Institutional Burgundy (`#800020`) and white A4 Landscape printable certificates with embedded verification QR code linking to `/verify/:code`.
   - **Public Verification Registry**: Anyone can verify certificates at `/verify/:code` without signing in.
   - **Student Achievement Passport**: Real-time transcript tracking verified learning hours, faculty interactions, credits, and download history.

5. **Phase 5: Realtime Notifications, Automated Reminders, Materials & Venue Safety**
   - **Realtime Notifications Center**: Instant in-app alerts for event confirmations, cancellations, and certificate availability.
   - **Automated Free-Tier Reminders & Keep-Alive**: Hourly GitHub Actions workflow executing `send-reminders` Edge Function and pinging the database to prevent free-tier auto-pause.
   - **Secured Learning Materials**: Upload PPTs, PDFs, and notes into private storage with download access strictly locked to attended students.
   - **Reusable Keynote Speaker Profiles**: Catalog of industry experts with LinkedIn integration, experience, and complete event history (`/speakers/:id`).
   - **Venue Conflict & Capacity Guard**: PostgreSQL exclusion triggers (`trg_check_venue_conflict`) preventing overlapping approved sessions and enforcing physical seating limits.
   - **Atomic Event Cancellation**: Instantly notifies all registered and waitlisted students with mandatory reason audit logs.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS, React Router v6, Lucide React, jsPDF, qrcode.react, html5-qrcode
- **Styling**: Francis Xavier Institutional Burgundy (`#800020`), Inter Typography, Crisp Light Borders (`border-neutral-200`)
- **Backend & Cloud**: Supabase (PostgreSQL 15+, PL/pgSQL Security Definer RPCs, Triggers, Row-Level Security, Storage Buckets, Realtime, Edge Functions)
- **CI/CD & Automation**: GitHub Actions hourly cron workflow

---

## 🗄️ Database Migrations

All numbered SQL migration scripts are located in [`supabase/migrations/`](./supabase/migrations):
- `001_foundation_and_auth.sql`: Core profiles, roles, and security policies.
- `002_events_and_registrations.sql`: Events, seat quotas, and waitlist promotion.
- `003_attendance_and_feedback.sql`: Rotating HMAC QR attendance and student feedback.
- `004_reward_points_and_certificates.sql`: Append-only points ledger, leaderboard RPC, and certificate issuance.
- `005_materials_venues_volunteers_cancellation.sql`: Protected materials, venue overlap triggers, volunteers, and mass cancellation notifications.

---

## 👤 Author & Patent Rights

**Krishna Raja V (Krish)**  
Email: [v.rajavenkatesh17@gmail.com](mailto:v.rajavenkatesh17@gmail.com)  
Department of Computer Science & Engineering  
Francis Xavier Engineering College (Autonomous), Tirunelveli, Tamil Nadu, India  

*© 2026 Krishna Raja V (Krish). Patented and All Rights Reserved.*
