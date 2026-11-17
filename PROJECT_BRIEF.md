# Project: CAMPUS CONNECT – Guest Lecture & Event Management System

Our aim is to develop a complete College Event and Guest Lecture Management System that connects students, event coordinators, administrators, and industry experts through a single platform.

Apart from the basic event management features, the following features are added to make the project more useful, professional, and unique.

## 1. Core Features

- Three separate login portals: Admin, Student, and Event Coordinator.
- Google Authentication using official college email IDs ("@francisxavier.ac.in") for students and coordinators.
- Admin login using authorized Google accounts.
- Event creation and approval/rejection by Admin.
- Students can view upcoming events and submit their willingness to attend.
- Coordinators can view registered students and manage attendance.
- Students can submit feedback after attending an event.
- Coordinators can award reward points to students based on their participation and interaction.
- Students can view their attendance, feedback history, certificates, and reward points.

## 2. Additional Recommended Features

### 1. QR Code-Based Attendance
- Generate a unique QR code for event attendance.
- Students can scan the QR code to mark themselves present.
- Prevent duplicate attendance.
- Provide manual attendance as an alternative.

### 2. Event Seat Capacity & Waiting List
- Set a maximum number of seats for each event.
- Automatically move additional registrations to a waiting list.
- Provide seats to waiting-list students when someone cancels.

### 3. Automated Notifications
- Notify students when a new event is approved.
- Send reminders before the event starts.
- Notify students about changes in event timing or venue.
- Notify students when certificates become available.

### 4. Automatic Certificate Generation
- Generate participation certificates for eligible students.
- Allow students to download certificates as PDFs.
- Provide a unique certificate verification ID and QR code.

### 5. Student Engagement & Reward Points
- Award points for asking relevant questions, answering questions, and participating in discussions.
- Coordinators can record the reason for awarding points.
- Maintain a transparent reward-point history.
- Display top-performing students through a leaderboard.

### 6. Guest Speaker Profile
- Display the guest speaker's name, designation, company, experience, profile photo, and LinkedIn profile.
- Allow students to know about the speaker before attending the session.

### 7. Event Learning Materials
- Allow coordinators to upload PPTs, PDFs, notes, useful links, and other learning resources.
- Students can access these materials after the session.

### 8. Student Achievement Passport
- Maintain an individual achievement profile for every student.
- Display total events attended, certificates earned, reward points, and industry interactions.
- Help students track their extracurricular and professional learning activities throughout their college journey.

### 9. Advanced Admin Dashboard & Analytics
- Total students and registered users.
- Total ongoing, upcoming, and completed events.
- Department-wise student participation.
- Event-wise attendance percentage.
- Most active students.
- Feedback ratings and reports.
- Export reports in PDF and Excel formats.

### 10. AI-Based Features (Future Enhancement)
- Recommend suitable events based on students' departments and interests.
- Analyze student feedback and generate useful summaries.
- Predict expected event attendance based on previous registration and attendance data.

## 3. Other Useful Features

- Department-wise event targeting.
- Event calendar.
- Venue and auditorium management.
- Volunteer management.
- Anonymous feedback option.
- Event cancellation management.
- Activity logs to track important Admin and Coordinator actions.

## 4. Main Objective

The main objective is not just to manage guest lectures and attendance. It is to create a complete platform where students can interact with industry experts, gain practical knowledge, participate in discussions, earn recognition, and maintain a record of their achievements.

## 5. Build Approach

We should first implement all the essential features and then gradually add advanced features like AI recommendations and analytics.

## 6. Design

The final platform should be clean, minimal, responsive, and professional, with a Burgundy and White theme.

## 7. Project Details (added)

- College: Francis Xavier Engineering College
- Allowed email domain: @francisxavier.ac.in
- Theme colors: Burgundy (#800020) and White
- Stack: React + Vite, Tailwind CSS, Supabase (free tier only)
- Build approach: phase by phase, starting with the essentials
- Data rule: all data must be real and come from the database, with no mock or demo data