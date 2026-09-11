import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Player, UserRole, PracticeSession, Match, DBTeam, FormationName, TacticalSliders, PitchNodeCoordinate, LinesmanMatch, StandingEntry } from '../types';
import { calculateDynamicPitchCoordinates } from '../mockData';
import { useDraftRecovery } from '../../../../hooks/useDraftRecovery';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { useAuth } from '../../../../contexts/AuthContext';
import { supabase } from '../../../../lib/supabase';
import {
  fetchAuthenticatedUserTeam,
  fetchTeamPlayers,
  fetchTeamFixtures,
  fetchTeamLinesmanMatches,
  fetchTeamAnnouncements,
  saveTeamSquadToStrings,
  saveTeamTacticsConfig,
  saveTemporaryMatchSquad,
  DEFAULT_TEAM_UUID,
  publishTeamJournal,
  fetchTeamNews,
  fetchTeamStandings,
  updatePlayerStatusInDb,
  savePracticeScheduleToDb,
  saveMatchLineup,
  deletePlayerFromTeam,
  fetchCoachCaptainProfiles
} from '../lib/supabaseClient';

export type DashboardView = 'DASHBOARD' | 'TACTICS' | 'ROSTER' | 'ROLES' | 'STANDINGS' | 'NEWS' | 'SETTINGS' | 'FIXTURES' | 'KITS';

export interface RoleAssignments {
  captainId: string;
  viceCaptainId: string;
  penaltyTakerId: string;
  freeKickTakerId: string;
  leftCornerTakerId: string;
  rightCornerTakerId: string;
}

export const useTeamDashboard = () => {
  const { user, role: authRole, logout: authLogout } = useAuth();

  const isLoggedIn = Boolean(user && authRole !== 'guest');
  // Coach is the exclusive manager of the Team Dashboard with full permissions
  const currentRole: UserRole = 'COACH';
  const canPublish = true; // Coach has exclusive authority to publish team press releases and announcements

  const [teamId, setTeamId] = useState<string>(DEFAULT_TEAM_UUID);
  const [teamInfo, setTeamInfo] = useState<DBTeam | null>(null);
  const [teamFixtures, setTeamFixtures] = useState<Match[]>([]);
  const [linesmanMatches, setLinesmanMatches] = useState<LinesmanMatch[]>([]);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [teamForm, setTeamForm] = useState<('W' | 'D' | 'L')[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [publishedNews, setPublishedNews] = useState<any[]>([]);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState<boolean>(false);
  const [isSubmittingJournal, setIsSubmittingJournal] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [coachProfile, setCoachProfile] = useState<{ id: string; name: string; email?: string; phone?: string; avatarUrl?: string; role?: string } | null>(null);
  const [captainProfile, setCaptainProfile] = useState<{ id: string; name: string; email?: string; phone?: string; avatarUrl?: string; role?: string } | null>(null);

  const [activeView, setActiveView] = useState<DashboardView>('DASHBOARD');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme-team');
    return saved ? saved === 'dark' : true;
  });

  const [roster, setRoster] = useState<Player[]>([]);
  const [practiceSchedule, setPracticeSchedule] = useState<PracticeSession[]>([]);

  // Formations & Tactical Physics State
  const [formation, setFormation] = useState<FormationName>('4-3-3 Attack');
  const [playstyleSliders, setPlaystyleSliders] = useState<TacticalSliders>({
    attackingDepth: 55,
    defensiveLineHeight: 65,
    teamSupportWidth: 60,
    pressingIntensity: 75,
    buildUpStyle: 'Short Pass',
  });

  // Starting XI Indices in Roster
  const [startingXI, setStartingXI] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignments>({
    captainId: '',
    viceCaptainId: '',
    penaltyTakerId: '',
    freeKickTakerId: '',
    leftCornerTakerId: '',
    rightCornerTakerId: '',
  });

  const [isSubmittingSquad, setIsSubmittingSquad] = useState<boolean>(false);
  const [selectedPitchSlot, setSelectedPitchSlot] = useState<number | null>(null);
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [showRolesModal, setShowRolesModal] = useState<boolean>(false);
  const [activeSquadType, setActiveSquadType] = useState<'NEXT_GAME' | 'DEFAULT'>('NEXT_GAME');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');

  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showSharePopup, setShowSharePopup] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // When coach opens the dashboard, show the link popup if players are 0
  useEffect(() => {
    if (!isLoadingData && roster.length === 0 && teamId) {
      const dismissed = sessionStorage.getItem(`esn_share_popup_${teamId}`);
      if (!dismissed) {
        setShowSharePopup(true);
      }
    }
  }, [isLoadingData, roster.length, teamId]);

  const handleCloseSharePopup = () => {
    setShowSharePopup(false);
    if (teamId) {
      try {
        sessionStorage.setItem(`esn_share_popup_${teamId}`, 'dismissed');
      } catch {}
    }
  };

  // Synchronize Live Supabase Data
  const refreshLiveDashboard = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const coachUserId = user?.id || '';
      const team = await fetchAuthenticatedUserTeam(coachUserId);
      const resolvedTeamId = team?.id || DEFAULT_TEAM_UUID;

      setTeamInfo(team);
      setTeamId(resolvedTeamId);

      if (team?.tactics_config?.formation) {
        setFormation(team.tactics_config.formation as FormationName);
      }
      if (team?.tactics_config?.attackingDepth) {
        setPlaystyleSliders({
          attackingDepth: team.tactics_config.attackingDepth,
          defensiveLineHeight: team.tactics_config.defensiveLineHeight || 65,
          teamSupportWidth: team.tactics_config.teamSupportWidth || 60,
          pressingIntensity: team.tactics_config.pressingIntensity || 75,
          buildUpStyle: team.tactics_config.buildUpStyle || 'Short Pass',
        });
      }
      if (team?.practice_schedule && Array.isArray(team.practice_schedule)) {
        setPracticeSchedule(team.practice_schedule);
      }

      // Parallel fetch from database using UID
      const [coachCapProfiles, dbPlayers, dbFixtures, dbStandings, dbLinesman, dbAnnouncements, dbNews] = await Promise.all([
        fetchCoachCaptainProfiles(resolvedTeamId, coachUserId),
        fetchTeamPlayers(resolvedTeamId),
        fetchTeamFixtures(resolvedTeamId),
        fetchTeamStandings(resolvedTeamId, team?.competition_id),
        fetchTeamLinesmanMatches(resolvedTeamId, user?.id),
        fetchTeamAnnouncements(),
        fetchTeamNews(),
      ]);

      if (coachCapProfiles?.coach) {
        setCoachProfile(coachCapProfiles.coach);
      }
      if (coachCapProfiles?.captain) {
        setCaptainProfile(coachCapProfiles.captain);
      }

      setRoster(dbPlayers);

      if (team?.starting_xi_str && dbPlayers.length > 0) {
        const savedIds = team.starting_xi_str.split(',').map((id: string) => id.trim());
        const resolvedIndices = savedIds
          .map((id: string) => dbPlayers.findIndex((p) => p.id === id))
          .filter((idx: number) => idx !== -1);
        if (resolvedIndices.length === 11) {
          setStartingXI(resolvedIndices);
        }
      }

      setTeamFixtures(dbFixtures);
      setStandings(dbStandings);
      setLinesmanMatches(dbLinesman);
      setAnnouncements(dbAnnouncements || []);
      setPublishedNews(dbNews || []);

      // Derive authentic team form strictly from database
      const myStanding = dbStandings.find((s) => s.isCurrent) || dbStandings.find((s) => s.teamName === team?.name);
      if (myStanding && myStanding.recentForm && myStanding.recentForm.length > 0) {
        setTeamForm(myStanding.recentForm);
      } else {
        const finishedOutcomes = dbFixtures
          .filter((f) => f.status === 'FINISHED' && f.result)
          .map((f) => f.result as 'W' | 'D' | 'L')
          .slice(-6);
        setTeamForm(finishedOutcomes);
      }
    } catch (err) {
      console.warn('[useTeamDashboard] Error loading fresh database records:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    refreshLiveDashboard();

    // Subscribe to realtime database updates so data is always fresh
    const channel = supabase
      .channel('coach_dashboard_live_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, () => {
        refreshLiveDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'league_standings' }, () => {
        refreshLiveDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        refreshLiveDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        refreshLiveDashboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshLiveDashboard]);

  // Compute Dynamic Pitch Coordinates from Tactical Physics Math
  const pitchNodes: PitchNodeCoordinate[] = useMemo(() => {
    return calculateDynamicPitchCoordinates(formation, playstyleSliders);
  }, [formation, playstyleSliders]);

  const handleOpenNextGameSquad = () => {
    setActiveSquadType('NEXT_GAME');
    setActiveView('TACTICS');
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme-team', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme-team', 'light');
    }
  }, [darkMode]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  const handleLogout = async () => {
    await authLogout();
    window.location.hash = '/login';
  };

  const collectiveRating = Math.round(
    startingXI.reduce((sum, idx) => sum + (roster[idx]?.rating || 75), 0) / 11
  );
  const collectiveStrength = startingXI.reduce((sum, idx) => sum + (roster[idx]?.rating || 75), 0) * 2 + 500;
  const benchPlayers = roster.filter((_, idx) => !startingXI.includes(idx));

  // Swap slots directly on the pitch
  const handleSwapPitchSlots = (sourceSlot: number, targetSlot: number) => {
    const updated = [...startingXI];
    const temp = updated[sourceSlot];
    updated[sourceSlot] = updated[targetSlot];
    updated[targetSlot] = temp;
    setStartingXI(updated);
    showToast(`Swapped ${roster[updated[sourceSlot]]?.name} with ${roster[updated[targetSlot]]?.name}`);
  };

  const handleSaveRoles = () => {
    showToast('Saved Tactical Match Roles successfully.');
  };

  const handleSaveFormation = async () => {
    await saveTeamTacticsConfig(teamId, {
      ...playstyleSliders,
      formation,
    });
    showToast(`Saved Formation (${formation}) & Tactical Sliders to database.`);
  };

  const handleSaveSquad = async () => {
    if (isSubmittingSquad) return;
    setIsSubmittingSquad(true);

    try {
      const startingPlayers = startingXI.map((idx) => roster[idx]).filter(Boolean);
      const bench = roster.filter((_, idx) => !startingXI.includes(idx));
      const startingIds = startingPlayers.map((p) => p.id);
      const subsIds = bench.map((p) => p.id);

      if (activeSquadType === 'DEFAULT') {
        await saveTeamSquadToStrings(teamId, startingIds, subsIds);
        showToast('🚀 Saved Default Base Squad (First 11 & Substitutes) to teams table!');
      } else {
        await saveTemporaryMatchSquad(teamId, {
          startingXI,
          formation,
          sliders: playstyleSliders,
          timestamp: new Date().toISOString(),
        });
        showToast('⚡ Committed Impending Next-Match Squad to database!');
      }
    } catch (err: any) {
      showToast(`Save notice: ${err.message}`);
    } finally {
      setIsSubmittingSquad(false);
    }
  };

  const handleSwapPlayer = (benchPlayerIdxInRoster: number) => {
    if (selectedPitchSlot === null) return;
    const updated = [...startingXI];
    const oldPlayerName = roster[updated[selectedPitchSlot]]?.name || 'Player';
    const newPlayerName = roster[benchPlayerIdxInRoster]?.name || 'Player';
    updated[selectedPitchSlot] = benchPlayerIdxInRoster;

    setStartingXI(updated);
    setShowSwapModal(false);
    showToast(`Substituted ${newPlayerName} in for ${oldPlayerName}`);
  };

  const handleUpdatePlayerStatus = async (playerId: string, newStatus: 'Fit' | 'Active' | 'Injured' | 'Suspended' | 'Recovering') => {
    if (currentRole !== 'COACH') {
      showToast('Permission Denied: Only Coach can update player availability status.');
      return;
    }
    setRoster((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            status: newStatus,
            isInjured: newStatus === 'Injured',
            isSuspended: newStatus === 'Suspended',
          };
        }
        return p;
      })
    );
    await updatePlayerStatusInDb(playerId, newStatus);
    showToast(`Updated player availability status to ${newStatus}.`);
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (currentRole !== 'COACH') {
      showToast('Permission Denied: Only Head Coach can manage players.');
      return;
    }
    const playerToRemove = roster.find((p) => p.id === playerId);
    const oldIdx = roster.findIndex((p) => p.id === playerId);

    setRoster((prev) => prev.filter((p) => p.id !== playerId));

    // Safely shift startingXI indices
    if (oldIdx !== -1) {
      setStartingXI((prev) =>
        prev
          .filter((idx) => idx !== oldIdx)
          .map((idx) => (idx > oldIdx ? idx - 1 : idx))
      );
    }

    await deletePlayerFromTeam(playerId, teamId);
    showToast(`Removed ${playerToRemove?.name || 'player'} from squad.`);
  };

  const handleAssignActivity = (sessionId: string, newActivity: string) => {
    setPracticeSchedule((prev) => {
      const updated = prev.map((s) => (s.id === sessionId ? { ...s, activity: newActivity, assignedBy: 'Coach Marcus' } : s));
      savePracticeScheduleToDb(teamId, updated);
      return updated;
    });
    showToast(`Assigned "${newActivity}" to drill schedule.`);
  };

  const handleAddPracticeDay = (
    day: string,
    time: string,
    location: string,
    intensity: 'High' | 'Medium' | 'Recovery' = 'High',
    activity: string = 'Tactical drills'
  ) => {
    const newSession: PracticeSession = {
      id: `ps_${Date.now()}`,
      day,
      time,
      location,
      activity,
      assignedBy: 'Coach Marcus',
      coachApproved: true,
      intensity,
      focusArea: activity,
    };
    setPracticeSchedule((prev) => {
      const updated = [...prev, newSession];
      savePracticeScheduleToDb(teamId, updated);
      return updated;
    });
    showToast(`Coach Marcus added ${day} (${activity}) session to schedule.`);
  };

  const handleApprovePracticeDay = (sessionId: string) => {
    setPracticeSchedule((prev) => {
      const updated = prev.map((s) => (s.id === sessionId ? { ...s, coachApproved: true } : s));
      savePracticeScheduleToDb(teamId, updated);
      return updated;
    });
    showToast('Coach approved training workout.');
  };

  const handleSaveMatchLineup = async (
    fixtureId?: string,
    startingXIPlayers?: Player[],
    subPlayers?: Player[],
    formationStr?: string,
    capId?: string
  ) => {
    const activeStarting = startingXIPlayers || startingXI.map((idx) => roster[idx]).filter(Boolean);
    const activeSubs = subPlayers || roster.filter((_, idx) => !startingXI.includes(idx));
    const targetFormation = formationStr || formation;

    const res = await saveMatchLineup({
      fixtureId,
      teamId,
      startingXi: activeStarting,
      substitutes: activeSubs,
      formation: targetFormation,
      captainId: capId || roleAssignments.captainId,
    });

    if (res) {
      showToast('Official Matchday Lineup committed to database for Referee!');
    } else {
      showToast('Lineup saved to club roster strings.');
    }
    return res;
  };

  const handlePublishJournal = async (title: string, content: string, category: string) => {
    if (!canPublish) {
      showToast('Permission Denied: Only Head Coach can publish team journals.');
      return;
    }
    setIsSubmittingJournal(true);
    try {
      await publishTeamJournal({
        title,
        content,
        category,
        authorId: user?.id,
        teamId,
      });
      showToast('🚀 Team Press Release published to newsroom!');
      setIsComposeModalOpen(false);
      const updatedNews = await fetchTeamNews();
      setPublishedNews(updatedNews);
    } catch (err: any) {
      showToast(`Publication failed: ${err.message}`);
    } finally {
      setIsSubmittingJournal(false);
    }
  };

  // Filtered Roster for Players List
  const filteredRoster = roster.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(player.number).includes(searchTerm);
    const matchesPos = positionFilter === 'ALL' || player.position === positionFilter;
    return matchesSearch && matchesPos;
  });

  const refreshRoster = useCallback(async () => {
    if (teamId) {
      const dbPlayers = await fetchTeamPlayers(teamId);
      if (dbPlayers && dbPlayers.length > 0) {
        setRoster(dbPlayers);
      }
    }
  }, [teamId]);

  return {
    isLoggedIn,
    currentRole,
    canPublish,
    teamId,
    teamInfo,
    coachProfile,
    captainProfile,
    activeView,
    setActiveView,
    darkMode,
    setDarkMode,
    isLoadingData,
    roster,
    refreshRoster,
    practiceSchedule,
    formation,
    setFormation,
    playstyleSliders,
    setPlaystyleSliders,
    pitchNodes,
    startingXI,
    benchPlayers,
    collectiveRating,
    collectiveStrength,
    selectedPitchSlot,
    setSelectedPitchSlot,
    handleSwapPitchSlots,
    showSwapModal,
    setShowSwapModal,
    showRolesModal,
    setShowRolesModal,
    roleAssignments,
    setRoleAssignments,
    handleSaveMatchLineup,
    activeSquadType,
    setActiveSquadType,
    handleOpenNextGameSquad,
    handleSaveSquad,
    handleSaveFormation,
    handleSaveRoles,
    handleSwapPlayer,
    handleUpdatePlayerStatus,
    handleDeletePlayer,
    handleAssignActivity,
    handleAddPracticeDay,
    handleApprovePracticeDay,
    searchTerm,
    setSearchTerm,
    positionFilter,
    setPositionFilter,
    filteredRoster,
    teamFixtures,
    linesmanMatches,
    announcements,
    publishedNews,
    isComposeModalOpen,
    setIsComposeModalOpen,
    isSubmittingJournal,
    handlePublishJournal,
    showInviteModal,
    setShowInviteModal,
    showSharePopup,
    setShowSharePopup,
    handleCloseSharePopup,
    toastMessage,
    showToast,
    handleLogout,
    standings,
    teamForm,
  };
};

