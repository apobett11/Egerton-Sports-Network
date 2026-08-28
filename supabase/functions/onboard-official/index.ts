import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const defaultRedirectUrl = Deno.env.get('APP_REDIRECT_URL') || 'http://localhost:5173/#/auth/reset-password';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server environment missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const {
      email,
      fullName,
      full_name = fullName,
      firstName: rawFirstName,
      first_name = rawFirstName,
      lastName: rawLastName,
      last_name = rawLastName,
      phone,
      role: rawRole = 'coach',
      leagueName,
      league_name = leagueName,
      leagueId,
      league_id = leagueId,
      competitionId,
      competition_id = competitionId,
      teamName,
      team_name = teamName,
      badgeNumber,
      badge_number = badgeNumber,
      redirectTo = defaultRedirectUrl,
    } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const role = String(rawRole).trim().toLowerCase();
    if (!['referee', 'coach'].includes(role)) {
      return new Response(
        JSON.stringify({ error: `Unauthorized official role: ${role}. Must be 'referee' or 'coach'` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let firstName = first_name ? String(first_name).trim() : '';
    let lastName = last_name ? String(last_name).trim() : '';

    if (!firstName && full_name) {
      const parts = String(full_name).trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    const resolvedLeagueIdentifier = league_id || competition_id || league_name || null;

    // 1. Sync Profile & Role with Database via RPC (also auto-inserts referee into public.referees and team into public.teams)
    const { data: dbResult, error: dbError } = await supabaseAdmin.rpc('register_official_and_invite', {
      p_email: cleanEmail,
      p_first_name: firstName,
      p_last_name: lastName,
      p_phone: phone ? String(phone).trim() : null,
      p_role: role,
      p_league_name: resolvedLeagueIdentifier ? String(resolvedLeagueIdentifier).trim() : null,
      p_team_name: team_name ? String(team_name).trim() : null,
      p_badge_number: badge_number ? String(badge_number).trim() : null,
    });

    if (dbError) {
      return new Response(
        JSON.stringify({ error: `Database Error: ${dbError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Generate Single-Use Setup/Magic Link (Invalidates on 1 use)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: cleanEmail,
      options: {
        redirectTo,
      },
    });

    if (linkError) {
      return new Response(
        JSON.stringify({ error: `Auth Generate Link Error: ${linkError.message}`, dbResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const singleUseLink = linkData?.properties?.action_link;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Official ${role.toUpperCase()} registered and assigned successfully.`,
        action_link: singleUseLink,
        db_result: dbResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
