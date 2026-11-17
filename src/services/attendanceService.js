import { supabase, isSupabaseConfigured } from './supabase';

export const attendanceService = {
  /**
   * Generates a 30-second rotating HMAC QR token for an event.
   * Callable only by event coordinator or admin.
   * @param {string} eventId
   */
  async getAttendanceToken(eventId) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase.rpc('get_attendance_token', {
      p_event_id: eventId,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Submits a scanned QR token to mark attendance.
   * Validates registration status, event time window, and token HMAC server-side.
   * @param {string} eventId
   * @param {string} token
   */
  async markAttendance(eventId, token) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase.rpc('mark_attendance', {
      p_event_id: eventId,
      p_token: token.trim(),
    });

    if (error) throw error;
    return data;
  },

  /**
   * Manually marks or unmarks student attendance with mandatory reason audit.
   * @param {string} eventId
   * @param {string} studentId
   * @param {boolean} isAttended
   * @param {string} reason
   */
  async manualMarkAttendance(eventId, studentId, isAttended, reason) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase.rpc('manual_mark_attendance', {
      p_event_id: eventId,
      p_student_id: studentId,
      p_is_attended: isAttended,
      p_reason: reason,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Fetches all attendance records for an event (Coordinator / Admin view).
   * @param {string} eventId
   */
  async getEventAttendance(eventId) {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          event_id,
          student_id,
          method,
          verified_at,
          created_at,
          student:student_id(
            id,
            name,
            email,
            register_number,
            department_id,
            departments(name, code)
          )
        `)
        .eq('event_id', eventId)
        .order('verified_at', { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn('Initial attendance query warning, trying fallback:', err);
    }

    // Resilient fallback query
    try {
      const { data: rawRows, error: rawErr } = await supabase
        .from('attendance')
        .select('*')
        .eq('event_id', eventId)
        .order('verified_at', { ascending: false });

      if (rawErr || !rawRows) return [];

      // Fetch profiles for student IDs
      const studentIds = rawRows.map((r) => r.student_id).filter(Boolean);
      if (studentIds.length === 0) return rawRows;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, register_number, department_id, departments(name, code)')
        .in('id', studentIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      return rawRows.map((r) => ({
        ...r,
        student: profileMap.get(r.student_id) || null,
      }));
    } catch (e) {
      console.error('getEventAttendance fallback error:', e);
      return [];
    }
  },

  /**
   * Subscribes to live attendance updates via Supabase Realtime.
   * @param {string} eventId
   * @param {function} onUpdate
   */
  subscribeToAttendance(eventId, onUpdate) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };

    const channel = supabase
      .channel(`attendance-realtime-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },

  /**
   * Fetches logged-in student's attendance history with event details.
   */
  async getStudentAttendanceHistory() {
    if (!isSupabaseConfigured) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        event_id,
        method,
        verified_at,
        created_at,
        event:events(
          id,
          title,
          start_time,
          end_time,
          status,
          custom_venue,
          venue:venues(name)
        )
      `)
      .eq('student_id', user.id)
      .order('verified_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Submits event feedback (1-5 ratings for content, speaker, organization + comments).
   * If isAnonymous = true, student_id is stored as NULL in feedback_responses.
   * @param {object} feedbackData
   */
  async submitFeedback({
    eventId,
    ratingContent,
    ratingSpeaker,
    ratingOrganization,
    comments,
    isAnonymous = false,
  }) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase.rpc('submit_event_feedback', {
      p_event_id: eventId,
      p_rating_content: parseInt(ratingContent, 10),
      p_rating_speaker: parseInt(ratingSpeaker, 10),
      p_rating_organization: parseInt(ratingOrganization, 10),
      p_comments: comments || '',
      p_is_anonymous: isAnonymous,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Checks whether the current student has already submitted feedback for an event.
   * @param {string} eventId
   */
  async hasSubmittedFeedback(eventId) {
    if (!isSupabaseConfigured) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('feedback_submissions')
      .select('id')
      .eq('event_id', eventId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (error) return false;
    return !!data;
  },

  /**
   * Fetches feedback analytics and reviews for an event (Coordinator / Admin view).
   * @param {string} eventId
   */
  async getEventFeedback(eventId) {
    if (!isSupabaseConfigured) return { reviews: [], stats: null };

    const emptyResult = {
      reviews: [],
      stats: {
        totalReviews: 0,
        avgContent: 0,
        avgSpeaker: 0,
        avgOrganization: 0,
        overallScore: 0,
      },
    };

    let reviews = [];

    // Attempt primary relational query
    try {
      const { data, error } = await supabase
        .from('feedback_responses')
        .select(`
          id,
          rating_content,
          rating_speaker,
          rating_organization,
          comments,
          is_anonymous,
          created_at,
          student:student_id(
            id,
            name,
            department_id,
            departments(code)
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        reviews = data;
      }
    } catch (err) {
      console.warn('Initial feedback query warning, trying fallback:', err);
    }

    // Fallback resilient query
    if (reviews.length === 0) {
      try {
        const { data: rawRows, error: rawErr } = await supabase
          .from('feedback_responses')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });

        if (!rawErr && rawRows && rawRows.length > 0) {
          const nonAnonStudentIds = rawRows
            .filter((r) => !r.is_anonymous && r.student_id)
            .map((r) => r.student_id);

          if (nonAnonStudentIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, name, department_id, departments(code)')
              .in('id', nonAnonStudentIds);

            const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
            reviews = rawRows.map((r) => ({
              ...r,
              student: r.is_anonymous ? null : profileMap.get(r.student_id) || null,
            }));
          } else {
            reviews = rawRows.map((r) => ({ ...r, student: null }));
          }
        }
      } catch (e) {
        console.error('getEventFeedback fallback error:', e);
      }
    }

    if (reviews.length === 0) {
      return emptyResult;
    }

    const total = reviews.length;
    const avgContent = +(reviews.reduce((acc, r) => acc + (r.rating_content || 0), 0) / total).toFixed(1);
    const avgSpeaker = +(reviews.reduce((acc, r) => acc + (r.rating_speaker || 0), 0) / total).toFixed(1);
    const avgOrg = +(reviews.reduce((acc, r) => acc + (r.rating_organization || 0), 0) / total).toFixed(1);
    const overallScore = +((avgContent + avgSpeaker + avgOrg) / 3).toFixed(1);

    return {
      reviews,
      stats: {
        totalReviews: total,
        avgContent,
        avgSpeaker,
        avgOrganization: avgOrg,
        overallScore,
      },
    };
  },

  /**
   * Fetches student's past feedback submissions
   */
  async getStudentFeedbackHistory() {
    if (!isSupabaseConfigured) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Query feedback_submissions joined with events
    const { data, error } = await supabase
      .from('feedback_submissions')
      .select(`
        id,
        event_id,
        submitted_at,
        event:events(
          id,
          title,
          start_time,
          end_time,
          venue:venues(name),
          custom_venue
        )
      `)
      .eq('student_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
