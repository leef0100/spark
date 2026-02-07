// Supabase Edge Function: expire-stale-matches
// Runs on a cron schedule to expire matches with no messages after 3 days

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpiredMatch {
  id: string;
  user1_id: string;
  user2_id: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify this is a cron job or admin request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find matches that should expire
    const { data: expiredMatches, error: fetchError } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id')
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString())
      .returns<ExpiredMatch[]>();

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredMatches || expiredMatches.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No matches to expire', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out matches that have messages (shouldn't have expires_at anyway, but double-check)
    const matchIdsToExpire: string[] = [];
    const usersToNotify: { match_id: string; user1_id: string; user2_id: string }[] = [];

    for (const match of expiredMatches) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', match.id);

      if (count === 0) {
        matchIdsToExpire.push(match.id);
        usersToNotify.push(match);
      }
    }

    if (matchIdsToExpire.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No matches to expire after filtering', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Expire the matches
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        is_active: false,
        expired_reason: 'timeout',
      })
      .in('id', matchIdsToExpire);

    if (updateError) {
      throw updateError;
    }

    // Send push notifications to users about expired matches
    for (const match of usersToNotify) {
      await sendExpirationNotification(supabase, match.user1_id, match.user2_id);
      await sendExpirationNotification(supabase, match.user2_id, match.user1_id);
    }

    return new Response(
      JSON.stringify({
        message: 'Matches expired successfully',
        count: matchIdsToExpire.length,
        expired_match_ids: matchIdsToExpire,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error expiring matches:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendExpirationNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  otherUserId: string
) {
  try {
    // Get the other user's name
    const { data: otherUser } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', otherUserId)
      .single();

    if (!otherUser) return;

    // Get user's device tokens
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('profile_id', userId);

    if (!tokens || tokens.length === 0) return;

    // Send push notification (implement based on your push service)
    // This is a placeholder - integrate with Expo Push or your preferred service
    console.log(`Would send notification to user ${userId}: Your match with ${otherUser.first_name} has expired`);
  } catch (error) {
    console.error('Error sending expiration notification:', error);
  }
}
