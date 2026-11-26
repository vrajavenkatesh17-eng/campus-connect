# Campus Connect — Coordinator Operational Manual
### Francis Xavier Engineering College (Autonomous)
**Architected by Krish & Ihsan** • Version 1.0.0

---

## 1. Coordinator Role Overview
Coordinators (faculty organizers and student leads) manage the complete lifecycle of technical sessions:
1. Proposing guest lectures and workshops via the 5-step Event Wizard.
2. Managing student registrations and real-time attendance.
3. Projecting the 30-second live rotating QR code in auditoriums (`/live`).
4. Uploading session slides, presentation PDFs, and awarding interaction bonus points.

---

## 2. The 5-Step Event Wizard
Navigate to **Coordinator Portal -> Propose Event** (`/coordinator/events/new`).

### Step 1: Basics
* Enter clear **Event Title** and select **Category** (Guest Lecture, Workshop, Symposium, Seminar).
* Write comprehensive description and learning agenda.
* Pick **Event Date**, **Start Time**, and **End Time**. The wizard validates:
  * No dates in the past.
  * End time must be strictly after start time.
* *Drafts Auto-Save*: Progress is automatically saved as a private draft on step changes.

### Step 2: Speaker Credentials
* Enter keynote speaker's full name, designation, and company/institution.
* Add years of experience, LinkedIn URL, and optional headshot.

### Step 3: Venue & Seats
* Select an available hall from the dropdown. The system performs a **live overlap check** against existing events.
* Set seat capacity (must not exceed maximum hall capacity).
* Specify department targeting: toggle **Open to All Departments** or select specific engineering branches.

### Step 4: Promotional Poster
* Upload event poster (JPG, PNG, WebP — max 2MB).
* The client-side image optimizer automatically resizes to max 1600px WebP (q0.82) and strips metadata.
* Inspect dual aspect-ratio previews: **4:5 Portrait Feed** and **16:9 Wide Banner**.

### Step 5: Review & Submit
* Inspect full summary across all previous steps.
* Resolve any highlighted validation warnings.
* Click **Submit Event for Approval** to route to the Administrator queue.

---

## 3. Auditorium Live QR Projector (`/coordinator/events/:id/live`)
On event day, connect the coordinator laptop to the auditorium projector:
1. Navigate to your event in the Attendance Hub and click **Projector Screen (/live)**.
2. The screen opens in high-contrast fixed dark surround (`#0D0809`):
   * Central white card with black QR code (>= 60vh) readable from 20+ feet away.
   * **30-Second Countdown Ring**: The cryptographic token refreshes every 30 seconds to prevent screenshot sharing.
   * **Screen Wake Lock API**: Automatically prevents the laptop or projector display from sleeping.
   * Press **ESC** or click *Exit Fullscreen* at any time to return.
3. Slide **Slide to End Attendance** when the session concludes.

---

## 4. Manual Attendance & Rosters
If a student's phone battery dies or camera fails:
1. Navigate to `/coordinator/events/:id/attendees`.
2. Locate the student by name or register number in the roster.
3. Click **Mark Present (Manual Override)**. The action is logged to the database audit trail.
