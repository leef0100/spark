export type Gender = 'man' | 'woman' | 'nonbinary';
export type LookingFor = 'men' | 'women' | 'everyone';
export type InteractionType = 'like' | 'comment' | 'pass';
export type LikedContentType = 'photo' | 'prompt';
export type ExpiredReason = 'timeout' | 'unmatched';

export interface Profile {
  id: string;
  first_name: string;
  birth_date: string;
  gender: Gender;
  looking_for: LookingFor[];
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
}

export interface ProfilePhoto {
  id: string;
  profile_id: string;
  storage_path: string;
  position: number;
  is_primary: boolean;
  created_at: string;
  url?: string;
}

export interface Prompt {
  id: string;
  profile_id: string;
  prompt_text: string;
  answer_text: string;
  position: number;
  created_at: string;
}

export interface Interaction {
  id: string;
  actor_id: string;
  target_id: string;
  type: InteractionType;
  comment_text: string | null;
  liked_content_type: LikedContentType | null;
  liked_content_id: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  expires_at: string | null;
  is_active: boolean;
  expired_reason: ExpiredReason | null;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface UserPreferences {
  profile_id: string;
  min_age: number;
  max_age: number;
  max_distance_km: number;
  show_me: LookingFor[];
}

export interface DiscoveryProfile extends Profile {
  photos: ProfilePhoto[];
  prompts: Prompt[];
  distance_km?: number;
  age: number;
}

export interface MatchWithProfile extends Match {
  other_user: Profile & {
    photos: ProfilePhoto[];
  };
  last_message?: Message;
  unread_count: number;
}
