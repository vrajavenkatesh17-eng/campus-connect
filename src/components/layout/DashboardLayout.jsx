import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';
import {
  Calendar,
  Award,
  BookOpen,
  Users,
  QrCode,
  CheckCircle,
  FileText,
  BarChart3,
  Settings,
  AlertCircle,
  LayoutDashboard,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

export default function DashboardLayout({ children, title, subtitle, actions }) {
  const { user, profile, role, isProfileComplete } = useAuth();
  const location = useLocation();

  const getNavLinks = () => {
    if (role === 'admin') {
      return [
        { label: 'Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'Manage Users & Roles', path: '/admin/users', icon: Users },
        { label: 'All Events', path: '/admin/events', icon: Calendar },
        { label: 'Venues & Capacity', path: '/admin/venues', icon: MapPin },
        { label: 'Analytics & Reports', path: '/admin/analytics', icon: BarChart3 },
      ];
    }
    if (role === 'coordinator') {
      return [
        { label: 'Coordinator Hub', path: '/coordinator', icon: LayoutDashboard },
        { label: 'My Sessions', path: '/coordinator/sessions', icon: Calendar },
        { label: 'QR Attendance', path: '/coordinator/attendance', icon: QrCode },
        { label: 'Reward Points', path: '/coordinator/rewards', icon: Award },
        { label: 'Learning Materials', path: '/coordinator/materials', icon: BookOpen },
      ];
    }
    // Default student
    return [
      { label: 'Student Home', path: '/student', icon: LayoutDashboard },
      { label: 'Explore Events', path: '/events', icon: Calendar },
      { label: 'My Attendance', path: '/student/attendance', icon: CheckCircle },
      { label: 'My Feedback', path: '/student/feedback', icon: MessageSquare },
      { label: 'Reward Points', path: '/student/points', icon: Award },
      { label: 'Certificates', path: '/student/certificates', icon: FileText },
      { label: 'Achievement Passport', path: '/student/passport', icon: Sparkles },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Navbar />

      {/* Profile Incomplete Banner - Students Only */}
      {user && role === 'student' && !isProfileComplete && location.pathname !== '/profile' && location.pathname !== '/profile/complete' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-amber-800 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Please complete your profile details (Department & Register Number) to enable event registrations.</span>
            </div>
            <Link
              to="/profile/complete"
              className="text-xs font-semibold uppercase tracking-wider text-burgundy hover:underline"
            >
              Complete Profile →
            </Link>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs sticky top-24">
              {/* User mini summary */}
              <div className="pb-4 mb-4 border-b border-neutral-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-burgundy-50 border border-burgundy-200 flex items-center justify-center text-burgundy font-bold text-sm">
                  {profile?.name ? profile.name[0].toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {profile?.name || 'Logged In User'}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Navigation links */}
              <nav className="space-y-1">
                {navLinks.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-burgundy text-white shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 mt-4 border-t border-neutral-100">
                <Link
                  to="/profile"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-burgundy text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Profile Settings</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Header / Title block */}
            {(title || actions) && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  {title && (
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
                  )}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
            )}

            {children}
          </main>
        </div>
      </div>

      {/* Institutional Footer Watermark */}
      <footer className="mt-auto border-t border-neutral-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
          <p>Francis Xavier Engineering College • Campus Connect System</p>
          <p className="text-[11px] text-neutral-400">
            Architected & Patented by <span className="font-semibold text-neutral-700">Krish & Ihsan</span> • All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
