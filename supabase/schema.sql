-- ============================================
-- SPARK DATING APP - SUPABASE SCHEMA
-- ============================================
-- Run this file in Supabase SQL Editor to set up the database
-- Make sure to enable the required extensions first

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- CUSTOM TYPES
-- ============================================
CREATE TYPE gender_type AS ENUM ('man', 'woman', 'non_binary', 'other');
CREATE TYPE swipe_type AS ENUM ('like', 'pass');
CREATE TYPE presence_status AS ENUM ('online', 'away', 'offline');

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE,
    first_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_type NOT NULL,
    looking_for TEXT[] DEFAULT ARRAY['everyone'],
    bio TEXT,
    job_title TEXT,
    company TEXT,
    education TEXT,
    height_cm INTEGER,
    city TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location GEOGRAPHY(POINT, 4326),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for location-based queries
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX idx_profiles_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_profiles_gender ON profiles(gender);

-- ============================================
-- PROFILE PHOTOS TABLE
-- ============================================
CREATE TABLE profile_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, position)
);

CREATE INDEX idx_profile_photos_profile ON profile_photos(profile_id);

-- ============================================
-- PROMPTS TABLE
-- ============================================
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, position)
);

CREATE INDEX idx_prompts_profile ON prompts(profile_id);

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    min_age INTEGER DEFAULT 18,
    max_age INTEGER DEFAULT 50,
    max_distance_km INTEGER DEFAULT 50,
    show_me TEXT[] DEFAULT ARRAY['everyone'],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SWIPES TABLE (LIKES/PASSES)
-- ============================================
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swiper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    swiped_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    swipe_type swipe_type NOT NULL,
    comment TEXT, -- Comment when liking a specific content
    content_type TEXT, -- 'photo' or 'prompt'
    content_id UUID, -- ID of the photo or prompt liked
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(swiper_id, swiped_id)
);

CREATE INDEX idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX idx_swipes_swiped ON swipes(swiped_id);
CREATE INDEX idx_swipes_type ON swipes(swipe_type);

-- ============================================
-- MATCHES TABLE
-- ============================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    matched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'),
    has_messages BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id < user2_id) -- Ensures consistent ordering
);

CREATE INDEX idx_matches_user1 ON matches(user1_id) WHERE is_active = true;
CREATE INDEX idx_matches_user2 ON matches(user2_id) WHERE is_active = true;
CREATE INDEX idx_matches_expires ON matches(expires_at) WHERE is_active = true AND has_messages = false;

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(match_id, created_at DESC);

-- ============================================
-- BLOCKS TABLE
-- ============================================
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- ============================================
-- PUSH TOKENS TABLE
-- ============================================
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'ios' or 'android'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);

-- ============================================
-- USER PRESENCE TABLE
-- ============================================
CREATE TABLE user_presence (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    status presence_status DEFAULT 'offline',
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update location geography from lat/long
CREATE OR REPLACE FUNCTION update_profile_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_location();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_prompts_updated_at
    BEFORE UPDATE ON prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- CHECK FOR MUTUAL LIKE AND CREATE MATCH
-- ============================================
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
    mutual_like RECORD;
    new_match_id UUID;
    user1 UUID;
    user2 UUID;
BEGIN
    -- Only process likes, not passes
    IF NEW.swipe_type != 'like' THEN
        RETURN NEW;
    END IF;

    -- Check if there's a mutual like
    SELECT * INTO mutual_like
    FROM swipes
    WHERE swiper_id = NEW.swiped_id
      AND swiped_id = NEW.swiper_id
      AND swipe_type = 'like';

    IF FOUND THEN
        -- Order user IDs consistently
        IF NEW.swiper_id < NEW.swiped_id THEN
            user1 := NEW.swiper_id;
            user2 := NEW.swiped_id;
        ELSE
            user1 := NEW.swiped_id;
            user2 := NEW.swiper_id;
        END IF;

        -- Create match if it doesn't exist
        INSERT INTO matches (user1_id, user2_id)
        VALUES (user1, user2)
        ON CONFLICT (user1_id, user2_id) DO NOTHING
        RETURNING id INTO new_match_id;

        -- Could trigger push notification here via pg_notify
        IF new_match_id IS NOT NULL THEN
            PERFORM pg_notify('new_match', json_build_object(
                'match_id', new_match_id,
                'user1_id', user1,
                'user2_id', user2
            )::text);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_match
    AFTER INSERT ON swipes
    FOR EACH ROW
    EXECUTE FUNCTION check_and_create_match();

-- ============================================
-- UPDATE MATCH ON FIRST MESSAGE
-- ============================================
CREATE OR REPLACE FUNCTION update_match_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE matches
    SET has_messages = true,
        last_message_at = NEW.created_at,
        -- Stop the expiration timer on first message
        expires_at = NULL
    WHERE id = NEW.match_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_match_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_match_on_message();

-- ============================================
-- GET DISCOVERY FEED
-- ============================================
CREATE OR REPLACE FUNCTION get_discovery_feed(
    user_id_param UUID,
    limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
    profile_id UUID,
    first_name TEXT,
    date_of_birth DATE,
    age INTEGER,
    gender gender_type,
    bio TEXT,
    job_title TEXT,
    company TEXT,
    education TEXT,
    height_cm INTEGER,
    city TEXT,
    distance_km DOUBLE PRECISION,
    photos JSONB,
    prompts JSONB
) AS $$
DECLARE
    user_location GEOGRAPHY;
    user_prefs RECORD;
    user_gender gender_type;
    user_looking_for TEXT[];
BEGIN
    -- Get user's location and preferences
    SELECT p.location, p.gender, p.looking_for
    INTO user_location, user_gender, user_looking_for
    FROM profiles p
    WHERE p.id = user_id_param;

    SELECT * INTO user_prefs
    FROM user_preferences
    WHERE profile_id = user_id_param;

    -- Default preferences if not set
    IF user_prefs IS NULL THEN
        user_prefs := ROW(NULL, user_id_param, 18, 50, 50, ARRAY['everyone']);
    END IF;

    RETURN QUERY
    SELECT
        p.id AS profile_id,
        p.first_name,
        p.date_of_birth,
        EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER AS age,
        p.gender,
        p.bio,
        p.job_title,
        p.company,
        p.education,
        p.height_cm,
        p.city,
        CASE
            WHEN user_location IS NOT NULL AND p.location IS NOT NULL
            THEN ST_Distance(user_location, p.location) / 1000.0
            ELSE NULL
        END AS distance_km,
        (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', ph.id,
                    'storage_path', ph.storage_path,
                    'position', ph.position,
                    'is_primary', ph.is_primary
                ) ORDER BY ph.position
            ), '[]'::jsonb)
            FROM profile_photos ph
            WHERE ph.profile_id = p.id
        ) AS photos,
        (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', pr.id,
                    'prompt_text', pr.prompt_text,
                    'answer_text', pr.answer_text,
                    'position', pr.position
                ) ORDER BY pr.position
            ), '[]'::jsonb)
            FROM prompts pr
            WHERE pr.profile_id = p.id
        ) AS prompts
    FROM profiles p
    WHERE p.id != user_id_param
      AND p.is_active = true
      -- Age filter
      AND EXTRACT(YEAR FROM AGE(p.date_of_birth)) BETWEEN user_prefs.min_age AND user_prefs.max_age
      -- Gender filter
      AND (
          'everyone' = ANY(user_prefs.show_me)
          OR (p.gender = 'man' AND 'men' = ANY(user_prefs.show_me))
          OR (p.gender = 'woman' AND 'women' = ANY(user_prefs.show_me))
      )
      -- Not already swiped
      AND NOT EXISTS (
          SELECT 1 FROM swipes s
          WHERE s.swiper_id = user_id_param AND s.swiped_id = p.id
      )
      -- Not blocked
      AND NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE (b.blocker_id = user_id_param AND b.blocked_id = p.id)
             OR (b.blocker_id = p.id AND b.blocked_id = user_id_param)
      )
      -- Distance filter (if location available)
      AND (
          user_location IS NULL
          OR p.location IS NULL
          OR ST_DWithin(user_location, p.location, user_prefs.max_distance_km * 1000)
      )
      -- Has at least one photo
      AND EXISTS (
          SELECT 1 FROM profile_photos ph WHERE ph.profile_id = p.id
      )
    ORDER BY
        -- Prioritize recently active users
        p.last_active_at DESC,
        -- Then by distance
        CASE
            WHEN user_location IS NOT NULL AND p.location IS NOT NULL
            THEN ST_Distance(user_location, p.location)
            ELSE 0
        END
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET PROFILE WITH DETAILS
-- ============================================
CREATE OR REPLACE FUNCTION get_profile_with_details(profile_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile', jsonb_build_object(
            'id', p.id,
            'first_name', p.first_name,
            'date_of_birth', p.date_of_birth,
            'gender', p.gender,
            'looking_for', p.looking_for,
            'bio', p.bio,
            'job_title', p.job_title,
            'company', p.company,
            'education', p.education,
            'height_cm', p.height_cm,
            'city', p.city,
            'latitude', p.latitude,
            'longitude', p.longitude,
            'is_active', p.is_active,
            'is_verified', p.is_verified,
            'created_at', p.created_at
        ),
        'age', EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER,
        'photos', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', ph.id,
                    'storage_path', ph.storage_path,
                    'position', ph.position,
                    'is_primary', ph.is_primary
                ) ORDER BY ph.position
            ), '[]'::jsonb)
            FROM profile_photos ph
            WHERE ph.profile_id = p.id
        ),
        'prompts', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', pr.id,
                    'prompt_text', pr.prompt_text,
                    'answer_text', pr.answer_text,
                    'position', pr.position
                ) ORDER BY pr.position
            ), '[]'::jsonb)
            FROM prompts pr
            WHERE pr.profile_id = p.id
        )
    ) INTO result
    FROM profiles p
    WHERE p.id = profile_id_param;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET LIKES RECEIVED
-- ============================================
CREATE OR REPLACE FUNCTION get_likes_received(user_id_param UUID)
RETURNS TABLE (
    swipe_id UUID,
    from_user_id UUID,
    first_name TEXT,
    age INTEGER,
    primary_photo_path TEXT,
    comment TEXT,
    content_type TEXT,
    liked_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS swipe_id,
        s.swiper_id AS from_user_id,
        p.first_name,
        EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER AS age,
        (SELECT ph.storage_path FROM profile_photos ph
         WHERE ph.profile_id = p.id AND ph.is_primary = true
         LIMIT 1) AS primary_photo_path,
        s.comment,
        s.content_type,
        s.created_at AS liked_at
    FROM swipes s
    JOIN profiles p ON p.id = s.swiper_id
    WHERE s.swiped_id = user_id_param
      AND s.swipe_type = 'like'
      -- Not already matched
      AND NOT EXISTS (
          SELECT 1 FROM matches m
          WHERE m.is_active = true
            AND ((m.user1_id = s.swiper_id AND m.user2_id = user_id_param)
              OR (m.user1_id = user_id_param AND m.user2_id = s.swiper_id))
      )
      -- Not blocked
      AND NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE b.blocker_id = user_id_param AND b.blocked_id = s.swiper_id
      )
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET MATCHES
-- ============================================
CREATE OR REPLACE FUNCTION get_matches(user_id_param UUID)
RETURNS TABLE (
    match_id UUID,
    other_user_id UUID,
    first_name TEXT,
    primary_photo_path TEXT,
    matched_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    has_messages BOOLEAN,
    last_message_at TIMESTAMPTZ,
    last_message TEXT,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id AS match_id,
        CASE WHEN m.user1_id = user_id_param THEN m.user2_id ELSE m.user1_id END AS other_user_id,
        p.first_name,
        (SELECT ph.storage_path FROM profile_photos ph
         WHERE ph.profile_id = p.id AND ph.is_primary = true
         LIMIT 1) AS primary_photo_path,
        m.matched_at,
        m.expires_at,
        m.has_messages,
        m.last_message_at,
        (SELECT msg.content FROM messages msg
         WHERE msg.match_id = m.id
         ORDER BY msg.created_at DESC
         LIMIT 1) AS last_message,
        (SELECT COUNT(*) FROM messages msg
         WHERE msg.match_id = m.id
           AND msg.sender_id != user_id_param
           AND msg.is_read = false) AS unread_count
    FROM matches m
    JOIN profiles p ON p.id = CASE
        WHEN m.user1_id = user_id_param THEN m.user2_id
        ELSE m.user1_id
    END
    WHERE (m.user1_id = user_id_param OR m.user2_id = user_id_param)
      AND m.is_active = true
      -- Not expired (or has messages)
      AND (m.expires_at IS NULL OR m.expires_at > NOW() OR m.has_messages = true)
    ORDER BY
        COALESCE(m.last_message_at, m.matched_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DELETE USER ACCOUNT
-- ============================================
CREATE OR REPLACE FUNCTION delete_user_account(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete profile photos from storage is handled by app
    -- Cascade will handle: photos, prompts, preferences, swipes, messages, blocks, tokens

    -- First deactivate matches
    UPDATE matches
    SET is_active = false
    WHERE user1_id = user_id_param OR user2_id = user_id_param;

    -- Delete the profile (cascades to related tables)
    DELETE FROM profiles WHERE id = user_id_param;

    -- Note: The actual auth.users record should be deleted via Supabase Admin API
    -- or the user should call supabase.auth.admin.deleteUser()

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- EXPIRE OLD MATCHES (RUN AS CRON JOB)
-- ============================================
CREATE OR REPLACE FUNCTION expire_old_matches()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE matches
    SET is_active = false
    WHERE is_active = true
      AND has_messages = false
      AND expires_at IS NOT NULL
      AND expires_at < NOW();

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view active profiles"
    ON profiles FOR SELECT
    USING (is_active = true OR id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- PROFILE PHOTOS
CREATE POLICY "Users can view photos of active profiles"
    ON profile_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = profile_photos.profile_id
            AND (p.is_active = true OR p.id = auth.uid())
        )
    );

CREATE POLICY "Users can manage own photos"
    ON profile_photos FOR ALL
    USING (profile_id = auth.uid());

-- PROMPTS
CREATE POLICY "Users can view prompts of active profiles"
    ON prompts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = prompts.profile_id
            AND (p.is_active = true OR p.id = auth.uid())
        )
    );

CREATE POLICY "Users can manage own prompts"
    ON prompts FOR ALL
    USING (profile_id = auth.uid());

-- USER PREFERENCES
CREATE POLICY "Users can manage own preferences"
    ON user_preferences FOR ALL
    USING (profile_id = auth.uid());

-- SWIPES
CREATE POLICY "Users can create swipes"
    ON swipes FOR INSERT
    WITH CHECK (swiper_id = auth.uid());

CREATE POLICY "Users can view swipes they made"
    ON swipes FOR SELECT
    USING (swiper_id = auth.uid());

CREATE POLICY "Users can view likes they received"
    ON swipes FOR SELECT
    USING (swiped_id = auth.uid() AND swipe_type = 'like');

-- MATCHES
CREATE POLICY "Users can view their matches"
    ON matches FOR SELECT
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can update their matches"
    ON matches FOR UPDATE
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- MESSAGES
CREATE POLICY "Users can view messages in their matches"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = messages.match_id
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
            AND m.is_active = true
        )
    );

CREATE POLICY "Users can send messages in their matches"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = messages.match_id
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
            AND m.is_active = true
        )
    );

CREATE POLICY "Users can update messages they received"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = messages.match_id
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
        )
        AND sender_id != auth.uid()
    );

-- BLOCKS
CREATE POLICY "Users can manage their blocks"
    ON blocks FOR ALL
    USING (blocker_id = auth.uid());

-- PUSH TOKENS
CREATE POLICY "Users can manage own push tokens"
    ON push_tokens FOR ALL
    USING (user_id = auth.uid());

-- USER PRESENCE
CREATE POLICY "Users can view presence"
    ON user_presence FOR SELECT
    USING (true);

CREATE POLICY "Users can update own presence"
    ON user_presence FOR ALL
    USING (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these in SQL Editor or via Supabase Dashboard

-- Create bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos',
    'profile-photos',
    false,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'profile-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own photos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'profile-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'profile-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Authenticated users can view photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- ============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================
-- Uncomment to insert sample prompt options

/*
CREATE TABLE IF NOT EXISTS prompt_options (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL UNIQUE
);

INSERT INTO prompt_options (text) VALUES
    ('Two truths and a lie'),
    ('My simple pleasures'),
    ('The way to win me over is'),
    ('I''m convinced that'),
    ('My most irrational fear'),
    ('The key to my heart is'),
    ('I''m weirdly attracted to'),
    ('My love language is'),
    ('The one thing I''d love to know about you is'),
    ('A life goal of mine'),
    ('I recently discovered that'),
    ('Believe it or not, I'),
    ('My greatest strength'),
    ('I''m looking for'),
    ('Together, we could'),
    ('I want someone who'),
    ('My most controversial opinion'),
    ('The best way to ask me out is'),
    ('I''m the type of texter who'),
    ('Dating me is like')
ON CONFLICT (text) DO NOTHING;
*/

-- ============================================
-- CRON JOB SETUP (via pg_cron extension)
-- ============================================
-- Run expired matches cleanup every hour
-- Note: pg_cron must be enabled in Supabase Dashboard

/*
SELECT cron.schedule(
    'expire-matches',
    '0 * * * *', -- Every hour
    $$SELECT expire_old_matches()$$
);
*/

-- ============================================
-- GRANTS
-- ============================================
-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_discovery_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_likes_received TO authenticated;
GRANT EXECUTE ON FUNCTION get_matches TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account TO authenticated;
