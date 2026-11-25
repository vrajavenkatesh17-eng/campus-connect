import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { attendanceService } from '../../services/attendanceService';
import { pointsService } from '../../services/pointsService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import AppSelect from '../../components/app/AppSelect';
import Textarea from '../../components/common/Textarea';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import {
  Award,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Trophy,
  Star,
  RefreshCw,
  PlusCircle,
  AlertCircle
} from 'lucide-react';

export default function CoordinatorRewardsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttendeesLoading, setIsAttendeesLoading] = useState(false);

  // Award Points Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [category, setCategory] = useState('asked_question');
  const [points, setPoints] = useState('15');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCoordinatorEvents() {
      setIsLoading(true);
      try {
        const events = await eventService.getCoordinatorEvents();
        const approved = (events || []).filter((e) => e.status === 'approved' || e.status === 'completed');
        setSessions(approved);
        if (approved.length > 0) {
          setSelectedEventId(approved[0].id);
        }
      } catch (err) {
        console.error('Error loading coordinator events:', err);
        showToast('Error loading coordinator events.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadCoordinatorEvents();
  }, []);

  useEffect(() => {
    async function loadAttendees() {
      if (!selectedEventId) {
        setAttendees([]);
        setPointsHistory([]);
        return;
      }
      setIsAttendeesLoading(true);
      try {
        const [attList, historyList] = await Promise.all([
          attendanceService.getEventAttendance(selectedEventId),
          pointsService.getEventPointsHistory(selectedEventId),
        ]);
        setAttendees(attList || []);
        setPointsHistory(historyList || []);
      } catch (err) {
        console.error('Error loading attendees:', err);
      } finally {
        setIsAttendeesLoading(false);
      }
    }
    loadAttendees();
  }, [selectedEventId]);

  const handleOpenAwardModal = (student) => {
    setTargetStudent(student);
    setCategory('asked_question');
    setPoints('15');
    setReason('');
    setIsModalOpen(true);
  };

  const handleAwardPoints = async (e) => {
    e.preventDefault();
    if (!targetStudent?.id || !selectedEventId) return;

    if (!reason.trim()) {
      showToast('A clear reason is mandatory when awarding bonus points.', 'warning');
      return;
    }

    const pointsNum = parseInt(points, 10);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      showToast('Points must be a positive number.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await pointsService.awardPoints(
        selectedEventId,
        targetStudent.id,
        category,
        pointsNum,
        reason.trim()
      );

      if (res.success) {
        showToast(
          `Awarded +${res.points_awarded} bonus points to ${targetStudent.name || 'student'}!`,
          'success'
        );
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to award points:', err);
      showToast(err.message || 'Failed to award points.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Student Name',
      key: 'name',
      render: (row) => {
        const st = row.student || {};
        return (
          <div>
            <p className="text-xs font-bold text-ink">{st.name || 'Student'}</p>
            <p className="text-xs text-muted">{st.email}</p>
          </div>
        );
      },
    },
    {
      header: 'Register Number',
      key: 'reg_no',
      render: (row) => (
        <span className="font-mono text-xs text-ink">
          {row.student?.register_number || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Department',
      key: 'dept',
      render: (row) => (
        <span className="text-xs text-muted">
          {row.student?.departments?.code || 'FXEC'}
        </span>
      ),
    },
    {
      header: 'Attendance Verified',
      key: 'status',
      render: (row) => (
        <Badge variant="success" size="sm" className="gap-1 text-xs">
          <CheckCircle2 className="w-3 h-3" />
          {new Date(row.verified_at).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Badge>
      ),
    },
    {
      header: 'Action',
      key: 'action',
      render: (row) => (
        <Button
          size="xs"
          variant="primary"
          icon={PlusCircle}
          onClick={() => handleOpenAwardModal(row.student)}
        >
          Award Bonus Points
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted font-medium">Loading event rewards roster...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Reward Points & Recognition"
      subtitle="Award bonus interaction points to verified attendees for questions, answers, and discussions (per-event cap enforced)"
    >
      <div className="space-y-6">
        {/* Top Filter Bar */}
        <div className="bg-surface p-5 rounded-[20px] border border-line shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-ink">Select Event</h3>
            <p className="text-xs text-muted">
              Only students who have verified attendance can be awarded bonus points.
            </p>
          </div>

          <div className="w-full sm:w-80">
            {sessions.length === 0 ? (
              <span className="text-xs text-muted">No active events found.</span>
            ) : (
              <AppSelect
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                options={sessions.map((s) => ({
                  label: `${s.title} (${new Date(s.start_time).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })})`,
                  value: s.id,
                }))}
              />
            )}
          </div>
        </div>

        {/* Attendance & Points Table */}
        {sessions.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No Approved Events Found"
            description="Propose or coordinate an event to start awarding student participation points."
            actionLabel="Propose Event"
            onAction={() => (window.location.href = '/coordinator/events/new')}
          />
        ) : isAttendeesLoading ? (
          <div className="py-16 text-center">
            <Spinner size="md" />
            <p className="text-xs text-muted mt-2">Loading verified event attendees...</p>
          </div>
        ) : attendees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Verified Attendees Found"
            description="Students must scan the rotating QR token or have manual attendance marked before bonus points can be awarded."
            actionLabel="Open Attendance Console"
            onAction={() => (window.location.href = `/coordinator/events/${selectedEventId}/attendance`)}
          />
        ) : (
          <div className="space-y-6">
            <Card>
              <div className="px-6 py-4 border-b border-line flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-ink">
                    Verified Attendees Eligible for Bonus Points ({attendees.length})
                  </h4>
                  <p className="text-xs text-muted">
                    Points ledger is append-only with an institutional cap per event.
                  </p>
                </div>
              </div>
              <Table columns={columns} data={attendees} keyField="id" />
            </Card>

            {/* Award History Table */}
            <Card>
              <div className="px-6 py-4 border-b border-line flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-ink">
                    Award History ({pointsHistory.length})
                  </h4>
                  <p className="text-xs text-muted">
                    Audit log of bonus points awarded during this event.
                  </p>
                </div>
              </div>
              <Table
                columns={[
                  {
                    header: 'Student',
                    key: 'student',
                    render: (r) => (
                      <div>
                        <p className="font-semibold text-ink text-xs">{r.student?.name || 'Student'}</p>
                        <p className="font-mono text-xs text-muted">{r.student?.register_number || '—'}</p>
                      </div>
                    ),
                  },
                  {
                    header: 'Category',
                    key: 'category',
                    render: (r) => (
                      <Badge variant="neutral" size="sm" className="capitalize text-xs">
                        {String(r.category || 'interaction').replace(/_/g, ' ')}
                      </Badge>
                    ),
                  },
                  {
                    header: 'Points',
                    key: 'points',
                    render: (r) => <span className="font-bold text-primary tabular-nums">+{r.points}</span>,
                  },
                  {
                    header: 'Reason',
                    key: 'reason',
                    render: (r) => <span className="text-xs text-muted line-clamp-2">{r.reason}</span>,
                  },
                ]}
                data={pointsHistory}
                keyField="id"
                emptyTitle="No Bonus Points Awarded Yet"
                emptyDescription="Awarded interaction points will appear in this audit table."
              />
            </Card>
          </div>
        )}

        {/* Award Points Modal */}
        {isModalOpen && targetStudent && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={`Award Bonus Points to ${targetStudent.name || 'Student'}`}
            subtitle={`Register No: ${targetStudent.register_number || 'N/A'}`}
          >
            <form onSubmit={handleAwardPoints} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Interaction Category <span className="text-red-500">*</span>
                </label>
                <AppSelect
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    { label: 'Asked Question (In-depth Inquiry)', value: 'asked_question' },
                    { label: 'Answered Question (Speaker Q&A)', value: 'answered_question' },
                    { label: 'Discussion (Engaged in Group Exchange)', value: 'discussion' },
                    { label: 'Other Active Contribution', value: 'other' },
                  ]}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Bonus Points to Award <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  required
                />
                <p className="text-xs text-muted mt-1">
                  Institutional cap per event is enforced from system settings.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Mandatory Reason / Justification <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Raised an insightful query regarding cloud distributed systems latency."
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  icon={Award}
                >
                  Confirm & Award Points
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
