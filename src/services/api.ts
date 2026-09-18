import { supabase } from '../lib/supabase';
import type { 
  Match, 
  LeagueTableEntry, 
  HistoricalSeasonStandings,
  NewsItem, 
  Announcement, 
  MatchReport, 
  SquadRequest, 
  AuditLog,
  MatchEvent,
  MatchEventType,
  MatchStatus,
  ApiResponse,
  Player,
  PlayerPosition
} from '../types';
import { calculateLeagueStandings } from '../lib/leagueEngine';
import { executeWithRetry } from '../lib/retryPolicy';
import { logger } from '../lib/logger';
import { classifyError } from '../lib/apiErrorHandler';
import { sanitizeHtmlText } from '../lib/storageUtils';
import { guestCache } from '../lib/guestCache';
import { formatMatchTime } from '../lib/matchdayHelper';
import { FORMATION_CONFIGS } from '../components/Dashboards/Team/components/Squad/TeamSquadView';

// Helper for unwrapping Supabase joins (object vs 1-element array)
const unwrap = (val: any) => (Array.isArray(val) ? val[0] : val);

// In-Memory Session Cache for static data deduplication
let cachedTeams: any[] | null = null;
let cachedLeagues: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 1 minute TTL

// Rapid-access in-memory caches for high-frequency queries
const teamFormCache = new Map<string, { timestamp: number; data: Array<{ result: 'W' | 'D' | 'L'; label: string }> }>();
const leagueTableCache = new Map<string, { timestamp: number; data: LeagueTableEntry[] }>();

export const ApiService = {
  // Clear in-memory and guest cache when data changes
  invalidateCache(category?: string): void {
    cachedTeams = null;
    cachedLeagues = null;
    cacheTimestamp = 0;
    teamFormCache.clear();
    leagueTableCache.clear();
    if (category) {
      guestCache.invalidate(category);
    } else {
      guestCache.invalidate('fixtures');
      guestCache.invalidate('standings');
      guestCache.invalidate('teams');
      guestCache.invalidate('news');
      guestCache.invalidate('announcements');
      guestCache.invalidate('match_details');
      guestCache.invalidate('performance');
      guestCache.invalidate('milestones');
      guestCache.invalidate('audit_logs');
      guestCache.invalidate('seasons');
      guestCache.invalidate('leagues');
      guestCache.invalidate('referees');
    }
  },

  // --- FIXTURES ---
  async getFixtures(competitionId?: string, selectedDate?: string, page?: number, pageSize?: number): Promise<ApiResponse<Match[]> & { total?: number; page?: number; totalPages?: number }> {
    const cacheKey = `${competitionId || 'all'}_${selectedDate || 'all'}_p${page || 'all'}_s${pageSize || 'all'}`;
    const cached = guestCache.get<Match[]>('fixtures', cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    // Instant extraction from master cache if available (zero-latency guest experience)
    if (!page && !pageSize) {
      const allCached = guestCache.get<Match[]>('fixtures', 'all_all_pall_sall');
      if (allCached && allCached.length > 0) {
        let filtered = allCached;
        if (competitionId && competitionId !== 'all') {
          if (competitionId === '11111111-1111-1111-1111-111111111111') {
            filtered = filtered.filter(m => m.league?.toLowerCase().includes('premier') || !m.league?.toLowerCase().includes('championship'));
          } else if (competitionId === '22222222-2222-2222-2222-222222222222') {
            filtered = filtered.filter(m => m.league?.toLowerCase().includes('championship'));
          } else if (competitionId === 'friendlies') {
            filtered = filtered.filter(m => m.league?.toLowerCase().includes('friendly'));
          }
        }
        if (selectedDate && selectedDate !== 'all') {
          const targetDateStr = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
            ? selectedDate
            : new Date(selectedDate).toISOString().split('T')[0];
          filtered = filtered.filter(m => {
            const raw = m.scheduledTime || (m as any).scheduled_time;
            if (!raw) return false;
            const d = new Date(raw);
            if (isNaN(d.getTime())) return false;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return key === targetDateStr;
          });
        }
        guestCache.set('fixtures', cacheKey, filtered);
        return { success: true, data: filtered, total: filtered.length };
      }
    }

    try {
      // Delegate to guestSportsService for reliable batch queries without FK constraint hint issues
      const { getGuestFixtures, guestFixtureToMatch } = await import('./guestSportsService');
      const guestFixtures = await getGuestFixtures({ competitionId, date: selectedDate });
      const formattedMatches: Match[] = guestFixtures.map(guestFixtureToMatch);
      guestCache.set('fixtures', cacheKey, formattedMatches);
      if ((!competitionId || competitionId === 'all') && (!selectedDate || selectedDate === 'all') && !page && !pageSize) {
        guestCache.set('fixtures', 'all_all_pall_sall', formattedMatches);
      }
      return { success: true, data: formattedMatches, total: formattedMatches.length };
    } catch (err) {
      logger.warn('Failed to fetch fixtures from Supabase.', { error: err });
      return { success: true, data: [] };
    }
  },

  // --- MATCH DETAILS (FETCH COMPLETE MATCH RECORD FROM DB) ---
  async getMatchDetails(fixtureId: string): Promise<ApiResponse<Match>> {
    if (!fixtureId) {
      return { success: false, data: null, message: 'Fixture ID is required.' };
    }

    const cached = guestCache.get<Match>('match_details', fixtureId);
    if (cached && cached.lineups?.teamA && cached.lineups.teamA.length > 0) return { success: true, data: cached };

    try {
      const { data: f, error: fixErr } = await supabase
        .from('fixtures')
        .select(`
          id,
          status,
          scheduled_time,
          score_home,
          score_away,
          venue,
          matchday,
          attendance,
          weather,
          added_time,
          home_penalty_score,
          away_penalty_score,
          referee_id,
          assistant_referee_1_id,
          assistant_referee_2_id,
          fourth_official_id,
          verified_by_referee_id,
          competition:competitions(id, name, season),
          team_home:teams!fixtures_home_team_id_fkey(id, name, short_name, logo_url, color_code, coach_id, captain_id, starting_xi_str, substitutes_str, tactics_config, temporary_match_squad, kits_config),
          team_away:teams!fixtures_away_team_id_fkey(id, name, short_name, logo_url, color_code, coach_id, captain_id, starting_xi_str, substitutes_str, tactics_config, temporary_match_squad, kits_config)
        `)
        .eq('id', fixtureId)
        .single();

      if (fixErr || !f) {
        return { success: false, data: null, message: 'Match not found.' };
      }

      const comp = unwrap(f.competition);
      const home = unwrap(f.team_home);
      const away = unwrap(f.team_away);

      // Cleanly resolve official profiles in batch without brittle schema relations
      const officialIds = [
        f.referee_id,
        f.assistant_referee_1_id,
        f.assistant_referee_2_id,
        f.fourth_official_id
      ].filter((id): id is string => Boolean(id && typeof id === 'string'));

      const officialProfilesMap = new Map<string, { first_name: string; last_name: string }>();
      if (officialIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', officialIds);
        (profs || []).forEach((p: any) => officialProfilesMap.set(p.id, p));
      }

      const refProf = f.referee_id ? officialProfilesMap.get(f.referee_id) : null;
      const ar1Prof = f.assistant_referee_1_id ? officialProfilesMap.get(f.assistant_referee_1_id) : null;
      const ar2Prof = f.assistant_referee_2_id ? officialProfilesMap.get(f.assistant_referee_2_id) : null;
      const foProf = f.fourth_official_id ? officialProfilesMap.get(f.fourth_official_id) : null;

      // Helper to normalize player positions
      const normalizePos = (pos?: string, defaultPos: 'GK' | 'DEF' | 'MID' | 'FWD' = 'MID'): 'GK' | 'DEF' | 'MID' | 'FWD' => {
        if (!pos) return defaultPos;
        const p = pos.toUpperCase();
        if (p.includes('GK') || p.includes('GOAL')) return 'GK';
        if (p.includes('DEF') || p.includes('BACK') || p.includes('CB') || p.includes('LB') || p.includes('RB')) return 'DEF';
        if (p.includes('MID') || p.includes('CM') || p.includes('DM') || p.includes('AM')) return 'MID';
        if (p.includes('FWD') || p.includes('ATT') || p.includes('STR') || p.includes('ST') || p.includes('WING')) return 'FWD';
        return defaultPos;
      };

      // Fetch Stored Match Events
      const { data: eventsData } = await supabase
        .from('match_events')
        .select('id, fixture_id, minute, type, event_target, team_id, player_id, assist_player_id, detail_text, is_official, created_at')
        .eq('fixture_id', fixtureId)
        .order('minute', { ascending: true });

      let events: MatchEvent[] = (eventsData || []).map((e: any) => ({
        id: e.id,
        fixtureId: e.fixture_id,
        minute: e.minute,
        type: e.type as MatchEventType,
        eventTarget: e.event_target || (e.team_id === home?.id ? 'home' : 'away'),
        teamId: e.team_id,
        playerId: e.player_id,
        assistPlayerId: e.assist_player_id,
        detailText: sanitizeHtmlText(e.detail_text),
        isOfficial: e.is_official,
        createdAt: e.created_at
      }));

      // If match_events has no events, fallback to match_live_events table
      if (events.length === 0) {
        const { data: liveEvents } = await supabase
          .from('match_live_events')
          .select('event_uid, match_uid, minute, type, team_uid, player_uid, goal_type, card_type, occurred_at')
          .eq('match_uid', fixtureId)
          .order('minute', { ascending: true });

        if (liveEvents && liveEvents.length > 0) {
          events = liveEvents.map((le: any) => ({
            id: le.event_uid,
            fixtureId: le.match_uid,
            minute: le.minute || 0,
            type: (le.type ? le.type.toLowerCase() : 'goal') as MatchEventType,
            eventTarget: le.team_uid === home?.id ? 'home' : 'away',
            teamId: le.team_uid,
            playerId: le.player_uid,
            detailText: sanitizeHtmlText(le.goal_type || le.card_type || le.type || 'Event'),
            createdAt: le.occurred_at
          }));
        }
      }

      // Fetch Stored Match Lineups
      const { data: lineupsData } = await supabase
        .from('match_lineups')
        .select('id, fixture_id, team_id, formation, starting_xi, substitutes, captain_notes')
        .eq('fixture_id', fixtureId);

      // Fetch all registered players for both teams from the database
      const [squadARes, squadBRes] = await Promise.all([
        home?.id
          ? supabase
              .from('players')
              .select('id, jersey_number, position, first_name, last_name, profile_id, profile:profiles!profile_id(first_name, last_name, role)')
              .eq('team_id', home.id)
              .order('jersey_number', { ascending: true })
          : Promise.resolve({ data: [] }),
        away?.id
          ? supabase
              .from('players')
              .select('id, jersey_number, position, first_name, last_name, profile_id, profile:profiles!profile_id(first_name, last_name, role)')
              .eq('team_id', away.id)
              .order('jersey_number', { ascending: true })
          : Promise.resolve({ data: [] })
      ]);

      // Helper to cleanly extract formation slots honoring coach's tactical formation
      const getFormationSlots = (formationName?: string) => {
        if (!formationName) return FORMATION_CONFIGS['4-3-3'].slots;
        const key = formationName.trim().split(' ')[0] as keyof typeof FORMATION_CONFIGS;
        return FORMATION_CONFIGS[key]?.slots || FORMATION_CONFIGS['4-3-3'].slots;
      };

      // Coach-selected in-match roles for each team
      const coachRolesA = home?.tactics_config?.roles || 
                          home?.tactics_config?.inMatchRoles || 
                          home?.temporary_match_squad?.tacticsConfig?.roles || 
                          home?.temporary_match_squad?.roles || 
                          {};
      const coachRolesB = away?.tactics_config?.roles || 
                          away?.tactics_config?.inMatchRoles || 
                          away?.temporary_match_squad?.tacticsConfig?.roles || 
                          away?.temporary_match_squad?.roles || 
                          {};

      const rawSquadA = squadARes.data || [];
      const rawSquadB = squadBRes.data || [];

      // Captain must be strictly ONE player per team: coach in-match roles > team captain_id > profile role
      const resolveDesignatedCaptainId = (coachRoles: any, teamObj: any, rawSquad: any[]): string | null => {
        if (coachRoles?.captainId) {
          const match = rawSquad.find((p: any) => p.id === coachRoles.captainId || p.profile_id === coachRoles.captainId);
          if (match) return match.id;
        }
        if (teamObj?.captain_id) {
          const match = rawSquad.find((p: any) => p.id === teamObj.captain_id || p.profile_id === teamObj.captain_id);
          if (match) return match.id;
        }
        const profileCap = rawSquad.find((p: any) => {
          const prof = unwrap(p.profile);
          return prof?.role === 'captain';
        });
        if (profileCap) return profileCap.id;
        return null;
      };

      const designatedCaptainIdA = resolveDesignatedCaptainId(coachRolesA, home, rawSquadA);
      const designatedCaptainIdB = resolveDesignatedCaptainId(coachRolesB, away, rawSquadB);

      const formatPlayerRecord = (
        p: any,
        teamObj: any,
        idx: number,
        isSubDefault: boolean = false,
        designatedCapId: string | null = null,
        formationSlot?: any
      ): Player => {
        const prof = unwrap(p.profile);
        const pName = p.name 
          ? p.name 
          : p.first_name && p.last_name 
          ? `${p.first_name} ${p.last_name}`.trim()
          : prof?.first_name 
          ? `${prof.first_name} ${prof.last_name || ''}`.trim() 
          : `Player #${p.jersey_number || idx + 1}`;

        // Exactly one captain per team: true if matching designated captain ID, or fallback to first starter if none designated
        const isCap = designatedCapId
          ? (p.id === designatedCapId || p.profile_id === designatedCapId)
          : (!isSubDefault && idx === 0);

        // Position & Role strictly follows coach formation slot placement
        // Slot 0 is ALWAYS Goalkeeper (GK)
        let resolvedCategory: PlayerPosition = 'MID';
        let tacticalPosition: string | undefined = undefined;
        let tacticalLabel: string | undefined = undefined;

        if (formationSlot) {
          resolvedCategory = formationSlot.category === 'GK' ? 'GK' : formationSlot.category === 'DEF' ? 'DEF' : formationSlot.category === 'MID' ? 'MID' : 'FWD';
          tacticalPosition = formationSlot.position;
          tacticalLabel = formationSlot.label;
        } else if (!isSubDefault && idx === 0) {
          resolvedCategory = 'GK';
          tacticalPosition = 'GK';
          tacticalLabel = 'Goalkeeper';
        } else {
          resolvedCategory = normalizePos(p.position, idx === 0 ? 'GK' : idx <= 4 ? 'DEF' : idx <= 8 ? 'MID' : 'FWD');
          tacticalPosition = resolvedCategory;
        }

        return {
          id: p.id,
          name: pName,
          number: p.jersey_number || p.number || idx + 1,
          position: resolvedCategory,
          tacticalPosition,
          tacticalLabel,
          isCaptain: isCap,
          isSub: p.isSub !== undefined ? p.isSub : isSubDefault,
          profile_id: p.profile_id,
          team_id: teamObj?.id
        };
      };

      // Resolve Squad for Team A (Home)
      let teamAPlayers: Player[] = [];
      let formationA = home?.tactics_config?.formation || '4-3-3';
      let captainNotesA = '';

      const lineupHome = (lineupsData || []).find((l: any) => l.team_id === home?.id);
      if (lineupHome && Array.isArray(lineupHome.starting_xi) && lineupHome.starting_xi.length > 0) {
        formationA = lineupHome.formation || formationA;
        captainNotesA = lineupHome.captain_notes || '';
        const rawStarters = lineupHome.starting_xi || [];
        const rawSubs = lineupHome.substitutes || [];
        const slotsA = getFormationSlots(formationA);

        const starters = rawStarters.slice(0, 11).map((p: any, i: number) => {
          const matchInDb = rawSquadA.find((dbP: any) => dbP.id === (p.id || p.player_id || p));
          return formatPlayerRecord({ ...(matchInDb || {}), ...(typeof p === 'object' ? p : {}), isSub: false, isReserve: false }, home, i, false, designatedCaptainIdA, slotsA[i]);
        });
        const subs = rawSubs.slice(0, 6).map((p: any, i: number) => {
          const matchInDb = rawSquadA.find((dbP: any) => dbP.id === (p.id || p.player_id || p));
          return formatPlayerRecord({ ...(matchInDb || {}), ...(typeof p === 'object' ? p : {}), isSub: true, isReserve: false }, home, starters.length + i, true, designatedCaptainIdA);
        });
        const usedIds = new Set([...starters, ...subs].map(p => p.id));
        const rawReserves = rawSubs.slice(6);
        const reserves = rawReserves.map((p: any, i: number) => {
          const matchInDb = rawSquadA.find((dbP: any) => dbP.id === (p.id || p.player_id || p));
          const rec = formatPlayerRecord({ ...(matchInDb || {}), ...(typeof p === 'object' ? p : {}), isSub: true }, home, starters.length + 6 + i, true, designatedCaptainIdA);
          rec.isReserve = true;
          return rec;
        });
        reserves.forEach((r: any) => usedIds.add(r.id));
        const extraReserves = rawSquadA.filter((p: any) => !usedIds.has(p.id)).map((p: any, i: number) => {
          const rec = formatPlayerRecord(p, home, starters.length + subs.length + reserves.length + i, true, designatedCaptainIdA);
          rec.isReserve = true;
          return rec;
        });
        teamAPlayers = [...starters, ...subs, ...reserves, ...extraReserves];
      }

      // If not from match_lineups, resolve from saved squad in teams table
      if (teamAPlayers.length === 0 && rawSquadA.length > 0) {
        const tempSquad = home?.temporary_match_squad;
        const startingXiStr = home?.starting_xi_str;
        const subsStr = home?.substitutes_str;

        let starterIds: string[] = [];
        let subIds: string[] = [];

        // 1. Extract Coach's Selected First 11
        if (tempSquad && Array.isArray(tempSquad.startingXI) && tempSquad.startingXI.length > 0) {
          starterIds = tempSquad.startingXI.map((p: any) => (typeof p === 'string' ? p : p?.id)).filter(Boolean);
          formationA = tempSquad.formation || formationA;
        }
        if (starterIds.length === 0 && startingXiStr && typeof startingXiStr === 'string') {
          starterIds = startingXiStr.split(',').map((id: string) => id.trim()).filter(Boolean);
        }

        // 2. Extract Coach's Selected 6 Substitutes
        if (tempSquad && Array.isArray(tempSquad.substitutes) && tempSquad.substitutes.length > 0) {
          subIds = tempSquad.substitutes.map((p: any) => (typeof p === 'string' ? p : p?.id)).filter(Boolean);
        }
        if (subIds.length === 0 && subsStr && typeof subsStr === 'string') {
          subIds = subsStr.split(',').map((id: string) => id.trim()).filter(Boolean);
        }

        const slotsA = getFormationSlots(formationA);

        if (starterIds.length > 0) {
          // Map coach-selected starting XI in exact coach selection order
          const matchedStarters: any[] = [];
          const matchedIds = new Set<string>();

          for (const sId of starterIds) {
            const player = rawSquadA.find((p: any) => p.id === sId);
            if (player && !matchedIds.has(player.id)) {
              matchedStarters.push(player);
              matchedIds.add(player.id);
            }
            if (matchedStarters.length === 11) break;
          }

          // Remaining pool of players not in First 11
          let remainingPlayers = rawSquadA.filter((p: any) => !matchedIds.has(p.id));

          // If fewer than 11 selected or found, fill up to 11 if available (excluding selected subs)
          if (matchedStarters.length < 11) {
            const subIdSet = new Set(subIds);
            const nonSubRemaining = remainingPlayers.filter((p: any) => !subIdSet.has(p.id));
            while (matchedStarters.length < 11 && nonSubRemaining.length > 0) {
              const filler = nonSubRemaining.shift()!;
              matchedStarters.push(filler);
              matchedIds.add(filler.id);
            }
            while (matchedStarters.length < 11 && remainingPlayers.length > 0) {
              const nextP = remainingPlayers.find((p: any) => !matchedIds.has(p.id));
              if (!nextP) break;
              matchedStarters.push(nextP);
              matchedIds.add(nextP.id);
            }
            remainingPlayers = rawSquadA.filter((p: any) => !matchedIds.has(p.id));
          }

          // Map coach-selected 6 substitutes in exact coach selection order
          const matchedSubs: any[] = [];
          for (const sId of subIds) {
            if (matchedIds.has(sId)) continue;
            const player = remainingPlayers.find((p: any) => p.id === sId);
            if (player) {
              matchedSubs.push(player);
              matchedIds.add(player.id);
            }
            if (matchedSubs.length === 6) break;
          }

          // If fewer than 6 substitutes were explicitly selected, fill up to 6 from remaining players
          const remainingForSubs = rawSquadA.filter((p: any) => !matchedIds.has(p.id));
          while (matchedSubs.length < 6 && remainingForSubs.length > 0) {
            const filler = remainingForSubs.shift()!;
            matchedSubs.push(filler);
            matchedIds.add(filler.id);
          }

          // All remaining players become Reserves
          const matchedReserves = rawSquadA.filter((p: any) => !matchedIds.has(p.id));

          const starters = matchedStarters.map((p: any, i: number) => formatPlayerRecord(p, home, i, false, designatedCaptainIdA, slotsA[i]));
          const subs = matchedSubs.map((p: any, i: number) => formatPlayerRecord(p, home, starters.length + i, true, designatedCaptainIdA));
          const reserves = matchedReserves.map((p: any, i: number) => {
            const rec = formatPlayerRecord(p, home, starters.length + subs.length + i, true, designatedCaptainIdA);
            rec.isReserve = true;
            return rec;
          });
          teamAPlayers = [...starters, ...subs, ...reserves];
        } else {
          // Natural division: first 11 starters, next 6 substitutes, remainder reserves
          const starters = rawSquadA.slice(0, 11).map((p: any, idx: number) =>
            formatPlayerRecord(p, home, idx, false, designatedCaptainIdA, slotsA[idx])
          );
          const subs = rawSquadA.slice(11, 17).map((p: any, idx: number) =>
            formatPlayerRecord(p, home, 11 + idx, true, designatedCaptainIdA)
          );
          const reserves = rawSquadA.slice(17).map((p: any, idx: number) => {
            const rec = formatPlayerRecord(p, home, 17 + idx, true, designatedCaptainIdA);
            rec.isReserve = true;
            return rec;
          });
          teamAPlayers = [...starters, ...subs, ...reserves];
        }
      }

      // Resolve Squad for Team B (Away)
      let teamBPlayers: Player[] = [];
      let formationB = away?.tactics_config?.formation || '4-3-3';
      let captainNotesB = '';

      const lineupAway = (lineupsData || []).find((l: any) => l.team_id === away?.id);
      if (lineupAway && Array.isArray(lineupAway.starting_xi) && lineupAway.starting_xi.length > 0) {
        formationB = lineupAway.formation || formationB;
        captainNotesB = lineupAway.captain_notes || '';
        const rawStarters = lineupAway.starting_xi || [];
        const rawSubs = lineupAway.substitutes || [];
        const slotsB = getFormationSlots(formationB);

        const starters = rawStarters.slice(0, 11).map((p: any, i: number) => {
          const matchInDb = rawSquadB.find((dbP: any) => dbP.id === (p.id || p.player_id || p));
          return formatPlayerRecord({ ...(matchInDb || {}), ...(typeof p === 'object' ? p : {}), isSub: false, isReserve: false }, away, i, false, designatedCaptainIdB, slotsB[i]);
        });
        const subs = rawSubs.slice(0, 6).map((p: any, i: number) => {
          const matchInDb = rawSquadB.find((dbP: any) => dbP.id === (p.id || p.player_id || p));
          return formatPlayerRecord({ ...(matchInDb || {}), ...(typeof p === 'object' ? p : {}), isSub: true, isReserve: false }, away, starters.length + i, true, designatedCaptainIdB);
        });
        const usedIdsB = new Set([...starters, ...subs].map(p => p.id));
        const rawReserves = rawSubs.slice(6);
        const reserves = rawReserves.map((p: any, i: number) => {
          const matchInDb = rawSquadB.find((dbP: any) => dbP.id === (p.id || p.player_id || p));
          const rec = formatPlayerRecord({ ...(matchInDb || {}), ...(typeof p === 'object' ? p : {}), isSub: true }, away, starters.length + 6 + i, true, designatedCaptainIdB);
          rec.isReserve = true;
          return rec;
        });
        reserves.forEach((r: any) => usedIdsB.add(r.id));
        const extraReserves = rawSquadB.filter((p: any) => !usedIdsB.has(p.id)).map((p: any, i: number) => {
          const rec = formatPlayerRecord(p, away, starters.length + subs.length + reserves.length + i, true, designatedCaptainIdB);
          rec.isReserve = true;
          return rec;
        });
        teamBPlayers = [...starters, ...subs, ...reserves, ...extraReserves];
      }

      // If not from match_lineups, resolve from saved squad in teams table
      if (teamBPlayers.length === 0 && rawSquadB.length > 0) {
        const tempSquad = away?.temporary_match_squad;
        const startingXiStr = away?.starting_xi_str;
        const subsStr = away?.substitutes_str;

        let starterIds: string[] = [];
        let subIds: string[] = [];

        // 1. Extract Coach's Selected First 11
        if (tempSquad && Array.isArray(tempSquad.startingXI) && tempSquad.startingXI.length > 0) {
          starterIds = tempSquad.startingXI.map((p: any) => (typeof p === 'string' ? p : p?.id)).filter(Boolean);
          formationB = tempSquad.formation || formationB;
        }
        if (starterIds.length === 0 && startingXiStr && typeof startingXiStr === 'string') {
          starterIds = startingXiStr.split(',').map((id: string) => id.trim()).filter(Boolean);
        }

        // 2. Extract Coach's Selected 6 Substitutes
        if (tempSquad && Array.isArray(tempSquad.substitutes) && tempSquad.substitutes.length > 0) {
          subIds = tempSquad.substitutes.map((p: any) => (typeof p === 'string' ? p : p?.id)).filter(Boolean);
        }
        if (subIds.length === 0 && subsStr && typeof subsStr === 'string') {
          subIds = subsStr.split(',').map((id: string) => id.trim()).filter(Boolean);
        }

        const slotsB = getFormationSlots(formationB);

        if (starterIds.length > 0) {
          // Map coach-selected starting XI in exact coach selection order
          const matchedStarters: any[] = [];
          const matchedIds = new Set<string>();

          for (const sId of starterIds) {
            const player = rawSquadB.find((p: any) => p.id === sId);
            if (player && !matchedIds.has(player.id)) {
              matchedStarters.push(player);
              matchedIds.add(player.id);
            }
            if (matchedStarters.length === 11) break;
          }

          // Remaining pool of players not in First 11
          let remainingPlayers = rawSquadB.filter((p: any) => !matchedIds.has(p.id));

          // If fewer than 11 selected or found, fill up to 11 if available (excluding selected subs)
          if (matchedStarters.length < 11) {
            const subIdSet = new Set(subIds);
            const nonSubRemaining = remainingPlayers.filter((p: any) => !subIdSet.has(p.id));
            while (matchedStarters.length < 11 && nonSubRemaining.length > 0) {
              const filler = nonSubRemaining.shift()!;
              matchedStarters.push(filler);
              matchedIds.add(filler.id);
            }
            while (matchedStarters.length < 11 && remainingPlayers.length > 0) {
              const nextP = remainingPlayers.find((p: any) => !matchedIds.has(p.id));
              if (!nextP) break;
              matchedStarters.push(nextP);
              matchedIds.add(nextP.id);
            }
            remainingPlayers = rawSquadB.filter((p: any) => !matchedIds.has(p.id));
          }

          // Map coach-selected 6 substitutes in exact coach selection order
          const matchedSubs: any[] = [];
          for (const sId of subIds) {
            if (matchedIds.has(sId)) continue;
            const player = remainingPlayers.find((p: any) => p.id === sId);
            if (player) {
              matchedSubs.push(player);
              matchedIds.add(player.id);
            }
            if (matchedSubs.length === 6) break;
          }

          // If fewer than 6 substitutes were explicitly selected, fill up to 6 from remaining players
          const remainingForSubs = rawSquadB.filter((p: any) => !matchedIds.has(p.id));
          while (matchedSubs.length < 6 && remainingForSubs.length > 0) {
            const filler = remainingForSubs.shift()!;
            matchedSubs.push(filler);
            matchedIds.add(filler.id);
          }

          // All remaining players become Reserves
          const matchedReserves = rawSquadB.filter((p: any) => !matchedIds.has(p.id));

          const starters = matchedStarters.map((p: any, i: number) => formatPlayerRecord(p, away, i, false, designatedCaptainIdB, slotsB[i]));
          const subs = matchedSubs.map((p: any, i: number) => formatPlayerRecord(p, away, starters.length + i, true, designatedCaptainIdB));
          const reserves = matchedReserves.map((p: any, i: number) => {
            const rec = formatPlayerRecord(p, away, starters.length + subs.length + i, true, designatedCaptainIdB);
            rec.isReserve = true;
            return rec;
          });
          teamBPlayers = [...starters, ...subs, ...reserves];
        } else {
          // Natural division: first 11 starters, next 6 substitutes, remainder reserves
          const starters = rawSquadB.slice(0, 11).map((p: any, idx: number) =>
            formatPlayerRecord(p, away, idx, false, designatedCaptainIdB, slotsB[idx])
          );
          const subs = rawSquadB.slice(11, 17).map((p: any, idx: number) =>
            formatPlayerRecord(p, away, 11 + idx, true, designatedCaptainIdB)
          );
          const reserves = rawSquadB.slice(17).map((p: any, idx: number) => {
            const rec = formatPlayerRecord(p, away, 17 + idx, true, designatedCaptainIdB);
            rec.isReserve = true;
            return rec;
          });
          teamBPlayers = [...starters, ...subs, ...reserves];
        }
      }

      // Calculate Match Statistics from Events
      const goalsA = events.filter((e) => e.teamId === home?.id && (e.type === 'goal' || e.type === 'penalty')).length;
      const goalsB = events.filter((e) => e.teamId === away?.id && (e.type === 'goal' || e.type === 'penalty')).length;
      const yellowA = events.filter((e) => e.teamId === home?.id && e.type === 'yellow').length;
      const yellowB = events.filter((e) => e.teamId === away?.id && e.type === 'yellow').length;
      const redA = events.filter((e) => e.teamId === home?.id && e.type === 'red').length;
      const redB = events.filter((e) => e.teamId === away?.id && e.type === 'red').length;
      const subsA = events.filter((e) => e.teamId === home?.id && e.type === 'sub_in').length;
      const subsB = events.filter((e) => e.teamId === away?.id && e.type === 'sub_in').length;

      const stats = [
        { label: 'Goals', teamAValue: goalsA, teamBValue: goalsB },
        { label: 'Yellow Cards', teamAValue: yellowA, teamBValue: yellowB },
        { label: 'Red Cards', teamAValue: redA, teamBValue: redB },
        { label: 'Substitutions', teamAValue: subsA, teamBValue: subsB }
      ];

      const refName = refProf ? `${refProf.first_name} ${refProf.last_name}`.trim() : 'Official Referee';
      const ar1Name = ar1Prof ? `${ar1Prof.first_name} ${ar1Prof.last_name}`.trim() : undefined;
      const ar2Name = ar2Prof ? `${ar2Prof.first_name} ${ar2Prof.last_name}`.trim() : undefined;
      const foName = foProf ? `${foProf.first_name} ${foProf.last_name}`.trim() : undefined;

      const homeCoach = unwrap(home?.coach);
      const awayCoach = unwrap(away?.coach);
      const homeCap = unwrap(home?.captain);
      const awayCap = unwrap(away?.captain);

      const resolveCoachName = (teamObj: any, coachObj: any) => {
        if (teamObj?.name?.toLowerCase().includes('super eagle')) {
          return 'The Special One';
        }
        if (coachObj) {
          if (coachObj.first_name === 'The' && coachObj.last_name === 'Special One') return 'The Special One';
          return `Coach ${coachObj.first_name} ${coachObj.last_name}`.trim();
        }
        return `Coach ${teamObj?.name || ''}`;
      };

      const coachNameA = resolveCoachName(home, homeCoach);
      const coachNameB = resolveCoachName(away, awayCoach);
      const captainNameA = homeCap ? `${homeCap.first_name} ${homeCap.last_name}`.trim() : teamAPlayers.find(p => p.isCaptain)?.name || 'Team Captain';
      const captainNameB = awayCap ? `${awayCap.first_name} ${awayCap.last_name}`.trim() : teamBPlayers.find(p => p.isCaptain)?.name || 'Team Captain';

      const matchDetail: Match = {
        id: f.id,
        status: f.status as MatchStatus,
        time: formatMatchTime(f.scheduled_time),
        minute: f.status === 'LIVE' ? "65'" : f.status === 'FT' ? "FT" : "-",
        league: comp?.name || 'Egerton League',
        season: comp?.season,
        teamA: {
          id: home?.id || '',
          name: home?.name || 'Home Team',
          shortName: home?.short_name || 'HOM',
          logo: home?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
          colorCode: home?.color_code || '#D4AF37',
          coach_id: home?.coach_id,
          captain_id: designatedCaptainIdA || home?.captain_id,
          coachName: coachNameA,
          captainName: captainNameA,
          kits_config: home?.kits_config || [],
          tactics_config: home?.tactics_config || null
        },
        teamB: {
          id: away?.id || '',
          name: away?.name || 'Away Team',
          shortName: away?.short_name || 'AWY',
          logo: away?.logo_url || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
          colorCode: away?.color_code || '#2563EB',
          coach_id: away?.coach_id,
          captain_id: designatedCaptainIdB || away?.captain_id,
          coachName: coachNameB,
          captainName: captainNameB,
          kits_config: away?.kits_config || [],
          tactics_config: away?.tactics_config || null
        },
        scoreA: f.score_home || 0,
        scoreB: f.score_away || 0,
        events,
        stats,
        lineups: {
          teamA: teamAPlayers,
          teamB: teamBPlayers,
          formationA,
          formationB,
          rolesA: coachRolesA,
          rolesB: coachRolesB,
          coordsMapA: home?.tactics_config?.coordsMap || home?.temporary_match_squad?.coordsMap || null,
          coordsMapB: away?.tactics_config?.coordsMap || away?.temporary_match_squad?.coordsMap || null,
        },
        venue: f.venue || '',
        referee: refName,
        refereeId: f.referee_id,
        assistantReferee1: ar1Name,
        assistantReferee1Id: f.assistant_referee_1_id,
        assistantReferee2: ar2Name,
        assistantReferee2Id: f.assistant_referee_2_id,
        fourthOfficial: foName,
        fourthOfficialId: f.fourth_official_id,
        attendance: f.attendance,
        weather: f.weather,
        matchday: f.matchday,
        homePenaltyScore: f.home_penalty_score,
        awayPenaltyScore: f.away_penalty_score,
        captainNotesA,
        captainNotesB,
        verifiedByRefereeId: f.verified_by_referee_id
      };

      guestCache.set('match_details', fixtureId, matchDetail);
      return { success: true, data: matchDetail };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  // --- MATCH EVENTS & REALTIME UPDATE SERVICES ---
  async getMatchEvents(fixtureId: string): Promise<ApiResponse<MatchEvent[]>> {
    if (!fixtureId) {
      return { success: true, data: [] };
    }

    try {
      return await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('match_events')
          .select('*')
          .eq('fixture_id', fixtureId)
          .order('minute', { ascending: true });

        if (error || !data) {
          return { success: true, data: [] };
        }

        const events: MatchEvent[] = data.map((e: any) => ({
          id: e.id,
          fixtureId: e.fixture_id,
          minute: e.minute,
          type: e.type,
          eventTarget: e.event_target || (e.team_id ? 'home' : 'match'),
          teamId: e.team_id,
          playerId: e.player_id,
          assistPlayerId: e.assist_player_id,
          detailText: sanitizeHtmlText(e.detail_text),
          createdBy: e.created_by,
          createdAt: e.created_at
        }));

        return { success: true, data: events };
      });
    } catch (err) {
      logger.warn(`Failed to fetch match events for fixture ${fixtureId}`, { error: err });
      return { success: true, data: [] };
    }
  },

  async createMatchEvent(eventData: {
    fixtureId: string;
    type: MatchEventType;
    eventTarget: 'home' | 'away' | 'match';
    minute?: number;
    teamId?: string;
    detailText?: string;
    newScoreHome?: number;
    newScoreAway?: number;
    newStatus?: MatchStatus;
    isOfficial?: boolean;
  }): Promise<ApiResponse<MatchEvent>> {
    if (!eventData.fixtureId || !eventData.type) {
      return { success: false, data: null, message: 'Validation Error: fixtureId and eventType are required.' };
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      const isOfficial = eventData.isOfficial ?? false;
      const sanitizedDetail = sanitizeHtmlText(eventData.detailText);

      const { data: insertedEvent, error: eventErr } = await supabase
        .from('match_events')
        .insert({
          fixture_id: eventData.fixtureId,
          minute: Math.max(0, eventData.minute ?? 0),
          type: eventData.type,
          event_target: eventData.eventTarget,
          team_id: eventData.teamId || null,
          detail_text: sanitizedDetail || null,
          is_official: isOfficial,
          created_by: userId || null
        })
        .select()
        .single();

      if (eventErr) {
        logger.warn('Supabase match_events insert note:', { message: eventErr.message });
      }

      const fixtureUpdates: Record<string, any> = {};
      if (typeof eventData.newScoreHome === 'number') {
        fixtureUpdates.score_home = Math.max(0, eventData.newScoreHome);
      }
      if (typeof eventData.newScoreAway === 'number') {
        fixtureUpdates.score_away = Math.max(0, eventData.newScoreAway);
      }
      if (eventData.newStatus) {
        fixtureUpdates.status = eventData.newStatus;
      }

      if (Object.keys(fixtureUpdates).length > 0) {
        await supabase
          .from('fixtures')
          .update(fixtureUpdates)
          .eq('id', eventData.fixtureId);
      }

      await this.logAuditAction(
        isOfficial ? `OFFICIAL_EVENT_${eventData.type.toUpperCase()}` : `LIVE_MEDIA_EVENT_${eventData.type.toUpperCase()}`,
        'fixtures',
        eventData.fixtureId,
        { eventType: eventData.type, eventTarget: eventData.eventTarget, minute: eventData.minute, isOfficial }
      );

      const result: MatchEvent = insertedEvent
        ? {
            id: insertedEvent.id,
            fixtureId: insertedEvent.fixture_id,
            minute: insertedEvent.minute,
            type: insertedEvent.type,
            eventTarget: insertedEvent.event_target,
            teamId: insertedEvent.team_id,
            detailText: insertedEvent.detail_text,
            isOfficial: insertedEvent.is_official,
            createdAt: insertedEvent.created_at
          }
        : {
            id: `evt_${Date.now()}`,
            fixtureId: eventData.fixtureId,
            minute: eventData.minute ?? 0,
            type: eventData.type,
            eventTarget: eventData.eventTarget,
            teamId: eventData.teamId,
            detailText: sanitizedDetail,
            isOfficial,
            createdAt: new Date().toISOString()
          };

      return { success: true, data: result };
    } catch (err: any) {
      const appErr = classifyError(err);
      logger.error('Failed to create match event', err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  // --- REFEREE ASSIGNMENT & VERIFICATION MUTATIONS ---
  async updateAssignmentStatus(fixtureId: string, status: 'accepted' | 'rejected'): Promise<ApiResponse<{ fixtureId: string; status: string }>> {
    if (!fixtureId) return { success: false, data: null, message: 'Fixture ID is required.' };
    try {
      await supabase.from('fixtures').update({ assignment_status: status }).eq('id', fixtureId);
      return { success: true, data: { fixtureId, status } };
    } catch (err) {
      return { success: true, data: { fixtureId, status } };
    }
  },

  async verifyOfficialMatchResult(params: {
    fixtureId: string;
    refereeId: string;
    scoreHome: number;
    scoreAway: number;
    reportText: string;
    status?: MatchStatus;
    attendance?: number;
    notes?: string;
    incidents?: string;
    weather?: string;
    remarks?: string;
    officialEvents?: Array<{
      type: MatchEventType;
      eventTarget: 'home' | 'away' | 'match';
      minute: number;
      detailText?: string;
      playerId?: string;
      teamId?: string;
      assistPlayerId?: string;
      id?: string;
    }>;
    winningTeamId?: string;
    idempotencyKey?: string;
    outcome?: 'NORMAL' | 'WALKOVER';
  }): Promise<ApiResponse<any>> {
    if (!params.fixtureId || !params.refereeId) {
      return { success: false, data: null, message: 'Validation Error: Fixture ID and Referee ID required.' };
    }

    try {
      const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: null }));
      const rawOfficialId = userData?.user?.id || params.refereeId;
      const verifiedOfficialId = (rawOfficialId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawOfficialId))
        ? rawOfficialId
        : params.refereeId;

      const isWalkover = params.outcome === 'WALKOVER' || ((params.status as string) === 'WALKOVER') || (params.reportText && params.reportText.includes('WALKOVER'));
      const outcome = isWalkover ? 'WALKOVER' : (params.outcome || 'NORMAL');

      const fullReportText = [
        sanitizeHtmlText(params.reportText),
        params.attendance ? `Attendance: ${params.attendance}` : '',
        params.weather ? `Weather: ${sanitizeHtmlText(params.weather)}` : '',
        params.incidents ? `Incidents: ${sanitizeHtmlText(params.incidents)}` : '',
        params.remarks ? `Remarks: ${sanitizeHtmlText(params.remarks)}` : '',
        params.notes ? `Notes: ${sanitizeHtmlText(params.notes)}` : '',
      ].filter(Boolean).join('\n\n');

      const mappedOfficialEvents = (params.officialEvents || []).map((evt: any) => ({
        id: evt.id || evt.event_uid,
        minute: Math.max(0, evt.minute ?? 1),
        type: (evt.type || '').toUpperCase(),
        event_target: evt.eventTarget || evt.event_target || 'match',
        team_id: (evt.teamId || evt.team_uid) && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(evt.teamId || evt.team_uid)
          ? (evt.teamId || evt.team_uid) : null,
        player_id: (evt.playerId || evt.player_uid) && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(evt.playerId || evt.player_uid)
          ? (evt.playerId || evt.player_uid) : null,
        assist_player_id: (evt.assistPlayerId || evt.assist_player_id) && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(evt.assistPlayerId || evt.assist_player_id)
          ? (evt.assistPlayerId || evt.assist_player_id) : null,
        detail_text: sanitizeHtmlText(evt.detailText || evt.detail_text) || null,
      }));

      let winningTeamId = params.winningTeamId;
      if (outcome === 'WALKOVER' && !winningTeamId) {
        let fix: { home_team_id: string; away_team_id: string } | null = null;
        try {
          const res = await supabase
            .from('fixtures')
            .select('home_team_id, away_team_id')
            .eq('id', params.fixtureId)
            .maybeSingle();
          fix = res.data as { home_team_id: string; away_team_id: string } | null;
        } catch {
          fix = null;
        }

        if (fix) {
          if (params.scoreHome > params.scoreAway) {
            winningTeamId = fix.home_team_id;
          } else if (params.scoreAway > params.scoreHome) {
            winningTeamId = fix.away_team_id;
          } else if (params.reportText && (params.reportText.includes('Home Team') || params.reportText.toLowerCase().includes('home'))) {
            winningTeamId = fix.home_team_id;
          } else if (params.reportText && (params.reportText.includes('Away Team') || params.reportText.toLowerCase().includes('away'))) {
            winningTeamId = fix.away_team_id;
          }
        }
      }

      // Primary transactional execution via atomic PostgreSQL RPC
      try {
        if (typeof supabase.rpc === 'function') {
          const { data: rpcData, error: rpcError } = await supabase.rpc('finalize_match_transaction', {
            p_fixture_id: params.fixtureId,
            p_referee_id: verifiedOfficialId,
            p_outcome: outcome,
            p_home_score: Math.max(0, params.scoreHome),
            p_away_score: Math.max(0, params.scoreAway),
            p_winning_team_id: winningTeamId || null,
            p_report_text: fullReportText,
            p_official_events: outcome === 'WALKOVER' ? [] : mappedOfficialEvents,
            p_idempotency_key: params.idempotencyKey || null,
            p_attendance: params.attendance || null,
            p_weather: params.weather || null,
            p_incidents: params.incidents || null,
            p_remarks: params.remarks || null,
          });

          if (!rpcError && rpcData) {
            await this.logAuditAction('OFFICIAL_MATCH_RESULT_VERIFIED', 'fixtures', params.fixtureId, {
              scoreHome: rpcData.home_score ?? params.scoreHome,
              scoreAway: rpcData.away_score ?? params.scoreAway,
              status: rpcData.status,
              outcome,
            }).catch(() => {});

            return { success: true, data: rpcData };
          }

          // If the RPC returned a business validation error, return it directly
          if (rpcError) {
            const msg = rpcError.message || '';
            if (
              msg.includes('FIXTURE_NOT_FOUND') ||
              msg.includes('INVALID_REFEREE_ID') ||
              msg.includes('INVALID_WALKOVER') ||
              msg.includes('INVALID_WALKOVER_WINNER') ||
              msg.includes('INVALID_WALKOVER_TEAMS')
            ) {
              return { success: false, data: null, message: msg };
            }
            console.warn('finalize_match_transaction RPC error, attempting fallback:', rpcError);
          }
        }
      } catch (rpcCallErr: any) {
        console.warn('finalize_match_transaction RPC invocation failed, falling back:', rpcCallErr);
      }

      // Fallback path: Client-side sequence for offline / mock environments without RPC
      await supabase.from('match_reports').delete().eq('fixture_id', params.fixtureId);
      await supabase.from('match_reports').insert({
        fixture_id: params.fixtureId,
        official_id: verifiedOfficialId,
        official_role: 'referee',
        report_text: fullReportText,
        submitted_at: new Date().toISOString()
      });

      await supabase.from('match_events').delete().eq('fixture_id', params.fixtureId);

      if (outcome !== 'WALKOVER' && mappedOfficialEvents.length > 0) {
        for (const evt of mappedOfficialEvents) {
          await supabase.from('match_events').insert({
            fixture_id: params.fixtureId,
            minute: Math.max(0, evt.minute),
            type: evt.type,
            event_target: evt.event_target,
            team_id: evt.team_id,
            player_id: evt.player_id,
            assist_player_id: evt.assist_player_id,
            detail_text: evt.detail_text,
            is_official: true,
            created_by: verifiedOfficialId
          });
        }
      }

      const fixUpdatePayload: any = {
        score_home: Math.max(0, params.scoreHome),
        score_away: Math.max(0, params.scoreAway),
        status: 'FT',
        verified_by_referee_id: verifiedOfficialId,
        referee_verification_status: 'VERIFIED',
        updated_at: new Date().toISOString()
      };
      if (params.attendance !== undefined) fixUpdatePayload.attendance = params.attendance;
      if (params.weather !== undefined) fixUpdatePayload.weather = params.weather;

      const { data: updatedFixture } = await supabase
        .from('fixtures')
        .update(fixUpdatePayload)
        .eq('id', params.fixtureId)
        .select()
        .single();

      try {
        await supabase
          .from('canonical_permanent_results')
          .insert({
            match_uid: params.fixtureId,
            outcome,
            home_score: Math.max(0, params.scoreHome),
            away_score: Math.max(0, params.scoreAway),
            events: outcome === 'WALKOVER' ? [] : mappedOfficialEvents,
            referee_uid: verifiedOfficialId,
            finalized_at: new Date().toISOString(),
            locked_at: new Date().toISOString(),
          });
      } catch {
        // Idempotent: record already finalized
      }

      await this.logAuditAction('OFFICIAL_MATCH_RESULT_VERIFIED', 'fixtures', params.fixtureId, {
        scoreHome: params.scoreHome,
        scoreAway: params.scoreAway
      }).catch(() => {});

      return { success: true, data: updatedFixture || { id: params.fixtureId } };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  // --- HEAD TO HEAD (HISTORICAL COMPLETED MATCHES) ---
  async getHeadToHead(teamAId: string, teamBId: string): Promise<ApiResponse<Array<{
    id: string;
    date: string;
    scoreA: number;
    scoreB: number;
    winner: string;
    venue: string;
    comp?: string;
    homeName?: string;
    awayName?: string;
  }>>> {
    if (!teamAId || !teamBId) {
      return { success: true, data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('fixtures')
        .select(`
          id,
          scheduled_time,
          score_home,
          score_away,
          venue,
          competition:competitions(name),
          team_home:teams!fixtures_home_team_id_fkey(id, name),
          team_away:teams!fixtures_away_team_id_fkey(id, name)
        `)
        .in('status', ['FT', 'FINAL', 'ARCHIVED'])
        .or(`and(home_team_id.eq.${teamAId},away_team_id.eq.${teamBId}),and(home_team_id.eq.${teamBId},away_team_id.eq.${teamAId})`)
        .order('scheduled_time', { ascending: false })
        .limit(10);

      if (error || !data) {
        return { success: true, data: [] };
      }

      const h2h = data.map((f: any) => {
        const comp = unwrap(f.competition);
        const home = unwrap(f.team_home);
        const away = unwrap(f.team_away);
        const isHomeA = home?.id === teamAId;
        const scoreA = isHomeA ? f.score_home : f.score_away;
        const scoreB = isHomeA ? f.score_away : f.score_home;
        let winner = 'Draw';
        if (scoreA > scoreB) winner = home?.name || 'Team A';
        else if (scoreB > scoreA) winner = away?.name || 'Team B';

        const d = new Date(f.scheduled_time);
        const dateStr = !isNaN(d.getTime())
          ? `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(-2)}`
          : '-';

        return {
          id: f.id,
          date: dateStr,
          scoreA,
          scoreB,
          winner,
          venue: f.venue || '',
          comp: comp?.name ? (comp.name.includes('Premier') ? 'EPL' : comp.name.includes('Champ') ? 'CHP' : 'FRN') : 'EPL',
          homeName: home?.name || 'Home Team',
          awayName: away?.name || 'Away Team'
        };
      });

      return { success: true, data: h2h };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- TEAM RECENT MATCHES (COMPLETED FIXTURES WITH OPPONENTS & SCORES) ---
  async getTeamRecentMatches(teamId: string): Promise<ApiResponse<Array<{
    id: string;
    date: string;
    comp: string;
    opp: string;
    score: string;
    res: 'W' | 'D' | 'L';
  }>>> {
    if (!teamId) {
      return { success: true, data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('fixtures')
        .select(`
          id,
          scheduled_time,
          score_home,
          score_away,
          home_team_id,
          away_team_id,
          competition:competitions(name),
          team_home:teams!fixtures_home_team_id_fkey(name),
          team_away:teams!fixtures_away_team_id_fkey(name)
        `)
        .in('status', ['FT', 'FINAL', 'ARCHIVED'])
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('scheduled_time', { ascending: false })
        .limit(5);

      if (error || !data) {
        return { success: true, data: [] };
      }

      const matches = data.map((f: any) => {
        const comp = unwrap(f.competition);
        const home = unwrap(f.team_home);
        const away = unwrap(f.team_away);
        const isHome = f.home_team_id === teamId;
        const goalsFor = isHome ? f.score_home : f.score_away;
        const goalsAgainst = isHome ? f.score_away : f.score_home;
        const opponentName = isHome ? away?.name : home?.name;

        let res: 'W' | 'D' | 'L' = 'D';
        if (goalsFor > goalsAgainst) res = 'W';
        else if (goalsFor < goalsAgainst) res = 'L';

        const d = new Date(f.scheduled_time);
        const dateStr = !isNaN(d.getTime())
          ? `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
          : '-';

        return {
          id: f.id,
          date: dateStr,
          comp: comp?.name ? (comp.name.includes('Premier') ? 'EPL' : comp.name.includes('Champ') ? 'CHP' : 'FRN') : 'EPL',
          opp: opponentName || 'Opponent',
          score: `${goalsFor} - ${goalsAgainst}`,
          res
        };
      });

      return { success: true, data: matches };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- BATCH TEAM FORMS (Reduces N+1 queries to a single batch call) ---
  async getBatchTeamForms(
    teamIds: string[]
  ): Promise<Record<string, Array<{ result: 'W' | 'D' | 'L'; label: string }>>> {
    const uniqueIds = Array.from(new Set(teamIds.filter(Boolean)));
    if (uniqueIds.length === 0) return {};

    const now = Date.now();
    const result: Record<string, Array<{ result: 'W' | 'D' | 'L'; label: string }>> = {};
    const idsToFetch: string[] = [];

    // 1. Check in-memory cache first (60-second TTL)
    for (const id of uniqueIds) {
      const cached = teamFormCache.get(id);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        result[id] = cached.data;
      } else {
        idsToFetch.push(id);
      }
    }

    if (idsToFetch.length === 0) {
      return result;
    }

    try {
      // 2. Fetch all missing teams in ONE single query
      const { data: formRows, error } = await supabase
        .from('team_form')
        .select('team_id, latest_results')
        .in('team_id', idsToFetch);

      if (!error && formRows) {
        for (const row of formRows) {
          const formEntries = (row.latest_results || []).map((res: string) => {
            const letter = (res === 'W' || res === 'D' || res === 'L') ? res : 'D';
            return {
              result: letter as 'W' | 'D' | 'L',
              label: letter === 'W' ? 'Win' : letter === 'D' ? 'Draw' : 'Loss'
            };
          });
          result[row.team_id] = formEntries;
          teamFormCache.set(row.team_id, { timestamp: now, data: formEntries });
        }
      }

      // 3. Fallback for any team not yet in team_form: initialize empty and cache
      for (const id of idsToFetch) {
        if (!result[id]) {
          result[id] = [];
          teamFormCache.set(id, { timestamp: now, data: [] });
        }
      }

      return result;
    } catch (err) {
      return result;
    }
  },

  // --- TEAM RECENT FORM (LAST 5 MATCHES - ALGORITHM 2 MATERIALIZED) ---
  async getTeamForm(teamId: string): Promise<ApiResponse<Array<{ result: 'W' | 'D' | 'L'; label: string }>>> {
    if (!teamId) {
      return { success: true, data: [] };
    }

    const now = Date.now();
    const cached = teamFormCache.get(teamId);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return { success: true, data: cached.data };
    }

    try {
      const batchRes = await this.getBatchTeamForms([teamId]);
      const data = batchRes[teamId] || [];
      return { success: true, data };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- LEAGUE TABLE ENGINE (ALGORITHM 2 MATERIALIZED FEED) ---
  async getLeagueTable(
    competitionId?: string,
    fixturesOverride?: Match[],
    previousStandings?: LeagueTableEntry[]
  ): Promise<ApiResponse<LeagueTableEntry[]>> {
    try {
      const targetCompId = competitionId && competitionId !== 'all' ? competitionId : undefined;
      const cacheKey = targetCompId || 'all';

      // 0. Use rapid-access in-memory cache for standard reads (30-second TTL)
      if (!fixturesOverride && !previousStandings) {
        const cached = leagueTableCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 30_000) {
          return { success: true, data: cached.data };
        }
      }

      // 1. Unified Resilient Standings Fetcher (Direct table query with inner join)
      const { getGuestLeagueTableEntries } = await import('./guestSportsService');
      const entries = await getGuestLeagueTableEntries(targetCompId);

      if (entries && entries.length > 0) {
        if (!fixturesOverride && !previousStandings) {
          leagueTableCache.set(cacheKey, { timestamp: Date.now(), data: entries });
        }
        return { success: true, data: entries };
      }

      // 2. Direct Materialized Table Query Fallback (flat query + batch team join)
      let standingsQ = supabase.from('league_standings')
        .select('team_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, last_updated')
        .order('points', { ascending: false })
        .order('goal_difference', { ascending: false })
        .order('goals_for', { ascending: false });
      if (targetCompId) {
        standingsQ = standingsQ.eq('competition_id', targetCompId);
      }

      const { data: rawStandings, error: rawErr } = await standingsQ;

      if (!rawErr && rawStandings && rawStandings.length > 0) {
        const teamIds2 = rawStandings.map((r: any) => r.team_id).filter(Boolean);
        const { data: teamsData2 } = await supabase.from('teams').select('id, name, logo_url').in('id', teamIds2);
        const teamMap2 = new Map<string, any>((teamsData2 || []).map((t: any) => [t.id, t]));
        const directEntries: LeagueTableEntry[] = rawStandings.map((row: any, idx: number) => {
          const tm = teamMap2.get(row.team_id) || {};
          return {
            position: idx + 1,
            teamId: row.team_id || '',
            teamName: tm?.name || 'Campus Team',
            teamLogo: tm?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
            played: Number(row.played),
            won: Number(row.won),
            drawn: Number(row.drawn),
            lost: Number(row.lost),
            goalsFor: Number(row.goals_for),
            goalsAgainst: Number(row.goals_against),
            goalDifference: Number(row.goal_difference),
            points: Number(row.points),
            lastUpdated: row.last_updated || new Date().toISOString()
          };
        });
        return { success: true, data: directEntries };
      }

      // 3. Fallback for offline/empty season
      let fixtures = fixturesOverride;
      if (!fixtures || fixtures.length === 0) {
        const fixRes = await this.getFixtures(competitionId);
        fixtures = fixRes.data || [];
      }

      const { data: teamsData } = await supabase.from('teams').select('id, name, logo_url');
      const teamsList = (teamsData || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        logo: t.logo_url
      }));

      const computedStandings = calculateLeagueStandings(fixtures, teamsList, previousStandings);
      return { success: true, data: computedStandings };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- TOP SCORERS LEADERBOARD ---
  async getTopScorers(competitionId?: string, limit: number = 10): Promise<ApiResponse<Array<{
    playerId: string;
    playerName: string;
    teamName: string;
    teamLogo: string;
    goals: number;
  }>>> {
    try {
      const targetCompId = (competitionId && competitionId !== 'all' && competitionId !== 'ALL' && /^[0-9a-fA-F-]{36}$/.test(competitionId)) ? competitionId : undefined;
      const { getGuestTopScorers } = await import('./guestSportsService');
      const scorers = await getGuestTopScorers(limit || 10, targetCompId);

      if (scorers && scorers.length > 0) {
        return {
          success: true,
          data: scorers.map(s => ({
            playerId: s.player_id,
            playerName: s.player_name,
            teamName: s.team_name,
            teamLogo: s.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
            goals: s.goals
          }))
        };
      }

      return { success: true, data: [] };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- ALL TIME TOP SCORERS ---
  async getAllTimeTopScorers(limit: number = 10): Promise<ApiResponse<Array<{
    playerId: string;
    playerName: string;
    teamName: string;
    teamLogo: string;
    goals: number;
  }>>> {
    return this.getTopScorers(undefined, limit);
  },

  // --- PLAYERS OF THE WEEK ---
  async getPlayersOfTheWeek(): Promise<ApiResponse<Array<{
    week: number;
    eplPlayer: { name: string; team: string; contribution: string };
    champPlayer: { name: string; team: string; contribution: string };
  }>>> {
    try {
      const EPL_ID = '11111111-1111-1111-1111-111111111111';
      const CHAMP_ID = '22222222-2222-2222-2222-222222222222';

      // Query completed fixtures with official match events to dynamically calculate weekly stars
      const { data: fixtures, error } = await supabase
        .from('fixtures')
        .select(`
          id, matchday, competition_id,
          match_events(
            id, type, player_id, assist_player_id,
            player:players!match_events_player_id_fkey(
              id,
              first_name,
              last_name,
              team:teams!players_team_id_fkey(name)
            )
          )
        `)
        .eq('status', 'FT')
        .order('matchday', { ascending: false });

      if (error || !fixtures || fixtures.length === 0) {
        return { success: true, data: [] };
      }

      // Group by matchday
      const matchdayMap = new Map<number, { eplEvents: any[]; champEvents: any[] }>();
      fixtures.forEach((f: any) => {
        const mday = f.matchday || 1;
        if (!matchdayMap.has(mday)) {
          matchdayMap.set(mday, { eplEvents: [], champEvents: [] });
        }
        const group = matchdayMap.get(mday)!;
        const events = f.match_events || [];
        if (f.competition_id === CHAMP_ID) {
          group.champEvents.push(...events);
        } else {
          group.eplEvents.push(...events);
        }
      });

      const findStarPlayer = (events: any[]) => {
        const playerScores = new Map<string, { player: any; goals: number; assists: number }>();
        events.forEach((ev: any) => {
          if (!ev.player_id) return;
          const p = unwrap(ev.player);
          if (!playerScores.has(ev.player_id)) {
            playerScores.set(ev.player_id, { player: p, goals: 0, assists: 0 });
          }
          const rec = playerScores.get(ev.player_id)!;
          if (ev.type === 'goal' || ev.type === 'penalty') {
            rec.goals += 1;
          }
        });
        events.forEach((ev: any) => {
          if (!ev.assist_player_id) return;
          if (playerScores.has(ev.assist_player_id)) {
            playerScores.get(ev.assist_player_id)!.assists += 1;
          }
        });

        let best: { name: string; team: string; contribution: string } | null = null;
        let bestPoints = 0;
        playerScores.forEach(({ player, goals, assists }) => {
          const totalPoints = (goals * 2) + assists;
          if (totalPoints > bestPoints) {
            bestPoints = totalPoints;
            const prof = unwrap(player?.profile);
            const tm = unwrap(player?.team);
            const fullName = prof ? `${prof.first_name} ${prof.last_name}` : 'Player';
            const contribParts: string[] = [];
            if (goals > 0) contribParts.push(`${goals} Goal${goals > 1 ? 's' : ''}`);
            if (assists > 0) contribParts.push(`${assists} Assist${assists > 1 ? 's' : ''}`);
            best = {
              name: fullName,
              team: tm?.name || 'Campus Team',
              contribution: contribParts.join(', ') || 'Match Winner'
            };
          }
        });
        return best;
      };

      const results: Array<{
        week: number;
        eplPlayer: { name: string; team: string; contribution: string };
        champPlayer: { name: string; team: string; contribution: string };
      }> = [];

      matchdayMap.forEach((group, week) => {
        const eplStar = findStarPlayer(group.eplEvents);
        const champStar = findStarPlayer(group.champEvents);
        if (eplStar || champStar) {
          results.push({
            week,
            eplPlayer: eplStar || { name: 'To be determined', team: 'EPL', contribution: 'Pending validation' },
            champPlayer: champStar || { name: 'To be determined', team: 'Championships', contribution: 'Pending validation' }
          });
        }
      });

      return { success: true, data: results.sort((a, b) => b.week - a.week) };
    } catch {
      return { success: true, data: [] };
    }
  },

  // --- ASSISTS LEADERBOARD ---
  async getAssistsLeaderboard(limit: number = 5): Promise<ApiResponse<Array<{
    rank: number;
    playerId: string;
    playerName: string;
    teamName: string;
    league: string;
    assists: number;
  }>>> {
    try {
      const CHAMP_ID = '22222222-2222-2222-2222-222222222222';
      let { data, error } = await supabase
        .from('player_stats')
        .select(`
          player_id,
          competition_id,
          assists,
          player:players!player_id(
            id,
            first_name,
            last_name,
            profile:profiles!profile_id(first_name, last_name),
            team:teams!team_id(id, name, competition_id)
          )
        `)
        .gt('assists', 0)
        .order('assists', { ascending: false })
        .limit(limit || 10);

      if ((error || !data || data.length === 0)) {
        // Fallback: Check match_events for assist_player_id
        try {
          const { data: evAssists } = await supabase
            .from('match_events')
            .select(`
              assist_player_id,
              player:players!assist_player_id(
                id,
                first_name,
                last_name,
                profile:profiles!profile_id(first_name, last_name),
                team:teams!team_id(id, name, competition_id)
              )
            `)
            .not('assist_player_id', 'is', null);

          if (evAssists && evAssists.length > 0) {
            const assistCountMap = new Map<string, { player: any; count: number }>();
            evAssists.forEach((ev: any) => {
              if (!ev.assist_player_id) return;
              const cur = assistCountMap.get(ev.assist_player_id);
              if (cur) {
                cur.count += 1;
              } else {
                assistCountMap.set(ev.assist_player_id, { player: unwrap(ev.player), count: 1 });
              }
            });

            const sorted = Array.from(assistCountMap.entries())
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, limit || 5);

            if (sorted.length > 0) {
              const list = sorted.map(([pId, info], idx) => {
                const p = info.player;
                const prof = unwrap(p?.profile);
                const tm = unwrap(p?.team);
                const isChamp = tm?.competition_id === CHAMP_ID;
                const fullName = [prof?.first_name || p?.first_name, prof?.last_name || p?.last_name].filter(Boolean).join(' ') || 'Player';
                return {
                  rank: idx + 1,
                  playerId: pId,
                  playerName: fullName,
                  teamName: tm?.name || 'Campus Team',
                  league: isChamp ? 'Championships' : 'EPL',
                  assists: info.count
                };
              });
              return { success: true, data: list };
            }
          }
        } catch {}
        return { success: true, data: [] };
      }

      const list = data.map((row: any, idx: number) => {
        const p = unwrap(row.player);
        const prof = unwrap(p?.profile);
        const tm = unwrap(p?.team);
        const isChamp = (row.competition_id === CHAMP_ID) || (tm?.competition_id === CHAMP_ID);
        const fullName = [prof?.first_name || p?.first_name, prof?.last_name || p?.last_name].filter(Boolean).join(' ') || 'Player';
        return {
          rank: idx + 1,
          playerId: row.player_id,
          playerName: fullName,
          teamName: tm?.name || 'Campus Team',
          league: isChamp ? 'Championships' : 'EPL',
          assists: Number(row.assists)
        };
      });

      return { success: true, data: list.slice(0, limit || 5) };
    } catch {
      return { success: true, data: [] };
    }
  },

  // --- DUAL PLAYER PERFORMANCE & GOATS ---
  async getDualPlayerPerformance(): Promise<ApiResponse<{
    epl: {
      topScorer: { playerId: string; playerName: string; teamName: string; league: string; goals: number; streak: number } | null;
      mostAssists: { playerId: string; playerName: string; teamName: string; league: string; assists: number; streak: number } | null;
      mostCleanSheets: { playerId: string; playerName: string; teamName: string; league: string; cleanSheets: number; streak: number } | null;
    };
    championship: {
      topScorer: { playerId: string; playerName: string; teamName: string; league: string; goals: number; streak: number } | null;
      mostAssists: { playerId: string; playerName: string; teamName: string; league: string; assists: number; streak: number } | null;
      mostCleanSheets: { playerId: string; playerName: string; teamName: string; league: string; cleanSheets: number; streak: number } | null;
    };
    goats: {
      topScorer: { playerId: string; playerName: string; teamName: string; league: string; goals: number; streak: number } | null;
      mostAssists: { playerId: string; playerName: string; teamName: string; league: string; assists: number; streak: number } | null;
      mostCleanSheets: { playerId: string; playerName: string; teamName: string; league: string; cleanSheets: number; streak: number } | null;
    };
  }>> {
    const cached = guestCache.get<any>('performance', 'dual_perf');
    if (cached) return { success: true, data: cached };

    try {
      const EPL_ID = '11111111-1111-1111-1111-111111111111';
      const CHAMP_ID = '22222222-2222-2222-2222-222222222222';

      // 1. Fetch Top Scorers via getTopScorers
      const [eplScorersRes, champScorersRes, goatsScorersRes] = await Promise.all([
        this.getTopScorers(EPL_ID, 1),
        this.getTopScorers(CHAMP_ID, 1),
        this.getTopScorers(undefined, 1)
      ]);

      const eplTopScorer = (eplScorersRes.data && eplScorersRes.data[0] && eplScorersRes.data[0].goals > 0) ? {
        playerId: eplScorersRes.data[0].playerId,
        playerName: eplScorersRes.data[0].playerName,
        teamName: eplScorersRes.data[0].teamName,
        league: 'Egerton Premier League',
        goals: eplScorersRes.data[0].goals,
        streak: 1
      } : null;

      const champTopScorer = (champScorersRes.data && champScorersRes.data[0] && champScorersRes.data[0].goals > 0) ? {
        playerId: champScorersRes.data[0].playerId,
        playerName: champScorersRes.data[0].playerName,
        teamName: champScorersRes.data[0].teamName,
        league: 'Egerton Championships',
        goals: champScorersRes.data[0].goals,
        streak: 1
      } : null;

      const goatScorer = (goatsScorersRes.data && goatsScorersRes.data[0] && goatsScorersRes.data[0].goals > 0) ? {
        playerId: goatsScorersRes.data[0].playerId,
        playerName: goatsScorersRes.data[0].playerName,
        teamName: goatsScorersRes.data[0].teamName,
        league: 'Egerton Premier League',
        goals: goatsScorersRes.data[0].goals,
        streak: 1
      } : (eplTopScorer || champTopScorer || null);

      // 2. Fetch Clean Sheets directly from materialized player_stats table (updated by fn_process_match_statistics)
      const { data: cleanSheetStats } = await supabase
        .from('player_stats')
        .select(`
          player_id,
          competition_id,
          clean_sheets,
          player:players!player_id(
            id,
            first_name,
            last_name,
            position,
            profile:profiles!profile_id(first_name, last_name),
            team:teams!team_id(id, name, competition_id)
          )
        `)
        .gt('clean_sheets', 0)
        .order('clean_sheets', { ascending: false });

      const getTopGK = (compId?: string) => {
        let best: { playerId: string; playerName: string; teamName: string; league: string; cleanSheets: number; streak: number } | null = null;
        (cleanSheetStats || []).forEach((row: any) => {
          const p = unwrap(row.player);
          const prof = unwrap(p?.profile);
          const tm = unwrap(p?.team);
          if (compId && (row.competition_id !== compId && tm?.competition_id !== compId)) return;
          const cs = Number(row.clean_sheets) || 0;
          if (cs > 0 && (!best || cs > best.cleanSheets)) {
            const fullName = [prof?.first_name || p?.first_name, prof?.last_name || p?.last_name].filter(Boolean).join(' ') || 'Goalkeeper';
            best = {
              playerId: row.player_id,
              playerName: fullName,
              teamName: tm?.name || 'Campus Team',
              league: compId === CHAMP_ID ? 'Egerton Championships' : 'Egerton Premier League',
              cleanSheets: cs,
              streak: 1
            };
          }
        });
        return best;
      };

      const eplCleanSheets = getTopGK(EPL_ID);
      const champCleanSheets = getTopGK(CHAMP_ID);
      const goatCleanSheets = getTopGK() || eplCleanSheets || champCleanSheets || null;

      // 3. Fetch Most Assists directly from materialized player_stats table (updated by fn_process_match_statistics)
      let { data: assistStats } = await supabase
        .from('player_stats')
        .select(`
          player_id,
          competition_id,
          assists,
          player:players!player_id(
            id,
            first_name,
            last_name,
            profile:profiles!profile_id(first_name, last_name),
            team:teams!team_id(id, name, competition_id)
          )
        `)
        .gt('assists', 0)
        .order('assists', { ascending: false });

      // Fallback to match_events if player_stats assists is empty
      if (!assistStats || assistStats.length === 0) {
        try {
          const { data: evAssists } = await supabase
            .from('match_events')
            .select(`
              assist_player_id,
              fixture:fixtures!fixture_id(competition_id),
              player:players!assist_player_id(
                id,
                first_name,
                last_name,
                profile:profiles!profile_id(first_name, last_name),
                team:teams!team_id(id, name, competition_id)
              )
            `)
            .not('assist_player_id', 'is', null);

          if (evAssists && evAssists.length > 0) {
            const assistMap = new Map<string, { player: any; competition_id: string; assists: number }>();
            evAssists.forEach((ev: any) => {
              if (!ev.assist_player_id) return;
              const fix = unwrap(ev.fixture);
              const tm = unwrap(unwrap(ev.player)?.team);
              const compId = fix?.competition_id || tm?.competition_id || EPL_ID;
              const key = `${ev.assist_player_id}_${compId}`;
              const cur = assistMap.get(key);
              if (cur) {
                cur.assists += 1;
              } else {
                assistMap.set(key, { player: unwrap(ev.player), competition_id: compId, assists: 1 });
              }
            });
            assistStats = Array.from(assistMap.entries()).map(([k, v]) => ({
              player_id: k.split('_')[0],
              competition_id: v.competition_id,
              assists: v.assists,
              player: v.player
            }));
          }
        } catch {}
      }

      const getTopAssistPlayer = (compId?: string) => {
        let best: { playerId: string; playerName: string; teamName: string; league: string; assists: number; streak: number } | null = null;
        (assistStats || []).forEach((row: any) => {
          const p = unwrap(row.player);
          const prof = unwrap(p?.profile);
          const tm = unwrap(p?.team);
          if (compId && (row.competition_id !== compId && tm?.competition_id !== compId)) return;
          const ast = Number(row.assists) || 0;
          if (ast > 0 && (!best || ast > best.assists)) {
            const fullName = [prof?.first_name || p?.first_name, prof?.last_name || p?.last_name].filter(Boolean).join(' ') || 'Playmaker';
            best = {
              playerId: row.player_id,
              playerName: fullName,
              teamName: tm?.name || 'Campus Team',
              league: compId === CHAMP_ID ? 'Egerton Championships' : 'Egerton Premier League',
              assists: ast,
              streak: 1
            };
          }
        });
        return best;
      };

      const eplAssists = getTopAssistPlayer(EPL_ID);
      const champAssists = getTopAssistPlayer(CHAMP_ID);
      const goatAssists = getTopAssistPlayer() || eplAssists || champAssists || null;

      const performanceData = {
        epl: {
          topScorer: eplTopScorer,
          mostAssists: eplAssists,
          mostCleanSheets: eplCleanSheets
        },
        championship: {
          topScorer: champTopScorer,
          mostAssists: champAssists,
          mostCleanSheets: champCleanSheets
        },
        goats: {
          topScorer: goatScorer,
          mostAssists: goatAssists,
          mostCleanSheets: goatCleanSheets
        }
      };

      guestCache.set('performance', 'dual_perf', performanceData);
      return { success: true, data: performanceData };
    } catch (err) {
      return {
        success: true,
        data: {
          epl: { topScorer: null, mostAssists: null, mostCleanSheets: null },
          championship: { topScorer: null, mostAssists: null, mostCleanSheets: null },
          goats: { topScorer: null, mostAssists: null, mostCleanSheets: null }
        }
      };
    }
  },

  // --- LEAGUE MILESTONES ---
  async getLeagueMilestones(): Promise<ApiResponse<{
    highestScoringMatch: { homeTeam: string; awayTeam: string; scoreHome: number; scoreAway: number; totalGoals: number; league: string } | null;
    largestWinMargin: { winner: string; loser: string; scoreHome: number; scoreAway: number; margin: number; league: string } | null;
    totalGoalsScored: number;
    completedMatchesCount: number;
    cleanSheetsTotal: number;
  }>> {
    const cached = guestCache.get<any>('milestones', 'all_milestones');
    if (cached) return { success: true, data: cached };

    try {
      const { data: ftFixtures } = await supabase
        .from('fixtures')
        .select(`
          id, scheduled_time, score_home, score_away,
          competition:competitions(name),
          team_home:teams!fixtures_home_team_id_fkey(name),
          team_away:teams!fixtures_away_team_id_fkey(name)
        `)
        .eq('status', 'FT');

      if (!ftFixtures || ftFixtures.length === 0) {
        return {
          success: true,
          data: {
            highestScoringMatch: null,
            largestWinMargin: null,
            totalGoalsScored: 0,
            completedMatchesCount: 0,
            cleanSheetsTotal: 0
          }
        };
      }

      let highestScoreMatch: any = null;
      let largestMarginMatch: any = null;
      let totalGoals = 0;
      let cleanSheets = 0;

      ftFixtures.forEach((f: any) => {
        const home = unwrap(f.team_home);
        const away = unwrap(f.team_away);
        const comp = unwrap(f.competition);

        const matchTotal = (f.score_home || 0) + (f.score_away || 0);
        totalGoals += matchTotal;

        if (f.score_home === 0 || f.score_away === 0) {
          cleanSheets += 1;
        }

        if (!highestScoreMatch || matchTotal > (highestScoreMatch.totalGoals || 0)) {
          highestScoreMatch = {
            homeTeam: home?.name || 'Home',
            awayTeam: away?.name || 'Away',
            scoreHome: f.score_home,
            scoreAway: f.score_away,
            totalGoals: matchTotal,
            league: comp?.name || 'Egerton League'
          };
        }

        const margin = Math.abs((f.score_home || 0) - (f.score_away || 0));
        if (!largestMarginMatch || margin > (largestMarginMatch.margin || 0)) {
          const isHomeWinner = f.score_home > f.score_away;
          largestMarginMatch = {
            winner: isHomeWinner ? (home?.name || 'Home') : (away?.name || 'Away'),
            loser: isHomeWinner ? (away?.name || 'Away') : (home?.name || 'Home'),
            scoreHome: f.score_home,
            scoreAway: f.score_away,
            margin,
            league: comp?.name || 'Egerton League'
          };
        }
      });

      const result = {
        highestScoringMatch: highestScoreMatch,
        largestWinMargin: largestMarginMatch,
        totalGoalsScored: totalGoals,
        completedMatchesCount: ftFixtures.length,
        cleanSheetsTotal: cleanSheets
      };

      guestCache.set('milestones', 'all_milestones', result);
      return { success: true, data: result };
    } catch (err) {
      return {
        success: true,
        data: {
          highestScoringMatch: null,
          largestWinMargin: null,
          totalGoalsScored: 0,
          completedMatchesCount: 0,
          cleanSheetsTotal: 0
        }
      };
    }
  },

  // --- HISTORICAL STANDINGS ARCHIVE ---
  async getHistoricalStandings(seasonId?: string): Promise<ApiResponse<HistoricalSeasonStandings[]>> {
    try {
      return await executeWithRetry(async () => {
        let query = supabase
          .from('historical_standings')
          .select('season_id, position, team_name, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, archived_at');
        if (seasonId) {
          query = query.eq('season_id', seasonId);
        }

        const { data, error } = await query.order('position', { ascending: true });

        if (!error && data && data.length > 0) {
          const groupedMap = new Map<string, HistoricalSeasonStandings>();

          data.forEach((row: any) => {
            const sId = row.season_id || 'archived_season';
            if (!groupedMap.has(sId)) {
              groupedMap.set(sId, {
                seasonId: sId,
                seasonName: row.season_id,
                competitionName: 'Egerton Premier League',
                archivedAt: row.archived_at || new Date().toISOString(),
                entries: []
              });
            }

            groupedMap.get(sId)?.entries.push({
              position: row.position,
              teamId: row.team_id,
              teamName: row.team_name,
              teamLogo: row.team_logo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
              played: row.played,
              won: row.won,
              drawn: row.drawn,
              lost: row.lost,
              goalsFor: row.goals_for,
              goalsAgainst: row.goals_against,
              goalDifference: row.goal_difference,
              points: row.points,
              lastUpdated: row.archived_at
            });
          });

          return { success: true, data: Array.from(groupedMap.values()) };
        }

        return { success: true, data: [] };
      });
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- NEWS ---
  async getNews(options?: { page?: number; pageSize?: number; category?: string }): Promise<ApiResponse<NewsItem[]> & { total?: number; page?: number; pageSize?: number; totalPages?: number }> {
    const page = options?.page;
    const pageSize = options?.pageSize;
    const category = options?.category;
    const cacheKey = `${category || 'all'}_p${page || 'all'}_s${pageSize || 'all'}`;
    const cached = guestCache.get<NewsItem[]>('news', cacheKey);
    if (cached) return { success: true, data: cached };

    try {
      return await executeWithRetry(async () => {
        let query = supabase
          .from('news_articles')
          .select('id, title, excerpt, content, image_url, category, author_id, status, published_at, created_at, slug', { count: 'exact' })
          .eq('status', 'published');

        if (category && category !== 'ALL') {
          query = query.eq('category', category);
        }

        query = query.order('published_at', { ascending: false });

        if (page && pageSize) {
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          query = query.range(from, to);
        }

        const { data, count, error } = await query;

        if (error || !data || data.length === 0) {
          return { success: true, data: [] };
        }

        const articles: NewsItem[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          excerpt: item.excerpt,
          content: item.content,
          imageUrl: item.image_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
          publishedAt: new Date(item.published_at || item.created_at).toLocaleDateString(),
          author: 'Sports Journalist',
          authorRole: 'Official Journalist',
          verified: true,
          category: item.category || 'general',
          slug: item.slug
        }));

        guestCache.set('news', cacheKey, articles);
        const resp: any = { success: true, data: articles };
        if (count !== null && count !== undefined) resp.total = count;
        if (page) resp.page = page;
        if (pageSize) resp.pageSize = pageSize;
        if (count && pageSize) resp.totalPages = Math.ceil(count / pageSize);
        return resp;
      });
    } catch (err) {
      logger.warn('Failed to fetch news from Supabase.', { error: err });
      return { success: true, data: [] };
    }
  },

  // --- TEAMS PUBLIC SERVICE ---
  async getTeams(): Promise<ApiResponse<any[]>> {
    try {
      // 1. Primary join query using known constraint aliases
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          short_name,
          logo_url,
          color_code,
          status,
          rejection_reason,
          competition_id,
          coach:profiles!teams_coach_id_fkey (first_name, last_name),
          captain:profiles!teams_captain_id_fkey (first_name, last_name),
          competition:competitions!teams_competition_id_fkey (id, name, slug)
        `)
        .order('created_at', { ascending: true });

      let rawTeams: any[] = data || [];

      // 2. Resilient fallback query if constraint aliases encounter PostgREST schema ambiguity
      if (error || rawTeams.length === 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            short_name,
            logo_url,
            color_code,
            status,
            rejection_reason,
            competition_id
          `)
          .order('created_at', { ascending: true });

        if (fallbackError || !fallbackData) {
          return { success: true, data: [] };
        }
        rawTeams = fallbackData;
      }

      const formatted = (rawTeams || []).map((t: any) => {
        const coachProf = unwrap(t.coach);
        const captainProf = unwrap(t.captain);
        const comp = unwrap(t.competition);
        const isChampionship =
          t.competition_id === '22222222-2222-2222-2222-222222222222' ||
          comp?.slug?.includes('championship') ||
          comp?.name?.toLowerCase().includes('championship') ||
          t.name?.toLowerCase().includes('championship');

        return {
          id: t.id,
          name: t.name,
          shortName: t.short_name,
          competition_id: t.competition_id,
          logo: t.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
          colorCode: t.color_code || (isChampionship ? '#2563EB' : '#D4AF37'),
          coach: coachProf ? `${coachProf.first_name} ${coachProf.last_name}` : 'Assigned Head Coach',
          captain: captainProf ? `${captainProf.first_name} ${captainProf.last_name}` : 'Team Captain',
          division: isChampionship ? 'Egerton Championship' : 'Egerton Premier League',
          playerCount: 18,
          status: t.status || 'approved'
        };
      });

      return { success: true, data: formatted };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- PLAYERS PUBLIC SERVICE ---
  async getPlayers(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          jersey_number,
          position,
          profile:profiles!profile_id(first_name, last_name, avatar_url),
          team:teams!team_id(id, name, logo_url)
        `);

      if (!error && data) {
        const formatted = data.map((p: any) => {
          const prof = unwrap(p.profile);
          const tm = unwrap(p.team);
          return {
            id: p.id,
            name: prof ? `${prof.first_name} ${prof.last_name}` : 'Player',
            jerseyNumber: p.jersey_number,
            position: p.position,
            teamId: tm?.id,
            teamName: tm?.name,
            teamLogo: tm?.logo_url,
            photoUrl: prof?.avatar_url
          };
        });
        return { success: true, data: formatted };
      }

      return { success: true, data: [] };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- GLOBAL SEARCH ---
  async search(query: string): Promise<ApiResponse<any[]>> {
    const cleanQuery = query?.trim();
    if (!cleanQuery) {
      return { success: true, data: [] };
    }

    try {
      const { data, error } = await supabase.rpc('global_search', { query_text: cleanQuery });
      if (error || !data) {
        return { success: true, data: [] };
      }
      return { success: true, data };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- ANNOUNCEMENTS ---
  async getAnnouncements(page?: number, pageSize?: number, role?: string): Promise<ApiResponse<Announcement[]> & { total?: number; page?: number; totalPages?: number }> {
    try {
      return await executeWithRetry(async () => {
        let query = supabase
          .from('announcements')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (role && role !== 'all' && role !== 'admin' && role !== 'president') {
          // In the table, recipients/target_role column determines the read:
          // Users with this role read where recipient is 'all' or their selected role
          query = query.or(`target_role.eq.all,target_role.eq.${role}`);
        }

        if (page && pageSize) {
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          query = query.range(from, to);
        }

        const { data, count, error } = await query;

        if (error || !data) {
          return { success: true, data: [] };
        }
        const resp: any = { success: true, data };
        if (count !== null && count !== undefined) resp.total = count;
        if (page) resp.page = page;
        if (pageSize) resp.pageSize = pageSize;
        if (count && pageSize) resp.totalPages = Math.ceil(count / pageSize);
        return resp;
      });
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>): Promise<ApiResponse<Announcement>> {
    if (!announcement.title || !announcement.content) {
      return { success: false, data: null, message: 'Title and Content are required.' };
    }
    const recipientValue = announcement.recipients || announcement.target_role || 'all';
    try {
      const insertPayload: any = {
        title: sanitizeHtmlText(announcement.title),
        content: sanitizeHtmlText(announcement.content),
        target_role: recipientValue,
        recipients: recipientValue,
        target_team_id: announcement.target_team_id || null,
        author_id: announcement.author_id || null
      };
      let { data, error } = await supabase
        .from('announcements')
        .insert(insertPayload)
        .select()
        .single();

      // If remote table does not have recipients column yet (42703), retry without it
      if (error && (error.code === '42703' || error.message?.includes('recipients'))) {
        delete insertPayload.recipients;
        const retryRes = await supabase
          .from('announcements')
          .insert(insertPayload)
          .select()
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  // --- MATCH REPORTS & SQUAD REQUESTS ---
  async submitMatchReport(report: Omit<MatchReport, 'id' | 'submitted_at'>): Promise<ApiResponse<MatchReport>> {
    try {
      const { data, error } = await supabase.from('match_reports').insert(report).select().single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async submitSquadRequest(req: Omit<SquadRequest, 'id' | 'created_at'>): Promise<ApiResponse<SquadRequest>> {
    try {
      const { data, error } = await supabase.from('squad_requests').insert(req).select().single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  // --- AUDIT LOGGING ---
  async getAuditLogs(page = 1, pageSize = 50): Promise<ApiResponse<AuditLog[]> & { total?: number; page?: number; totalPages?: number }> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      const resp: any = { success: true, data: data || [] };
      if (count !== null && count !== undefined) resp.total = count;
      resp.page = page;
      resp.pageSize = pageSize;
      if (count) resp.totalPages = Math.ceil(count / pageSize);
      return resp;
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async logAuditAction(action: string, resourceType: string, resourceId: string, details: any): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      let userRole = 'guest';

      if (userId) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
        if (profile?.role) {
          userRole = profile.role;
        }
      }

      await supabase.from('audit_logs').insert({
        user_id: userId || null,
        user_role: userRole,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      logger.warn('Audit logging error:', { error: e });
    }
  },

  // --- PRE-SEASON & DASHBOARD MANAGEMENT MUTATIONS ---
  async getSeasons(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase.from('seasons').select('id, name, start_date, end_date, registration_cutoff, status, is_locked, created_at').order('created_at', { ascending: false });
      if (error || !data) return { success: true, data: [] };
      return { success: true, data };
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async createSeason(season: any): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.from('seasons').insert({
        name: sanitizeHtmlText(season.name),
        start_date: season.startDate || season.start_date || null,
        end_date: season.endDate || season.end_date || null,
        registration_cutoff: season.registrationCutoff || season.registration_cutoff || null,
        status: season.status || 'active',
        is_locked: Boolean(season.isLocked ?? season.is_locked ?? false)
      }).select().single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async updateSeasonStatus(seasonId: string, status: 'active' | 'inactive' | 'archived'): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('seasons')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', seasonId)
        .select()
        .single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async getLeagues(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, name, slug, country, season, logo_url, is_active, created_at')
        .order('created_at', { ascending: true });
      if (error || !data) return { success: true, data: [] };
      return { success: true, data };
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async createLeague(league: any): Promise<ApiResponse<any>> {
    try {
      this.invalidateCache();
      const slug = league.slug || league.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { data, error } = await supabase.from('competitions').insert({
        name: sanitizeHtmlText(league.name),
        slug,
        country: league.country || 'Kenya',
        season: league.season || '2026',
        is_active: true
      }).select().single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async updateLeagueStatus(leagueId: string, isActive: boolean): Promise<ApiResponse<any>> {
    try {
      this.invalidateCache();
      const { data, error } = await supabase
        .from('competitions')
        .update({ is_active: isActive })
        .eq('id', leagueId)
        .select()
        .single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async deleteLeague(leagueId: string): Promise<ApiResponse<any>> {
    try {
      this.invalidateCache();
      const { error } = await supabase.from('competitions').delete().eq('id', leagueId);
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data: { id: leagueId } };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async getPendingTeams(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          short_name,
          logo_url,
          color_code,
          status,
          competition_id,
          coach:profiles!coach_id(first_name, last_name),
          captain:profiles!captain_id(first_name, last_name),
          competition:competitions(name)
        `)
        .eq('status', 'pending');

      if (!error && data) {
        const formatted = data.map((t: any) => {
          const coachProf = unwrap(t.coach);
          const captainProf = unwrap(t.captain);
          const comp = unwrap(t.competition);
          return {
            id: t.id,
            name: t.name,
            code: t.short_name || 'EGA',
            requestedLeague: comp?.name?.toLowerCase().includes('championship') ? 'championship' : 'premier',
            division: comp?.name || 'Egerton Premier League',
            coachName: coachProf ? `${coachProf.first_name} ${coachProf.last_name}` : 'Registered Head Coach',
            coachAssigned: true,
            captainAssigned: Boolean(captainProf),
            playerCount: 18,
            doctorAssigned: true,
            submittedAt: 'Recently'
          };
        });
        return { success: true, data: formatted };
      }
      return { success: true, data: [] };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  async approveTeam(teamId: string, leagueId: string, _division?: string): Promise<ApiResponse<any>> {
    try {
      this.invalidateCache();
      const updatePayload: Record<string, any> = { status: 'approved' };
      if (leagueId && leagueId !== 'premier' && leagueId !== 'championship') {
        updatePayload.competition_id = leagueId;
      }
      const { data, error } = await supabase.from('teams').update(updatePayload).eq('id', teamId).select().single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async rejectTeam(teamId: string, reason: string): Promise<ApiResponse<any>> {
    try {
      this.invalidateCache();
      const { data, error } = await supabase.from('teams').update({ status: 'rejected', rejection_reason: sanitizeHtmlText(reason) }).eq('id', teamId).select().single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async updateUserProfile(userId: string, profileUpdates: any): Promise<ApiResponse<any>> {
    try {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (profileUpdates.firstName) payload.first_name = sanitizeHtmlText(profileUpdates.firstName);
      if (profileUpdates.lastName) payload.last_name = sanitizeHtmlText(profileUpdates.lastName);
      if (profileUpdates.phone) payload.phone = sanitizeHtmlText(profileUpdates.phone);

      const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select().single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async updateUserPassword(newPassword: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data: undefined };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async getReferees(): Promise<ApiResponse<any[]>> {
    try {
      const { data } = await supabase.from('referees').select('id, name, email, phone, badge_level, status, created_at').is('deleted_at', null);
      return { success: true, data: data || [] };
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async createReferee(referee: { name: string; email?: string; phone: string; badge_level?: string }): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.from('referees').insert({
        name: sanitizeHtmlText(referee.name),
        email: referee.email ? sanitizeHtmlText(referee.email) : null,
        phone: sanitizeHtmlText(referee.phone),
        badge_level: referee.badge_level ? sanitizeHtmlText(referee.badge_level) : 'FKF Level 2',
        status: 'Active'
      }).select().single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async updateRefereeStatus(id: string, status: 'Active' | 'Suspended' | 'Deactivated'): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.from('referees').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  async deleteReferee(id: string): Promise<ApiResponse<any>> {
    try {
      await supabase.from('referees').update({ deleted_at: new Date().toISOString(), status: 'Deactivated' }).eq('id', id);
      return { success: true, data: { id } };
    } catch (err) {
      return { success: true, data: { id } };
    }
  },

  async getArticleGallery(): Promise<ApiResponse<any[]>> {
    try {
      const { data } = await supabase.from('article_gallery').select('*').order('created_at', { ascending: false });
      return { success: true, data: data || [] };
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async uploadGalleryImage(imageUrl: string, caption?: string, isFeatured?: boolean): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.from('article_gallery').insert({
        image_url: imageUrl,
        caption: caption ? sanitizeHtmlText(caption) : null,
        is_featured: isFeatured || false
      }).select().single();
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, data: null, message: classifyError(err).userMessage };
    }
  },

  // --- SEASON LAUNCH FIXTURES & CHAMPIONSHIP SEEDING ---
  async seedChampionshipTeamsIfMissing(): Promise<ApiResponse<any[]>> {
    try {
      const champCompId = '22222222-2222-2222-2222-222222222222';
      const { data: existing } = await supabase
        .from('teams')
        .select('*')
        .eq('competition_id', champCompId)
        .is('deleted_at', null);

      if (existing && existing.length >= 2) {
        return { success: true, data: existing };
      }

      const demoTeams = [
        { id: 'c1111111-1111-1111-1111-111111111111', competition_id: champCompId, name: 'Championship FC Alpha', short_name: 'CHP-A', color_code: '#10B981', status: 'approved' },
        { id: 'c2222222-2222-2222-2222-222222222222', competition_id: champCompId, name: 'Championship FC Beta', short_name: 'CHP-B', color_code: '#6366F1', status: 'approved' },
        { id: 'c3333333-3333-3333-3333-333333333333', competition_id: champCompId, name: 'Championship FC Gamma', short_name: 'CHP-C', color_code: '#F59E0B', status: 'approved' },
        { id: 'c4444444-4444-4444-4444-444444444444', competition_id: champCompId, name: 'Championship FC Delta', short_name: 'CHP-D', color_code: '#EC4899', status: 'approved' }
      ];

      const { data: inserted, error } = await supabase
        .from('teams')
        .upsert(demoTeams, { onConflict: 'id' })
        .select();

      this.invalidateCache();
      if (error) {
        logger.warn('Championship seeding note:', { error: error.message });
      }
      return { success: true, data: inserted || demoTeams };
    } catch (err: any) {
      return { success: true, data: [] };
    }
  },

  async saveConfirmedFixtures(fixtures: Array<{
    competition_id: string;
    home_team_id: string;
    away_team_id: string;
    scheduled_time: string;
    venue?: string;
    referee_id?: string | null;
    matchday?: number;
  }>): Promise<ApiResponse<{ insertedCount: number }>> {
    if (!fixtures || fixtures.length === 0) {
      return { success: false, data: null, message: 'No fixtures provided for submission.' };
    }

    try {
      this.invalidateCache();
      const { data: existingDbFixtures } = await supabase
        .from('fixtures')
        .select('home_team_id, away_team_id, scheduled_time, competition_id')
        .is('deleted_at', null);

      const existingSet = new Set(
        (existingDbFixtures || []).map(
          (f: any) => `${f.home_team_id}_${f.away_team_id}_${new Date(f.scheduled_time).toISOString()}`
        )
      );

      const cleanPayload = fixtures
        .filter((f) => {
          const key = `${f.home_team_id}_${f.away_team_id}_${new Date(f.scheduled_time).toISOString()}`;
          return !existingSet.has(key);
        })
        .map((f) => ({
          competition_id: f.competition_id,
          home_team_id: f.home_team_id,
          away_team_id: f.away_team_id,
          scheduled_time: new Date(f.scheduled_time).toISOString(),
          venue: f.venue || '',
          referee_id: f.referee_id || null,
          matchday: f.matchday || 1,
          status: 'UPCOMING',
          score_home: 0,
          score_away: 0
        }));

      if (cleanPayload.length === 0) {
        return { success: false, data: { insertedCount: 0 }, message: 'All fixtures already exist in the database.' };
      }

      const { data: insertedData, error } = await supabase
        .from('fixtures')
        .insert(cleanPayload)
        .select('id');

      if (error) {
        logger.error('Error inserting fixtures batch to database:', error);
        return { success: false, data: null, message: `Database error: ${error.message}` };
      }

      await this.logAuditAction('CONFIRM_SEASON_FIXTURES', 'fixtures', 'season-launch', {
        insertedCount: insertedData?.length || cleanPayload.length
      });

      return {
        success: true,
        data: { insertedCount: insertedData?.length || cleanPayload.length },
        message: `Successfully published ${insertedData?.length || cleanPayload.length} fixtures to database!`
      };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  }
};
