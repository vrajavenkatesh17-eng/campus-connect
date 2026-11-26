/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6: Admin Analytics Dashboard Component with Recharts Visualizations
 * and Multi-Format PDF/Excel Export Capabilities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import {
  exportParticipationReport,
  exportPointsReport,
} from '../../utils/reportExport';
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Star,
  Trophy,
  Award,
  Sparkles,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export default function AnalyticsTab() {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      showToast(err.message || 'Failed to load live analytics data.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics();
  };

  const handleExportParticipation = (format) => {
    try {
      if (!analytics?.department_participation?.length) {
        showToast('No department participation data available to export.', 'warning');
        return;
      }
      exportParticipationReport(analytics.department_participation, format);
      showToast(`Exported department participation (${format.toUpperCase()}) successfully!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleExportLeaderboard = (format) => {
    try {
      if (!analytics?.top_active_students?.length) {
        showToast('No student leaderboard data available to export.', 'warning');
        return;
      }
      exportPointsReport(analytics.top_active_students, format);
      showToast(`Exported student points leaderboard (${format.toUpperCase()}) successfully!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-medium text-muted">
          Aggregating real institutional analytics across events, attendance, and feedback...
        </p>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const deptParticipation = analytics?.department_participation || [];
  const eventRates = analytics?.event_attendance_rates || [];
  const monthlyTrend = analytics?.monthly_trend || [];
  const feedbackSummary = analytics?.feedback_summary || {};
  const topStudents = analytics?.top_active_students || [];

  return (
    <div className="space-y-8">
      {/* Top Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h3 className="text-lg font-bold text-ink flex items-center gap-2">
            <span>Institutional Event Analytics</span>
            <span className="text-xs bg-surface-2 text-muted px-2 py-0.5 rounded-full font-mono font-normal">
              Live SQL Compute
            </span>
          </h3>
          <p className="text-xs text-muted">
            Real-time verified metrics computed via security-definer views with strict administrative isolation
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="text-xs"
          >
            Refresh
          </Button>

          {/* Department Participation Exports */}
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => handleExportParticipation('excel')}
            className="text-xs gap-1"
          >
            Dept Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => handleExportParticipation('pdf')}
            className="text-xs gap-1"
          >
            Dept PDF
          </Button>

          {/* Leaderboard Exports */}
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => handleExportLeaderboard('pdf')}
            className="text-xs gap-1"
          >
            Merit PDF
          </Button>
        </div>
      </div>

      {/* 1. Real KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Enrolled Students</p>
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-ink mt-2 font-mono">
            {summary.total_students ?? 0}
          </p>
          <p className="text-xs text-muted mt-1">Verified FXEC profiles</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Faculty Coordinators</p>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-ink mt-2 font-mono">
            {summary.total_coordinators ?? 0}
          </p>
          <p className="text-xs text-muted mt-1">Authorized organizers</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Ongoing Sessions</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2 font-mono">
            {summary.ongoing_events ?? 0}
          </p>
          <p className="text-xs text-muted mt-1">Active right now</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Upcoming Events</p>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-2 font-mono">
            {summary.upcoming_events ?? 0}
          </p>
          <p className="text-xs text-muted mt-1">Scheduled & approved</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Completed Sessions</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-800 mt-2 font-mono">
            {summary.completed_events ?? 0}
          </p>
          <p className="text-xs text-muted mt-1">{summary.total_attendance ?? 0} total verified attendees</p>
        </Card>
      </div>

      {/* 2. Charts Row 1: Department Participation & Event Attendance Percentage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Participation Bar Chart */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-4 border-b border-line">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-ink">
                  Department-wise Participation Matrix
                </CardTitle>
                <CardDescription className="text-xs">
                  Comparison of event registrations versus verified attendance across college branches
                </CardDescription>
              </div>
              <Badge variant="default" size="sm">Registrations vs Attended</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            {deptParticipation.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-muted">
                No department participation data available yet.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptParticipation} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--line))" />
                    <XAxis
                      dataKey="department_code"
                      tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(var(--surface))',
                        border: '1px solid rgb(var(--line))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'rgb(var(--ink))',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="registration_count" name="Registered" fill="rgb(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attendance_count" name="Attended" fill="rgb(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Attendance Rate Bar Chart */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-4 border-b border-line">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-ink">
                  Event-Wise Attendance Percentage
                </CardTitle>
                <CardDescription className="text-xs">
                  Verified show-up percentage per session relative to student registrations
                </CardDescription>
              </div>
              <Badge variant="success" size="sm">Attendance %</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            {eventRates.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-muted">
                No event attendance records registered yet.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventRates} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--line))" />
                    <XAxis
                      dataKey="title"
                      tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }}
                      tickFormatter={(val) => (val && val.length > 12 ? `${val.slice(0, 10)}...` : val)}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} unit="%" />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Attendance Rate']}
                      labelFormatter={(label) => `Event: ${label}`}
                      contentStyle={{
                        backgroundColor: 'rgb(var(--surface))',
                        border: '1px solid rgb(var(--line))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'rgb(var(--ink))',
                      }}
                    />
                    <Bar dataKey="attendance_pct" name="Turnout %" fill='rgb(var(--primary))' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Charts Row 2: 6-Month Activity Trend & Anonymous Feedback Ratings Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Events & Attendance Trend */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-4 border-b border-line">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-ink">
                  Monthly Event & Attendance Volume (6 Months)
                </CardTitle>
                <CardDescription className="text-xs">
                  Institutional timeline showing growth in guest lectures and participation
                </CardDescription>
              </div>
              <Badge variant="default" size="sm">Volume Trend</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            {monthlyTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-muted">
                No monthly timeline data accumulated yet.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor='rgb(var(--primary))' stopOpacity={0.4} />
                        <stop offset="95%" stopColor='rgb(var(--primary))' stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(var(--info))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="rgb(var(--info))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--line))" />
                    <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(var(--surface))',
                        border: '1px solid rgb(var(--line))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'rgb(var(--ink))',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="events_count"
                      name="Sessions Hosted"
                      stroke='rgb(var(--primary))'
                      fillOpacity={1}
                      fill="url(#eventGrad)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="attendance_count"
                      name="Verified Attendees"
                      stroke="rgb(var(--info))"
                      fillOpacity={1}
                      fill="url(#attGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Ratings Distribution & Average */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-4 border-b border-line">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-ink">
                  Student Feedback Rating Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Overall institutional satisfaction across anonymous event submissions
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-bold text-sm font-mono">{feedbackSummary.average_rating || '0.0'}</span>
                <span className="text-xs text-amber-700">/ 5.0</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={feedbackSummary.distribution || []}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--line))" />
                  <XAxis
                    dataKey="rating"
                    tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }}
                    tickFormatter={(val) => `${val} Star${val > 1 ? 's' : ''}`}
                  />
                  <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val) => [val, 'Submissions']}
                    labelFormatter={(label) => `${label} Star Reviews`}
                    contentStyle={{
                      backgroundColor: 'rgb(var(--surface))',
                      border: '1px solid rgb(var(--line))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'rgb(var(--ink))',
                    }}
                  />
                  <Bar dataKey="count" name="Ratings" fill="rgb(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted text-center mt-2">
              Derived from {feedbackSummary.total_responses || 0} anonymous criterion evaluations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Most Active Students Leaderboard Card */}
      <Card>
        <CardHeader className="border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Most Active Students (Top 10 Institutional Merit)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Based on verified event attendances and coordinator-awarded bonus interaction points
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => handleExportLeaderboard('excel')}
            className="text-xs gap-1 self-start sm:self-auto"
          >
            Export Excel
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {topStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              No student activity or points recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-muted border-b border-line uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Events Attended</th>
                    <th className="py-3 px-4 text-right">Accumulated Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {topStudents.map((stu, i) => (
                    <tr key={stu.student_name + i} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-ink">
                        {i === 0 && <span className="inline-block mr-1">🥇</span>}
                        {i === 1 && <span className="inline-block mr-1">🥈</span>}
                        {i === 2 && <span className="inline-block mr-1">🥉</span>}
                        #{i + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-ink">
                        {stu.student_name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" size="sm" className="font-mono">
                          {stu.department_code}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-emerald-700">
                        {stu.events_attended} sessions
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                        {stu.total_points} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
