import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import {
  MessageSquare,
  CheckCircle2,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function FeedbackHistoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getStudentFeedbackHistory();
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error loading feedback history:', err);
      showToast(err.message || 'Failed to load feedback history.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted">Loading your feedback submissions...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="My Feedback Submissions"
      subtitle={`History of guest lectures for which you contributed ratings • ${submissions.length} Reviews Submitted`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSubmissions}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          <Link to="/student/attendance">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs">
              View Attendance
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <EmptyState
          title="No Feedback Submitted Yet"
          description="Once you attend a session and complete the feedback form, your submission record will appear here."
          action={
            <Link to="/student/attendance">
              <Button variant="primary" size="sm">
                Go to Attendance History
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {submissions.map((item) => {
            const ev = item.event || {};
            return (
              <Card key={item.id} className="p-4 flex flex-col justify-between hover:border-line transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="burgundy" size="sm" className="capitalize">
                      {ev.category?.replace('_', ' ') || 'Event'}
                    </Badge>
                    <Badge variant="success" size="sm" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Submitted
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-ink line-clamp-1">
                      {ev.title || 'Untitled Session'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-muted" />
                      <span className="truncate">{ev.venue?.name || ev.custom_venue || 'FXEC Campus'}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-surface-2 border border-line p-2.5 text-xs text-muted space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">Event Date:</span>
                      <span className="font-medium text-ink">
                        {ev.start_time ? new Date(ev.start_time).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">Submitted At:</span>
                      <span className="font-mono text-xs text-muted">
                        {new Date(item.submitted_at).toLocaleDateString()} {new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-line flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Identity Protected</span>
                  </div>

                  <Link
                    to={`/events/${ev.id}`}
                    className="text-xs font-semibold text-muted hover:text-primary flex items-center gap-1"
                  >
                    <span>View Event</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
