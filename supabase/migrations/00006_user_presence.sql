-- Create presence status enum
CREATE TYPE presence_status AS ENUM ('online', 'away', 'offline');

-- Create user_presence table for tracking online status
CREATE TABLE user_presence (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    status presence_status DEFAULT 'offline',
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Users can view any user's presence
CREATE POLICY "user_presence_select"
    ON user_presence FOR SELECT
    USING (true);

-- Users can only manage their own presence
CREATE POLICY "user_presence_insert_own"
    ON user_presence FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_presence_update_own"
    ON user_presence FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
