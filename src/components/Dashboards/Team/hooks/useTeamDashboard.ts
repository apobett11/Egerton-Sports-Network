import { useState, useEffect, useCallback } from 'react';
import type { Player, UserRole, PlayerPosition, PracticeSession } from '../types';
import { initialRoster, initialPracticeSchedule } from '../mockData';
import { useDraftRecovery } from '../../../../hooks/useDraftRecovery';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { useAuth } from '../../../../contexts/AuthContext';

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

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');

  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    showToast('Saved Tactical Match Roles successfully.');
  };

  const handleSaveFormation = () => {
    showToast(`Saved Formation (${squadDraftState.formation}) successfully.`);
  };

  const handleSaveSquad = () => {
    if (isSubmittingSquad) return;
    const { valid, errors } = validateSquad();
    if (!valid) {
      showToast(`Squad Warning: ${errors[0]}`);
    }
    setIsSubmittingSquad(true);
    setTimeout(() => {
      setIsSubmittingSquad(false);
      showToast('Saved Squad configuration successfully for current fixture.');
    }, 500);
  };

  const handleSwapPlayer = (benchPlayerIdxInRoster: number) => {
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
