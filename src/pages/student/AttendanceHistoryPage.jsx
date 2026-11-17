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
import FeedbackModal from '../../components/feedback/FeedbackModal';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Shield,
  MessageSquare,
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [history, setHistory] = useState([]);
  const [submittedFeedbackMap, setSubmittedFeedbackMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventForFeedback, setSelectedEventForFeedback] = useState(null);

  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      const records = await attendanceService.getStudentAttendanceHistory();
      setHistory(records || []);

      // Check feedback submission status for each attended event
      const feedbackMap = new Map();
      await Promise.all(
        (records || []).map(async (rec) => {
          if (rec.event?.id) {
            const hasSubmitted = await attendanceService.hasSubmittedFeedback(rec.event.id);
            feedbackMap.set(rec.event.id, hasSubmitted);
          }
        })
      );
      setSubmittedFeedbackMap(feedbackMap);
    } catch (err) {
      console.error('Error loading student attendance history:', err);
      showToast(err.message || 'Failed to load attendance history.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">Loading your verified attendance history...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="My Attendance History"
      subtitle={`Official record of verified guest lecture attendances • ${history.length} Sessions Attended`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAttendance}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          <Link to="/events">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Explore Events
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">

      {/* Attendance List */}
      {history.length === 0 ? (
        <EmptyState
          title="No Attended Sessions Yet"
          description="When you attend an event and scan the coordinator's rotating QR code, your attendance will appear here."
          action={
            <Link to="/events">
              <Button variant="primary" size="sm">
                Browse Upcoming Events
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((item) => {
            const ev = item.event || {};
            const isEventEnded = ev.end_time
              ? new Date(ev.end_time) <= new Date() || ev.status === 'completed'
              : false;
            const hasSubmittedFeedback = submittedFeedbackMap.get(ev.id);

            return (
              <Card key={item.id} className="p-4 flex flex-col justify-between hover:border-neutral-300 transition-colors">
                <div className="space-y-3">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="burgundy" size="sm" className="capitalize">
                      {ev.category?.replace('_', ' ') || 'Event'}
                    </Badge>
                    <Badge variant="success" size="sm" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </Badge>
                  </div>

                  {/* Title & Venue */}
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 line-clamp-1">
                      {ev.title || 'Untitled Session'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                      <span className="truncate">{ev.venue?.name || ev.custom_venue || 'FXEC Campus'}</span>
                    </div>
                  </div>

                  {/* Verification Info */}
                  <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-2.5 text-xs text-neutral-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400">Date & Time:</span>
                      <span className="font-medium text-neutral-800">
                        {ev.start_time ? new Date(ev.start_time).toLocaleDateString() : 'N/A'}{' '}
                        ({ev.start_time ? new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} -{' '}
                        {ev.end_time ? new Date(ev.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400">Verified Via:</span>
                      <span className="font-mono text-[11px] font-semibold text-neutral-800 flex items-center gap-1">
                        {item.method === 'qr_scan' && <><QrCode className="w-3 h-3 text-emerald-600" /> Live QR Scan</>}
                        {item.method === 'manual_coordinator' && <><Shield className="w-3 h-3 text-indigo-600" /> Coordinator Override</>}
                        {item.method === 'manual_admin' && <><Shield className="w-3 h-3 text-amber-600" /> Admin Override</>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400">Timestamp:</span>
                      <span className="font-mono text-[11px] text-neutral-500">
                        {new Date(item.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feedback Action Section */}
                <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/events/${ev.id}`}
                    className="text-xs font-semibold text-neutral-600 hover:text-burgundy flex items-center gap-1"
                  >
                    <span>View Event</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  {hasSubmittedFeedback ? (
                    <Badge variant="neutral" size="sm" className="gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Feedback Submitted
                    </Badge>
                  ) : isEventEnded ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedEventForFeedback(ev)}
                      className="text-xs gap-1.5 py-1 px-3"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Give Feedback
                    </Button>
                  ) : (
                    <span className="text-[11px] text-neutral-400 italic">
                      Feedback opens when session concludes
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      {selectedEventForFeedback && (
        <FeedbackModal
          isOpen={!!selectedEventForFeedback}
          onClose={() => setSelectedEventForFeedback(null)}
          event={selectedEventForFeedback}
          onSuccess={loadAttendance}
        />
      )}
      </div>
    </DashboardLayout>
  );
}
