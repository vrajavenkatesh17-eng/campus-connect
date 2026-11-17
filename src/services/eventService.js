import { supabase, isSupabaseConfigured } from './supabase';

export const eventService = {
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
    return data || [];
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

    return results;
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
    return data;
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
    return data || [];
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
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
    return data || [];
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
    return data || [];
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
    return data || [];
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
};
