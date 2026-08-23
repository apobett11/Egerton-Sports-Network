// Supabase Edge Function: process-match-statistics
// Deno runtime - Processes Algorithm 2 (Standings, Team Form, Player Stats)
// Triggered on referee finalization / permanent match updates using match_id and league_id.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface RequestPayload {
  fixture_id: string;
  competition_id?: string;
  trigger_source?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: RequestPayload = await req.json();
    const { fixture_id, trigger_source } = payload;

    if (!fixture_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'fixture_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Fetch Fixture Details
    const { data: fixture, error: fixError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('id', fixture_id)
      .single();

    if (fixError || !fixture) {
      return new Response(
        JSON.stringify({ success: false, error: `Fixture ${fixture_id} not found: ${fixError?.message}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency check: Never process twice
    if (fixture.stats_processed === true) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Statistics for match ${fixture_id} were already processed (idempotent no-op).`,
          stats_processed: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const competitionId = payload.competition_id || fixture.competition_id;
    const homeTeamId = fixture.home_team_id;
    const awayTeamId = fixture.away_team_id;
    const scoreHome = fixture.score_home ?? 0;
    const scoreAway = fixture.score_away ?? 0;

    // Concurrency Lock on Competition row if present
    if (competitionId) {
      await supabase
        .from('competitions')
        .select('id')
        .eq('id', competitionId)
        .single();
    }

    // Determine Match Outcome Math
    let homeWon = 0, homeDrawn = 0, homeLost = 0;
    let awayWon = 0, awayDrawn = 0, awayLost = 0;
    let homePoints = 0, awayPoints = 0;
    let homeResult = 'D', awayResult = 'D';

    if (scoreHome > scoreAway) {
      homeWon = 1; awayLost = 1;
      homePoints = 3; awayPoints = 0;
      homeResult = 'W'; awayResult = 'L';
    } else if (scoreHome < scoreAway) {
      homeLost = 1; awayWon = 1;
      homePoints = 0; awayPoints = 3;
      homeResult = 'L'; awayResult = 'W';
    } else {
      homeDrawn = 1; awayDrawn = 1;
      homePoints = 1; awayPoints = 1;
      homeResult = 'D'; awayResult = 'D';
    }

    const executionLog = {
      moduleA: 'PENDING',
      moduleB: 'PENDING',
      moduleC: 'PENDING',
      errors: [] as string[],
    };

    // ==========================================
    // MODULE A: LEAGUE STANDINGS
    // ==========================================
    try {
      if (competitionId && homeTeamId && awayTeamId) {
        // Fetch current home standing
        const { data: homeStanding } = await supabase
          .from('league_standings')
          .select('*')
          .eq('team_id', homeTeamId)
          .eq('competition_id', competitionId)
          .maybeSingle();

        const newHomePlayed = (homeStanding?.played || 0) + 1;
        const newHomeWon = (homeStanding?.won || 0) + homeWon;
        const newHomeDrawn = (homeStanding?.drawn || 0) + homeDrawn;
        const newHomeLost = (homeStanding?.lost || 0) + homeLost;
        const newHomeGF = (homeStanding?.goals_for || 0) + scoreHome;
        const newHomeGA = (homeStanding?.goals_against || 0) + scoreAway;
        const newHomeGD = (homeStanding?.goal_difference || 0) + (scoreHome - scoreAway);
        const newHomePts = (homeStanding?.points || 0) + homePoints;

        await supabase.from('league_standings').upsert({
          team_id: homeTeamId,
          competition_id: competitionId,
          played: newHomePlayed,
          won: newHomeWon,
          drawn: newHomeDrawn,
          lost: newHomeLost,
          goals_for: newHomeGF,
          goals_against: newHomeGA,
          goal_difference: newHomeGD,
          points: newHomePts,
          last_updated: new Date().toISOString(),
        });

        // Fetch current away standing
        const { data: awayStanding } = await supabase
          .from('league_standings')
          .select('*')
          .eq('team_id', awayTeamId)
          .eq('competition_id', competitionId)
          .maybeSingle();

        const newAwayPlayed = (awayStanding?.played || 0) + 1;
        const newAwayWon = (awayStanding?.won || 0) + awayWon;
        const newAwayDrawn = (awayStanding?.drawn || 0) + awayDrawn;
        const newAwayLost = (awayStanding?.lost || 0) + awayLost;
        const newAwayGF = (awayStanding?.goals_for || 0) + scoreAway;
        const newAwayGA = (awayStanding?.goals_against || 0) + scoreHome;
        const newAwayGD = (awayStanding?.goal_difference || 0) + (scoreAway - scoreHome);
        const newAwayPts = (awayStanding?.points || 0) + awayPoints;

        await supabase.from('league_standings').upsert({
          team_id: awayTeamId,
          competition_id: competitionId,
          played: newAwayPlayed,
          won: newAwayWon,
          drawn: newAwayDrawn,
          lost: newAwayLost,
          goals_for: newAwayGF,
          goals_against: newAwayGA,
          goal_difference: newAwayGD,
          points: newAwayPts,
          last_updated: new Date().toISOString(),
        });

        executionLog.moduleA = 'COMMITTED';
      }
    } catch (err: any) {
      executionLog.moduleA = 'FAILED';
      executionLog.errors.push(`Module A Error: ${err?.message}`);
      await supabase.from('admin_error_logs').insert({
        fixture_id,
        module_name: 'MODULE_A_STANDINGS',
        error_message: err?.message || String(err),
      });
    }

    // ==========================================
    // MODULE B: TEAM FORM (Last 5 FIFO)
    // ==========================================
    try {
      if (homeTeamId) {
        const { data: homeForm } = await supabase
          .from('team_form')
          .select('*')
          .eq('team_id', homeTeamId)
          .maybeSingle();

        const prevHomeResults: string[] = homeForm?.latest_results || [];
        const nextHomeResults = [...prevHomeResults, homeResult].slice(-5);

        await supabase.from('team_form').upsert({
          team_id: homeTeamId,
          competition_id: competitionId,
          latest_results: nextHomeResults,
          last_updated: new Date().toISOString(),
        });
      }

      if (awayTeamId) {
        const { data: awayForm } = await supabase
          .from('team_form')
          .select('*')
          .eq('team_id', awayTeamId)
          .maybeSingle();

        const prevAwayResults: string[] = awayForm?.latest_results || [];
        const nextAwayResults = [...prevAwayResults, awayResult].slice(-5);

        await supabase.from('team_form').upsert({
          team_id: awayTeamId,
          competition_id: competitionId,
          latest_results: nextAwayResults,
          last_updated: new Date().toISOString(),
        });
      }

      executionLog.moduleB = 'COMMITTED';
    } catch (err: any) {
      executionLog.moduleB = 'FAILED';
      executionLog.errors.push(`Module B Error: ${err?.message}`);
      await supabase.from('admin_error_logs').insert({
        fixture_id,
        module_name: 'MODULE_B_FORM',
        error_message: err?.message || String(err),
      });
    }

    // ==========================================
    // MODULE C: PLAYER STATS (Goals, Assists, Clean Sheets)
    // ==========================================
    try {
      if (competitionId) {
        // 1. Fetch official match events from match_events or canonical_permanent_results
        const { data: events } = await supabase
          .from('match_events')
          .select('*')
          .eq('fixture_id', fixture_id);

        const goalEvents = (events || []).filter(
          (e: any) =>
            (e.is_official === true || e.is_official === null) &&
            ['goal', 'penalty'].includes(String(e.type).toLowerCase()) &&
            e.player_id
        );

        // Group goals by player
        const playerGoalMap = new Map<string, number>();
        const playerAssistMap = new Map<string, number>();

        for (const ev of goalEvents) {
          if (ev.player_id) {
            playerGoalMap.set(ev.player_id, (playerGoalMap.get(ev.player_id) || 0) + 1);
          }
          if (ev.assist_player_id) {
            playerAssistMap.set(ev.assist_player_id, (playerAssistMap.get(ev.assist_player_id) || 0) + 1);
          }
        }

        // Upsert player goals
        for (const [playerId, count] of playerGoalMap.entries()) {
          const { data: currentStats } = await supabase
            .from('player_stats')
            .select('*')
            .eq('player_id', playerId)
            .eq('competition_id', competitionId)
            .maybeSingle();

          await supabase.from('player_stats').upsert({
            player_id: playerId,
            competition_id: competitionId,
            goals: (currentStats?.goals || 0) + count,
            assists: currentStats?.assists || 0,
            clean_sheets: currentStats?.clean_sheets || 0,
            last_updated: new Date().toISOString(),
          });
        }

        // Upsert player assists
        for (const [playerId, count] of playerAssistMap.entries()) {
          const { data: currentStats } = await supabase
            .from('player_stats')
            .select('*')
            .eq('player_id', playerId)
            .eq('competition_id', competitionId)
            .maybeSingle();

          await supabase.from('player_stats').upsert({
            player_id: playerId,
            competition_id: competitionId,
            goals: currentStats?.goals || 0,
            assists: (currentStats?.assists || 0) + count,
            clean_sheets: currentStats?.clean_sheets || 0,
            last_updated: new Date().toISOString(),
          });
        }

        // Clean sheets for Goalkeepers
        if (scoreAway === 0 && homeTeamId) {
          const { data: homeGk } = await supabase
            .from('players')
            .select('id')
            .eq('team_id', homeTeamId)
            .eq('position', 'GK')
            .maybeSingle();

          if (homeGk?.id) {
            const { data: currentStats } = await supabase
              .from('player_stats')
              .select('*')
              .eq('player_id', homeGk.id)
              .eq('competition_id', competitionId)
              .maybeSingle();

            await supabase.from('player_stats').upsert({
              player_id: homeGk.id,
              competition_id: competitionId,
              goals: currentStats?.goals || 0,
              assists: currentStats?.assists || 0,
              clean_sheets: (currentStats?.clean_sheets || 0) + 1,
              last_updated: new Date().toISOString(),
            });
          }
        }

        if (scoreHome === 0 && awayTeamId) {
          const { data: awayGk } = await supabase
            .from('players')
            .select('id')
            .eq('team_id', awayTeamId)
            .eq('position', 'GK')
            .maybeSingle();

          if (awayGk?.id) {
            const { data: currentStats } = await supabase
              .from('player_stats')
              .select('*')
              .eq('player_id', awayGk.id)
              .eq('competition_id', competitionId)
              .maybeSingle();

            await supabase.from('player_stats').upsert({
              player_id: awayGk.id,
              competition_id: competitionId,
              goals: currentStats?.goals || 0,
              assists: currentStats?.assists || 0,
              clean_sheets: (currentStats?.clean_sheets || 0) + 1,
              last_updated: new Date().toISOString(),
            });
          }
        }
      }

      executionLog.moduleC = 'COMMITTED';
    } catch (err: any) {
      executionLog.moduleC = 'FAILED';
      executionLog.errors.push(`Module C Error: ${err?.message}`);
      await supabase.from('admin_error_logs').insert({
        fixture_id,
        module_name: 'MODULE_C_PLAYER_STATS',
        error_message: err?.message || String(err),
      });
    }

    // Mark fixture stats_processed as true
    await supabase
      .from('fixtures')
      .update({ stats_processed: true })
      .eq('id', fixture_id);

    return new Response(
      JSON.stringify({
        success: true,
        fixture_id,
        competition_id: competitionId,
        executionLog,
        trigger_source: trigger_source || 'EDGE_FUNCTION_API',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
