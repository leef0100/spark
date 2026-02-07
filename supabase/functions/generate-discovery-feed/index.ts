// Supabase Edge Function: generate-discovery-feed
// Returns discovery feed for a user with caching

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoveryProfile {
  profile_id: string;
  first_name: string;
  birth_date: string;
  age: number;
  gender: string;
  bio: string | null;
  height_cm: number | null;
  job_title: string | null;
  company: string | null;
  education: string | null;
  city: string | null;
  distance_km: number | null;
  last_active_at: string;
  photos: Array<{
    id: string;
    storage_path: string;
    position: number;
    is_primary: boolean;
  }>;
  prompts: Array<{
    id: string;
    prompt_text: string;
    answer_text: string;
    position: number;
  }>;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with user's auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query params
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Call the discovery feed function
    const { data: profiles, error: feedError } = await supabase
      .rpc('get_discovery_feed', {
        user_id: user.id,
        limit_count: limit,
        offset_count: offset,
      });

    if (feedError) {
      throw feedError;
    }

    // Enrich profiles with photos and prompts
    const enrichedProfiles: DiscoveryProfile[] = [];

    for (const profile of profiles || []) {
      // Get photos
      const { data: photos } = await supabase
        .from('profile_photos')
        .select('id, storage_path, position, is_primary')
        .eq('profile_id', profile.profile_id)
        .order('position');

      // Get prompts
      const { data: prompts } = await supabase
        .from('prompts')
        .select('id, prompt_text, answer_text, position')
        .eq('profile_id', profile.profile_id)
        .order('position');

      // Generate signed URLs for photos
      const photosWithUrls = await Promise.all(
        (photos || []).map(async (photo) => {
          const { data: signedUrl } = await supabase.storage
            .from('profile-photos')
            .createSignedUrl(photo.storage_path, 3600); // 1 hour expiry

          return {
            ...photo,
            url: signedUrl?.signedUrl || null,
          };
        })
      );

      enrichedProfiles.push({
        ...profile,
        photos: photosWithUrls,
        prompts: prompts || [],
      });
    }

    // Update last active timestamp
    await supabase.rpc('update_last_active');

    return new Response(
      JSON.stringify({
        profiles: enrichedProfiles,
        has_more: enrichedProfiles.length === limit,
        offset: offset + enrichedProfiles.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating discovery feed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
