import { supabase, isSupabaseConfigured } from './supabase';

export const volunteerService = {
  /**
   * Applies for a student to volunteer for an event.
   * @param {string} eventId
   * @param {string} rolePreference
   */
  async applyToVolunteer(eventId, rolePreference = 'General Support') {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase.rpc('apply_to_volunteer', {
      p_event_id: eventId,
      p_role_preference: rolePreference,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Coordinator or Admin accepts or rejects a volunteer application with optional assigned role & notes.
   * @param {string} volunteerId
   * @param {'accepted'|'rejected'} decision
   * @param {string|null} assignedRole
   * @param {string|null} notes
   */
  async decideVolunteer(volunteerId, decision, assignedRole = null, notes = null) {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase.rpc('decide_volunteer', {
      p_volunteer_id: volunteerId,
      p_decision: decision,
      p_assigned_role: assignedRole,
      p_notes: notes,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Coordinator/Admin fetches all volunteer applications for an event.
   * @param {string} eventId
   */
  async getEventVolunteers(eventId) {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('event_volunteers')
      .select(`
        id,
        event_id,
        student_id,
        role_preference,
        assigned_role,
        status,
        notes,
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
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading volunteers:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Fetches volunteer applications for the currently authenticated student.
   */
  async getMyVolunteerApplications() {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('event_volunteers')
      .select(`
        id,
        event_id,
        role_preference,
        assigned_role,
        status,
        notes,
        created_at,
        event:event_id(
          id,
          title,
          start_time,
          end_time,
          status,
          venue:venue_id(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading my volunteer applications:', error);
      throw error;
    }
    return data || [];
  },
};
