# Campus Connect — Francis Xavier Engineering College
### Autonomous Institutional Guest Lecture & Event Management System

[![Architects & Inventors](https://img.shields.io/badge/Architects%20%26%20Inventors-Krish%20%26%20Ihsan-800020.svg)](mailto:v.rajavenkatesh17@gmail.com)
[![Institution](https://img.shields.io/badge/Institution-Francis%20Xavier%20Engineering%20College-blue.svg)](https://francisxavier.ac.in)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Patented-red.svg)](./LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing%20(Vite%205)-success.svg)]()
[![Patent Reference](https://img.shields.io/badge/Patent%20Ref-KRISH--IHSAN--FXEC--PATENT--2026--CC-gold.svg)]()

> **LEGAL & INTELLECTUAL PROPERTY NOTICE**  
> **Patented & Designed by:** Krish (Krishna Raja V) & Ihsan  
> **Contact:** [v.rajavenkatesh17@gmail.com](mailto:v.rajavenkatesh17@gmail.com)  
> **Patent Token:** `KRISH-IHSAN-FXEC-PATENT-2026-CC`  
> *All architectural workflows, rotating cryptographic SHA-256 HMAC attendance tokens, atomic waitlist promotion algorithms, security-definer RPCs, anonymous feedback isolation, and UI layouts are proprietary to Krish & Ihsan. Any unauthorized copying, renaming, or claiming inventorship is strictly prohibited.*

---

## ⚡ Instant Out-Of-The-Box Setup

The repository is pre-configured with public environment keys in `.env`. Anyone cloning this repository can run it immediately without needing to configure a backend from scratch:

```bash
# 1. Clone the repository
git clone https://github.com/vrajavenkatesh17-eng/campus-connect.git
cd campus-connect

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit **`http://localhost:5173`** in your browser to explore the live portal.

---

## 🚀 Setting Up On a Fresh Supabase Project

If you are deploying your own standalone backend on Supabase (Free Tier):

### 1. Environment Variables Configuration

Create or update `.env` in the project root:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...<your-public-anon-key>
```

> [!NOTE]
> Only public keys (`anon`) are included in frontend builds. The `service_role` key must **never** be exposed in client code or Git.

### 2. Database Migrations Execution Order

In your Supabase Dashboard, navigate to the **SQL Editor** and run the migration scripts in strict sequential order from the [`supabase/migrations/`](./supabase/migrations) directory:

1. **`001_foundation_and_auth.sql`**
   - FXEC Departments catalog (`CSE`, `IT`, `AI&DS`, `CSBS`, `ECE`, `EEE`, `MECH`, `CIVIL`, `MBA`, `MCA`)
   - Pre-authorized `admins` and `coordinators` allowlists
   - User `profiles` table with automatic sync trigger on `auth.users`
   - Role elevation requests queue (`coordinator_requests`)
   - Core Row Level Security (RLS) policies and domain verification functions

2. **`002_events_and_registrations.sql`**
   - Auditoriums & halls catalog (`venues`)
   - Event proposals engine with status lifecycle (`pending`, `approved`, `rejected`, `completed`, `cancelled`)
   - Target audience mapping (`event_departments`)
   - Atomic seat reservation RPC (`register_for_event`) with capacity limits
   - Automated FIFO waitlist queue with instant promotion upon cancellation (`cancel_registration`)
   - In-app notification center schema (`notifications`)

3. **`003_attendance_and_feedback.sql`**
   - 30-second rotating cryptographic attendance tokens (`generate_attendance_token`, `verify_attendance_qr`)
   - Server-side SHA256 HMAC hash validation preventing screenshot sharing
   - Manual attendance override with audit logging (`mark_attendance_manual`)
   - Multi-criteria feedback submissions (`feedback_submissions`, `feedback_responses`)

4. **`004_reward_points_and_certificates.sql`**
   - Append-only bonus interaction ledger (`points_ledger`) with zero UPDATE/DELETE policies
   - Server-side points awarding with per-event cap checks (`award_points`, `admin_correct_points`)
   - Privacy-preserving student leaderboard RPC (`get_leaderboard`)
   - Server-validated certificate issuance (`issue_certificate`) with unique random alphanumeric verification codes
   - Public unauthenticated verification RPC (`verify_certificate_public`)
   - Student Achievement Passport analytics RPC (`get_student_passport`)

5. **`005_materials_venues_volunteers_cancellation.sql`**
   - Storage bucket `learning-materials` with RLS locked strictly to verified attendees, coordinators, and admins
   - Reusable keynote speaker profiles catalog (`speakers`) with photo, bio, and event histories
   - Venue booking conflict prevention trigger (`check_venue_conflict`)
   - Student volunteer application workflow (`apply_for_volunteer`, `decide_volunteer`)
   - Atomic event cancellation RPC (`cancel_event`) notifying registered & waitlisted students in one transaction

6. **`006_admin_analytics_audit_and_settings.sql`**
   - High-performance composite analytics indexes
   - Administrative Security Definer analytics aggregation (`admin_get_analytics`)
   - Anonymized feedback reporting (`admin_get_feedback_report`) strictly omitting student identities
   - Append-only activity audit logs RPC (`admin_get_activity_logs`) filterable by action, actor, and date
   - Instant user deactivation & RLS session invalidation (`admin_toggle_user_status`)
   - Institutional platform settings (`app_settings`) and allowlist management

### 3. Adding Your First Administrator

To grant administrative authority to your personal account:

#### Method A: Pre-authorize before sign-in (Recommended)
Run in the Supabase SQL Editor:
```sql
INSERT INTO public.admins (email, notes)
VALUES ('your-email@francisxavier.ac.in', 'Lead Institutional Admin')
ON CONFLICT (email) DO NOTHING;
```
When you sign in using this email, your profile is automatically elevated to `admin`.

#### Method B: Elevate existing account
```sql
SELECT set_config('app.role_change_authorized', 'true', false);
UPDATE public.profiles
SET role = 'admin', is_active = true
WHERE email = 'your-email@francisxavier.ac.in';
```

---

## 🔒 Google OAuth Production Setup Checklist

To enable official FXEC Google Workspace sign-in:

1. **Google Cloud Console**:
   - Create a project at [console.cloud.google.com](https://console.cloud.google.com)
   - Go to **APIs & Services > Credentials > Create OAuth Client ID** (Web application).
   - Under **Authorized JavaScript origins**:
     - `http://localhost:5173` (Local development)
     - `https://<your-project-id>.supabase.co`
     - `https://your-production-domain.com`
   - Under **Authorized redirect URIs**:
     - `https://<your-project-id>.supabase.co/auth/v1/callback`

2. **Supabase Dashboard**:
   - Go to **Authentication > Providers > Google**.
   - Enable Google provider and paste:
     - **Client ID**
     - **Client Secret**
   - Go to **Authentication > URL Configuration**:
     - **Site URL**: `https://your-production-domain.com` (or `http://localhost:5173`)
     - **Redirect URLs**:
       - `http://localhost:5173/**`
       - `https://your-production-domain.com/**`
       - `https://your-production-domain.com/auth/callback`

---

## 🌐 Production Deployment Guide

### Deploying to Vercel

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New > Project** and import the repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = `https://<your-project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<your-public-anon-key>`
5. Deploy. Vercel automatically honors client-side routing via `index.html`.

### Deploying to Netlify

1. In the [Netlify Dashboard](https://netlify.com), click **Add new site > Import an existing project**.
2. Select your repository.
3. Build Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
5. Ensure a `_redirects` file exists in `public/` containing:
   ```text
   /*    /index.html   200
   ```

### Deploying to Cloudflare Pages

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com) and go to **Workers & Pages > Create application > Pages**.
2. Connect your GitHub repository.
3. Build Configuration:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Add environment variables in the project settings.

---

## ⏰ Automated Free-Tier Reminders & Keep-Alive Workflow

Supabase free-tier projects automatically pause after 7 days of inactivity. Campus Connect includes an automated hourly GitHub Actions workflow (`.github/workflows/event-reminders-and-keepalive.yml`) that:
1. Pings the REST API to keep the PostgreSQL database awake.
2. Invokes the `send-reminders` Edge Function to queue 24h & 1h event notifications.

### GitHub Repository Secrets Required:
In your GitHub repo under **Settings > Secrets and variables > Actions**, add:
- `SUPABASE_URL`: `https://<your-project-ref>.supabase.co`
- `SUPABASE_ANON_KEY`: `<your-public-anon-key>`
- `SUPABASE_SERVICE_ROLE_KEY`: `<your-service-role-key-kept-secret-in-github>`
- `REMINDERS_FUNCTION_URL`: (Optional) `https://<your-project-ref>.supabase.co/functions/v1/send-reminders`
- `RESEND_API_KEY`: (Optional) API key from [resend.com](https://resend.com) for sending external emails.

---

## 🛡️ Comprehensive Security & Role Boundary Audit Matrix

| Database Entity | Student Access | Faculty Coordinator Access | Administrator Access | Anonymous Public Access |
|---|---|---|---|---|
| `profiles` | Read self & active; update self (no role change) | Read self & active | Full access across all users | Blocked |
| `coordinator_requests` | Insert pending request for self; read self | Read self | Full review, approval & rejection | Blocked |
| `events` | Read approved & completed | Create, edit self proposals, manage attendees | Review, approve, reject, cancel all | Blocked |
| `registrations` | Register self, cancel self | View attendees of hosted events | View all registrations | Blocked |
| `attendance` | View self verified records | Verify QR tokens, manual override self sessions | Full audit access | Blocked |
| `feedback_submissions` | Submit once after verified attendance; view self | View aggregated statistics | View aggregated statistics | Blocked |
| `feedback_responses` | Write once during review | Blocked from student identity (100% anonymized) | Read via anonymized RPC only | Blocked |
| `points_ledger` | Read self earned points | Award bonus points to attended students (capped) | Make corrective negative entries | Blocked |
| `certificates` | Read & download self certificates | View certificates of hosted events | View & audit all issued credentials | Read via `/verify/:code` RPC |
| `learning_materials` | Read only if attended session | Upload & delete for hosted events | Full upload & delete access | Blocked |
| `activity_logs` | Blocked (zero access) | Blocked (zero access) | Read only (Strictly Append-Only) | Blocked |
| `app_settings` | Read public settings | Read public settings | Full read & write access | Blocked |

---

## 🧪 Comprehensive Security Test Plan

| # | Test Scenario | Expected Result | Enforced Layer |
|---|---|---|---|
| 1 | Student calls `admin_get_analytics` directly | RPC throws `Access Denied: Administrator role required.` | PostgreSQL Function (Security Definer) |
| 2 | Coordinator attempts to edit another faculty's event | Policy rejects update (`coordinator_id = auth.uid()` check fails) | PostgreSQL RLS (`events_update_policy`) |
| 3 | Anonymous user attempts to query `profiles` or `events` directly | Query returns empty result set or error | PostgreSQL RLS (`TO authenticated`) |
| 4 | Student tries to insert directly into `points_ledger` | Database rejects insert (Insert policy requires coordinator/admin) | PostgreSQL RLS (`points_ledger_insert`) |
| 5 | Coordinator awards points exceeding `points_per_event_cap` | RPC raises exception: `Point cap exceeded` | PL/pgSQL Function (`award_points`) |
| 6 | Student attempts to issue duplicate certificate | Unique constraint `(event_id, student_id)` prevents duplicate row | PostgreSQL Constraint (`uq_cert_event_student`) |
| 7 | Non-attendee attempts to download slide deck via storage URL | Storage policy denies SELECT request (attendance existence check fails) | Supabase Storage RLS Policy |
| 8 | Any user attempts an UPDATE or DELETE on `activity_logs` | Operation rejected (zero UPDATE/DELETE policies defined) | PostgreSQL Append-Only RLS |
| 9 | Coordinator books venue with overlapping time slot | PostgreSQL conflict check trigger throws schedule overlap error | PostgreSQL Trigger (`check_venue_conflict`) |
| 10 | Deactivated user attempts to register or query points | RLS checks `is_active_user() = true` and immediately denies request | PostgreSQL RLS + Session Invalidation |

---

## 👤 Architectural Authors & Patent Claims

* **Krish (Krishna Raja V)** — Lead Software Architect & Systems Inventor ([v.rajavenkatesh17@gmail.com](mailto:v.rajavenkatesh17@gmail.com))
* **Ihsan** — Co-Architect & Security Researcher  
**Department of Computer Science & Engineering**  
**Francis Xavier Engineering College (Autonomous)**, Tirunelveli, Tamil Nadu, India.
