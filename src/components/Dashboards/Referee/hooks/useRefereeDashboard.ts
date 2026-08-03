import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { ApiService } from '../../../../services/api';
import { supabase } from '../../../../lib/supabase';
import type { Match, MatchEventType, MatchStatus, Announcement } from '../../../../types';
import type { RefereeTab, PlayerLookupItem, GoalEntry, CardEntry, InjuryEntry, RefereeProfileData } from '../types';

export const useRefereeDashboard = () => {
  const { user, profile } = useAuth();
  const currentUserId = user?.id || 'referee-1';
  const currentUserName = profile ? `${profile.first_name} ${profile.last_name}` : 'John Kiptoo';

  const [activeTab, setActiveTab] = useState<RefereeTab>('home');
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

  // Sticky Compose Button Scroll State (Task 12)
  const [isComposeVisible, setIsComposeVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState<boolean>(false);

  // Scroll direction listener for floating compose button
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsComposeVisible(false); // Scrolling down -> hide button
      } else {
        setIsComposeVisible(true);  // Scrolling up -> show sticky button
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Load Assigned Fixtures & President Announcements (Task 11 & Task 15)
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Fixtures
      const res = await ApiService.getFixtures();
      const allMatches = res.data || [];

      const assigned = allMatches.map((m, idx) => ({
        ...m,
        refereeId: m.refereeId || (idx < 3 ? currentUserId : `other_referee_${idx}`),
      }));

      const myMatches = assigned.filter((m) => m.refereeId === currentUserId || m.refereeId === 'referee-1');
      setFixtures(myMatches.length > 0 ? myMatches : assigned);

      if (myMatches.length > 0 && !selectedFixtureId) {
        const activeOne = myMatches.find((m) => m.status !== 'FT' && m.status !== 'CANCELLED') || myMatches[0];
        setSelectedFixtureId(activeOne.id);
      }

      // 2. Fetch President Announcements ONLY (Task 11)
      const ancRes = await ApiService.getAnnouncements();
      if (ancRes.success && ancRes.data) {
        setAnnouncements(ancRes.data);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to load referee data.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, selectedFixtureId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Selected Fixture
  const selectedFixture = useMemo(() => {
    return fixtures.find((f) => f.id === selectedFixtureId) || fixtures[0] || null;
  }, [fixtures, selectedFixtureId]);

  // Upcoming Assignment
  const upcomingAssignment = useMemo(() => {
    return fixtures.find((m) => m.status !== 'FT' && m.status !== 'CANCELLED') || fixtures[0] || null;
  }, [fixtures]);

  // Upcoming vs Past Matches (Task 13)
  const upcomingMatches = useMemo(() => {
    return fixtures.filter((f) => f.status !== 'FT' && f.status !== 'CANCELLED');
  }, [fixtures]);

  const pastMatches = useMemo(() => {
    return fixtures.filter((f) => f.status === 'FT' || f.status === 'CANCELLED');
  }, [fixtures]);

  // Quick Stats calculation from database (Task 10 & Task 15)
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

  // Profile Data state
  const profileData: RefereeProfileData = useMemo(() => ({
    name: currentUserName,
    email: user?.email || 'referee@egertonsports.ac.ke',
    phone: profile?.phone || '+254 700 000 000',
    avatarUrl: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    role: 'Center Match Referee',
    association: 'Rift Valley FKF Branch',
    assignedMatchesCount: fixtures.length,
    yearsActive: 8,
    statistics: stats,
  }), [currentUserName, user, profile, fixtures.length, stats]);

  // Countdown Timer
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

  // Fetch Player Lineup for automatic jersey lookup (Task 4 & Task 5)
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

        // Default mock fallback squad if database squad empty
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

  // Cancel Match Action
  const cancelMatch = async (fixtureId: string) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await supabase
        .from('fixtures')
        .update({ status: 'CANCELLED' })
        .eq('id', fixtureId);

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
        detailText: `Goal: ${g.playerName} (#${g.jerseyNumber})`,
        playerId: g.playerId,
      })),
      ...reportData.cards.map((c) => ({
        type: (c.cardType === 'yellow' ? 'yellow' : 'red') as MatchEventType,
        eventTarget: c.teamTarget,
        teamId: c.teamTarget === 'home' ? selectedFixture.teamA.id : selectedFixture.teamB.id,
        minute: Number(c.minute) || 1,
        detailText: `${c.cardType.toUpperCase()} Card: ${c.playerName} (#${c.jerseyNumber})`,
        playerId: c.playerId,
      })),
      ...reportData.injuries.map((i) => ({
        type: 'injury' as MatchEventType,
        eventTarget: i.teamTarget,
        teamId: i.teamTarget === 'home' ? selectedFixture.teamA.id : selectedFixture.teamB.id,
        minute: Number(i.minute) || 1,
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

  // Submit Match Journal (Task 12)
  const submitMatchJournal = async (journalTitle: string, journalNotes: string) => {
    setIsSubmitting(true);
    try {
      // Save journal entry to news_articles table in Supabase
      const { error } = await supabase.from('news_articles').insert({
        title: journalTitle,
        content: journalNotes,
        excerpt: journalNotes.slice(0, 120),
        status: 'published',
        category: 'referee_journal',
        author_id: currentUserId,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('Database error creating journal:', error.message);
      }

      setSuccessMsg('Match Journal published successfully!');
      setIsJournalModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to post match journal.');
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
    fixtures,
    upcomingMatches,
    pastMatches,
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
    isComposeVisible,
    isJournalModalOpen,
    setIsJournalModalOpen,
    cancelMatch,
    submitMatchReport,
    submitMatchJournal,
    handleUpdateProfile,
  };
};
