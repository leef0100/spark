import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
import * as ImageManipulator from 'expo-image-manipulator';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type ProfilePhoto = Database['public']['Tables']['profile_photos']['Row'];
type Prompt = Database['public']['Tables']['prompts']['Row'];

export interface ProfileWithDetails extends Profile {
  photos: (ProfilePhoto & { url?: string })[];
  prompts: Prompt[];
  age: number;
}

export const profileService = {
  /**
   * Create a new profile during onboarding
   */
  async createProfile(data: ProfileInsert): Promise<{ profile: Profile | null; error?: string }> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert(data)
        .select()
        .single();

      if (error) {
        return { profile: null, error: error.message };
      }

      // Create default preferences
      await supabase.from('user_preferences').insert({
        profile_id: data.id,
        show_me: data.looking_for || ['everyone'],
      });

      return { profile };
    } catch (error) {
      return { profile: null, error: 'Failed to create profile' };
    }
  },

  /**
   * Get current user's profile with photos and prompts
   */
  async getMyProfile(): Promise<{ profile: ProfileWithDetails | null; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { profile: null, error: 'Not authenticated' };
      }

      return this.getProfileById(user.id);
    } catch (error) {
      return { profile: null, error: 'Failed to fetch profile' };
    }
  },

  /**
   * Get a profile by ID with photos and prompts
   */
  async getProfileById(id: string): Promise<{ profile: ProfileWithDetails | null; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_profile_with_details', {
        profile_id_param: id,
      });

      if (error) {
        return { profile: null, error: error.message };
      }

      if (!data || !data.profile) {
        return { profile: null, error: 'Profile not found' };
      }

      // Get signed URLs for photos
      const photosWithUrls = await Promise.all(
        (data.photos || []).map(async (photo: ProfilePhoto) => {
          const { data: signedUrl } = await supabase.storage
            .from('profile-photos')
            .createSignedUrl(photo.storage_path, 3600);

          return {
            ...photo,
            url: signedUrl?.signedUrl,
          };
        })
      );

      return {
        profile: {
          ...data.profile,
          photos: photosWithUrls,
          prompts: data.prompts || [],
          age: data.age,
        },
      };
    } catch (error) {
      return { profile: null, error: 'Failed to fetch profile' };
    }
  },

  /**
   * Update profile
   */
  async updateProfile(data: ProfileUpdate): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update profile' };
    }
  },

  /**
   * Upload a profile photo
   */
  async uploadPhoto(
    uri: string,
    position: number
  ): Promise<{ photo: ProfilePhoto | null; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { photo: null, error: 'Not authenticated' };
      }

      // Compress and resize image
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Read the file
      const response = await fetch(manipulated.uri);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `${user.id}/${Date.now()}_${position}.jpg`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        return { photo: null, error: uploadError.message };
      }

      // Delete existing photo at this position
      await supabase
        .from('profile_photos')
        .delete()
        .eq('profile_id', user.id)
        .eq('position', position);

      // Insert photo record
      const { data: photo, error: insertError } = await supabase
        .from('profile_photos')
        .insert({
          profile_id: user.id,
          storage_path: filename,
          position,
          is_primary: position === 0,
        })
        .select()
        .single();

      if (insertError) {
        return { photo: null, error: insertError.message };
      }

      return { photo };
    } catch (error) {
      return { photo: null, error: 'Failed to upload photo' };
    }
  },

  /**
   * Delete a profile photo
   */
  async deletePhoto(photoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the photo to find storage path
      const { data: photo } = await supabase
        .from('profile_photos')
        .select('storage_path')
        .eq('id', photoId)
        .single();

      if (photo) {
        // Delete from storage
        await supabase.storage
          .from('profile-photos')
          .remove([photo.storage_path]);
      }

      // Delete record
      const { error } = await supabase
        .from('profile_photos')
        .delete()
        .eq('id', photoId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete photo' };
    }
  },

  /**
   * Update or create a prompt
   */
  async upsertPrompt(
    promptText: string,
    answerText: string,
    position: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('prompts')
        .upsert(
          {
            profile_id: user.id,
            prompt_text: promptText,
            answer_text: answerText,
            position,
          },
          { onConflict: 'profile_id,position' }
        );

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to save prompt' };
    }
  },

  /**
   * Delete a prompt
   */
  async deletePrompt(promptId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete prompt' };
    }
  },

  /**
   * Update location
   */
  async updateLocation(
    latitude: number,
    longitude: number,
    city?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateProfile({ latitude, longitude, city });
  },

  /**
   * Toggle profile visibility
   */
  async setProfileActive(isActive: boolean): Promise<{ success: boolean; error?: string }> {
    return this.updateProfile({ is_active: isActive });
  },

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(): Promise<{
    users: Array<{
      user_id: string;
      first_name: string;
      photo_url: string | null;
      blocked_at: string;
    }> | null;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { users: null, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          blocked_id,
          created_at,
          blocked_profile:profiles!blocked_users_blocked_id_fkey(
            first_name,
            profile_photos(storage_path)
          )
        `)
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return { users: null, error: error.message };
      }

      // Transform data and get signed URLs for photos
      const users = await Promise.all(
        (data || []).map(async (block: any) => {
          let photoUrl = null;
          const photos = block.blocked_profile?.profile_photos || [];
          if (photos.length > 0) {
            const { data: signedUrl } = await supabase.storage
              .from('profile-photos')
              .createSignedUrl(photos[0].storage_path, 3600);
            photoUrl = signedUrl?.signedUrl || null;
          }

          return {
            user_id: block.blocked_id,
            first_name: block.blocked_profile?.first_name || 'Unknown',
            photo_url: photoUrl,
            blocked_at: block.created_at,
          };
        })
      );

      return { users };
    } catch (error) {
      return { users: null, error: 'Failed to fetch blocked users' };
    }
  },

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to unblock user' };
    }
  },

  /**
   * Delete account and all associated data
   */
  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Call the delete account RPC which handles cascade deletion
      const { error: rpcError } = await supabase.rpc('delete_account');

      if (rpcError) {
        return { success: false, error: rpcError.message };
      }

      // Sign out
      await supabase.auth.signOut();

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete account' };
    }
  },
};
