import { supabase, isSupabaseConfigured } from './supabase';

export const profileService = {
  /**
   * Fetches profile for a specific user ID with department info
   */
  async getProfile(userId) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*, departments(id, code, name)')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Profile not created yet
      throw error;
    }
    return data;
  },

  /**
   * Fetches all departments for selection dropdowns
   */
  async getDepartments() {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Updates user's own profile (only harmless fields: name, department_id, year, register_number, phone)
   */
  async updateOwnProfile(userId, { name, department_id, year, register_number, phone }, currentRole = null) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured.');

    const parsedYear = year ? parseInt(year, 10) : null;
    const trimmedReg = register_number ? register_number.trim() : null;
    const trimmedName = name ? name.trim() : '';

    // If role not passed, check existing profile to accurately compute is_profile_complete
    let userRole = currentRole;
    if (!userRole) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      userRole = existing?.role || 'student';
    }

    // Role-aware profile completion:
    // For faculty coordinators: Name and Department are required.
    // For admins: Name is required.
    // For students: Name, Department, Year, and Register Number are required.
    const isStaff = userRole === 'coordinator' || userRole === 'admin';
    const isComplete = isStaff
      ? Boolean(trimmedName && (department_id || userRole === 'admin'))
      : Boolean(trimmedName && department_id && parsedYear && trimmedReg);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: trimmedName,
        department_id: department_id || null,
        year: parsedYear,
        register_number: trimmedReg,
        phone: phone ? phone.trim() : null,
        is_profile_complete: isComplete,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*, departments(id, code, name)')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Coordinator Flow: Faculty submits a request to become an Event Coordinator
   */
  async submitCoordinatorRequest({ department_id, designation, reason }) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured.');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated.');

    const { data, error } = await supabase
      .from('coordinator_requests')
      .insert({
        user_id: user.id,
        department_id,
        designation,
        reason,
        status: 'pending',
      })
      .select('*, departments(code, name)')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Coordinator Flow: Get current user's coordinator request status (if any)
   */
  async getMyCoordinatorRequest(userId) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('coordinator_requests')
      .select('*, departments(code, name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Admin only: List all pending and past coordinator requests
   */
  async getAllCoordinatorRequests() {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('coordinator_requests')
      .select('*, profiles:user_id(id, name, email, photo_url), departments(code, name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Admin only: Approve or reject a coordinator request via atomic SECURITY DEFINER RPC
   */
  async decideCoordinatorRequest(requestId, decision, rejectionReason = null) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured.');

    const { data, error } = await supabase.rpc('admin_decide_coordinator_request', {
      p_request_id: requestId,
      p_decision: decision,
      p_rejection_reason: rejectionReason,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Admin only: List all registered user profiles
   */
  async getAllProfiles() {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*, departments(id, code, name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Admin only: Directly change a user's role via SECURITY DEFINER atomic RPC
   */
  async updateUserRole(targetUserId, newRole) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured.');

    const { data, error } = await supabase.rpc('admin_update_user_role', {
      p_target_user_id: targetUserId,
      p_new_role: newRole,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Security Verification Test: Intentionally attempts to tamper with own role or is_active directly
   */
  async attemptRoleTampering(userId, maliciousRole) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured.');

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: maliciousRole })
      .eq('id', userId);

    return { data, error };
  },
};
