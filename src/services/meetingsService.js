
import { supabase } from '@/lib/supabaseClient'; 

// This service handles interactions with Supabase
// Since Supabase might not be connected in this environment, we add safety checks.

export const meetingsService = {
  // Fetch all meetings for a user
  getMeetings: async (userId) => {
    if (!supabase) return { error: 'Supabase client not initialized' };
    
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Supabase fetch error:', error);
      return { error: error.message };
    }
  },

  // Create a new meeting record
  createMeeting: async (meetingData) => {
    if (!supabase) return { error: 'Supabase client not initialized' };

    try {
      const { data, error } = await supabase
        .from('meetings')
        .insert([meetingData])
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Upload recording file to storage bucket
  uploadRecording: async (file, userId) => {
    if (!supabase) return { error: 'Supabase client not initialized' };

    try {
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('recordings')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      return { path: data.path, publicUrl };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Update meeting details
  updateMeeting: async (id, updates) => {
    if (!supabase) return { error: 'Supabase client not initialized' };

    try {
      const { data, error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Delete meeting and recording
  deleteMeeting: async (id, recordingPath) => {
    if (!supabase) return { error: 'Supabase client not initialized' };

    try {
      // 1. Delete from DB
      const { error: dbError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // 2. Delete recording if exists
      if (recordingPath) {
        const { error: storageError } = await supabase.storage
          .from('recordings')
          .remove([recordingPath]);
          
        if (storageError) console.warn('Failed to delete recording file', storageError);
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  },
  
  // Search meetings
  searchMeetings: async (userId, query) => {
    if (!supabase) return { error: 'Supabase client not initialized' };
    
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', userId)
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return { data };
    } catch (error) {
      return { error: error.message };
    }
  }
};
