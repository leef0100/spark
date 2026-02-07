-- Spark Dating App - Realtime Configuration
-- Migration: 00005_realtime.sql

-- ============================================
-- ENABLE REALTIME ON TABLES
-- ============================================

-- Enable realtime for messages (live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for matches (instant match notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Enable realtime for interactions (new likes notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE interactions;

-- Note: Realtime is filtered by RLS policies automatically
-- Users will only receive updates for rows they have access to
