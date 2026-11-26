# Campus Connect — Institutional Ownership Transfer Checklist
### Francis Xavier Engineering College (Autonomous)
**Prepared by Krish & Ihsan** • Version 1.0.0

---

## 1. Overview & Institutional Handover Policy
This checklist governs the formal transfer of administrative, technical, and intellectual ownership of Campus Connect to Francis Xavier Engineering College.
All production resources must be controlled by official institutional accounts (e.g. `itdesk@francisxavier.ac.in`, `principal@francisxavier.ac.in`) with at least two designated faculty/staff administrators.

> [!IMPORTANT]
> Personal accounts must only be removed AFTER the college confirms administrative access to all 6 service boundaries below.

---

## 2. Infrastructure Ownership Transfer Matrix

### 1. GitHub Code Repository
* **Repository**: `https://github.com/vrajavenkatesh17-eng/campus-connect.git`
* **Target Owner**: Official FXEC GitHub Organization (`@francisxavier-engineering-college` or institutional account).
* **Action Steps**:
  - [ ] Go to **Settings > Transfer ownership**.
  - [ ] Enter official college GitHub username or organization name.
  - [ ] Assign at least two faculty members as Organization Admins.
  - [ ] Verify GitHub Actions repository secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

### 2. Supabase Backend & Database Organization
* **Current Project**: `https://app.supabase.com/project/<project-ref>`
* **Target Organization**: Institutional Supabase Organization owned by college billing/IT email.
* **Action Steps**:
  - [ ] In Supabase Dashboard, go to **Organization Settings > Members**.
  - [ ] Invite official college IT email (`itdesk@francisxavier.ac.in`) with **Owner** role.
  - [ ] College IT accepts the invite and confirms administrative control.
  - [ ] College IT adds a secondary owner (e.g. HOD / Principal office).
  - [ ] Transfer project or remove personal developer accounts.

### 3. Google Cloud Console (OAuth & API Services)
* **Project Name**: `Campus Connect FXEC`
* **Current Admin**: `v.rajavenkatesh17@gmail.com`
* **Action Steps**:
  - [ ] In [console.cloud.google.com](https://console.cloud.google.com), navigate to **IAM & Admin > IAM**.
  - [ ] Click **Grant Access** and add official college administrator email with role **Project > Owner**.
  - [ ] Verify OAuth consent screen publishing status (Internal to Francis Xavier Engineering College).
  - [ ] College administrator confirms ability to manage credentials.

### 4. Hosting & Deployment (Vercel)
* **Production URL**: `https://campus-connect-fxec.vercel.app`
* **Action Steps**:
  - [ ] In Vercel Project Settings, navigate to **Members**.
  - [ ] Invite college IT administrator as **Owner**.
  - [ ] Verify production deployment domain configuration (`campus-connect-fxec.vercel.app` or custom `events.francisxavier.ac.in`).
  - [ ] Confirm environment variables are populated under the institutional team.

### 5. Institutional Custom Domain (Optional DNS Record)
* **Target Domain**: `events.francisxavier.ac.in`
* **Action Steps**:
  - [ ] College DNS administrator adds CNAME record pointing `events` to `cname.vercel-dns.com`.
  - [ ] Add `events.francisxavier.ac.in` under Vercel **Project Settings > Domains**.
  - [ ] Update Google OAuth **Authorized JavaScript Origins** and **Redirect URIs**.
  - [ ] Update `app_settings` and `canonical` SEO tags.

### 6. Email Delivery Provider (Resend / SMTP)
* **Action Steps**:
  - [ ] Ensure Resend / institutional SMTP account is registered under `no-reply@francisxavier.ac.in`.
  - [ ] Verify DKIM, SPF, and DMARC DNS records for high deliverability of event reminders.

---

## 3. Formal Sign-Off & Transfer Confirmation
* **Handover Prepared By**: Krish (Krishna Raja V) & Ihsan
* **Date**: November 2026
* **Institutional Recipient**: Francis Xavier Engineering College Authority
* **Confirmation Status**: Pending College Verification
