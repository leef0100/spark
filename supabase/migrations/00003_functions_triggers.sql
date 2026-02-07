-- Spark Dating App - Functions and Triggers
-- Migration: 00003_functions_triggers.sql

-- ============================================
-- MATCH CREATION TRIGGER
-- When a like/comment is created, check for mutual like and create match
-- ============================================

CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
    reverse_interaction RECORD;
    new_match_id UUID;
    u1 UUID;
    u2 UUID;
BEGIN
    -- Only process likes and comments (not passes)
    IF NEW.type = 'pass' THEN
        RETURN NEW;
    END IF;

    -- Check if the target has already liked/commented on the actor
    SELECT * INTO reverse_interaction
    FROM interactions
    WHERE actor_id = NEW.target_id
      AND target_id = NEW.actor_id
      AND type IN ('like', 'comment');

    -- If mutual like exists, create a match
    IF FOUND THEN
        -- Determine canonical ordering
        IF NEW.actor_id < NEW.target_id THEN
            u1 := NEW.actor_id;
            u2 := NEW.target_id;
        ELSE
            u1 := NEW.target_id;
            u2 := NEW.actor_id;
        END IF;

        -- Check if match already exists
        IF NOT EXISTS (
            SELECT 1 FROM matches
            WHERE user1_id = u1 AND user2_id = u2
        ) THEN
            -- Create the match with 3-day expiry
            INSERT INTO matches (user1_id, user2_id, expires_at)
            VALUES (u1, u2, now() + INTERVAL '3 days')
            RETURNING id INTO new_match_id;

            -- Notify both users (will be handled by realtime or edge function)
            PERFORM pg_notify('new_match', json_build_object(
                'match_id', new_match_id,
                'user1_id', u1,
                'user2_id', u2
            )::text);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_and_create_match
    AFTER INSERT ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION check_and_create_match();

-- ============================================
-- RESET MATCH EXPIRY ON FIRST MESSAGE
-- When first message is sent, remove the expiry timer
-- ============================================

CREATE OR REPLACE FUNCTION reset_expiry_on_first_message()
RETURNS TRIGGER AS $$
DECLARE
    message_count INTEGER;
BEGIN
    -- Count existing messages in this match (excluding the new one)
    SELECT COUNT(*) INTO message_count
    FROM messages
    WHERE match_id = NEW.match_id
      AND id != NEW.id;

    -- If this is the first message, remove the expiry
    IF message_count = 0 THEN
        UPDATE matches
        SET expires_at = NULL
        WHERE id = NEW.match_id;

        -- Notify that conversation started
        PERFORM pg_notify('conversation_started', json_build_object(
            'match_id', NEW.match_id,
            'sender_id', NEW.sender_id
        )::text);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_reset_expiry_on_first_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION reset_expiry_on_first_message();

-- ============================================
-- EXPIRE STALE MATCHES
-- Called by cron job to expire matches with no messages
-- ============================================

CREATE OR REPLACE FUNCTION expire_stale_matches()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    WITH expired AS (
        UPDATE matches
        SET
            is_active = false,
            expired_reason = 'timeout'
        WHERE
            is_active = true
            AND expires_at IS NOT NULL
            AND expires_at < now()
            AND id NOT IN (
                -- Matches with messages don't expire (but should have NULL expires_at anyway)
                SELECT DISTINCT match_id FROM messages
            )
        RETURNING id, user1_id, user2_id
    )
    SELECT COUNT(*) INTO expired_count FROM expired;

    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UNMATCH FUNCTION
-- Allows users to unmatch
-- ============================================

CREATE OR REPLACE FUNCTION unmatch(match_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    match_record RECORD;
BEGIN
    -- Get the match and verify user is part of it
    SELECT * INTO match_record
    FROM matches
    WHERE id = match_id_param
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
      AND is_active = true;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Deactivate the match
    UPDATE matches
    SET
        is_active = false,
        expired_reason = 'unmatched'
    WHERE id = match_id_param;

    -- Delete all messages in this match
    DELETE FROM messages WHERE match_id = match_id_param;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DISCOVERY FEED FUNCTION
-- Returns profiles matching user preferences
-- ============================================

CREATE OR REPLACE FUNCTION get_discovery_feed(
    user_id UUID,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    profile_id UUID,
    first_name TEXT,
    birth_date DATE,
    age INTEGER,
    gender gender_type,
    bio TEXT,
    height_cm INTEGER,
    job_title TEXT,
    company TEXT,
    education TEXT,
    city TEXT,
    distance_km FLOAT,
    last_active_at TIMESTAMPTZ
) AS $$
DECLARE
    user_profile RECORD;
    user_prefs RECORD;
    user_looking_for looking_for_type[];
BEGIN
    -- Get user's profile and location
    SELECT * INTO user_profile
    FROM profiles
    WHERE id = user_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Get user's preferences
    SELECT * INTO user_prefs
    FROM user_preferences
    WHERE profile_id = user_id;

    -- Default preferences if not set
    IF NOT FOUND THEN
        user_prefs.min_age := 18;
        user_prefs.max_age := 99;
        user_prefs.max_distance_km := 50;
        user_prefs.show_me := user_profile.looking_for;
    END IF;

    -- Map show_me preferences to genders
    -- 'men' -> 'man', 'women' -> 'woman', 'everyone' -> all

    RETURN QUERY
    SELECT
        p.id AS profile_id,
        p.first_name,
        p.birth_date,
        calculate_age(p.birth_date) AS age,
        p.gender,
        p.bio,
        p.height_cm,
        p.job_title,
        p.company,
        p.education,
        p.city,
        CASE
            WHEN user_profile.location IS NOT NULL AND p.location IS NOT NULL
            THEN calculate_distance_km(user_profile.location, p.location)
            ELSE NULL
        END AS distance_km,
        p.last_active_at
    FROM profiles p
    WHERE
        -- Not the current user
        p.id != user_id
        -- Profile is active
        AND p.is_active = true
        -- Not already interacted with
        AND NOT EXISTS (
            SELECT 1 FROM interactions
            WHERE actor_id = user_id AND target_id = p.id
        )
        -- Not blocked by user
        AND NOT EXISTS (
            SELECT 1 FROM blocked_users
            WHERE blocker_id = user_id AND blocked_id = p.id
        )
        -- User not blocked by them
        AND NOT EXISTS (
            SELECT 1 FROM blocked_users
            WHERE blocker_id = p.id AND blocked_id = user_id
        )
        -- Age within preferences
        AND calculate_age(p.birth_date) >= user_prefs.min_age
        AND calculate_age(p.birth_date) <= user_prefs.max_age
        -- Gender matches preferences
        AND (
            'everyone' = ANY(user_prefs.show_me)
            OR (p.gender = 'man' AND 'men' = ANY(user_prefs.show_me))
            OR (p.gender = 'woman' AND 'women' = ANY(user_prefs.show_me))
        )
        -- User's gender matches their looking_for
        AND (
            'everyone' = ANY(p.looking_for)
            OR (user_profile.gender = 'man' AND 'men' = ANY(p.looking_for))
            OR (user_profile.gender = 'woman' AND 'women' = ANY(p.looking_for))
        )
        -- Distance within preferences (if locations available)
        AND (
            user_profile.location IS NULL
            OR p.location IS NULL
            OR ST_DWithin(
                user_profile.location,
                p.location,
                user_prefs.max_distance_km * 1000 -- Convert km to meters
            )
        )
    ORDER BY
        -- Prioritize recently active users
        p.last_active_at DESC,
        -- Add some randomization
        random()
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- GET PROFILE WITH DETAILS
-- Returns a profile with photos and prompts
-- ============================================

CREATE OR REPLACE FUNCTION get_profile_with_details(profile_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'profile', row_to_json(p),
        'photos', COALESCE(
            (SELECT json_agg(row_to_json(ph) ORDER BY ph.position)
             FROM profile_photos ph
             WHERE ph.profile_id = p.id),
            '[]'::json
        ),
        'prompts', COALESCE(
            (SELECT json_agg(row_to_json(pr) ORDER BY pr.position)
             FROM prompts pr
             WHERE pr.profile_id = p.id),
            '[]'::json
        ),
        'age', calculate_age(p.birth_date)
    ) INTO result
    FROM profiles p
    WHERE p.id = profile_id_param;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- GET LIKES RECEIVED
-- Returns profiles that have liked the current user
-- ============================================

CREATE OR REPLACE FUNCTION get_likes_received(user_id UUID)
RETURNS TABLE (
    interaction_id UUID,
    liker_profile JSON,
    interaction_type interaction_type,
    comment_text TEXT,
    liked_content_type liked_content_type,
    liked_content_id UUID,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id AS interaction_id,
        get_profile_with_details(i.actor_id) AS liker_profile,
        i.type AS interaction_type,
        i.comment_text,
        i.liked_content_type,
        i.liked_content_id,
        i.created_at
    FROM interactions i
    WHERE
        i.target_id = user_id
        AND i.type IN ('like', 'comment')
        -- Not yet matched
        AND NOT EXISTS (
            SELECT 1 FROM matches m
            WHERE (
                (m.user1_id = i.actor_id AND m.user2_id = user_id)
                OR (m.user1_id = user_id AND m.user2_id = i.actor_id)
            )
        )
        -- Not blocked
        AND NOT EXISTS (
            SELECT 1 FROM blocked_users bu
            WHERE bu.blocker_id = user_id AND bu.blocked_id = i.actor_id
        )
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- GET MATCHES WITH DETAILS
-- Returns user's matches with other user's profile
-- ============================================

CREATE OR REPLACE FUNCTION get_matches_with_details(user_id UUID)
RETURNS TABLE (
    match_id UUID,
    matched_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    has_messages BOOLEAN,
    other_user JSON,
    last_message JSON,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id AS match_id,
        m.matched_at,
        m.expires_at,
        EXISTS (SELECT 1 FROM messages msg WHERE msg.match_id = m.id) AS has_messages,
        get_profile_with_details(
            CASE WHEN m.user1_id = user_id THEN m.user2_id ELSE m.user1_id END
        ) AS other_user,
        (
            SELECT row_to_json(msg)
            FROM messages msg
            WHERE msg.match_id = m.id
            ORDER BY msg.created_at DESC
            LIMIT 1
        ) AS last_message,
        (
            SELECT COUNT(*)
            FROM messages msg
            WHERE msg.match_id = m.id
              AND msg.sender_id != user_id
              AND msg.read_at IS NULL
        ) AS unread_count
    FROM matches m
    WHERE
        (m.user1_id = user_id OR m.user2_id = user_id)
        AND m.is_active = true
    ORDER BY
        -- Matches with unread messages first
        (SELECT MAX(created_at) FROM messages msg WHERE msg.match_id = m.id) DESC NULLS LAST,
        m.matched_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- UPDATE LAST ACTIVE
-- Updates user's last active timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_last_active()
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET last_active_at = now()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DELETE ACCOUNT
-- Completely removes all user data
-- ============================================

CREATE OR REPLACE FUNCTION delete_account()
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete profile (cascades to photos, prompts, interactions, etc.)
    DELETE FROM profiles WHERE id = auth.uid();

    -- Note: Auth user deletion should be handled separately via Supabase Auth API

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
