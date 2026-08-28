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
    const roleInput = (body.role || body.type || (body.team_id || body.teamId ? 'player' : '')).toString().trim().toLowerCase();

    if (roleInput === 'player') {
      const {
        teamId,
        team_id = teamId,
        fullName,
        full_name = fullName,
        jerseyNumber,
        jersey_number = jerseyNumber,
        position,
        studentId,
        student_id = studentId,
        phone,
      } = body;

      if (!team_id || !full_name || jersey_number === undefined) {
        return new Response(
          JSON.stringify({ error: 'team_id, fullName, and jerseyNumber are required for player ingestion' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: dbResult, error: dbError } = await supabaseAdmin.rpc('import_player_from_team_sheet', {
        p_team_id: team_id,
        p_full_name: String(full_name).trim(),
        p_jersey_number: parseInt(String(jersey_number), 10),
        p_position: String(position || 'FWD').trim(),
        p_student_id: student_id ? String(student_id).trim() : null,
        p_phone: phone ? String(phone).trim() : null,
      });

      if (dbError) {
        return new Response(
          JSON.stringify({ error: `Database Error: ${dbError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, type: 'player', db_result: dbResult }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (roleInput === 'coach' || roleInput === 'referee') {
      const {
        email,
        fullName,
        full_name = fullName,
        firstName: rawFirstName,
        first_name = rawFirstName,
        lastName: rawLastName,
        last_name = rawLastName,
        phone,
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
          JSON.stringify({ error: 'email is required' }),
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

      const resolvedLeague = league_id || competition_id || league_name || null;

      const { data: dbResult, error: dbError } = await supabaseAdmin.rpc('register_official_and_invite', {
        p_email: cleanEmail,
        p_first_name: firstName,
        p_last_name: lastName,
        p_phone: phone ? String(phone).trim() : null,
        p_role: roleInput,
        p_league_name: resolvedLeague ? String(resolvedLeague).trim() : null,
        p_team_name: team_name ? String(team_name).trim() : null,
        p_badge_number: badge_number ? String(badge_number).trim() : null,
      });

      if (dbError) {
        return new Response(
          JSON.stringify({ error: `Database Error: ${dbError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: cleanEmail,
        options: { redirectTo },
      });

      if (linkError) {
        return new Response(
          JSON.stringify({ error: `Auth Generate Link Error: ${linkError.message}`, dbResult }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          type: roleInput,
          action_link: linkData?.properties?.action_link,
          db_result: dbResult,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: `Invalid role/type '${roleInput}'. Must be 'coach', 'referee', or 'player'` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
