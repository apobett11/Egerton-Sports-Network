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
  Menu,
  AlertTriangle,
  LayoutDashboard,
  Newspaper,
  Settings,
  Send
} from 'lucide-react';
import { saveTeamTacticsAndSquad } from '../../lib/supabaseClient';

export type FormationType =
  | '4-3-3'
  | '4-4-2'
  | '4-2-3-1'
  | '3-5-2'
  | '4-4-1-1'
  | '5-3-2'
  | '3-4-3'
  | '4-1-4-1'
  | '4-5-1';

export interface FormationSlot {
  index: number;
  position: string;
  category: 'GK' | 'DEF' | 'MID' | 'ATT';
  label: string;
  x: number; // Percentage relative to pitch (0 - 100)
  y: number; // Percentage relative to pitch (0 - 100)
}

// 9 Tactical Formations: Slot 0 is Goalkeeper, then Defenders, then Midfielders, then Attackers up to 10
export const FORMATION_CONFIGS: Record<FormationType, { name: FormationType; label: string; slots: FormationSlot[] }> = {
  '4-3-3': {
    name: '4-3-3',
    label: '4-3-3 Attack',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LB', category: 'DEF', label: 'Left Back', x: 18, y: 72 },
      { index: 2, position: 'LCB', category: 'DEF', label: 'Left Centre Back', x: 38, y: 74 },
      { index: 3, position: 'RCB', category: 'DEF', label: 'Right Centre Back', x: 62, y: 74 },
      { index: 4, position: 'RB', category: 'DEF', label: 'Right Back', x: 82, y: 72 },
      { index: 5, position: 'LCM', category: 'MID', label: 'Left Central Midfield', x: 30, y: 48 },
      { index: 6, position: 'CDM', category: 'MID', label: 'Defensive Midfield', x: 50, y: 56 },
      { index: 7, position: 'RCM', category: 'MID', label: 'Right Central Midfield', x: 70, y: 48 },
      { index: 8, position: 'LW', category: 'ATT', label: 'Left Winger', x: 22, y: 22 },
      { index: 9, position: 'ST', category: 'ATT', label: 'Centre Forward', x: 50, y: 14 },
      { index: 10, position: 'RW', category: 'ATT', label: 'Right Winger', x: 78, y: 22 },
    ],
  },
  '4-4-2': {
    name: '4-4-2',
    label: '4-4-2 Classic',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LB', category: 'DEF', label: 'Left Back', x: 18, y: 72 },
      { index: 2, position: 'LCB', category: 'DEF', label: 'Left Centre Back', x: 38, y: 74 },
      { index: 3, position: 'RCB', category: 'DEF', label: 'Right Centre Back', x: 62, y: 74 },
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
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LB', category: 'DEF', label: 'Left Back', x: 18, y: 72 },
      { index: 2, position: 'LCB', category: 'DEF', label: 'Left Centre Back', x: 38, y: 74 },
      { index: 3, position: 'RCB', category: 'DEF', label: 'Right Centre Back', x: 62, y: 74 },
      { index: 4, position: 'RB', category: 'DEF', label: 'Right Back', x: 82, y: 72 },
      { index: 5, position: 'LDM', category: 'MID', label: 'Left Defensive Midfield', x: 38, y: 58 },
      { index: 6, position: 'RDM', category: 'MID', label: 'Right Defensive Midfield', x: 62, y: 58 },
      { index: 7, position: 'LAM', category: 'MID', label: 'Left Attacking Midfield', x: 24, y: 34 },
      { index: 8, position: 'CAM', category: 'MID', label: 'Central Attacking Midfield', x: 50, y: 32 },
      { index: 9, position: 'RAM', category: 'MID', label: 'Right Attacking Midfield', x: 76, y: 34 },
      { index: 10, position: 'ST', category: 'ATT', label: 'Centre Forward', x: 50, y: 14 },
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    label: '3-5-2 Wing Play',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LCB', category: 'DEF', label: 'Left Centre Back', x: 28, y: 74 },
      { index: 2, position: 'CB', category: 'DEF', label: 'Centre Back', x: 50, y: 76 },
      { index: 3, position: 'RCB', category: 'DEF', label: 'Right Centre Back', x: 72, y: 74 },
      { index: 4, position: 'LWB', category: 'MID', label: 'Left Wing Back', x: 16, y: 48 },
      { index: 5, position: 'LDM', category: 'MID', label: 'Left Defensive Midfield', x: 38, y: 56 },
      { index: 6, position: 'RDM', category: 'MID', label: 'Right Defensive Midfield', x: 62, y: 56 },
      { index: 7, position: 'CAM', category: 'MID', label: 'Attacking Midfield', x: 50, y: 36 },
      { index: 8, position: 'RWB', category: 'MID', label: 'Right Wing Back', x: 84, y: 48 },
      { index: 9, position: 'LST', category: 'ATT', label: 'Left Striker', x: 38, y: 16 },
      { index: 10, position: 'RST', category: 'ATT', label: 'Right Striker', x: 62, y: 16 },
    ],
  },
  '4-4-1-1': {
    name: '4-4-1-1',
    label: '4-4-1-1 Counter',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LB', category: 'DEF', label: 'Left Back', x: 18, y: 72 },
      { index: 2, position: 'LCB', category: 'DEF', label: 'Left Centre Back', x: 38, y: 74 },
      { index: 3, position: 'RCB', category: 'DEF', label: 'Right Centre Back', x: 62, y: 74 },
      { index: 4, position: 'RB', category: 'DEF', label: 'Right Back', x: 82, y: 72 },
      { index: 5, position: 'LM', category: 'MID', label: 'Left Midfield', x: 18, y: 48 },
      { index: 6, position: 'LCM', category: 'MID', label: 'Left Central Midfield', x: 39, y: 52 },
      { index: 7, position: 'RCM', category: 'MID', label: 'Right Central Midfield', x: 61, y: 52 },
      { index: 8, position: 'RM', category: 'MID', label: 'Right Midfield', x: 82, y: 48 },
      { index: 9, position: 'AMF', category: 'MID', label: 'Second Striker', x: 50, y: 30 },
      { index: 10, position: 'CF', category: 'ATT', label: 'Target Forward', x: 50, y: 14 },
    ],
  },
  '5-3-2': {
    name: '5-3-2',
    label: '5-3-2 Solid',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LWB', category: 'DEF', label: 'Left Wing Back', x: 16, y: 68 },
      { index: 2, position: 'LCB', category: 'DEF', label: 'Left Centre Back', x: 33, y: 74 },
      { index: 3, position: 'CB', category: 'DEF', label: 'Central Back', x: 50, y: 76 },
      { index: 4, position: 'RCB', category: 'DEF', label: 'Right Centre Back', x: 67, y: 74 },
      { index: 5, position: 'RWB', category: 'DEF', label: 'Right Wing Back', x: 84, y: 68 },
      { index: 6, position: 'LCM', category: 'MID', label: 'Left Midfield', x: 34, y: 48 },
      { index: 7, position: 'CDM', category: 'MID', label: 'Holding Midfield', x: 50, y: 56 },
      { index: 8, position: 'RCM', category: 'MID', label: 'Right Midfield', x: 66, y: 48 },
      { index: 9, position: 'LST', category: 'ATT', label: 'Left Forward', x: 38, y: 18 },
      { index: 10, position: 'RST', category: 'ATT', label: 'Right Forward', x: 62, y: 18 },
    ],
  },
  '3-4-3': {
    name: '3-4-3',
    label: '3-4-3 Wide Attack',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LCB', category: 'DEF', label: 'Left Centre Back', x: 28, y: 74 },
      { index: 2, position: 'CB', category: 'DEF', label: 'Centre Back', x: 50, y: 76 },
      { index: 3, position: 'RCB', category: 'DEF', label: 'Right Centre Back', x: 72, y: 74 },
      { index: 4, position: 'LM', category: 'MID', label: 'Left Wide Midfield', x: 18, y: 48 },
      { index: 5, position: 'LCM', category: 'MID', label: 'Central Midfield', x: 39, y: 52 },
      { index: 6, position: 'RCM', category: 'MID', label: 'Central Midfield', x: 61, y: 52 },
      { index: 7, position: 'RM', category: 'MID', label: 'Right Wide Midfield', x: 82, y: 48 },
      { index: 8, position: 'LW', category: 'ATT', label: 'Left Winger', x: 22, y: 22 },
      { index: 9, position: 'ST', category: 'ATT', label: 'Centre Forward', x: 50, y: 16 },
      { index: 10, position: 'RW', category: 'ATT', label: 'Right Winger', x: 78, y: 22 },
    ],
  },
  '4-1-4-1': {
    name: '4-1-4-1',
    label: '4-1-4-1 Anchor',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LB', category: 'DEF', label: 'Left Back', x: 18, y: 72 },
      { index: 2, position: 'LCB', category: 'DEF', label: 'Left Centre Back', x: 38, y: 74 },
      { index: 3, position: 'RCB', category: 'DEF', label: 'Right Centre Back', x: 62, y: 74 },
      { index: 4, position: 'RB', category: 'DEF', label: 'Right Back', x: 82, y: 72 },
      { index: 5, position: 'CDM', category: 'MID', label: 'Anchor Midfield', x: 50, y: 60 },
      { index: 6, position: 'LM', category: 'MID', label: 'Left Midfield', x: 18, y: 40 },
      { index: 7, position: 'LCM', category: 'MID', label: 'Left Central Midfield', x: 38, y: 42 },
      { index: 8, position: 'RCM', category: 'MID', label: 'Right Central Midfield', x: 62, y: 42 },
      { index: 9, position: 'RM', category: 'MID', label: 'Right Midfield', x: 82, y: 40 },
      { index: 10, position: 'ST', category: 'ATT', label: 'Solo Striker', x: 50, y: 16 },
    ],
  },
  '4-5-1': {
    name: '4-5-1',
    label: '4-5-1 Dense Midfield',
    slots: [
      { index: 0, position: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { index: 1, position: 'LB', category: 'DEF', label: 'Left Back', x: 18, y: 72 },
      { index: 2, position: 'LCB', category: 'DEF', label: 'Left Centre Back', x: 38, y: 74 },
      { index: 3, position: 'RCB', category: 'DEF', label: 'Right Centre Back', x: 62, y: 74 },
      { index: 4, position: 'RB', category: 'DEF', label: 'Right Back', x: 82, y: 72 },
      { index: 5, position: 'LM', category: 'MID', label: 'Left Midfield', x: 18, y: 46 },
      { index: 6, position: 'LCM', category: 'MID', label: 'Central Midfield', x: 34, y: 50 },
      { index: 7, position: 'CM', category: 'MID', label: 'Holding Midfield', x: 50, y: 52 },
      { index: 8, position: 'RCM', category: 'MID', label: 'Central Midfield', x: 66, y: 50 },
      { index: 9, position: 'RM', category: 'MID', label: 'Right Midfield', x: 82, y: 46 },
      { index: 10, position: 'ST', category: 'ATT', label: 'Lone Striker', x: 50, y: 16 },
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
  onSaveMatchLineup?: (
    fixtureId?: string,
    startingXI?: any[],
    subs?: any[],
    formation?: string,
    capId?: string,
    inMatchRoles?: any,
    pitchSlots?: (string | null)[]
  ) => Promise<any>;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

export const TeamSquadView: React.FC<TeamSquadViewProps> = ({
  currentRole = 'COACH',
  teamId = 'fc910b80-1a73-45f8-80f4-fcb03adce911',
  roster = [],
  teamName = 'First Team',
  teamCrest = '',
  activeFixtureId,
  onNavigateBack,
  onShowToast,
  onSaveMatchLineup,
}) => {
  const isCoach = currentRole === 'COACH' || (currentRole as string).toLowerCase() === 'coach';
  const CACHE_KEY = `coach_play_centre_${teamId}`;

  // 1. FAST SINGLE-UNIT ROSTER INDEXING (Map by UID for O(1) lookups)
  const playerIndex = useMemo(() => {
    const map = new Map<string, any>();
    if (Array.isArray(roster) && roster.length >= 11) {
      roster.forEach((p) => {
        if (p && p.id) {
          map.set(String(p.id), p);
        }
      });
    } else {
      // First populate any existing roster items
      if (Array.isArray(roster)) {
        roster.forEach((p) => {
          if (p && p.id) map.set(String(p.id), p);
        });
      }
      // Fill remaining to ensure coach always has a full squad pool to select from
      const fallbackNames = [
        'John Otieno', 'Brian Kipchumba', 'Kevin Omondi', 'Dennis Mwangi',
        'Samuel Kiptoo', 'Eric Mutua', 'David Wambua', 'Michael Maina',
        'Victor Korir', 'Peter Chebet', 'Alex Kibet', 'Collins Koech',
        'Felix Ngetich', 'George Cheruiyot', 'Hillary Rotich', 'Ian Sang',
        'Joseph Bett', 'Ken Langat', 'Lucas Cherono', 'Mark Tanui'
      ];
      const positions = ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LCM', 'RCM', 'LW', 'ST', 'RW', 'GK', 'DF', 'DF', 'MID', 'MID', 'FWD', 'FWD', 'MID', 'DF'];
      
      fallbackNames.forEach((name, idx) => {
        const id = `efc_p_${idx + 1}`;
        if (!map.has(id)) {
          map.set(id, {
            id,
            name,
            number: idx + 1,
            position: positions[idx],
            rating: 75 + (idx % 10),
          });
        }
      });
    }
    return map;
  }, [roster]);

  // Read initial cache
  const cachedState = useMemo(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, [CACHE_KEY]);

  // Wizard Step: 1: Formation, 2: First 11, 3: Subs, 4: Roles, 5: Pitch Simulation
  const [activeStep, setActiveStep] = useState<WizardStep>(() => cachedState?.step || 1);

  // 1. Selected Formation
  const [formation, setFormation] = useState<FormationType>(() => cachedState?.formation || '4-3-3');

  // CLEAN SLATE: Strict empty state on start, no pre-selection!
  const [startingXIIds, setStartingXIIds] = useState<string[]>(() => {
    if (cachedState?.startingXIIds && Array.isArray(cachedState.startingXIIds)) {
      return cachedState.startingXIIds;
    }
    return []; // Clean slate
  });

  const [substituteIds, setSubstituteIds] = useState<string[]>(() => {
    if (cachedState?.substituteIds && Array.isArray(cachedState.substituteIds)) {
      return cachedState.substituteIds.slice(0, 6);
    }
    return []; // Clean slate
  });

  // Strict 5 in-match roles in one card: Captain, Penalty Taker, Free Kick, Right Corner, Left Corner
  const [roles, setRoles] = useState<{
    captainId: string;
    penaltyTakerId: string;
    freeKickTakerId: string;
    rightCornerTakerId: string;
    leftCornerTakerId: string;
  }>(() => {
    if (cachedState?.roles) return cachedState.roles;
    return {
      captainId: '',
      penaltyTakerId: '',
      freeKickTakerId: '',
      rightCornerTakerId: '',
      leftCornerTakerId: '',
    };
  });

  // Pitch simulation: strictly empty initially
  const [pitchSlots, setPitchSlots] = useState<(string | null)[]>(() => {
    if (cachedState?.pitchSlots && Array.isArray(cachedState.pitchSlots) && cachedState.pitchSlots.length === 11) {
      return cachedState.pitchSlots;
    }
    return Array(11).fill(null);
  });

  // Interactive Card Inspection & Swapping state
  const [inspectedPlayerId, setInspectedPlayerId] = useState<string | null>(null);
  const [inspectedSlotIndex, setInspectedSlotIndex] = useState<number | null>(null);
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState<boolean>(false);
  const [swapTargetSlot, setSwapTargetSlot] = useState<number | null>(null);
  const [animatedSwapEffect, setAnimatedSwapEffect] = useState<string | null>(null);

  // Leave Confirmation Modal (Polite Reminder that unconfirmed steps will be lost)
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);

  // Commit Success Modal
  const [showCommitModal, setShowCommitModal] = useState<boolean>(false);

  // Right Navigation Sidebar Drawer
  const [isRightNavOpen, setIsRightNavOpen] = useState<boolean>(false);

  // Toast notification
  const [localToast, setLocalToast] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<any>(null);

  const notify = useCallback(
    (msg: string) => {
      if (onShowToast) onShowToast(msg);
      setLocalToast(msg);
      setTimeout(() => setLocalToast(null), 2500);
    },
    [onShowToast]
  );

  // Save state to local storage cache & DB
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
          console.warn('[Coach Play Centre] Save error:', err);
        }
      }, 1500);
    },
    [CACHE_KEY, isCoach, playerIndex, teamId]
  );

  // Current formation configuration slots
  const currentFormationConfig = useMemo(() => {
    return FORMATION_CONFIGS[formation] || FORMATION_CONFIGS['4-3-3'];
  }, [formation]);

  // Sequential placement index: first empty slot
  const nextEmptySlotIndex = useMemo(() => {
    const idx = pitchSlots.findIndex((slot) => slot === null);
    return idx === -1 ? null : idx;
  }, [pitchSlots]);

  // Starters placed on pitch set
  const placedPlayerIdsSet = useMemo(() => {
    return new Set(pitchSlots.filter(Boolean) as string[]);
  }, [pitchSlots]);

  // Step 1: Select Formation
  const handleSelectFormation = (f: FormationType) => {
    if (!isCoach) {
      notify('Permission Denied: Only Head Coach can change tactical formations.');
      return;
    }
    setFormation(f);
    setPitchSlots(Array(11).fill(null));
    persistState(f, startingXIIds, substituteIds, roles, Array(11).fill(null), 1);
    notify(`Formation switched to ${f}`);
  };

  // Step 2: Toggle First 11 Starter
  const handleToggleStarter = (playerId: string) => {
    if (!isCoach) {
      notify('Permission Denied: Only Head Coach can select First 11.');
      return;
    }
    const isSelected = startingXIIds.includes(playerId);
    let updated: string[];

    if (isSelected) {
      updated = startingXIIds.filter((id) => id !== playerId);
      setPitchSlots((prev) => prev.map((s) => (s === playerId ? null : s)));
    } else {
      if (startingXIIds.length >= 11) {
        notify('First 11 is full (11/11)! Deselect a player first.');
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

  // Step 3: Toggle Substitutes (Strict Max 6)
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
        notify('Maximum 6 substitutes permitted!');
        return;
      }
      updated = [...substituteIds, playerId];
    }

    setSubstituteIds(updated);
    persistState(formation, startingXIIds, updated, roles, pitchSlots, 3);
  };

  // Step 4: Assign Role (Captain, Penalty, Free Kick, Right Corner, Left Corner)
  const handleAssignRole = (roleKey: keyof typeof roles, playerId: string) => {
    if (!isCoach) {
      notify('Permission Denied: Only Head Coach can assign player roles.');
      return;
    }
    const updated = { ...roles, [roleKey]: playerId };
    setRoles(updated);
    persistState(formation, startingXIIds, substituteIds, updated, pitchSlots, 4);
    const p = playerIndex.get(playerId);
    notify(`${p?.name || 'Player'} selected`);
  };

  // Step 5: Assign to next empty slot on pitch sequentially
  const handleAssignToPitchSlot = (playerId: string) => {
    if (!isCoach || nextEmptySlotIndex === null) return;

    const newSlots = [...pitchSlots];
    newSlots[nextEmptySlotIndex] = playerId;
    setPitchSlots(newSlots);

    setAnimatedSwapEffect(playerId);
    setTimeout(() => setAnimatedSwapEffect(null), 500);

    persistState(formation, startingXIIds, substituteIds, roles, newSlots, 5);

    // If all 11 placed, trigger commit prompt
    if (newSlots.filter(Boolean).length === 11) {
      setShowCommitModal(true);
    }
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
      notify(`Substituted ${playerIndex.get(replacementPlayerId)?.name || 'sub'} into pitch!`);
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
      notify(`Please complete placing all 11 players on the pitch (${filledStarters.length}/11 placed).`);
      return;
    }

    const subPlayers = substituteIds.map((id) => playerIndex.get(id)).filter(Boolean);

    try {
      // 1. Always save team tactics, in-match roles, pitch slots, and temporary match squad
      await saveTeamTacticsAndSquad(teamId, {
        startingXI: filledStarters,
        substitutes: subPlayers,
        formation,
        tacticsConfig: { roles, pitchSlots },
      });

      // 2. If an active match / match lineup callback is available, commit match lineup with in-match roles
      if (onSaveMatchLineup) {
        await onSaveMatchLineup(
          activeFixtureId,
          filledStarters,
          subPlayers,
          formation,
          roles.captainId,
          roles,
          pitchSlots
        );
      }
      setShowCommitModal(false);
      try {
        localStorage.setItem('coach_squad_completed', 'true');
        window.dispatchEvent(new Event('coach_progression_updated'));
      } catch {}
      notify('Matchday squad saved and sent to fans in fixtures page!');
    } catch {
      notify('Lineup saved to local session.');
    }
  };

  // Safe Exit Handling with Polite Reminder
  const handleAttemptExit = () => {
    if (pitchSlots.filter(Boolean).length === 11) {
      if (onNavigateBack) onNavigateBack();
    } else {
      setShowExitConfirmModal(true);
    }
  };

  const handleConfirmExitAndReset = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {}
    setShowExitConfirmModal(false);
    if (onNavigateBack) onNavigateBack();
  };

  return (
    <div className="relative w-full h-dvh max-h-dvh overflow-hidden bg-[#030716] text-slate-100 flex flex-col font-sans select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-[10%] -top-[15%] w-[45%] h-[60%] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-[40%] h-[50%] rounded-full bg-emerald-600/10 blur-3xl" />
      </div>

      {/* TOP BANNER */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-[#070e20]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleAttemptExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <div className="h-4 w-px bg-slate-700/60 mx-1 hidden sm:block" />

          <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
            <span>Coach Dashboard</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Menu button for Right Sidebar Navigation */}
          <button
            onClick={() => setIsRightNavOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <Menu className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Navigation</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MAIN WIZARD CONTAINER                                                     */}
      {/* ========================================================================= */}
      <main className={`relative z-10 flex-1 min-h-0 flex flex-col items-center ${activeStep === 5 ? 'overflow-hidden justify-center p-2 sm:p-4' : 'overflow-y-auto overscroll-contain justify-start p-2 sm:p-4'}`}>
        {/* STEPS OUTSIDE THE CARD, ABOVE STEP HEADING WITH CLEAR FULL WORDINGS */}
        <div className="w-full max-w-4xl px-2 sm:px-0 mb-3 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 w-full">
              {[
                { step: 1, label: 'Choose Formation' },
                { step: 2, label: `Select First 11 (${startingXIIds.length}/11)` },
                { step: 3, label: `Select Substitutes (${substituteIds.length}/6)` },
                { step: 4, label: 'In-Match Roles' },
                { step: 5, label: 'Pitch Simulation' },
              ].map((item) => {
                const isCurrent = activeStep === item.step;
                const isCompleted = activeStep > item.step;
                return (
                  <button
                    key={item.step}
                    onClick={() => setActiveStep(item.step as WizardStep)}
                    className={`py-2 px-3 rounded-2xl text-center text-xs font-bold transition-all cursor-pointer border truncate ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 ring-2 ring-blue-400 border-blue-400'
                        : isCompleted
                        ? 'bg-slate-800/90 text-emerald-400 border-emerald-500/30 hover:bg-slate-800'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate block">
                      Step {item.step}: {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        {/* STEPS 1 TO 4 CONTAINER: Structured Card with Internal Scroll & Uniform Blue Confirm Button */}
        {activeStep !== 5 && (
          <div className="w-full max-w-4xl h-[86vh] max-h-[750px] bg-[#070f24]/95 border border-slate-800/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* CARD HEADER: Clear Step Heading & 1-line explanation with selection count */}
            <div className="px-6 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  {activeStep === 1 && 'Select Formation'}
                  {activeStep === 2 && 'Select First 11'}
                  {activeStep === 3 && 'Select Substitutes'}
                  {activeStep === 4 && 'In-Match Roles'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeStep === 1 && 'Choose your squad layout and tactical shape from the available formations.'}
                  {activeStep === 2 && 'Pick your 11 starting players from the squad roster to take the pitch.'}
                  {activeStep === 3 && 'Select up to 6 substitute players ready on the matchday bench.'}
                  {activeStep === 4 && 'Designate key leadership and set-piece taker responsibilities.'}
                </p>
              </div>

              {/* Dynamic counter in selection of First 11 and Substitutes */}
              {activeStep === 2 && (
                <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-black self-start sm:self-center transition-all ${
                  startingXIIds.length === 11
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                }`}>
                  {startingXIIds.length === 0
                    ? '0 selected'
                    : startingXIIds.length === 1
                    ? '1 selected'
                    : `${startingXIIds.length} selected`} of 11
                </div>
              )}

              {activeStep === 3 && (
                <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-black self-start sm:self-center transition-all ${
                  substituteIds.length === 6
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                }`}>
                  {substituteIds.length === 0
                    ? '0 selected'
                    : substituteIds.length === 1
                    ? '1 selected'
                    : `${substituteIds.length} selected`} of 6 (Max)
                </div>
              )}
            </div>

            {/* INTERNAL SCROLLABLE CONTENT BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* STEP 1: FORMATION CARDS (Clean card type, no verbose explanations, 9 formations) */}
              {activeStep === 1 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.keys(FORMATION_CONFIGS) as FormationType[]).map((fKey) => {
                    const conf = FORMATION_CONFIGS[fKey];
                    const isSelected = formation === fKey;
                    return (
                      <div
                        key={fKey}
                        onClick={() => handleSelectFormation(fKey)}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-950/60'
                            : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black text-white tracking-wide">{conf.name}</span>
                          {isSelected && (
                            <span className="p-1 rounded-full bg-blue-500 text-white">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-blue-300 mt-1 block">{conf.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 2: FIRST 11 (Just names, clean slate, stylish list) */}
              {activeStep === 2 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {Array.from(playerIndex.values()).map((player) => {
                    const isSelected = startingXIIds.includes(player.id);
                    return (
                      <div
                        key={player.id}
                        onClick={() => handleToggleStarter(player.id)}
                        className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-950/80 border-blue-500 shadow-md ring-1 ring-blue-400'
                            : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                        }`}
                      >
                        <span className="text-xs font-bold text-white truncate">{player.name}</span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 3: SUBSTITUTES (Just names, clean slate, stylish list, strict max 6) */}
              {activeStep === 3 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {Array.from(playerIndex.values())
                    .filter((p) => !startingXIIds.includes(p.id))
                    .map((player) => {
                      const isSelected = substituteIds.includes(player.id);
                      const isMax = substituteIds.length >= 6 && !isSelected;

                      return (
                        <div
                          key={player.id}
                          onClick={() => !isMax && handleToggleSubstitute(player.id)}
                          className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-950/80 border-blue-500 shadow-md ring-1 ring-blue-400 cursor-pointer'
                              : isMax
                              ? 'bg-slate-900/20 border-slate-800/40 opacity-40 cursor-not-allowed'
                              : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 cursor-pointer'
                          }`}
                        >
                          <span className="text-xs font-bold text-white truncate">{player.name}</span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* STEP 4: IN-MATCH ROLES (Strictly 5 roles, NO explanation, all in ONE stylish card) */}
              {activeStep === 4 && (
                <div className="flex flex-col gap-3">
                  <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-white tracking-wide">Select from the First 11</h3>
                      <p className="text-xs text-slate-300 mt-0.5">Assign leadership and set-piece responsibilities from your confirmed starting XI.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600/30 text-blue-300 text-xs font-bold border border-blue-500/40 self-start sm:self-center">
                      5 Roles
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col gap-4">
                    {[
                      { key: 'captainId' as const, label: 'Captain' },
                      { key: 'penaltyTakerId' as const, label: 'Penalty Taker' },
                      { key: 'freeKickTakerId' as const, label: 'Free Kick' },
                      { key: 'rightCornerTakerId' as const, label: 'Right Corner' },
                      { key: 'leftCornerTakerId' as const, label: 'Left Corner' },
                    ].map((item) => (
                      <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3 last:border-b-0 last:pb-0">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{item.label}</span>
                        <select
                          value={roles[item.key] || ''}
                          onChange={(e) => handleAssignRole(item.key, e.target.value)}
                          className="w-full sm:w-64 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer"
                        >
                          <option value="">Select Player...</option>
                          {startingXIIds.map((id) => {
                            const p = playerIndex.get(id);
                            return (
                              <option key={id} value={id}>
                                {p?.name || 'Player'}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* UNIFORM BLUE CONFIRM BUTTON AT BOTTOM RIGHT (Same place, no page scroll) */}
            <div className="px-6 py-4 border-t border-slate-800/80 bg-[#060c1c]/90 flex items-center justify-between">
              {activeStep > 1 ? (
                <button
                  onClick={() => setActiveStep((activeStep - 1) as WizardStep)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {activeStep === 1 && (
                <button
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/60 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  Confirm Formation
                </button>
              )}

              {activeStep === 2 && (
                <button
                  onClick={handleConfirmFirst11}
                  disabled={startingXIIds.length !== 11}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                    startingXIIds.length === 11
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/60 active:scale-95 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  Confirm First 11
                </button>
              )}

              {activeStep === 3 && (
                <button
                  onClick={() => setActiveStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/60 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  Confirm Substitutes
                </button>
              )}

              {activeStep === 4 && (
                <button
                  onClick={() => setActiveStep(5)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/60 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  Confirm Roles & Enter Pitch
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: FULL PAGE TALL PITCH SIMULATION                                   */}
        {/* ========================================================================= */}
        {activeStep === 5 && (
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center px-3 sm:px-6 py-2 pb-28 animate-in fade-in zoom-in-95 duration-200">
            {/* LATERAL MIDDLE HEADER: Team Name, Formation & Previous Step Navigation */}
            <div className="w-full max-w-2xl mx-auto flex items-center justify-between my-2 shrink-0 px-1">
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Go back to Step 4: In-Match Roles"
              >
                <ChevronLeft className="w-4 h-4 text-blue-400" />
                <span>Previous Step</span>
              </button>

              <div className="flex flex-col items-center justify-center text-center">
                <h2 className="text-base sm:text-xl font-black text-white tracking-wide">{teamName}</h2>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-0.5">{formation}</span>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                Step 5 of 5
              </span>
            </div>

            {/* DIRECT POSITION SELECTION DIRECTIVE BANNER ON TOP OF THE SIMULATION */}
            <div className="w-full max-w-2xl mx-auto mb-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-blue-950/80 border border-blue-500/40 shadow-xl shrink-0">
              {nextEmptySlotIndex !== null ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-[11px] font-black text-white uppercase tracking-wider shadow-sm">
                      Position {nextEmptySlotIndex + 1} of 11
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">
                      Select <span className="text-emerald-400 underline underline-offset-2">{currentFormationConfig.slots[nextEmptySlotIndex]?.label} ({currentFormationConfig.slots[nextEmptySlotIndex]?.position})</span> from the list below
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 text-center sm:text-right">
                    Click name below
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-extrabold text-xs sm:text-sm py-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All 11 players positioned! Click any card to swap, or save squad below.</span>
                </div>
              )}
            </div>

            {/* TALL PITCH CANVAS: Aspect ratio taller (portrait tactical whiteboard) */}
            <div className="relative w-full max-w-2xl mx-auto aspect-[1/1.22] min-h-[520px] sm:min-h-[580px] max-h-[720px] rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl bg-gradient-to-b from-[#0c351f] via-[#082816] to-[#04160c] shrink-0">
              {/* Pitch markings */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" stroke="white" strokeWidth="1.5" fill="none">
                <rect x="4%" y="4%" width="92%" height="92%" rx="10" />
                <line x1="4%" y1="50%" x2="96%" y2="50%" />
                <circle cx="50%" cy="50%" r="13%" />
                <circle cx="50%" cy="50%" r="1.5" fill="white" />
                <rect x="22%" y="4%" width="56%" height="15%" />
                <rect x="34%" y="4%" width="32%" height="6%" />
                <rect x="22%" y="81%" width="56%" height="15%" />
                <rect x="34%" y="90%" width="32%" height="6%" />
              </svg>

              {/* Cards on Pitch: ONLY placed cards and the current active target card are rendered! */}
              {currentFormationConfig.slots.map((slot) => {
                const assignedPlayerId = pitchSlots[slot.index];
                const player = assignedPlayerId ? playerIndex.get(assignedPlayerId) : null;
                const isNextTarget = nextEmptySlotIndex === slot.index;
                const isCaptain = roles.captainId === assignedPlayerId;

                // RULE: If card is not set AND not the current target, DO NOT SHOW!
                if (!player && !isNextTarget) {
                  return null;
                }

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
                    className="absolute z-10 flex flex-col items-center cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 active:scale-95"
                  >
                    {player ? (
                      // PLACED PLAYER CARD
                      <div className="w-14 sm:w-16 p-1.5 rounded-xl border bg-slate-900/85 border-slate-700/80 hover:border-slate-500 shadow-lg flex flex-col items-center">
                        <div className="relative w-8 h-8 rounded-full bg-slate-800 border border-slate-600 overflow-hidden flex items-center justify-center">
                          {player.cardImage || player.photoUrl ? (
                            <img src={player.cardImage || player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300">
                              {player.name ? player.name.slice(0, 2).toUpperCase() : 'PL'}
                            </span>
                          )}
                          {isCaptain && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-[8px] flex items-center justify-center">
                              C
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-white truncate max-w-full text-center mt-1 leading-tight">
                          {player.name ? player.name.split(' ').pop() : 'Player'}
                        </span>
                        <span className="text-[8px] font-mono text-emerald-400 font-bold mt-0.5">{slot.position}</span>
                      </div>
                    ) : (
                      // ACTIVE TARGET SLOT (Appears for selection)
                      <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-500/20 shadow-xl scale-105 animate-pulse flex flex-col items-center justify-center">
                        <span className="text-xs font-mono font-black text-white">{slot.position}</span>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase">Target</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PLAYER LISTS BELOW PITCH (All First XI players + all substitutes below them, within page with padding) */}
            <div className="w-full max-w-2xl mx-auto mt-4 bg-[#070f24]/90 p-4 sm:p-5 rounded-3xl border border-slate-800 flex flex-col gap-4 shadow-xl">
              {/* SECTION 1: ALL STARTING XI PLAYERS */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    First 11 Players ({startingXIIds.length})
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {placedPlayerIdsSet.size} / 11 placed
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {startingXIIds.map((id) => {
                    const player = playerIndex.get(id);
                    if (!player) return null;
                    const isAssigned = placedPlayerIdsSet.has(id);

                    return (
                      <button
                        key={id}
                        disabled={isAssigned}
                        onClick={() => handleAssignToPitchSlot(id)}
                        className={`p-2.5 rounded-xl border text-center transition-all duration-200 ${
                          isAssigned
                            ? 'opacity-25 blur-[1px] pointer-events-none scale-95 border-slate-800 bg-slate-900'
                            : 'bg-slate-800/90 border-slate-700 hover:border-blue-400 hover:bg-slate-750 text-white cursor-pointer active:scale-95 shadow-sm'
                        }`}
                      >
                        <span className="text-xs font-bold block truncate">{player.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: ALL SUBSTITUTES BELOW THEM */}
              <div className="border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    Substitutes ({substituteIds.length})
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Available Bench
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {substituteIds.map((id) => {
                    const sub = playerIndex.get(id);
                    if (!sub) return null;
                    const isAssigned = placedPlayerIdsSet.has(id);

                    return (
                      <div
                        key={id}
                        className={`p-2.5 rounded-xl border text-center transition-all duration-200 flex items-center justify-between gap-1.5 ${
                          isAssigned
                            ? 'opacity-30 blur-[1px] border-slate-800 bg-slate-900'
                            : 'bg-slate-800/60 border-slate-750 text-slate-300'
                        }`}
                      >
                        <span className="text-xs font-semibold truncate text-left">{sub.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/80 text-blue-300 font-mono font-bold uppercase shrink-0">
                          SUB
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BOTTOM ACTION BAR: PREVIOUS BUTTON + SAVE AND COMMIT SQUAD */}
            <div className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 z-40 flex items-center justify-between sm:justify-end gap-3 pointer-events-auto">
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs sm:text-sm shadow-2xl border border-slate-700/80 transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <ChevronLeft className="w-4 h-4 text-blue-400" />
                <span>Previous Step (Roles)</span>
              </button>

              <button
                type="button"
                onClick={handleCommitOfficialLineup}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-2xl shadow-blue-900/80 border border-blue-400/40 transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span>Save & Commit Squad</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* CARD INSPECTOR MODAL                                                      */}
      {/* ========================================================================= */}
      {inspectedPlayerId && inspectedSlotIndex !== null && (() => {
        const player = playerIndex.get(inspectedPlayerId);
        if (!player) return null;
        const slot = currentFormationConfig.slots[inspectedSlotIndex];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-xs rounded-2xl bg-[#091224] border border-slate-700/80 shadow-2xl p-5 flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  setInspectedPlayerId(null);
                  setInspectedSlotIndex(null);
                }}
                className="absolute top-3 right-3 p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <h3 className="text-base font-black text-white">{player.name}</h3>
                <span className="text-xs font-semibold text-emerald-400">{slot?.label} ({slot?.position})</span>
              </div>

              <button
                onClick={handleStartSwap}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/50 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Swap Player</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* SWAP DRAWER / TRAY                                                        */}
      {/* ========================================================================= */}
      {isSwapDrawerOpen && swapTargetSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-[#091224] border border-slate-700/80 shadow-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-black text-white">Select Player to Swap</h4>
              <button
                onClick={() => setIsSwapDrawerOpen(false)}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Substitutes */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Substitutes ({substituteIds.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {substituteIds.map((id) => {
                  const sub = playerIndex.get(id);
                  if (!sub) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => handleExecuteSwap(id)}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-950 border border-slate-700 hover:border-blue-500 text-xs font-bold text-white truncate transition-all active:scale-95 cursor-pointer text-left"
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pitch Starters */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Outfield Pitch Starters
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {pitchSlots.map((pId, idx) => {
                  if (!pId || idx === swapTargetSlot) return null;
                  const starter = playerIndex.get(pId);
                  if (!starter) return null;
                  return (
                    <button
                      key={pId}
                      onClick={() => handleExecuteSwap(pId)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500 text-xs font-semibold text-slate-200 truncate transition-all active:scale-95 cursor-pointer text-left"
                    >
                      {starter.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMMIT POPUP PROMPT                                                       */}
      {/* ========================================================================= */}
      {showCommitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#091224] border border-emerald-500/40 shadow-2xl p-6 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <Send className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Pitch Ready!</h3>
              <p className="text-xs text-slate-300 mt-1">
                Save and send this to the fans in the fixtures page.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full mt-2">
              <button
                onClick={() => setShowCommitModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                onClick={handleCommitOfficialLineup}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/60 transition-all active:scale-95 cursor-pointer"
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POLITE EXIT CONFIRMATION MODAL                                            */}
      {/* ========================================================================= */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-[#091224] border border-amber-500/40 shadow-2xl p-6 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Exit Coach Play Centre?</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                All saved steps and selections will actually be lost, and you will have to begin again. Are you sure you want to leave?
              </p>
            </div>

            <div className="flex items-center gap-2 w-full mt-2">
              <button
                onClick={() => setShowExitConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/50 cursor-pointer"
              >
                Stay & Complete
              </button>
              <button
                onClick={handleConfirmExitAndReset}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-xs font-semibold text-slate-400 cursor-pointer"
              >
                Leave & Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RIGHT NAVIGATION SIDEBAR DRAWER                                           */}
      {/* ========================================================================= */}
      {isRightNavOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-72 max-w-[85vw] h-full max-h-[100dvh] bg-[#070f24] border-l border-slate-800 shadow-2xl p-5 flex flex-col overflow-y-auto overscroll-contain animate-in slide-in-from-right duration-250">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <span className="text-sm font-black text-white tracking-wide">Pages Navigation</span>
                <button
                  onClick={() => setIsRightNavOpen(false)}
                  className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'OVERVIEW / DASHBOARD', icon: <LayoutDashboard className="w-4 h-4" />, action: handleAttemptExit },
                  { label: 'TEAM SQUAD / PLAY CENTRE', icon: <Shirt className="w-4 h-4" />, action: () => setIsRightNavOpen(false) },
                  { label: 'PLAYERS & KITS', icon: <Users className="w-4 h-4" />, action: handleAttemptExit },
                  { label: 'TABLE & FIXTURES', icon: <Trophy className="w-4 h-4" />, action: handleAttemptExit },
                  { label: 'NEWSROOM & PRESS', icon: <Newspaper className="w-4 h-4" />, action: handleAttemptExit },
                  { label: 'TEAM SETTINGS', icon: <Settings className="w-4 h-4" />, action: handleAttemptExit },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
                  >
                    <span className="text-blue-400">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
              Egerton Sports Network • Coach Portal
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST */}
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
