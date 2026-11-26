# Campus Connect — Systems Operations & Maintenance Manual
### Francis Xavier Engineering College (Autonomous)
**Architected by Krish & Ihsan** • Version 1.0.0

---

## 1. Automated Keep-Alive & Reminder Operations
Supabase Free Tier databases pause after 7 days of inactivity. Campus Connect prevents pausing using an automated hourly GitHub Actions workflow:
* **Workflow file**: `.github/workflows/event-reminders-and-keepalive.yml`
* **Trigger**: Scheduled every hour (`0 * * * *`) + `workflow_dispatch`.
* **Actions Performed**:
  1. Issues an authenticated query to PostgreSQL via Supabase REST API (`/rest/v1/app_settings?select=key&limit=1`).
  2. Invokes the `send-reminders` Edge Function to trigger 24h & 1h email reminders.
* **Confirming Execution**:
  1. In the GitHub repository, click **Actions**.
  2. Select **Event Reminders and Keep-Alive Workflow**.
  3. Green checkmarks confirm the database has been pinged and kept active.

---

## 2. Monthly Database Backup Procedure
Because Supabase Free Tier does not include point-in-time recovery (PITR) or automated daily backups, run a monthly logical database backup:

### Option A: Via Supabase CLI (Recommended)
```bash
# 1. Login to Supabase CLI
supabase login

# 2. Link your production project
supabase link --project-ref <your-project-ref>

# 3. Export complete database schema & data
supabase db dump --data-only -f backups/fxec_backup_$(date +%Y%m%d).sql
```

### Option B: Via pg_dump Direct Connection
```bash
# Using direct session connection string from Database Settings:
pg_dump "postgres://postgres.<your-ref>:<db-password>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" \
  --schema public \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -f backups/fxec_campus_connect_backup_$(date +%Y%m%d).sql
```
Store backup files in an encrypted, college-controlled Google Drive or offline hard drive.

---

## 3. Free-Tier Limits & Usage Monitoring
Monitor usage under **Supabase Dashboard -> Settings -> Usage**:
* **Database Size**: 500 MB limit (Current usage is under 15 MB).
* **Monthly Active Users (MAU)**: 50,000 limit.
* **Storage**: 1 GB limit (Client-side 1600px WebP optimization ensures each poster is ~120 KB).
* **Edge Functions**: 500,000 invocations / month.

---

## 4. Key Rotation Procedure
If API keys or secrets are ever compromised:
1. **Supabase Anon & Service Role Keys**:
   * Go to **Project Settings -> API -> Regenerate Keys**.
   * Update `VITE_SUPABASE_ANON_KEY` in Vercel environment variables.
   * Update `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in GitHub Repository Secrets.
   * Trigger redeploy in Vercel.
2. **Google OAuth Client Secret**:
   * In [console.cloud.google.com](https://console.cloud.google.com), navigate to **APIs & Services -> Credentials**.
   * Generate new Secret, paste into Supabase **Authentication -> Providers -> Google**, and save.

---

## 5. Adding a New Administrator
To grant administrative authority to a new faculty or department head:
```sql
-- Method 1: Pre-authorize prior to sign-in
INSERT INTO public.admins (email, notes)
VALUES ('newadmin@francisxavier.ac.in', 'Department Head CSE')
ON CONFLICT (email) DO NOTHING;

-- Method 2: Elevate registered user
SELECT set_config('app.role_change_authorized', 'true', false);
UPDATE public.profiles
SET role = 'admin', is_active = true
WHERE email = 'newadmin@francisxavier.ac.in';
```

---

## 6. Changing Allowed College Email Domains
If additional institutional domains are authorized (e.g. `@fxengg.org`):
1. Navigate to **Admin Portal -> Platform Settings** (`/admin/settings`).
2. Update the `allowed_domains` array:
   ```json
   ["francisxavier.ac.in", "fxengg.org"]
   ```
3. Save changes. Future student and faculty Google logins from these domains will be accepted.
