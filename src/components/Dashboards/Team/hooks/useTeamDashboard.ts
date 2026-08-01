import { useState, useEffect, useCallback } from 'react';
import type { Player, UserRole, PlayerPosition } from '../types';
import { initialRoster } from '../mockData';
import { useDraftRecovery } from '../../../../hooks/useDraftRecovery';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { useAuth } from '../../../../contexts/AuthContext';

export type DashboardView = 'DASHBOARD' | 'TACTICS' | 'ROSTER' | 'ROLES' | 'STANDINGS' | 'NEWS' | 'SETTINGS';

export interface RoleAssignments {
  captainId: string;
  penaltyTakerId: string;
  freeKickTakerId: string;
  leftCornerTakerId: string;
  rightCornerTakerId: string;
}

export const useTeamDashboard = () => {
  const { user, role: authRole, logout: authLogout } = useAuth();

  const isLoggedIn = Boolean(user && authRole !== 'guest');
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return authRole === 'captain' ? 'CAPTAIN' : 'COACH';
  });

  useEffect(() => {
    if (authRole === 'captain') {
      setCurrentRole('CAPTAIN');
    } else if (authRole === 'coach') {
      setCurrentRole('COACH');
    }
  }, [authRole]);

  const [activeView, setActiveView] = useState<DashboardView>('DASHBOARD');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme-team');
    return saved ? saved === 'dark' : true;
  });

  const [roster, setRoster] = useState<Player[]>(initialRoster);

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

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');

  const [showAddPlayerModal, setShowAddPlayerModal] = useState<boolean>(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: 10,
    position: 'MD' as PlayerPosition,
    rating: 80,
    cardImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Protect Unsaved Lineup Changes on Tactics tab
  const isLineupDirty = activeView === 'TACTICS' || activeView === 'ROLES';
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

  const handleLogin = (role: UserRole) => {
    setCurrentRole(role);
    setActiveView('DASHBOARD');
    showToast(`Access active as ${role === 'COACH' ? 'Coach' : 'Captain'}`);
  };

  const handleLogout = async () => {
    await authLogout();
    window.location.hash = '/login';
  };

  const handleRoleToggle = () => {
    const nextRole: UserRole = currentRole === 'COACH' ? 'CAPTAIN' : 'COACH';
    setCurrentRole(nextRole);
    showToast(`Switched access context to ${nextRole === 'COACH' ? 'Coach Mode' : 'Captain Mode'}`);
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
        p.medicalClearance === false ||
        (p.yellowCards && p.yellowCards >= 5) ||
        (p.redCards && p.redCards >= 1)
    );
    if (unavailable.length > 0) {
      errors.push(`Starting XI includes restricted players (Injured/No Medical Clearance/Suspended): ${unavailable.map((p) => p.name).join(', ')}.`);
    }
    return { valid: errors.length === 0, errors };
  };

  const handleSaveSquadDraft = () => {
    if (currentRole !== 'COACH') {
      showToast('Captain Suggestion Mode: Recommendation saved for Head Coach review.');
      return;
    }
    if (isSubmittingSquad) return;
    setIsSubmittingSquad(true);
    setTimeout(() => {
      setIsSubmittingSquad(false);
      showToast('Saved Tactical Match Squad Draft locally & synced to server.');
    }, 600);
  };

  const handleSubmitMatchSquad = () => {
    if (currentRole !== 'COACH') {
      showToast('⚠️ Captain Authority Limit: Only the Head Coach can officially submit match day lineup and tactics.');
      return;
    }
    if (isSubmittingSquad) return;
    const { valid, errors } = validateSquad();
    if (!valid) {
      showToast(`Squad Validation Error: ${errors[0]}`);
      return;
    }
    setIsSubmittingSquad(true);
    setTimeout(() => {
      setIsSubmittingSquad(false);
      clearSquadDraft();
      showToast('Match Squad Official Submission Confirmed & Synced to League Server');
    }, 800);
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

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.name.trim()) {
      showToast('Please enter a valid athlete name');
      return;
    }
    const created: Player = {
      id: `p_${Date.now()}`,
      name: newPlayer.name.trim(),
      number: Number(newPlayer.number),
      position: newPlayer.position,
      rating: Number(newPlayer.rating),
      cardImage: newPlayer.cardImage,
      status: 'Fit',
      stamina: 95,
      speed: Math.floor(Math.random() * 20) + 75,
      shooting: Math.floor(Math.random() * 20) + 70,
      passing: Math.floor(Math.random() * 20) + 72,
      dribbling: Math.floor(Math.random() * 20) + 74,
      defense: Math.floor(Math.random() * 20) + 65,
      physical: Math.floor(Math.random() * 20) + 72,
    };

    setRoster((prev) => [...prev, created]);
    setShowAddPlayerModal(false);
    setNewPlayer({
      name: '',
      number: 10,
      position: 'MD',
      rating: 80,
      cardImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
    });
    showToast(`Registered ${created.name} (#${created.number}) to Squad`);
  };

  const handleDeletePlayer = () => {
    if (!playerToDelete) return;
    const id = playerToDelete.id;
    const idxInRoster = roster.findIndex((p) => p.id === id);
    setRoster((prev) => prev.filter((p) => p.id !== id));
    setSquadDraftState((prev) => ({
      ...prev,
      startingXI: prev.startingXI.filter((i) => i !== idxInRoster),
    }));
    setPlayerToDelete(null);
    showToast(`Removed ${playerToDelete.name} from Squad Roster`);
  };

  return {
    isLoggedIn,
    currentRole,
    setCurrentRole,
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
    searchTerm,
    setSearchTerm,
    positionFilter,
    setPositionFilter,
    showAddPlayerModal,
    setShowAddPlayerModal,
    playerToDelete,
    setPlayerToDelete,
    newPlayer,
    setNewPlayer,
    roleAssignments: squadDraftState.roleAssignments,
    setRoleAssignments: (action: React.SetStateAction<RoleAssignments>) =>
      setSquadDraftState((prev) => ({
        ...prev,
        roleAssignments: typeof action === 'function' ? action(prev.roleAssignments) : action,
      })),
    toastMessage,
    showToast,
    isSubmittingSquad,
    hasRecoveredDraft,
    handleLogin,
    handleLogout,
    handleRoleToggle,
    collectiveRating,
    collectiveStrength,
    benchPlayers,
    validateSquad,
    handleSaveSquadDraft,
    handleSubmitMatchSquad,
    handleSwapPlayer,
    handleAddPlayer,
    handleDeletePlayer,
  };
};
