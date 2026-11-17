import { supabase, isSupabaseConfigured } from './supabase';

export const materialService = {
  /**
   * Uploads a learning resource (PDF, Slides, Code, Notes, or Web Link) for an event.
   * File uploads are stored in the private 'learning-materials' Supabase Storage bucket.
   * RLS restricts access to attended students, coordinators, and administrators.
   */
  async uploadMaterial(eventId, { title, description, materialType, file = null, linkUrl = '' }) {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    let fileUrl = linkUrl.trim();
    let fileSize = null;

    if (materialType !== 'link') {
      if (!file) throw new Error('Please select a file to upload.');

      // 25MB limit check
      const maxBytes = 25 * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error('File size exceeds the 25MB limit.');
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${eventId}/${Date.now()}-${safeName}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('learning-materials')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) {
        console.error('Storage upload error:', uploadErr);
        throw new Error(`Upload failed: ${uploadErr.message}`);
      }

      fileUrl = storagePath;
      fileSize = file.size;
    }

    const { data, error } = await supabase
      .from('learning_materials')
      .insert({
        event_id: eventId,
        title: title.trim(),
        description: description?.trim() || null,
        material_type: materialType,
        file_url: fileUrl,
        file_size: fileSize,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting learning material record:', error);
      throw error;
    }

    return data;
  },

  /**
   * Fetches learning materials for an event.
   * RLS automatically filters rows: only students who attended, the coordinator, or an admin can view them.
   * @param {string} eventId
   */
  async getMaterialsByEvent(eventId) {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('learning_materials')
      .select(`
        id,
        event_id,
        title,
        description,
        material_type,
        file_url,
        file_size,
        created_at,
        uploaded_by_profile:uploaded_by(
          id,
          name,
          role
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading materials:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Generates a secure, temporary download URL (signed URL) for private files,
   * or returns direct link for external URLs.
   * @param {string} fileUrl
   */
  async getDownloadUrl(fileUrl) {
    if (!fileUrl) return null;

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }

    // Generate signed download URL from private storage bucket (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from('learning-materials')
      .createSignedUrl(fileUrl, 3600);

    if (error) {
      console.error('Error creating signed download URL:', error);
      throw error;
    }

    return data.signedUrl;
  },

  /**
   * Deletes a learning material entry and its storage object if applicable.
   */
  async deleteMaterial(materialId, fileUrl) {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    // 1. Delete DB record
    const { error: dbErr } = await supabase
      .from('learning_materials')
      .delete()
      .eq('id', materialId);

    if (dbErr) throw dbErr;

    // 2. Delete storage file if not external link
    if (fileUrl && !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
      try {
        await supabase.storage.from('learning-materials').remove([fileUrl]);
      } catch (err) {
        console.warn('Could not remove file from storage:', err);
      }
    }

    return true;
  },
};
