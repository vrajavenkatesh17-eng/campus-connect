import { supabase, isSupabaseConfigured } from './supabase';

export const pointsService = {
  /**
   * Awards bonus points to a student for an event (Coordinator or Admin).
   * Enforces attendance verification, valid category, non-empty reason, and per-event cap.
   * @param {string} eventId
   * @param {string} studentId
   * @param {'asked_question'|'answered_question'|'discussion'|'other'} category
   * @param {number} points
   * @param {string} reason
   */
  async awardPoints(eventId, studentId, category, points, reason) {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase.rpc('award_points', {
      p_event_id: eventId,
      p_student_id: studentId,
      p_category: category,
      p_points: parseInt(points, 10),
      p_reason: reason.trim(),
    });

    if (error) throw error;
    return data;
  },

  /**
   * Administrative point adjustment (Admin only).
   * Append-only correction (can be positive or negative).
   * @param {string} studentId
   * @param {number} points
   * @param {string} reason
   */
  async adminAdjustPoints(studentId, points, reason) {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase.rpc('admin_adjust_points', {
      p_student_id: studentId,
      p_points: parseInt(points, 10),
      p_reason: reason.trim(),
    });

    if (error) throw error;
    return data;
  },

  /**
   * Privacy-preserving leaderboard RPC.
   * Exposes only rank, student name, department code, and total points. Never emails or phone numbers.
   * @param {string|null} departmentId
   * @param {number} limit
   */
  async getLeaderboard(departmentId = null, limit = 50) {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_department_id: departmentId || null,
      p_limit: limit,
    });

    if (error) {
      console.error('Failed to load leaderboard:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Fetches the append-only points ledger history for a specific event.
   * @param {string} eventId
   */
  async getEventPointsHistory(eventId) {
    if (!isSupabaseConfigured || !eventId) return [];

    const { data, error } = await supabase
      .from('points_ledger')
      .select(`
        id,
        category,
        points,
        reason,
        created_at,
        student:student_id(
          id,
          name,
          register_number
        ),
        awarded_by_profile:awarded_by(
          id,
          name
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching event points history:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Fetches the append-only points ledger history for the current or specified student.
   * RLS ensures students can only read their own records.
   * @param {string} [studentId]
   */
  async getStudentPointsHistory(studentId) {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('points_ledger')
      .select(`
        id,
        category,
        points,
        reason,
        created_at,
        event:event_id(
          id,
          title,
          start_time
        ),
        awarded_by_profile:awarded_by(
          id,
          name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching points history:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Fetches current total points and breakdown for the authenticated student.
   */
  async getStudentPointsSummary(studentId) {
    const history = await this.getStudentPointsHistory(studentId);
    const totalPoints = history.reduce((sum, item) => sum + (item.points || 0), 0);

    const categoryBreakdown = {
      attendance: 0,
      feedback: 0,
      interaction: 0,
      adjustments: 0,
    };

    history.forEach((item) => {
      if (item.category === 'attendance') {
        categoryBreakdown.attendance += item.points;
      } else if (item.category === 'feedback') {
        categoryBreakdown.feedback += item.points;
      } else if (['asked_question', 'answered_question', 'discussion', 'other'].includes(item.category)) {
        categoryBreakdown.interaction += item.points;
      } else if (item.category === 'admin_adjustment') {
        categoryBreakdown.adjustments += item.points;
      }
    });

    return {
      totalPoints,
      categoryBreakdown,
      history,
    };
  },
};
