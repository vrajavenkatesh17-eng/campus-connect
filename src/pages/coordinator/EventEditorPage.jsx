import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { profileService } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Spinner from '../../components/common/Spinner';
import { Calendar, User, MapPin, Upload, AlertCircle, ArrowLeft } from 'lucide-react';

export default function EventEditorPage() {
  const { id } = useParams(); // If present, edit mode
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [venues, setVenues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueId, setVenueId] = useState('');
  const [customVenue, setCustomVenue] = useState('');
  const [seatCapacity, setSeatCapacity] = useState('100');
  const [isAllDepartments, setIsAllDepartments] = useState(true);
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);

  // Poster State
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [existingPosterUrl, setExistingPosterUrl] = useState(null);

  // Speaker State
  const [speakerId, setSpeakerId] = useState(null);
  const [speakerName, setSpeakerName] = useState('');
  const [speakerDesignation, setSpeakerDesignation] = useState('');
  const [speakerCompany, setSpeakerCompany] = useState('');
  const [speakerExperience, setSpeakerExperience] = useState('');
  const [speakerLinkedIn, setSpeakerLinkedIn] = useState('');

  // Form Errors
  const [errors, setErrors] = useState({});

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
            setTitle(evt.title);
            setDescription(evt.description);

            const start = new Date(evt.start_time);
            const end = new Date(evt.end_time);
            setEventDate(start.toISOString().split('T')[0]);
            setStartTime(start.toTimeString().substring(0, 5));
            setEndTime(end.toTimeString().substring(0, 5));

            setVenueId(evt.venue_id || '');
            setCustomVenue(evt.custom_venue || '');
            setSeatCapacity(evt.seat_capacity.toString());
            setIsAllDepartments(evt.is_all_departments);
            setSelectedDeptIds(evt.event_departments?.map((d) => d.department?.id) || []);
            setExistingPosterUrl(evt.poster_url);

            if (evt.speakers) {
              setSpeakerId(evt.speakers.id);
              setSpeakerName(evt.speakers.name);
              setSpeakerDesignation(evt.speakers.designation);
              setSpeakerCompany(evt.speakers.company);
              setSpeakerExperience(evt.speakers.experience || '');
              setSpeakerLinkedIn(evt.speakers.linkedin_url || '');
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
    return () => { isMounted = false; };
  }, [id, isEditMode, showToast]);

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Poster must be a JPG, PNG, or WebP image.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Poster image must be smaller than 2MB.', 'error');
      return;
    }

    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!description.trim()) errs.description = 'Description is required.';
    if (!eventDate) errs.eventDate = 'Event date is required.';
    if (!startTime) errs.startTime = 'Start time is required.';
    if (!endTime) errs.endTime = 'End time is required.';

    // Validate dates: no past dates
    if (eventDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(eventDate);
      if (selected < today && !isEditMode) {
        errs.eventDate = 'Event date cannot be in the past.';
      }
    }

    // Validate times: end > start
    if (eventDate && startTime && endTime) {
      const startDateTime = new Date(`${eventDate}T${startTime}`);
      const endDateTime = new Date(`${eventDate}T${endTime}`);
      if (endDateTime <= startDateTime) {
        errs.endTime = 'End time must be after start time.';
      }
    }

    const cap = parseInt(seatCapacity, 10);
    if (isNaN(cap) || cap <= 0) {
      errs.seatCapacity = 'Seat capacity must be greater than zero.';
    }

    if (!isAllDepartments && selectedDeptIds.length === 0) {
      errs.departments = 'Select at least one department or check All Departments.';
    }

    if (!speakerName.trim()) errs.speakerName = 'Speaker name is required.';
    if (!speakerCompany.trim()) errs.speakerCompany = 'Speaker company / organization is required.';
    if (!speakerDesignation.trim()) errs.speakerDesignation = 'Speaker designation is required.';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      showToast('Please fix the errors in the form before submitting.', 'warning');
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
      };

      const speakerPayload = {
        name: speakerName.trim(),
        designation: speakerDesignation.trim(),
        company: speakerCompany.trim(),
        experience: speakerExperience.trim() || null,
        linkedin_url: speakerLinkedIn.trim() || null,
      };

      if (isEditMode) {
        await eventService.updateEvent(id, eventPayload, speakerPayload, posterFile, selectedDeptIds);
        showToast('Event updated successfully!', 'success');
      } else {
        await eventService.createEvent(eventPayload, speakerPayload, posterFile, selectedDeptIds);
        showToast('Event proposal submitted! Awaiting administrator approval.', 'success');
      }

      navigate('/coordinator');
    } catch (err) {
      console.error('Submission failed:', err);
      showToast(err.message || 'Failed to save event.', 'error');
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
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500 font-medium">Loading event proposal editor...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={isEditMode ? 'Edit Event Proposal' : 'Propose New Guest Lecture'}
      subtitle="Francis Xavier Engineering College Event Management"
      actions={
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Cancel
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        {/* Section 1: Event Information */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Primary lecture information visible to students and faculty</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <Input
              label="Event Title"
              required
              placeholder="e.g. Next-Gen Cloud Architecture & Microservices"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
            />

            <Textarea
              label="Description & Agenda"
              required
              rows={4}
              placeholder="Provide a comprehensive summary of the session topics, learning outcomes, and prerequisites..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
            />

            {/* Date and Time Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Event Date"
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                error={errors.eventDate}
              />

              <Input
                label="Start Time"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                error={errors.startTime}
              />

              <Input
                label="End Time"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                error={errors.endTime}
              />
            </div>

            {/* Venue & Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Campus Venue"
                value={venueId}
                onChange={(e) => {
                  setVenueId(e.target.value);
                  if (e.target.value) {
                    const selected = venues.find((v) => v.id === e.target.value);
                    if (selected && !isEditMode) {
                      setSeatCapacity(selected.capacity.toString());
                    }
                  }
                }}
                placeholder="Select hall or auditorium"
                options={venues.map((v) => ({
                  value: v.id,
                  label: `${v.name} (${v.capacity} seats)`,
                }))}
              />

              <Input
                label="Seat Capacity"
                type="number"
                min="1"
                required
                value={seatCapacity}
                onChange={(e) => setSeatCapacity(e.target.value)}
                error={errors.seatCapacity}
                helperText="Registrations above this limit are automatically waitlisted."
              />
            </div>

            <Input
              label="Custom / Online Venue (Optional)"
              placeholder="Specify room or online link if not selecting a campus venue"
              value={customVenue}
              onChange={(e) => setCustomVenue(e.target.value)}
            />

            {/* Poster Upload */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Session Poster Image (Max 2MB)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePosterChange}
                  className="text-xs text-neutral-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-burgundy-50 file:text-burgundy hover:file:bg-burgundy-100 cursor-pointer"
                />
                {(posterPreview || existingPosterUrl) && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                    <img
                      src={posterPreview || existingPosterUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Department Targeting */}
        <Card>
          <CardHeader>
            <CardTitle>Department Eligibility</CardTitle>
            <CardDescription>
              Restrict session registrations to specific student branches, enforced at the database RLS level
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 bg-neutral-50 cursor-pointer hover:bg-neutral-100/70 transition-colors">
              <input
                type="checkbox"
                checked={isAllDepartments}
                onChange={(e) => setIsAllDepartments(e.target.checked)}
                className="w-4 h-4 text-burgundy rounded border-neutral-300 focus:ring-burgundy"
              />
              <div>
                <span className="text-sm font-semibold text-neutral-900">
                  Open to All College Departments
                </span>
                <p className="text-xs text-neutral-500">
                  Any student across engineering and management departments can register.
                </p>
              </div>
            </label>

            {!isAllDepartments && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-neutral-700">
                  Select Target Departments:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {departments.map((dept) => {
                    const isSelected = selectedDeptIds.includes(dept.id);
                    return (
                      <button
                        type="button"
                        key={dept.id}
                        onClick={() => handleDeptToggle(dept.id)}
                        className={`p-2.5 rounded-lg border text-xs text-left font-medium transition-all ${
                          isSelected
                            ? 'bg-burgundy-50 border-burgundy text-burgundy font-bold shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {dept.code} - {dept.name}
                      </button>
                    );
                  })}
                </div>
                {errors.departments && (
                  <p className="text-xs text-red-600 font-medium">{errors.departments}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Guest Speaker Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Guest Speaker Credentials</CardTitle>
            <CardDescription>Industry professional details displayed on the event spotlight</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Speaker Full Name"
                required
                placeholder="e.g. Dr. Sundar Ramanathan"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                error={errors.speakerName}
                icon={User}
              />

              <Input
                label="Designation / Role"
                required
                placeholder="e.g. Principal Cloud Architect"
                value={speakerDesignation}
                onChange={(e) => setSpeakerDesignation(e.target.value)}
                error={errors.speakerDesignation}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company / Institution"
                required
                placeholder="e.g. Amazon Web Services, Google, Zoho"
                value={speakerCompany}
                onChange={(e) => setSpeakerCompany(e.target.value)}
                error={errors.speakerCompany}
              />

              <Input
                label="Years of Experience (Optional)"
                placeholder="e.g. 15+ years in Enterprise AI"
                value={speakerExperience}
                onChange={(e) => setSpeakerExperience(e.target.value)}
              />
            </div>

            <Input
              label="Speaker LinkedIn URL (Optional)"
              type="url"
              placeholder="https://linkedin.com/in/username"
              value={speakerLinkedIn}
              onChange={(e) => setSpeakerLinkedIn(e.target.value)}
            />
          </CardContent>

          <CardFooter className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">
              New proposals are marked &apos;pending&apos; until Administrator approval.
            </span>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              size="md"
            >
              {isEditMode ? 'Update Event' : 'Submit Event Proposal'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </DashboardLayout>
  );
}
