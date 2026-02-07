-- ============================================
-- SPARK DATING APP - SEED DATA
-- ============================================
-- Run this after schema.sql to populate initial data

-- ============================================
-- PROMPT OPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_options (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'general'
);

INSERT INTO prompt_options (text, category) VALUES
    -- About Me
    ('Two truths and a lie', 'about'),
    ('My simple pleasures', 'about'),
    ('I''m convinced that', 'about'),
    ('My most irrational fear', 'about'),
    ('Believe it or not, I', 'about'),
    ('My greatest strength', 'about'),
    ('I recently discovered that', 'about'),
    ('My most controversial opinion', 'about'),
    ('A life goal of mine', 'about'),
    ('The award I should be nominated for', 'about'),

    -- Dating
    ('The way to win me over is', 'dating'),
    ('The key to my heart is', 'dating'),
    ('I''m weirdly attracted to', 'dating'),
    ('My love language is', 'dating'),
    ('I''m looking for', 'dating'),
    ('I want someone who', 'dating'),
    ('The best way to ask me out is', 'dating'),
    ('Together, we could', 'dating'),
    ('Dating me is like', 'dating'),
    ('On a Sunday morning you''ll find me', 'dating'),

    -- Conversation Starters
    ('The one thing I''d love to know about you is', 'conversation'),
    ('Let''s debate this topic', 'conversation'),
    ('I''m the type of texter who', 'conversation'),
    ('My go-to karaoke song', 'conversation'),
    ('The best travel story I have', 'conversation'),
    ('My favorite quality in a person', 'conversation'),
    ('I''ll fall for you if', 'conversation'),
    ('What if I told you that', 'conversation'),
    ('I guarantee you that', 'conversation'),
    ('The dorkiest thing about me', 'conversation')
ON CONFLICT (text) DO NOTHING;

-- ============================================
-- REPORT REASONS
-- ============================================
CREATE TABLE IF NOT EXISTS report_reasons (
    id SERIAL PRIMARY KEY,
    reason TEXT NOT NULL UNIQUE,
    description TEXT
);

INSERT INTO report_reasons (reason, description) VALUES
    ('fake_profile', 'This profile appears to be fake or a catfish'),
    ('inappropriate_photos', 'Contains inappropriate or explicit photos'),
    ('harassment', 'Sent harassing or abusive messages'),
    ('spam', 'Appears to be spam or advertising'),
    ('underage', 'Appears to be under 18 years old'),
    ('scam', 'Attempting to scam or solicit money'),
    ('other', 'Other reason not listed')
ON CONFLICT (reason) DO NOTHING;

-- ============================================
-- APP CONFIGURATION
-- ============================================
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_config (key, value, description) VALUES
    ('match_expiration_hours', '72', 'Hours before unresponded match expires'),
    ('max_photos', '6', 'Maximum photos per profile'),
    ('min_photos', '2', 'Minimum photos required'),
    ('max_prompts', '3', 'Maximum prompts per profile'),
    ('min_age', '18', 'Minimum age to use the app'),
    ('max_age', '100', 'Maximum age for discovery'),
    ('max_distance_km', '160', 'Maximum distance filter'),
    ('daily_like_limit', '100', 'Maximum likes per day (0 = unlimited)'),
    ('message_max_length', '1000', 'Maximum message length'),
    ('bio_max_length', '500', 'Maximum bio length'),
    ('prompt_answer_min_length', '10', 'Minimum prompt answer length'),
    ('prompt_answer_max_length', '300', 'Maximum prompt answer length')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Grant read access to app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app config"
    ON app_config FOR SELECT
    USING (true);

-- Grant read access to prompt_options
ALTER TABLE prompt_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read prompt options"
    ON prompt_options FOR SELECT
    USING (true);

-- Grant read access to report_reasons
ALTER TABLE report_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read report reasons"
    ON report_reasons FOR SELECT
    USING (true);
