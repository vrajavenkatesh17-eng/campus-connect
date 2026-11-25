import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Derives real-time event status using now().
 * Never trusts stored status if end_time has elapsed.
 */
export function deriveEventStatus(event) {
  if (!event) return event;
  const now = new Date();
  let status = event.status || 'pending';
  if (status !== 'cancelled' && status !== 'rejected') {
    if (event.end_time && new Date(event.end_time) <= now) {
      status = 'completed';
    }
  }
  return { ...event, status };
}

export const eventService = {
  /**
   * Fetch aggregate public stats (events hosted, students engaged, certificates issued, guest speakers)
   */
  async getPublicStats() {
    if (!isSupabaseConfigured) {
      return { events_hosted: 0, students_engaged: 0, certificates_issued: 0, guest_speakers: 0 };
    }
    try {
      const { data, error } = await supabase.rpc('public_stats');
      if (error) {
        // Fallback aggregate queries
        const [eventsRes, certsRes, attRes, spkRes] = await Promise.all([
          supabase.from('events').select('id', { count: 'exact', head: true }).lte('end_time', new Date().toISOString()),
          supabase.from('certificates').select('id', { count: 'exact', head: true }),
          supabase.from('attendance').select('student_id', { count: 'exact', head: true }).eq('status', 'present'),
          supabase.from('speakers').select('id', { count: 'exact', head: true }),
        ]);
        return {
          events_hosted: eventsRes.count || 0,
          students_engaged: attRes.count || 0,
          certificates_issued: certsRes.count || 0,
          guest_speakers: spkRes.count || 0,
        };
      }
      return data || { events_hosted: 0, students_engaged: 0, certificates_issued: 0, guest_speakers: 0 };
    } catch (err) {
      console.warn('Failed to load public stats:', err);
      return { events_hosted: 0, students_engaged: 0, certificates_issued: 0, guest_speakers: 0 };
    }
  },

  /**
   * Fetch the immediate next upcoming event for hero countdown chip
   */
  async getPublicNextEvent() {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.rpc('public_next_event');
      if (!error && Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      // Fallback
      const nowIso = new Date().toISOString();
      const { data: fbData, error: fbErr } = await supabase
        .from('events')
        .select(`
          id, title, start_time, end_time, poster_url, seat_capacity, registered_count, custom_venue,
          venues(name),
          speakers(name, company)
        `)
        .eq('status', 'approved')
        .gt('start_time', nowIso)
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fbErr || !fbData) return null;
      return {
        id: fbData.id,
        title: fbData.title,
        start_time: fbData.start_time,
        end_time: fbData.end_time,
        venue: fbData.venues?.name || fbData.custom_venue || 'Campus Central',
        poster_url: fbData.poster_url,
        speaker_name: fbData.speakers?.name || null,
        speaker_company: fbData.speakers?.company || null,
        seat_capacity: fbData.seat_capacity,
        registered_count: fbData.registered_count,
      };
    } catch (err) {
      console.warn('Failed to load next event:', err);
      return null;
    }
  },

  /**
   * Fetch approved upcoming events for public landing page (capped at 6)
   */
  async getPublicUpcomingEvents(limit = 6) {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.rpc('public_upcoming_events', {
        limit_count: Math.min(Math.max(limit, 1), 12),
      });
      if (!error && data) return data;

      // Fallback
      const nowIso = new Date().toISOString();
      const { data: fbData, error: fbErr } = await supabase
        .from('events')
        .select(`
          id, title, description, start_time, end_time, poster_url, seat_capacity, registered_count, custom_venue, category,
          venues(name),
          speakers(name, company)
        `)
        .eq('status', 'approved')
        .gt('start_time', nowIso)
        .order('start_time', { ascending: true })
        .limit(limit);

      if (fbErr) throw fbErr;
      return (fbData || []).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        start_time: e.start_time,
        end_time: e.end_time,
        venue: e.venues?.name || e.custom_venue || 'Campus Central',
        poster_url: e.poster_url,
        speaker_name: e.speakers?.name || null,
        speaker_company: e.speakers?.company || null,
        seat_capacity: e.seat_capacity,
        registered_count: e.registered_count,
        category: e.category,
      }));
    } catch (err) {
      console.warn('Failed to load upcoming public events:', err);
      return [];
    }
  },

  /**
   * Fetch completed events with approved photos and public summary for Moments carousel
   */
  async getPublicPastEvents(limit = 20) {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.rpc('public_past_events', {
        limit_count: Math.min(Math.max(limit, 1), 30),
      });
      if (!error && data) return data;

      // Fallback
      const nowIso = new Date().toISOString();
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('events')
        .select('id, title, event_date, start_time, end_time, poster_url, speakers(name, company)')
        .or(`status.eq.completed,end_time.lte.${nowIso}`)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: false })
        .limit(Math.min(limit, 20));

      if (fallbackError) throw fallbackError;
      return (fallbackData || []).map((e) => ({
        id: e.id,
        title: e.title,
        start_time: e.start_time,
        end_time: e.end_time,
        event_date: e.event_date || (e.start_time ? e.start_time.split('T')[0] : null),
        poster_url: e.poster_url,
        public_summary: e.public_summary || null,
        speaker_name: e.speakers?.name || null,
        speaker_company: e.speakers?.company || null,
        photos: [],
      }));
    } catch (err) {
      console.warn('Failed to load public past events:', err);
      return [];
    }
  },

  /**
   * Fetch distinct companies of past speakers for Industry Voices LogoLoop
   */
  async getPublicSpeakerCompanies() {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.rpc('public_speaker_companies');
      if (!error && Array.isArray(data)) {
        return data.map((d) => (typeof d === 'string' ? d : d.company)).filter(Boolean);
      }

      // Fallback
      const { data: fbData, error: fbErr } = await supabase
        .from('speakers')
        .select('company')
        .not('company', 'is', null)
        .neq('company', '')
        .limit(20);

      if (fbErr) throw fbErr;
      const unique = Array.from(new Set((fbData || []).map((s) => s.company?.trim()).filter(Boolean)));
      return unique;
    } catch (err) {
      console.warn('Failed to load speaker companies:', err);
      return [];
    }
  },

  /**
   * Fetch active venues for dropdown
   */
  async getVenues() {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(deriveEventStatus);
  },

  /**
   * Upload an event poster to Supabase Storage bucket 'event-posters'
   * Validates file type (jpeg, png, webp) and size (max 2MB)
   */
  async uploadPoster(file) {
    if (!file) return null;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid poster format: Only JPG, PNG, or WebP images are allowed.');
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('Poster file size exceeds 2MB limit.');
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `poster_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('event-posters')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('event-posters')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  /**
   * Fetch approved events with optional search, department filter, and date filter.
   * Department targeting is enforced at the database RLS level.
   */
  async getEvents({ search = '', departmentId = '', date = '' } = {}) {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('events')
      .select(`
        *,
        venues(id, name, building, capacity),
        speakers(id, name, designation, company, experience, linkedin_url, photo_url),
        coordinator:coordinator_id(id, name, email),
        event_departments(department:department_id(id, code, name))
      `)
      .order('start_time', { ascending: true });

    if (search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    let results = data || [];

    // Filter by department in memory if student requested specific filter
    if (departmentId) {
      results = results.filter((evt) => {
        if (evt.is_all_departments) return true;
        return evt.event_departments?.some((ed) => ed.department?.id === departmentId);
      });
    }

    return results.map(deriveEventStatus);
  },

  /**
   * Fetch single event by ID with full relations
   */
  async getEventById(eventId) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        venues(id, name, building, capacity),
        speakers(id, name, designation, company, experience, linkedin_url, photo_url),
        coordinator:coordinator_id(id, name, email),
        event_departments(department:department_id(id, code, name))
      `)
      .eq('id', eventId)
      .single();

    if (error) throw error;
    return deriveEventStatus(data);
  },

  /**
   * Fetch user's registrations
   */
  async getMyRegistrations() {
    if (!isSupabaseConfigured) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        event:event_id(
          id, title, start_time, end_time, status, seat_capacity, registered_count,
          venues(name),
          speakers(name, company)
        )
      `)
      .eq('student_id', user.id)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((r) => ({
      ...r,
      event: deriveEventStatus(r.event),
    }));
  },

  /**
   * Coordinator: Fetch events managed by the current coordinator
   */
  async getCoordinatorEvents() {
    if (!isSupabaseConfigured) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        venues(name),
        speakers(name, company),
        event_departments(department:department_id(id, code))
      `)
      .eq('coordinator_id', user.id)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return (data || []).map(deriveEventStatus);
  },

  /**
   * Admin: Fetch pending event proposals awaiting review
   */
  async getPendingEvents() {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        venues(name, building, capacity),
        speakers(name, designation, company, linkedin_url),
        coordinator:coordinator_id(name, email),
        event_departments(department:department_id(code, name))
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(deriveEventStatus);
  },

  /**
   * Admin: Fetch all events across all statuses
   */
  async getAllEventsAdmin() {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        venues(name, building, capacity),
        speakers(name, designation, company, linkedin_url),
        coordinator:coordinator_id(name, email),
        event_departments(department:department_id(code, name))
      `)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return (data || []).map(deriveEventStatus);
  },

  /**
   * Coordinator: Create event proposal with speaker and department targeting
   */
  async createEvent(eventPayload, speakerPayload, posterFile, targetDeptIds = []) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured.');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required.');

    // Upload poster if provided
    let posterUrl = null;
    if (posterFile) {
      posterUrl = await this.uploadPoster(posterFile);
    }

    // Create speaker record
    let speakerId = null;
    if (speakerPayload?.name) {
      const { data: speaker, error: spkError } = await supabase
        .from('speakers')
        .insert({
          name: speakerPayload.name,
          designation: speakerPayload.designation,
          company: speakerPayload.company,
          experience: speakerPayload.experience || null,
          linkedin_url: speakerPayload.linkedin_url || null,
          photo_url: speakerPayload.photo_url || null,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (spkError) throw spkError;
      speakerId = speaker.id;
    }

    // Create event record
    const { data: event, error: evtError } = await supabase
      .from('events')
      .insert({
        title: eventPayload.title,
        description: eventPayload.description,
        coordinator_id: user.id,
        speaker_id: speakerId,
        venue_id: eventPayload.venue_id || null,
        custom_venue: eventPayload.custom_venue || null,
        is_all_departments: eventPayload.is_all_departments,
        start_time: eventPayload.start_time,
        end_time: eventPayload.end_time,
        seat_capacity: parseInt(eventPayload.seat_capacity, 10),
        poster_url: posterUrl,
        status: 'pending',
      })
      .select('*')
      .single();

    if (evtError) throw evtError;

    // Attach targeted departments if not all
    if (!eventPayload.is_all_departments && targetDeptIds.length > 0) {
      const deptRows = targetDeptIds.map((deptId) => ({
        event_id: event.id,
        department_id: deptId,
      }));

      const { error: deptError } = await supabase
        .from('event_departments')
        .insert(deptRows);

      if (deptError) throw deptError;
    }

    return event;
  },

  /**
   * Coordinator: Edit event
   */
  async updateEvent(eventId, eventPayload, speakerPayload, posterFile, targetDeptIds = []) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured.');

    let posterUrl = eventPayload.existing_poster_url || null;
    if (posterFile) {
      posterUrl = await this.uploadPoster(posterFile);
    }

    // Update speaker if exists
    if (eventPayload.speaker_id && speakerPayload) {
      await supabase
        .from('speakers')
        .update({
          name: speakerPayload.name,
          designation: speakerPayload.designation,
          company: speakerPayload.company,
          experience: speakerPayload.experience || null,
          linkedin_url: speakerPayload.linkedin_url || null,
          photo_url: speakerPayload.photo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventPayload.speaker_id);
    }

    // Update event
    const { data: event, error: evtError } = await supabase
      .from('events')
      .update({
        title: eventPayload.title,
        description: eventPayload.description,
        venue_id: eventPayload.venue_id || null,
        custom_venue: eventPayload.custom_venue || null,
        is_all_departments: eventPayload.is_all_departments,
        start_time: eventPayload.start_time,
        end_time: eventPayload.end_time,
        seat_capacity: parseInt(eventPayload.seat_capacity, 10),
        poster_url: posterUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select('*')
      .single();

    if (evtError) throw evtError;

    // Update department targeting
    await supabase.from('event_departments').delete().eq('event_id', eventId);
    if (!eventPayload.is_all_departments && targetDeptIds.length > 0) {
      const deptRows = targetDeptIds.map((deptId) => ({
        event_id: eventId,
        department_id: deptId,
      }));
      await supabase.from('event_departments').insert(deptRows);
    }

    return event;
  },

  /**
   * Admin: Approve or Reject event proposal via atomic SECURITY DEFINER RPC
   */
  async adminDecideEvent(eventId, decision, rejectionReason = null) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured.');

    const { data, error } = await supabase.rpc('admin_decide_event', {
      p_event_id: eventId,
      p_decision: decision,
      p_rejection_reason: rejectionReason,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Atomic Registration: Register for event or join waitlist via RPC
   */
  async registerForEvent(eventId) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured.');

    const { data, error } = await supabase.rpc('register_for_event', {
      p_event_id: eventId,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Atomic Cancellation & Waitlist Promotion via RPC
   */
  async cancelRegistration(eventId) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured.');

    const { data, error } = await supabase.rpc('cancel_registration', {
      p_event_id: eventId,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Coordinator/Admin: Get registered and waitlisted student list for an event
   */
  async getEventAttendees(eventId) {
    if (!isSupabaseConfigured) return { registered: [], waitlisted: [] };

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        student:student_id(id, name, email, register_number, phone, departments(code, name))
      `)
      .eq('event_id', eventId)
      .in('status', ['registered', 'waitlisted'])
      .order('registered_at', { ascending: true });

    if (error) throw error;

    const list = data || [];
    return {
      registered: list.filter((r) => r.status === 'registered'),
      waitlisted: list
        .filter((r) => r.status === 'waitlisted')
        .sort((a, b) => (a.queue_position || 0) - (b.queue_position || 0)),
    };
  },

  /**
   * User notifications
   */
  async getNotifications() {
    if (!isSupabaseConfigured) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data || []).map(deriveEventStatus);
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId) {
    if (!isSupabaseConfigured) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllNotificationsAsRead(userId) {
    if (!isSupabaseConfigured || !userId) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  },

  /**
   * Coordinator/Admin: Cancel an event with mandatory reason.
   * Atomically updates status to 'cancelled' and notifies all registered & waitlisted students.
   */
  async cancelEvent(eventId, reason) {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase.rpc('cancel_event', {
      p_event_id: eventId,
      p_reason: reason.trim(),
    });

    if (error) throw error;
    return data;
  },

  /**
   * Fetch speaker profile and their past & upcoming events
   */
  async getSpeakerById(speakerId) {
    if (!isSupabaseConfigured) return null;

    const { data: speaker, error: spErr } = await supabase
      .from('speakers')
      .select('*')
      .eq('id', speakerId)
      .single();

    if (spErr) throw spErr;

    const { data: events, error: evErr } = await supabase
      .from('events')
      .select(`
        *,
        venues(id, name, building),
        coordinator:coordinator_id(id, name)
      `)
      .eq('speaker_id', speakerId)
      .order('start_time', { ascending: false });

    if (evErr) console.warn('Could not load speaker events:', evErr);

    return {
      ...speaker,
      events: events || [],
    };
  },

  /**
   * Admin: Add a new campus venue with capacity
   */
  async createVenue({ name, building, capacity }) {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase
      .from('venues')
      .insert({
        name: name.trim(),
        building: building?.trim() || 'Main Campus',
        capacity: parseInt(capacity, 10),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Admin: Update an existing venue
   */
  async updateVenue(id, { name, building, capacity }) {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase
      .from('venues')
      .update({
        name: name.trim(),
        building: building?.trim() || 'Main Campus',
        capacity: parseInt(capacity, 10),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Admin: Delete a venue
   */
  async deleteVenue(id) {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Upload an event photo for public gallery / moments carousel.
   * File is uploaded to public storage bucket 'event-posters' and inserted into public.event_photos.
   */
  async uploadEventPhoto({ eventId, file, caption, uploadedBy }) {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');
    if (!file) throw new Error('Please select an image file to upload.');

    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error('Image file size exceeds the 15MB limit.');
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `photos/${eventId}/${Date.now()}-${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from('event-posters')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      throw new Error(`Photo upload failed: ${uploadErr.message}`);
    }

    const { data: pubData } = supabase.storage
      .from('event-posters')
      .getPublicUrl(storagePath);
    const publicUrl = pubData?.publicUrl || storagePath;

    const { data, error } = await supabase
      .from('event_photos')
      .insert({
        event_id: eventId,
        storage_path: publicUrl,
        caption: caption?.trim() || null,
        status: 'pending',
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all photos for an event
   */
  async getEventPhotos(eventId) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('event_photos')
      .select('*, profiles:uploaded_by(name, email)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not load event photos:', error);
      return [];
    }
    return data || [];
  },
};
