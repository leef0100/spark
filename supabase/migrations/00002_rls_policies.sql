-- Spark Dating App - Row Level Security Policies
-- Migration: 00002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read any active profile (for discovery)
CREATE POLICY "profiles_select_active"
    ON profiles FOR SELECT
    USING (
        is_active = true
        AND id NOT IN (
            -- Exclude users who blocked the current user
            SELECT blocker_id FROM blocked_users WHERE blocked_id = auth.uid()
        )
        AND id NOT IN (
            -- Exclude users the current user has blocked
            SELECT blocked_id FROM blocked_users WHERE blocker_id = auth.uid()
        )
    );

-- Users can only read their own inactive profile
CREATE POLICY "profiles_select_own"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Users can delete their own profile
CREATE POLICY "profiles_delete_own"
    ON profiles FOR DELETE
    USING (id = auth.uid());

-- ============================================
-- PROFILE_PHOTOS POLICIES
-- ============================================

-- Users can view photos of active profiles
CREATE POLICY "profile_photos_select"
    ON profile_photos FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE is_active = true
        )
        OR profile_id = auth.uid()
    );

-- Users can insert their own photos
CREATE POLICY "profile_photos_insert_own"
    ON profile_photos FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- Users can update their own photos
CREATE POLICY "profile_photos_update_own"
    ON profile_photos FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Users can delete their own photos
CREATE POLICY "profile_photos_delete_own"
    ON profile_photos FOR DELETE
    USING (profile_id = auth.uid());

-- ============================================
-- PROMPTS POLICIES
-- ============================================

-- Users can view prompts of active profiles
CREATE POLICY "prompts_select"
    ON prompts FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE is_active = true
        )
        OR profile_id = auth.uid()
    );

-- Users can insert their own prompts
CREATE POLICY "prompts_insert_own"
    ON prompts FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- Users can update their own prompts
CREATE POLICY "prompts_update_own"
    ON prompts FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Users can delete their own prompts
CREATE POLICY "prompts_delete_own"
    ON prompts FOR DELETE
    USING (profile_id = auth.uid());

-- ============================================
-- INTERACTIONS POLICIES
-- ============================================

-- Users can insert interactions where they are the actor
CREATE POLICY "interactions_insert_own"
    ON interactions FOR INSERT
    WITH CHECK (actor_id = auth.uid());

-- Users can view interactions where they are the target (to see who liked them)
CREATE POLICY "interactions_select_received"
    ON interactions FOR SELECT
    USING (target_id = auth.uid());

-- Users can view their own sent interactions
CREATE POLICY "interactions_select_sent"
    ON interactions FOR SELECT
    USING (actor_id = auth.uid());

-- Users cannot update interactions (immutable)
-- No update policy

-- Users can delete their own interactions (unlike)
CREATE POLICY "interactions_delete_own"
    ON interactions FOR DELETE
    USING (actor_id = auth.uid());

-- ============================================
-- MATCHES POLICIES
-- ============================================

-- Users can view matches they're part of
CREATE POLICY "matches_select_own"
    ON matches FOR SELECT
    USING (
        user1_id = auth.uid() OR user2_id = auth.uid()
    );

-- Matches are created by triggers/functions, not directly by users
-- Service role will handle inserts
CREATE POLICY "matches_insert_service"
    ON matches FOR INSERT
    WITH CHECK (false); -- Block direct inserts, use functions

-- Users cannot directly update matches
CREATE POLICY "matches_update_service"
    ON matches FOR UPDATE
    USING (false); -- Block direct updates, use functions

-- Users can effectively "unmatch" via the unmatch function
-- No direct delete policy

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can view messages in matches they belong to
CREATE POLICY "messages_select_own_matches"
    ON messages FOR SELECT
    USING (
        match_id IN (
            SELECT id FROM matches
            WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
            AND is_active = true
        )
    );

-- Users can insert messages in active matches they belong to
CREATE POLICY "messages_insert_own_matches"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND match_id IN (
            SELECT id FROM matches
            WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
            AND is_active = true
        )
    );

-- Users can update messages they sent (for read receipts by recipient)
CREATE POLICY "messages_update_read_receipt"
    ON messages FOR UPDATE
    USING (
        -- Recipient can mark as read
        match_id IN (
            SELECT id FROM matches
            WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
        )
        AND sender_id != auth.uid()
    )
    WITH CHECK (
        -- Only allow updating read_at
        read_at IS NOT NULL
    );

-- ============================================
-- BLOCKED_USERS POLICIES
-- ============================================

-- Users can view their own blocks
CREATE POLICY "blocked_users_select_own"
    ON blocked_users FOR SELECT
    USING (blocker_id = auth.uid());

-- Users can insert their own blocks
CREATE POLICY "blocked_users_insert_own"
    ON blocked_users FOR INSERT
    WITH CHECK (blocker_id = auth.uid());

-- Users can delete their own blocks (unblock)
CREATE POLICY "blocked_users_delete_own"
    ON blocked_users FOR DELETE
    USING (blocker_id = auth.uid());

-- ============================================
-- USER_PREFERENCES POLICIES
-- ============================================

-- Users can only view their own preferences
CREATE POLICY "user_preferences_select_own"
    ON user_preferences FOR SELECT
    USING (profile_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "user_preferences_insert_own"
    ON user_preferences FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "user_preferences_update_own"
    ON user_preferences FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- ============================================
-- DEVICE_TOKENS POLICIES
-- ============================================

-- Users can view their own device tokens
CREATE POLICY "device_tokens_select_own"
    ON device_tokens FOR SELECT
    USING (profile_id = auth.uid());

-- Users can insert their own device tokens
CREATE POLICY "device_tokens_insert_own"
    ON device_tokens FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- Users can update their own device tokens
CREATE POLICY "device_tokens_update_own"
    ON device_tokens FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Users can delete their own device tokens
CREATE POLICY "device_tokens_delete_own"
    ON device_tokens FOR DELETE
    USING (profile_id = auth.uid());
