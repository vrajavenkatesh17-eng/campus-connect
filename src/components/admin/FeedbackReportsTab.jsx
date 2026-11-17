/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6: Anonymous Feedback Reports Component
 * Provides per-event and aggregate feedback analytics respecting absolute student anonymity.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import { adminService } from '../../services/adminService';
import { eventService } from '../../services/eventService';
import { useToast } from '../../context/ToastContext';
import { exportFeedbackReport } from '../../utils/reportExport';
import {
  ShieldCheck,
  Star,
  FileSpreadsheet,
  Download,
  MessageSquare,
  Sparkles,
  Filter,
  RefreshCw,
} from 'lucide-react';

export default function FeedbackReportsTab() {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch list of events for filter
  useEffect(() => {
    eventService
      .getAllEventsAdmin()
      .then((data) => setEvents(data || []))
      .catch((err) => console.error('Failed to load events for filter:', err));
  }, []);

  const fetchFeedbackReport = useCallback(async () => {
    try {
      const eventId = selectedEventId === 'all' ? null : selectedEventId;
      const data = await adminService.getFeedbackReport(eventId);
      setReportData(data);
    } catch (err) {
      console.error('Error fetching feedback report:', err);
      showToast(err.message || 'Failed to load anonymous feedback report.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedEventId, showToast]);

  useEffect(() => {
    setIsLoading(true);
    fetchFeedbackReport();
  }, [fetchFeedbackReport]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFeedbackReport();
  };

  const selectedEventTitle =
    selectedEventId === 'all'
      ? 'All College Sessions'
      : events.find((e) => e.id === selectedEventId)?.title || 'Selected Event';

  const handleExport = (format) => {
    try {
      if (!reportData) {
        showToast('No feedback data available to export.', 'warning');
        return;
      }
      exportFeedbackReport(reportData, selectedEventTitle, format);
      showToast(`Exported feedback report (${format.toUpperCase()}) successfully!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span>Anonymous Student Feedback Reports</span>
            <Badge variant="success" size="sm" className="gap-1 text-[10px]">
              <ShieldCheck className="w-3 h-3" /> 100% Anonymized
            </Badge>
          </h3>
          <p className="text-xs text-neutral-500">
            Student identities, emails, and register numbers are cryptographically excluded from all feedback responses
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
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => handleExport('excel')}
            className="text-xs gap-1"
          >
            Export Excel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => handleExport('pdf')}
            className="text-xs gap-1"
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filter by Event */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <span className="text-xs font-semibold text-neutral-700">Filter Event:</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="text-xs border border-neutral-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-burgundy max-w-xs sm:max-w-md truncate"
          >
            <option value="all">All Institutional Sessions (Overall)</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({new Date(evt.start_time).toLocaleDateString('en-IN')})
              </option>
            ))}
          </select>
        </div>

        <span className="text-[11px] text-neutral-400">
          Showing metrics for: <strong className="text-neutral-700">{selectedEventTitle}</strong>
        </span>
      </div>

      {/* Strict Anonymity Certification Notice */}
      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-emerald-900">Institutional Anonymity Guarantee</h4>
          <p className="text-emerald-800 leading-relaxed text-[11px]">
            In compliance with academic freedom and honest evaluation ethics, this feedback system decouples submitted ratings and constructive commentary from student user IDs. Neither coordinators nor administrators can trace opinions back to individual attendees.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs font-medium text-neutral-500">Aggregating anonymous feedback evaluations...</p>
        </div>
      ) : !reportData || reportData.total_submissions === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No Feedback Submissions Found"
          description={`There are currently no student feedback submissions recorded for ${selectedEventTitle}.`}
        />
      ) : (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Average Rating</p>
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                <span className="text-3xl font-bold text-neutral-900 font-mono">
                  {reportData.average_rating || '0.0'}
                </span>
                <span className="text-xs text-neutral-400">/ 5.0</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-2">Aggregated rating across all answers</p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Submissions</p>
              <p className="text-3xl font-bold text-indigo-700 mt-2 font-mono">
                {reportData.total_submissions || 0}
              </p>
              <p className="text-[11px] text-neutral-400 mt-2">Individual student evaluation forms</p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Evaluated Criteria</p>
              <p className="text-3xl font-bold text-emerald-700 mt-2 font-mono">
                {reportData.criteria_breakdown?.length || 0}
              </p>
              <p className="text-[11px] text-neutral-400 mt-2">Rubrics evaluated per feedback form</p>
            </Card>
          </div>

          {/* Criteria Breakdown */}
          {reportData.criteria_breakdown?.length > 0 && (
            <Card className="p-5">
              <CardHeader className="p-0 pb-4 border-b border-neutral-100">
                <CardTitle className="text-sm font-bold text-neutral-900">
                  Criteria-Wise Performance Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Average scores for each evaluation question
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {reportData.criteria_breakdown.map((crit) => (
                    <div
                      key={crit.question_key}
                      className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between"
                    >
                      <p className="text-xs font-semibold text-neutral-700 capitalize">
                        {crit.question_key.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-200/60">
                        <div className="flex items-center gap-1 text-amber-600 font-bold font-mono text-sm">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{crit.avg_score}</span>
                          <span className="text-[10px] text-neutral-400 font-normal">/ 5.0</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {crit.total_responses} responses
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Constructive Comments Table */}
          <Card>
            <CardHeader className="border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-burgundy" />
                    <span>Constructive Student Comments ({reportData.anonymous_comments?.length || 0})</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Qualitative feedback submitted by verified attendees without identifying metadata
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(!reportData.anonymous_comments || reportData.anonymous_comments.length === 0) ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No textual comments provided in submitted feedback.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {reportData.anonymous_comments.map((comm, i) => (
                    <div key={i} className="p-4 hover:bg-neutral-50/50 transition-colors space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                            {comm.event_title || selectedEventTitle}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{comm.rating} / 5</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-400">
                          {comm.created_at ? new Date(comm.created_at).toLocaleDateString('en-IN') : ''}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-800 leading-relaxed font-sans bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                        "{comm.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
