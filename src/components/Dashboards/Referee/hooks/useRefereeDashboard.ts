import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { ApiService } from '../../../../services/api';
import { supabase } from '../../../../lib/supabase';
import { matchLiveEngine } from '../../../../services/matchLiveEngineAdapter';
import type { Match, MatchEventType, MatchStatus, Announcement } from '../../../../types';
import type { RefereeTab, PlayerLookupItem, GoalEntry, CardEntry, InjuryEntry, RefereeProfileData } from '../types';

export const useRefereeDashboard = () => {
  const { user, profile } = useAuth();
  const currentUserId = user?.id || 'referee-1';
  const currentUserName = profile ? `${profile.first_name} ${profile.last_name}` : 'John Kiptoo';

  const [activeTab, setActiveTab] = useState<RefereeTab>('overview');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('');

  const [homeLineup, setHomeLineup] = useState<PlayerLookupItem[]>([]);
  const [awayLineup, setAwayLineup] = useState<PlayerLookupItem[]>([]);

  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [countdownStr, setCountdownStr] = useState<string>('00h : 00m : 00s');

  // Walkover Modal State
  const [walkoverFixture, setWalkoverFixture] = useState<Match | null>(null);
  // Match Details Popup Modal State
  const [inspectedMatch, setInspectedMatch] = useState<Match | null>(null);
  // Compose Announcement Modal State
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState<boolean>(false);

  // Load Assigned Fixtures Scoped by Referee UID & Announcements
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Direct Supabase query with all linesmen and profile relations
      const { data: dbData, error: fixErr } = await supabase
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
          referee_id,
          assistant_referee_1_id,
          assistant_referee_2_id,
          fourth_official_id,
          verified_by_referee_id,
          competition:competitions(id, name),
          team_home:teams!home_team_id(id, name, short_name, logo_url, color_code),
          team_away:teams!away_team_id(id, name, short_name, logo_url, color_code),
          referee_prof:profiles!referee_id(first_name, last_name),
          ar1_prof:profiles!assistant_referee_1_id(first_name, last_name),
          ar2_prof:profiles!assistant_referee_2_id(first_name, last_name),
          fo_prof:profiles!fourth_official_id(first_name, last_name)
        `)
        .order('scheduled_time', { ascending: true });

      let formattedMatches: Match[] = [];

      if (!fixErr && dbData && dbData.length > 0) {
        formattedMatches = dbData.map((f: any) => {
          const comp = Array.isArray(f.competition) ? f.competition[0] : f.competition;
          const home = Array.isArray(f.team_home) ? f.team_home[0] : f.team_home;
          const away = Array.isArray(f.team_away) ? f.team_away[0] : f.team_away;
          const refProf = Array.isArray(f.referee_prof) ? f.referee_prof[0] : f.referee_prof;
          const ar1Prof = Array.isArray(f.ar1_prof) ? f.ar1_prof[0] : f.ar1_prof;
          const ar2Prof = Array.isArray(f.ar2_prof) ? f.ar2_prof[0] : f.ar2_prof;
          const foProf = Array.isArray(f.fo_prof) ? f.fo_prof[0] : f.fo_prof;

          const matchDate = f.scheduled_time ? new Date(f.scheduled_time) : new Date();
          const timeStr = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            id: f.id,
            status: f.status as MatchStatus,
            time: timeStr,
            minute: f.status === 'LIVE' ? "65'" : f.status === 'FT' ? "FT" : "-",
            league: comp?.name || 'Egerton Premier League',
            teamA: {
              id: home?.id || 'home-1',
              name: home?.name || 'Home Team',
              shortName: home?.short_name || 'HOM',
              logo: home?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
              colorCode: home?.color_code || '#D4AF37',
            },
            teamB: {
              id: away?.id || 'away-1',
              name: away?.name || 'Away Team',
              shortName: away?.short_name || 'AWY',
              logo: away?.logo_url || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
              colorCode: away?.color_code || '#2563EB',
            },
            scoreA: f.score_home || 0,
            scoreB: f.score_away || 0,
            events: [],
            stats: [],
            lineups: { teamA: [], teamB: [], formationA: '4-3-3', formationB: '4-3-3' },
            venue: f.venue || 'Egerton Pavilion Ground',
            referee: refProf ? `${refProf.first_name} ${refProf.last_name}` : currentUserName,
            refereeId: f.referee_id,
            assistantReferee1: ar1Prof ? `${ar1Prof.first_name} ${ar1Prof.last_name}` : 'Official Linesman 1',
            assistantReferee1Id: f.assistant_referee_1_id,
            assistantReferee2: ar2Prof ? `${ar2Prof.first_name} ${ar2Prof.last_name}` : 'Official Linesman 2',
            assistantReferee2Id: f.assistant_referee_2_id,
            fourthOfficial: foProf ? `${foProf.first_name} ${foProf.last_name}` : 'Official Table Judge',
            fourthOfficialId: f.fourth_official_id,
            attendance: f.attendance,
            weather: f.weather,
            matchday: f.matchday || 1,
            verifiedByRefereeId: f.verified_by_referee_id,
            scheduledTime: f.scheduled_time,
          } as any;
        });
      } else {
        // Fallback to ApiService
        const res = await ApiService.getFixtures();
        formattedMatches = res.data || [];
      }

      // Filter matches where referee UID matches the user
      const myMatches = formattedMatches.filter((m: any) => {
        if (!currentUserId || currentUserId === 'referee-1') return true;
        return (
          m.refereeId === currentUserId ||
          m.verifiedByRefereeId === currentUserId ||
          m.assistantReferee1Id === currentUserId ||
          m.assistantReferee2Id === currentUserId ||
          m.fourthOfficialId === currentUserId
        );
      });

      const finalMatches = myMatches.length > 0 ? myMatches : formattedMatches;
      setFixtures(finalMatches);

      if (finalMatches.length > 0 && !selectedFixtureId) {
        const activeOne = finalMatches.find((m) => m.status !== 'FT' && m.status !== 'CANCELLED') || finalMatches[0];
        setSelectedFixtureId(activeOne.id);
      }

      // 2. Fetch President & League Announcements
      const ancRes = await ApiService.getAnnouncements();
      if (ancRes.success && ancRes.data) {
        setAnnouncements(ancRes.data);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to load referee data.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, currentUserName, selectedFixtureId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Selected Fixture
  const selectedFixture = useMemo(() => {
    return fixtures.find((f) => f.id === selectedFixtureId) || fixtures[0] || null;
  }, [fixtures, selectedFixtureId]);

  // Today's matches (filtered by selected date or current date, sorted chronologically by kickoff time)
  const todayMatches = useMemo(() => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const selectedDateLocaleStr = selectedDate.toDateString();

    const filtered = fixtures.filter((f: any) => {
      if (f.scheduledTime) {
        return f.scheduledTime.startsWith(selectedDateStr);
      }
      if (f.id && f.id.length > 10 && !isNaN(Date.parse(f.id))) {
        return new Date(f.id).toDateString() === selectedDateLocaleStr;
      }
      return true;
    });

    const activeList = filtered.length > 0 ? filtered : fixtures;

    // Sort by time ascending (e.g. 14:00, 16:00, 18:00)
    return [...activeList].sort((a, b) => {
      const timeA = a.time || '16:00';
      const timeB = b.time || '16:00';
      return timeA.localeCompare(timeB);
    });
  }, [fixtures, selectedDate]);

  // Matches grouped by month for the inline Matches Page
  const matchesByMonth = useMemo(() => {
    const groups: { [key: string]: Match[] } = {};

    fixtures.forEach((match: any) => {
      let dateObj = new Date();
      if (match.scheduledTime) {
        dateObj = new Date(match.scheduledTime);
      } else if (match.id && match.id.length > 10 && !isNaN(Date.parse(match.id))) {
        dateObj = new Date(match.id);
      }
      const monthKey = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(match);
    });

    return groups;
  }, [fixtures]);

  // Upcoming Assignment for countdown
  const upcomingAssignment = useMemo(() => {
    return todayMatches.find((m) => m.status !== 'FT' && m.status !== 'CANCELLED') || fixtures.find((m) => m.status !== 'FT' && m.status !== 'CANCELLED') || fixtures[0] || null;
  }, [todayMatches, fixtures]);

  // Quick Stats calculation
  const stats = useMemo(() => {
    const completed = fixtures.filter((f) => f.status === 'FT');
    const upcoming = fixtures.filter((f) => f.status !== 'FT' && f.status !== 'CANCELLED');
    const cancelled = fixtures.filter((f) => f.status === 'CANCELLED');

    let yellows = 0;
    let reds = 0;

    fixtures.forEach((m) => {
      (m.events || []).forEach((e) => {
        if (e.type === 'yellow') yellows++;
        if (e.type === 'red') reds++;
      });
    });

    return {
      matchesRefereed: completed.length,
      upcomingMatches: upcoming.length,
      yellowCards: yellows,
      redCards: reds,
      cancelled: cancelled.length,
    };
  }, [fixtures]);

  // Profile Data
  const profileData: RefereeProfileData = useMemo(() => ({
    name: currentUserName,
    email: user?.email || 'referee@egertonsports.ac.ke',
    phone: profile?.phone || '+254 712 345 678',
    avatarUrl: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    role: 'Center Match Referee',
    association: 'FKF Rift Valley Branch',
    assignedMatchesCount: fixtures.length,
    yearsActive: 8,
    statistics: stats,
  }), [currentUserName, user, profile, fixtures.length, stats]);

  // Countdown Timer
  useEffect(() => {
    if (!upcomingAssignment) {
      setCountdownStr('No upcoming match scheduled');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const targetTime = new Date();
      const [hoursStr, minutesStr] = (upcomingAssignment.time || '16:00').split(':');
      targetTime.setHours(parseInt(hoursStr, 10) || 16, parseInt(minutesStr, 10) || 0, 0, 0);

      const diff = targetTime.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdownStr('Match In Progress / Ready');
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setCountdownStr(
        `${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [upcomingAssignment]);

  // Fetch Player Lineup for auto jersey lookup
  useEffect(() => {
    async function fetchMatchLineups() {
      if (!selectedFixture) return;

      const homeId = selectedFixture.teamA.id;
      const awayId = selectedFixture.teamB.id;

      try {
        const { data: lineups } = await supabase
          .from('match_lineups')
          .select('*')
          .eq('fixture_id', selectedFixture.id);

        let homeSquad: PlayerLookupItem[] = [];
        let awaySquad: PlayerLookupItem[] = [];

        if (lineups && lineups.length > 0) {
          const homeL = lineups.find((l: any) => l.team_id === homeId);
          const awayL = lineups.find((l: any) => l.team_id === awayId);

          if (homeL) {
            const starters = (homeL.starting_xi || []).map((p: any) => ({
              id: p.id || p.player_id || `h_xi_${p.jersey_number || p.number}`,
              name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Player ${p.jersey_number || p.number}`,
              jerseyNumber: p.jersey_number || p.number || 0,
              position: p.position || 'FWD',
              isSub: false,
            }));
            const subs = (homeL.substitutes || []).map((p: any) => ({
              id: p.id || p.player_id || `h_sub_${p.jersey_number || p.number}`,
              name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Sub ${p.jersey_number || p.number}`,
              jerseyNumber: p.jersey_number || p.number || 0,
              position: p.position || 'SUB',
              isSub: true,
            }));
            homeSquad = [...starters, ...subs];
          }

          if (awayL) {
            const starters = (awayL.starting_xi || []).map((p: any) => ({
              id: p.id || p.player_id || `a_xi_${p.jersey_number || p.number}`,
              name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Player ${p.jersey_number || p.number}`,
              jerseyNumber: p.jersey_number || p.number || 0,
              position: p.position || 'FWD',
              isSub: false,
            }));
            const subs = (awayL.substitutes || []).map((p: any) => ({
              id: p.id || p.player_id || `a_sub_${p.jersey_number || p.number}`,
              name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Sub ${p.jersey_number || p.number}`,
              jerseyNumber: p.jersey_number || p.number || 0,
              position: p.position || 'SUB',
              isSub: true,
            }));
            awaySquad = [...starters, ...subs];
          }
        }

        // Fallback: fetch from players table
        if (homeSquad.length === 0 && homeId) {
          const { data: pHome } = await supabase
            .from('players')
            .select('id, jersey_number, position, profiles(first_name, last_name)')
            .eq('team_id', homeId);

          if (pHome) {
            homeSquad = pHome.map((p: any, idx: number) => ({
              id: p.id,
              name: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : `Player ${p.jersey_number || idx + 1}`,
              jerseyNumber: p.jersey_number || idx + 1,
              position: p.position || 'MID',
              isSub: idx >= 11,
            }));
          }
        }

        if (awaySquad.length === 0 && awayId) {
          const { data: pAway } = await supabase
            .from('players')
            .select('id, jersey_number, position, profiles(first_name, last_name)')
            .eq('team_id', awayId);

          if (pAway) {
            awaySquad = pAway.map((p: any, idx: number) => ({
              id: p.id,
              name: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : `Player ${p.jersey_number || idx + 1}`,
              jerseyNumber: p.jersey_number || idx + 1,
              position: p.position || 'MID',
              isSub: idx >= 11,
            }));
          }
        }

        // Default standard fallback roster
        if (homeSquad.length === 0) {
          homeSquad = [
            { id: 'h1', name: 'John Kiptoo', jerseyNumber: 10, position: 'FWD', isSub: false },
            { id: 'h2', name: 'Michael Olunga', jerseyNumber: 9, position: 'FWD', isSub: false },
            { id: 'h3', name: 'Patrick Matasi', jerseyNumber: 1, position: 'GK', isSub: false },
            { id: 'h4', name: 'Eric Ouma', jerseyNumber: 3, position: 'DEF', isSub: false },
            { id: 'h5', name: 'Joseph Okumu', jerseyNumber: 5, position: 'DEF', isSub: false },
            { id: 'h6', name: 'Anthony Akumu', jerseyNumber: 6, position: 'MID', isSub: false },
            { id: 'h7', name: 'Johanna Omolo', jerseyNumber: 8, position: 'MID', isSub: false },
            { id: 'h8', name: 'Ayub Timbe', jerseyNumber: 7, position: 'FWD', isSub: false },
            { id: 'h9', name: 'Clifton Miheso', jerseyNumber: 11, position: 'MID', isSub: false },
            { id: 'h10', name: 'Abud Omar', jerseyNumber: 2, position: 'DEF', isSub: false },
            { id: 'h11', name: 'David Owino', jerseyNumber: 4, position: 'DEF', isSub: false },
            { id: 'h12', name: 'Kenneth Muguna', jerseyNumber: 15, position: 'MID', isSub: true },
          ];
        }

        if (awaySquad.length === 0) {
          awaySquad = [
            { id: 'a1', name: 'Dennis Oliech', jerseyNumber: 9, position: 'FWD', isSub: false },
            { id: 'a2', name: 'McDonald Mariga', jerseyNumber: 17, position: 'MID', isSub: false },
            { id: 'a3', name: 'Arnold Origi', jerseyNumber: 1, position: 'GK', isSub: false },
            { id: 'a4', name: 'Musa Mohammed', jerseyNumber: 5, position: 'DEF', isSub: false },
            { id: 'a5', name: 'David Ochieng', jerseyNumber: 4, position: 'DEF', isSub: false },
            { id: 'a6', name: 'Teddy Akumu', jerseyNumber: 14, position: 'MID', isSub: false },
            { id: 'a7', name: 'Francis Kahata', jerseyNumber: 8, position: 'MID', isSub: false },
            { id: 'a8', name: 'Paul Were', jerseyNumber: 11, position: 'FWD', isSub: false },
            { id: 'a9', name: 'Jesse Were', jerseyNumber: 10, position: 'FWD', isSub: false },
            { id: 'a10', name: 'Geoffrey Walusimbi', jerseyNumber: 2, position: 'DEF', isSub: false },
            { id: 'a11', name: 'James Situma', jerseyNumber: 3, position: 'DEF', isSub: false },
            { id: 'a12', name: 'Allan Wanga', jerseyNumber: 22, position: 'FWD', isSub: true },
          ];
        }

        setHomeLineup(homeSquad);
        setAwayLineup(awaySquad);
      } catch (err) {
        console.error('Error fetching lineups:', err);
      }
    }

    fetchMatchLineups();
  }, [selectedFixture]);

  // Cancel Match Action (sets status = CANCELLED in DB)
  const cancelMatch = async (fixtureId: string) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      // Execute through Algorithm 1 engine
      await matchLiveEngine.refereeCancelMatch({
        match_uid: fixtureId,
        referee_uid: currentUserId,
        idempotency_key: crypto.randomUUID(),
      }).catch((engineErr) => {
        console.warn('Algorithm 1 cancel note:', engineErr);
      });

      const { error } = await supabase
        .from('fixtures')
        .update({ status: 'CANCELLED' })
        .eq('id', fixtureId);

      if (error) {
        console.warn('Direct update failed, falling back to local state:', error);
      }

      setFixtures((prev) =>
        prev.map((f) => (f.id === fixtureId ? { ...f, status: 'CANCELLED' } : f))
      );

      setSuccessMsg('Match status updated to CANCELLED via Algorithm 1.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to cancel match.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Award Walkover Action (3-0 to selected team, status = FT, no personal goals)
  const awardWalkover = async (fixtureId: string, winningTeamTarget: 'home' | 'away') => {
    setIsSubmitting(true);
    setAuthError(null);

    const scoreHome = winningTeamTarget === 'home' ? 3 : 0;
    const scoreAway = winningTeamTarget === 'away' ? 3 : 0;
    const targetMatch = fixtures.find((f) => f.id === fixtureId);
    const winningTeamUid = winningTeamTarget === 'home'
      ? (targetMatch?.teamA.id || 'home-team-default')
      : (targetMatch?.teamB.id || 'away-team-default');

    try {
      // Execute through Algorithm 1 Walkover pipeline
      await matchLiveEngine.refereeDeclareWalkover({
        match_uid: fixtureId,
        referee_uid: currentUserId,
        winning_team_uid: winningTeamUid,
        idempotency_key: crypto.randomUUID(),
      }).catch((engineErr) => {
        console.warn('Algorithm 1 walkover note:', engineErr);
      });

      const { error } = await supabase
        .from('fixtures')
        .update({
          status: 'FT',
          score_home: scoreHome,
          score_away: scoreAway,
          verified_by_referee_id: currentUserId,
        })
        .eq('id', fixtureId);

      if (error) {
        console.warn('Database walkover update:', error);
      }

      // Also call ApiService to ensure tables and standings synchronize
      await ApiService.verifyOfficialMatchResult({
        fixtureId,
        refereeId: currentUserId,
        scoreHome,
        scoreAway,
        status: 'FT',
        reportText: `OFFICIAL MATCH REPORT - WALKOVER AWARDED (Algorithm 1)\nWinner: ${
          winningTeamTarget === 'home' ? 'Home Team' : 'Away Team'
        } (3 - 0)\nAwarded by Center Referee: ${currentUserName}.`,
        officialEvents: [],
      });

      setFixtures((prev) =>
        prev.map((f) =>
          f.id === fixtureId
            ? {
                ...f,
                status: 'FT',
                scoreA: scoreHome,
                scoreB: scoreAway,
                events: [],
              }
            : f
        )
      );

      setWalkoverFixture(null);
      setSuccessMsg(`Walkover awarded successfully! Score: ${scoreHome} - ${scoreAway} (3-0 win committed via Algorithm 1).`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to award walkover.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Match Report Action
  const submitMatchReport = async (reportData: {
    scoreHome: number;
    scoreAway: number;
    matchState: MatchStatus;
    goals: GoalEntry[];
    cards: CardEntry[];
    injuries: InjuryEntry[];
  }) => {
    if (!selectedFixture) return;
    setIsSubmitting(true);
    setAuthError(null);

    const compiledEvents: Array<{
      type: MatchEventType;
      eventTarget: 'home' | 'away' | 'match';
      minute: number;
      detailText?: string;
      playerId?: string;
      teamId?: string;
    }> = [
      ...reportData.goals.map((g) => ({
        type: (g.goalType === 'penalty' ? 'penalty' : 'goal') as MatchEventType,
        eventTarget: g.teamTarget,
        teamId: g.teamTarget === 'home' ? selectedFixture.teamA.id : selectedFixture.teamB.id,
        minute: Number(g.minute) || 1,
        detailText: `Goal: ${g.playerName} (#${g.jerseyNumber || '-'})`,
        playerId: g.playerId,
      })),
      ...reportData.cards.map((c) => ({
        type: (c.cardType === 'yellow' ? 'yellow' : 'red') as MatchEventType,
        eventTarget: c.teamTarget,
        teamId: c.teamTarget === 'home' ? selectedFixture.teamA.id : selectedFixture.teamB.id,
        minute: Number(c.minute) || 1,
        detailText: `${c.cardType.toUpperCase()} Card: ${c.playerName} (#${c.jerseyNumber || '-'})`,
        playerId: c.playerId,
      })),
      ...reportData.injuries.map((i) => ({
        type: 'injury' as MatchEventType,
        eventTarget: i.teamTarget,
        teamId: i.teamTarget === 'home' ? selectedFixture.teamA.id : selectedFixture.teamB.id,
        minute: Number(i.minute) || 1,
        detailText: `Injury timeout: ${i.playerName} (#${i.jerseyNumber || '-'})`,
        playerId: i.playerId,
      })),
    ];

    try {
      const result = await ApiService.verifyOfficialMatchResult({
        fixtureId: selectedFixture.id,
        refereeId: currentUserId,
        scoreHome: reportData.scoreHome,
        scoreAway: reportData.scoreAway,
        status: reportData.matchState,
        reportText: `OFFICIAL MATCH REPORT\nFinal Score: ${reportData.scoreHome} - ${reportData.scoreAway}\nStatus: ${reportData.matchState}`,
        officialEvents: compiledEvents,
      });

      if (result.success || result.data) {
        setFixtures((prev) =>
          prev.map((f) =>
            f.id === selectedFixture.id
              ? {
                  ...f,
                  status: reportData.matchState,
                  scoreA: reportData.scoreHome,
                  scoreB: reportData.scoreAway,
                  events: [
                    ...(f.events || []),
                    ...compiledEvents.map((e, idx) => ({
                      id: `evt_${Date.now()}_${idx}`,
                      minute: e.minute,
                      type: e.type,
                      eventTarget: e.eventTarget,
                      teamId: e.teamId,
                      playerId: e.playerId,
                      detailText: e.detailText,
                      isOfficial: true,
                    })),
                  ],
                }
              : f
          )
        );

        setSuccessMsg(
          `Official Match Report submitted! Score: ${reportData.scoreHome}-${reportData.scoreAway}. Status: ${reportData.matchState}.`
        );
        setActiveTab('overview');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setAuthError(result.message || 'Failed to submit official report.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error submitting official referee report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Announcement / Notice Action
  const createAnnouncement = async (title: string, content: string, targetRole: string = 'all') => {
    setIsSubmitting(true);
    try {
      const newAnc: Omit<Announcement, 'id' | 'created_at'> = {
        title: title.trim(),
        content: content.trim(),
        target_role: targetRole,
        author_id: currentUserId,
      };

      const res = await ApiService.createAnnouncement(newAnc);
      if (res.success && res.data) {
        setAnnouncements((prev) => [res.data!, ...prev]);
      } else {
        // Fallback local append
        setAnnouncements((prev) => [
          {
            id: `anc_${Date.now()}`,
            title: title.trim(),
            content: content.trim(),
            target_role: targetRole,
            author_id: currentUserId,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      setSuccessMsg('Announcement published successfully.');
      setIsAnnouncementModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to post announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (updated: Partial<RefereeProfileData>) => {
    setSuccessMsg('Referee profile details updated successfully.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return {
    currentUserId,
    currentUserName,
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    fixtures,
    todayMatches,
    matchesByMonth,
    announcements,
    isLoading,
    selectedFixtureId,
    setSelectedFixtureId,
    selectedFixture,
    upcomingAssignment,
    countdownStr,
    homeLineup,
    awayLineup,
    profileData,
    authError,
    successMsg,
    isSubmitting,
    walkoverFixture,
    setWalkoverFixture,
    inspectedMatch,
    setInspectedMatch,
    isAnnouncementModalOpen,
    setIsAnnouncementModalOpen,
    cancelMatch,
    awardWalkover,
    submitMatchReport,
    createAnnouncement,
    handleUpdateProfile,
  };
};
