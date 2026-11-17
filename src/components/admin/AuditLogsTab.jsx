/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6: Activity Audit Logs Component
 * Append-only immutable log viewer filterable by action, actor, and date range.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  RotateCcw,
  RefreshCw,
  FileText,
  User,
  Info,
} from 'lucide-react';

const ACTION_OPTIONS = [
  { value: 'all', label: 'All System Actions' },
  { value: 'EVENT_APPROVED', label: 'Event Approved' },
  { value: 'EVENT_REJECTED', label: 'Event Rejected' },
  { value: 'EVENT_CANCELLED', label: 'Event Cancelled' },
  { value: 'ROLE_APPROVED', label: 'Coordinator Role Approved' },
  { value: 'ROLE_REJECTED', label: 'Coordinator Role Rejected' },
  { value: 'USER_DEACTIVATED', label: 'User Deactivated' },
  { value: 'USER_REACTIVATED', label: 'User Reactivated' },
  { value: 'POINTS_AWARDED', label: 'Points Awarded' },
  { value: 'POINTS_CORRECTED', label: 'Points Corrected' },
  { value: 'attendance_manual_marked', label: 'Attendance Override (Marked)' },
  { value: 'attendance_manual_removed', label: 'Attendance Override (Removed)' },
  { value: 'SETTINGS_UPDATED', label: 'Settings Updated' },
  { value: 'ADMIN_ALLOWLIST_ADD', label: 'Admin Allowlist Add' },
  { value: 'COORDINATOR_ALLOWLIST_ADD', label: 'Coordinator Allowlist Add' },
];

export default function AuditLogsTab() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [actionFilter, setActionFilter] = useState('all');
  const [actorSearch, setActorSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(100);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await adminService.getActivityLogs({
        limit,
        action: actionFilter === 'all' ? null : actionFilter,
        actor: actorSearch.trim() || null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(`${endDate}T23:59:59.999Z`).toISOString() : null,
      });
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      showToast(err.message || 'Failed to load system audit logs.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [actionFilter, actorSearch, startDate, endDate, limit, showToast]);

  useEffect(() => {
    setIsLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setActionFilter('all');
    setActorSearch('');
    setStartDate('');
    setEndDate('');
    setLimit(100);
  };

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('APPROVED') || act.includes('REACTIVATED') || act.includes('POINTS_AWARDED')) {
      return (
        <Badge variant="success" size="sm" className="font-mono text-[10px]">
          {action}
        </Badge>
      );
    }
    if (act.includes('REJECTED') || act.includes('DEACTIVATED') || act.includes('CANCELLED') || act.includes('CORRECTED')) {
      return (
        <Badge variant="danger" size="sm" className="font-mono text-[10px]">
          {action}
        </Badge>
      );
    }
    if (act.includes('ATTENDANCE')) {
      return (
        <Badge variant="info" size="sm" className="font-mono text-[10px]">
          {action}
        </Badge>
      );
    }
    return (
      <Badge variant="default" size="sm" className="font-mono text-[10px]">
        {action}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span>Institutional Activity & Audit Logs</span>
            <Badge variant="outline" size="sm" className="gap-1 text-[10px] bg-neutral-50">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Append-Only Immutable
            </Badge>
          </h3>
          <p className="text-xs text-neutral-500">
            Cryptographic ledger tracking administrative approvals, role elevations, cancellations, points, and overrides
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleClearFilters}
            className="text-xs gap-1"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Append-Only Security Notice */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">PostgreSQL Security Definer & RLS Enforced:</span>
          <p className="text-amber-800 text-[11px] leading-relaxed">
            This activity log is strictly append-only. Zero UPDATE or DELETE policies are granted to any user role, ensuring an indelible institutional audit trail for accreditation (NBA / NAAC).
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              Action Category
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-burgundy"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actor Search */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              Search Actor (Name / Email)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. John or admin@fxec..."
                value={actorSearch}
                onChange={(e) => setActorSearch(e.target.value)}
                className="w-full text-xs border border-neutral-300 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-hidden focus:border-burgundy"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-burgundy"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-burgundy"
            />
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs font-medium text-neutral-500">Retrieving tamper-proof audit log entries...</p>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Audit Logs Found"
          description="No activity log entries match the selected action, actor, or date criteria."
        />
      ) : (
        <Card>
          <CardHeader className="border-b border-neutral-100 flex items-center justify-between py-3 px-4">
            <span className="text-xs font-semibold text-neutral-700">
              Showing {logs.length} logged events
            </span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span>Limit:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="text-xs border border-neutral-300 rounded px-1.5 py-0.5"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp (IST)</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target Entity</th>
                    <th className="py-2.5 px-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-3 font-mono text-neutral-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span>
                            {new Date(log.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-[10px] text-neutral-700 shrink-0">
                            {log.actor_name ? log.actor_name[0] : 'S'}
                          </div>
                          <div className="overflow-hidden max-w-[160px]">
                            <p className="font-semibold text-neutral-900 truncate">{log.actor_name}</p>
                            <p className="text-[10px] text-neutral-400 truncate">{log.actor_email}</p>
                          </div>
                          <Badge variant="outline" size="sm" className="uppercase text-[9px] px-1 py-0 font-mono">
                            {log.actor_role}
                          </Badge>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Target Entity */}
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-600">
                        <span className="capitalize font-semibold text-neutral-800">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="text-[10px] text-neutral-400 block truncate max-w-[120px]">
                            {log.entity_id}
                          </span>
                        )}
                      </td>

                      {/* Audit Details */}
                      <td className="py-3 px-3 text-[11px] text-neutral-700 max-w-xs">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <div className="bg-neutral-50 p-2 rounded border border-neutral-100 font-mono text-[10px] space-y-0.5 overflow-hidden">
                            {Object.entries(log.metadata).map(([k, v]) => (
                              <div key={k} className="truncate">
                                <span className="font-semibold text-neutral-600">{k}:</span>{' '}
                                <span className="text-neutral-800">
                                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">No metadata attached</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
