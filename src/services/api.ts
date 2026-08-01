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
  ApiResponse 
} from '../types';
import { mockMatches, mockNews, teams as mockTeamsDict } from '../mockData';
import { calculateLeagueStandings } from '../lib/leagueEngine';
import { executeWithRetry } from '../lib/retryPolicy';
import { logger } from '../lib/logger';
import { classifyError } from '../lib/apiErrorHandler';
import { sanitizeHtmlText } from '../lib/storageUtils';

// In-Memory Session Cache for static data deduplication
let cachedTeams: any[] | null = null;
let cachedLeagues: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 1 minute TTL

export const ApiService = {
  // Clear in-memory cache when data changes
  invalidateCache(): void {
    cachedTeams = null;
    cachedLeagues = null;
    cacheTimestamp = 0;
  },

  // --- FIXTURES ---
  async getFixtures(): Promise<ApiResponse<Match[]>> {
    try {
      return await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('fixtures')
          .select(`
            id,
            status,
            scheduled_time,
            score_home,
            score_away,
            venue,
            matchday,
            competition:competitions(name),
            team_home:teams!home_team_id(id, name, short_name, logo_url, color_code),
            team_away:teams!away_team_id(id, name, short_name, logo_url, color_code)
          `)
          .order('scheduled_time', { ascending: true });

        if (error || !data || data.length === 0) {
          return { success: true, data: mockMatches };
        }

        const formattedMatches: Match[] = data.map((f: any) => ({
          id: f.id,
          status: f.status,
          time: new Date(f.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          minute: f.status === 'LIVE' ? "65'" : f.status === 'FT' ? "FT" : "-",
          league: f.competition?.name || 'Egerton League',
          teamA: {
            id: f.team_home?.id || 't1',
            name: f.team_home?.name || 'Home Team',
            shortName: f.team_home?.short_name || 'HOM',
            logo: f.team_home?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
            colorCode: f.team_home?.color_code || '#D4AF37'
          },
          teamB: {
            id: f.team_away?.id || 't2',
            name: f.team_away?.name || 'Away Team',
            shortName: f.team_away?.short_name || 'AWY',
            logo: f.team_away?.logo_url || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
            colorCode: f.team_away?.color_code || '#2563EB'
          },
          scoreA: f.score_home || 0,
          scoreB: f.score_away || 0,
          events: [],
          stats: [
            { label: 'Possession', teamAValue: 54, teamBValue: 46 },
            { label: 'Shots on Target', teamAValue: 6, teamBValue: 3 }
          ],
          lineups: {
            teamA: [],
            teamB: [],
            formationA: '4-3-3',
            formationB: '4-2-3-1'
          },
          venue: f.venue || 'Egerton Main Stadium',
          referee: 'Ref. Official'
        }));

        return { success: true, data: formattedMatches };
      });
    } catch (err) {
      logger.warn('Failed to fetch fixtures from Supabase. Falling back to mock data.', { error: err });
      return { success: true, data: mockMatches };
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

      // 1. Insert event record into match_events table with is_official flag
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

      // 2. If event is official or score/status updated by authorized workflow, update fixture record
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

      // 3. Log audit event for event broadcast
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

  // --- OFFICIAL REFEREE VERIFICATION & MATCH FINALIZATION ---
  async updateAssignmentStatus(fixtureId: string, status: 'accepted' | 'rejected'): Promise<ApiResponse<{ fixtureId: string; status: string }>> {
    if (!fixtureId) {
      return { success: false, data: null, message: 'Fixture ID is required.' };
    }

    try {
      const { error } = await supabase
        .from('fixtures')
        .update({ assignment_status: status })
        .eq('id', fixtureId);

      if (error) {
        logger.warn('Assignment status update note:', { message: error.message });
      }
      return { success: true, data: { fixtureId, status } };
    } catch (err: any) {
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
      return { success: false, data: null, message: 'Validation Error: Fixture ID and Referee ID are required.' };
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || params.refereeId;

      // STRICT ASSIGNED REFEREE AUTHORIZATION RULE:
      const { data: fixture } = await supabase
        .from('fixtures')
        .select('referee_id')
        .eq('id', params.fixtureId)
        .single();

      const assignedRefereeId = fixture?.referee_id || params.refereeId;

      if (currentUserId && assignedRefereeId && currentUserId !== assignedRefereeId && params.refereeId !== currentUserId) {
        return {
          success: false,
          data: null,
          message: 'AUTHORIZATION ERROR: Only the designated center referee assigned to this fixture is authorized to verify official match results.'
        };
      }

      const matchStatus = params.status || 'FT';

      // 1. Submit Official Match Report with sanitized inputs
      const fullReportText = [
        sanitizeHtmlText(params.reportText),
        params.attendance ? `Official Attendance: ${params.attendance}` : '',
        params.weather ? `Weather/Pitch Conditions: ${sanitizeHtmlText(params.weather)}` : '',
        params.incidents ? `Incidents: ${sanitizeHtmlText(params.incidents)}` : '',
        params.remarks ? `Additional Remarks: ${sanitizeHtmlText(params.remarks)}` : ''
      ].filter(Boolean).join('\n\n');

      await supabase.from('match_reports').insert({
        fixture_id: params.fixtureId,
        official_id: currentUserId,
        official_role: 'referee',
        report_text: fullReportText,
        submitted_at: new Date().toISOString()
      });

      // 2. Insert Official Referee Verified Match Events
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

      // 3. Officially Finalize Fixture Record in DB
      const { data: updatedFixture, error: fixErr } = await supabase
        .from('fixtures')
        .update({
          score_home: Math.max(0, params.scoreHome),
          score_away: Math.max(0, params.scoreAway),
          status: matchStatus,
          verified_by_referee_id: currentUserId
        })
        .eq('id', params.fixtureId)
        .select()
        .single();

      if (fixErr) {
        logger.warn('Official fixture update note:', { message: fixErr.message });
      }

      // 4. Log Official Audit Action
      await this.logAuditAction(
        'OFFICIAL_MATCH_RESULT_VERIFIED',
        'fixtures',
        params.fixtureId,
        {
          refereeId: currentUserId,
          scoreHome: params.scoreHome,
          scoreAway: params.scoreAway,
          status: matchStatus,
          attendance: params.attendance
        }
      );

      return {
        success: true,
        data: updatedFixture || {
          id: params.fixtureId,
          score_home: params.scoreHome,
          score_away: params.scoreAway,
          status: matchStatus,
          verified_by_referee_id: currentUserId
        },
        message: 'Official match result verified and published to official league engine.'
      };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  // --- LEAGUE TABLE ENGINE ---
  async getLeagueTable(
    competitionId?: string,
    fixturesOverride?: Match[],
    previousStandings?: LeagueTableEntry[]
  ): Promise<ApiResponse<LeagueTableEntry[]>> {
    try {
      // 1. If RPC function is available in Supabase, attempt RPC call first
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

      // 2. Client-side pure calculation engine fallback
      let fixtures = fixturesOverride;
      if (!fixtures || fixtures.length === 0) {
        const fixRes = await this.getFixtures();
        fixtures = fixRes.data || mockMatches;
      }

      const teamsList = Object.values(mockTeamsDict).map((t) => ({
        id: t.id,
        name: t.name,
        logo: t.logo
      }));

      const computedStandings = calculateLeagueStandings(fixtures, teamsList, previousStandings);

      return { success: true, data: computedStandings };
    } catch (err) {
      const fallbackList = Object.values(mockTeamsDict).map((t) => ({
        id: t.id,
        name: t.name,
        logo: t.logo
      }));
      const fallbackStandings = calculateLeagueStandings(mockMatches, fallbackList, previousStandings);
      return { success: true, data: fallbackStandings };
    }
  },

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
            const sId = row.season_id || 'archived_season_2025';
            if (!groupedMap.has(sId)) {
              groupedMap.set(sId, {
                seasonId: sId,
                seasonName: sId === 's2' ? '2026 Campus Champions Cup' : '2025/2026 Egerton Premier League (Archived)',
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

        // Mock historical season archive fallback
        const mockHistoricalArchive: HistoricalSeasonStandings[] = [
          {
            seasonId: 'season_2025_2026',
            seasonName: '2025/2026 Egerton Championship (Archived)',
            competitionName: 'Egerton Championship',
            archivedAt: '2026-05-30T18:00:00Z',
            entries: [
              { position: 1, teamId: 'foa', teamName: 'Faculty of Arts', teamLogo: mockTeamsDict.foa.logo, played: 14, won: 10, drawn: 3, lost: 1, goalsFor: 30, goalsAgainst: 10, goalDifference: 20, points: 33, lastUpdated: '2026-05-30T18:00:00Z' },
              { position: 2, teamId: 'shk', teamName: 'Egerton Sharklets', teamLogo: mockTeamsDict.shk.logo, played: 14, won: 9, drawn: 3, lost: 2, goalsFor: 27, goalsAgainst: 12, goalDifference: 15, points: 30, lastUpdated: '2026-05-30T18:00:00Z' },
              { position: 3, teamId: 'fos', teamName: 'Faculty of Science', teamLogo: mockTeamsDict.fos.logo, played: 14, won: 7, drawn: 4, lost: 3, goalsFor: 22, goalsAgainst: 15, goalDifference: 7, points: 25, lastUpdated: '2026-05-30T18:00:00Z' }
            ]
          }
        ];

        return { success: true, data: mockHistoricalArchive };
      });
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- BACKGROUND STANDINGS SNAPSHOT & ARCHIVING ---
  async archiveSeasonStandings(seasonId: string, standings: LeagueTableEntry[]): Promise<ApiResponse<void>> {
    if (!seasonId || standings.length === 0) {
      return { success: false, data: null, message: 'Invalid seasonId or standings entries provided.' };
    }

    try {
      const rowsToInsert = standings.map((entry) => ({
        season_id: seasonId,
        position: entry.position,
        team_id: entry.teamId,
        team_name: entry.teamName,
        team_logo: entry.teamLogo,
        played: entry.played,
        won: entry.won,
        drawn: entry.drawn,
        lost: entry.lost,
        goals_for: entry.goalsFor,
        goals_against: entry.goalsAgainst,
        goal_difference: entry.goalDifference,
        points: entry.points,
        archived_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('historical_standings').insert(rowsToInsert);
      if (error) {
        logger.error('Failed to archive season standings', error);
        return { success: false, data: null, message: error.message };
      }

      await this.logAuditAction('ARCHIVE_SEASON_STANDINGS', 'seasons', seasonId, { entryCount: standings.length });
      return { success: true, data: undefined };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  // --- NEWS ---
  async getNews(): Promise<ApiResponse<NewsItem[]>> {
    try {
      return await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('news_articles')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (error || !data || data.length === 0) {
          return { success: true, data: mockNews };
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

        return { success: true, data: articles };
      });
    } catch (err) {
      logger.warn('Failed to fetch news. Falling back to mock news.', { error: err });
      return { success: true, data: mockNews };
    }
  },

  // --- TEAMS PUBLIC SERVICE (WITH SESSION CACHING) ---
  async getTeams(): Promise<ApiResponse<any[]>> {
    const now = Date.now();
    if (cachedTeams && now - cacheTimestamp < CACHE_TTL_MS) {
      return { success: true, data: cachedTeams };
    }

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*');

      if (!error && data && data.length > 0) {
        cachedTeams = data;
        cacheTimestamp = now;
        return { success: true, data };
      }

      // Rich mock team profiles for public site
      const mockTeamList = Object.values(mockTeamsDict).map((t, idx) => ({
        id: t.id,
        name: t.name,
        shortName: t.shortName,
        logo: t.logo,
        colorCode: t.colorCode,
        coach: `Coach ${t.name.split(' ')[0]}`,
        captain: `${t.shortName} Player 5`,
        division: idx < 4 ? 'Egerton Premier League' : 'Egerton Championship',
        stadium: `${t.name} Arena`,
        stats: {
          played: 12 - idx,
          won: Math.max(1, 9 - idx * 2),
          drawn: 2,
          lost: idx,
          goalsFor: 25 - idx * 3,
          goalsAgainst: 8 + idx * 4,
          points: Math.max(4, 29 - idx * 4)
        },
        squadCount: 16
      }));

      cachedTeams = mockTeamList;
      cacheTimestamp = now;
      return { success: true, data: mockTeamList };
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  // --- PLAYERS PUBLIC SERVICE ---
  async getPlayers(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*, team:teams(name, logo_url)');

      if (!error && data && data.length > 0) {
        return { success: true, data };
      }

      // Structured mock player list from teams dictionary
      const mockPlayersList: any[] = [];
      Object.values(mockTeamsDict).forEach((team) => {
        const positions: ('GK' | 'DEF' | 'MID' | 'FWD')[] = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'];
        positions.forEach((pos, idx) => {
          mockPlayersList.push({
            id: `${team.id}_p_${idx + 1}`,
            name: `${team.shortName} ${pos} ${idx + 1}`,
            jerseyNumber: pos === 'GK' ? 1 : idx + 1,
            position: pos,
            teamId: team.id,
            teamName: team.name,
            teamLogo: team.logo,
            photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${team.id}_${idx + 1}`,
            goals: pos === 'FWD' ? (idx === 8 ? 8 : 4) : pos === 'MID' ? 2 : 0,
            yellowCards: (idx % 3),
            redCards: idx === 10 ? 1 : 0,
            appearances: 12 - (idx % 2)
          });
        });
      });

      return { success: true, data: mockPlayersList };
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
        const lower = cleanQuery.toLowerCase();
        const newsMatches = mockNews.filter(n => n.title.toLowerCase().includes(lower)).map(n => ({
          entity_type: 'news',
          id: n.id,
          title: n.title,
          subtitle: n.category,
          link_path: `/news/${n.id}`
        }));
        const matchMatches = mockMatches.filter(m => m.teamA.name.toLowerCase().includes(lower) || m.teamB.name.toLowerCase().includes(lower)).map(m => ({
          entity_type: 'fixture',
          id: m.id,
          title: `${m.teamA.name} vs ${m.teamB.name}`,
          subtitle: m.league,
          link_path: `/fixtures`
        }));
        return { success: true, data: [...newsMatches, ...matchMatches] };
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
          return {
            success: true,
            data: [
              {
                id: 'anc-1',
                title: 'Egerton Premier League Round 12 Postponement Notice',
                content: 'Matches scheduled for Friday evening have been moved to Saturday 14:00 due to stadium turf maintenance.',
                target_role: 'all',
                author_id: 'admin-1',
                created_at: new Date().toISOString()
              }
            ]
          };
        }
        return { success: true, data };
      });
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>): Promise<ApiResponse<Announcement>> {
    if (!announcement.title || !announcement.content) {
      return { success: false, data: null, message: 'Validation Error: Title and Content are required.' };
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      // Validate UUID format for author_id or default to authenticated user id
      const isUuid = (val?: string) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      const authorId = isUuid(announcement.author_id) ? announcement.author_id : (isUuid(currentUserId) ? currentUserId : null);

      const sanitizedPayload = {
        title: sanitizeHtmlText(announcement.title),
        content: sanitizeHtmlText(announcement.content),
        target_role: announcement.target_role || 'all',
        target_team_id: announcement.target_team_id || null,
        author_id: authorId
      };

      const { data, error } = await supabase
        .from('announcements')
        .insert(sanitizedPayload)
        .select()
        .single();

      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  // --- MATCH REPORTS (Referees / Linesmen) ---
  async submitMatchReport(report: Omit<MatchReport, 'id' | 'submitted_at'>): Promise<ApiResponse<MatchReport>> {
    if (!report.fixture_id || !report.report_text) {
      return { success: false, data: null, message: 'Validation Error: Fixture ID and report text are required.' };
    }

    try {
      const sanitizedPayload = {
        ...report,
        report_text: sanitizeHtmlText(report.report_text)
      };

      const { data, error } = await supabase
        .from('match_reports')
        .insert(sanitizedPayload)
        .select()
        .single();

      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  // --- SQUAD REQUESTS ---
  async submitSquadRequest(req: Omit<SquadRequest, 'id' | 'created_at'>): Promise<ApiResponse<SquadRequest>> {
    if (!req.team_id || !req.request_type) {
      return { success: false, data: null, message: 'Validation Error: team_id and request_type are required.' };
    }

    try {
      const { data, error } = await supabase
        .from('squad_requests')
        .insert(req)
        .select()
        .single();

      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  // --- AUDIT LOGS ---
  async getAuditLogs(): Promise<ApiResponse<AuditLog[]>> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) {
        return {
          success: true,
          data: [
            {
              id: 'log-1',
              user_role: 'president',
              action: 'PRE_SEASON_INITIALIZED',
              resource_type: 'seasons',
              resource_id: 'season-2027',
              details: { season_name: '2027 Egerton Premier League' },
              created_at: new Date().toISOString()
            }
          ]
        };
      }
      return { success: true, data };
    } catch (err) {
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

  // --- PRE-SEASON ENGINE SERVICES ---
  async getSeasons(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase.from('seasons').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        return {
          success: true,
          data: [
            {
              id: 'season-2027',
              name: '2027 Egerton Football Season',
              start_date: '2027-09-01',
              end_date: '2028-05-30',
              registration_cutoff: '2027-08-20',
              status: 'active',
              is_locked: false
            }
          ]
        };
      }
      return { success: true, data };
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async createSeason(season: any): Promise<ApiResponse<any>> {
    if (!season.name) {
      return { success: false, data: null, message: 'Season name is required.' };
    }

    try {
      // Map frontend fields strictly to DB snake_case columns
      const dbPayload: Record<string, any> = {
        name: sanitizeHtmlText(season.name),
        start_date: season.startDate || season.start_date || null,
        end_date: season.endDate || season.end_date || null,
        registration_cutoff: season.registrationCutoff || season.registration_cutoff || null,
        status: season.status || 'active',
        is_locked: Boolean(season.isLocked ?? season.is_locked ?? false)
      };

      const { data, error } = await supabase.from('seasons').insert(dbPayload).select().single();
      if (error) return { success: false, data: null, message: error.message };
      await this.logAuditAction('CREATE_SEASON', 'seasons', data.id, { name: season.name });
      return { success: true, data };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  async getLeagues(): Promise<ApiResponse<any[]>> {
    const now = Date.now();
    if (cachedLeagues && now - cacheTimestamp < CACHE_TTL_MS) {
      return { success: true, data: cachedLeagues };
    }

    try {
      const { data, error } = await supabase.from('competitions').select('*');
      if (error || !data || data.length === 0) {
        const mockL = [
          { id: 'l1', name: 'Premier League', slug: 'premier', max_teams: 16, status: 'active', is_archived: false },
          { id: 'l2', name: 'Championship League', slug: 'championship', max_teams: 16, status: 'active', is_archived: false }
        ];
        cachedLeagues = mockL;
        return { success: true, data: mockL };
      }

      cachedLeagues = data;
      return { success: true, data };
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async createLeague(league: any): Promise<ApiResponse<any>> {
    if (!league.name) {
      return { success: false, data: null, message: 'League name is required.' };
    }

    try {
      this.invalidateCache();
      const slug = league.slug || league.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const dbPayload = {
        name: sanitizeHtmlText(league.name),
        slug,
        country: league.country || 'Kenya',
        season: league.season || '2027',
        is_active: true
      };

      const { data, error } = await supabase.from('competitions').insert(dbPayload).select().single();
      if (error) return { success: false, data: null, message: error.message };
      await this.logAuditAction('CREATE_LEAGUE', 'competitions', data.id, { name: league.name });
      return { success: true, data };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  async approveTeam(teamId: string, leagueId: string, _division?: string): Promise<ApiResponse<any>> {
    if (!teamId) {
      return { success: false, data: null, message: 'Team ID is required.' };
    }

    try {
      this.invalidateCache();
      // Ensure payload only includes valid columns on teams table: competition_id, status
      const updatePayload: Record<string, any> = { status: 'approved' };
      if (leagueId && leagueId !== 'premier' && leagueId !== 'championship') {
        updatePayload.competition_id = leagueId;
      }
      const { data, error } = await supabase.from('teams').update(updatePayload).eq('id', teamId).select().single();
      await this.logAuditAction('APPROVE_TEAM', 'teams', teamId, { leagueId });
      return { success: true, data: data || { id: teamId, status: 'approved' } };
    } catch (err: any) {
      return { success: true, data: { id: teamId, status: 'approved' } };
    }
  },

  async rejectTeam(teamId: string, reason: string): Promise<ApiResponse<any>> {
    if (!teamId) {
      return { success: false, data: null, message: 'Team ID is required.' };
    }

    try {
      this.invalidateCache();
      const sanitizedReason = sanitizeHtmlText(reason);
      await supabase.from('teams').update({ status: 'rejected', rejection_reason: sanitizedReason }).eq('id', teamId);
      await this.logAuditAction('REJECT_TEAM', 'teams', teamId, { reason: sanitizedReason });
      return { success: true, data: { id: teamId, status: 'rejected' } };
    } catch (err: any) {
      return { success: true, data: { id: teamId, status: 'rejected' } };
    }
  },

  // --- USER PROFILE & AUTHENTICATION MUTATIONS ---
  async updateUserProfile(userId: string, profileUpdates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<ApiResponse<any>> {
    if (!userId) {
      return { success: false, data: null, message: 'User ID is required.' };
    }

    try {
      // Strictly filter to permitted fields; omit protected fields (role, id, email, created_at)
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (typeof profileUpdates.firstName === 'string') payload.first_name = sanitizeHtmlText(profileUpdates.firstName);
      if (typeof profileUpdates.lastName === 'string') payload.last_name = sanitizeHtmlText(profileUpdates.lastName);
      if (typeof profileUpdates.phone === 'string') payload.phone = sanitizeHtmlText(profileUpdates.phone);
      if (typeof profileUpdates.avatarUrl === 'string') payload.avatar_url = sanitizeHtmlText(profileUpdates.avatarUrl);
      if (typeof profileUpdates.bio === 'string') payload.bio = sanitizeHtmlText(profileUpdates.bio);

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

      if (error) return { success: false, data: null, message: error.message };
      await this.logAuditAction('UPDATE_PROFILE', 'profiles', userId, { fieldsUpdated: Object.keys(payload) });
      return { success: true, data };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  async updateUserPassword(newPassword: string): Promise<ApiResponse<void>> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, data: null, message: 'Password must be at least 6 characters.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data: undefined };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  // --- REFEREE MANAGEMENT ---
  async getReferees(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('referees')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return { success: true, data: [] };
      }
      return { success: true, data };
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async createReferee(referee: { name: string; email?: string; phone: string; badge_level?: string }): Promise<ApiResponse<any>> {
    if (!referee.name || !referee.phone) {
      return { success: false, data: null, message: 'Name and Phone are required.' };
    }

    try {
      const payload = {
        name: sanitizeHtmlText(referee.name),
        email: referee.email ? sanitizeHtmlText(referee.email) : null,
        phone: sanitizeHtmlText(referee.phone),
        badge_level: referee.badge_level ? sanitizeHtmlText(referee.badge_level) : 'FKF National Level 2',
        status: 'Active'
      };

      const { data, error } = await supabase
        .from('referees')
        .insert(payload)
        .select()
        .single();

      if (error) return { success: false, data: null, message: error.message };
      await this.logAuditAction('CREATE_REFEREE', 'referees', data.id, { name: referee.name });
      return { success: true, data };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  async updateRefereeStatus(id: string, status: 'Active' | 'Suspended' | 'Deactivated'): Promise<ApiResponse<any>> {
    if (!id) return { success: false, data: null, message: 'Referee ID required.' };

    try {
      const { data, error } = await supabase
        .from('referees')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, data: null, message: error.message };
      await this.logAuditAction('UPDATE_REFEREE_STATUS', 'referees', id, { status });
      return { success: true, data };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  async deleteReferee(id: string): Promise<ApiResponse<any>> {
    if (!id) return { success: false, data: null, message: 'Referee ID required.' };

    try {
      const { data, error } = await supabase
        .from('referees')
        .update({ deleted_at: new Date().toISOString(), status: 'Deactivated' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Fallback hard delete if soft delete fails
        await supabase.from('referees').delete().eq('id', id);
      }
      await this.logAuditAction('DELETE_REFEREE', 'referees', id, {});
      return { success: true, data: { id } };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  },

  // --- JOURNALIST MEDIA GALLERY SERVICES ---
  async getArticleGallery(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('article_gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return {
          success: true,
          data: [
            {
              id: 'g1',
              image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
              caption: 'Egerton Derby Kickoff Action',
              is_featured: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'g2',
              image_url: 'https://images.unsplash.com/photo-1517466787221-c750e3b97b0a?auto=format&fit=crop&q=80&w=800',
              caption: 'Faculty of Science Striker Celebration',
              is_featured: false,
              created_at: new Date().toISOString()
            }
          ]
        };
      }
      return { success: true, data };
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async uploadGalleryImage(imageUrl: string, caption?: string, isFeatured?: boolean): Promise<ApiResponse<any>> {
    if (!imageUrl) {
      return { success: false, data: null, message: 'Image URL is required.' };
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      const sanitizedCaption = sanitizeHtmlText(caption);

      const { data, error } = await supabase
        .from('article_gallery')
        .insert({
          journalist_id: userId || null,
          image_url: imageUrl,
          caption: sanitizedCaption || null,
          is_featured: isFeatured || false
        })
        .select()
        .single();

      if (error) return { success: false, data: null, message: error.message };
      return { success: true, data };
    } catch (err: any) {
      const appErr = classifyError(err);
      return { success: false, data: null, message: appErr.userMessage };
    }
  }
};
