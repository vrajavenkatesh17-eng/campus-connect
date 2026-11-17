import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import RotatingQRModal from '../../components/attendance/RotatingQRModal';
import ManualAttendanceModal from '../../components/attendance/ManualAttendanceModal';
import {
  QrCode,
  Download,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Star,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Shield,
  MessageSquare,
  UserCheck
} from 'lucide-react';

export default function EventAttendancePage() {
  const { id: eventId } = useParams();
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [feedbackData, setFeedbackData] = useState({ reviews: [], stats: null });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'feedback'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'attended' | 'not_attended'

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [manualModalStudent, setManualModalStudent] = useState(null);
  const [manualIsAttended, setManualIsAttended] = useState(false);

  // Load all event data, registrations, attendance, and feedback
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventData, attendeesData, feedbackResult] = await Promise.all([
        eventService.getEventById(eventId),
        attendanceService.getEventAttendance(eventId),
        attendanceService.getEventFeedback(eventId),
      ]);

      setEvent(eventData);
      setAttendanceRecords(attendeesData || []);
      setFeedbackData(feedbackResult || { reviews: [], stats: null });

      // Load registered students safely
      const regs = await eventService.getEventAttendees(eventId);
      const studentList = Array.isArray(regs) ? regs : (regs?.registered || []);
      setRegistrations(studentList);
    } catch (err) {
      console.error('Error loading attendance management data:', err);
      showToast(err.message || 'Failed to load attendance data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to live Realtime attendance changes
    const subscription = attendanceService.subscribeToAttendance(eventId, () => {
      // Reload attendee records on live insert or delete
      attendanceService.getEventAttendance(eventId)
        .then(setAttendanceRecords)
        .catch(console.error);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  // Map of studentId -> attendance record
  const attendanceMap = useMemo(() => {
    const map = new Map();
    attendanceRecords.forEach((rec) => {
      map.set(rec.student_id, rec);
    });
    return map;
  }, [attendanceRecords]);

  // Combined roster of registered students with their attendance status
  const roster = useMemo(() => {
    const list = Array.isArray(registrations) ? registrations : (registrations?.registered || []);
    return list
      .map((reg) => {
        const student = reg.student || {};
        const att = attendanceMap.get(student.id);
        return {
          key: student.id || reg.id,
          student,
          isAttended: !!att,
          attendanceRecord: att,
          registeredAt: reg.created_at,
        };
      });
  }, [registrations, attendanceMap]);

  // Table Columns Definition
  const rosterColumns = useMemo(() => [
    {
      header: 'Student Name',
      key: 'name',
      render: (item) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-neutral-900 text-xs">
            {item.student?.name || 'Student'}
          </p>
          <p className="text-[11px] text-neutral-400">
            {item.student?.email}
          </p>
        </div>
      ),
    },
    {
      header: 'Register No',
      key: 'register_number',
      render: (item) => (
        <span className="font-mono text-xs text-neutral-700">
          {item.student?.register_number || '—'}
        </span>
      ),
    },
    {
      header: 'Department',
      key: 'dept',
      render: (item) => (
        <span className="text-xs text-neutral-600">
          {item.student?.department?.code || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (item) => (
        item.isAttended ? (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Attended
          </Badge>
        ) : (
          <Badge variant="neutral" size="sm" className="gap-1 text-neutral-500">
            <XCircle className="w-3 h-3" />
            Not Verified
          </Badge>
        )
      ),
    },
    {
      header: 'Method',
      key: 'method',
      render: (item) => (
        <div className="text-xs">
          {item.attendanceRecord?.method === 'qr_scan' && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              <QrCode className="w-3 h-3" /> QR Scan
            </span>
          )}
          {item.attendanceRecord?.method === 'manual_coordinator' && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              <Shield className="w-3 h-3" /> Faculty Override
            </span>
          )}
          {item.attendanceRecord?.method === 'manual_admin' && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              <Shield className="w-3 h-3" /> Admin Override
            </span>
          )}
          {!item.isAttended && '—'}
        </div>
      ),
    },
    {
      header: 'Verified At',
      key: 'timestamp',
      render: (item) => (
        <span className="text-xs text-neutral-500 font-mono">
          {item.attendanceRecord
            ? new Date(item.attendanceRecord.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (item) => (
        <Button
          variant={item.isAttended ? 'outline' : 'secondary'}
          size="sm"
          onClick={() => {
            setManualModalStudent(item.student);
            setManualIsAttended(item.isAttended);
          }}
          className="text-[11px] py-1 px-2.5"
        >
          {item.isAttended ? 'Revoke' : 'Mark Manual'}
        </Button>
      ),
    },
  ], []);

  // Filtered roster based on search query and status filter
  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      const name = item.student.name?.toLowerCase() || '';
      const email = item.student.email?.toLowerCase() || '';
      const regNo = item.student.register_number?.toLowerCase() || '';
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || email.includes(q) || regNo.includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'attended') return item.isAttended;
      if (statusFilter === 'not_attended') return !item.isAttended;
      return true;
    });
  }, [roster, searchQuery, statusFilter]);

  // CSV Export
  const handleExportCSV = () => {
    if (roster.length === 0) {
      showToast('No student records available to export.', 'info');
      return;
    }

    const headers = ['Register Number', 'Student Name', 'Email', 'Department', 'Attendance Status', 'Method', 'Verified Timestamp'];
    const rows = roster.map((item) => [
      item.student.register_number || 'N/A',
      `"${item.student.name || ''}"`,
      item.student.email || '',
      item.student.department?.code || 'N/A',
      item.isAttended ? 'ATTENDED' : 'ABSENT',
      item.attendanceRecord?.method || 'N/A',
      item.attendanceRecord ? new Date(item.attendanceRecord.verified_at).toLocaleString() : 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event?.title || 'event'}-attendance-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Attendance CSV exported successfully.', 'success');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">Loading attendance & feedback dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <EmptyState
          title="Event Not Found"
          description="The requested event does not exist or you do not have permission to access it."
          action={
            <Link to="/coordinator">
              <Button variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  const totalRegistered = roster.length;
  const totalAttended = roster.filter((r) => r.isAttended).length;
  const attendanceRate = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;

  return (
    <DashboardLayout
      title="Attendance & Feedback Register"
      subtitle={`${event.title} • Francis Xavier Engineering College`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/events/${event.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-burgundy px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Event Details</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="gap-2 text-xs shadow-xs"
          >
            <QrCode className="w-4 h-4" />
            Launch Live QR
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">Confirmed Seats</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{totalRegistered}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            Capacity: {event.seat_capacity} seats
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">Verified Attendees</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{totalAttended}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-500">
            <span className="font-semibold text-emerald-700">{attendanceRate}%</span> turnout rate
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">Pending Scans</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{totalRegistered - totalAttended}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            Registered students not yet verified
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">Avg Feedback Rating</p>
              <p className="text-2xl font-bold text-burgundy mt-1">
                {feedbackData.stats?.overallScore ? `${feedbackData.stats.overallScore} / 5` : 'N/A'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-burgundy/10 text-burgundy flex items-center justify-center">
              <Star className="w-5 h-5 fill-burgundy" />
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            {feedbackData.reviews?.length || 0} student reviews submitted
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'border-burgundy text-burgundy'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Attendance Roster ({filteredRoster.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'feedback'
              ? 'border-burgundy text-burgundy'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Feedback Analytics ({feedbackData.reviews?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Attendance Roster */}
      {activeTab === 'roster' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100">
            <div>
              <CardTitle>Session Attendance Register</CardTitle>
              <p className="text-xs text-neutral-500">
                Live verification via 30s rotating QR scans or manual coordinator audit
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-48 sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or reg no..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-burgundy"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-burgundy"
              >
                <option value="all">All Registrations</option>
                <option value="attended">Attended Only</option>
                <option value="not_attended">Absent Only</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table
              columns={rosterColumns}
              data={filteredRoster}
              keyField="key"
              emptyTitle="No Students Found"
              emptyDescription="No registered students match the selected filter criteria."
            />
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Feedback Analytics */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Detailed Feedback Scoring Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-amber-50/40 border-amber-200/60">
              <p className="text-xs text-neutral-600 font-medium">1. Content Quality</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-neutral-900">
                  {feedbackData.stats?.avgContent || '0.0'}
                </span>
                <span className="text-xs text-neutral-500">/ 5.0</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Topic depth & practical relevance</p>
            </Card>

            <Card className="p-4 bg-blue-50/40 border-blue-200/60">
              <p className="text-xs text-neutral-600 font-medium">2. Speaker Delivery</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-neutral-900">
                  {feedbackData.stats?.avgSpeaker || '0.0'}
                </span>
                <span className="text-xs text-neutral-500">/ 5.0</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Clarity & student engagement</p>
            </Card>

            <Card className="p-4 bg-emerald-50/40 border-emerald-200/60">
              <p className="text-xs text-neutral-600 font-medium">3. Organization</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-neutral-900">
                  {feedbackData.stats?.avgOrganization || '0.0'}
                </span>
                <span className="text-xs text-neutral-500">/ 5.0</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Venue, AV clarity & schedule adherence</p>
            </Card>
          </div>

          {/* Feedback Review Cards List */}
          <Card>
            <CardHeader className="border-b border-neutral-100">
              <CardTitle>Student Feedback Submissions</CardTitle>
              <p className="text-xs text-neutral-500">
                Real responses submitted by attended students (anonymous identities protected)
              </p>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {feedbackData.reviews.length === 0 ? (
                <EmptyState
                  title="No Feedback Submitted Yet"
                  description="Feedback opens for students once the event has concluded and their attendance is confirmed."
                />
              ) : (
                <div className="space-y-3">
                  {feedbackData.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {rev.is_anonymous ? (
                            <Badge variant="neutral" size="sm" className="font-mono text-[11px] gap-1">
                              <Shield className="w-3 h-3 text-neutral-500" />
                              Anonymous Student
                            </Badge>
                          ) : (
                            <span className="text-xs font-semibold text-neutral-800">
                              {rev.student?.name || 'Verified Attendee'}
                              {rev.student?.department?.code && ` (${rev.student.department.code})`}
                            </span>
                          )}
                          <span className="text-[11px] text-neutral-400">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Star Badges */}
                        <div className="flex items-center gap-3 text-xs font-semibold text-neutral-700">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {((rev.rating_content + rev.rating_speaker + rev.rating_organization) / 3).toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Ratings Breakdown Pills */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                        <span className="bg-white border border-neutral-200 px-2 py-0.5 rounded">
                          Content: <strong className="text-neutral-800">{rev.rating_content}/5</strong>
                        </span>
                        <span className="bg-white border border-neutral-200 px-2 py-0.5 rounded">
                          Speaker: <strong className="text-neutral-800">{rev.rating_speaker}/5</strong>
                        </span>
                        <span className="bg-white border border-neutral-200 px-2 py-0.5 rounded">
                          Venue: <strong className="text-neutral-800">{rev.rating_organization}/5</strong>
                        </span>
                      </div>

                      {/* Written Comments */}
                      {rev.comments ? (
                        <p className="text-xs text-neutral-700 italic bg-white p-2.5 rounded-lg border border-neutral-200">
                          "{rev.comments}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-neutral-400 italic">No written comment provided.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rotating QR Modal */}
      <RotatingQRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        event={event}
      />

      {/* Manual Attendance Override Modal */}
      <ManualAttendanceModal
        isOpen={!!manualModalStudent}
        onClose={() => setManualModalStudent(null)}
        eventId={event.id}
        student={manualModalStudent}
        isCurrentlyAttended={manualIsAttended}
        onSuccess={loadData}
      />
      </div>
    </DashboardLayout>
  );
}
