-- Spark Dating App - Initial Schema
-- Migration: 00001_initial_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE gender_type AS ENUM ('man', 'woman', 'nonbinary');
CREATE TYPE looking_for_type AS ENUM ('men', 'women', 'everyone');
CREATE TYPE interaction_type AS ENUM ('like', 'comment', 'pass');
CREATE TYPE liked_content_type AS ENUM ('photo', 'prompt');
CREATE TYPE expired_reason_type AS ENUM ('timeout', 'unmatched');

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    gender gender_type NOT NULL,
    looking_for looking_for_type[] NOT NULL DEFAULT '{}',
    bio TEXT CHECK (char_length(bio) <= 500),
    height_cm INTEGER CHECK (height_cm >= 100 AND height_cm <= 250),
    job_title TEXT,
    company TEXT,
    education TEXT,
    city TEXT,
    latitude FLOAT8,
    longitude FLOAT8,
    location GEOGRAPHY(POINT, 4326), -- PostGIS point for efficient distance queries
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Ensure user is at least 18 years old
    CONSTRAINT age_check CHECK (birth_date <= CURRENT_DATE - INTERVAL '18 years')
);

-- Index for location-based queries
CREATE INDEX idx_profiles_location ON profiles USING GIST (location);
CREATE INDEX idx_profiles_active ON profiles (is_active) WHERE is_active = true;
CREATE INDEX idx_profiles_last_active ON profiles (last_active_at DESC);
CREATE INDEX idx_profiles_gender ON profiles (gender);

-- Trigger to update location geography from lat/lng
CREATE OR REPLACE FUNCTION update_profile_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_location
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_location();

-- ============================================
-- PROFILE_PHOTOS TABLE
-- ============================================

CREATE TABLE profile_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0 AND position <= 5),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Only one photo per position per profile
    CONSTRAINT unique_profile_position UNIQUE (profile_id, position)
);

CREATE INDEX idx_profile_photos_profile ON profile_photos (profile_id);

-- Trigger to ensure only one primary photo per profile
CREATE OR REPLACE FUNCTION ensure_single_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE profile_photos
        SET is_primary = false
        WHERE profile_id = NEW.profile_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_photo
    AFTER INSERT OR UPDATE ON profile_photos
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION ensure_single_primary_photo();

-- ============================================
-- PROMPTS TABLE (Hinge-style voice prompts)
-- ============================================

CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    answer_text TEXT NOT NULL CHECK (char_length(answer_text) <= 250),
    position INTEGER NOT NULL CHECK (position >= 0 AND position <= 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Max 3 prompts per profile, unique positions
    CONSTRAINT unique_prompt_position UNIQUE (profile_id, position)
);

CREATE INDEX idx_prompts_profile ON prompts (profile_id);

-- ============================================
-- INTERACTIONS TABLE
-- ============================================

CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type interaction_type NOT NULL,
    comment_text TEXT CHECK (char_length(comment_text) <= 200),
    liked_content_type liked_content_type,
    liked_content_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One action per user pair
    CONSTRAINT unique_interaction UNIQUE (actor_id, target_id),
    -- Can't interact with yourself
    CONSTRAINT no_self_interaction CHECK (actor_id != target_id),
    -- Comment requires comment_text
    CONSTRAINT comment_requires_text CHECK (
        (type = 'comment' AND comment_text IS NOT NULL) OR
        (type != 'comment')
    )
);

CREATE INDEX idx_interactions_actor ON interactions (actor_id);
CREATE INDEX idx_interactions_target ON interactions (target_id);
CREATE INDEX idx_interactions_type ON interactions (type);
CREATE INDEX idx_interactions_created ON interactions (created_at DESC);

-- ============================================
-- MATCHES TABLE
-- ============================================

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '3 days'), -- THE 3-DAY RULE
    is_active BOOLEAN NOT NULL DEFAULT true,
    expired_reason expired_reason_type,

    -- Canonical ordering prevents duplicates (user1_id always < user2_id)
    CONSTRAINT user_order CHECK (user1_id < user2_id),
    -- Unique match per pair
    CONSTRAINT unique_match UNIQUE (user1_id, user2_id)
);

CREATE INDEX idx_matches_user1 ON matches (user1_id);
CREATE INDEX idx_matches_user2 ON matches (user2_id);
CREATE INDEX idx_matches_active ON matches (is_active) WHERE is_active = true;
CREATE INDEX idx_matches_expires ON matches (expires_at) WHERE expires_at IS NOT NULL AND is_active = true;

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 2000),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_match ON messages (match_id);
CREATE INDEX idx_messages_sender ON messages (sender_id);
CREATE INDEX idx_messages_created ON messages (created_at DESC);
CREATE INDEX idx_messages_unread ON messages (match_id, read_at) WHERE read_at IS NULL;

-- ============================================
-- BLOCKED_USERS TABLE
-- ============================================

CREATE TABLE blocked_users (
    blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users (blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users (blocked_id);

-- ============================================
-- USER_PREFERENCES TABLE
-- ============================================

CREATE TABLE user_preferences (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    min_age INTEGER NOT NULL DEFAULT 18 CHECK (min_age >= 18 AND min_age <= 99),
    max_age INTEGER NOT NULL DEFAULT 99 CHECK (max_age >= 18 AND max_age <= 99),
    max_distance_km INTEGER NOT NULL DEFAULT 50 CHECK (max_distance_km >= 1 AND max_distance_km <= 500),
    show_me looking_for_type[] NOT NULL DEFAULT '{everyone}',

    CONSTRAINT valid_age_range CHECK (min_age <= max_age)
);

-- ============================================
-- DEVICE_TOKENS TABLE (for push notifications)
-- ============================================

CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_token UNIQUE (token)
);

CREATE INDEX idx_device_tokens_profile ON device_tokens (profile_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Calculate age from birth date
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate distance between two profiles in kilometers
CREATE OR REPLACE FUNCTION calculate_distance_km(
    loc1 GEOGRAPHY,
    loc2 GEOGRAPHY
)
RETURNS FLOAT AS $$
BEGIN
    IF loc1 IS NULL OR loc2 IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN ST_Distance(loc1, loc2) / 1000; -- Convert meters to km
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if two users are a match
CREATE OR REPLACE FUNCTION are_matched(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
DECLARE
    u1 UUID;
    u2 UUID;
BEGIN
    -- Ensure canonical ordering
    IF user_a < user_b THEN
        u1 := user_a;
        u2 := user_b;
    ELSE
        u1 := user_b;
        u2 := user_a;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM matches
        WHERE user1_id = u1 AND user2_id = u2 AND is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE;
