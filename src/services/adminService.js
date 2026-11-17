/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Admin Service: High-performance admin analytics, append-only audit logs,
 * institutional allowlists, user activation controls, and platform settings.
 */

import { supabase, isSupabaseConfigured } from './supabase';

export const adminService = {
  /**
   * Fetch aggregated analytics metrics (Admin Security Definer RPC)
   * Returns: summary KPIs, department participation, attendance rates, 6-month trend, feedback ratings, top active students
   */
  async getAnalytics() {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase.rpc('admin_get_analytics');
    if (error) {
      console.error('Error fetching admin analytics:', error);
      throw error;
    }
    return data;
  },

  /**
   * Fetch anonymous feedback report per event or overall
   * Anonymity Guarantee: strictly omits student IDs, names, and emails.
   */
  async getFeedbackReport(eventId = null) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase.rpc('admin_get_feedback_report', {
      p_event_id: eventId || null,
    });
    if (error) {
      console.error('Error fetching feedback report:', error);
      throw error;
    }
    return data;
  },

  /**
   * Query filtered activity logs (Admin Only)
   * Filterable by action, actor, and date range
   */
  async getActivityLogs({ limit = 100, action = null, actor = null, startDate = null, endDate = null } = {}) {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase.rpc('admin_get_activity_logs', {
      p_limit: limit,
      p_action: action && action !== 'all' ? action : null,
      p_actor: actor && actor.trim() !== '' ? actor.trim() : null,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });

    if (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Toggle user active status (Deactivate / Reactivate)
   * Deactivated users immediately lose access across all RLS policies.
   */
  async toggleUserStatus(userId, isActive) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase.rpc('admin_toggle_user_status', {
      p_user_id: userId,
      p_is_active: isActive,
    });

    if (error) {
      console.error('Error toggling user active status:', error);
      throw error;
    }
    return data;
  },

  /**
   * Manage pre-authorized email allowlists for admins and coordinators
   * @param {'admin' | 'coordinator'} type
   * @param {'add' | 'remove'} action
   * @param {string} email
   * @param {string} notes
   * @param {string} deptCode
   */
  async manageAllowlist({ type, action, email, notes = '', deptCode = null }) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase.rpc('admin_manage_allowlist', {
      p_type: type,
      p_action: action,
      p_email: email,
      p_notes: notes,
      p_dept_code: deptCode,
    });

    if (error) {
      console.error('Error managing allowlist:', error);
      throw error;
    }
    return data;
  },

  /**
   * Fetch all allowlisted admin and coordinator records
   */
  async getAllowlists() {
    if (!isSupabaseConfigured) return { admins: [], coordinators: [] };

    const [adminRes, coordRes] = await Promise.all([
      supabase.from('admins').select('*').order('created_at', { ascending: false }),
      supabase.from('coordinators').select('*').order('created_at', { ascending: false }),
    ]);

    return {
      admins: adminRes.data || [],
      coordinators: coordRes.data || [],
    };
  },

  /**
   * Fetch current institutional platform settings
   */
  async getAppSettings() {
    if (!isSupabaseConfigured) return {};

    const { data, error } = await supabase.from('app_settings').select('*');
    if (error) {
      console.error('Error fetching app settings:', error);
      throw error;
    }

    const settings = {};
    (data || []).forEach((row) => {
      settings[row.key] = row.value;
    });
    return settings;
  },

  /**
   * Update institutional platform settings
   */
  async updateSettings({ pointsCap, certRequiresFeedback, departmentsList = null }) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase.rpc('admin_update_settings', {
      p_points_cap: parseInt(pointsCap, 10),
      p_cert_requires_feedback: Boolean(certRequiresFeedback),
      p_departments_list: departmentsList,
    });

    if (error) {
      console.error('Error updating app settings:', error);
      throw error;
    }
    return data;
  },
};
