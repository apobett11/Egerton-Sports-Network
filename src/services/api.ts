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
  Player
} from '../types';
import { calculateLeagueStandings } from '../lib/leagueEngine';
import { executeWithRetry } from '../lib/retryPolicy';
import { logger } from '../lib/logger';
import { classifyError } from '../lib/apiErrorHandler';
import { sanitizeHtmlText } from '../lib/storageUtils';
import { guestCache } from '../lib/guestCache';

// Helper for unwrapping Supabase joins (object vs 1-element array)
const unwrap = (val: any) => (Array.isArray(val) ? val[0] : val);

// In-Memory Session Cache for static data deduplication
let cachedTeams: any[] | null = null;
let cachedLeagues: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 1 minute TTL

const DEFAULT_FIXTURES: Match[] = [
  {
    id: 'f1111111-1111-1111-1111-111111111111',
    status: 'UPCOMING',
    time: '14:00',
    minute: '-',
    league: 'Egerton Premier League',
    teamA: {
      id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Sharklets FC',
      shortName: 'SHK',
      logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
      colorCode: '#D4AF37'
    },
    teamB: {
      id: 'a2222222-2222-2222-2222-222222222222',
      name: 'Faculty of Arts',
      shortName: 'FOA',
      logo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
      colorCode: '#2563EB'
    },
    scoreA: 0,
    scoreB: 0,
    venue: 'Egerton Pavilion Stadium',
    referee: 'Official Referee',
    matchday: 5,
    events: [],
    stats: [],
    lineups: { teamA: [], teamB: [], formationA: '4-3-3', formationB: '4-3-3' }
  },
  {
    id: 'f2222222-2222-2222-2222-222222222222',
    status: 'FT',
    time: '16:00',
    minute: 'FT',
    league: 'Egerton Premier League',
    teamA: {
      id: 'a3333333-3333-3333-3333-333333333333',
      name: 'Faculty of Science',
      shortName: 'FOS',
      logo: 'https://images.unsplash.com/photo-1543351611-c823948c2a50?w=100&auto=format&fit=crop&q=80',
      colorCode: '#10B981'
    },
    teamB: {
      id: 'a4444444-4444-4444-4444-444444444444',
      name: 'Njoro FC',
      shortName: 'NJR',
      logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=80',
      colorCode: '#EF4444'
    },
    scoreA: 2,
    scoreB: 1,
    venue: 'Main Campus Pitch A',
    referee: 'Official Referee',
    matchday: 4,
    events: [],
    stats: [],
    lineups: { teamA: [], teamB: [], formationA: '4-3-3', formationB: '4-3-3' }
  },
  {
    id: 'f4444444-4444-4444-4444-444444444444',
    status: 'UPCOMING',
    time: '15:30',
    minute: '-',
    league: 'Egerton Championships',
    teamA: {
      id: 'c1111111-1111-1111-1111-111111111111',
      name: 'Championship FC Alpha',
      shortName: 'CHP-A',
      logo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=100&auto=format&fit=crop&q=80',
      colorCode: '#10B981'
    },
    teamB: {
      id: 'c2222222-2222-2222-2222-222222222222',
      name: 'Championship FC Beta',
      shortName: 'CHP-B',
      logo: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=100&auto=format&fit=crop&q=80',
      colorCode: '#6366F1'
    },
    scoreA: 0,
    scoreB: 0,
    venue: 'Sports Complex Arena 2',
    referee: 'Official Referee',
    matchday: 4,
    events: [],
    stats: [],
    lineups: { teamA: [], teamB: [], formationA: '4-3-3', formationB: '4-3-3' }
  },
  {
    id: 'f5555555-5555-5555-5555-555555555555',
    status: 'FT',
    time: '11:00',
    minute: 'FT',
    league: 'Egerton Championships',
    teamA: {
      id: 'c3333333-3333-3333-3333-333333333333',
      name: 'Championship FC Gamma',
      shortName: 'CHP-C',
      logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80',
      colorCode: '#F59E0B'
    },
    teamB: {
      id: 'c4444444-4444-4444-4444-444444444444',
      name: 'Championship FC Delta',
      shortName: 'CHP-D',
      logo: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=100&auto=format&fit=crop&q=80',
      colorCode: '#EC4899'
    },
    scoreA: 3,
    scoreB: 0,
    venue: 'Njoro Ground 1',
    referee: 'Official Referee',
    matchday: 3,
    events: [],
    stats: [],
    lineups: { teamA: [], teamB: [], formationA: '4-3-3', formationB: '4-3-3' }
  }
];

export const ApiService = {
  // Clear in-memory cache when data changes
  invalidateCache(): void {
    cachedTeams = null;
    cachedLeagues = null;
    cacheTimestamp = 0;
  },

  // --- FIXTURES ---
  async getFixtures(competitionId?: string, selectedDate?: string): Promise<ApiResponse<Match[]>> {
    const cacheKey = `${competitionId || 'all'}_${selectedDate || 'all'}`;
    const cached = guestCache.get<Match[]>('fixtures', cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    try {
      return await executeWithRetry(async () => {
        let query = supabase
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
            verified_by_referee_id,
            competition:competitions(id, name),
            team_home:teams!home_team_id(id, name, short_name, logo_url, color_code),
            team_away:teams!away_team_id(id, name, short_name, logo_url, color_code)
          `);

        if (competitionId) {
          query = query.eq('competition_id', competitionId);
        }

        if (selectedDate) {
          const startOfDay = new Date(selectedDate);
          startOfDay.setUTCHours(0, 0, 0, 0);
          const endOfDay = new Date(selectedDate);
          endOfDay.setUTCHours(23, 59, 59, 999);
          query = query.gte('scheduled_time', startOfDay.toISOString()).lte('scheduled_time', endOfDay.toISOString());
        }

        const { data, error } = await query.order('scheduled_time', { ascending: true });

        if (error || !data || data.length === 0) {
          if (error) logger.warn('Error fetching fixtures from Supabase:', { error });
          // If filtering by specific date yielded empty result, return empty list cleanly
          const fallback = selectedDate ? [] : DEFAULT_FIXTURES;
          return { success: true, data: fallback };
        }

        const formattedMatches: Match[] = data.map((f: any) => {
          const comp = unwrap(f.competition);
          const home = unwrap(f.team_home);
          const away = unwrap(f.team_away);

          return {
            id: f.id,
            status: f.status as MatchStatus,
            time: new Date(f.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            minute: f.status === 'LIVE' ? "65'" : f.status === 'FT' ? "FT" : "-",
            league: comp?.name || 'Egerton Premier League',
            teamA: {
              id: home?.id || '',
              name: home?.name || 'Home Team',
              shortName: home?.short_name || 'HOM',
              logo: home?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
              colorCode: home?.color_code || '#D4AF37'
            },
            teamB: {
              id: away?.id || '',
              name: away?.name || 'Away Team',
              shortName: away?.short_name || 'AWY',
              logo: away?.logo_url || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
              colorCode: away?.color_code || '#2563EB'
            },
            scoreA: f.score_home || 0,
            scoreB: f.score_away || 0,
            events: [],
            stats: [],
            lineups: {
              teamA: [],
              teamB: [],
              formationA: '4-3-3',
              formationB: '4-3-3'
            },
            venue: f.venue || 'Egerton Pavilion Stadium',
            referee: 'Official Referee',
            refereeId: f.referee_id,
            attendance: f.attendance,
            weather: f.weather,
            matchday: f.matchday,
            homePenaltyScore: f.home_penalty_score,
            awayPenaltyScore: f.away_penalty_score,
            verifiedByRefereeId: f.verified_by_referee_id
          };
        });

        guestCache.set('fixtures', cacheKey, formattedMatches);
        return { success: true, data: formattedMatches };
      });
    } catch (err) {
      logger.warn('Failed to fetch fixtures from Supabase.', { error: err });
      return { success: true, data: DEFAULT_FIXTURES };
    }
  },

  // --- MATCH DETAILS (FETCH COMPLETE MATCH RECORD FROM DB) ---
  async getMatchDetails(fixtureId: string): Promise<ApiResponse<Match>> {
    if (!fixtureId) {
      return { success: false, data: null, message: 'Fixture ID is required.' };
    }

    const cached = guestCache.get<Match>('match_details', fixtureId);
    if (cached) return { success: true, data: cached };

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
          team_home:teams!home_team_id(id, name, short_name, logo_url, color_code),
          team_away:teams!away_team_id(id, name, short_name, logo_url, color_code),
          referee_prof:profiles!referee_id(first_name, last_name),
          ar1_prof:profiles!assistant_referee_1_id(first_name, last_name),
          ar2_prof:profiles!assistant_referee_2_id(first_name, last_name),
          fo_prof:profiles!fourth_official_id(first_name, last_name)
        `)
        .eq('id', fixtureId)
        .single();

      if (fixErr || !f) {
        return { success: false, data: null, message: 'Match not found.' };
      }

      const comp = unwrap(f.competition);
      const home = unwrap(f.team_home);
      const away = unwrap(f.team_away);
      const refProf = unwrap(f.referee_prof);
      const ar1Prof = unwrap(f.ar1_prof);
      const ar2Prof = unwrap(f.ar2_prof);
      const foProf = unwrap(f.fo_prof);

      // Fetch Stored Match Events
      const { data: eventsData } = await supabase
        .from('match_events')
        .select('*')
        .eq('fixture_id', fixtureId)
        .order('minute', { ascending: true });

      const events: MatchEvent[] = (eventsData || []).map((e: any) => ({
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

      // Fetch Stored Match Lineups
      const { data: lineupsData } = await supabase
        .from('match_lineups')
        .select('*')
        .eq('fixture_id', fixtureId);

      let teamAPlayers: Player[] = [];
      let teamBPlayers: Player[] = [];
      let formationA = '4-3-3';
      let formationB = '4-3-3';
      let captainNotesA = '';
      let captainNotesB = '';

      if (lineupsData && lineupsData.length > 0) {
        const lineupHome = lineupsData.find((l: any) => l.team_id === home?.id);
        const lineupAway = lineupsData.find((l: any) => l.team_id === away?.id);

        if (lineupHome) {
          formationA = lineupHome.formation || '4-3-3';
          captainNotesA = lineupHome.captain_notes || '';
          const starters = (lineupHome.starting_xi || []).map((p: any) => ({ ...p, isSub: false }));
          const subs = (lineupHome.substitutes || []).map((p: any) => ({ ...p, isSub: true }));
          teamAPlayers = [...starters, ...subs];
        }

        if (lineupAway) {
          formationB = lineupAway.formation || '4-3-3';
          captainNotesB = lineupAway.captain_notes || '';
          const starters = (lineupAway.starting_xi || []).map((p: any) => ({ ...p, isSub: false }));
          const subs = (lineupAway.substitutes || []).map((p: any) => ({ ...p, isSub: true }));
          teamBPlayers = [...starters, ...subs];
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

      const refName = refProf ? `${refProf.first_name} ${refProf.last_name}`.trim() : 'Unassigned Referee';
      const ar1Name = ar1Prof ? `${ar1Prof.first_name} ${ar1Prof.last_name}`.trim() : undefined;
      const ar2Name = ar2Prof ? `${ar2Prof.first_name} ${ar2Prof.last_name}`.trim() : undefined;
      const foName = foProf ? `${foProf.first_name} ${foProf.last_name}`.trim() : undefined;

      const matchDetail: Match = {
        id: f.id,
        status: f.status as MatchStatus,
        time: new Date(f.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        minute: f.status === 'LIVE' ? "65'" : f.status === 'FT' ? "FT" : "-",
        league: comp?.name || 'Egerton League',
        season: comp?.season,
        teamA: {
          id: home?.id || '',
          name: home?.name || 'Home Team',
          shortName: home?.short_name || 'HOM',
          logo: home?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
          colorCode: home?.color_code || '#D4AF37'
        },
        teamB: {
          id: away?.id || '',
          name: away?.name || 'Away Team',
          shortName: away?.short_name || 'AWY',
          logo: away?.logo_url || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
          colorCode: away?.color_code || '#2563EB'
        },
        scoreA: f.score_home || 0,
        scoreB: f.score_away || 0,
        events,
        stats,
        lineups: {
          teamA: teamAPlayers,
          teamB: teamBPlayers,
          formationA,
          formationB
        },
        venue: f.venue || 'Egerton Main Stadium',
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
    }>;
  }): Promise<ApiResponse<any>> {
    if (!params.fixtureId || !params.refereeId) {
      return { success: false, data: null, message: 'Validation Error: Fixture ID and Referee ID required.' };
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || params.refereeId;

      const fullReportText = [
        sanitizeHtmlText(params.reportText),
        params.attendance ? `Attendance: ${params.attendance}` : '',
        params.weather ? `Weather: ${sanitizeHtmlText(params.weather)}` : '',
        params.incidents ? `Incidents: ${sanitizeHtmlText(params.incidents)}` : ''
      ].filter(Boolean).join('\n\n');

      await supabase.from('match_reports').insert({
        fixture_id: params.fixtureId,
        official_id: currentUserId,
        official_role: 'referee',
        report_text: fullReportText,
        submitted_at: new Date().toISOString()
      });

      if (params.officialEvents && params.officialEvents.length > 0) {
        for (const evt of params.officialEvents) {
          await supabase.from('match_events').insert({
            fixture_id: params.fixtureId,
            minute: Math.max(0, evt.minute),
            type: evt.type,
            event_target: evt.eventTarget,
            team_id: evt.teamId || null,
            player_id: evt.playerId || null,
            detail_text: sanitizeHtmlText(evt.detailText) || null,
            is_official: true,
            created_by: currentUserId
          });
        }
      }

      const { data: updatedFixture } = await supabase
        .from('fixtures')
        .update({
          score_home: Math.max(0, params.scoreHome),
          score_away: Math.max(0, params.scoreAway),
          status: params.status || 'FT',
          verified_by_referee_id: currentUserId,
          referee_verification_status: 'VERIFIED'
        })
        .eq('id', params.fixtureId)
        .select()
        .single();

      await this.logAuditAction('OFFICIAL_MATCH_RESULT_VERIFIED', 'fixtures', params.fixtureId, { scoreHome: params.scoreHome, scoreAway: params.scoreAway });
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
          team_home:teams!home_team_id(id, name),
          team_away:teams!away_team_id(id, name)
        `)
        .eq('status', 'FT')
        .or(`and(home_team_id.eq.${teamAId},away_team_id.eq.${teamBId}),and(home_team_id.eq.${teamBId},away_team_id.eq.${teamAId})`)
        .order('scheduled_time', { ascending: false })
        .limit(10);

      if (error || !data) {
        return { success: true, data: [] };
      }

      const h2h = data.map((f: any) => {
        const home = unwrap(f.team_home);
        const away = unwrap(f.team_away);
        const isHomeA = home?.id === teamAId;
        const scoreA = isHomeA ? f.score_home : f.score_away;
        const scoreB = isHomeA ? f.score_away : f.score_home;
        let winner = 'Draw';
        if (scoreA > scoreB) winner = home?.name || 'Team A';
        else if (scoreB > scoreA) winner = away?.name || 'Team B';

        return {
          id: f.id,
          date: new Date(f.scheduled_time).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }),
          scoreA,
          scoreB,
          winner,
          venue: f.venue || 'Campus Stadium'
        };
      });

      return { success: true, data: h2h };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- TEAM RECENT FORM (LAST 5 MATCHES) ---
  async getTeamForm(teamId: string): Promise<ApiResponse<Array<{ result: 'W' | 'D' | 'L'; label: string }>>> {
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
          team_home:teams!home_team_id(name),
          team_away:teams!away_team_id(name)
        `)
        .eq('status', 'FT')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('scheduled_time', { ascending: false })
        .limit(6);

      if (error || !data) {
        return { success: true, data: [] };
      }

      const form = data.map((f: any) => {
        const home = unwrap(f.team_home);
        const away = unwrap(f.team_away);
        const isHome = f.home_team_id === teamId;
        const goalsFor = isHome ? f.score_home : f.score_away;
        const goalsAgainst = isHome ? f.score_away : f.score_home;
        const opponentName = isHome ? away?.name : home?.name;

        let result: 'W' | 'D' | 'L' = 'D';
        if (goalsFor > goalsAgainst) result = 'W';
        else if (goalsFor < goalsAgainst) result = 'L';

        return {
          result,
          label: `${result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'} vs ${opponentName} (${goalsFor}-${goalsAgainst})`
        };
      });

      return { success: true, data: form };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- LEAGUE TABLE ENGINE ---
  async getLeagueTable(
    competitionId?: string,
    fixturesOverride?: Match[],
    previousStandings?: LeagueTableEntry[]
  ): Promise<ApiResponse<LeagueTableEntry[]>> {
    try {
      if (competitionId) {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_league_standings', {
          p_competition_id: competitionId
        });

        if (!rpcErr && rpcData && rpcData.length > 0) {
          const timestamp = new Date().toISOString();
          const entries: LeagueTableEntry[] = rpcData.map((row: any) => ({
            position: Number(row.position),
            teamId: row.team_id,
            teamName: row.team_name,
            teamLogo: row.team_logo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
            played: Number(row.played),
            won: Number(row.won),
            drawn: Number(row.drawn),
            lost: Number(row.lost),
            goalsFor: Number(row.goals_for),
            goalsAgainst: Number(row.goals_against),
            goalDifference: Number(row.goal_difference),
            points: Number(row.points),
            lastUpdated: timestamp
          }));

          return { success: true, data: entries };
        }
      }

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
  async getTopScorers(competitionId?: string): Promise<ApiResponse<Array<{
    playerId: string;
    playerName: string;
    teamName: string;
    teamLogo: string;
    goals: number;
  }>>> {
    try {
      const { data, error } = await supabase.rpc('get_top_scorers', {
        p_competition_id: competitionId || null,
        p_limit: 10
      });

      if (!error && data && data.length > 0) {
        const scorers = data.map((row: any) => ({
          playerId: row.player_id,
          playerName: row.player_name,
          teamName: row.team_name,
          teamLogo: row.team_logo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
          goals: Number(row.goals)
        }));
        return { success: true, data: scorers };
      }

      return { success: true, data: [] };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- DUAL PLAYER PERFORMANCE & GOATS ---
  async getDualPlayerPerformance(): Promise<ApiResponse<{
    epl: {
      topScorer: { playerId: string; playerName: string; teamName: string; league: string; goals: number };
      mostAssists: { playerId: string; playerName: string; teamName: string; league: string; assists: number };
      mostCleanSheets: { playerId: string; playerName: string; teamName: string; league: string; cleanSheets: number };
    };
    championship: {
      topScorer: { playerId: string; playerName: string; teamName: string; league: string; goals: number };
      mostAssists: { playerId: string; playerName: string; teamName: string; league: string; assists: number };
      mostCleanSheets: { playerId: string; playerName: string; teamName: string; league: string; cleanSheets: number };
    };
    goats: {
      topScorer: { playerId: string; playerName: string; teamName: string; league: string; goals: number };
      mostAssists: { playerId: string; playerName: string; teamName: string; league: string; assists: number };
      mostCleanSheets: { playerId: string; playerName: string; teamName: string; league: string; cleanSheets: number };
    };
  }>> {
    const cached = guestCache.get<any>('performance', 'dual_perf');
    if (cached) return { success: true, data: cached };

    try {
      const EPL_ID = '11111111-1111-1111-1111-111111111111';
      const CHAMP_ID = '22222222-2222-2222-2222-222222222222';

      // 1. Fetch Top Scorers via RPC
      const [eplScorersRes, champScorersRes, goatsScorersRes] = await Promise.all([
        this.getTopScorers(EPL_ID),
        this.getTopScorers(CHAMP_ID),
        this.getTopScorers()
      ]);

      // 2. Fetch Clean Sheets Mathematically from Completed Fixtures
      const { data: ftFixtures } = await supabase
        .from('fixtures')
        .select('competition_id, home_team_id, away_team_id, score_home, score_away')
        .eq('status', 'FT');

      const teamCleanSheetsMap: Record<string, number> = {};
      (ftFixtures || []).forEach((f: any) => {
        if (f.score_away === 0 && f.home_team_id) {
          teamCleanSheetsMap[f.home_team_id] = (teamCleanSheetsMap[f.home_team_id] || 0) + 1;
        }
        if (f.score_home === 0 && f.away_team_id) {
          teamCleanSheetsMap[f.away_team_id] = (teamCleanSheetsMap[f.away_team_id] || 0) + 1;
        }
      });

      const { data: gks } = await supabase
        .from('players')
        .select(`
          id,
          team_id,
          profile:profiles!profile_id(first_name, last_name),
          team:teams!team_id(id, name, competition_id)
        `)
        .eq('position', 'GK');

      const getTopGK = (compId?: string) => {
        let best: { playerId: string; playerName: string; teamName: string; league: string; cleanSheets: number } | null = null;
        (gks || []).forEach((gk: any) => {
          const tm = unwrap(gk.team);
          const prof = unwrap(gk.profile);
          if (compId && tm?.competition_id !== compId) return;
          const csCount = teamCleanSheetsMap[gk.team_id] || 0;
          if (!best || csCount > best.cleanSheets) {
            best = {
              playerId: gk.id,
              playerName: prof ? `${prof.first_name} ${prof.last_name}` : 'Goalkeeper',
              teamName: tm?.name || 'Campus Team',
              league: compId === CHAMP_ID ? 'Egerton Championships' : 'Egerton Premier League',
              cleanSheets: csCount
            };
          }
        });
        return best;
      };

      // 3. Query Assists from match_events
      const { data: assistRows } = await supabase
        .from('match_events')
        .select(`
          assist_player_id,
          player:players!assist_player_id(
            id,
            team_id,
            profile:profiles!profile_id(first_name, last_name),
            team:teams!team_id(id, name, competition_id)
          )
        `)
        .not('assist_player_id', 'is', null);

      const assistCountsMap: Record<string, { player: any; count: number }> = {};
      (assistRows || []).forEach((row: any) => {
        const pId = row.assist_player_id;
        if (!pId) return;
        if (!assistCountsMap[pId]) {
          assistCountsMap[pId] = { player: unwrap(row.player), count: 0 };
        }
        assistCountsMap[pId].count += 1;
      });

      const getTopAssistPlayer = (compId?: string) => {
        let best: { playerId: string; playerName: string; teamName: string; league: string; assists: number } | null = null;
        Object.values(assistCountsMap).forEach(({ player, count }) => {
          if (!player) return;
          const tm = unwrap(player.team);
          const prof = unwrap(player.profile);
          if (compId && tm?.competition_id !== compId) return;
          if (!best || count > best.assists) {
            best = {
              playerId: player.id,
              playerName: prof ? `${prof.first_name} ${prof.last_name}` : 'Midfielder',
              teamName: tm?.name || 'Campus Team',
              league: compId === CHAMP_ID ? 'Egerton Championships' : 'Egerton Premier League',
              assists: count
            };
          }
        });
        return best;
      };

      const eplTopScorer = eplScorersRes.data?.[0] ? {
        playerId: eplScorersRes.data[0].playerId,
        playerName: eplScorersRes.data[0].playerName,
        teamName: eplScorersRes.data[0].teamName,
        league: 'Egerton Premier League',
        goals: eplScorersRes.data[0].goals
      } : {
        playerId: 'epl-1',
        playerName: 'Victor Wanyama',
        teamName: 'Sharklets FC',
        league: 'Egerton Premier League',
        goals: 12
      };

      const champTopScorer = champScorersRes.data?.[0] ? {
        playerId: champScorersRes.data[0].playerId,
        playerName: champScorersRes.data[0].playerName,
        teamName: champScorersRes.data[0].teamName,
        league: 'Egerton Championships',
        goals: champScorersRes.data[0].goals
      } : {
        playerId: 'ch-1',
        playerName: 'Brian Omondi',
        teamName: 'Championship FC Alpha',
        league: 'Egerton Championships',
        goals: 9
      };

      const goatScorer = goatsScorersRes.data?.[0] ? {
        playerId: goatsScorersRes.data[0].playerId,
        playerName: goatsScorersRes.data[0].playerName,
        teamName: goatsScorersRes.data[0].teamName,
        league: 'Egerton Premier League',
        goals: goatsScorersRes.data[0].goals
      } : eplTopScorer;

      const eplAssists = getTopAssistPlayer(EPL_ID) || {
        playerId: 'epl-ast-1',
        playerName: 'Michael Olunga',
        teamName: 'Faculty of Arts',
        league: 'Egerton Premier League',
        assists: 8
      };

      const champAssists = getTopAssistPlayer(CHAMP_ID) || {
        playerId: 'ch-ast-1',
        playerName: 'Kevin Kimani',
        teamName: 'Championship FC Beta',
        league: 'Egerton Championships',
        assists: 6
      };

      const goatAssists = getTopAssistPlayer() || eplAssists;

      const eplCleanSheets = getTopGK(EPL_ID) || {
        playerId: 'epl-cs-1',
        playerName: 'Patrick Matasi',
        teamName: 'Sharklets FC',
        league: 'Egerton Premier League',
        cleanSheets: 7
      };

      const champCleanSheets = getTopGK(CHAMP_ID) || {
        playerId: 'ch-cs-1',
        playerName: 'Farouk Shikhalo',
        teamName: 'Championship FC Gamma',
        league: 'Egerton Championships',
        cleanSheets: 5
      };

      const goatCleanSheets = getTopGK() || eplCleanSheets;

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
          epl: {
            topScorer: { playerId: '1', playerName: 'Victor Wanyama', teamName: 'Sharklets FC', league: 'Egerton Premier League', goals: 12 },
            mostAssists: { playerId: '2', playerName: 'Michael Olunga', teamName: 'Faculty of Arts', league: 'Egerton Premier League', assists: 8 },
            mostCleanSheets: { playerId: '3', playerName: 'Patrick Matasi', teamName: 'Sharklets FC', league: 'Egerton Premier League', cleanSheets: 7 }
          },
          championship: {
            topScorer: { playerId: '4', playerName: 'Brian Omondi', teamName: 'Championship FC Alpha', league: 'Egerton Championships', goals: 9 },
            mostAssists: { playerId: '5', playerName: 'Kevin Kimani', teamName: 'Championship FC Beta', league: 'Egerton Championships', assists: 6 },
            mostCleanSheets: { playerId: '6', playerName: 'Farouk Shikhalo', teamName: 'Championship FC Gamma', league: 'Egerton Championships', cleanSheets: 5 }
          },
          goats: {
            topScorer: { playerId: '1', playerName: 'Victor Wanyama', teamName: 'Sharklets FC', league: 'Egerton Premier League', goals: 12 },
            mostAssists: { playerId: '2', playerName: 'Michael Olunga', teamName: 'Faculty of Arts', league: 'Egerton Premier League', assists: 8 },
            mostCleanSheets: { playerId: '3', playerName: 'Patrick Matasi', teamName: 'Sharklets FC', league: 'Egerton Premier League', cleanSheets: 7 }
          }
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
          team_home:teams!home_team_id(name),
          team_away:teams!away_team_id(name)
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
        let query = supabase.from('historical_standings').select('*');
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
  async getNews(): Promise<ApiResponse<NewsItem[]>> {
    const cached = guestCache.get<NewsItem[]>('news', 'all_published');
    if (cached) return { success: true, data: cached };

    try {
      return await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('news_articles')
          .select('*')
          .eq('status', 'published')
          .order('is_pinned', { ascending: false })
          .order('published_at', { ascending: false });

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
          author: item.author || 'Sports Journalist',
          authorRole: item.author_role || 'Official Journalist',
          verified: true,
          category: item.category || 'general',
          slug: item.slug
        }));

        guestCache.set('news', 'all_published', articles);
        return { success: true, data: articles };
      });
    } catch (err) {
      logger.warn('Failed to fetch news from Supabase.', { error: err });
      return { success: true, data: [] };
    }
  },

  // --- TEAMS PUBLIC SERVICE ---
  async getTeams(): Promise<ApiResponse<any[]>> {
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
          rejection_reason,
          coach:profiles!coach_id(first_name, last_name),
          captain:profiles!captain_id(first_name, last_name),
          competition:competitions(name)
        `);

      if (!error && data) {
        const formatted = data.map((t: any) => {
          const coachProf = unwrap(t.coach);
          const captainProf = unwrap(t.captain);
          const comp = unwrap(t.competition);

          return {
            id: t.id,
            name: t.name,
            shortName: t.short_name,
            logo: t.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
            colorCode: t.color_code || '#D4AF37',
            coach: coachProf ? `${coachProf.first_name} ${coachProf.last_name}` : 'Unassigned Coach',
            captain: captainProf ? `${captainProf.first_name} ${captainProf.last_name}` : 'Unassigned Captain',
            division: comp?.name || 'Egerton Premier League'
          };
        });

        return { success: true, data: formatted };
      }

      return { success: true, data: [] };
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
  async getAnnouncements(): Promise<ApiResponse<Announcement[]>> {
    try {
      return await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error || !data) {
          return { success: true, data: [] };
        }
        return { success: true, data };
      });
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>): Promise<ApiResponse<Announcement>> {
    if (!announcement.title || !announcement.content) {
      return { success: false, data: null, message: 'Title and Content are required.' };
    }
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: sanitizeHtmlText(announcement.title),
          content: sanitizeHtmlText(announcement.content),
          target_role: announcement.target_role || 'all',
          target_team_id: announcement.target_team_id || null,
          author_id: announcement.author_id || null
        })
        .select()
        .single();

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
  async getAuditLogs(): Promise<ApiResponse<AuditLog[]>> {
    try {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      return { success: true, data: data || [] };
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
      const { data, error } = await supabase.from('seasons').select('*').order('created_at', { ascending: false });
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
        .select('*')
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
      const { data } = await supabase.from('referees').select('*').is('deleted_at', null);
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
          venue: f.venue || 'Egerton Main Stadium',
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
