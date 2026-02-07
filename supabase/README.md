# Spark Dating App - Supabase Setup

This directory contains the database schema and configuration for the Spark dating app.

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable the following extensions in Database → Extensions:
   - `uuid-ossp` (for UUID generation)
   - `postgis` (for location-based queries)

## Setup Instructions

### 1. Run the Schema

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of `schema.sql`
3. Run the SQL to create all tables, functions, and policies

### 2. Run the Seed Data

1. In SQL Editor, run `seed.sql` to populate:
   - Prompt options
   - Report reasons
   - App configuration

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Enable Realtime

1. Go to Database → Replication
2. Enable replication for:
   - `messages` table
   - `matches` table

### 5. Configure Storage

The schema automatically creates the `profile-photos` bucket. Verify in Storage that:
- Bucket exists with 5MB file size limit
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

### 6. Set Up Cron Jobs (Optional)

To automatically expire old matches, enable `pg_cron` extension and run:

```sql
SELECT cron.schedule(
    'expire-matches',
    '0 * * * *', -- Every hour
    $$SELECT expire_old_matches()$$
);
```

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with personal info and location |
| `profile_photos` | User photos (max 6 per user) |
| `prompts` | User prompt answers (max 3 per user) |
| `user_preferences` | Discovery preferences (age, distance, gender) |
| `swipes` | Likes and passes between users |
| `matches` | Mutual likes that create matches |
| `messages` | Chat messages between matched users |
| `blocks` | Blocked users |
| `push_tokens` | Push notification tokens |
| `user_presence` | Online/offline status |

### Key Functions

| Function | Description |
|----------|-------------|
| `get_discovery_feed(user_id, limit)` | Get profiles for discovery based on preferences |
| `get_profile_with_details(profile_id)` | Get full profile with photos and prompts |
| `get_likes_received(user_id)` | Get likes received by a user |
| `get_matches(user_id)` | Get all active matches for a user |
| `delete_user_account(user_id)` | Delete user and all related data |
| `expire_old_matches()` | Expire matches without messages after 3 days |

### Triggers

| Trigger | Description |
|---------|-------------|
| `check_and_create_match` | Creates match when mutual like detected |
| `update_match_on_message` | Stops expiration timer on first message |
| `update_profile_location` | Updates geography from lat/long |

## Row Level Security

All tables have RLS enabled with appropriate policies:

- Users can only view active profiles
- Users can only modify their own data
- Messages are only visible to match participants
- Swipes (passes) are private, likes received are visible

## Storage Structure

Photos are stored in the `profile-photos` bucket:
```
profile-photos/
  {user_id}/
    {timestamp}_{position}.jpg
```

## Production Checklist

- [ ] Enable `postgis` extension
- [ ] Run `schema.sql`
- [ ] Run `seed.sql`
- [ ] Enable Realtime for `messages` and `matches`
- [ ] Set up cron job for match expiration
- [ ] Configure proper CORS settings
- [ ] Set up database backups
- [ ] Configure connection pooling for production load
