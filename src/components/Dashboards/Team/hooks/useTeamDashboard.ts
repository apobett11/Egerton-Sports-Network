import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Player, UserRole, PracticeSession, Match, DBTeam, FormationName, TacticalSliders, PitchNodeCoordinate } from '../types';
import { initialRoster, initialPracticeSchedule, initialFixtures, initialStandings, initialTeamForm, calculateDynamicPitchCoordinates } from '../mockData';
import { useDraftRecovery } from '../../../../hooks/useDraftRecovery';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  fetchAuthenticatedUserTeam,
  fetchTeamPlayers,
  fetchTeamFixtures,
  fetchTeamAnnouncements,
  saveTeamSquadToStrings,
  saveTeamTacticsConfig,
  saveTemporaryMatchSquad,
  DEFAULT_TEAM_UUID,
  publishTeamJournal,
  fetchTeamNews
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
  const currentRole: UserRole = authRole === 'captain' ? 'CAPTAIN' : 'COACH';
  const canPublish = (authRole === 'coach' || authRole === 'captain') || (!authRole && (currentRole === 'COACH' || currentRole === 'CAPTAIN'));

  const [teamId, setTeamId] = useState<string>(DEFAULT_TEAM_UUID);
  const [teamInfo, setTeamInfo] = useState<DBTeam | null>(null);
  const [teamFixtures, setTeamFixtures] = useState<Match[]>(initialFixtures);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [publishedNews, setPublishedNews] = useState<any[]>([]);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState<boolean>(false);
  const [isSubmittingJournal, setIsSubmittingJournal] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const [activeView, setActiveView] = useState<DashboardView>('DASHBOARD');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme-team');
    return saved ? saved === 'dark' : true;
  });

  const [roster, setRoster] = useState<Player[]>(initialRoster);
  const [practiceSchedule, setPracticeSchedule] = useState<PracticeSession[]>(initialPracticeSchedule);

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
  const [startingXI, setStartingXI] = useState<number[]>([0, 1, 3, 7, 9, 10, 5, 6, 12, 4, 8]);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignments>({
    captainId: 'p2',
    viceCaptainId: 'p6',
    penaltyTakerId: 'p5',
    freeKickTakerId: 'p6',
    leftCornerTakerId: 'p6',
    rightCornerTakerId: 'p2',
  });

  const [isSubmittingSquad, setIsSubmittingSquad] = useState<boolean>(false);
  const [selectedPitchSlot, setSelectedPitchSlot] = useState<number | null>(null);
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [showRolesModal, setShowRolesModal] = useState<boolean>(false);
  const [activeSquadType, setActiveSquadType] = useState<'NEXT_GAME' | 'DEFAULT'>('NEXT_GAME');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');

  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize Live Supabase Data
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      if (!user) {
        setIsLoadingData(false);
        return;
      }
      setIsLoadingData(true);
      try {
        const team = await fetchAuthenticatedUserTeam(user.id);
        const resolvedTeamId = team?.id || DEFAULT_TEAM_UUID;
        if (isMounted) {
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
        }

        const dbPlayers = await fetchTeamPlayers(resolvedTeamId);
        if (isMounted && dbPlayers.length > 0) {
          setRoster(dbPlayers);
        }

        const dbFixtures = await fetchTeamFixtures(resolvedTeamId);
        if (isMounted && dbFixtures.length > 0) {
          setTeamFixtures(dbFixtures);
        }

        const dbAnnouncements = await fetchTeamAnnouncements();
        if (isMounted && dbAnnouncements.length > 0) {
          setAnnouncements(dbAnnouncements);
        }

        const dbNews = await fetchTeamNews();
        if (isMounted && dbNews.length > 0) {
          setPublishedNews(dbNews);
        }
      } catch (err) {
        console.warn('Data initialization error:', err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }
    initData();
    return () => { isMounted = false; };
  }, [user]);

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
    if (currentRole !== 'CAPTAIN') {
      showToast('Permission Denied: Only Captain can assign set-piece match roles.');
      return;
    }
    showToast('Saved Tactical Match Roles successfully.');
  };

  const handleSaveFormation = async () => {
    if (currentRole !== 'CAPTAIN') {
      showToast('Permission Denied: Only Captain can update formation layout.');
      return;
    }
    await saveTeamTacticsConfig(teamId, {
      ...playstyleSliders,
      formation,
    });
    showToast(`Saved Formation (${formation}) & Tactical Sliders to database.`);
  };

  const handleSaveSquad = async () => {
    if (currentRole !== 'COACH') {
      showToast('Permission Denied: Only Coach can save squad configurations.');
      return;
    }
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
    if (currentRole !== 'COACH') {
      showToast('Permission Denied: Only Coach can swap substitutes.');
      return;
    }
    if (selectedPitchSlot === null) return;
    const updated = [...startingXI];
    const oldPlayerName = roster[updated[selectedPitchSlot]]?.name || 'Player';
    const newPlayerName = roster[benchPlayerIdxInRoster]?.name || 'Player';
    updated[selectedPitchSlot] = benchPlayerIdxInRoster;

    setStartingXI(updated);
    setShowSwapModal(false);
    showToast(`Substituted ${newPlayerName} in for ${oldPlayerName}`);
  };

  const handleUpdatePlayerStatus = (playerId: string, newStatus: 'Fit' | 'Active' | 'Injured' | 'Suspended' | 'Recovering') => {
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
    showToast('Updated player availability status.');
  };

  const handleAssignActivity = (sessionId: string, newActivity: string) => {
    if (currentRole !== 'CAPTAIN') {
      showToast('Permission Denied: Only Captain can organize training drills.');
      return;
    }
    setPracticeSchedule((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, activity: newActivity, assignedBy: 'Captain Leo' } : s))
    );
    showToast(`Assigned "${newActivity}" to drill schedule.`);
  };

  const handleAddPracticeDay = (day: string, time: string, location: string) => {
    if (currentRole !== 'CAPTAIN') {
      showToast('Permission Denied: Only Captain can add practice days.');
      return;
    }
    const newSession: PracticeSession = {
      id: `ps_${Date.now()}`,
      day,
      time,
      location,
      activity: 'Tactical drills',
      assignedBy: 'Captain Leo',
    };
    setPracticeSchedule((prev) => [...prev, newSession]);
    showToast(`Added ${day} drill session to schedule.`);
  };

  const handlePublishJournal = async (title: string, content: string, category: string) => {
    if (!canPublish) {
      showToast('Permission Denied: Only Coach or Captain can publish team journals.');
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

  return {
    isLoggedIn,
    currentRole,
    canPublish,
    teamId,
    teamInfo,
    activeView,
    setActiveView,
    darkMode,
    setDarkMode,
    isLoadingData,
    roster,
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
    activeSquadType,
    setActiveSquadType,
    handleOpenNextGameSquad,
    handleSaveSquad,
    handleSaveFormation,
    handleSaveRoles,
    handleSwapPlayer,
    handleUpdatePlayerStatus,
    handleAssignActivity,
    handleAddPracticeDay,
    searchTerm,
    setSearchTerm,
    positionFilter,
    setPositionFilter,
    filteredRoster,
    teamFixtures,
    announcements,
    publishedNews,
    isComposeModalOpen,
    setIsComposeModalOpen,
    isSubmittingJournal,
    handlePublishJournal,
    showInviteModal,
    setShowInviteModal,
    toastMessage,
    showToast,
    handleLogout,
    standings: initialStandings,
    teamForm: initialTeamForm,
  };
};
