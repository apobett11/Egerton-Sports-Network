import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Shield,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRightLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
  Shirt,
  X,
  Search,
  Check,
  Crown,
  Target,
  Zap,
} from 'lucide-react';
import { saveTeamTacticsAndSquad } from '../../lib/supabaseClient';

export type FormationType = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '4-4-1-1';

export interface FormationSlot {
  index: number;
  position: string;
  category: 'GK' | 'DEF' | 'MID' | 'ATT';
  label: string;
  x: number; // Percentage relative to pitch (0 - 100)
  y: number; // Percentage relative to pitch (0 - 100)
}

// Tactical Formation Coordinates starting sequentially from GK (slot 0) -> Defenders -> Midfielders -> Attackers
export const FORMATION_CONFIGS: Record<FormationType, { name: FormationType; label: string; description: string; slots: FormationSlot[] }> = {
  '4-3-3': {
    name: '4-3-3',
    label: '4-3-3 Attack',
    description: 'High offensive pressure with inverted wingers and a holding anchor.',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LB', category: 'DEF', label: 'Left Back', x: 18, y: 72 },
      { index: 2, position: 'CB', category: 'DEF', label: 'Left Centre Back', x: 38, y: 74 },
      { index: 3, position: 'CB', category: 'DEF', label: 'Right Centre Back', x: 62, y: 74 },
      { index: 4, position: 'RB', category: 'DEF', label: 'Right Back', x: 82, y: 72 },
      { index: 5, position: 'LCM', category: 'MID', label: 'Left Central Midfield', x: 30, y: 48 },
      { index: 6, position: 'CDM', category: 'MID', label: 'Central Defensive Midfield', x: 50, y: 56 },
      { index: 7, position: 'RCM', category: 'MID', label: 'Right Central Midfield', x: 70, y: 48 },
      { index: 8, position: 'LW', category: 'ATT', label: 'Left Winger', x: 22, y: 22 },
      { index: 9, position: 'ST', category: 'ATT', label: 'Centre Forward', x: 50, y: 14 },
      { index: 10, position: 'RW', category: 'ATT', label: 'Right Winger', x: 78, y: 22 },
    ],
  },
  '4-4-2': {
    name: '4-4-2',
    label: '4-4-2 Classic',
    description: 'Balanced dual striker system with compact wide midfield blocks.',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LB', category: 'DEF', label: 'Left Back', x: 18, y: 72 },
      { index: 2, position: 'CB', category: 'DEF', label: 'Left Centre Back', x: 38, y: 74 },
      { index: 3, position: 'CB', category: 'DEF', label: 'Right Centre Back', x: 62, y: 74 },
      { index: 4, position: 'RB', category: 'DEF', label: 'Right Back', x: 82, y: 72 },
      { index: 5, position: 'LM', category: 'MID', label: 'Left Midfield', x: 18, y: 46 },
      { index: 6, position: 'LCM', category: 'MID', label: 'Left Central Midfield', x: 39, y: 50 },
      { index: 7, position: 'RCM', category: 'MID', label: 'Right Central Midfield', x: 61, y: 50 },
      { index: 8, position: 'RM', category: 'MID', label: 'Right Midfield', x: 82, y: 46 },
      { index: 9, position: 'LST', category: 'ATT', label: 'Left Striker', x: 38, y: 16 },
      { index: 10, position: 'RST', category: 'ATT', label: 'Right Striker', x: 62, y: 16 },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    label: '4-2-3-1 Control',
    description: 'Double pivot anchor with dynamic central attacking playmaker.',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LB', category: 'DEF', label: 'Left Back', x: 18, y: 72 },
      { index: 2, position: 'CB', category: 'DEF', label: 'Left Centre Back', x: 38, y: 74 },
      { index: 3, position: 'CB', category: 'DEF', label: 'Right Centre Back', x: 62, y: 74 },
      { index: 4, position: 'RB', category: 'DEF', label: 'Right Back', x: 82, y: 72 },
      { index: 5, position: 'LDM', category: 'MID', label: 'Left Defensive Midfield', x: 38, y: 58 },
      { index: 6, position: 'RDM', category: 'MID', label: 'Right Defensive Midfield', x: 62, y: 58 },
      { index: 7, position: 'LAM', category: 'MID', label: 'Left Attacking Midfield', x: 24, y: 34 },
      { index: 8, position: 'CAM', category: 'MID', label: 'Central Attacking Midfield', x: 50, y: 32 },
      { index: 9, position: 'RAM', category: 'MID', label: 'Right Attacking Midfield', x: 76, y: 34 },
      { index: 10, position: 'ST', category: 'ATT', label: 'Lone Striker', x: 50, y: 14 },
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    label: '3-5-2 Wing Play',
    description: 'Overloading central midfield with expansive wing-back width.',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LCB', category: 'DEF', label: 'Left Centre Back', x: 28, y: 74 },
      { index: 2, position: 'CB', category: 'DEF', label: 'Central Centre Back', x: 50, y: 76 },
      { index: 3, position: 'RCB', category: 'DEF', label: 'Right Centre Back', x: 72, y: 74 },
      { index: 4, position: 'LWB', category: 'MID', label: 'Left Wing Back', x: 16, y: 48 },
      { index: 5, position: 'LDM', category: 'MID', label: 'Left Defensive Midfield', x: 38, y: 56 },
      { index: 6, position: 'RDM', category: 'MID', label: 'Right Defensive Midfield', x: 62, y: 56 },
      { index: 7, position: 'CAM', category: 'MID', label: 'Central Attacking Midfield', x: 50, y: 36 },
      { index: 8, position: 'RWB', category: 'MID', label: 'Right Wing Back', x: 84, y: 48 },
      { index: 9, position: 'LST', category: 'ATT', label: 'Left Striker', x: 38, y: 16 },
      { index: 10, position: 'RST', category: 'ATT', label: 'Right Striker', x: 62, y: 16 },
    ],
  },
  '4-4-1-1': {
    name: '4-4-1-1',
    label: '4-4-1-1 Counter',
    description: 'Disciplined deep defensive shape with a shadow striker.',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LB', category: 'DEF', label: 'Left Back', x: 18, y: 72 },
      { index: 2, position: 'CB', category: 'DEF', label: 'Left Centre Back', x: 38, y: 74 },
      { index: 3, position: 'CB', category: 'DEF', label: 'Right Centre Back', x: 62, y: 74 },
      { index: 4, position: 'RB', category: 'DEF', label: 'Right Back', x: 82, y: 72 },
      { index: 5, position: 'LM', category: 'MID', label: 'Left Midfield', x: 18, y: 48 },
      { index: 6, position: 'LCM', category: 'MID', label: 'Left Central Midfield', x: 39, y: 52 },
      { index: 7, position: 'RCM', category: 'MID', label: 'Right Central Midfield', x: 61, y: 52 },
      { index: 8, position: 'RM', category: 'MID', label: 'Right Midfield', x: 82, y: 48 },
      { index: 9, position: 'AMF', category: 'MID', label: 'Shadow Striker', x: 50, y: 30 },
      { index: 10, position: 'CF', category: 'ATT', label: 'Target Forward', x: 50, y: 14 },
    ],
  },
};

interface TeamSquadViewProps {
  currentRole?: 'COACH' | 'CAPTAIN' | 'PLAYER' | 'GUEST' | string;
  teamId?: string;
  roster?: any[];
  teamName?: string;
  teamCrest?: string;
  coachProfile?: { id: string; name: string; email?: string; phone?: string; avatarUrl?: string; role?: string };
  captainProfile?: { id: string; name: string; email?: string; phone?: string; avatarUrl?: string; role?: string };
  activeFixtureId?: string;
  onNavigateBack?: () => void;
  onShowToast?: (msg: string) => void;
  onSaveMatchLineup?: (fixtureId?: string, startingXI?: any[], subs?: any[], formation?: string, capId?: string) => Promise<any>;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

export const TeamSquadView: React.FC<TeamSquadViewProps> = ({
  currentRole = 'COACH',
  teamId = 'fc910b80-1a73-45f8-80f4-fcb03adce911',
  roster = [],
  teamName = 'First Team',
  teamCrest = '',
  captainProfile,
  activeFixtureId,
  onNavigateBack,
  onShowToast,
  onSaveMatchLineup,
}) => {
  const isCoach = currentRole === 'COACH' || (currentRole as string).toLowerCase() === 'coach';

  // Local storage cache key scoped strictly to the team UID
  const CACHE_KEY = `coach_play_centre_${teamId}`;

  // 1. FAST SINGLE-UNIT ROSTER INDEXING (Map by UID for O(1) lookups)
  const playerIndex = useMemo(() => {
    const map = new Map<string, any>();
    if (Array.isArray(roster)) {
      roster.forEach((p) => {
        if (p && p.id) {
          map.set(String(p.id), p);
        }
      });
    }
    return map;
  }, [roster]);

  // Read initial cache safely
  const cachedState = useMemo(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, [CACHE_KEY]);

  // Wizard Step (1: Formation, 2: First 11, 3: Subs, 4: Roles, 5: Pitch Simulation)
  const [activeStep, setActiveStep] = useState<WizardStep>(() => cachedState?.step || 1);

  // 1. Selected Formation
  const [formation, setFormation] = useState<FormationType>(() => cachedState?.formation || '4-3-3');

  // 2. Confirmed First 11 (Stored STRICTLY as UIDs)
  const [startingXIIds, setStartingXIIds] = useState<string[]>(() => {
    if (cachedState?.startingXIIds && Array.isArray(cachedState.startingXIIds)) {
      return cachedState.startingXIIds;
    }
    return roster.slice(0, 11).map((p) => String(p.id));
  });

  // 3. Substitutes (Stored STRICTLY as UIDs - Maximum 6 players)
  const [substituteIds, setSubstituteIds] = useState<string[]>(() => {
    if (cachedState?.substituteIds && Array.isArray(cachedState.substituteIds)) {
      return cachedState.substituteIds.slice(0, 6);
    }
    return roster.slice(11, 17).map((p) => String(p.id));
  });

  // 4. In-Match Roles (Stored STRICTLY as UIDs)
  const [roles, setRoles] = useState<{
    captainId: string;
    viceCaptainId: string;
    penaltyTakerId: string;
    freeKickTakerId: string;
    cornerTakerId: string;
  }>(() => {
    if (cachedState?.roles) return cachedState.roles;
    const firstStarter = startingXIIds[0] || captainProfile?.id || '';
    return {
      captainId: captainProfile?.id || firstStarter,
      viceCaptainId: startingXIIds[1] || '',
      penaltyTakerId: firstStarter,
      freeKickTakerId: startingXIIds[2] || '',
      cornerTakerId: startingXIIds[3] || '',
    };
  });

  // 5. Pitch Simulation: Slots 0 to 10 mapped to Formation Slots
  // Stores array of 11 (UID | null)
  const [pitchSlots, setPitchSlots] = useState<(string | null)[]>(() => {
    if (cachedState?.pitchSlots && Array.isArray(cachedState.pitchSlots) && cachedState.pitchSlots.length === 11) {
      return cachedState.pitchSlots;
    }
    // Initially empty to allow step-by-step blank pitch simulation
    return Array(11).fill(null);
  });

  // Interactive Card Inspection & Swapping state
  const [inspectedPlayerId, setInspectedPlayerId] = useState<string | null>(null);
  const [inspectedSlotIndex, setInspectedSlotIndex] = useState<number | null>(null);
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState<boolean>(false);
  const [swapTargetSlot, setSwapTargetSlot] = useState<number | null>(null);
  const [animatedSwapEffect, setAnimatedSwapEffect] = useState<string | null>(null);

  // Search and filter for player pickers
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerFilter, setPickerFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'ATT'>('ALL');

  // Toast message
  const [localToast, setLocalToast] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<any>(null);

  const notify = useCallback(
    (msg: string) => {
      if (onShowToast) onShowToast(msg);
      setLocalToast(msg);
      setTimeout(() => setLocalToast(null), 2400);
    },
    [onShowToast]
  );

  // Auto-save state to local storage and DB
  const persistState = useCallback(
    (
      newFormation: FormationType,
      newXIIds: string[],
      newSubsIds: string[],
      newRoles: typeof roles,
      newSlots: (string | null)[],
      step: WizardStep
    ) => {
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            formation: newFormation,
            startingXIIds: newXIIds,
            substituteIds: newSubsIds,
            roles: newRoles,
            pitchSlots: newSlots,
            step,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {}

      if (!isCoach) return;

      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const startingPlayers = newXIIds.map((id) => playerIndex.get(id)).filter(Boolean);
          const subPlayers = newSubsIds.map((id) => playerIndex.get(id)).filter(Boolean);

          await saveTeamTacticsAndSquad(teamId, {
            startingXI: startingPlayers,
            substitutes: subPlayers,
            formation: newFormation,
            tacticsConfig: {
              roles: newRoles,
              pitchSlots: newSlots,
            },
          });
        } catch (err) {
          console.warn('[Coach Play Centre] Silent save:', err);
        }
      }, 1500);
    },
    [CACHE_KEY, isCoach, playerIndex, teamId]
  );

  // Synchronize when roster arrives
  useEffect(() => {
    if (roster.length > 0 && startingXIIds.length === 0) {
      const initialXI = roster.slice(0, 11).map((p) => String(p.id));
      const initialSubs = roster.slice(11, 17).map((p) => String(p.id));
      setStartingXIIds(initialXI);
      setSubstituteIds(initialSubs);
      setRoles((prev) => ({
        ...prev,
        captainId: captainProfile?.id || initialXI[0] || '',
        viceCaptainId: initialXI[1] || '',
        penaltyTakerId: initialXI[0] || '',
      }));
    }
  }, [roster, captainProfile, startingXIIds.length]);

  // Current formation configuration slots
  const currentFormationConfig = useMemo(() => {
    return FORMATION_CONFIGS[formation] || FORMATION_CONFIGS['4-3-3'];
  }, [formation]);

  // Active slot awaiting progressive sequential placement (from Slot 0 Goalkeeper to Slot 10)
  const nextEmptySlotIndex = useMemo(() => {
    const idx = pitchSlots.findIndex((slot) => slot === null);
    return idx === -1 ? null : idx;
  }, [pitchSlots]);

  // Starters remaining to be placed on the pitch
  const unplacedStarterIds = useMemo(() => {
    const placedSet = new Set(pitchSlots.filter(Boolean));
    return startingXIIds.filter((id) => !placedSet.has(id));
  }, [pitchSlots, startingXIIds]);

  // Collective team rating calculation based on First 11
  const collectiveStrength = useMemo(() => {
    if (startingXIIds.length === 0) return 0;
    const total = startingXIIds.reduce((sum, id) => {
      const player = playerIndex.get(id);
      return sum + (player?.rating || 75) * 2.65;
    }, 0);
    return Math.round(total);
  }, [startingXIIds, playerIndex]);

  // --- STEP 1: FORMATION SELECTION ---
  const handleSelectFormation = (f: FormationType) => {
    if (!isCoach) {
      notify('Permission Denied: Only Head Coach can adjust tactical formations.');
      return;
    }
    setFormation(f);
    setPitchSlots(Array(11).fill(null));
    persistState(f, startingXIIds, substituteIds, roles, Array(11).fill(null), 1);
    notify(`Formation switched to ${f}`);
  };

  // --- STEP 2: FIRST 11 SELECTION ---
  const handleToggleStarter = (playerId: string) => {
    if (!isCoach) {
      notify('Permission Denied: Only Head Coach can modify First 11.');
      return;
    }
    const isSelected = startingXIIds.includes(playerId);
    let updated: string[];

    if (isSelected) {
      updated = startingXIIds.filter((id) => id !== playerId);
      setPitchSlots((prev) => prev.map((s) => (s === playerId ? null : s)));
    } else {
      if (startingXIIds.length >= 11) {
        notify('First 11 is full! Deselect a player before adding another.');
        return;
      }
      updated = [...startingXIIds, playerId];
      if (substituteIds.includes(playerId)) {
        setSubstituteIds((prev) => prev.filter((id) => id !== playerId));
      }
    }

    setStartingXIIds(updated);
    persistState(formation, updated, substituteIds, roles, pitchSlots, 2);
  };

  const handleConfirmFirst11 = () => {
    if (startingXIIds.length !== 11) {
      notify(`Please select exactly 11 players. Currently: ${startingXIIds.length}/11`);
      return;
    }
    setActiveStep(3);
    persistState(formation, startingXIIds, substituteIds, roles, pitchSlots, 3);
    notify('First 11 confirmed! Now select your 6 substitutes.');
  };

  // --- STEP 3: SUBSTITUTES SELECTION (STRICT MAX 6) ---
  const handleToggleSubstitute = (playerId: string) => {
    if (!isCoach) {
      notify('Permission Denied: Only Head Coach can pick substitutes.');
      return;
    }
    const isSelected = substituteIds.includes(playerId);
    let updated: string[];

    if (isSelected) {
      updated = substituteIds.filter((id) => id !== playerId);
    } else {
      if (substituteIds.length >= 6) {
        notify('Maximum 6 substitutes permitted per official match regulations.');
        return;
      }
      updated = [...substituteIds, playerId];
    }

    setSubstituteIds(updated);
    persistState(formation, startingXIIds, updated, roles, pitchSlots, 3);
  };

  // --- STEP 4: IN-MATCH ROLES SELECTION ---
  const handleAssignRole = (roleKey: keyof typeof roles, playerId: string) => {
    if (!isCoach) {
      notify('Permission Denied: Only Head Coach can assign player roles.');
      return;
    }
    const updated = { ...roles, [roleKey]: playerId };
    setRoles(updated);
    persistState(formation, startingXIIds, substituteIds, updated, pitchSlots, 4);
    const p = playerIndex.get(playerId);
    notify(`${p?.name || 'Player'} appointed for ${roleKey.replace('Id', '')}`);
  };

  // --- STEP 5: PROGRESSIVE BLANK PITCH SIMULATION ---
  const handleAssignToPitchSlot = (playerId: string, targetSlotIndex: number) => {
    if (!isCoach) return;
    const newSlots = [...pitchSlots];
    const existingIndex = newSlots.indexOf(playerId);
    if (existingIndex !== -1) {
      newSlots[existingIndex] = null;
    }
    newSlots[targetSlotIndex] = playerId;
    setPitchSlots(newSlots);

    setAnimatedSwapEffect(playerId);
    setTimeout(() => setAnimatedSwapEffect(null), 500);

    persistState(formation, startingXIIds, substituteIds, roles, newSlots, 5);
    const p = playerIndex.get(playerId);
    const slot = currentFormationConfig.slots[targetSlotIndex];
    notify(`${p?.name || 'Player'} placed as ${slot?.position || 'slot'}`);
  };

  const handleAutoPlaceRemaining = () => {
    if (!isCoach) return;
    const newSlots = [...pitchSlots];
    const unplaced = startingXIIds.filter((id) => !newSlots.includes(id));

    const gkSlot = currentFormationConfig.slots.find((s) => s.category === 'GK');
    if (gkSlot && newSlots[gkSlot.index] === null) {
      const gkPlayer = unplaced.find((id) => {
        const p = playerIndex.get(id);
        const pos = (p?.position || '').toUpperCase();
        return pos === 'GK' || pos.includes('GOAL');
      });
      if (gkPlayer) {
        newSlots[gkSlot.index] = gkPlayer;
        unplaced.splice(unplaced.indexOf(gkPlayer), 1);
      }
    }

    for (let i = 0; i < 11; i++) {
      if (newSlots[i] === null && unplaced.length > 0) {
        newSlots[i] = unplaced.shift() || null;
      }
    }

    setPitchSlots(newSlots);
    persistState(formation, startingXIIds, substituteIds, roles, newSlots, 5);
    notify('Pitch populated with First 11 starters!');
  };

  const handleClearPitch = () => {
    if (!isCoach) return;
    const cleared = Array(11).fill(null);
    setPitchSlots(cleared);
    persistState(formation, startingXIIds, substituteIds, roles, cleared, 5);
    notify('Pitch cleared. Begin assigning starting from Goalkeeper.');
  };

  const handleCardClick = (playerId: string, slotIndex: number) => {
    setInspectedPlayerId(playerId);
    setInspectedSlotIndex(slotIndex);
  };

  const handleStartSwap = () => {
    if (inspectedSlotIndex !== null) {
      setSwapTargetSlot(inspectedSlotIndex);
      setIsSwapDrawerOpen(true);
    }
  };

  const handleExecuteSwap = (replacementPlayerId: string) => {
    if (swapTargetSlot === null) return;

    const currentPlayerId = pitchSlots[swapTargetSlot];
    if (!currentPlayerId) return;

    const isSub = substituteIds.includes(replacementPlayerId);
    const newPitchSlots = [...pitchSlots];
    let newStartingXI = [...startingXIIds];
    let newSubs = [...substituteIds];

    if (isSub) {
      newPitchSlots[swapTargetSlot] = replacementPlayerId;
      newStartingXI = newStartingXI.map((id) => (id === currentPlayerId ? replacementPlayerId : id));
      newSubs = newSubs.map((id) => (id === replacementPlayerId ? currentPlayerId : id));
      notify(`Substituted ${playerIndex.get(replacementPlayerId)?.name || 'sub'} into squad!`);
    } else {
      const otherSlotIndex = newPitchSlots.indexOf(replacementPlayerId);
      if (otherSlotIndex !== -1) {
        newPitchSlots[otherSlotIndex] = currentPlayerId;
      }
      newPitchSlots[swapTargetSlot] = replacementPlayerId;
      notify(`Swapped positions with ${playerIndex.get(replacementPlayerId)?.name || 'starter'}`);
    }

    setAnimatedSwapEffect(replacementPlayerId);
    setTimeout(() => setAnimatedSwapEffect(null), 600);

    setPitchSlots(newPitchSlots);
    setStartingXIIds(newStartingXI);
    setSubstituteIds(newSubs);
    setIsSwapDrawerOpen(false);
    setInspectedPlayerId(null);
    setInspectedSlotIndex(null);
    setSwapTargetSlot(null);

    persistState(formation, newStartingXI, newSubs, roles, newPitchSlots, 5);
  };

  const handleCommitOfficialLineup = async () => {
    const filledStarters = pitchSlots.map((id) => (id ? playerIndex.get(id) : null)).filter(Boolean);
    if (filledStarters.length < 11) {
      notify(`Please place all 11 players on the pitch before committing. Currently: ${filledStarters.length}/11`);
      return;
    }

    const subPlayers = substituteIds.map((id) => playerIndex.get(id)).filter(Boolean);

    try {
      if (onSaveMatchLineup) {
        await onSaveMatchLineup(activeFixtureId, filledStarters, subPlayers, formation, roles.captainId);
      } else {
        await saveTeamTacticsAndSquad(teamId, {
          startingXI: filledStarters,
          substitutes: subPlayers,
          formation,
          tacticsConfig: { roles, pitchSlots },
        });
      }
      notify('Official Matchday Lineup committed successfully!');
    } catch {
      notify('Lineup saved to local session.');
    }
  };

  const filteredRoster = useMemo(() => {
    let list = Array.from(playerIndex.values());

    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase().trim();
      list = list.filter((p) => (p.name || '').toLowerCase().includes(q) || String(p.number || '').includes(q));
    }

    if (pickerFilter !== 'ALL') {
      list = list.filter((p) => {
        const pos = (p.position || '').toUpperCase();
        if (pickerFilter === 'GK') return pos === 'GK' || pos.includes('GOAL');
        if (pickerFilter === 'DEF') return pos === 'DF' || pos === 'DEF' || pos.includes('BACK');
        if (pickerFilter === 'MID') return pos === 'MD' || pos === 'MID';
        if (pickerFilter === 'ATT') return pos === 'FW' || pos === 'FWD' || pos.includes('FOR');
        return true;
      });
    }

    return list;
  }, [playerIndex, pickerSearch, pickerFilter]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#030716] text-slate-100 flex flex-col font-sans select-none">
      {/* Abstract ambient backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-[10%] -top-[15%] w-[45%] h-[60%] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-[40%] h-[50%] rounded-full bg-emerald-600/10 blur-3xl" />
      </div>

      {/* TOP HEADER & CONTROLS */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-[#070e20]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <div className="h-4 w-px bg-slate-700/60 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            {teamCrest ? (
              <img src={teamCrest} alt="Crest" className="w-6 h-6 object-contain rounded-full bg-slate-800/50 p-0.5" />
            ) : (
              <Shield className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>{teamName}</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Coach Play Centre
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Collective Team Strength Indicator & Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-inner">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Team Strength</span>
              <span className="text-xs font-black text-amber-300 font-mono leading-none">{collectiveStrength}</span>
            </div>
          </div>

          <button
            onClick={handleCommitOfficialLineup}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/60 transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Commit Matchday Lineup</span>
            <span className="sm:hidden">Commit</span>
          </button>
        </div>
      </header>

      {/* STEP PROGRESSION BAR (1 to 5) */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-2 bg-[#060c1c]/95 border-b border-slate-800/60 overflow-x-auto text-xs">
        <div className="flex items-center gap-2 sm:gap-4 min-w-max mx-auto">
          {[
            { step: 1, label: '1. Formation', icon: <Shirt className="w-3.5 h-3.5" /> },
            { step: 2, label: '2. First 11', count: `${startingXIIds.length}/11`, icon: <Users className="w-3.5 h-3.5" /> },
            { step: 3, label: '3. Subs', count: `${substituteIds.length}/6`, icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
            { step: 4, label: '4. Roles', icon: <Crown className="w-3.5 h-3.5" /> },
            { step: 5, label: '5. Pitch Simulation', icon: <Target className="w-3.5 h-3.5" /> },
          ].map((item) => {
            const isCurrent = activeStep === item.step;
            const isCompleted = activeStep > item.step;
            return (
              <button
                key={item.step}
                onClick={() => setActiveStep(item.step as WizardStep)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600/90 text-white shadow-md shadow-blue-900/50 scale-102'
                    : isCompleted
                    ? 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.count && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 flex flex-col items-center">
        {/* STEP 1: CHOOSE FORMATION */}
        {activeStep === 1 && (
          <section className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Step 1 of 5</span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Select Tactical Formation</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Choose the tactical blueprint. This determines player slot positions on the pitch.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(FORMATION_CONFIGS) as FormationType[]).map((fKey) => {
                const conf = FORMATION_CONFIGS[fKey];
                const isSelected = formation === fKey;
                return (
                  <div
                    key={fKey}
                    onClick={() => handleSelectFormation(fKey)}
                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-b from-blue-900/40 to-slate-900/90 border-blue-500 shadow-xl shadow-blue-950/50 scale-102 ring-2 ring-blue-500/40'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 hover:-translate-y-0.5'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-white tracking-wide">{conf.name}</span>
                        {isSelected && (
                          <span className="p-1 rounded-full bg-blue-500 text-white">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-blue-300 block mt-0.5">{conf.label}</span>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{conf.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Defense: {conf.slots.filter((s) => s.category === 'DEF').length}</span>
                      <span>Mid: {conf.slots.filter((s) => s.category === 'MID').length}</span>
                      <span>Attack: {conf.slots.filter((s) => s.category === 'ATT').length}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/60 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>Next: Select First 11</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: SELECT FIRST 11 */}
        {activeStep === 2 && (
          <section className="w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Step 2 of 5</span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">Select First 11 Starters</h2>
                <p className="text-xs text-slate-400">
                  Select exactly 11 players from your squad roster to start the match.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold">
                  <span className={startingXIIds.length === 11 ? 'text-emerald-400 font-black' : 'text-amber-400'}>
                    {startingXIIds.length}
                  </span>
                  <span className="text-slate-500"> / 11 Confirmed</span>
                </div>

                <button
                  onClick={handleConfirmFirst11}
                  disabled={startingXIIds.length !== 11}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    startingXIIds.length === 11
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 cursor-pointer active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm First 11</span>
                </button>
              </div>
            </div>

            {/* Filter and search */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search player name or jersey number..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto">
                {(['ALL', 'GK', 'DEF', 'MID', 'ATT'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPickerFilter(pos)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      pickerFilter === pos ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {filteredRoster.map((player) => {
                const isSelected = startingXIIds.includes(player.id);
                return (
                  <div
                    key={player.id}
                    onClick={() => handleToggleStarter(player.id)}
                    className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-950/50 ring-1 ring-blue-500/50'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        #{player.number || '?'}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          player.position === 'GK'
                            ? 'bg-amber-500/20 text-amber-300'
                            : player.position === 'DF' || player.position === 'DEF'
                            ? 'bg-blue-500/20 text-blue-300'
                            : player.position === 'MD' || player.position === 'MID'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {player.position}
                      </span>
                    </div>

                    <div className="my-2 text-center">
                      <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                        {player.cardImage || player.photoUrl ? (
                          <img
                            src={player.cardImage || player.photoUrl}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-slate-400">
                            {player.name ? player.name.slice(0, 2).toUpperCase() : 'PL'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white block truncate mt-1.5">{player.name}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px]">
                      <span className="text-slate-400">Rating</span>
                      <span className="font-mono font-black text-amber-400">{player.rating || 75}</span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* STEP 3: SELECT SUBSTITUTES (STRICT MAX 6) */}
        {activeStep === 3 && (
          <section className="w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Step 3 of 5</span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">Select Substitutes Bench</h2>
                <p className="text-xs text-slate-400">
                  Select up to 6 substitutes (strict maximum 6 players) from remaining squad members.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold">
                  <span className={substituteIds.length <= 6 ? 'text-emerald-400' : 'text-rose-400'}>
                    {substituteIds.length}
                  </span>
                  <span className="text-slate-500"> / 6 Max Substitutes</span>
                </div>

                <button
                  onClick={() => setActiveStep(4)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/60 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <span>Next: Assign Roles</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Substitutes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {filteredRoster
                .filter((p) => !startingXIIds.includes(p.id))
                .map((player) => {
                  const isSelected = substituteIds.includes(player.id);
                  const isMaxReached = substituteIds.length >= 6 && !isSelected;

                  return (
                    <div
                      key={player.id}
                      onClick={() => !isMaxReached && handleToggleSubstitute(player.id)}
                      className={`p-2.5 rounded-xl border transition-all duration-200 relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/50 cursor-pointer'
                          : isMaxReached
                          ? 'bg-slate-900/20 border-slate-800/40 opacity-40 cursor-not-allowed'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          #{player.number || '?'}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                          {player.position}
                        </span>
                      </div>

                      <div className="my-2 text-center">
                        <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                          {player.cardImage || player.photoUrl ? (
                            <img
                              src={player.cardImage || player.photoUrl}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              {player.name ? player.name.slice(0, 2).toUpperCase() : 'PL'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-white block truncate mt-1.5">{player.name}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px]">
                        <span className="text-slate-400">Rating</span>
                        <span className="font-mono font-black text-amber-400">{player.rating || 75}</span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* STEP 4: ASSIGN ROLES */}
        {activeStep === 4 && (
          <section className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Step 4 of 5</span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">Assign In-Match Roles</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Designate key leadership and set-piece takers strictly from your confirmed First 11 starters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'captainId' as const, label: 'Team Captain (C)', desc: 'On-pitch leader and team spokesperson.', icon: <Crown className="w-4 h-4 text-amber-400" /> },
                { key: 'viceCaptainId' as const, label: 'Vice Captain (VC)', desc: 'Secondary leadership on the pitch.', icon: <Award className="w-4 h-4 text-blue-400" /> },
                { key: 'penaltyTakerId' as const, label: 'Penalty Specialist (PK)', desc: 'Designated spot-kick taker.', icon: <Target className="w-4 h-4 text-rose-400" /> },
                { key: 'freeKickTakerId' as const, label: 'Free Kick Specialist (FK)', desc: 'Direct and indirect set-piece deliverer.', icon: <Zap className="w-4 h-4 text-emerald-400" /> },
                { key: 'cornerTakerId' as const, label: 'Corner Kick Taker (CK)', desc: 'Corner and wide set-piece specialist.', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
              ].map((item) => {
                const assignedId = roles[item.key];
                const player = playerIndex.get(assignedId);

                return (
                  <div key={item.key} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">{item.icon}</div>
                        <div>
                          <span className="text-xs font-bold text-white block">{item.label}</span>
                          <span className="text-[11px] text-slate-400 block">{item.desc}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={assignedId || ''}
                        onChange={(e) => handleAssignRole(item.key, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      >
                        <option value="">Select Starter...</option>
                        {startingXIIds.map((id) => {
                          const p = playerIndex.get(id);
                          return (
                            <option key={id} value={id}>
                              #{p?.number || '?'} {p?.name || 'Player'} ({p?.position || 'POS'} - Rating {p?.rating || 75})
                            </option>
                          );
                        })}
                      </select>

                      {player && (
                        <span className="px-2 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                          #{player.number}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-2">
              <button
                onClick={() => setActiveStep(3)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Subs</span>
              </button>

              <button
                onClick={() => setActiveStep(5)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>Enter Pitch Simulation</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 5: PROGRESSIVE BLANK PITCH SIMULATION & EMIL KOWALSKI SWAP */}
        {activeStep === 5 && (
          <section className="w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4">
            {/* Simulation Controls & Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Tactical Simulation: {formation}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-normal">
                      ({pitchSlots.filter(Boolean).length}/11 Placed)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {nextEmptySlotIndex !== null
                      ? `Active Placement: ${currentFormationConfig.slots[nextEmptySlotIndex]?.label} (${currentFormationConfig.slots[nextEmptySlotIndex]?.position})`
                      : 'All 11 players placed on pitch! Click any card to inspect or swap.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoPlaceRemaining}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Fill Pitch</span>
                </button>

                <button
                  onClick={handleClearPitch}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-rose-950/40 hover:text-rose-300 text-[11px] font-semibold text-slate-400 transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Pitch</span>
                </button>
              </div>
            </div>

            {/* PITCH CANVAS CONTAINER (Compact, elegant grass simulation) */}
            <div className="relative w-full max-w-3xl mx-auto aspect-[1.35/1] min-h-[380px] max-h-[560px] rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl shadow-emerald-950/30 bg-gradient-to-b from-[#0e3b23] to-[#072414]">
              {/* Pitch markings SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" stroke="white" strokeWidth="1.5" fill="none">
                {/* Border line */}
                <rect x="5%" y="5%" width="90%" height="90%" rx="8" />
                {/* Halfway line */}
                <line x1="5%" y1="50%" x2="95%" y2="50%" />
                {/* Center circle & spot */}
                <circle cx="50%" cy="50%" r="12%" />
                <circle cx="50%" cy="50%" r="1" fill="white" />
                {/* Top penalty area */}
                <rect x="25%" y="5%" width="50%" height="18%" />
                <rect x="35%" y="5%" width="30%" height="7%" />
                {/* Bottom penalty area */}
                <rect x="25%" y="77%" width="50%" height="18%" />
                <rect x="35%" y="88%" width="30%" height="7%" />
              </svg>

              {/* 11 Tactical Position Cards on Pitch */}
              {currentFormationConfig.slots.map((slot) => {
                const assignedPlayerId = pitchSlots[slot.index];
                const player = assignedPlayerId ? playerIndex.get(assignedPlayerId) : null;
                const isNextTarget = nextEmptySlotIndex === slot.index;
                const isInspected = inspectedSlotIndex === slot.index;
                const isAnimated = animatedSwapEffect === assignedPlayerId;
                const isCaptain = roles.captainId === assignedPlayerId;

                return (
                  <div
                    key={slot.index}
                    style={{
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => {
                      if (player) {
                        handleCardClick(player.id, slot.index);
                      }
                    }}
                    className={`absolute z-10 flex flex-col items-center cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isAnimated ? 'scale-110 ring-4 ring-emerald-400' : 'hover:scale-105 active:scale-95'
                    }`}
                  >
                    {player ? (
                      // PLACED PLAYER CARD (Emil Kowalski Physics Micro-Card)
                      <div
                        className={`w-14 sm:w-16 p-1.5 rounded-xl border flex flex-col items-center shadow-lg backdrop-blur-md transition-all duration-200 ${
                          isInspected
                            ? 'bg-blue-900/90 border-blue-400 ring-2 ring-blue-400/60 scale-105 shadow-blue-950/80'
                            : 'bg-slate-900/85 border-slate-700/80 hover:border-slate-500 hover:bg-slate-900'
                        }`}
                      >
                        <div className="relative w-8 h-8 rounded-full bg-slate-800 border border-slate-600 overflow-hidden flex items-center justify-center">
                          {player.cardImage || player.photoUrl ? (
                            <img src={player.cardImage || player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300">
                              {player.name ? player.name.slice(0, 2).toUpperCase() : 'PL'}
                            </span>
                          )}
                          {isCaptain && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-[8px] flex items-center justify-center shadow">
                              C
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-white truncate max-w-full text-center mt-1 leading-tight">
                          {player.name ? player.name.split(' ').pop() : 'Player'}
                        </span>

                        <div className="flex items-center justify-between w-full mt-0.5 px-0.5 text-[8px] font-mono">
                          <span className="text-emerald-400 font-bold">{slot.position}</span>
                          <span className="text-amber-400 font-black">{player.rating || 75}</span>
                        </div>
                      </div>
                    ) : (
                      // EMPTY POSITION SLOT (Silhouette Card)
                      <div
                        className={`w-12 h-12 rounded-xl border border-dashed flex flex-col items-center justify-center transition-all duration-300 ${
                          isNextTarget
                            ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-950/60 scale-110 animate-pulse'
                            : 'border-white/20 bg-slate-900/40 hover:bg-slate-900/60'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold text-slate-300">{slot.position}</span>
                        {isNextTarget && (
                          <span className="text-[8px] font-bold text-emerald-300 uppercase tracking-tighter">Next</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PROGRESSIVE ASSIGNMENT DOCK (Sequential Picker for Active Slot) */}
            {nextEmptySlotIndex !== null && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold border border-emerald-500/30">
                      {nextEmptySlotIndex + 1}
                    </span>
                    <h4 className="text-xs font-bold text-white">
                      Assign {currentFormationConfig.slots[nextEmptySlotIndex]?.label} (
                      {currentFormationConfig.slots[nextEmptySlotIndex]?.position})
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {unplacedStarterIds.length} starters remaining
                  </span>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {unplacedStarterIds.map((id) => {
                    const player = playerIndex.get(id);
                    if (!player) return null;

                    const isRecommended =
                      (player.position || '').toUpperCase() ===
                      (currentFormationConfig.slots[nextEmptySlotIndex]?.position || '').toUpperCase();

                    return (
                      <button
                        key={id}
                        onClick={() => handleAssignToPitchSlot(id, nextEmptySlotIndex)}
                        className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 shrink-0 transition-all duration-200 active:scale-95 cursor-pointer ${
                          isRecommended
                            ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                          #{player.number}
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold block">{player.name}</span>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                            <span>{player.position}</span>
                            <span>•</span>
                            <span className="text-amber-400">Rating {player.rating || 75}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PLAYER INSPECTION CARD MODAL */}
            {inspectedPlayerId && inspectedSlotIndex !== null && (() => {
              const player = playerIndex.get(inspectedPlayerId);
              if (!player) return null;
              const slot = currentFormationConfig.slots[inspectedSlotIndex];

              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
                  <div className="w-full max-w-sm rounded-2xl bg-[#091224] border border-slate-700/80 shadow-2xl p-5 flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
                    <button
                      onClick={() => {
                        setInspectedPlayerId(null);
                        setInspectedSlotIndex(null);
                      }}
                      className="absolute top-3 right-3 p-1 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shadow-md">
                        {player.cardImage || player.photoUrl ? (
                          <img src={player.cardImage || player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base font-bold text-slate-300">
                            {player.name ? player.name.slice(0, 2).toUpperCase() : 'PL'}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white">{player.name}</span>
                          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                            #{player.number}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-400 block mt-0.5">
                          Pitch Slot: {slot?.label} ({slot?.position})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-2 px-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Rating</span>
                        <span className="text-sm font-mono font-black text-amber-300">{player.rating || 75}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Position</span>
                        <span className="text-sm font-mono font-bold text-blue-300">{player.position}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Status</span>
                        <span className="text-sm font-mono font-bold text-emerald-400">{player.status || 'Fit'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={handleStartSwap}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/50 active:scale-95 transition-all cursor-pointer"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Swap Position / Sub</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SWAP DRAWER / TRAY (Emil Kowalski Spring Motion Swap Tray) */}
            {isSwapDrawerOpen && swapTargetSlot !== null && (() => {
              const targetPlayerId = pitchSlots[swapTargetSlot];
              const targetPlayer = targetPlayerId ? playerIndex.get(targetPlayerId) : null;

              return (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-[#091224] border border-slate-700/80 shadow-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">Swap Engine</span>
                        <h4 className="text-sm font-black text-white">
                          Select Player to Swap with {targetPlayer?.name || 'slot'}
                        </h4>
                      </div>
                      <button
                        onClick={() => setIsSwapDrawerOpen(false)}
                        className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Section 1: Substitutes (Max 6) */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Substitutes Bench ({substituteIds.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {substituteIds.map((id) => {
                          const sub = playerIndex.get(id);
                          if (!sub) return null;

                          return (
                            <button
                              key={id}
                              onClick={() => handleExecuteSwap(id)}
                              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-950/50 border border-slate-700 hover:border-emerald-500 flex items-center gap-2.5 text-left transition-all duration-200 active:scale-95 cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                                #{sub.number}
                              </div>
                              <div className="truncate">
                                <span className="text-xs font-bold text-white block truncate">{sub.name}</span>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                                  <span>{sub.position}</span>
                                  <span>•</span>
                                  <span className="text-amber-400">{sub.rating || 75}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 2: Other Pitch Starters */}
                    <div className="mt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Or Swap With Outfield Starter
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                        {pitchSlots.map((pId, idx) => {
                          if (!pId || idx === swapTargetSlot) return null;
                          const starter = playerIndex.get(pId);
                          if (!starter) return null;
                          const slot = currentFormationConfig.slots[idx];

                          return (
                            <button
                              key={pId}
                              onClick={() => handleExecuteSwap(pId)}
                              className="p-2 rounded-xl bg-slate-900/80 hover:bg-blue-950/50 border border-slate-800 hover:border-blue-500 flex items-center gap-2 text-left transition-all duration-200 active:scale-95 cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                                #{starter.number}
                              </div>
                              <div className="truncate">
                                <span className="text-xs font-semibold text-slate-200 block truncate">{starter.name}</span>
                                <span className="text-[9px] text-blue-400 font-mono">{slot?.position}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>
        )}
      </main>

      {/* FLOATING TOAST NOTIFICATION */}
      {localToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-blue-600/95 border border-blue-400/40 text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>{localToast}</span>
        </div>
      )}
    </div>
  );
};

export default TeamSquadView;
