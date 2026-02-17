// Generated types for Supabase tables
// These should be regenerated with `supabase gen types typescript` after deploying

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GenderType = 'man' | 'woman' | 'nonbinary';
export type LookingForType = 'men' | 'women' | 'everyone';
export type InteractionType = 'like' | 'comment' | 'pass';
export type LikedContentType = 'photo' | 'prompt';
export type ExpiredReasonType = 'timeout' | 'unmatched';
export type PresenceStatusType = 'online' | 'away' | 'offline';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          birth_date: string;
          gender: GenderType;
          looking_for: LookingForType[];
          bio: string | null;
          height_cm: number | null;
          job_title: string | null;
          company: string | null;
          education: string | null;
          city: string | null;
          latitude: number | null;
          longitude: number | null;
          is_active: boolean;
          last_active_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          birth_date: string;
          gender: GenderType;
          looking_for?: LookingForType[];
          bio?: string | null;
          height_cm?: number | null;
          job_title?: string | null;
          company?: string | null;
          education?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
          last_active_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          first_name?: string;
          birth_date?: string;
          gender?: GenderType;
          looking_for?: LookingForType[];
          bio?: string | null;
          height_cm?: number | null;
          job_title?: string | null;
          company?: string | null;
          education?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
          last_active_at?: string;
          updated_at?: string;
        };
      };
      profile_photos: {
        Row: {
          id: string;
          profile_id: string;
          storage_path: string;
          position: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          storage_path: string;
          position: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          position?: number;
          is_primary?: boolean;
        };
      };
      prompts: {
        Row: {
          id: string;
          profile_id: string;
          prompt_text: string;
          answer_text: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          prompt_text: string;
          answer_text: string;
          position: number;
          created_at?: string;
        };
        Update: {
          prompt_text?: string;
          answer_text?: string;
          position?: number;
        };
      };
      interactions: {
        Row: {
          id: string;
          actor_id: string;
          target_id: string;
          type: InteractionType;
          comment_text: string | null;
          liked_content_type: LikedContentType | null;
          liked_content_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          target_id: string;
          type: InteractionType;
          comment_text?: string | null;
          liked_content_type?: LikedContentType | null;
          liked_content_id?: string | null;
          created_at?: string;
        };
        Update: never; // Interactions are immutable
      };
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          matched_at: string;
          expires_at: string | null;
          is_active: boolean;
          expired_reason: ExpiredReasonType | null;
        };
        Insert: never; // Matches are created by triggers
        Update: never; // Matches are updated by functions
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          content: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          content: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
      };
      blocked_users: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: never;
      };
      user_preferences: {
        Row: {
          profile_id: string;
          min_age: number;
          max_age: number;
          max_distance_km: number;
          show_me: LookingForType[];
        };
        Insert: {
          profile_id: string;
          min_age?: number;
          max_age?: number;
          max_distance_km?: number;
          show_me?: LookingForType[];
        };
        Update: {
          min_age?: number;
          max_age?: number;
          max_distance_km?: number;
          show_me?: LookingForType[];
        };
      };
      device_tokens: {
        Row: {
          id: string;
          profile_id: string;
          token: string;
          platform: 'ios' | 'android' | 'web';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          token: string;
          platform: 'ios' | 'android' | 'web';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          token?: string;
          platform?: 'ios' | 'android' | 'web';
          updated_at?: string;
        };
      };
      user_presence: {
        Row: {
          user_id: string;
          status: PresenceStatusType;
          last_seen: string;
        };
        Insert: {
          user_id: string;
          status?: PresenceStatusType;
          last_seen?: string;
        };
        Update: {
          status?: PresenceStatusType;
          last_seen?: string;
        };
      };
    };
    Functions: {
      calculate_age: {
        Args: { birth_date: string };
        Returns: number;
      };
      are_matched: {
        Args: { user_a: string; user_b: string };
        Returns: boolean;
      };
      get_discovery_feed: {
        Args: {
          user_id: string;
          limit_count?: number;
          offset_count?: number;
        };
        Returns: {
          profile_id: string;
          first_name: string;
          birth_date: string;
          age: number;
          gender: GenderType;
          bio: string | null;
          height_cm: number | null;
          job_title: string | null;
          company: string | null;
          education: string | null;
          city: string | null;
          distance_km: number | null;
          last_active_at: string;
        }[];
      };
      get_profile_with_details: {
        Args: { profile_id_param: string };
        Returns: Json;
      };
      get_likes_received: {
        Args: { user_id: string };
        Returns: {
          interaction_id: string;
          liker_profile: Json;
          interaction_type: InteractionType;
          comment_text: string | null;
          liked_content_type: LikedContentType | null;
          liked_content_id: string | null;
          created_at: string;
        }[];
      };
      get_matches_with_details: {
        Args: { user_id: string };
        Returns: {
          match_id: string;
          matched_at: string;
          expires_at: string | null;
          has_messages: boolean;
          other_user: Json;
          last_message: Json | null;
          unread_count: number;
        }[];
      };
      unmatch: {
        Args: { match_id_param: string };
        Returns: boolean;
      };
      update_last_active: {
        Args: Record<string, never>;
        Returns: void;
      };
      delete_account: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      expire_stale_matches: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
  };
}
