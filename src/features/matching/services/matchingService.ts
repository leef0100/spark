import { supabase } from '../../../lib/supabase';
import type { Database, InteractionType, LikedContentType } from '../../../lib/database.types';

export interface LikeReceived {
  interactionId: string;
  likerProfile: {
    id: string;
    first_name: string;
    age: number;
    photos: Array<{ id: string; url?: string; position: number }>;
    prompts: Array<{ id: string; prompt_text: string; answer_text: string; position: number }>;
  };
  interactionType: InteractionType;
  commentText: string | null;
  likedContentType: LikedContentType | null;
  likedContentId: string | null;
  createdAt: string;
}

export interface MatchWithDetails {
  matchId: string;
  matchedAt: string;
  expiresAt: string | null;
  hasMessages: boolean;
  otherUser: {
    id: string;
    first_name: string;
    age: number;
    photos: Array<{ id: string; url?: string; position: number }>;
  };
  lastMessage: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  unreadCount: number;
}

export const matchingService = {
  /**
   * Get likes received by the current user
   */
  async getLikesReceived(): Promise<{ likes: LikeReceived[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { likes: [], error: 'Not authenticated' };
      }

      const { data, error } = await supabase.rpc('get_likes_received', {
        user_id: user.id,
      });

      if (error) {
        return { likes: [], error: error.message };
      }

      // Transform and add photo URLs
      const likes: LikeReceived[] = await Promise.all(
        (data || []).map(async (like: any) => {
          const profile = like.liker_profile;

          // Get signed URLs for photos
          const photosWithUrls = await Promise.all(
            (profile.photos || []).map(async (photo: any) => {
              const { data: signedUrl } = await supabase.storage
                .from('profile-photos')
                .createSignedUrl(photo.storage_path, 3600);

              return {
                id: photo.id,
                url: signedUrl?.signedUrl,
                position: photo.position,
              };
            })
          );

          return {
            interactionId: like.interaction_id,
            likerProfile: {
              id: profile.profile.id,
              first_name: profile.profile.first_name,
              age: profile.age,
              photos: photosWithUrls,
              prompts: profile.prompts || [],
            },
            interactionType: like.interaction_type,
            commentText: like.comment_text,
            likedContentType: like.liked_content_type,
            likedContentId: like.liked_content_id,
            createdAt: like.created_at,
          };
        })
      );

      return { likes };
    } catch (error) {
      return { likes: [], error: 'Failed to fetch likes' };
    }
  },

  /**
   * Get count of pending likes
   */
  async getLikesCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count } = await supabase
        .from('interactions')
        .select('*', { count: 'exact', head: true })
        .eq('target_id', user.id)
        .in('type', ['like', 'comment']);

      return count || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Get all matches with details
   */
  async getMatches(): Promise<{ matches: MatchWithDetails[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { matches: [], error: 'Not authenticated' };
      }

      const { data, error } = await supabase.rpc('get_matches_with_details', {
        user_id: user.id,
      });

      if (error) {
        return { matches: [], error: error.message };
      }

      // Transform and add photo URLs
      const matches: MatchWithDetails[] = await Promise.all(
        (data || []).map(async (match: any) => {
          const otherUser = match.other_user;

          // Get signed URLs for primary photo
          const photosWithUrls = await Promise.all(
            (otherUser.photos || []).slice(0, 1).map(async (photo: any) => {
              const { data: signedUrl } = await supabase.storage
                .from('profile-photos')
                .createSignedUrl(photo.storage_path, 3600);

              return {
                id: photo.id,
                url: signedUrl?.signedUrl,
                position: photo.position,
              };
            })
          );

          return {
            matchId: match.match_id,
            matchedAt: match.matched_at,
            expiresAt: match.expires_at,
            hasMessages: match.has_messages,
            otherUser: {
              id: otherUser.profile.id,
              first_name: otherUser.profile.first_name,
              age: otherUser.age,
              photos: photosWithUrls,
            },
            lastMessage: match.last_message,
            unreadCount: match.unread_count,
          };
        })
      );

      return { matches };
    } catch (error) {
      return { matches: [], error: 'Failed to fetch matches' };
    }
  },

  /**
   * Accept a like (match with someone who liked you)
   */
  async acceptLike(likerId: string): Promise<{ success: boolean; matchId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Create a like back, which will trigger the match creation
      const { error } = await supabase
        .from('interactions')
        .insert({
          actor_id: user.id,
          target_id: likerId,
          type: 'like',
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get the match ID
      const u1 = user.id < likerId ? user.id : likerId;
      const u2 = user.id < likerId ? likerId : user.id;

      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .single();

      return { success: true, matchId: match?.id };
    } catch (error) {
      return { success: false, error: 'Failed to accept like' };
    }
  },

  /**
   * Decline a like (pass)
   */
  async declineLike(likerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('interactions')
        .insert({
          actor_id: user.id,
          target_id: likerId,
          type: 'pass',
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to decline like' };
    }
  },

  /**
   * Unmatch with someone
   */
  async unmatch(matchId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('unmatch', {
        match_id_param: matchId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: data };
    } catch (error) {
      return { success: false, error: 'Failed to unmatch' };
    }
  },

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to block user' };
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
   * Get blocked users
   */
  async getBlockedUsers(): Promise<{ users: string[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { users: [], error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      if (error) {
        return { users: [], error: error.message };
      }

      return { users: (data || []).map((b) => b.blocked_id) };
    } catch (error) {
      return { users: [], error: 'Failed to fetch blocked users' };
    }
  },
};
