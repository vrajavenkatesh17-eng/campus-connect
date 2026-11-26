/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import RootLayout from './components/layout/RootLayout';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';
import MaintenanceGuard from './components/common/MaintenanceGuard';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public & Auth Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import StudentLoginPage from './pages/public/StudentLoginPage';
import CoordinatorLoginPage from './pages/public/CoordinatorLoginPage';
import AdminLoginPage from './pages/public/AdminLoginPage';
import AuthCallbackPage from './pages/public/AuthCallbackPage';
import VerifyCertificatePage from './pages/public/VerifyCertificatePage';
import GalleryPage from './pages/public/GalleryPage';
import PrivacyPolicyPage from './pages/public/PrivacyPolicyPage';
import TermsPage from './pages/public/TermsPage';
import ContactPage from './pages/public/ContactPage';
import HelpPage from './pages/public/HelpPage';
import ForbiddenPage from './pages/public/ForbiddenPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Profile & Flow Pages
import ProfilePage from './pages/profile/ProfilePage';
import ProfileCompletionPage from './pages/profile/ProfileCompletionPage';
import CoordinatorRequestPage from './pages/coordinator/CoordinatorRequestPage';
import SpeakerProfilePage from './pages/speakers/SpeakerProfilePage';

// Events & Management Pages
import EventsExplorerPage from './pages/events/EventsExplorerPage';
import EventDetailPage from './pages/events/EventDetailPage';
import EventEditorPage from './pages/coordinator/EventEditorPage';
import EventAttendeesPage from './pages/coordinator/EventAttendeesPage';
import EventAttendancePage from './pages/coordinator/EventAttendancePage';
import AttendanceHistoryPage from './pages/student/AttendanceHistoryPage';
import FeedbackHistoryPage from './pages/student/FeedbackHistoryPage';
import StudentPointsPage from './pages/student/StudentPointsPage';
import StudentCertificatesPage from './pages/student/StudentCertificatesPage';
import StudentPassportPage from './pages/student/StudentPassportPage';
import CoordinatorAttendanceHubPage from './pages/coordinator/CoordinatorAttendanceHubPage';
import LiveProjectorPage from './pages/coordinator/LiveProjectorPage';
import CoordinatorMaterialsPage from './pages/coordinator/CoordinatorMaterialsPage';
import CoordinatorRewardsPage from './pages/coordinator/CoordinatorRewardsPage';
import StudentScanPage from './pages/student/StudentScanPage';

// Role Dashboards
import StudentDashboard from './pages/student/StudentDashboard';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalErrorBoundary>
        <BrowserRouter>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <MaintenanceGuard>
                  <RootLayout>
                    <Routes>
                  {/* Public Entry Points */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/login/student" element={<StudentLoginPage />} />
                  <Route path="/login/coordinator" element={<CoordinatorLoginPage />} />
                  <Route path="/login/admin" element={<AdminLoginPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/verify" element={<VerifyCertificatePage />} />
                  <Route path="/verify/:code" element={<VerifyCertificatePage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/help" element={<HelpPage />} />

                  {/* Error Screens */}
                  <Route path="/403" element={<ForbiddenPage />} />
                  <Route path="/unauthorized" element={<ForbiddenPage />} />

            {/* Mandatory Student Profile Completion */}
            <Route
              path="/profile/complete"
              element={
                <ProtectedRoute requireCompleteProfile={false}>
                  <ProfileCompletionPage />
                </ProtectedRoute>
              }
            />

            {/* General Profile Settings */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute requireCompleteProfile={false}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Coordinator Request Flow */}
            <Route
              path="/coordinator/request"
              element={
                <ProtectedRoute requireCompleteProfile={false}>
                  <CoordinatorRequestPage />
                </ProtectedRoute>
              }
            />

            {/* Event Explorer & Details */}
            <Route path="/events" element={<EventsExplorerPage />} />
            <Route
              path="/events/:id"
              element={
                <ProtectedRoute>
                  <EventDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id/attendance"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <EventAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/speakers/:id"
              element={
                <ProtectedRoute>
                  <SpeakerProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Coordinator Event Management */}
            <Route
              path="/coordinator/events/new"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <EventEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/events/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <EventEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/events/:id/attendees"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <EventAttendeesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/events/:id/attendance"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <EventAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/events/:id/live"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <LiveProjectorPage />
                </ProtectedRoute>
              }
            />

            {/* Role-Protected Portals - Student */}
            <Route
              path="/student/scan"
              element={
                <ProtectedRoute allowedRoles={['student', 'coordinator', 'admin']}>
                  <StudentScanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/events"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <EventsExplorerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute allowedRoles={['student', 'coordinator', 'admin']}>
                  <AttendanceHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/feedback"
              element={
                <ProtectedRoute allowedRoles={['student', 'coordinator', 'admin']}>
                  <FeedbackHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/points"
              element={
                <ProtectedRoute allowedRoles={['student', 'coordinator', 'admin']}>
                  <StudentPointsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/certificates"
              element={
                <ProtectedRoute allowedRoles={['student', 'coordinator', 'admin']}>
                  <StudentCertificatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/passport"
              element={
                <ProtectedRoute allowedRoles={['student', 'coordinator', 'admin']}>
                  <StudentPassportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Role-Protected Portals - Coordinator */}
            <Route
              path="/coordinator/attendance"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <CoordinatorAttendanceHubPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/materials"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <CoordinatorMaterialsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/rewards"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <CoordinatorRewardsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/sessions"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/*"
              element={
                <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Role-Protected Portals - Admin */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/venues"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/gallery"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/feedback"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

                  {/* Catch-all 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </RootLayout>
            </MaintenanceGuard>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </GlobalErrorBoundary>
</QueryClientProvider>
  );
}
