import { supabase } from '../../../lib/supabase';
import type { Database, InteractionType, LikedContentType } from '../../../lib/database.types';

type Interaction = Database['public']['Tables']['interactions']['Insert'];

export interface DiscoveryProfile {
  profile_id: string;
  first_name: string;
  birth_date: string;
  age: number;
  gender: 'man' | 'woman' | 'nonbinary';
  bio: string | null;
  height_cm: number | null;
  job_title: string | null;
  company: string | null;
  education: string | null;
  city: string | null;
  distance_km: number | null;
  last_active_at: string;
  photos: Array<{
    id: string;
    storage_path: string;
    position: number;
    is_primary: boolean;
    url?: string;
  }>;
  prompts: Array<{
    id: string;
    prompt_text: string;
    answer_text: string;
    position: number;
  }>;
}

export interface DiscoveryFeedResponse {
  profiles: DiscoveryProfile[];
  hasMore: boolean;
  offset: number;
}

export const discoveryService = {
  /**
   * Get discovery feed
   */
  async getDiscoveryFeed(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: DiscoveryFeedResponse | null; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Call the discovery feed function
      const { data: profiles, error } = await supabase.rpc('get_discovery_feed', {
        user_id: user.id,
        limit_count: limit,
        offset_count: offset,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // Enrich profiles with photos and prompts
      const enrichedProfiles: DiscoveryProfile[] = [];

      for (const profile of profiles || []) {
        // Get photos
        const { data: photos } = await supabase
          .from('profile_photos')
          .select('id, storage_path, position, is_primary')
          .eq('profile_id', profile.profile_id)
          .order('position');

        // Get prompts
        const { data: prompts } = await supabase
          .from('prompts')
          .select('id, prompt_text, answer_text, position')
          .eq('profile_id', profile.profile_id)
          .order('position');

        // Generate signed URLs for photos
        const photosWithUrls = await Promise.all(
          (photos || []).map(async (photo) => {
            const { data: signedUrl } = await supabase.storage
              .from('profile-photos')
              .createSignedUrl(photo.storage_path, 3600);

            return {
              ...photo,
              url: signedUrl?.signedUrl,
            };
          })
        );

        enrichedProfiles.push({
          ...profile,
          photos: photosWithUrls,
          prompts: prompts || [],
        });
      }

      return {
        data: {
          profiles: enrichedProfiles,
          hasMore: enrichedProfiles.length === limit,
          offset: offset + enrichedProfiles.length,
        },
      };
    } catch (error) {
      return { data: null, error: 'Failed to fetch discovery feed' };
    }
  },

  /**
   * Like a profile (generic like)
   */
  async likeProfile(targetId: string): Promise<{ success: boolean; isMatch: boolean; error?: string }> {
    return this.createInteraction(targetId, 'like');
  },

  /**
   * Like with a comment on specific content
   */
  async commentOnProfile(
    targetId: string,
    comment: string,
    contentType: LikedContentType,
    contentId: string
  ): Promise<{ success: boolean; isMatch: boolean; error?: string }> {
    return this.createInteraction(targetId, 'comment', comment, contentType, contentId);
  },

  /**
   * Pass on a profile
   */
  async passProfile(targetId: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.createInteraction(targetId, 'pass');
    return { success: result.success, error: result.error };
  },

  /**
   * Create an interaction
   */
  async createInteraction(
    targetId: string,
    type: InteractionType,
    commentText?: string,
    likedContentType?: LikedContentType,
    likedContentId?: string
  ): Promise<{ success: boolean; isMatch: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, isMatch: false, error: 'Not authenticated' };
      }

      const interaction: Interaction = {
        actor_id: user.id,
        target_id: targetId,
        type,
        comment_text: commentText,
        liked_content_type: likedContentType,
        liked_content_id: likedContentId,
      };

      const { error } = await supabase
        .from('interactions')
        .insert(interaction);

      if (error) {
        return { success: false, isMatch: false, error: error.message };
      }

      // Check if this created a match
      if (type !== 'pass') {
        const { data: isMatch } = await supabase.rpc('are_matched', {
          user_a: user.id,
          user_b: targetId,
        });

        return { success: true, isMatch: !!isMatch };
      }

      return { success: true, isMatch: false };
    } catch (error) {
      return { success: false, isMatch: false, error: 'Failed to create interaction' };
    }
  },

  /**
   * Update last active timestamp
   */
  async updateLastActive(): Promise<void> {
    try {
      await supabase.rpc('update_last_active');
    } catch (error) {
      console.error('Failed to update last active:', error);
    }
  },
};
