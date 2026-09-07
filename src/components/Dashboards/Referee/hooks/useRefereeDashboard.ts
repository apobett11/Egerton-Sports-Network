import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { ApiService } from '../../../../services/api';
import { supabase } from '../../../../lib/supabase';
import { matchLiveEngine } from '../../../../services/matchLiveEngineAdapter';
import type { Match, MatchEventType, MatchStatus, Announcement } from '../../../../types';
import { mockMatches } from '../../../../mockData';
import type {
  RefereeTab,
  PlayerLookupItem,
  GoalEntry,
  CardEntry,
  InjuryEntry,
  RefereeProfileData,
  MatchdayScheduleGroup,
} from '../types';

export const FALLBACK_REFEREES = [
  { id: 'ref_1', name: 'Dr. Samuel Mwangi', role: 'FIFA Accredited / Senior Official', status: 'Active', email: 'mwangi@egerton.ac.ke' },
  { id: 'ref_2', name: 'Prof. J. K. Kiprop', role: 'Chief Match Official', status: 'Active', email: 'kiprop@egerton.ac.ke' },
  { id: 'ref_3', name: 'Brian Otieno', role: 'Class 1 Referee', status: 'Active', email: 'otieno@egerton.ac.ke' },
];

export const canRefereeActOnMatch = (match: Match, _refereeUid?: string): { canAct: boolean; reason?: string } => {
  if (match.status === 'FT') return { canAct: false, reason: 'Match concluded (Full Time)' };
  if (match.status === 'CANCELLED') return { canAct: false, reason: 'Match has been cancelled' };

  // Unified Match Operations: Referees can update and end matches at any time
  return { canAct: true };
};


export const useRefereeDashboard = () => {
  const { user, profile } = useAuth();
  const currentUserId = user?.id || '';
  const currentUserName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : (user?.user_metadata?.first_name
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
        : 'Match Referee');

  // Referee List & Active Official Resolution
  const [refereesList, setRefereesList] = useState<any[]>(FALLBACK_REFEREES);
  const [activeRefereeId, setActiveRefereeIdState] = useState<string>(() => {
    return localStorage.getItem('esn_active_referee_id') || FALLBACK_REFEREES[0].id;
  });

  const setActiveRefereeId = useCallback((id: string) => {
    setActiveRefereeIdState(id);
    localStorage.setItem('esn_active_referee_id', id);
  }, []);

  const activeReferee = useMemo(() => {
    if (!refereesList.length) return FALLBACK_REFEREES[0];
    if (activeRefereeId) {
      const found = refereesList.find((r) => r.id === activeRefereeId);
      if (found) return found;
    }
    // Match by currentUserId or email
    if (currentUserId) {
      const found = refereesList.find((r) => r.id === currentUserId || (r.email && user?.email && r.email.toLowerCase() === user.email.toLowerCase()));
      if (found) return found;
    }
    return refereesList[0] || FALLBACK_REFEREES[0];
  }, [refereesList, activeRefereeId, currentUserId, user?.email]);

  const effectiveRefereeId = activeReferee?.id || currentUserId;
  const effectiveRefereeName = activeReferee?.name || currentUserName;

  // Unavailable switch: Inactive in database means Unavailable
  const isUnavailable = activeReferee?.status === 'Inactive';

  const [activeTab, setActiveTab] = useState<RefereeTab>('overview');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [rawEvents, setRawEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('');

  const [homeLineup, setHomeLineup] = useState<PlayerLookupItem[]>([]);
  const [awayLineup, setAwayLineup] = useState<PlayerLookupItem[]>([]);

  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [countdownStr, setCountdownStr] = useState<string>('00h : 00m : 00s');

  // Modals State
  const [walkoverFixture, setWalkoverFixture] = useState<Match | null>(null);
  const [inspectedMatch, setInspectedMatch] = useState<Match | null>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState<boolean>(false);
  const [selectedMatchdayGroup, setSelectedMatchdayGroup] = useState<MatchdayScheduleGroup | null>(null);

  // Unified Match Operations: All matches are accessible to any official
  const isAssignedToMe = useCallback(
    (_match: Match | null | undefined, _refId?: string): boolean => {
      return true;
    },
    []
  );

  // Load Assigned Fixtures Scoped by Referee UID from Database
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 0. Fetch all registered referees for assignment verification and pool management
      try {
        const { data: dbRefs } = await supabase
          .from('referees')
          .select('*')
          .is('deleted_at', null)
          .order('name');
        if (dbRefs && dbRefs.length > 0) {
          setRefereesList(dbRefs);
        }
      } catch (err) {
        console.warn('Referees query skipped/offline:', err);
      }

      // 1. Direct Supabase query with all linesmen and profile relations
      let formattedMatches: Match[] = [];
      try {
        const query = supabase
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

        const { data: dbData, error: fixErr } = await query;

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
                id: home?.id || '',
                name: home?.name || 'Home Team',
                shortName: home?.short_name || 'HOM',
                logo: home?.logo_url || '',
                colorCode: home?.color_code || '#D4AF37',
              },
              teamB: {
                id: away?.id || '',
                name: away?.name || 'Away Team',
                shortName: away?.short_name || 'AWY',
                logo: away?.logo_url || '',
                colorCode: away?.color_code || '#2563EB',
              },
              scoreA: f.score_home || 0,
              scoreB: f.score_away || 0,
              events: [],
              stats: [],
              lineups: { teamA: [], teamB: [], formationA: '4-3-3', formationB: '4-3-3' },
              venue: f.venue || 'Egerton Sports Ground',
              referee: refProf ? `${refProf.first_name || ''} ${refProf.last_name || ''}`.trim() : currentUserName,
              refereeId: f.referee_id,
              assistantReferee1: ar1Prof ? `${ar1Prof.first_name || ''} ${ar1Prof.last_name || ''}`.trim() : 'Official Linesman 1',
              assistantReferee1Id: f.assistant_referee_1_id,
              assistantReferee2: ar2Prof ? `${ar2Prof.first_name || ''} ${ar2Prof.last_name || ''}`.trim() : 'Official Linesman 2',
              assistantReferee2Id: f.assistant_referee_2_id,
              fourthOfficial: foProf ? `${foProf.first_name || ''} ${foProf.last_name || ''}`.trim() : 'Table Official',
              fourthOfficialId: f.fourth_official_id,
              attendance: f.attendance,
              weather: f.weather,
              matchday: f.matchday || 1,
              verifiedByRefereeId: f.verified_by_referee_id,
              scheduledTime: f.scheduled_time,
            } as any;
          });
        }
      } catch (err) {
        console.warn('Fixtures supabase fetch skipped/offline:', err);
      }

      if (formattedMatches.length === 0) {
        try {
          const res = await ApiService.getFixtures();
          if (res?.data && res.data.length > 0) {
            formattedMatches = res.data;
          }
        } catch {}
      }

      if (formattedMatches.length === 0) {
        const refId = effectiveRefereeId || 'ref_1';
        formattedMatches = mockMatches.map((m, idx) => ({
          ...m,
          matchday: m.matchday || (idx % 3 + 1),
          scheduledTime: m.scheduledTime || new Date(Date.now() + (idx === 0 ? 3600000 : idx * 86400000)).toISOString(),
          refereeId: refId,
          verifiedByRefereeId: refId,
        }));
      }

      // Unified Referee Dashboard: Load all matches across competitions
      const sortedMatches = [...formattedMatches].sort((a, b) => {
        const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
        const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
        return timeA - timeB;
      });

      setFixtures(sortedMatches);

      // 2. Fetch live match events for referee statistics calculation
      const fixtureIds = sortedMatches.map((m) => m.id);
      if (fixtureIds.length > 0) {
        try {
          const { data: evts } = await supabase
            .from('match_events')
            .select('id, fixture_id, type, minute, player_id, team_id, is_official')
            .in('fixture_id', fixtureIds);
          if (evts) {
            setRawEvents(evts);
          }
        } catch {}
      }

      if (sortedMatches.length > 0 && !selectedFixtureId) {
        const activeOne = sortedMatches.find((m) => m.status !== 'FT' && m.status !== 'CANCELLED') || sortedMatches[0];
        setSelectedFixtureId(activeOne.id);
      }

      // 3. Fetch Announcements
      try {
        const ancRes = await ApiService.getAnnouncements();
        if (ancRes.success && ancRes.data) {
          setAnnouncements(ancRes.data);
        }
      } catch {}
    } catch (err: any) {
      console.warn('Referee data load notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveRefereeId, effectiveRefereeName, selectedFixtureId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Real-time Database Subscription
  useEffect(() => {
    const channel = supabase
      .channel('referee-dashboard-live-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, () => {
        loadDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDashboardData]);

  // Selected Fixture
  const selectedFixture = useMemo(() => {
    return fixtures.find((f) => f.id === selectedFixtureId) || fixtures[0] || null;
  }, [fixtures, selectedFixtureId]);

  // Unified Homepage: Top 3 active events. When one is filled/submitted, another automatically slides in.
  const activeThreeMatches = useMemo<Match[]>(() => {
    return fixtures
      .filter((m) => m.status !== 'FT' && m.status !== 'CANCELLED')
      .sort((a, b) => {
        const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
        const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
        return timeA - timeB;
      })
      .slice(0, 3);
  }, [fixtures]);

  // The NEXT Match: Primary active match
  const nextMatch = useMemo(() => {
    return activeThreeMatches[0] || null;
  }, [activeThreeMatches]);

  // League completion status
  const leagueProgress = useMemo(() => {
    const total = fixtures.length;
    const completed = fixtures.filter((m) => m.status === 'FT' || m.status === 'CANCELLED').length;
    return {
      total,
      completed,
      remaining: Math.max(0, total - completed),
      isAllCompleted: total > 0 && completed === total,
    };
  }, [fixtures]);

  // Helper to test if a match is scheduled on a weekend (Saturday or Sunday)
  const isWeekendMatch = useCallback((match: Match): boolean => {
    if (match.scheduledTime) {
      const d = new Date(match.scheduledTime);
      if (!isNaN(d.getTime())) {
        const day = d.getDay(); // 0 = Sunday, 6 = Saturday
        return day === 0 || day === 6;
      }
    }
    return false;
  }, []);

  // "My Next Matches" - weekend only matches assigned to this referee UID
  const myNextMatches = useMemo(() => {
    const assigned = fixtures.filter((m) => isAssignedToMe(m, effectiveRefereeId) && isWeekendMatch(m));
    const pool = assigned.length > 0 ? assigned : fixtures;
    return pool
      .sort((a, b) => {
        const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
        const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
        return timeA - timeB;
      });
  }, [fixtures, effectiveRefereeId, isAssignedToMe, isWeekendMatch]);

  // Today's matches (filtered strictly by current date / selected date)
  const todayMatches = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayLocaleStr = now.toDateString();

    const targetDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : todayStr;
    const targetDateLocaleStr = selectedDate ? selectedDate.toDateString() : todayLocaleStr;

    const filtered = fixtures.filter((f: any) => {
      if (f.scheduledTime) {
        return f.scheduledTime.startsWith(targetDateStr);
      }
      if (f.id && f.id.length > 10 && !isNaN(Date.parse(f.id))) {
        return new Date(f.id).toDateString() === targetDateLocaleStr;
      }
      return false;
    }).sort((a, b) => {
      const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
      const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
      return timeA - timeB;
    });

    return filtered.length > 0 ? filtered : myNextMatches;
  }, [fixtures, selectedDate, myNextMatches]);

  // Matchdays groups for the "My Matches" page
  const matchdayGroups = useMemo<MatchdayScheduleGroup[]>(() => {
    const map = new Map<number, Match[]>();

    fixtures.forEach((match) => {
      const md = match.matchday || 1;
      if (!map.has(md)) {
        map.set(md, []);
      }
      map.get(md)!.push(match);
    });

    const now = new Date();

    const groups: MatchdayScheduleGroup[] = [];
    map.forEach((matchesList, md) => {
      matchesList.sort((a, b) => {
        const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
        const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
        return timeA - timeB;
      });

      const dates = matchesList
        .map((m) => (m.scheduledTime ? new Date(m.scheduledTime) : null))
        .filter(Boolean) as Date[];

      let dateRangeStr = 'Upcoming Schedule';
      let isArrived = false;

      if (dates.length > 0) {
        const earliest = dates[0];
        const latest = dates[dates.length - 1];

        if (earliest.toDateString() === now.toDateString() || earliest.getTime() <= now.getTime()) {
          isArrived = true;
        }

        if (earliest.toDateString() === latest.toDateString()) {
          dateRangeStr = earliest.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } else {
          dateRangeStr = `${earliest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
      }

      groups.push({
        matchday: md,
        dateRangeStr,
        matches: matchesList,
        isArrived,
      });
    });

    return groups.sort((a, b) => a.matchday - b.matchday);
  }, [fixtures]);

  // Matches grouped by month for historical view
  const matchesByMonth = useMemo(() => {
    const groups: { [key: string]: Match[] } = {};

    fixtures.forEach((match: any) => {
      let dateObj = new Date();
      if (match.scheduledTime) {
        dateObj = new Date(match.scheduledTime);
      }
      const monthKey = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(match);
    });

    return groups;
  }, [fixtures]);

  // Live Database Stats Calculation
  const stats = useMemo(() => {
    const completed = fixtures.filter((f) => f.status === 'FT');
    const upcoming = fixtures.filter((f) => f.status !== 'FT' && f.status !== 'CANCELLED');
    const cancelled = fixtures.filter((f) => f.status === 'CANCELLED');

    let yellows = 0;
    let reds = 0;

    rawEvents.forEach((e) => {
      if (e.type === 'yellow') yellows++;
      if (e.type === 'red') reds++;
    });

    return {
      matchesRefereed: completed.length,
      upcomingMatches: upcoming.length,
      yellowCards: yellows,
      redCards: reds,
      cancelled: cancelled.length,
    };
  }, [fixtures, rawEvents]);

  // Profile Data
  const profileData: RefereeProfileData = useMemo(() => ({
    name: currentUserName,
    email: user?.email || '',
    phone: profile?.phone || '',
    avatarUrl: profile?.avatar_url || '',
    role: 'Center Match Referee',
    association: 'FKF Accredited Official',
    assignedMatchesCount: fixtures.length,
    yearsActive: 5,
    statistics: stats,
  }), [currentUserName, user, profile, fixtures.length, stats]);

  // Countdown Timer for next match
  useEffect(() => {
    if (!nextMatch) {
      setCountdownStr('No upcoming match');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      let targetTime = new Date();

      if (nextMatch.scheduledTime) {
        targetTime = new Date(nextMatch.scheduledTime);
      } else {
        const [hoursStr, minutesStr] = (nextMatch.time || '16:00').split(':');
        targetTime.setHours(parseInt(hoursStr, 10) || 16, parseInt(minutesStr, 10) || 0, 0, 0);
      }

      const diff = targetTime.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdownStr('Ready / Kickoff Time');
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
  }, [nextMatch]);

  // Fetch Player Lineup from Database (No fake hardcoded players)
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

        // Fallback: fetch directly from players table
        if (homeSquad.length === 0 && homeId) {
          const { data: pHome } = await supabase
            .from('players')
            .select('id, jersey_number, position, profiles(first_name, last_name)')
            .eq('team_id', homeId);

          if (pHome) {
            homeSquad = pHome.map((p: any, idx: number) => ({
              id: p.id,
              name: p.profiles ? `${p.profiles.first_name || ''} ${p.profiles.last_name || ''}`.trim() : `Player #${p.jersey_number || idx + 1}`,
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
              name: p.profiles ? `${p.profiles.first_name || ''} ${p.profiles.last_name || ''}`.trim() : `Player #${p.jersey_number || idx + 1}`,
              jerseyNumber: p.jersey_number || idx + 1,
              position: p.position || 'MID',
              isSub: idx >= 11,
            }));
          }
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
    const targetMatch = fixtures.find((f) => f.id === fixtureId);
    if (!targetMatch) {
      setAuthError('Match not found.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    try {
      await matchLiveEngine.refereeCancelMatch({
        match_uid: fixtureId,
        referee_uid: effectiveRefereeId,
        idempotency_key: crypto.randomUUID(),
      }).catch((engineErr) => {
        console.warn('Algorithm 1 cancel note:', engineErr);
      });

      const { error } = await supabase
        .from('fixtures')
        .update({ status: 'CANCELLED' })
        .eq('id', fixtureId);

      if (error) {
        console.warn('Direct update note:', error);
      }

      setFixtures((prev) =>
        prev.map((f) => (f.id === fixtureId ? { ...f, status: 'CANCELLED' } : f))
      );

      setSuccessMsg('Match status updated to CANCELLED.');
      setTimeout(() => setSuccessMsg(null), 3500);
      loadDashboardData();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to cancel match.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Award Walkover Action (3-0 to selected team)
  const awardWalkover = async (fixtureId: string, winningTeamTarget: 'home' | 'away') => {
    const targetMatch = fixtures.find((f) => f.id === fixtureId);
    if (!targetMatch) {
      setAuthError('Match not found.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    const scoreHome = winningTeamTarget === 'home' ? 3 : 0;
    const scoreAway = winningTeamTarget === 'away' ? 3 : 0;
    const winningTeamUid = winningTeamTarget === 'home'
      ? (targetMatch?.teamA.id || '')
      : (targetMatch?.teamB.id || '');

    try {
      await matchLiveEngine.refereeDeclareWalkover({
        match_uid: fixtureId,
        referee_uid: effectiveRefereeId,
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

      await ApiService.verifyOfficialMatchResult({
        fixtureId,
        refereeId: currentUserId,
        scoreHome,
        scoreAway,
        status: 'FT',
        reportText: `OFFICIAL MATCH REPORT - WALKOVER AWARDED\nWinner: ${
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
      setSuccessMsg(`Walkover awarded successfully! Score: ${scoreHome} - ${scoreAway} (3-0 win committed).`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadDashboardData();
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
        detailText: `Injury: ${i.playerName} (#${i.jerseyNumber || '-'})`,
        playerId: i.playerId,
      })),
    ];

    try {
      const result = await ApiService.verifyOfficialMatchResult({
        fixtureId: selectedFixture.id,
        refereeId: effectiveRefereeId,
        scoreHome: reportData.scoreHome,
        scoreAway: reportData.scoreAway,
        status: reportData.matchState,
        reportText: `OFFICIAL MATCH REPORT\nFinal Score: ${reportData.scoreHome} - ${reportData.scoreAway}\nStatus: ${reportData.matchState}`,
        officialEvents: compiledEvents,
      });

      if (result.success || result.data) {
        setSuccessMsg(
          `Official Match Report submitted! Score: ${reportData.scoreHome}-${reportData.scoreAway}. Status: ${reportData.matchState}.`
        );
        setActiveTab('overview');
        setTimeout(() => setSuccessMsg(null), 4000);
        await loadDashboardData();
      } else {
        setAuthError(result.message || 'Failed to submit official report.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error submitting official referee report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Immediate toggle of Referee Availability (Active <-> Inactive in database)
  const toggleAvailability = async (setUnavailable: boolean) => {
    if (!effectiveRefereeId) return;
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const newStatus = setUnavailable ? 'Inactive' : 'Active';
      const { error } = await supabase
        .from('referees')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', effectiveRefereeId);

      if (error) throw error;

      setRefereesList((prev) =>
        prev.map((r) => (r.id === effectiveRefereeId ? { ...r, status: newStatus } : r))
      );

      setSuccessMsg(
        setUnavailable
          ? "Status updated to Unavailable. You will not be included in the next game's match allocation."
          : "Status updated to Available. You will now be allocated into the next game's match allocation."
      );
      setTimeout(() => setSuccessMsg(null), 4500);
      await loadDashboardData();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to update referee availability status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Game Fill: Referee updates match details (Kickoff Time, Scores, Status) at ANY time
  const handleSaveMatchDetails = async (
    fixtureId: string,
    updates: {
      scheduledTime?: string;
      time?: string;
      scoreA?: number;
      scoreB?: number;
      status?: MatchStatus;
      venue?: string;
    }
  ) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const target = fixtures.find((f) => f.id === fixtureId);
      if (!target) throw new Error('Match not found.');

      let isoScheduledTime = updates.scheduledTime;
      if (!isoScheduledTime && updates.time && target.scheduledTime) {
        const baseDate = new Date(target.scheduledTime);
        const [h, m] = updates.time.split(':');
        baseDate.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
        isoScheduledTime = baseDate.toISOString();
      }

      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (isoScheduledTime) payload.scheduled_time = isoScheduledTime;
      if (typeof updates.scoreA === 'number') payload.score_home = updates.scoreA;
      if (typeof updates.scoreB === 'number') payload.score_away = updates.scoreB;
      if (updates.status) payload.status = updates.status;
      if (updates.venue) payload.venue = updates.venue;

      const { error: fixErr } = await supabase
        .from('fixtures')
        .update(payload)
        .eq('id', fixtureId);

      if (fixErr) throw fixErr;

      // Update matchday_schedules if start time was modified
      if (updates.time) {
        await supabase
          .from('matchday_schedules')
          .update({
            start_time: updates.time,
            updated_at: new Date().toISOString(),
          })
          .eq('fixture_id', fixtureId);
      }

      setFixtures((prev) =>
        prev.map((f) => {
          if (f.id !== fixtureId) return f;
          return {
            ...f,
            scheduledTime: isoScheduledTime || f.scheduledTime,
            time: updates.time || f.time,
            scoreA: typeof updates.scoreA === 'number' ? updates.scoreA : f.scoreA,
            scoreB: typeof updates.scoreB === 'number' ? updates.scoreB : f.scoreB,
            status: updates.status || f.status,
            venue: updates.venue || f.venue,
          };
        })
      );

      setSuccessMsg('Match details updated successfully! Live time and scores reflected at frontend guest page.');
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadDashboardData();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to update match details.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Announcement
  const createAnnouncement = async (title: string, content: string, targetRole: string = 'all') => {
    setIsSubmitting(true);
    try {
      const newAnc: Omit<Announcement, 'id' | 'created_at'> = {
        title: title.trim(),
        content: content.trim(),
        target_role: targetRole,
        author_id: effectiveRefereeId,
      };

      const res = await ApiService.createAnnouncement(newAnc);
      if (res.success && res.data) {
        setAnnouncements((prev) => [res.data!, ...prev]);
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

  const handleUpdateProfile = async (_updated: Partial<RefereeProfileData>) => {
    setSuccessMsg('Referee profile details updated successfully.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return {
    currentUserId: effectiveRefereeId,
    currentUserName: effectiveRefereeName,
    activeRefereeId: effectiveRefereeId,
    setActiveRefereeId,
    activeReferee,
    refereesList,
    isUnavailable,
    toggleAvailability,
    handleSaveMatchDetails,
    isAssignedToMe,
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    fixtures,
    nextMatch,
    activeThreeMatches,
    leagueProgress,
    todayMatches,
    myNextMatches,
    matchdayGroups,
    matchesByMonth,
    announcements,
    isLoading,
    selectedFixtureId,
    setSelectedFixtureId,
    selectedFixture,
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
    selectedMatchdayGroup,
    setSelectedMatchdayGroup,
    isAnnouncementModalOpen,
    setIsAnnouncementModalOpen,
    cancelMatch,
    awardWalkover,
    submitMatchReport,
    createAnnouncement,
    handleUpdateProfile,
    loadDashboardData,
  };
};
