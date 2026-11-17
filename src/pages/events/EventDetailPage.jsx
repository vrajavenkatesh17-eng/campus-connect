import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { attendanceService } from '../../services/attendanceService';
import { materialService } from '../../services/materialService';
import { volunteerService } from '../../services/volunteerService';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import RotatingQRModal from '../../components/attendance/RotatingQRModal';
import QRScannerModal from '../../components/attendance/QRScannerModal';
import FeedbackModal from '../../components/feedback/FeedbackModal';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Linkedin,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  Award,
  Share2,
  QrCode,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Download,
  ExternalLink,
  HandHeart,
  Ban,
  FileText,
  Lock
} from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams();
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [volunteerStatus, setVolunteerStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student Cancel Registration Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Coordinator Cancel Event Modal
  const [isCancelEventModalOpen, setIsCancelEventModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancellingEvent, setIsCancellingEvent] = useState(false);

  // Volunteer Modal
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [volunteerRolePref, setVolunteerRolePref] = useState('General Support');
  const [isApplyingVolunteer, setIsApplyingVolunteer] = useState(false);

  // Phase 3 Attendance & Feedback Modals & State
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isRotatingQrOpen, setIsRotatingQrOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAttended, setIsAttended] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);

  const loadEvent = useCallback(async () => {
    try {
      const [evtData, myRegs, attendanceHistory, feedbackStatus] = await Promise.all([
        eventService.getEventById(id),
        eventService.getMyRegistrations(),
        attendanceService.getStudentAttendanceHistory(),
        attendanceService.hasSubmittedFeedback(id),
      ]);
      setEvent(evtData);
      setRegistrations(myRegs || []);
      const attended = (attendanceHistory || []).some((a) => a.event_id === id);
      setIsAttended(attended);
      setHasSubmittedFeedback(feedbackStatus);

      // Load learning materials (RLS will permit if attended, coordinator, or admin)
      try {
        const matData = await materialService.getMaterialsByEvent(id);
        setMaterials(matData || []);
      } catch (err) {
        console.warn('Learning materials not accessible:', err);
      }

      // Check volunteer applications for this student
      if (user?.id) {
        try {
          const myVolList = await volunteerService.getMyVolunteerApplications();
          const match = (myVolList || []).find((v) => v.event_id === id);
          setVolunteerStatus(match || null);
        } catch (err) {
          console.warn('Could not check volunteer application:', err);
        }
      }
    } catch (err) {
      console.error('Error loading event:', err);
      showToast(err.message || 'Failed to load event details.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id, user, showToast]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Find user's active registration for this event
  const userRegistration = registrations.find(
    (r) => r.event_id === id && r.status !== 'cancelled'
  );

  const handleRegister = async () => {
    setIsSubmitting(true);
    try {
      const res = await eventService.registerForEvent(id);
      showToast(res.message || 'Registration successful!', 'success');
      loadEvent();
    } catch (err) {
      console.error('Registration failed:', err);
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    try {
      const res = await eventService.cancelRegistration(id);
      showToast(res.message || 'Registration cancelled.', 'info');
      setIsCancelModalOpen(false);
      loadEvent();
    } catch (err) {
      console.error('Cancellation failed:', err);
      showToast(err.message || 'Cancellation failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoordinatorCancelEvent = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      showToast('A cancellation reason is required.', 'warning');
      return;
    }

    setIsCancellingEvent(true);
    try {
      const res = await eventService.cancelEvent(id, cancelReason.trim());
      showToast(
        `Event cancelled. ${res.students_notified || 0} registered students notified.`,
        'info'
      );
      setIsCancelEventModalOpen(false);
      setCancelReason('');
      await loadEvent();
    } catch (err) {
      console.error('Cancellation error:', err);
      showToast(err.message || 'Failed to cancel event.', 'error');
    } finally {
      setIsCancellingEvent(false);
    }
  };

  const handleApplyVolunteer = async (e) => {
    e.preventDefault();
    setIsApplyingVolunteer(true);
    try {
      await volunteerService.applyToVolunteer(id, volunteerRolePref);
      showToast('Volunteer application submitted successfully!', 'success');
      setIsVolunteerModalOpen(false);
      await loadEvent();
    } catch (err) {
      console.error('Volunteer application failed:', err);
      showToast(err.message || 'Failed to apply as volunteer.', 'error');
    } finally {
      setIsApplyingVolunteer(false);
    }
  };

  const handleDownloadMaterial = async (item) => {
    try {
      const url = await materialService.getDownloadUrl(item.file_url);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      showToast('Could not download file: ' + err.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500 font-medium">Loading session details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center py-16 space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900">Event Not Found</h2>
          <p className="text-sm text-neutral-500">
            This event may have been cancelled or does not exist.
          </p>
          <Link to="/student/events">
            <Button variant="primary" icon={ArrowLeft}>
              Back to Events
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const isFull = event.registered_count >= event.seat_capacity;
  const isPast = startDate <= new Date();
  const isCancelled = event.status === 'cancelled';
  const capacityPct = Math.min(
    100,
    Math.round((event.registered_count / event.seat_capacity) * 100)
  );

  const isCoordinatorOfEvent = event.coordinator_id === user?.id;
  const canManageEvent = role === 'admin' || isCoordinatorOfEvent;
  const canAccessMaterials = canManageEvent || isAttended;

  return (
    <DashboardLayout
      title={event.title}
      subtitle={`Guest Lecture • Francis Xavier Engineering College`}
      actions={
        <div className="flex items-center gap-2">
          {canManageEvent && !isCancelled && (
            <>
              <Link to={`/coordinator/events/${event.id}/attendees`}>
                <Button variant="outline" size="sm" icon={Users}>
                  Attendees ({event.registered_count})
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                icon={Ban}
                onClick={() => setIsCancelEventModalOpen(true)}
              >
                Cancel Session
              </Button>
            </>
          )}
          <Link to="/student/events">
            <Button variant="ghost" size="sm" icon={ArrowLeft}>
              All Events
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Cancelled Alert Banner */}
        {isCancelled && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 flex items-start gap-3 shadow-xs">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">This Guest Lecture has been Cancelled</h3>
              <p className="text-xs text-red-700 leading-relaxed">
                Reason: {event.rejection_reason || 'Administrative reschedule or speaker unavailability.'}
              </p>
              <p className="text-[11px] text-red-500">
                All registered and waitlisted students have been notified in an atomic transaction.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Poster or Banner */}
            {event.poster_url ? (
              <div className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shadow-xs">
                <img
                  src={event.poster_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-burgundy-900 to-burgundy p-6 flex flex-col justify-end text-white shadow-xs">
                <Badge variant="primary" size="sm" className="w-fit mb-2 bg-white/20 text-white border-0">
                  Official College Guest Lecture
                </Badge>
                <h2 className="text-2xl font-bold">{event.title}</h2>
              </div>
            )}

            {/* About Event */}
            <Card>
              <CardHeader>
                <CardTitle>About This Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>

                <div className="pt-4 border-t border-neutral-100">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Eligible Departments
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {event.is_all_departments ? (
                      <Badge variant="neutral">Open to All College Departments</Badge>
                    ) : (
                      event.event_departments?.map((ed, idx) => (
                        <Badge key={idx} variant="primary">
                          {ed.department?.code} - {ed.department?.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Speaker Profile Card */}
            {event.speakers && (
              <Card className="border-neutral-200">
                <CardHeader className="bg-neutral-50/60 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Distinguished Guest Speaker</CardTitle>
                    <CardDescription>Industry professional conducting the session</CardDescription>
                  </div>
                  <Link
                    to={`/speakers/${event.speakers.id || event.speaker_id}`}
                    className="text-xs font-semibold text-burgundy hover:underline flex items-center gap-1"
                  >
                    View Full Profile <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {event.speakers.photo_url ? (
                      <img
                        src={event.speakers.photo_url}
                        alt={event.speakers.name}
                        className="w-20 h-20 rounded-2xl object-cover border border-neutral-200 shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-burgundy-50 border border-burgundy-200 text-burgundy font-bold text-2xl flex items-center justify-center shrink-0">
                        {event.speakers.name[0]}
                      </div>
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <Link
                        to={`/speakers/${event.speakers.id || event.speaker_id}`}
                        className="text-lg font-bold text-neutral-900 hover:text-burgundy transition-colors"
                      >
                        {event.speakers.name}
                      </Link>
                      <p className="text-sm font-semibold text-burgundy">{event.speakers.designation}</p>
                      <p className="text-xs text-neutral-600 font-medium">{event.speakers.company}</p>
                      {event.speakers.experience && (
                        <p className="text-xs text-neutral-500 pt-1">
                          Experience: {event.speakers.experience}
                        </p>
                      )}
                    </div>

                    {event.speakers.linkedin_url && (
                      <a
                        href={event.speakers.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] rounded-lg text-xs font-semibold transition-colors shrink-0"
                      >
                        <Linkedin className="w-3.5 h-3.5 fill-current" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Learning Materials Section (Phase 5) */}
            <Card>
              <CardHeader className="bg-neutral-50/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-burgundy" />
                    Session Learning Materials ({materials.length})
                  </CardTitle>
                  <CardDescription>
                    Official presentation slides, PDFs, code repos, and notes
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!canAccessMaterials ? (
                  <div className="p-6 rounded-xl bg-neutral-50 border border-neutral-200 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-600 mx-auto flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900">Learning Materials Locked</h4>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto">
                      Per academic policy, lecture notes and slides are accessible only to students who physically attend and scan the rotating QR code.
                    </p>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    No learning materials uploaded for this session yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materials.map((mat) => (
                      <div
                        key={mat.id}
                        className="p-4 rounded-xl border border-neutral-200 bg-white flex items-center justify-between gap-4 hover:border-burgundy/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-burgundy/10 text-burgundy flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-900 line-clamp-1">{mat.title}</p>
                            {mat.description && (
                              <p className="text-[11px] text-neutral-500 line-clamp-1">{mat.description}</p>
                            )}
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                              {mat.material_type} {mat.file_size ? `• ${(mat.file_size / (1024 * 1024)).toFixed(1)} MB` : ''}
                            </span>
                          </div>
                        </div>

                        <Button
                          size="xs"
                          variant="outline"
                          icon={mat.material_type === 'link' ? ExternalLink : Download}
                          onClick={() => handleDownloadMaterial(mat)}
                        >
                          {mat.material_type === 'link' ? 'Open' : 'Download'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Action Column */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Session Details & Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Timing */}
                <div className="space-y-3 text-xs text-neutral-700">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-burgundy shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {startDate.toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-neutral-500">Event Date</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-burgundy shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {startDate.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {endDate.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-neutral-500">Session Schedule</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-burgundy shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {event.venues?.name || event.custom_venue || 'Venue TBA'}
                      </p>
                      {event.venues?.building && (
                        <p className="text-neutral-500">{event.venues.building}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seat Capacity Progress */}
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-600">Seat Capacity:</span>
                    <span className="font-bold text-neutral-900">
                      {event.registered_count} / {event.seat_capacity} filled
                    </span>
                  </div>

                  <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFull ? 'bg-amber-500' : 'bg-burgundy'
                      }`}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>

                  {event.waiting_count > 0 && (
                    <p className="text-[11px] text-amber-700 font-semibold text-right">
                      {event.waiting_count} students on waiting list
                    </p>
                  )}
                </div>

                {/* Active Registration Status or CTA */}
                <div className="pt-2 space-y-3">
                  {/* Coordinator Control Actions */}
                  {canManageEvent && !isCancelled && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>Coordinator Session Tools</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setIsRotatingQrOpen(true)}
                          className="w-full text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Start Attendance (Live QR)
                        </Button>
                        <Link to={`/events/${event.id}/attendance`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-1.5 border-indigo-200 text-indigo-800 bg-white hover:bg-indigo-50"
                          >
                            <Users className="w-3.5 h-3.5" />
                            Attendance & Feedback Hub
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {isCancelled ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center text-xs text-red-700 font-medium">
                      Registrations Closed (Cancelled)
                    </div>
                  ) : isPast ? (
                    <div className="space-y-2.5">
                      <div className="p-3 bg-neutral-100 rounded-lg text-center text-xs text-neutral-600 font-medium">
                        This session has concluded.
                      </div>

                      {isAttended && (
                        <div className="space-y-2">
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              Attendance Verified
                            </span>
                            <Badge variant="success" size="sm">Present</Badge>
                          </div>

                          {hasSubmittedFeedback ? (
                            <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-600 text-xs flex items-center justify-center gap-1.5 font-medium">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Feedback Submitted
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full text-xs gap-1.5 shadow-xs"
                              onClick={() => setIsFeedbackModalOpen(true)}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Submit Session Feedback
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : userRegistration?.status === 'registered' ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold">You are Confirmed!</p>
                            <p className="text-[11px] text-emerald-700">Seat is officially reserved for you.</p>
                          </div>
                        </div>
                        {isAttended && (
                          <Badge variant="success" size="sm">Present</Badge>
                        )}
                      </div>

                      {/* Attendance QR Scanner Trigger */}
                      {!isAttended ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 shadow-xs"
                          onClick={() => setIsQrScannerOpen(true)}
                        >
                          <QrCode className="w-4 h-4" />
                          Scan Attendance QR
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          {hasSubmittedFeedback ? (
                            <div className="p-2 bg-neutral-100 rounded-lg text-xs text-neutral-600 text-center font-medium flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Feedback Submitted
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs gap-1.5 border-burgundy/30 text-burgundy hover:bg-burgundy/5"
                              onClick={() => setIsFeedbackModalOpen(true)}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Submit Session Feedback
                            </Button>
                          )}
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setIsCancelModalOpen(true)}
                      >
                        Cancel Registration
                      </Button>
                    </div>
                  ) : userRegistration?.status === 'waitlisted' ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="font-bold">
                            Waitlisted Position #{userRegistration.queue_position}
                          </p>
                          <p className="text-[11px] text-amber-700">
                            If a confirmed student cancels, you will be automatically promoted!
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-neutral-600 border-neutral-300 hover:bg-neutral-100"
                        onClick={() => setIsCancelModalOpen(true)}
                      >
                        Leave Waiting List
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      isLoading={isSubmitting}
                      onClick={handleRegister}
                    >
                      {isFull ? 'Join Waiting List' : 'Register for Event'}
                    </Button>
                  )}
                </div>

                {/* Volunteer Application Card (Phase 5) */}
                {role === 'student' && !isCancelled && !isPast && (
                  <div className="pt-4 border-t border-neutral-100 space-y-2">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Student Volunteering
                    </span>
                    {volunteerStatus ? (
                      <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-900">Volunteer Application</span>
                          <Badge
                            variant={
                              volunteerStatus.status === 'accepted'
                                ? 'success'
                                : volunteerStatus.status === 'rejected'
                                ? 'neutral'
                                : 'warning'
                            }
                            size="sm"
                            className="uppercase text-[10px]"
                          >
                            {volunteerStatus.status}
                          </Badge>
                        </div>
                        {volunteerStatus.assigned_role && (
                          <p className="text-[11px] text-emerald-700 font-medium">
                            Role: {volunteerStatus.assigned_role}
                          </p>
                        )}
                        {volunteerStatus.notes && (
                          <p className="text-[10px] text-neutral-500">
                            Note: {volunteerStatus.notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={HandHeart}
                        className="w-full text-xs"
                        onClick={() => setIsVolunteerModalOpen(true)}
                      >
                        Apply to Volunteer
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Rotating QR Modal (Coordinator) */}
      <RotatingQRModal
        isOpen={isRotatingQrOpen}
        onClose={() => setIsRotatingQrOpen(false)}
        event={event}
      />

      {/* QR Scanner Modal (Student) */}
      <QRScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        event={event}
        onSuccess={() => {
          setIsAttended(true);
          loadEvent();
        }}
      />

      {/* Feedback Modal (Student) */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        event={event}
        onSuccess={() => {
          setHasSubmittedFeedback(true);
          loadEvent();
        }}
      />

      {/* Student Cancel Registration Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Cancellation"
        description={`Are you sure you want to cancel your registration for "${event.title}"?`}
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Per Rule 7, when you cancel a confirmed seat, the system will{' '}
            <span className="font-bold text-neutral-800">
              automatically promote the earliest waiting-list student
            </span>{' '}
            to take your seat in an atomic PostgreSQL transaction.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isSubmitting}
            >
              Keep My Registration
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleConfirmCancel}
            >
              Confirm & Release Seat
            </Button>
          </div>
        </div>
      </Modal>

      {/* Coordinator Cancel Event Modal (Phase 5) */}
      {isCancelEventModalOpen && (
        <Modal
          isOpen={isCancelEventModalOpen}
          onClose={() => setIsCancelEventModalOpen(false)}
          title="Cancel Guest Lecture Session"
          description={`Provide a mandatory reason for cancelling "${event.title}".`}
        >
          <form onSubmit={handleCoordinatorCancelEvent} className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
              <p className="font-bold">Atomic Mass Cancellation Notice:</p>
              <p>
                Cancelling this session will immediately notify all registered and waitlisted students with your reason in a single transaction.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Keynote speaker flight delayed due to inclement weather. Rescheduled date will be announced soon."
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCancelEventModalOpen(false)}
              >
                Keep Event
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={isCancellingEvent}
                icon={Ban}
              >
                Confirm & Cancel Session
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Volunteer Application Modal (Phase 5) */}
      {isVolunteerModalOpen && (
        <Modal
          isOpen={isVolunteerModalOpen}
          onClose={() => setIsVolunteerModalOpen(false)}
          title="Apply to Volunteer"
          subtitle={`Francis Xavier Engineering College • "${event.title}"`}
        >
          <form onSubmit={handleApplyVolunteer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Preferred Volunteer Role <span className="text-red-500">*</span>
              </label>
              <Select
                value={volunteerRolePref}
                onChange={(e) => setVolunteerRolePref(e.target.value)}
                options={[
                  { label: 'General Event Support', value: 'General Event Support' },
                  { label: 'Registration & QR Scanning Desk', value: 'Registration Desk' },
                  { label: 'Audio/Visual & IT Tech Support', value: 'AV / IT Tech' },
                  { label: 'Speaker Escort & Protocol', value: 'Speaker Protocol' },
                  { label: 'Stage & Mic Management', value: 'Stage Management' },
                ]}
                required
              />
            </div>

            <p className="text-xs text-neutral-500">
              The event coordinator will review your application and assign specific duties. Volunteering earns leadership experience and campus recognition.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsVolunteerModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isApplyingVolunteer}
                icon={HandHeart}
              >
                Submit Application
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
