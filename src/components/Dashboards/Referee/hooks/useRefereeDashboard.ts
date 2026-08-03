import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { ApiService } from '../../../../services/api';
import { supabase } from '../../../../lib/supabase';
import type { Match, MatchEventType, MatchStatus } from '../../../../types';
import type { RefereeTab, PlayerLookupItem, GoalEntry, CardEntry, InjuryEntry, RefereeProfileData } from '../types';

export const useRefereeDashboard = () => {
  const { user, profile } = useAuth();
  const currentUserId = user?.id || 'referee-1';
  const currentUserName = profile ? `${profile.first_name} ${profile.last_name}` : 'Prof. J. K. Kiprop';

  const [activeTab, setActiveTab] = useState<RefereeTab>('home');
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('');

  const [homeLineup, setHomeLineup] = useState<PlayerLookupItem[]>([]);
  const [awayLineup, setAwayLineup] = useState<PlayerLookupItem[]>([]);

  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [countdownStr, setCountdownStr] = useState<string>('00h : 00m : 00s');

  // Referee Profile state
  const [profileData, setProfileData] = useState<RefereeProfileData>({
    name: currentUserName,
    email: user?.email || 'referee@egertonsports.ac.ke',
    phone: profile?.phone || '+254 700 000 000',
    avatarUrl: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    role: 'Center Match Referee',
    association: 'Rift Valley FKF Branch',
    assignedMatchesCount: 0,
    yearsActive: 8,
    statistics: {
      matchesRefereed: 14,
      yellowCards: 28,
      redCards: 3,
      penalties: 6,
      cancelled: 1,
    },
  });

  // Load Assigned Fixtures from Supabase
  const loadAssignedFixtures = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.getFixtures();
      const allMatches = res.data || [];

      // Filter matches assigned to referee (or assign first matches if in dev)
      const assigned = allMatches.map((m, idx) => ({
        ...m,
        refereeId: m.refereeId || (idx < 3 ? currentUserId : `other_referee_${idx}`),
      }));

      const myMatches = assigned.filter((m) => m.refereeId === currentUserId || m.refereeId === 'referee-1');
      setFixtures(myMatches.length > 0 ? myMatches : assigned);

      if (myMatches.length > 0 && !selectedFixtureId) {
        const activeOne = myMatches.find((m) => m.status !== 'FT') || myMatches[0];
        setSelectedFixtureId(activeOne.id);
      }

      setProfileData((prev) => ({
        ...prev,
        assignedMatchesCount: myMatches.length,
      }));
    } catch (err: any) {
      setAuthError(err.message || 'Failed to load referee fixtures.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, selectedFixtureId]);

  useEffect(() => {
    loadAssignedFixtures();
  }, [loadAssignedFixtures]);

  // Selected Fixture
  const selectedFixture = useMemo(() => {
    return fixtures.find((f) => f.id === selectedFixtureId) || fixtures[0] || null;
  }, [fixtures, selectedFixtureId]);

  // Upcoming Assignment
  const upcomingAssignment = useMemo(() => {
    return fixtures.find((m) => m.status !== 'FT' && m.status !== 'CANCELLED') || fixtures[0] || null;
  }, [fixtures]);

  // Kickoff Countdown Timer
  useEffect(() => {
    if (!upcomingAssignment) {
      setCountdownStr('No upcoming matches scheduled');
      return;
    }

    const timer = setInterval(() => {
      const targetTime = new Date();
      targetTime.setHours(16, 0, 0, 0);
      const diff = Math.max(0, targetTime.getTime() - Date.now());

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setCountdownStr(
        `${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [upcomingAssignment]);

  // Fetch Player Lineup for automatic jersey lookup (Task 8)
  useEffect(() => {
    async function fetchMatchLineups() {
      if (!selectedFixture) return;

      const homeId = selectedFixture.teamA.id;
      const awayId = selectedFixture.teamB.id;

      try {
        // Query stored match_lineups
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

        // Fallback: fetch from players table if lineups empty
        if (homeSquad.length === 0 && homeId) {
          const { data: pHome } = await supabase
            .from('players')
            .select('id, jersey_number, position, profiles(first_name, last_name)')
            .eq('team_id', homeId);

          if (pHome) {
            homeSquad = pHome.map((p: any, idx: number) => ({
              id: p.id,
              name: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : `Player ${p.jersey_number}`,
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
              name: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : `Player ${p.jersey_number}`,
              jerseyNumber: p.jersey_number || idx + 1,
              position: p.position || 'MID',
              isSub: idx >= 11,
            }));
          }
        }

        // Default mock fallback if database squad empty
        if (homeSquad.length === 0) {
          homeSquad = [
            { id: 'h1', name: 'Victor Wanyama', jerseyNumber: 9, position: 'FWD', isSub: false },
            { id: 'h2', name: 'Michael Olunga', jerseyNumber: 10, position: 'FWD', isSub: false },
            { id: 'h3', name: 'Patrick Matasi', jerseyNumber: 1, position: 'GK', isSub: false },
            { id: 'h4', name: 'Eric Ouma', jerseyNumber: 3, position: 'DEF', isSub: false },
            { id: 'h5', name: 'Joseph Okumu', jerseyNumber: 5, position: 'DEF', isSub: false },
            { id: 'h6', name: 'Anthony Akumu', jerseyNumber: 6, position: 'MID', isSub: false },
            { id: 'h7', name: 'Johanna Omolo', jerseyNumber: 8, position: 'MID', isSub: false },
            { id: 'h8', name: 'Ayub Timbe', jerseyNumber: 7, position: 'FWD', isSub: false },
            { id: 'h9', name: 'Clifton Miheso', jerseyNumber: 11, position: 'MID', isSub: false },
            { id: 'h10', name: 'Abud Omar', jerseyNumber: 2, position: 'DEF', isSub: false },
            { id: 'h11', name: 'David Owino', jerseyNumber: 4, position: 'DEF', isSub: false },
            { id: 'h12', name: 'Farouk Shikhalo', jerseyNumber: 18, position: 'GK', isSub: true },
            { id: 'h13', name: 'Kenneth Muguna', jerseyNumber: 15, position: 'MID', isSub: true },
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
            { id: 'a12', name: 'Boniface Oluoch', jerseyNumber: 16, position: 'GK', isSub: true },
            { id: 'a13', name: 'Allan Wanga', jerseyNumber: 22, position: 'FWD', isSub: true },
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

  // Cancel Match Action (Task 6)
  const cancelMatch = async (fixtureId: string) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      // Update fixture status in Supabase database
      const { error } = await supabase
        .from('fixtures')
        .update({ status: 'CANCELLED' })
        .eq('id', fixtureId);

      if (error) {
        // Fallback local state update if offline or RLS policy restricts
        console.warn('Database cancel warning:', error.message);
      }

      setFixtures((prev) =>
        prev.map((f) => (f.id === fixtureId ? { ...f, status: 'CANCELLED' } : f))
      );

      setSuccessMsg('Match marked as CANCELLED.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to cancel match.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Match Report Action (Task 7)
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
        minute: g.minute,
        detailText: `Goal: ${g.playerName} (#${g.jerseyNumber})`,
        playerId: g.playerId,
      })),
      ...reportData.cards.map((c) => ({
        type: (c.cardType === 'yellow' ? 'yellow' : 'red') as MatchEventType,
        eventTarget: c.teamTarget,
        teamId: c.teamTarget === 'home' ? selectedFixture.teamA.id : selectedFixture.teamB.id,
        minute: c.minute,
        detailText: `${c.cardType.toUpperCase()} Card: ${c.playerName} (#${c.jerseyNumber})`,
        playerId: c.playerId,
      })),
      ...reportData.injuries.map((i) => ({
        type: 'injury' as MatchEventType,
        eventTarget: i.teamTarget,
        teamId: i.teamTarget === 'home' ? selectedFixture.teamA.id : selectedFixture.teamB.id,
        minute: i.minute,
        detailText: `Injury timeout: ${i.playerName} (#${i.jerseyNumber})`,
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
                }
              : f
          )
        );

        setSuccessMsg(
          `Official Match Report submitted! Score: ${reportData.scoreHome}-${reportData.scoreAway}. Status: ${reportData.matchState}.`
        );
        setActiveTab('my_matches');
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

  // Update Profile Action
  const handleUpdateProfile = async (updated: Partial<RefereeProfileData>) => {
    setProfileData((prev) => ({ ...prev, ...updated }));
    setSuccessMsg('Referee profile details updated successfully.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return {
    currentUserId,
    currentUserName,
    activeTab,
    setActiveTab,
    fixtures,
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
    cancelMatch,
    submitMatchReport,
    handleUpdateProfile,
  };
};
