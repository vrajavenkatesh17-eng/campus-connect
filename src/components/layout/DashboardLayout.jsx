/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * DashboardLayout: Role-aware layout with sidebar conforming to DESIGN_SPEC sections 2 & 4.
 * - Students: NO sidebar (full width container).
 * - Coordinator & Admin: 264px sticky sidebar below top bar (top 88px), surface card radius 20, padding 12.
 * - Active: primary-soft background + primary text + 3px primary bar on left.
 * - Strictly NO user card inside sidebar.
 * - Strictly NO profile link inside sidebar.
 * - Group labels 12px uppercase muted.
 * - Off-canvas mobile drawer on smaller viewports (<1024px).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import Badge from '../common/Badge';
import Button from '../common/Button';
import PageContainer from '../common/PageContainer';
import PageHeader from '../common/PageHeader';
import PageEnter from '../motion/PageEnter';
import {
  Calendar,
  Award,
  BookOpen,
  Users,
  QrCode,
  BarChart3,
  MessageSquare,
  MapPin,
  History,
  Sliders,
  LayoutDashboard,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';

export default function DashboardLayout({ children, title, subtitle, actions }) {
  const { user, role, isProfileComplete } = useAuth();
  const location = useLocation();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [pendingPhotosCount, setPendingPhotosCount] = useState(0);

  // Fetch pending counts for admin sidebar badges
  useEffect(() => {
    if (role !== 'admin') return;
    let isMounted = true;

    Promise.all([
      supabase
        .from('coordinator_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('event_photos')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ])
      .then(([reqRes, evtRes, photoRes]) => {
        if (isMounted) {
          setPendingRequestsCount(reqRes.count || 0);
          setPendingEventsCount(evtRes.count || 0);
          setPendingPhotosCount(photoRes?.count || 0);
        }
      })
      .catch((err) => {
        console.warn('Sidebar badge count fetch warning:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [role]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  /**
   * Sidebar navigation groups definition strictly per DESIGN_SPEC sections 2 & 4:
   * - Students: none
   * - Coordinator: OVERVIEW (Overview), EVENTS (My Events, QR Attendance), ENGAGE (Reward Points, Learning Materials, Volunteers)
   * - Admin: OVERVIEW (Analytics & KPIs), MANAGE (User Management, Event Proposals, Venues & Capacity),
   *   INSIGHTS (Feedback Reports, Activity Logs), SYSTEM (Platform Settings)
   */
  const sidebarGroups = useMemo(() => {
    if (role === 'admin') {
      return [
        {
          title: 'Overview',
          items: [
            {
              label: 'Analytics & KPIs',
              path: '/admin/analytics',
              aliases: ['/admin'],
              icon: BarChart3,
            },
          ],
        },
        {
          title: 'Manage',
          items: [
            {
              label: 'User Management',
              path: '/admin/users',
              icon: Users,
              badge: pendingRequestsCount,
            },
            {
              label: 'Event Proposals',
              path: '/admin/events',
              icon: Calendar,
              badge: pendingEventsCount,
            },
            {
              label: 'Venues & Capacity',
              path: '/admin/venues',
              icon: MapPin,
            },
            {
              label: 'Public Gallery',
              path: '/admin/gallery',
              icon: ImageIcon,
              badge: pendingPhotosCount,
            },
          ],
        },
        {
          title: 'Insights',
          items: [
            {
              label: 'Feedback Reports',
              path: '/admin/feedback',
              icon: MessageSquare,
            },
            {
              label: 'Activity Logs',
              path: '/admin/logs',
              icon: History,
            },
          ],
        },
        {
          title: 'System',
          items: [
            {
              label: 'Platform Settings',
              path: '/admin/settings',
              icon: Sliders,
            },
          ],
        },
      ];
    }

    if (role === 'coordinator') {
      return [
        {
          title: 'Overview',
          items: [
            {
              label: 'Overview',
              path: '/coordinator',
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: 'Events',
          items: [
            {
              label: 'My Events',
              path: '/coordinator/sessions',
              aliases: ['/coordinator/events'],
              icon: Calendar,
            },
            {
              label: 'QR Attendance',
              path: '/coordinator/attendance',
              icon: QrCode,
            },
          ],
        },
        {
          title: 'Engage',
          items: [
            {
              label: 'Reward Points',
              path: '/coordinator/rewards',
              icon: Award,
            },
            {
              label: 'Learning Materials',
              path: '/coordinator/materials',
              icon: BookOpen,
            },
            {
              label: 'Volunteers',
              path: '/coordinator/volunteers',
              icon: Users,
            },
          ],
        },
      ];
    }

    // Students have NO sidebar per DESIGN_SPEC Section 2
    return [];
  }, [role, pendingRequestsCount, pendingEventsCount]);

  const hasSidebar = user && (role === 'coordinator' || role === 'admin');

  const isItemActive = (item) => {
    const current = location.pathname;
    if (current === item.path) return true;
    if (item.aliases && item.aliases.includes(current)) return true;
    if (item.path !== '/' && item.path !== '/admin' && current.startsWith(item.path + '/')) {
      return true;
    }
    return false;
  };

  // Render the core navigation item list
  const renderNavList = () => (
    <div className="space-y-4">
      {sidebarGroups.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold px-3 py-1">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center justify-between h-11 px-3 rounded-[12px] text-sm font-medium transition-colors select-none ${
                    active
                      ? 'bg-primary-soft text-primary font-semibold'
                      : 'text-muted hover:text-ink hover:bg-surface-2'
                  }`}
                >
                  {/* Active 3px primary bar on left */}
                  {active && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-r-full"
                      aria-hidden="true"
                    />
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-5 h-5 shrink-0 transition-colors" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {/* Count badge on the right (pending items) */}
                  {item.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-on-primary shrink-0 shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* Profile Incomplete Banner - Students Only */}
      {user && role === 'student' && !isProfileComplete && location.pathname !== '/profile' && location.pathname !== '/profile/complete' && (
        <div className="bg-warning-soft border-b border-warning/25 px-4 py-3 sm:px-6">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-warning font-medium">
              <AlertCircle className="w-4 h-4 text-warning shrink-0" />
              <span>Please complete your profile details (Department & Register Number) to enable event registrations.</span>
            </div>
            <Link
              to="/profile/complete"
              className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
            >
              Complete Profile →
            </Link>
          </div>
        </div>
      )}

      <PageContainer className="flex-1 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop Sidebar (Rendered only for coordinator and admin, 264px width, sticky top 88px) */}
          {hasSidebar && (
            <aside className="hidden lg:block w-[264px] shrink-0 sticky top-[88px]">
              <div className="bg-surface border border-line rounded-[20px] p-3 shadow-xs dark:shadow-none">
                {renderNavList()}
              </div>
            </aside>
          )}

          {/* Mobile/Tablet Sidebar Drawer Trigger (<1024px for Coordinator & Admin) */}
          {hasSidebar && (
            <div className="lg:hidden w-full flex items-center justify-between bg-surface border border-line rounded-[14px] p-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <span>{role} Navigation</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold"
                aria-label="Toggle Dashboard Menu"
                aria-expanded={isMobileSidebarOpen}
              >
                {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span>{isMobileSidebarOpen ? 'Close Menu' : 'Menu'}</span>
              </Button>
            </div>
          )}

          {/* Off-canvas Drawer for Mobile/Tablet (<1024px) */}
          {hasSidebar && isMobileSidebarOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard Section Navigation"
              className="lg:hidden w-full bg-surface border border-line rounded-[20px] p-4 shadow-md animate-in slide-in-from-top-2 space-y-4"
            >
              {renderNavList()}
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 w-full space-y-6">
            {title && (
              <PageHeader title={title} subtitle={subtitle} actions={actions} />
            )}
            <PageEnter key={location.pathname}>
              {children}
            </PageEnter>
          </main>
        </div>
      </PageContainer>
    </div>
  );
}
