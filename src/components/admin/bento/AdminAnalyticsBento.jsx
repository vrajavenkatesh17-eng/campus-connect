/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6B & Step S-G: Institutional Analytics & Governance Bento
 * Conforms strictly to DESIGN_SPEC v2 Section 4:
 * 1. PageHeader: Title in Fraunces, subtitle, date range picker (AppSelect), Export button (AppButton)
 * 2. ONE KPI Strip: Total Users, Total Events, Total Registrations, Avg Occupancy, Pending Requests (all Counter)
 * 3. MagicBento (4 columns, rowHeight 260) in the exact order:
 *    - Trend (colSpan 2, rowSpan 2)
 *    - Capacity (colSpan 1, rowSpan 1)
 *    - Lifecycle (colSpan 1, rowSpan 2)
 *    - Demographics (colSpan 1, rowSpan 1)
 *    - Departments (colSpan 2, rowSpan 1)
 *    - Faculty (colSpan 1, rowSpan 1)
 *    - Feedback (colSpan 1, rowSpan 1)
 * 4. Collapsible "Detailed data" accordion with department matrix and event registration audit.
 * 100% real Supabase data with strict admin authorization.
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ChartLineData01Icon,
  PieChartIcon,
  Calendar03Icon,
  BarChartIcon,
  UserGroupIcon,
  TrophyIcon,
  StarIcon,
} from '@hugeicons/core-free-icons';

import MagicBento from '../../MagicBento/MagicBento';
import './BentoCustomVisuals.css';

import RegistrationsTrendVisual from './RegistrationsTrendVisual';
import SeatOccupancyVisual from './SeatOccupancyVisual';
import SessionsByStatusVisual from './SessionsByStatusVisual';
import DepartmentParticipationBentoVisual from './DepartmentParticipationBentoVisual';
import UsersByRoleVisual from './UsersByRoleVisual';
import ActiveCoordinatorsVisual from './ActiveCoordinatorsVisual';
import FeedbackRatingVisual from './FeedbackRatingVisual';
import BentoSkeleton from './BentoSkeleton';
import BentoErrorState from './BentoErrorState';

import PageHeader from '../../common/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../common/Card';
import Counter from '../../ui/Counter/Counter';
import AppButton from '../../app/AppButton';
import AppSelect from '../../app/AppSelect';
import { adminService } from '../../../services/adminService';
import { useToast } from '../../../context/ToastContext';
import { useTheme } from '../../../context/ThemeContext';
import { Download, ChevronDown, ChevronUp, Calendar, Users, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminAnalyticsBento({ coordinatorRequestsCount = 0 }) {
  const { showToast } = useToast();
  const { resolvedTheme } = useTheme();
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [dateRange, setDateRange] = useState('all');

  // TanStack Query for single-RPC live analytics caching
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['adminDashboardStats', dateRange],
    queryFn: () => adminService.getDashboardStats(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Export Analytics CSV Handler
  const handleExportCSV = () => {
    try {
      const depts = stats?.department_participation || [];
      if (depts.length === 0) {
        showToast('No department data available to export.', 'warning');
        return;
      }
      const headers = ['Department Code', 'Department Name', 'Student Registrations'];
      const rows = depts.map((d) => [d.code, `"${d.name}"`, d.count]);
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `fxec_campus_connect_analytics_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Institutional analytics report exported successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to export CSV report.', 'error');
    }
  };

  // Bento tile items in exact DESIGN_SPEC order:
  // Trend (2x2), Capacity (1x1), Lifecycle (1x2), Demographics (1x1), Departments (2x1), Faculty (1x1), Feedback (1x1)
  const items = useMemo(() => {
    if (!stats) return [];

    return [
      // Tile 1: Registrations trend (colSpan 2, rowSpan 2)
      {
        id: 'registrations-trend',
        title: 'Registrations Trend',
        description: 'Turnout curve with interactive cursor scrub',
        icon: <HugeiconsIcon icon={ChartLineData01Icon} size={16} strokeWidth={2} />,
        label: 'Trend',
        colSpan: 2,
        rowSpan: 2,
        visual: (
          <RegistrationsTrendVisual
            monthlyData={stats.registrations_trend}
            eventData={stats.event_registrations}
          />
        ),
      },

      // Tile 2: Seat occupancy (colSpan 1, rowSpan 1)
      {
        id: 'seat-occupancy',
        title: 'Seat Occupancy',
        icon: <HugeiconsIcon icon={PieChartIcon} size={16} strokeWidth={2} />,
        label: 'Capacity',
        colSpan: 1,
        rowSpan: 1,
        visual: <SeatOccupancyVisual data={stats.seat_occupancy} />,
      },

      // Tile 3: Sessions by status (colSpan 1, rowSpan 2) - Lifecycle
      {
        id: 'sessions-by-status',
        title: 'Event Lifecycle',
        icon: <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={2} />,
        label: 'Lifecycle',
        colSpan: 1,
        rowSpan: 2,
        visual: <SessionsByStatusVisual data={stats.sessions_by_status} />,
      },

      // Tile 4: Users by role (colSpan 1, rowSpan 1) - Demographics
      {
        id: 'users-by-role',
        title: 'Users by Role',
        icon: <HugeiconsIcon icon={UserGroupIcon} size={16} strokeWidth={2} />,
        label: 'Demographics',
        colSpan: 1,
        rowSpan: 1,
        visual: <UsersByRoleVisual data={stats.users_by_role} />,
      },

      // Tile 5: Department participation (colSpan 2, rowSpan 1) - Departments
      {
        id: 'department-participation',
        title: 'Department Participation',
        description: 'Verified student participation across academic departments',
        icon: <HugeiconsIcon icon={BarChartIcon} size={16} strokeWidth={2} />,
        label: 'Departments',
        colSpan: 2,
        rowSpan: 1,
        visual: (
          <DepartmentParticipationBentoVisual data={stats.department_participation} />
        ),
      },

      // Tile 6: Active coordinators (colSpan 1, rowSpan 1) - Faculty
      {
        id: 'active-coordinators',
        title: 'Active Coordinators',
        icon: <HugeiconsIcon icon={TrophyIcon} size={16} strokeWidth={2} />,
        label: 'Faculty',
        colSpan: 1,
        rowSpan: 1,
        visual: <ActiveCoordinatorsVisual data={stats.active_coordinators} />,
      },

      // Tile 7: Feedback rating (colSpan 1, rowSpan 1) - Feedback
      {
        id: 'feedback-rating',
        title: 'Feedback Quality',
        icon: <HugeiconsIcon icon={StarIcon} size={16} strokeWidth={2} />,
        label: 'Feedback',
        colSpan: 1,
        rowSpan: 1,
        visual: <FeedbackRatingVisual data={stats.feedback_rating} />,
      },
    ];
  }, [stats]);

  if (isLoading) {
    return <BentoSkeleton />;
  }

  if (isError) {
    return <BentoErrorState error={error} onRetry={() => refetch()} />;
  }

  const dynamicGlowColor = 'rgb(var(--primary))';

  // Metrics for ONE KPI strip
  const totalUsers = stats?.users_by_role?.total || 0;
  const totalSessions = stats?.sessions_by_status?.total || 0;
  const totalRegistrations = stats?.seat_occupancy?.filled_seats || 0;
  const avgOccupancy = Math.round(Number(stats?.seat_occupancy?.occupancy_pct) || 0);
  const pendingRequests =
    (stats?.sessions_by_status?.pending || 0) + (Number(coordinatorRequestsCount) || 0);

  return (
    <div className="space-y-8">
      {/* 1. PageHeader with date range (AppSelect) and Export button (AppButton) */}
      <PageHeader
        title="Institutional Analytics & Governance"
        subtitle="Francis Xavier Engineering College • Real-time event turnout, seat utilization, and departmental metrics"
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-48">
              <AppSelect
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                options={[
                  { value: 'all', label: 'All Academic Periods' },
                  { value: 'current_year', label: 'AY 2025-2026' },
                  { value: 'last_6m', label: 'Last 6 Months' },
                  { value: 'this_semester', label: 'Current Semester' },
                ]}
              />
            </div>

            <AppButton
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Export CSV</span>
            </AppButton>
          </div>
        }
      />

      {/* 2. ONE KPI Strip (5 cards) with Counter numbers */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Users */}
        <Card className="p-4 bg-surface border-line shadow-xs">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">Total Users</p>
          <p className="text-3xl font-extrabold text-ink tabular-nums mt-1.5 mb-1">
            <Counter value={totalUsers} />
          </p>
          <p className="text-xs text-muted font-normal">
            {stats?.users_by_role?.students || 0} students • {stats?.users_by_role?.coordinators || 0} faculty
          </p>
        </Card>

        {/* Card 2: Total Sessions */}
        <Card className="p-4 bg-surface border-line shadow-xs">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">Total Events</p>
          <p className="text-3xl font-extrabold text-ink tabular-nums mt-1.5 mb-1">
            <Counter value={totalSessions} />
          </p>
          <p className="text-xs text-muted font-normal">
            {stats?.sessions_by_status?.approved || 0} active • {stats?.sessions_by_status?.completed || 0} ended
          </p>
        </Card>

        {/* Card 3: Total Registrations */}
        <Card className="p-4 bg-surface border-line shadow-xs">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">Registrations</p>
          <p className="text-3xl font-extrabold text-primary tabular-nums mt-1.5 mb-1">
            <Counter value={totalRegistrations} />
          </p>
          <p className="text-xs text-muted font-normal">Confirmed student bookings</p>
        </Card>

        {/* Card 4: Avg Occupancy */}
        <Card className="p-4 bg-surface border-line shadow-xs">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">Avg Occupancy</p>
          <p className="text-3xl font-extrabold text-success tabular-nums mt-1.5 mb-1">
            <Counter value={avgOccupancy} />%
          </p>
          <p className="text-xs text-muted font-normal">Hall capacity utilization</p>
        </Card>

        {/* Card 5: Pending Requests */}
        <Card className="p-4 bg-surface border-line shadow-xs col-span-2 md:col-span-1">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">Pending Clearances</p>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-1.5 mb-1">
            <Counter value={pendingRequests} />
          </p>
          <p className="text-xs text-muted font-normal">Events & coordinator roles</p>
        </Card>
      </div>

      {/* 3. MagicBento Grid Layout (4 columns, rowHeight 260) */}
      <MagicBento
        items={items}
        columns={4}
        rowHeight={260}
        gap={14}
        radius={20}
        theme={resolvedTheme || 'light'}
        glowColor={dynamicGlowColor}
        enableBorderGlow={true}
        enableSpotlight={true}
        spotlightRadius={300}
        clickEffect={true}
        intro={true}
        enableStars={false}
        enableTilt={false}
        enableMagnetism={false}
      />

      {/* 4. Collapsible Detailed Data Accordion (Department Matrix & Events Audit) */}
      <Card className="border-line shadow-xs">
        <CardHeader className="border-b border-line flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle>Detailed Institutional Data & Turnout Matrix</CardTitle>
            <CardDescription>
              Department breakdown and verified session turnout records across Francis Xavier Engineering College
            </CardDescription>
          </div>
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => setIsTableExpanded(!isTableExpanded)}
            className="text-xs gap-1 text-muted hover:text-primary"
          >
            {isTableExpanded ? (
              <>
                <span>Collapse Data</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Expand Full Data</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </AppButton>
        </CardHeader>

        {isTableExpanded && (
          <CardContent className="p-0 divide-y divide-line">
            {/* Table 1: Department Participation Matrix */}
            <div className="p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Department Participation Breakdown
              </h4>
              <div className="overflow-x-auto rounded-[12px] border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2 text-muted border-b border-line uppercase font-semibold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Department Code</th>
                      <th className="py-2.5 px-4">Department Name</th>
                      <th className="py-2.5 px-4 text-right">Student Registrations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    {(stats?.department_participation || []).map((d) => (
                      <tr key={d.code} className="hover:bg-surface-2/50 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-ink">{d.code}</td>
                        <td className="py-2.5 px-4 text-muted">{d.name}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-primary tabular-nums">
                          {d.count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Recent Events Registration Audit */}
            {Array.isArray(stats?.event_registrations) && stats.event_registrations.length > 0 && (
              <div className="p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Event Registration Turnout Audit
                </h4>
                <div className="overflow-x-auto rounded-[12px] border border-line">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-2 text-muted border-b border-line uppercase font-semibold tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Event Title</th>
                        <th className="py-2.5 px-4 text-right">Confirmed Registrations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-ink">
                      {stats.event_registrations.map((evt, idx) => (
                        <tr key={idx} className="hover:bg-surface-2/50 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-ink">{evt.title}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-primary tabular-nums">
                            {evt.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
