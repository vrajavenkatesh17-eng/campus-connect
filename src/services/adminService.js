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
   * Phase 6B: Fast Single-RPC Dashboard Stats for MagicBento
   * Strictly restricted to verified administrators in public.admins.
   */
  async getDashboardStats() {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase.rpc('admin_dashboard_stats');
    if (error) {
      console.error('Error fetching admin dashboard stats:', error);
      throw error;
    }
    return data;
  },

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
    if (!error) return data;

    // Fallback if migration 006 RPC is not yet in PostgREST schema cache
    console.warn('RPC admin_get_feedback_report unavailable, using anonymous direct fallback:', error.message);
    let query = supabase
      .from('feedback_responses')
      .select('id, event_id, rating_content, rating_speaker, rating_organization, comments, created_at, events(title)')
      .order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: rows, error: directError } = await query;
    if (directError) {
      console.error('Error fetching feedback report:', directError);
      throw directError;
    }

    const list = rows || [];
    const total = list.length;
    const avg = (vals) => (vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0);

    const contentScores = list.map((r) => Number(r.rating_content || 0));
    const speakerScores = list.map((r) => Number(r.rating_speaker || 0));
    const orgScores = list.map((r) => Number(r.rating_organization || 0));
    const overallScores = list.map(
      (r) => (Number(r.rating_content || 0) + Number(r.rating_speaker || 0) + Number(r.rating_organization || 0)) / 3
    );

    const anonymousComments = list
      .filter((r) => r.comments && r.comments.trim() !== '')
      .slice(0, 50)
      .map((r) => ({
        event_title: r.events?.title || 'Campus Event',
        comment: r.comments,
        rating: Number(
          ((Number(r.rating_content || 0) + Number(r.rating_speaker || 0) + Number(r.rating_organization || 0)) / 3).toFixed(1)
        ),
        created_at: r.created_at,
      }));

    return {
      success: true,
      event_id: eventId,
      average_rating: avg(overallScores),
      total_submissions: total,
      criteria_breakdown: [
        { question_key: 'content_quality', avg_score: avg(contentScores), total_responses: total },
        { question_key: 'speaker_delivery', avg_score: avg(speakerScores), total_responses: total },
        { question_key: 'event_organization', avg_score: avg(orgScores), total_responses: total },
      ],
      anonymous_comments: anonymousComments,
    };
  },

  /**
   * Query filtered activity logs (Admin Only)
   * Filterable by action, actor, and date range
   */
  async getActivityLogs({ limit = 100, action = null, actor = null, startDate = null, endDate = null } = {}) {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase.rpc('admin_get_activity_logs', {
        p_limit: limit,
        p_action: action && action !== 'all' ? action : null,
        p_actor: actor && actor.trim() !== '' ? actor.trim() : null,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
      });

      if (error) {
        console.warn('RPC admin_get_activity_logs error, attempting direct query:', error.message);
        const { data: directData, error: directError } = await supabase
          .from('activity_logs')
          .select('*, profiles:actor_id(name, email, role)')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!directError && directData) {
          return directData.map((l) => ({
            id: l.id,
            action: l.action,
            entity_type: l.entity_type || l.target_type || 'system',
            entity_id: l.entity_id || l.target_id,
            event_id: l.event_id,
            metadata: l.metadata || l.details || {},
            created_at: l.created_at,
            actor_name: l.profiles?.name || 'System',
            actor_email: l.profiles?.email || 'system@fxec.ac.in',
            actor_role: l.profiles?.role || 'system',
          }));
        }
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Error fetching activity logs:', err);
      return [];
    }
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
    const defaultSettings = {
      points_per_event_cap: 100,
      certificate_requires_feedback: true,
      allowed_email_domain: '@francisxavier.ac.in',
      departments_list: ['CSE', 'IT', 'AIDS', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA'],
    };

    if (!isSupabaseConfigured) return defaultSettings;

    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) {
        console.warn('Notice reading app_settings table:', error.message);
        return defaultSettings;
      }

      const settings = { ...defaultSettings };
      (data || []).forEach((row) => {
        settings[row.key] = row.value;
      });
      return settings;
    } catch (err) {
      console.warn('Error reading app_settings, using fallback defaults:', err);
      return defaultSettings;
    }
  },

  /**
   * Update institutional platform settings
   */
  async updateSettings({ pointsCap, certRequiresFeedback, departmentsList = null, allowedEmailDomain = null }) {
    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase.rpc('admin_update_settings', {
        p_points_cap: parseInt(pointsCap, 10),
        p_cert_requires_feedback: Boolean(certRequiresFeedback),
        p_departments_list: departmentsList,
      });

      if (error) {
        console.warn('RPC admin_update_settings failed, fallback direct upsert:', error.message);
        const upsertPromises = [
          supabase.from('app_settings').upsert({
            key: 'points_per_event_cap',
            value: parseInt(pointsCap, 10),
            updated_at: new Date().toISOString(),
          }),
          supabase.from('app_settings').upsert({
            key: 'certificate_requires_feedback',
            value: Boolean(certRequiresFeedback),
            updated_at: new Date().toISOString(),
          }),
        ];

        if (departmentsList) {
          upsertPromises.push(
            supabase.from('app_settings').upsert({
              key: 'departments_list',
              value: departmentsList,
              updated_at: new Date().toISOString(),
            })
          );
        }

        if (allowedEmailDomain) {
          upsertPromises.push(
            supabase.from('app_settings').upsert({
              key: 'allowed_email_domain',
              value: allowedEmailDomain,
              updated_at: new Date().toISOString(),
            })
          );
        }

        await Promise.all(upsertPromises);
        return { success: true };
      }

      // If RPC succeeded, also ensure allowedEmailDomain is upserted if provided
      if (allowedEmailDomain) {
        await supabase.from('app_settings').upsert({
          key: 'allowed_email_domain',
          value: allowedEmailDomain,
          updated_at: new Date().toISOString(),
        });
      }

      return data;
    } catch (err) {
      console.error('Error updating app settings:', err);
      throw err;
    }
  },

  /**
   * Admin: Query all event photos for gallery approval review
   */
  async getGalleryPhotos(status = 'all') {
    if (!isSupabaseConfigured) return [];
    let query = supabase
      .from('event_photos')
      .select(`
        *,
        events(id, title, start_time, end_time),
        profiles:uploaded_by(name, email)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching gallery photos:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Admin: Approve or Reject an event photo
   */
  async reviewGalleryPhoto(photoId, { status, reason = '' }) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('event_photos')
      .update({
        status, // 'approved' | 'rejected'
      })
      .eq('id', photoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Upload an optimized WebP photo to event-photos bucket & insert event_photos row.
   * Admin uploads are auto-approved; Coordinator uploads remain pending until reviewed.
   */
  async uploadGalleryPhoto({ file, eventId, caption = '', uploadedBy, autoApprove = false }) {
    if (!isSupabaseConfigured) return null;
    if (!file || !eventId || !uploadedBy) {
      throw new Error('File, event, and uploader are required.');
    }

    const safeName = (file.name || 'moment.webp').replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectPath = `gallery/${eventId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-photos')
      .upload(objectPath, file, {
        contentType: file.type || 'image/webp',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('event-photos')
      .getPublicUrl(objectPath);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) throw new Error('Failed to resolve public URL for uploaded photo.');

    const { data, error: insertError } = await supabase
      .from('event_photos')
      .insert({
        event_id: eventId,
        storage_path: publicUrl,
        caption: caption.trim() || null,
        status: autoApprove ? 'approved' : 'pending',
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return data;
  },

  /**
   * Admin: Permanently delete a gallery photo row
   */
  async deleteGalleryPhoto(photoId) {
    if (!isSupabaseConfigured) return null;
    const { error } = await supabase
      .from('event_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
    return { success: true };
  },
};
