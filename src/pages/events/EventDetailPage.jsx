/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Event Detail Page (Step S-H):
 * Rebuilt strictly per DESIGN_SPEC v2 Section 4:
 * 1. HERO: Tilted Card poster on left; right has status badge, title in Fraunces, speaker pill,
 *    date & venue, Counter countdown, AppSeatGauge, and Register CTA / AppHoldButton to cancel.
 * 2. REGISTRATION FLOW: Multi-step interactive flow via AppStepper (Prerequisites, Confirm, Pass).
 * 3. BELOW HERO:
 *    - About Session
 *    - Speaker: Profile Card with avatar, designation, company, experience, LinkedIn link
 *    - Materials: Folder representation, unlocked only after attendance check-in
 *    - Feedback: Peek Rating (AppRating) + anonymous Squish Switch (AppSwitch) after attendance & event conclusion
 *    - Moments Gallery: Event photos uploaded by coordinator and approved by admin
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { optimizeImageToWebP } from '../../utils/imageOptimizer';
import { attendanceService } from '../../services/attendanceService';
import { materialService } from '../../services/materialService';
import { volunteerService } from '../../services/volunteerService';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import AppButton from '../../components/app/AppButton';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import RotatingQRModal from '../../components/attendance/RotatingQRModal';
import QRScannerModal from '../../components/attendance/QRScannerModal';
import FeedbackModal from '../../components/feedback/FeedbackModal';
import AppSeatGauge from '../../components/app/AppSeatGauge';
import AppHoldButton from '../../components/app/AppHoldButton';
import AppRating from '../../components/app/AppRating';
import AppSwitch from '../../components/app/AppSwitch';
import Counter from '../../components/ui/Counter/Counter';
import TiltedCard from '../../components/common/TiltedCard';
import TearTicket from '../../components/common/TearTicket';
import Stepper, { Step } from '../../components/ui/Stepper/Stepper';
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
  Lock,
  UploadCloud,
  Image as ImageIcon,
  Folder,
  Ticket,
} from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams();
  const { user, profile, role } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [volunteerStatus, setVolunteerStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Stepper Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);

  // Cancellation Modals
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelEventModalOpen, setIsCancelEventModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancellingEvent, setIsCancellingEvent] = useState(false);

  // Volunteer Modal
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [volunteerRolePref, setVolunteerRolePref] = useState('General Support');
  const [isApplyingVolunteer, setIsApplyingVolunteer] = useState(false);

  // Attendance & Feedback
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isRotatingQrOpen, setIsRotatingQrOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAttended, setIsAttended] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);

  // Embedded Feedback State
  const [embedContentRating, setEmbedContentRating] = useState(5);
  const [embedSpeakerRating, setEmbedSpeakerRating] = useState(5);
  const [embedOrgRating, setEmbedOrgRating] = useState(5);
  const [embedComments, setEmbedComments] = useState('');
  const [embedIsAnonymous, setEmbedIsAnonymous] = useState(false);
  const [isSubmittingEmbedFeedback, setIsSubmittingEmbedFeedback] = useState(false);

  // Event Photos Upload
  const [isUploadPhotoModalOpen, setIsUploadPhotoModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [eventPhotos, setEventPhotos] = useState([]);

  // Countdown timer calculations
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

      // Load learning materials
      try {
        const matData = await materialService.getMaterialsByEvent(id);
        setMaterials(matData || []);
      } catch (err) {
        console.warn('Learning materials not accessible:', err);
      }

      // Load event photos
      try {
        const photosData = await eventService.getEventPhotos(id);
        setEventPhotos(photosData || []);
      } catch (err) {
        console.warn('Event photos not accessible:', err);
      }

      // Check volunteer applications
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

  // Live countdown timer for the event start
  useEffect(() => {
    if (!event?.start_time) return;
    const target = new Date(event.start_time).getTime();
    const updateCountdown = () => {
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [event?.start_time]);

  // Find user's active registration for this event
  const userRegistration = registrations.find(
    (r) => r.event_id === id && r.status !== 'cancelled'
  );

  const handleRegister = async () => {
    setIsSubmitting(true);
    try {
      const res = await eventService.registerForEvent(id);
      showToast(res.message || 'Registration confirmed!', 'success');
      await loadEvent();
      setRegistrationStep(3); // Advance to pass step
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
      showToast(res.message || 'Registration cancelled and seat released.', 'info');
      setIsCancelModalOpen(false);
      await loadEvent();
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

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      showToast('Please select a photo file to upload.', 'warning');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const { file: optimizedFile } = await optimizeImageToWebP(photoFile, {
        maxDimension: 1600,
        quality: 0.82,
      });
      await eventService.uploadEventPhoto({
        eventId: id,
        file: optimizedFile,
        caption: photoCaption,
        uploadedBy: user.id,
      });
      showToast('Photo uploaded successfully! Pending admin approval.', 'success');
      setIsUploadPhotoModalOpen(false);
      setPhotoFile(null);
      setPhotoCaption('');
      const updated = await eventService.getEventPhotos(id);
      setEventPhotos(updated || []);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      showToast(err.message || 'Photo upload failed.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDownloadMaterial = async (item) => {
    try {
      const url = await materialService.getDownloadUrl(item.file_url);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        showToast('Download link is unavailable.', 'warning');
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to open file.', 'error');
    }
  };

  const handleEmbedFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!event?.id) return;

    setIsSubmittingEmbedFeedback(true);
    try {
      await attendanceService.submitFeedback({
        eventId: event.id,
        ratingContent: embedContentRating,
        ratingSpeaker: embedSpeakerRating,
        ratingOrganization: embedOrgRating,
        comments: embedComments.trim(),
        isAnonymous: embedIsAnonymous,
      });

      showToast('Thank you! Your feedback has been verified and recorded.', 'success');
      setHasSubmittedFeedback(true);
      await loadEvent();
    } catch (err) {
      console.error('Feedback submission error:', err);
      showToast(err.message || 'Failed to submit feedback.', 'error');
    } finally {
      setIsSubmittingEmbedFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-muted">Loading event details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="py-16 text-center space-y-4">
          <XCircle className="w-12 h-12 text-muted mx-auto" />
          <h2 className="text-xl font-bold text-ink">Event Not Found</h2>
          <p className="text-sm text-muted">
            The requested session does not exist or may have been removed.
          </p>
          <Link to="/events">
            <Button variant="primary" size="sm">
              Back to Events
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const isCancelled = event.status === 'cancelled';
  const isCompleted = (event.status === 'completed' || endDate <= new Date()) && !isCancelled;
  const isUpcoming = startDate > new Date() && !isCancelled && event.status === 'approved';
  const isLive = !isUpcoming && !isCompleted && !isCancelled && event.status === 'approved';
  const isFull = (event.registered_count || 0) >= (event.seat_capacity || 100);

  const isCoordinatorOfEvent = event.coordinator_id === user?.id;
  const canManageEvent = role === 'admin' || isCoordinatorOfEvent;
  const canAccessMaterials = canManageEvent || isAttended;

  return (
    <DashboardLayout
      title={event.title}
      subtitle="Guest Lecture • Francis Xavier Engineering College"
      actions={
        <div className="flex items-center gap-2">
          {canManageEvent && !isCancelled && (
            <>
              <Link to={`/coordinator/events/${event.id}/attendees`}>
                <Button variant="outline" size="sm" icon={Users}>
                  Roster ({event.registered_count || 0})
                </Button>
              </Link>
              {isUpcoming && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Ban}
                  onClick={() => setIsCancelEventModalOpen(true)}
                >
                  Cancel Session
                </Button>
              )}
            </>
          )}
          <Link to="/events">
            <Button variant="ghost" size="sm" icon={ArrowLeft}>
              All Events
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Cancelled Alert Banner */}
        {isCancelled && (
          <div className="rounded-[16px] border border-danger/30 bg-danger/10 p-4 text-danger flex items-start gap-3 shadow-xs">
            <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">This Guest Lecture has been Cancelled</h3>
              <p className="text-xs text-danger/90 leading-relaxed">
                Reason: {event.rejection_reason || 'Administrative reschedule or speaker unavailability.'}
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            ROW 1: HERO SECTION
            Tilted Card Poster (Left) + Meta, Countdown, Seat Gauge & Actions (Right)
            ========================================================================= */}
        <div className="rounded-[24px] bg-surface border border-line p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Tilted Card Poster */}
            <div className="lg:col-span-5 flex justify-center">
              <TiltedCard className="w-full max-w-[380px] aspect-[4/5] bg-surface-2">
                {event.poster_url ? (
                  <img
                    src={event.poster_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary via-primary-hover to-neutral-900 p-6 flex flex-col justify-between text-on-primary">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                        FXEC Academic Keynote
                      </span>
                      <Award className="w-5 h-5 text-gold" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="font-serif text-2xl font-bold leading-tight">
                        {event.title}
                      </h2>
                      {event.speakers && (
                        <p className="text-xs text-on-primary/80">
                          {event.speakers.name} • {event.speakers.company}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/15 text-xs text-on-primary/70 font-mono">
                      Francis Xavier Engineering College
                    </div>
                  </div>
                )}
              </TiltedCard>
            </div>

            {/* Right Column: Event Details, Countdown, Gauge & Actions */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={
                      isLive
                        ? 'primary'
                        : isCompleted
                        ? 'neutral'
                        : event.status === 'approved'
                        ? 'success'
                        : 'warning'
                    }
                    size="sm"
                    className="uppercase font-semibold tracking-wider text-xs"
                  >
                    {isLive ? 'Live Now' : isCompleted ? 'Completed' : event.status}
                  </Badge>

                  {userRegistration?.status === 'registered' && (
                    <Badge variant="success" size="sm" className="gap-1 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Seat
                    </Badge>
                  )}

                  {userRegistration?.status === 'waitlisted' && (
                    <Badge variant="warning" size="sm" className="gap-1 font-bold text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" /> Waitlist #{userRegistration.queue_position}
                    </Badge>
                  )}
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-ink leading-tight">
                  {event.title}
                </h1>

                {event.speakers && (
                  <p className="text-sm text-muted flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-ink">{event.speakers.name}</span>
                    <span>•</span>
                    <span>{event.speakers.designation}, {event.speakers.company}</span>
                  </p>
                )}
              </div>

              {/* Meta: Schedule & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-muted">
                <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-surface-2 border border-line">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="font-bold text-ink">
                      {startDate.toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-muted text-xs">
                      {startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-surface-2 border border-line">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">
                      {event.venues?.name || event.custom_venue || 'FXEC Campus'}
                    </p>
                    <p className="text-muted text-xs truncate">
                      {event.venues?.building || 'Main Engineering Block'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Counter Countdown (for upcoming events) */}
              {isUpcoming && (
                <div className="flex items-center justify-between p-3.5 rounded-[14px] bg-surface-2 border border-line">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted">Session Starts In:</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-primary tabular-nums">
                    <Counter value={timeLeft.days} />d <Counter value={timeLeft.hours} />h{' '}
                    <Counter value={timeLeft.minutes} />m <Counter value={timeLeft.seconds} />s
                  </div>
                </div>
              )}

              {/* Seat Capacity Gauge */}
              <div className="pt-1">
                <AppSeatGauge
                  occupied={event.registered_count || 0}
                  total={event.seat_capacity || 100}
                  label="Hall Seat Availability"
                />
              </div>

              {/* Action Buttons & Registration Status */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {isCancelled ? (
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded-[12px] text-center text-xs text-danger font-medium w-full">
                    Registrations Closed (Event Cancelled)
                  </div>
                ) : isCompleted ? (
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-3 bg-surface-2 border border-line rounded-[12px] text-center text-xs text-muted font-medium flex-1">
                      This event has concluded.
                    </div>
                    {isAttended && (
                      <Link to="/student/certificates">
                        <AppButton variant="primary" size="sm" className="text-xs gap-1.5 shadow-xs shrink-0">
                          <Award className="w-4 h-4" />
                          <span>View Certificate</span>
                        </AppButton>
                      </Link>
                    )}
                  </div>
                ) : userRegistration?.status === 'registered' ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                    {/* Live QR attendance trigger */}
                    {isLive && !isAttended ? (
                      <AppButton
                        variant="primary"
                        size="sm"
                        onClick={() => setIsQrScannerOpen(true)}
                        className="flex-1 text-xs gap-1.5 shadow-xs"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Scan Attendance QR</span>
                      </AppButton>
                    ) : (
                      <div className="flex-1 p-2.5 rounded-[12px] bg-success/10 border border-success/30 flex items-center gap-2 text-xs font-bold text-success">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Seat Confirmed • Bring your student ID</span>
                      </div>
                    )}

                    {/* Hold-to-Cancel Destructive Confirmation */}
                    <div className="w-full sm:w-56 shrink-0">
                      <AppHoldButton
                        variant="danger"
                        holdTime={1800}
                        onHold={handleConfirmCancel}
                        disabled={isSubmitting}
                        className="w-full text-xs font-semibold"
                      >
                        Hold to Cancel Seat
                      </AppHoldButton>
                    </div>
                  </div>
                ) : userRegistration?.status === 'waitlisted' ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                    <div className="flex-1 p-2.5 rounded-[12px] bg-warning/10 border border-warning/30 flex items-center gap-2 text-xs font-bold text-warning">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Waitlisted Position #{userRegistration.queue_position}</span>
                    </div>

                    <div className="w-full sm:w-52 shrink-0">
                      <AppHoldButton
                        variant="danger"
                        holdTime={1500}
                        onHold={handleConfirmCancel}
                        disabled={isSubmitting}
                        className="w-full text-xs font-semibold"
                      >
                        Hold to Leave Waitlist
                      </AppHoldButton>
                    </div>
                  </div>
                ) : (
                  <AppButton
                    variant="primary"
                    size="md"
                    className="w-full text-xs gap-2 shadow-xs justify-center"
                    onClick={() => {
                      setRegistrationStep(1);
                      setIsRegisterModalOpen(true);
                    }}
                  >
                    <Ticket className="w-4 h-4" />
                    <span>{isFull ? 'Join Session Waitlist' : 'Register for Session'}</span>
                  </AppButton>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 2: BELOW HERO (About, Speaker, Materials, Feedback & Photos)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main 8-column content */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. About Session */}
            <Card className="border-line shadow-xs">
              <CardHeader className="border-b border-line">
                <CardTitle>About This Keynote Session</CardTitle>
                <CardDescription>Industrial syllabus alignment and technical objectives</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>

                <div className="pt-4 border-t border-line">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Authorized Department Eligibility
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {event.is_all_departments ? (
                      <Badge variant="neutral">Open to All Engineering Departments</Badge>
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

            {/* 2. Speaker Profile Card */}
            {event.speakers && (
              <Card className="border-line shadow-xs">
                <CardHeader className="bg-surface-2/60 border-b border-line flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Distinguished Keynote Speaker</CardTitle>
                    <CardDescription>Industry professional conducting the technical keynote</CardDescription>
                  </div>
                  <Link
                    to={`/speakers/${event.speakers.id || event.speaker_id}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Full Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {event.speakers.photo_url ? (
                      <img
                        src={event.speakers.photo_url}
                        alt={event.speakers.name}
                        className="w-20 h-20 rounded-[16px] object-cover border border-line shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-[16px] bg-primary-soft border border-primary/20 text-primary font-serif font-bold text-2xl flex items-center justify-center shrink-0">
                        {event.speakers.name[0]}
                      </div>
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <Link
                        to={`/speakers/${event.speakers.id || event.speaker_id}`}
                        className="text-lg font-bold text-ink hover:text-primary transition-colors"
                      >
                        {event.speakers.name}
                      </Link>
                      <p className="text-sm font-semibold text-primary">{event.speakers.designation}</p>
                      <p className="text-xs text-muted font-medium">{event.speakers.company}</p>
                      {event.speakers.experience && (
                        <p className="text-xs text-muted pt-1">
                          Industry Experience: {event.speakers.experience}
                        </p>
                      )}
                    </div>

                    {event.speakers.linkedin_url && (
                      <a
                        href={event.speakers.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-info/10 hover:bg-info/20 text-info rounded-[10px] text-xs font-semibold transition-colors shrink-0"
                      >
                        <Linkedin className="w-3.5 h-3.5 fill-current" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. Learning Materials Section (Folder Representation) */}
            <Card className="border-line shadow-xs">
              <CardHeader className="bg-surface-2/60 border-b border-line flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary" />
                    <span>Learning Materials Folder ({materials.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Presentation slide decks, reference PDFs, sample code, and technical handouts
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!canAccessMaterials ? (
                  <div className="p-6 rounded-[16px] bg-surface-2 border border-line text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-line text-muted mx-auto flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-ink">Learning Materials Locked</h4>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      Per autonomous institutional policy, lecture notes and slides are accessible only to students who physically attend and scan the rotating attendance QR.
                    </p>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted">
                    No learning materials uploaded for this event yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materials.map((mat) => (
                      <div
                        key={mat.id}
                        className="p-4 rounded-[14px] border border-line bg-surface flex items-center justify-between gap-4 hover:border-primary/40 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-ink line-clamp-1">{mat.title}</p>
                            {mat.description && (
                              <p className="text-xs text-muted line-clamp-1">{mat.description}</p>
                            )}
                            <span className="text-xs text-muted uppercase tracking-wider font-semibold">
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

            {/* 4. Feedback Section (PeekRating + SquishSwitch) */}
            {isCompleted && isAttended && (
              <Card className="border-line shadow-xs">
                <CardHeader className="bg-surface-2/60 border-b border-line">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <span>Session Evaluation & Feedback</span>
                      </CardTitle>
                      <CardDescription>
                        Evaluate keynote quality to unlock official certificate and interactive recognition points
                      </CardDescription>
                    </div>
                    {hasSubmittedFeedback && (
                      <Badge variant="success" size="sm" className="gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {hasSubmittedFeedback ? (
                    <div className="p-4 rounded-[14px] bg-success/10 border border-success/30 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-ink">Your Feedback Has Been Recorded</p>
                        <p className="text-xs text-muted">
                          Thank you for evaluating this session! Your certificate is available to download.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleEmbedFeedbackSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-[14px] bg-surface-2 border border-line">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-ink block">Content Relevance</span>
                          <AppRating
                            value={embedContentRating}
                            onChange={setEmbedContentRating}
                            size={20}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-ink block">Speaker Delivery</span>
                          <AppRating
                            value={embedSpeakerRating}
                            onChange={setEmbedSpeakerRating}
                            size={20}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-ink block">Organization</span>
                          <AppRating
                            value={embedOrgRating}
                            onChange={setEmbedOrgRating}
                            size={20}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Comments or Takeaways (Optional)
                        </label>
                        <Textarea
                          value={embedComments}
                          onChange={(e) => setEmbedComments(e.target.value)}
                          placeholder="What did you learn from this keynote?"
                          rows={2}
                          className="text-xs"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[12px] bg-surface-2 border border-line">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`w-4 h-4 ${embedIsAnonymous ? 'text-success' : 'text-muted'}`} />
                          <span className="text-xs font-semibold text-ink">Submit Anonymously</span>
                        </div>
                        <AppSwitch
                          checked={embedIsAnonymous}
                          onChange={setEmbedIsAnonymous}
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <AppButton
                          type="submit"
                          variant="primary"
                          size="sm"
                          isLoading={isSubmittingEmbedFeedback}
                        >
                          Submit Evaluation
                        </AppButton>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 5. Event Moments & Photos */}
            {eventPhotos.length > 0 && (
              <Card className="border-line shadow-xs">
                <CardHeader className="bg-surface-2/60 border-b border-line">
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <span>Event Moments Gallery ({eventPhotos.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {eventPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative rounded-[14px] overflow-hidden border border-line bg-surface-2 aspect-video"
                      >
                        <img
                          src={photo.storage_path}
                          alt={photo.caption || event.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                        />
                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs truncate">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar 4-column column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Coordinator Controls (if coordinator of event or admin) */}
            {canManageEvent && !isCancelled && (
              <Card className="border-line shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-line">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                    Coordinator Session Hub
                  </h3>
                </div>

                <div className="flex flex-col gap-2">
                  {!isCompleted ? (
                    <>
                      <AppButton
                        variant="primary"
                        size="sm"
                        onClick={() => setIsRotatingQrOpen(true)}
                        className="w-full text-xs gap-1.5 shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Start Attendance (Live QR)</span>
                      </AppButton>
                      <Link to={`/events/${event.id}/attendance`}>
                        <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>Attendance & Feedback Hub</span>
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Link to={`/coordinator/events/${event.id}/attendees`}>
                        <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>Attendee Roster</span>
                        </Button>
                      </Link>
                      <AppButton
                        variant="primary"
                        size="sm"
                        className="w-full text-xs gap-1.5 shadow-xs"
                        onClick={() => setIsUploadPhotoModalOpen(true)}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Event Moments</span>
                      </AppButton>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Student Volunteering Card */}
            {role === 'student' && !isCancelled && !isCompleted && (
              <Card className="border-line shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-line">
                  <HandHeart className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                    Student Volunteering
                  </h3>
                </div>

                {volunteerStatus ? (
                  <div className="p-3 rounded-[12px] bg-surface-2 border border-line space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">Application Status</span>
                      <Badge
                        variant={
                          volunteerStatus.status === 'accepted'
                            ? 'success'
                            : volunteerStatus.status === 'rejected'
                            ? 'neutral'
                            : 'warning'
                        }
                        size="sm"
                        className="uppercase text-xs"
                      >
                        {volunteerStatus.status}
                      </Badge>
                    </div>
                    {volunteerStatus.assigned_role && (
                      <p className="text-xs text-emerald-700 font-medium">
                        Assigned Role: {volunteerStatus.assigned_role}
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
                    Apply as Student Volunteer
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          REGISTRATION FLOW MODAL (via AppStepper: Details, Confirm, Pass)
          ========================================================================= */}
      {isRegisterModalOpen && (
        <Modal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          title="Session Registration Flow"
          subtitle="Francis Xavier Engineering College • Autonomous Event System"
          maxWidth="max-w-xl"
        >
          <div className="py-2">
            <Stepper
              initialStep={registrationStep}
              onStepChange={setRegistrationStep}
              showFooter={false}
            >
              {/* Step 1: Review & Prerequisites */}
              <Step>
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-[16px] bg-surface-2 border border-line space-y-2">
                    <p className="text-xs uppercase font-bold text-primary tracking-wider">Step 1: Session Details</p>
                    <h3 className="font-serif font-bold text-lg text-ink">{event.title}</h3>
                    <p className="text-xs text-muted">
                      {new Date(event.start_time).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })} • {event.venues?.name || event.custom_venue || 'FXEC Campus'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-[12px] bg-primary-soft/40 border border-primary/20 text-xs text-ink space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-primary">
                      <ShieldCheck className="w-4 h-4" /> Academic Policy Notice:
                    </p>
                    <p className="text-muted">
                      Attendance is strictly verified in person via the coordinator's rotating dynamic QR code. Unclaimed seats may be auto-released to waitlisted peers.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-line">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRegisterModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setRegistrationStep(2)}
                    >
                      Continue to Confirmation →
                    </Button>
                  </div>
                </div>
              </Step>

              {/* Step 2: Confirm Seat Reservation */}
              <Step>
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-[16px] bg-surface-2 border border-line space-y-2.5">
                    <p className="text-xs uppercase font-bold text-primary tracking-wider">Step 2: Confirm Student Identity</p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-line">
                        <span className="text-muted">Student Name:</span>
                        <span className="font-bold text-ink">{profile?.name || user?.email?.split('@')[0]}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-line">
                        <span className="text-muted">Register Number:</span>
                        <span className="font-mono font-bold text-ink">{profile?.register_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted">Department:</span>
                        <span className="font-bold text-ink">{profile?.departments?.code || 'Engineering'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2 pt-3 border-t border-line">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRegistrationStep(1)}
                    >
                      ← Back
                    </Button>
                    <AppButton
                      variant="primary"
                      size="sm"
                      isLoading={isSubmitting}
                      onClick={handleRegister}
                    >
                      Confirm Seat Allocation
                    </AppButton>
                  </div>
                </div>
              </Step>

              {/* Step 3: Admission Pass */}
              <Step>
                <div className="space-y-4 pt-2">
                  <div className="text-center space-y-1 pb-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Seat Confirmed!
                    </span>
                    <h3 className="font-serif font-bold text-lg text-ink">Official Admission Pass</h3>
                  </div>

                  {userRegistration && (
                    <TearTicket registration={userRegistration} />
                  )}

                  <div className="flex justify-end pt-3 border-t border-line">
                    <AppButton
                      variant="primary"
                      size="sm"
                      onClick={() => setIsRegisterModalOpen(false)}
                    >
                      Done & View Details
                    </AppButton>
                  </div>
                </div>
              </Step>
            </Stepper>
          </div>
        </Modal>
      )}

      {/* QR Modals */}
      <RotatingQRModal
        isOpen={isRotatingQrOpen}
        onClose={() => setIsRotatingQrOpen(false)}
        event={event}
      />

      <QRScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        event={event}
        onSuccess={() => {
          setIsAttended(true);
          loadEvent();
        }}
      />

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        event={event}
        onSuccess={() => {
          setHasSubmittedFeedback(true);
          loadEvent();
        }}
      />

      {/* Coordinator Cancel Event Modal */}
      {isCancelEventModalOpen && (
        <Modal
          isOpen={isCancelEventModalOpen}
          onClose={() => setIsCancelEventModalOpen(false)}
          title="Cancel Keynote Session"
          description={`Provide a mandatory reason for cancelling "${event.title}".`}
        >
          <form onSubmit={handleCoordinatorCancelEvent} className="space-y-4">
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-[12px] text-xs text-danger space-y-1">
              <p className="font-bold">Atomic Mass Cancellation Notice:</p>
              <p>
                Cancelling this session will immediately notify all registered and waitlisted students with your reason in a single transaction.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Cancellation Reason <span className="text-danger">*</span>
              </label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Keynote speaker flight delayed. Rescheduled date will be announced soon."
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
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

      {/* Volunteer Application Modal */}
      {isVolunteerModalOpen && (
        <Modal
          isOpen={isVolunteerModalOpen}
          onClose={() => setIsVolunteerModalOpen(false)}
          title="Apply to Volunteer"
          subtitle={`Francis Xavier Engineering College • "${event.title}"`}
        >
          <form onSubmit={handleApplyVolunteer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Preferred Volunteer Role <span className="text-danger">*</span>
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

            <p className="text-xs text-muted">
              The event coordinator will review your application and assign specific duties. Volunteering earns leadership experience and campus recognition.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
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

      {/* Upload Event Photo Modal */}
      {isUploadPhotoModalOpen && (
        <Modal
          isOpen={isUploadPhotoModalOpen}
          onClose={() => setIsUploadPhotoModalOpen(false)}
          title="Upload Event Photos"
          subtitle={`Francis Xavier Engineering College • "${event.title}"`}
        >
          <form onSubmit={handleUploadPhoto} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Select Photo <span className="text-danger">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-ink file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-soft file:text-primary hover:file:bg-primary/20 cursor-pointer"
                required
              />
              <p className="text-xs text-muted mt-1">
                Formats: PNG, JPG, WEBP. Max size: 15MB.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Caption / Highlight (Optional)
              </label>
              <Input
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="e.g. Keynote address on scalable distributed architecture"
              />
            </div>

            <p className="text-xs text-muted">
              Uploaded photos undergo administrative review before appearing in the public moments carousel.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUploadPhotoModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUploadingPhoto}
                icon={UploadCloud}
              >
                Upload Photo
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
