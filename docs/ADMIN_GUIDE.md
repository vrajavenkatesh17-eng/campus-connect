# Campus Connect — Administrator Operational Manual
### Francis Xavier Engineering College (Autonomous)
**Architected by Krish & Ihsan** • Version 1.0.0

---

## 1. Overview & System Authority
Administrators have full governance privileges across the FXEC Campus Connect ecosystem:
* Reviewing and approving / rejecting proposed guest lectures, symposiums, and workshops.
* Managing campus auditorium and hall allocations (`venues`).
* Monitoring institutional event metrics and anonymized feedback.
* Overseeing role elevations (promoting students or faculty to Coordinator status).
* Enforcing access controls and user deactivations.

---

## 2. Event Proposal Review Workflow
1. Navigate to **Admin Portal -> Event Proposals** (`/admin/events`).
2. Proposals submitted by coordinators arrive in **Pending** status.
3. Click on any proposal card to review:
   * Event title, schedule, and comprehensive agenda.
   * Keynote speaker credentials (name, organization, experience, LinkedIn).
   * Requested campus venue and maximum seat allocation.
   * Department targeting (Open to All vs specific engineering branches).
   * Promotional poster in 4:5 and 16:9 aspect ratios.
4. Action:
   * **Approve Event**: Transitions status to `approved`. The event becomes visible on public explorers and student dashboards for registration.
   * **Reject Event**: Coordinator receives notification with review comments.
   * **Cancel Event**: If an approved event must be cancelled, the system automatically notifies all registered and waitlisted students in a single atomic transaction.

---

## 3. Venue Allocation & Conflicts
1. Navigate to **Admin Portal -> Venues** (`/admin/venues`).
2. Add, update, or deactivate auditorium profiles (e.g. *Auditorium 1*, *APJ Abdul Kalam Hall*, *Seminar Hall Block C*).
3. Specify seated capacity for each hall.
4. **Automated Conflict Shield**: The system enforces database-level conflict checking (`check_venue_conflict`) to prevent double-booking.

---

## 4. User Role Elevation & Governance
1. Navigate to **Admin Portal -> Coordinator Requests** (`/admin/requests`).
2. When faculty or student heads apply for coordinator status, their requests appear in the queue.
3. Review their department, official email, and stated justification.
4. Click **Approve** to elevate their role to `coordinator`, granting access to the Event Wizard and Live Attendance Projector.
5. To deactivate a user violating college policies, visit `/admin/users` and toggle their status to **Inactive**. RLS session tokens are immediately revoked.

---

## 5. Analytics & Anonymized Feedback
1. Navigate to **Admin Portal -> Analytics** (`/admin/analytics`).
2. Review aggregated figures: total events hosted, verified student attendance, certificates issued, active speakers.
3. **Anonymized Feedback Isolation**: Under `/admin/feedback`, all feedback ratings and textual comments are surfaced strictly stripped of student names, emails, and IDs (`admin_get_feedback_report`). This protects student confidentiality while maintaining faculty feedback integrity.
