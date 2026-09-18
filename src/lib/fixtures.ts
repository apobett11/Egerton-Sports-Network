import { supabase } from './supabase';

export interface FixtureQueryOptions {
  competitionId?: string;
  limit?: number;
  lastScheduledTime?: string;
}

export async function fetchCleanFixtures({
  competitionId,
  limit = 20,
  lastScheduledTime
}: FixtureQueryOptions = {}) {
  let query = supabase
    .from('fixtures')
    .select(`
      id,
      scheduled_time,
      status,
      score_home,
      score_away,
      venue,
      home_team:teams!fixtures_home_team_id_fkey (id, name, logo_url),
      away_team:teams!fixtures_away_team_id_fkey (id, name, logo_url),
      competition:competitions!fixtures_competition_id_fkey (id, name, slug)
    `)
    .order('scheduled_time', { ascending: false })
    .limit(limit);

  if (competitionId && competitionId !== 'all' && competitionId !== 'ALL') {
    query = query.eq('competition_id', competitionId);
  }

  // Cursor-based keyset pagination
  if (lastScheduledTime) {
    query = query.lt('scheduled_time', lastScheduledTime);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DATABASE REST FAILURE]:', error.message, error.details);
    throw new Error(`Database query failed: ${error.message}`);
  }

  return data;
}
