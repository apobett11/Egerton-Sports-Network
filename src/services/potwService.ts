/**
 * Player of the Week (POTW) Core Data & Business Logic Service
 * Egerton Sports Network (ESN)
 */

import { supabase } from '../lib/supabase';
import type {
  MotmNomination,
  PotwCandidate,
  PotwVote,
  PotwWinner,
  PotwWeeklyCycleStatus,
  SubmitMotmParams,
  CastVoteParams,
  AdminAuditOptions,
  AdminAuditResult,
} from '../types/potw';

export const EPL_COMP_ID = '11111111-1111-1111-1111-111111111111';
export const CHAMP_COMP_ID = '22222222-2222-2222-2222-222222222222';

export const ESN_DOMAIN = 'egersports.com';

/**
 * Helper to determine league slug ('epl' | 'champ') from competition ID or name
 */
export function getLeagueSlug(competitionIdOrName: string): 'epl' | 'champ' {
  if (
    competitionIdOrName === EPL_COMP_ID ||
    competitionIdOrName.toLowerCase().includes('premier') ||
    competitionIdOrName.toLowerCase().includes('epl')
  ) {
    return 'epl';
  }
  return 'champ';
}

/**
 * 1. Submit a Man of the Match (MOTM) nomination from referee match reporting
 */
export async function submitMotmNomination(
  params: SubmitMotmParams
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!params.fixtureId || !params.playerId || !params.teamId || !params.competitionId) {
      return { success: false, error: 'Missing required nomination parameters.' };
    }

    const { error } = await supabase
      .from('man_of_the_match_nominations')
      .upsert(
        {
          fixture_id: params.fixtureId,
          player_id: params.playerId,
          team_id: params.teamId,
          competition_id: params.competitionId,
          referee_id: params.refereeId || null,
        },
        { onConflict: 'fixture_id' }
      );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to submit MOTM nomination.' };
  }
}

/**
 * 2. Get active ballot candidates for a competition
 * Groups/condenses weekend MOTM nominations by player UID so each player appears once per ballot.
 */
export async function getActiveBallotCandidates(
  competitionId: string
): Promise<PotwCandidate[]> {
  try {
    // 1. Fetch active nominations
    const { data: nominations, error: nomError } = await supabase
      .from('man_of_the_match_nominations')
      .select('*')
      .eq('competition_id', competitionId)
      .order('created_at', { ascending: false });

    if (nomError || !nominations || nominations.length === 0) {
      return [];
    }

    // 2. Extract referenced IDs for batch fetching
    const fixtureIds = Array.from(new Set(nominations.map((n: any) => n.fixture_id).filter(Boolean)));
    const playerIds = Array.from(new Set(nominations.map((n: any) => n.player_id).filter(Boolean)));
    const teamIds = Array.from(new Set(nominations.map((n: any) => n.team_id).filter(Boolean)));
    const refereeIds = Array.from(new Set(nominations.map((n: any) => n.referee_id).filter(Boolean)));

    // 3. Parallel fetch supporting records
    const [fixturesRes, playersRes, teamsRes, profilesRes, compRes] = await Promise.all([
      supabase.from('fixtures').select('id, matchday, scheduled_time, score_home, score_away, home_team_id, away_team_id').in('id', fixtureIds),
      supabase.from('players').select('id, jersey_number, position, profile_id').in('id', playerIds),
      supabase.from('teams').select('id, name, logo_url').in('id', teamIds),
      supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', [...refereeIds]),
      supabase.from('competitions').select('id, name').eq('id', competitionId).maybeSingle(),
    ]);

    // Fetch player profiles separately
    const playerProfileIds = (playersRes.data || []).map((p: any) => p.profile_id).filter(Boolean);
    const playerProfilesRes = playerProfileIds.length > 0
      ? await supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', playerProfileIds)
      : { data: [] };

    // Also fetch opponent team names for fixtures
    const allFixtureTeamIds = new Set<string>();
    (fixturesRes.data || []).forEach((f: any) => {
      if (f.home_team_id) allFixtureTeamIds.add(f.home_team_id);
      if (f.away_team_id) allFixtureTeamIds.add(f.away_team_id);
    });
    const allTeamsRes = allFixtureTeamIds.size > 0
      ? await supabase.from('teams').select('id, name, logo_url').in('id', Array.from(allFixtureTeamIds))
      : { data: [] };

    // Build lookup maps
    const fixtureMap = new Map((fixturesRes.data || []).map((f: any) => [f.id, f]));
    const playerMap = new Map((playersRes.data || []).map((p: any) => [p.id, p]));
    const teamMap = new Map((allTeamsRes.data || []).map((t: any) => [t.id, t]));
    const profileMap = new Map([...(profilesRes.data || []), ...(playerProfilesRes.data || [])].map((pr: any) => [pr.id, pr]));

    const competitionName = compRes.data?.name || (competitionId === EPL_COMP_ID ? 'Egerton Premier League' : 'Egerton Championship');

    // 4. Condense by player UID: each player appears exactly once on the ballot
    const candidateMap = new Map<string, PotwCandidate>();

    for (const nom of nominations) {
      const player = playerMap.get(nom.player_id);
      const playerProfile = player?.profile_id ? profileMap.get(player.profile_id) : null;
      const team = teamMap.get(nom.team_id);
      const fixture = fixtureMap.get(nom.fixture_id);
      const referee = nom.referee_id ? profileMap.get(nom.referee_id) : null;

      const playerName = playerProfile
        ? `${playerProfile.first_name || ''} ${playerProfile.last_name || ''}`.trim()
        : 'Player';

      const homeTeam = fixture ? teamMap.get(fixture.home_team_id) : null;
      const awayTeam = fixture ? teamMap.get(fixture.away_team_id) : null;

      let matchDetail = 'Weekend Match';
      if (homeTeam && awayTeam) {
        if (fixture.score_home != null && fixture.score_away != null) {
          matchDetail = `${homeTeam.name} ${fixture.score_home} - ${fixture.score_away} ${awayTeam.name}`;
        } else {
          matchDetail = `${homeTeam.name} vs ${awayTeam.name}`;
        }
      }

      if (candidateMap.has(nom.player_id)) {
        // Player already has an entry; append additional match context if different
        const existing = candidateMap.get(nom.player_id)!;
        if (!existing.match_details.includes(matchDetail)) {
          existing.match_details = `${existing.match_details} • ${matchDetail}`;
        }
      } else {
        candidateMap.set(nom.player_id, {
          player_id: nom.player_id,
          player_name: playerName,
          jersey_number: player?.jersey_number ?? undefined,
          position: player?.position ?? undefined,
          team_id: nom.team_id,
          team_name: team?.name || 'Campus Team',
          team_logo: team?.logo_url || undefined,
          competition_id: nom.competition_id,
          competition_name: competitionName,
          fixture_id: nom.fixture_id,
          match_details: matchDetail,
          match_date: fixture?.scheduled_time || nom.created_at,
          referee_name: referee ? `${referee.first_name || ''} ${referee.last_name || ''}`.trim() : undefined,
        });
      }
    }

    return Array.from(candidateMap.values());
  } catch (err) {
    console.error('Error in getActiveBallotCandidates:', err);
    return [];
  }
}

/**
 * 3. Check if a device has already cast a vote for a given league and matchweek
 * Strictly enforces 1 device = 1 vote per league per matchweek.
 */
export async function hasDeviceVoted(
  deviceId: string,
  competitionId: string,
  matchweek: number
): Promise<boolean> {
  if (!deviceId || !competitionId) return false;

  try {
    // 1. Try secure stored procedure first
    const { data: rpcResult, error: rpcError } = await supabase.rpc('has_device_voted_potw', {
      p_device_id: deviceId,
      p_competition_id: competitionId,
      p_matchweek: matchweek,
    });

    if (!rpcError && typeof rpcResult === 'boolean') {
      return rpcResult;
    }

    // 2. Direct query fallback
    const { data, error } = await supabase
      .from('player_of_the_week_votes')
      .select('id')
      .eq('device_id', deviceId)
      .eq('competition_id', competitionId)
      .eq('matchweek', matchweek)
      .maybeSingle();

    if (error) {
      // If RLS blocked reading, assume false to not lock out user
      return false;
    }

    return Boolean(data);
  } catch {
    return false;
  }
}

/**
 * 4. Cast a vote for a Player of the Week candidate
 * Strictly validates device_id and handles unique constraint violations gracefully.
 */
export async function castVote(
  params: CastVoteParams
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!params.deviceId || !params.playerId || !params.competitionId) {
      return { success: false, error: 'Missing required voting parameters.' };
    }

    // Double-check already voted state
    const alreadyVoted = await hasDeviceVoted(params.deviceId, params.competitionId, params.matchweek);
    if (alreadyVoted) {
      return {
        success: false,
        error: `This device has already cast a vote in this league for matchweek ${params.matchweek}.`,
      };
    }

    const { error: insertError } = await supabase
      .from('player_of_the_week_votes')
      .insert({
        device_id: params.deviceId,
        player_id: params.playerId,
        competition_id: params.competitionId,
        matchweek: params.matchweek,
      });

    if (insertError) {
      if (
        insertError.code === '23505' ||
        insertError.message?.includes('duplicate') ||
        insertError.message?.includes('unique')
      ) {
        return {
          success: false,
          error: `This device has already cast a vote in this league for matchweek ${params.matchweek}.`,
        };
      }
      return {
        success: false,
        error: insertError.message || 'Failed to submit vote. Please try again.',
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred while casting vote.',
    };
  }
}

/**
 * 5. Get current active winner for a competition
 */
export async function getCurrentWinner(competitionId: string): Promise<PotwWinner | null> {
  try {
    const { data, error } = await supabase
      .from('player_of_the_week_winners')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('status', 'ACTIVE')
      .order('awarded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      player_id: data.player_id,
      player_name: data.player_name || 'Official Winner',
      team_id: data.team_id,
      team_name: data.team_name || 'Campus Team',
      team_logo: data.team_logo || undefined,
      competition_id: data.competition_id,
      competition_name:
        data.competition_id === EPL_COMP_ID ? 'Egerton Premier League' : 'Egerton Championship',
      matchweek: data.matchweek,
      season_id: data.season_id || undefined,
      vote_count: data.vote_count || 0,
      vote_share_percentage: Number(data.vote_share_percentage) || 0,
      awarded_at: data.awarded_at,
      stats_summary: data.stats_summary,
      status: data.status,
    };
  } catch {
    return null;
  }
}

/**
 * 6. Get all historical winners for a competition
 */
export async function getHistoricalWinners(competitionId: string): Promise<PotwWinner[]> {
  try {
    const { data, error } = await supabase
      .from('player_of_the_week_winners')
      .select('*')
      .eq('competition_id', competitionId)
      .order('matchweek', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      player_id: d.player_id,
      player_name: d.player_name || 'Official Winner',
      team_id: d.team_id,
      team_name: d.team_name || 'Campus Team',
      team_logo: d.team_logo || undefined,
      competition_id: d.competition_id,
      competition_name:
        d.competition_id === EPL_COMP_ID ? 'Egerton Premier League' : 'Egerton Championship',
      matchweek: d.matchweek,
      season_id: d.season_id || undefined,
      vote_count: d.vote_count || 0,
      vote_share_percentage: Number(d.vote_share_percentage) || 0,
      awarded_at: d.awarded_at,
      stats_summary: d.stats_summary,
      status: d.status,
    }));
  } catch {
    return [];
  }
}

/**
 * 7. Admin transparency audit: Unvarnished vote tallies with server-side pagination & sorting
 */
export async function getAdminAuditVotes(
  competitionId: string,
  matchweek: number,
  options: AdminAuditOptions
): Promise<AdminAuditResult> {
  try {
    // 1. Fetch raw votes for this league & matchweek
    const { data: rawVotes, error: votesError } = await supabase
      .from('player_of_the_week_votes')
      .select('id, player_id, device_id, created_at')
      .eq('competition_id', competitionId)
      .eq('matchweek', matchweek);

    if (votesError) {
      console.error('Error fetching admin votes:', votesError);
    }

    const votes = rawVotes || [];
    const totalVotes = votes.length;

    // Tally votes by player_id
    const tallies = new Map<string, number>();
    votes.forEach((v: any) => {
      tallies.set(v.player_id, (tallies.get(v.player_id) || 0) + 1);
    });

    // 2. Fetch all candidates (active or historical nominees)
    const candidates = await getActiveBallotCandidates(competitionId);

    // Decorate candidates with unvarnished vote tallies
    const decoratedCandidates: PotwCandidate[] = candidates.map((c) => {
      const count = tallies.get(c.player_id) || 0;
      const share = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(1)) : 0;
      return {
        ...c,
        votes_count: count,
        vote_share_percentage: share,
      };
    });

    // 3. Filter by search query if provided
    let filtered = decoratedCandidates;
    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.player_name.toLowerCase().includes(q) ||
          c.team_name.toLowerCase().includes(q)
      );
    }

    // 4. Sort
    const sortBy = options.sortBy || 'votes';
    const sortDir = options.sortDir || 'desc';

    filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortBy === 'votes') {
        valA = a.votes_count || 0;
        valB = b.votes_count || 0;
      } else if (sortBy === 'name') {
        valA = a.player_name.toLowerCase();
        valB = b.player_name.toLowerCase();
      } else if (sortBy === 'team') {
        valA = a.team_name.toLowerCase();
        valB = b.team_name.toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // 5. Paginate
    const totalCandidates = filtered.length;
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, options.pageSize || 10);
    const totalPages = Math.max(1, Math.ceil(totalCandidates / pageSize));

    const startIndex = (page - 1) * pageSize;
    const paginatedCandidates = filtered.slice(startIndex, startIndex + pageSize);

    return {
      candidates: paginatedCandidates,
      totalVotes,
      totalCandidates,
      page,
      pageSize,
      totalPages,
    };
  } catch (err) {
    console.error('Error in getAdminAuditVotes:', err);
    return {
      candidates: [],
      totalVotes: 0,
      totalCandidates: 0,
      page: 1,
      pageSize: options.pageSize || 10,
      totalPages: 1,
    };
  }
}

/**
 * 8. Build WhatsApp viral share URL with deep link and egersports.com branding
 */
export function buildWhatsAppShareUrl(candidate: PotwCandidate): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : `https://${ESN_DOMAIN}`;
  const league = getLeagueSlug(candidate.competition_id || candidate.competition_name);
  const deepLink = `${origin}/?potw_player=${encodeURIComponent(candidate.player_id)}&league=${league}`;

  const message = `🔥 VOTE FOR PLAYER OF THE WEEK! ⚽⭐

I just backed ${candidate.player_name} (${candidate.team_name}) in the ${candidate.competition_name} Player of the Week awards on Egerton Sports Network!

Match: ${candidate.match_details}

👉 Tap here to cast your vote now:
${deepLink}

⚡ Egerton Sports Network (${ESN_DOMAIN})
📢 Live campus scores, verified match statistics & standings on ${ESN_DOMAIN}!`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * 9. Build Monday Admin Mystery Teaser for WhatsApp
 * Reveals the leading team while concealing the player identity.
 */
export function buildMondayMysteryTeaser(
  leadingTeamName: string,
  competitionName: string
): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : `https://${ESN_DOMAIN}`;
  const league = getLeagueSlug(competitionName);
  const votingUrl = `${origin}/?potw=true&league=${league}`;

  return `🚨 POTW VOTING LEADERBOARD UPDATE! 🚨

The race for Player of the Week is heating up! 🔥

In the ${competitionName}, a star player from ${leadingTeamName} is currently leading the fan vote! 🏆👀

Who is it? [Player Name Concealed: ████████]

Can your squad turn the tide before the deadline?
⏰ Voting closes TUESDAY at 5:00 PM!

👉 Cast your vote now and back your player:
${votingUrl}

⚡ Egerton Sports Network (${ESN_DOMAIN}) — The heartbeat of campus football.
📢 Don't miss Tuesday 5:00 PM when the official winner is crowned!`;
}

/**
 * Helper to get WhatsApp URL for Monday Mystery Teaser
 */
export function buildMondayMysteryTeaserUrl(
  leadingTeamName: string,
  competitionName: string
): string {
  const teaser = buildMondayMysteryTeaser(leadingTeamName, competitionName);
  return `https://wa.me/?text=${encodeURIComponent(teaser)}`;
}

/**
 * 10. Weekly Lifecycle status helper (East Africa Time: UTC+3)
 * Voting Closes: Tuesday 5:00 PM EAT
 * Table Reset: Friday 11:00 AM EAT
 */
export function getWeeklyCycleStatus(overrideMatchweek?: number): PotwWeeklyCycleStatus {
  const now = new Date();
  // Convert current UTC time to East Africa Time (UTC+3)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const eatNow = new Date(utcMs + 3 * 3600000);

  const dayOfWeek = eatNow.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, ..., 5 = Fri, 6 = Sat
  const hour = eatNow.getHours();
  const minutes = eatNow.getMinutes();

  // Voting is open from Friday 11:00 AM EAT until Tuesday 5:00 PM (17:00) EAT
  let isVotingOpen = false;
  let stage: 'VOTING_ACTIVE' | 'RESULTS_ANNOUNCED' | 'MAINTENANCE_RESET' = 'RESULTS_ANNOUNCED';

  if (dayOfWeek === 5) {
    // Friday
    if (hour >= 11) {
      isVotingOpen = true;
      stage = 'VOTING_ACTIVE';
    } else {
      isVotingOpen = false;
      stage = 'MAINTENANCE_RESET';
    }
  } else if (dayOfWeek === 6 || dayOfWeek === 0 || dayOfWeek === 1) {
    // Saturday, Sunday, Monday
    isVotingOpen = true;
    stage = 'VOTING_ACTIVE';
  } else if (dayOfWeek === 2) {
    // Tuesday
    if (hour < 17) {
      isVotingOpen = true;
      stage = 'VOTING_ACTIVE';
    } else {
      isVotingOpen = false;
      stage = 'RESULTS_ANNOUNCED';
    }
  } else {
    // Wednesday, Thursday
    isVotingOpen = false;
    stage = 'RESULTS_ANNOUNCED';
  }

  // Next transition target
  let targetTransition: Date;

  if (isVotingOpen) {
    // Target is Tuesday 17:00 EAT
    targetTransition = new Date(eatNow);
    const daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
    targetTransition.setDate(eatNow.getDate() + (daysUntilTuesday === 0 && hour >= 17 ? 7 : daysUntilTuesday));
    targetTransition.setHours(17, 0, 0, 0);
  } else {
    // Target is Friday 11:00 EAT
    targetTransition = new Date(eatNow);
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    targetTransition.setDate(eatNow.getDate() + (daysUntilFriday === 0 && hour >= 11 ? 7 : daysUntilFriday));
    targetTransition.setHours(11, 0, 0, 0);
  }

  const diffMs = Math.max(0, targetTransition.getTime() - eatNow.getTime());
  const timeRemainingSeconds = Math.floor(diffMs / 1000);

  return {
    stage,
    matchweek: overrideMatchweek || 1,
    votingClosesAt: 'Tuesday 5:00 PM EAT',
    resetAt: 'Friday 11:00 AM EAT',
    isVotingOpen,
    timeRemainingSeconds,
  };
}
