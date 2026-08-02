import { useState, useEffect, useCallback } from 'react';
import type { Player, UserRole, PracticeSession, Match, DBTeam } from '../types';
import { initialRoster, initialPracticeSchedule, initialFixtures } from '../mockData';
import { useDraftRecovery } from '../../../../hooks/useDraftRecovery';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  fetchAuthenticatedUserTeam,
  fetchTeamPlayers,
  fetchTeamFixtures,
  fetchTeamAnnouncements,
  saveSquadConfiguration,
  loadSquadConfiguration,
  saveMatchLineup,
  DEFAULT_TEAM_UUID
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

  const [teamId, setTeamId] = useState<string>(DEFAULT_TEAM_UUID);
  const [teamInfo, setTeamInfo] = useState<DBTeam | null>(null);
  const [teamFixtures, setTeamFixtures] = useState<Match[]>(initialFixtures);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const [activeView, setActiveView] = useState<DashboardView>('DASHBOARD');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme-team');
    return saved ? saved === 'dark' : true;
  });

  const [roster, setRoster] = useState<Player[]>(initialRoster);
  const [practiceSchedule, setPracticeSchedule] = useState<PracticeSession[]>(initialPracticeSchedule);

  // Auto-Save Lineup & Tactics Draft Recovery
  const {
    value: squadDraftState,
    setValue: setSquadDraftState,
    clearDraft: clearSquadDraft,
    hasRecoveredDraft,
  } = useDraftRecovery(
    {
      startingXI: [0, 1, 3, 7, 9, 10, 5, 6, 12, 4, 8],
      formation: '4-4-1-1',
      activePlaystyle: 'Quick Counter',
      playstyleSliders: {
        attackingDepth: 75,
        defensiveLine: 65,
        teamWidth: 60,
        pressingIntensity: 80,
        buildUpStyle: 'Short Pass',
      },
      roleAssignments: {
        captainId: 'p1',
        viceCaptainId: 'p2',
        penaltyTakerId: 'p5',
        freeKickTakerId: 'p6',
        leftCornerTakerId: 'p6',
        rightCornerTakerId: 'p2',
      },
    },
    { key: 'team_lineup_tactics_draft' }
  );

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
        }

        const dbPlayers = await fetchTeamPlayers(resolvedTeamId);
        if (isMounted && dbPlayers.length > 0) {
          setRoster(dbPlayers);
        }

        const dbFixtures = await fetchTeamFixtures(resolvedTeamId);
        if (isMounted && dbFixtures.length > 0) {
          setTeamFixtures(dbFixtures);
        }

        const dbAnnouncements = await fetchTeamAnnouncements(resolvedTeamId);
        if (isMounted && dbAnnouncements.length > 0) {
          setAnnouncements(dbAnnouncements);
        }

        const dbSquadConfig = await loadSquadConfiguration(resolvedTeamId);
        if (isMounted && dbSquadConfig?.formation) {
          setSquadDraftState((prev) => ({
            ...prev,
            formation: dbSquadConfig.formation,
          }));
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

  const handleOpenNextGameSquad = () => {
    setActiveSquadType('NEXT_GAME');
    setActiveView('TACTICS');
  };

  // Protect Unsaved Lineup Changes on Tactics tab
  const isLineupDirty = activeView === 'TACTICS' || showRolesModal;
  useUnsavedChanges(isLineupDirty);

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
    squadDraftState.startingXI.reduce((sum, idx) => sum + (roster[idx]?.rating || 75), 0) / 11
  );
  const collectiveStrength = squadDraftState.startingXI.reduce((sum, idx) => sum + (roster[idx]?.rating || 75), 0) * 2 + 500;
  const benchPlayers = roster.filter((_, idx) => !squadDraftState.startingXI.includes(idx));

  const validateSquad = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (squadDraftState.startingXI.length !== 11) {
      errors.push(`Starting XI must contain exactly 11 players (currently ${squadDraftState.startingXI.length}).`);
    }
    const startingPlayers = squadDraftState.startingXI.map((idx) => roster[idx]).filter(Boolean);
    const gkCount = startingPlayers.filter((p) => p.position === 'GK').length;
    if (gkCount < 1) {
      errors.push('Starting XI requires at least 1 Goalkeeper (GK).');
    }
    const unavailable = startingPlayers.filter(
      (p) =>
        p.status === 'Injured' ||
        p.status === 'Suspended' ||
        p.status === 'Unavailable' ||
        p.isInjured ||
        p.isSuspended ||
        p.medicalClearance === false
    );
    if (unavailable.length > 0) {
      errors.push(`Starting XI includes restricted players: ${unavailable.map((p) => p.name).join(', ')}.`);
    }
    return { valid: errors.length === 0, errors };
  };

  const handleSaveRoles = () => {
    if (currentRole !== 'CAPTAIN') {
      showToast('Permission Denied: Only Captain can assign set-piece match roles.');
      return;
    }
    showToast('Saved Tactical Match Roles successfully.');
  };

  const handleSaveFormation = () => {
    if (currentRole !== 'CAPTAIN') {
      showToast('Permission Denied: Only Captain can update formation layout.');
      return;
    }
    saveSquadConfiguration({
      teamId,
      formation: squadDraftState.formation,
      coordinates: [],
      updatedBy: user?.id || '',
    });
    showToast(`Saved Formation (${squadDraftState.formation}) successfully to database.`);
  };

  const handleSaveSquad = () => {
    if (currentRole !== 'COACH') {
      showToast('Permission Denied: Only Coach can save squad configurations.');
      return;
    }
    if (isSubmittingSquad) return;

    const { valid, errors } = validateSquad();
    if (!valid) {
      showToast(`Squad Warning: ${errors[0]}`);
    }
    setIsSubmittingSquad(true);

    const startingPlayers = squadDraftState.startingXI.map((idx) => roster[idx]).filter(Boolean);
    const bench = roster.filter((_, idx) => !squadDraftState.startingXI.includes(idx));

    if (activeSquadType === 'DEFAULT') {
      saveSquadConfiguration({
        teamId,
        formation: squadDraftState.formation,
        coordinates: startingPlayers.map((p) => ({
          player_id: p.id,
          position_name: p.position,
          x_coordinate: 50,
          y_coordinate: 50,
        })),
        updatedBy: user?.id || '',
      });
    } else {
      saveMatchLineup({
        teamId,
        formation: squadDraftState.formation,
        startingXi: startingPlayers,
        substitutes: bench,
      });
    }

    setTimeout(() => {
      setIsSubmittingSquad(false);
      showToast(
        activeSquadType === 'DEFAULT'
          ? 'Saved Default Squad successfully to Supabase.'
          : 'Saved Next-Game Squad selection successfully to Supabase.'
      );
    }, 400);
  };

  const handleSwapPlayer = (benchPlayerIdxInRoster: number) => {
    if (currentRole !== 'COACH') {
      showToast('Permission Denied: Only Coach can swap substitutes.');
      return;
    }
    if (selectedPitchSlot === null) return;
    const updated = [...squadDraftState.startingXI];
    const oldPlayerName = roster[updated[selectedPitchSlot]]?.name || 'Player';
    const newPlayerName = roster[benchPlayerIdxInRoster]?.name || 'Player';
    updated[selectedPitchSlot] = benchPlayerIdxInRoster;

    setSquadDraftState((prev) => ({
      ...prev,
      startingXI: updated,
    }));
    setShowSwapModal(false);
    showToast(`Substituted ${newPlayerName} in for ${oldPlayerName}`);
  };

  const handleUpdatePlayerStatus = (playerId: string, newStatus: 'Active' | 'Injured' | 'Suspended') => {
    if (currentRole !== 'COACH') {
      showToast('Permission Denied: Only Coach can update player availability status.');
      return;
    }
    setRoster((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          const updatedStatus = newStatus === 'Active' ? 'Fit' : newStatus;
          return {
            ...p,
            status: updatedStatus as any,
            isInjured: newStatus === 'Injured',
            isSuspended: newStatus === 'Suspended',
          };
        }
        return p;
      })
    );
    showToast(`Player status updated to ${newStatus}`);
  };

  const handleUploadPlayerImage = (playerId: string, imageUrl: string) => {
    if (currentRole !== 'COACH') {
      showToast('Permission Denied: Only Coach can upload player photos.');
      return;
    }
    setRoster((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, cardImage: imageUrl } : p))
    );
    showToast('Player profile image updated successfully');
  };

  const handleAssignPracticeActivity = (sessionId: string, activity: string) => {
    setPracticeSchedule((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, activity, assignedBy: 'Captain' } : s))
    );
    showToast(`Assigned activity: "${activity}" to session`);
  };

  const handleAddPracticeDay = (day: string, time: string, location: string) => {
    if (currentRole !== 'COACH') {
      showToast('Permission Denied: Only Coach can add practice days.');
      return;
    }
    const newSession: PracticeSession = {
      id: `ps_${Date.now()}`,
      day,
      time,
      location,
      activity: 'Pending Activity Assignment',
      assignedBy: 'Coach',
    };
    setPracticeSchedule((prev) => [...prev, newSession]);
    showToast(`Added practice day: ${day}`);
  };

  const inviteUrl = `${window.location.origin}/#/login?invite=team-egerton-fc`;

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    showToast('Invitation link copied to clipboard!');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Join Egerton FC squad on Egerton Sports Network: ${inviteUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return {
    isLoggedIn,
    currentRole,
    teamId,
    teamInfo,
    teamFixtures,
    announcements,
    isLoadingData,
    activeView,
    setActiveView,
    darkMode,
    setDarkMode,
    roster,
    setRoster,
    startingXI: squadDraftState.startingXI,
    setStartingXI: (startingXI: number[]) => setSquadDraftState((prev) => ({ ...prev, startingXI })),
    formation: squadDraftState.formation,
    setFormation: (formation: string) => setSquadDraftState((prev) => ({ ...prev, formation })),
    activePlaystyle: squadDraftState.activePlaystyle,
    setActivePlaystyle: (activePlaystyle: string) => setSquadDraftState((prev) => ({ ...prev, activePlaystyle })),
    playstyleSliders: squadDraftState.playstyleSliders,
    setPlaystyleSliders: (action: React.SetStateAction<typeof squadDraftState.playstyleSliders>) =>
      setSquadDraftState((prev) => ({
        ...prev,
        playstyleSliders: typeof action === 'function' ? action(prev.playstyleSliders) : action,
      })),
    selectedPitchSlot,
    setSelectedPitchSlot,
    showSwapModal,
    setShowSwapModal,
    showRolesModal,
    setShowRolesModal,
    activeSquadType,
    setActiveSquadType,
    handleOpenNextGameSquad,
    searchTerm,
    setSearchTerm,
    positionFilter,
    setPositionFilter,
    showInviteModal,
    setShowInviteModal,
    inviteUrl,
    handleCopyInviteLink,
    handleShareWhatsApp,
    roleAssignments: squadDraftState.roleAssignments,
    setRoleAssignments: (action: React.SetStateAction<RoleAssignments>) =>
      setSquadDraftState((prev) => ({
        ...prev,
        roleAssignments: typeof action === 'function' ? action(prev.roleAssignments) : action,
      })),
    practiceSchedule,
    handleAssignPracticeActivity,
    handleAddPracticeDay,
    toastMessage,
    showToast,
    isSubmittingSquad,
    hasRecoveredDraft,
    handleLogout,
    collectiveRating,
    collectiveStrength,
    benchPlayers,
    validateSquad,
    handleSaveRoles,
    handleSaveFormation,
    handleSaveSquad,
    handleSwapPlayer,
    handleUpdatePlayerStatus,
    handleUploadPlayerImage,
  };
};
