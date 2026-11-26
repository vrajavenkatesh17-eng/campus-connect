/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * EventEditorPage: S-M 1 Event Wizard via AppStepper
 * 5 Distinct Guided Steps:
 * 1. Basics: Title, Event Type, Description, Date, Start/End times (no past dates; end > start)
 * 2. Speaker: Name, Designation, Company, Experience, LinkedIn, Photo preview
 * 3. Venue & Seats: AppSelect venue with LIVE overlap check, capacity <= venue capacity, department targeting, registration deadline
 * 4. Poster: Upload with preview in 4:5 and 16:9 crops, type/size limits, client-side WebP resize
 * 5. Review: Full summary + validation errors per step, Submit for approval
 *
 * Auto-saves private draft (status: 'draft') on step change.
 * Every field has label above, helper text, and inline error messages.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { profileService } from '../../services/profileService';
import { optimizeImageToWebP } from '../../utils/imageOptimizer';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AppStepper, { Step } from '../../components/app/AppStepper';
import AppButton from '../../components/app/AppButton';
import AppSelect from '../../components/app/AppSelect';
import AppSwitch from '../../components/app/AppSwitch';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Upload,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Building2,
  Sparkles,
  Info,
} from 'lucide-react';

const EVENT_TYPES = [
  { value: 'guest_lecture', label: 'Technical Guest Lecture' },
  { value: 'workshop', label: 'Hands-on Technical Workshop' },
  { value: 'symposium', label: 'National Symposium / Hackathon' },
  { value: 'seminar', label: 'Industry Seminar & Panel' },
];

export default function EventEditorPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [draftId, setDraftId] = useState(id || null);
  const [venues, setVenues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Step 1: Basics
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('guest_lecture');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // Step 2: Speaker
  const [speakerId, setSpeakerId] = useState(null);
  const [speakerName, setSpeakerName] = useState('');
  const [speakerDesignation, setSpeakerDesignation] = useState('');
  const [speakerCompany, setSpeakerCompany] = useState('');
  const [speakerExperience, setSpeakerExperience] = useState('');
  const [speakerLinkedIn, setSpeakerLinkedIn] = useState('');
  const [speakerPhotoUrl, setSpeakerPhotoUrl] = useState('');

  // Step 3: Venue & Seats
  const [venueId, setVenueId] = useState('');
  const [customVenue, setCustomVenue] = useState('');
  const [seatCapacity, setSeatCapacity] = useState('100');
  const [isAllDepartments, setIsAllDepartments] = useState(true);
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [venueOverlapWarning, setVenueOverlapWarning] = useState(null);

  // Step 4: Poster
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [existingPosterUrl, setExistingPosterUrl] = useState(null);

  // Validation Errors per Step
  const [errors, setErrors] = useState({});

  // Initial load
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const [venuesList, deptsList] = await Promise.all([
          eventService.getVenues(),
          profileService.getDepartments(),
        ]);

        if (isMounted) {
          setVenues(venuesList || []);
          setDepartments(deptsList || []);
        }

        if (isEditMode) {
          const evt = await eventService.getEventById(id);
          if (isMounted && evt) {
            setTitle(evt.title || '');
            setDescription(evt.description || '');

            const start = new Date(evt.start_time);
            const end = new Date(evt.end_time);
            setEventDate(start.toISOString().split('T')[0]);
            setStartTime(start.toTimeString().substring(0, 5));
            setEndTime(end.toTimeString().substring(0, 5));
            setIsCompleted(evt.status === 'completed' || end <= new Date());

            setVenueId(evt.venue_id || '');
            setCustomVenue(evt.custom_venue || '');
            setSeatCapacity(evt.seat_capacity?.toString() || '100');
            setIsAllDepartments(evt.is_all_departments !== false);
            setSelectedDeptIds(evt.event_departments?.map((d) => d.department?.id || d.department_id) || []);
            setExistingPosterUrl(evt.poster_url);

            if (evt.speakers) {
              setSpeakerId(evt.speakers.id);
              setSpeakerName(evt.speakers.name || '');
              setSpeakerDesignation(evt.speakers.designation || '');
              setSpeakerCompany(evt.speakers.company || '');
              setSpeakerExperience(evt.speakers.experience || '');
              setSpeakerLinkedIn(evt.speakers.linkedin_url || '');
              setSpeakerPhotoUrl(evt.speakers.photo_url || '');
            }
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
        showToast('Failed to load event data.', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, showToast]);

  // LIVE Venue Overlap Check (S-M 1.3)
  useEffect(() => {
    if (!venueId || !eventDate || !startTime || !endTime) {
      setVenueOverlapWarning(null);
      return;
    }

    const startIso = new Date(`${eventDate}T${startTime}`).toISOString();
    const endIso = new Date(`${eventDate}T${endTime}`).toISOString();

    const timer = setTimeout(async () => {
      const result = await eventService.checkVenueAvailability(venueId, startIso, endIso, draftId);
      if (!result.available && result.conflictingEvent) {
        setVenueOverlapWarning(
          `Venue Overlap: "${result.conflictingEvent.title}" is already scheduled in this venue during this time window.`
        );
      } else {
        setVenueOverlapWarning(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [venueId, eventDate, startTime, endTime, draftId]);

  // Auto-Save Private Draft on Step Change (S-M 1)
  const autoSaveDraft = useCallback(async () => {
    if (!title.trim() || isEditMode) return;
    setIsAutoSaving(true);
    try {
      const startIso = eventDate && startTime ? new Date(`${eventDate}T${startTime}`).toISOString() : null;
      const endIso = eventDate && endTime ? new Date(`${eventDate}T${endTime}`).toISOString() : null;

      const eventPayload = {
        title: title.trim(),
        description: description.trim() || 'Draft proposal in progress',
        venue_id: venueId || null,
        custom_venue: customVenue.trim() || null,
        is_all_departments: isAllDepartments,
        start_time: startIso || new Date(Date.now() + 86400000).toISOString(),
        end_time: endIso || new Date(Date.now() + 90000000).toISOString(),
        seat_capacity: parseInt(seatCapacity, 10) || 100,
        status: 'draft',
      };

      const speakerPayload = speakerName.trim()
        ? {
            name: speakerName.trim(),
            designation: speakerDesignation.trim() || 'Keynote Speaker',
            company: speakerCompany.trim() || 'Guest Organization',
            experience: speakerExperience.trim() || null,
            linkedin_url: speakerLinkedIn.trim() || null,
          }
        : null;

      if (draftId) {
        await eventService.updateEvent(draftId, eventPayload, speakerPayload, posterFile, selectedDeptIds);
      } else {
        const saved = await eventService.createEvent(eventPayload, speakerPayload, posterFile, selectedDeptIds);
        if (saved?.id) setDraftId(saved.id);
      }
    } catch (err) {
      console.warn('Auto-save draft note:', err);
    } finally {
      setIsAutoSaving(false);
    }
  }, [
    title,
    description,
    venueId,
    customVenue,
    isAllDepartments,
    eventDate,
    startTime,
    endTime,
    seatCapacity,
    speakerName,
    speakerDesignation,
    speakerCompany,
    speakerExperience,
    speakerLinkedIn,
    draftId,
    posterFile,
    selectedDeptIds,
    isEditMode,
  ]);

  // Handle Poster Upload with Client-Side 1600px WebP Optimization (S-M 1.4 & S-Q 5)
  const handlePosterChange = async (e) => {
    const rawFile = e.target.files[0];
    if (!rawFile) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(rawFile.type)) {
      showToast('Poster must be a JPG, PNG, or WebP image.', 'error');
      return;
    }

    try {
      const { file: optimizedFile } = await optimizeImageToWebP(rawFile, {
        maxDimension: 1600,
        quality: 0.82,
      });

      if (optimizedFile.size > 2 * 1024 * 1024) {
        showToast('Optimized poster image must be under 2MB.', 'error');
        return;
      }

      setPosterFile(optimizedFile);
      setPosterPreview(URL.createObjectURL(optimizedFile));
      showToast('Poster optimized & ready for preview in 4:5 and 16:9.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to optimize poster image.', 'error');
    }
  };

  // Step Validations
  const validateStep = (stepNumber) => {
    const errs = {};

    if (stepNumber === 1 || stepNumber === 5) {
      if (!title.trim()) errs.title = 'Event title is required.';
      if (!description.trim()) errs.description = 'Description is required.';
      if (!eventDate) errs.eventDate = 'Event date is required.';
      if (!startTime) errs.startTime = 'Start time is required.';
      if (!endTime) errs.endTime = 'End time is required.';

      if (eventDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(eventDate);
        if (selected < today && !isEditMode) {
          errs.eventDate = 'Event date cannot be in the past.';
        }
      }

      if (eventDate && startTime && endTime) {
        const startDateTime = new Date(`${eventDate}T${startTime}`);
        const endDateTime = new Date(`${eventDate}T${endTime}`);
        if (endDateTime <= startDateTime) {
          errs.endTime = 'End time must be strictly after start time.';
        }
      }
    }

    if (stepNumber === 2 || stepNumber === 5) {
      if (!speakerName.trim()) errs.speakerName = 'Speaker name is required.';
      if (!speakerDesignation.trim()) errs.speakerDesignation = 'Speaker designation is required.';
      if (!speakerCompany.trim()) errs.speakerCompany = 'Company / organization is required.';
    }

    if (stepNumber === 3 || stepNumber === 5) {
      if (!venueId && !customVenue.trim()) {
        errs.venueId = 'Please select a campus venue or enter a custom venue.';
      }
      const cap = parseInt(seatCapacity, 10);
      if (isNaN(cap) || cap <= 0) {
        errs.seatCapacity = 'Seat capacity must be greater than zero.';
      }
      if (venueId) {
        const selectedVenue = venues.find((v) => v.id === venueId);
        if (selectedVenue && cap > selectedVenue.capacity) {
          errs.seatCapacity = `Capacity exceeds venue maximum (${selectedVenue.capacity} seats).`;
        }
      }
      if (!isAllDepartments && selectedDeptIds.length === 0) {
        errs.departments = 'Select at least one department or toggle All Departments.';
      }
    }

    return errs;
  };

  const handleStepChange = async (newStep) => {
    const currentErrs = validateStep(activeStep);
    if (newStep > activeStep && Object.keys(currentErrs).length > 0) {
      setErrors((prev) => ({ ...prev, ...currentErrs }));
      showToast('Please fix the required fields before proceeding.', 'warning');
      return;
    }

    // Auto-save draft on step transition
    autoSaveDraft();
    setActiveStep(newStep);
  };

  // Final Submit for Approval
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const allErrors = validateStep(5);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      showToast('Please complete all required fields across all steps.', 'warning');
      return;
    }

    if (venueOverlapWarning) {
      showToast('Please resolve venue time conflicts before submitting.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const startIso = new Date(`${eventDate}T${startTime}`).toISOString();
      const endIso = new Date(`${eventDate}T${endTime}`).toISOString();

      const eventPayload = {
        title: title.trim(),
        description: description.trim(),
        venue_id: venueId || null,
        custom_venue: customVenue.trim() || null,
        is_all_departments: isAllDepartments,
        start_time: startIso,
        end_time: endIso,
        seat_capacity: parseInt(seatCapacity, 10),
        existing_poster_url: existingPosterUrl,
        speaker_id: speakerId,
        status: 'pending', // Submit for Admin Approval
      };

      const speakerPayload = {
        name: speakerName.trim(),
        designation: speakerDesignation.trim(),
        company: speakerCompany.trim(),
        experience: speakerExperience.trim() || null,
        linkedin_url: speakerLinkedIn.trim() || null,
        photo_url: speakerPhotoUrl.trim() || null,
      };

      if (isEditMode || draftId) {
        const targetId = id || draftId;
        await eventService.updateEvent(targetId, eventPayload, speakerPayload, posterFile, selectedDeptIds);
        showToast('Event proposal submitted! Awaiting administrator approval.', 'success');
      } else {
        await eventService.createEvent(eventPayload, speakerPayload, posterFile, selectedDeptIds);
        showToast('Event proposal submitted! Awaiting administrator approval.', 'success');
      }

      navigate('/coordinator');
    } catch (err) {
      console.error('Submission failed:', err);
      showToast(err.message || 'Failed to submit event proposal.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeptToggle = (deptId) => {
    setSelectedDeptIds((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted font-medium">Loading event proposal wizard...</p>
        </div>
      </DashboardLayout>
    );
  }

  const selectedVenueObj = venues.find((v) => v.id === venueId);

  return (
    <DashboardLayout
      title={isEditMode ? 'Edit Event Proposal' : 'Propose New Event'}
      subtitle="Francis Xavier Engineering College Event Wizard"
      actions={
        <div className="flex items-center gap-3">
          {isAutoSaving && (
            <span className="text-xs text-muted flex items-center gap-1">
              <Spinner size="sm" />
              <span>Saving draft...</span>
            </span>
          )}
          <AppButton variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Cancel</span>
          </AppButton>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* S-M 1 AppStepper Multi-Step Indicator */}
        <AppStepper
          activeStep={activeStep}
          onStepChange={handleStepChange}
        >
          {/* STEP 1: BASICS */}
          <Step title="Basics" description="Title & Schedule">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Session Basics</CardTitle>
                <CardDescription>Event title, category, comprehensive agenda and date/time</CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <Input
                  label="Event Title"
                  required
                  placeholder="e.g., Next-Gen Cloud Architecture & Microservices"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={errors.title}
                  helper="Enter a descriptive, clear title for students and faculty"
                />

                <AppSelect
                  label="Event Type / Category"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  options={EVENT_TYPES}
                  helper="Determines activity badge and certificate classification"
                />

                <Textarea
                  label="Description & Agenda"
                  required
                  rows={4}
                  placeholder="Provide an overview of the session, key takeaways, and prerequisites..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  error={errors.description}
                  helper="Detailed agenda displayed on student explorer"
                />

                {/* Date & Time Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Event Date"
                    type="date"
                    required
                    disabled={isCompleted}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    error={errors.eventDate}
                    helper="No past dates allowed"
                  />

                  <Input
                    label="Start Time"
                    type="time"
                    required
                    disabled={isCompleted}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    error={errors.startTime}
                  />

                  <Input
                    label="End Time"
                    type="time"
                    required
                    disabled={isCompleted}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    error={errors.endTime}
                    helper="Must end after start time"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <AppButton
                    variant="primary"
                    onClick={() => handleStepChange(2)}
                  >
                    Next: Speaker Credentials →
                  </AppButton>
                </div>
              </CardContent>
            </Card>
          </Step>

          {/* STEP 2: SPEAKER */}
          <Step title="Speaker" description="Industry Profile">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Guest Speaker Credentials</CardTitle>
                <CardDescription>Industry professional details displayed on certificates & event spotlight</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Speaker Full Name"
                    required
                    placeholder="e.g., Dr. Sundar Ramanathan"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    error={errors.speakerName}
                    helper="Name as it should appear on official certificates"
                  />

                  <Input
                    label="Designation / Role"
                    required
                    placeholder="e.g., Principal Cloud Architect"
                    value={speakerDesignation}
                    onChange={(e) => setSpeakerDesignation(e.target.value)}
                    error={errors.speakerDesignation}
                    helper="Official corporate or academic designation"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Company / Institution"
                    required
                    placeholder="e.g., Amazon Web Services, Zoho, IIT"
                    value={speakerCompany}
                    onChange={(e) => setSpeakerCompany(e.target.value)}
                    error={errors.speakerCompany}
                    helper="Organization or academic institution name"
                  />

                  <Input
                    label="Years of Experience (Optional)"
                    placeholder="e.g., 15+ years in Enterprise AI"
                    value={speakerExperience}
                    onChange={(e) => setSpeakerExperience(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Speaker LinkedIn URL (Optional)"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={speakerLinkedIn}
                    onChange={(e) => setSpeakerLinkedIn(e.target.value)}
                  />

                  <Input
                    label="Speaker Headshot Photo URL (Optional)"
                    type="url"
                    placeholder="https://.../photo.jpg"
                    value={speakerPhotoUrl}
                    onChange={(e) => setSpeakerPhotoUrl(e.target.value)}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <AppButton variant="secondary" onClick={() => handleStepChange(1)}>
                    ← Back: Basics
                  </AppButton>
                  <AppButton variant="primary" onClick={() => handleStepChange(3)}>
                    Next: Venue & Seats →
                  </AppButton>
                </div>
              </CardContent>
            </Card>
          </Step>

          {/* STEP 3: VENUE & SEATS */}
          <Step title="Venue & Seats" description="Hall & Targeting">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Venue Allocation & Capacity</CardTitle>
                <CardDescription>Live availability check against college auditorium calendar</CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Overlap Warning Alert */}
                {venueOverlapWarning && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{venueOverlapWarning}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AppSelect
                    label="Campus Venue"
                    value={venueId}
                    onChange={(e) => {
                      setVenueId(e.target.value);
                      const sel = venues.find((v) => v.id === e.target.value);
                      if (sel && !isEditMode) {
                        setSeatCapacity(sel.capacity.toString());
                      }
                    }}
                    placeholder="Select hall or auditorium"
                    options={venues.map((v) => ({
                      value: v.id,
                      label: `${v.name} (${v.capacity} seats)`,
                    }))}
                    error={errors.venueId}
                    helper="Subject to automated real-time overlap validation"
                  />

                  <Input
                    label="Seat Capacity"
                    type="number"
                    min="1"
                    required
                    value={seatCapacity}
                    onChange={(e) => setSeatCapacity(e.target.value)}
                    error={errors.seatCapacity}
                    helper={selectedVenueObj ? `Max venue capacity: ${selectedVenueObj.capacity}` : 'Max students allowed to register'}
                  />
                </div>

                {!venueId && (
                  <Input
                    label="Custom / External Venue Name"
                    placeholder="e.g., Mechanical Seminar Hall Block C"
                    value={customVenue}
                    onChange={(e) => setCustomVenue(e.target.value)}
                    helper="Provide specific location if not listed in default venues"
                  />
                )}

                {/* Registration Deadline */}
                <Input
                  label="Registration Deadline (Optional)"
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  helper="Date after which new student registrations close"
                />

                {/* Department Targeting */}
                <div className="pt-2 border-t border-line space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-line bg-surface-2">
                    <div>
                      <span className="text-sm font-semibold text-ink">Open to All Departments</span>
                      <p className="text-xs text-muted">All engineering and management students can participate</p>
                    </div>
                    <AppSwitch
                      checked={isAllDepartments}
                      onChange={(checked) => setIsAllDepartments(checked)}
                    />
                  </div>

                  {!isAllDepartments && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold text-ink">Select Allowed Departments:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {departments.map((dept) => {
                          const isSelected = selectedDeptIds.includes(dept.id);
                          return (
                            <AppButton
                              variant={isSelected ? 'primary' : 'secondary'}
                              size="sm"
                              key={dept.id}
                              onClick={() => handleDeptToggle(dept.id)}
                              className="text-xs justify-start"
                            >
                              {dept.code}
                            </AppButton>
                          );
                        })}
                      </div>
                      {errors.departments && (
                        <p className="text-xs text-rose-500 font-medium">{errors.departments}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <AppButton variant="secondary" onClick={() => handleStepChange(2)}>
                    ← Back: Speaker
                  </AppButton>
                  <AppButton variant="primary" onClick={() => handleStepChange(4)}>
                    Next: Poster Upload →
                  </AppButton>
                </div>
              </CardContent>
            </Card>
          </Step>

          {/* STEP 4: POSTER */}
          <Step title="Poster" description="4:5 & 16:9 Previews">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Event Promotional Artwork</CardTitle>
                <CardDescription>Upload poster with client-side WebP compression and dual aspect-ratio preview</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    Upload Poster (JPG, PNG, WebP — max 2MB)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePosterChange}
                    className="block w-full text-xs text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer"
                  />
                  <p className="text-xs text-muted mt-1.5">
                    Images are automatically optimized to max 1600px WebP (q0.82) with metadata stripped.
                  </p>
                </div>

                {/* Previews in 4:5 and 16:9 crops per S-M 1.4 */}
                {(posterPreview || existingPosterUrl) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    {/* 4:5 Portrait Feed Crop */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>4:5 Portrait Explorer Crop</span>
                      </span>
                      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-line bg-surface-2 shadow-xs">
                        <img
                          src={posterPreview || existingPosterUrl}
                          alt="Poster 4:5 preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* 16:9 Landscape Banner Crop */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>16:9 Wide Display Crop</span>
                      </span>
                      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-line bg-surface-2 shadow-xs">
                        <img
                          src={posterPreview || existingPosterUrl}
                          alt="Poster 16:9 preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <AppButton variant="secondary" onClick={() => handleStepChange(3)}>
                    ← Back: Venue & Seats
                  </AppButton>
                  <AppButton variant="primary" onClick={() => handleStepChange(5)}>
                    Next: Review & Submit →
                  </AppButton>
                </div>
              </CardContent>
            </Card>
          </Step>

          {/* STEP 5: REVIEW */}
          <Step title="Review" description="Confirm & Submit">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Final Proposal Review</CardTitle>
                <CardDescription>Inspect summary details before submitting for official administrator approval</CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-surface-2 border border-line text-xs">
                  <div>
                    <span className="text-muted uppercase tracking-wider font-semibold">Event Title</span>
                    <p className="font-serif text-base font-bold text-ink mt-0.5">{title || 'Untitled'}</p>
                    <span className="text-muted mt-1 block">
                      {eventDate} • {startTime} to {endTime}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted uppercase tracking-wider font-semibold">Venue & Capacity</span>
                    <p className="font-semibold text-ink mt-0.5">
                      {selectedVenueObj?.name || customVenue || 'Venue not selected'}
                    </p>
                    <span className="text-muted mt-1 block">
                      Capacity: {seatCapacity} seats • {isAllDepartments ? 'All Departments' : `${selectedDeptIds.length} Depts`}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted uppercase tracking-wider font-semibold">Keynote Speaker</span>
                    <p className="font-semibold text-ink mt-0.5">{speakerName || 'Speaker not specified'}</p>
                    <span className="text-muted mt-0.5 block">
                      {speakerDesignation} at {speakerCompany}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted uppercase tracking-wider font-semibold">Poster Artwork</span>
                    <p className="font-semibold text-ink mt-0.5">
                      {posterPreview || existingPosterUrl ? 'Poster uploaded & optimized' : 'No poster uploaded (placeholder will be used)'}
                    </p>
                  </div>
                </div>

                {/* Validation summary banner */}
                {Object.keys(validateStep(5)).length > 0 ? (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>Missing required fields:</span>
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {Object.values(validateStep(5)).map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>All required fields are validated and compliant with FXEC event guidelines.</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-line">
                  <AppButton variant="secondary" onClick={() => handleStepChange(4)}>
                    ← Back: Poster
                  </AppButton>

                  <AppButton
                    variant="primary"
                    isLoading={isSaving}
                    disabled={Object.keys(validateStep(5)).length > 0 || Boolean(venueOverlapWarning)}
                    onClick={handleSubmit}
                  >
                    {isEditMode ? 'Update Event Proposal' : 'Submit Event for Approval'}
                  </AppButton>
                </div>
              </CardContent>
            </Card>
          </Step>
        </AppStepper>
      </div>
    </DashboardLayout>
  );
}
