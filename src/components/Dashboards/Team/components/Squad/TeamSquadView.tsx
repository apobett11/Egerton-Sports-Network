import React, { useState, useEffect, useRef } from 'react';
import { 
  Player, 
  CardTheme,
  FormationType, 
  Playstyle, 
  ActiveModal,
  Manager,
  TeamData,
  InMatchRoles
} from './types';
import { 
  TEAMS_DATA,
  FORMATIONS 
} from './initialData';
import { Sidebar } from './Sidebar';
import { Pitch } from './Pitch';
import { RightPanel } from './RightPanel';
import { SubstitutesDrawer } from './SubstitutesDrawer';
import { ManagerModal } from './ManagerModal';
import { TeamModal } from './TeamModal';
import { LandscapeGuard } from './LandscapeGuard';
import { PlayerCard } from './PlayerCard';
import { saveTeamTacticsAndSquad, uploadTeamCrest, fetchCoachCaptainProfiles } from '../../lib/supabaseClient';

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

export const TeamSquadView: React.FC<TeamSquadViewProps> = ({
  currentRole = 'COACH',
  teamId = 'fc910b80-1a73-45f8-80f4-fcb03adce911',
  roster,
  teamName,
  teamCrest,
  coachProfile,
  captainProfile,
  activeFixtureId,
  onNavigateBack,
  onShowToast,
  onSaveMatchLineup,
}) => {
  const isCoach = currentRole === 'COACH';

  // Builder for exactly 11 pitch simulation cards: filled with DB players; remaining cards remain empty position slots with avatar
  const buildPitchStartingXI = React.useCallback(
    (rosterList?: any[], targetFormation: FormationType = '4-3-3', capId?: string) => {
      const template = FORMATIONS[targetFormation] || FORMATIONS['4-3-3'];
      const xi: Player[] = [];
      for (let i = 0; i < 11; i++) {
        const slot = template.coords[i] || { x: 50, y: 50, position: 'CMF' };
        const realP = rosterList && rosterList[i] ? rosterList[i] : null;
        if (realP) {
          let pos = (realP.position as any) || slot.position;
          if (pos === 'DEF' || pos === 'DF') pos = slot.position;
          if (pos === 'FWD' || pos === 'FW') pos = slot.position;
          if (pos === 'MID' || pos === 'MD') pos = slot.position;

          xi.push({
            id: realP.id,
            name: realP.name,
            number: realP.number || i + 1,
            position: slot.position as any,
            defaultPosition: pos,
            rating: realP.rating || 75,
            photoUrl: realP.cardImage || realP.photoUrl || '',
            flagUrl: realP.flagUrl || 'https://flagcdn.com/w80/ke.png',
            clubLogoUrl: teamCrest || '',
            cardTheme: (realP.rating || 75) >= 85 ? 'epic' : (realP.rating || 75) >= 80 ? 'gold' : 'blue',
            isCaptain: realP.id === (capId || captainProfile?.id) || i === 0,
            coord: { x: slot.x, y: slot.y },
          });
        } else {
          // Exactly 11 cards maintained at all times: unfilled card slot with position and avatar
          xi.push({
            id: `slot_empty_${i + 1}`,
            name: slot.position,
            number: i + 1,
            position: slot.position as any,
            defaultPosition: slot.position as any,
            rating: 70,
            photoUrl: '', // In absence, shows avatar
            flagUrl: '',
            clubLogoUrl: teamCrest || '',
            cardTheme: 'blue',
            isCaptain: false,
            coord: { x: slot.x, y: slot.y },
          });
        }
      }
      return xi;
    },
    [teamCrest, captainProfile]
  );

  // Substitutes: strictly from database roster (blank if <= 11 players)
  const buildSubstitutes = React.useCallback(
    (rosterList?: any[]) => {
      if (!rosterList || rosterList.length <= 11) return [];
      return rosterList.slice(11, 18).map((p, idx) => ({
        id: p.id,
        name: p.name,
        number: p.number || 12 + idx,
        position: (p.position as any) || 'CMF',
        defaultPosition: (p.position as any) || 'CMF',
        rating: p.rating || 75,
        photoUrl: p.cardImage || p.photoUrl || '',
        flagUrl: 'https://flagcdn.com/w80/ke.png',
        clubLogoUrl: teamCrest || '',
        cardTheme: ((p.rating || 75) >= 85 ? 'epic' : (p.rating || 75) >= 80 ? 'gold' : 'blue') as CardTheme,
        isCaptain: false,
      }));
    },
    [teamCrest]
  );

  // Reserves: strictly from database roster (blank if <= 18 players)
  const buildReserves = React.useCallback(
    (rosterList?: any[]) => {
      if (!rosterList || rosterList.length <= 18) return [];
      return rosterList.slice(18).map((p, idx) => ({
        id: p.id,
        name: p.name,
        number: p.number || 19 + idx,
        position: (p.position as any) || 'CMF',
        defaultPosition: (p.position as any) || 'CMF',
        rating: p.rating || 75,
        photoUrl: p.cardImage || p.photoUrl || '',
        flagUrl: 'https://flagcdn.com/w80/ke.png',
        clubLogoUrl: teamCrest || '',
        cardTheme: ((p.rating || 75) >= 85 ? 'epic' : (p.rating || 75) >= 80 ? 'gold' : 'blue') as CardTheme,
        isCaptain: false,
      }));
    },
    [teamCrest]
  );

  const CACHE_KEY = `esn_squad_tactics_${teamId}`;

  // Read local storage cache for instant restore without resetting to default on reload
  const cachedData = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Discard old cache if it contains fallback players (e.g. mu_)
        if (
          parsed?.startingXI &&
          Array.isArray(parsed.startingXI) &&
          !parsed.startingXI.some((p: any) => String(p.id).startsWith('mu_'))
        ) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }, [CACHE_KEY]);

  const [currentTeamId, setCurrentTeamId] = useState<string>(cachedData?.teamId || 'egerton_fc');

  const [startingXI, setStartingXI] = useState<Player[]>(() => {
    if (cachedData?.startingXI && cachedData.startingXI.length === 11) return cachedData.startingXI;
    return buildPitchStartingXI(roster, '4-3-3');
  });
  const [substitutes, setSubstitutes] = useState<Player[]>(() => {
    if (cachedData?.substitutes) return cachedData.substitutes;
    return buildSubstitutes(roster);
  });
  const [reserves, setReserves] = useState<Player[]>(() => {
    if (cachedData?.reserves) return cachedData.reserves;
    return buildReserves(roster);
  });
  const [manager, setManager] = useState<Manager>(() => {
    if (cachedData?.manager) return cachedData.manager;
    return {
      name: coachProfile?.name || 'Head Coach',
      photoUrl: coachProfile?.avatarUrl || '',
      phone: coachProfile?.phone || '',
      email: coachProfile?.email || '',
      title: 'Head Coach',
      proficiencies: {
        'Possession Game': 85,
        'Quick Counter': 80,
        'Long Ball Counter': 75,
        'Out Wide': 70,
        'Long Ball': 65,
      },
    };
  });
  const [formation, setFormation] = useState<FormationType>(() => {
    if (cachedData?.formation) return cachedData.formation;
    return '4-3-3';
  });
  const [playstyle, setPlaystyle] = useState<Playstyle>(() => {
    if (cachedData?.playstyle) return cachedData.playstyle;
    return 'Possession Game';
  });
  const [customCrest, setCustomCrest] = useState<string>(() => {
    return cachedData?.crestUrl || teamCrest || '';
  });
  const [inMatchRoles, setInMatchRoles] = useState<any>(() => {
    if (cachedData?.inMatchRoles) return cachedData.inMatchRoles;
    return {
      captainId: startingXI[0]?.id || '',
      cornerTakerId: startingXI[1]?.id || '',
      rightFreeKickTakerId: startingXI[2]?.id || '',
      leftFreeKickTakerId: startingXI[3]?.id || '',
      penaltyTakerId: startingXI[0]?.id || '',
    };
  });

  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Touch drag state for smooth dragging of substitutes/reserves onto pitch
  const [subTouchDragPlayer, setSubTouchDragPlayer] = useState<Player | null>(null);
  const [subTouchPos, setSubTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [subTouchTargetId, setSubTouchTargetId] = useState<string | null>(null);

  // Synchronize authentic database roster when loaded or updated
  React.useEffect(() => {
    if (roster !== undefined) {
      const newXI = buildPitchStartingXI(roster, formation, inMatchRoles?.captainId);
      const newSubs = buildSubstitutes(roster);
      const newRes = buildReserves(roster);
      setStartingXI(newXI);
      setSubstitutes(newSubs);
      setReserves(newRes);
    }
  }, [roster, formation, buildPitchStartingXI, buildSubstitutes, buildReserves, inMatchRoles?.captainId]);

  // Synchronize coach details using UID from database profiles
  React.useEffect(() => {
    if (coachProfile) {
      setManager((prev) => ({
        ...prev,
        name: coachProfile.name || prev.name,
        photoUrl: coachProfile.avatarUrl || '',
        email: coachProfile.email || prev.email,
        phone: coachProfile.phone || prev.phone,
      }));
    } else if (teamId) {
      fetchCoachCaptainProfiles(teamId).then((res) => {
        if (res.coach) {
          setManager((prev) => ({
            ...prev,
            name: res.coach?.name || prev.name,
            photoUrl: res.coach?.avatarUrl || '',
            email: res.coach?.email || prev.email,
            phone: res.coach?.phone || prev.phone,
          }));
        }
      });
    }
  }, [coachProfile, teamId]);

  const autoSaveTimeoutRef = useRef<any>(null);

  // Save full state locally so refresh/re-login persists exactly
  const saveToLocalCache = (data: {
    startingXI: Player[];
    substitutes: Player[];
    reserves: Player[];
    formation: FormationType;
    playstyle: Playstyle;
    inMatchRoles?: any;
    manager?: Manager;
    crestUrl?: string;
  }) => {
    try {
      const payload = {
        teamId,
        startingXI: data.startingXI,
        substitutes: data.substitutes,
        reserves: data.reserves,
        formation: data.formation,
        playstyle: data.playstyle,
        inMatchRoles: data.inMatchRoles || inMatchRoles,
        manager: data.manager || manager,
        crestUrl: data.crestUrl || customCrest,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  };

  const currentTeam: TeamData = {
    id: teamId,
    name: teamName || 'Egerton FC First Team',
    shortName: 'EFC',
    crestUrl: customCrest || teamCrest || '',
    formation,
    playstyle,
    manager,
    startingXI,
    substitutes,
  };

  // Captain detail loaded from database using captainProfile UID or startingXI
  const currentCaptain: Player = React.useMemo(() => {
    if (captainProfile) {
      const foundInXI = startingXI.find(
        (p) => p.id === captainProfile.id || p.name.toLowerCase() === captainProfile.name.toLowerCase()
      );
      if (foundInXI) {
        return {
          ...foundInXI,
          isCaptain: true,
          photoUrl: captainProfile.avatarUrl || foundInXI.photoUrl,
        };
      }
      return {
        id: captainProfile.id,
        name: captainProfile.name,
        number: 10,
        position: 'CMF',
        defaultPosition: 'CMF',
        rating: 85,
        photoUrl: captainProfile.avatarUrl || '',
        flagUrl: 'https://flagcdn.com/w80/ke.png',
        clubLogoUrl: teamCrest || '',
        cardTheme: 'gold',
        isCaptain: true,
      };
    }
    const capInXI = startingXI.find((p) => p.isCaptain && !p.id.startsWith('slot_empty_'));
    return (
      capInXI ||
      startingXI[0] || {
        id: 'cap_placeholder',
        name: 'Team Captain',
        number: 10,
        position: 'CMF',
        defaultPosition: 'CMF',
        rating: 80,
        photoUrl: '',
        flagUrl: 'https://flagcdn.com/w80/ke.png',
        clubLogoUrl: teamCrest || '',
        cardTheme: 'blue',
        isCaptain: true,
      }
    );
  }, [captainProfile, startingXI, teamCrest]);

  const showToast = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    }
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handlePermissionDenied = (msg: string) => {
    showToast(msg);
  };

  // Card position intelligence: Immediate cache + silent auto-save to Database
  const triggerAutoSave = (
    newXI: Player[],
    newSubs: Player[],
    newReserves: Player[],
    newFormation: FormationType,
    newPlaystyle: Playstyle,
    newRoles?: any,
    newManager?: Manager,
    newCrest?: string
  ) => {
    saveToLocalCache({
      startingXI: newXI,
      substitutes: newSubs,
      reserves: newReserves,
      formation: newFormation,
      playstyle: newPlaystyle,
      inMatchRoles: newRoles,
      manager: newManager,
      crestUrl: newCrest,
    });

    if (!isCoach) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const coordsMap: Record<string, { x: number; y: number }> = {};
        newXI.forEach((p) => {
          if (p.coord) {
            coordsMap[p.id] = p.coord;
          }
        });

        await saveTeamTacticsAndSquad(teamId, {
          startingXI: newXI,
          substitutes: newSubs,
          reserves: newReserves,
          formation: newFormation,
          playstyle: newPlaystyle,
          coordsMap,
        });
      } catch (err) {
        console.warn('Squad auto-save silent sync:', err);
      }
    }, 1200);
  };

  // Switch Team dynamically (Coach only)
  const handleSelectTeam = (tId: string) => {
    if (!isCoach) {
      showToast('Permission Denied: Only Head Coach can switch team presets.');
      return;
    }

    const selectedTeam = TEAMS_DATA[tId];
    if (!selectedTeam) return;

    setCurrentTeamId(tId);
    setManager(selectedTeam.manager);
    setStartingXI(selectedTeam.startingXI);
    const subs = selectedTeam.substitutes.slice(0, 7);
    const res = selectedTeam.substitutes.slice(7);
    setSubstitutes(subs);
    setReserves(res);
    setFormation(selectedTeam.formation);
    setPlaystyle(selectedTeam.playstyle);

    triggerAutoSave(selectedTeam.startingXI, subs, res, selectedTeam.formation, selectedTeam.playstyle);
    showToast(`Switched to ${selectedTeam.name} Game Plan`);
  };

  // Collective strength calculation
  const calculateCollectiveStrength = (players: Player[]) => {
    const total = players.reduce((sum, p) => sum + p.rating * 2.65, 0);
    return Math.round(total);
  };

  const collectiveStrength = calculateCollectiveStrength(startingXI);

  // Swap two players between pitch or pitch <-> bench/reserves
  const handleSwapPlayers = (sourceId: string, targetId: string) => {
    if (!isCoach) {
      showToast('Permission Denied: Only Head Coach can substitute or swap players.');
      return;
    }

    const sourceInXI = startingXI.find((p) => p.id === sourceId);
    const targetInXI = startingXI.find((p) => p.id === targetId);

    const sourceInSub = substitutes.find((p) => p.id === sourceId);
    const targetInSub = substitutes.find((p) => p.id === targetId);

    const sourceInRes = reserves.find((p) => p.id === sourceId);
    const targetInRes = reserves.find((p) => p.id === targetId);

    // Case 1: Swapping two players within starting XI
    if (sourceInXI && targetInXI) {
      const sourceCoord = sourceInXI.coord;
      const targetCoord = targetInXI.coord;
      const sourcePos = sourceInXI.position;
      const targetPos = targetInXI.position;

      const updatedXI = startingXI.map((p) => {
        if (p.id === sourceId) {
          return { ...p, coord: targetCoord, position: targetPos };
        }
        if (p.id === targetId) {
          return { ...p, coord: sourceCoord, position: sourcePos };
        }
        return p;
      });

      setStartingXI(updatedXI);
      triggerAutoSave(updatedXI, substitutes, reserves, formation, playstyle);
      showToast(`Swapped ${sourceInXI.name} with ${targetInXI.name}`);
      return;
    }

    // Case 2: Subbing from Bench into Pitch
    if (sourceInSub && targetInXI) {
      const targetCoord = targetInXI.coord;
      const targetPos = targetInXI.position;

      const updatedXI = startingXI.map((p) =>
        p.id === targetId
          ? { ...sourceInSub, coord: targetCoord, position: targetPos }
          : p
      );

      const updatedSubs = targetInXI.id.startsWith('slot_empty_')
        ? substitutes.filter((p) => p.id !== sourceId)
        : substitutes.map((p) =>
            p.id === sourceId
              ? { ...targetInXI, coord: undefined, position: targetInXI.defaultPosition }
              : p
          );

      setStartingXI(updatedXI);
      setSubstitutes(updatedSubs);
      triggerAutoSave(updatedXI, updatedSubs, reserves, formation, playstyle);
      showToast(`Substituted ${sourceInSub.name} into squad`);
      return;
    }

    // Case 3: Subbing from Reserves into Pitch
    if (sourceInRes && targetInXI) {
      const targetCoord = targetInXI.coord;
      const targetPos = targetInXI.position;

      const updatedXI = startingXI.map((p) =>
        p.id === targetId
          ? { ...sourceInRes, coord: targetCoord, position: targetPos }
          : p
      );

      const updatedRes = targetInXI.id.startsWith('slot_empty_')
        ? reserves.filter((p) => p.id !== sourceId)
        : reserves.map((p) =>
            p.id === sourceId
              ? { ...targetInXI, coord: undefined, position: targetInXI.defaultPosition }
              : p
          );

      setStartingXI(updatedXI);
      setReserves(updatedRes);
      triggerAutoSave(updatedXI, substitutes, updatedRes, formation, playstyle);
      showToast(`Substituted ${sourceInRes.name} into squad`);
      return;
    }

    // Case 4: Subbing from Pitch to Bench
    if (sourceInXI && targetInSub) {
      const sourceCoord = sourceInXI.coord;
      const sourcePos = sourceInXI.position;

      const updatedXI = startingXI.map((p) =>
        p.id === sourceId
          ? { ...targetInSub, coord: sourceCoord, position: sourcePos }
          : p
      );

      const updatedSubs = substitutes.map((p) =>
        p.id === targetId
          ? { ...sourceInXI, coord: undefined, position: sourceInXI.defaultPosition }
          : p
      );

      setStartingXI(updatedXI);
      setSubstitutes(updatedSubs);
      triggerAutoSave(updatedXI, updatedSubs, reserves, formation, playstyle);
      showToast(`Substituted ${targetInSub.name} in for ${sourceInXI.name}`);
      return;
    }

    // Case 5: Subbing from Pitch to Reserves
    if (sourceInXI && targetInRes) {
      const sourceCoord = sourceInXI.coord;
      const sourcePos = sourceInXI.position;

      const updatedXI = startingXI.map((p) =>
        p.id === sourceId
          ? { ...targetInRes, coord: sourceCoord, position: sourcePos }
          : p
      );

      const updatedRes = reserves.map((p) =>
        p.id === targetId
          ? { ...sourceInXI, coord: undefined, position: sourceInXI.defaultPosition }
          : p
      );

      setStartingXI(updatedXI);
      setReserves(updatedRes);
      triggerAutoSave(updatedXI, substitutes, updatedRes, formation, playstyle);
      showToast(`Substituted ${targetInRes.name} in for ${sourceInXI.name}`);
    }
  };

  // Direct substitution from drawer into first available outfield player of matching position
  const handleSubDirectly = (playerToSubIn: Player) => {
    if (!isCoach) {
      showToast('Permission Denied: Only Head Coach can make substitutions.');
      return;
    }

    // Find best target to replace
    const target = startingXI.find((p) => p.position === playerToSubIn.position) || startingXI[1];
    if (target) {
      handleSwapPlayers(playerToSubIn.id, target.id);
    }
  };

  // Substitute & Reserve Player Drag Engine onto Pitch
  const [subDragPlayer, setSubDragPlayer] = useState<Player | null>(null);
  const [subDragPos, setSubDragPos] = useState<{ x: number; y: number } | null>(null);
  const [subTargetPlayerId, setSubTargetPlayerId] = useState<string | null>(null);
  const subDragStartRef = useRef<{ clientX: number; clientY: number; player: Player; moved: boolean } | null>(null);

  const handleSubPointerDragStart = (e: React.PointerEvent, player: Player) => {
    if (!isCoach) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    subDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      player,
      moved: false,
    };
  };

  const handleSubTouchDragStart = (e: React.TouchEvent, player: Player) => {
    if (!isCoach) return;
    const touch = e.touches[0];
    if (!touch) return;

    subDragStartRef.current = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      player,
      moved: false,
    };
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!subDragStartRef.current) return;

      const start = subDragStartRef.current;
      if (!start.moved) {
        const dist = Math.hypot(clientX - start.clientX, clientY - start.clientY);
        if (dist > 6) {
          start.moved = true;
          setSubDragPlayer(start.player);
        }
      }

      if (start.moved) {
        setSubDragPos({ x: clientX, y: clientY });

        // Direct hit-test using elementsFromPoint
        const elements = document.elementsFromPoint(clientX, clientY);
        let targetId: string | null = null;
        for (const el of elements) {
          const pId = el.getAttribute('data-player-id');
          if (pId) {
            targetId = pId;
            break;
          }
        }

        // Proximity snap for pitch player cards if near within 80px
        if (!targetId) {
          let closestDist = 80;
          for (const p of startingXI) {
            const el = document.querySelector(`[data-player-id="${p.id}"]`);
            if (el) {
              const rect = el.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const dist = Math.hypot(centerX - clientX, centerY - clientY);
              if (dist < closestDist) {
                closestDist = dist;
                targetId = p.id;
              }
            }
          }
        }

        setSubTargetPlayerId(targetId);
      }
    };

    const handleEnd = () => {
      if (subDragStartRef.current) {
        const { player, moved } = subDragStartRef.current;
        if (moved && subTargetPlayerId) {
          handleSwapPlayers(player.id, subTargetPlayerId);
        }
      }
      subDragStartRef.current = null;
      setSubDragPlayer(null);
      setSubDragPos(null);
      setSubTargetPlayerId(null);
    };

    const onPointerMove = (e: PointerEvent) => handleMove(e.clientX, e.clientY);
    const onPointerUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        if (subDragStartRef.current?.moved && e.cancelable) {
          e.preventDefault();
        }
        handleMove(touch.clientX, touch.clientY);
      }
    };
    const onTouchEnd = () => handleEnd();

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [subTargetPlayerId, startingXI, handleSwapPlayers]);

  // Move player coordinate on pitch in real time & auto-save
  const handleMovePlayer = (playerId: string, coord: { x: number; y: number }) => {
    if (!isCoach) return;
    const updatedXI = startingXI.map((p) => (p.id === playerId ? { ...p, coord } : p));
    setStartingXI(updatedXI);
    triggerAutoSave(updatedXI, substitutes, reserves, formation, playstyle);
  };

  // Change Tactical Formation (Coach only)
  const handleSelectFormation = (newFormation: FormationType) => {
    if (!isCoach) {
      showToast('Permission Denied: Only Head Coach can change tactical formations.');
      return;
    }

    setFormation(newFormation);
    const formationTemplate = FORMATIONS[newFormation];
    if (!formationTemplate) return;

    // Apply template coordinates to current starting XI
    const updatedXI = startingXI.map((player, idx) => {
      const templateSlot = formationTemplate.coords[idx];
      if (templateSlot) {
        return {
          ...player,
          position: templateSlot.position,
          coord: { x: templateSlot.x, y: templateSlot.y },
        };
      }
      return player;
    });

    setStartingXI(updatedXI);
    triggerAutoSave(updatedXI, substitutes, reserves, newFormation, playstyle);
    showToast(`Formation updated to ${newFormation}`);
  };

  // Set Captain (Coach only)
  const handleSetCaptain = (playerId: string) => {
    if (!isCoach) {
      showToast('Permission Denied: Only Head Coach can appoint or change the Team Captain.');
      return;
    }

    const updatedXI = startingXI.map((p) => ({
      ...p,
      isCaptain: p.id === playerId,
    }));

    setStartingXI(updatedXI);
    triggerAutoSave(updatedXI, substitutes, reserves, formation, playstyle);
    const player = startingXI.find((p) => p.id === playerId);
    showToast(`${player?.name || 'Player'} is now Team Captain`);
  };

  // Auto-pick players (Coach only)
  const handleAutoPick = () => {
    if (!isCoach) {
      showToast('Permission Denied: Only Head Coach can auto-optimize the squad.');
      return;
    }

    const allPlayers = [...startingXI, ...substitutes, ...reserves];
    allPlayers.sort((a, b) => b.rating - a.rating);

    const gk = allPlayers.find((p) => p.defaultPosition === 'GK') || allPlayers[0];
    const outfield = allPlayers.filter((p) => p.id !== gk.id);

    const newStartingOutfield = outfield.slice(0, 10);
    const newStartingXI = [gk, ...newStartingOutfield];
    const newSubs = outfield.slice(10, 17);
    const newReserves = outfield.slice(17);

    const currentCoords = FORMATIONS[formation].coords;
    const formattedXI = newStartingXI.map((p, idx) => {
      const slot = currentCoords[idx] || currentCoords[0];
      return {
        ...p,
        position: slot.position,
        coord: { x: slot.x, y: slot.y },
      };
    });

    setStartingXI(formattedXI);
    setSubstitutes(newSubs);
    setReserves(newReserves);
    triggerAutoSave(formattedXI, newSubs, newReserves, formation, playstyle);
    showToast('Squad auto-optimized for highest Collective Strength!');
  };

  // Handle upload crest
  const handleUploadCrest = async (file: File) => {
    try {
      const newUrl = await uploadTeamCrest(teamId, file);
      if (newUrl) {
        setCustomCrest(newUrl);
        triggerAutoSave(startingXI, substitutes, reserves, formation, playstyle, inMatchRoles, manager, newUrl);
        showToast('Team logo updated successfully!');
      }
    } catch {
      showToast('Logo updated in local session.');
    }
  };

  // Handle upload coach photo
  const handleUploadCoachPhoto = async (file: File) => {
    const url = URL.createObjectURL(file);
    const updatedMgr = { ...manager, photoUrl: url };
    setManager(updatedMgr);
    triggerAutoSave(startingXI, substitutes, reserves, formation, playstyle, inMatchRoles, updatedMgr, customCrest);
    showToast('Coach photo updated');
  };

  // Handle update manager info
  const handleUpdateManager = (updated: Partial<Manager>) => {
    const updatedMgr = { ...manager, ...updated };
    setManager(updatedMgr);
    triggerAutoSave(startingXI, substitutes, reserves, formation, playstyle, inMatchRoles, updatedMgr, customCrest);
    showToast('Coach profile updated');
  };

  // Handle select sample crest
  const handleSelectSampleCrest = (url: string) => {
    setCustomCrest(url);
    triggerAutoSave(startingXI, substitutes, reserves, formation, playstyle, inMatchRoles, manager, url);
    showToast('Team crest updated');
  };

  // Handle update in-match roles
  const handleUpdateInMatchRoles = (roles: InMatchRoles) => {
    setInMatchRoles(roles);
    triggerAutoSave(startingXI, substitutes, reserves, formation, playstyle, roles, manager, customCrest);
    showToast('In-match roles saved');
  };

  return (
    <LandscapeGuard>
      {/* Container with generous side padding to protect all side dock icons and collective strength */}
      <main
        className="relative w-full h-full overflow-hidden bg-efootball-pattern flex items-stretch px-2 sm:px-6 select-none"
        style={{ overscrollBehavior: 'none' }}
      >
        {/* Abstract Curved Glowing Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-[10%] -top-[20%] w-[55%] h-[90%] rounded-full bg-gradient-to-br from-[#0c2269]/40 to-transparent blur-3xl" />
          <div className="absolute right-0 top-0 bottom-0 w-[42%] bg-gradient-to-l from-[#061545]/80 via-[#071954]/50 to-transparent" />
        </div>

        {/* 1. Left Dock Sidebar (Spaced from edge) */}
        <Sidebar
          manager={manager}
          captain={currentCaptain}
          currentRole={currentRole}
          teamName={currentTeam.name}
          teamCrest={currentTeam.crestUrl}
          onOpenManager={() => setActiveModal('manager')}
          onOpenTeam={() => setActiveModal('team')}
          onOpenRoles={() => setActiveModal('team')}
          onOpenSubstitutes={() =>
            setActiveModal(activeModal === 'substitutes' ? 'none' : 'substitutes')
          }
          onOpenReserves={() =>
            setActiveModal(activeModal === 'reserves' ? 'none' : 'reserves')
          }
          activeDrawer={activeModal}
          onBack={onNavigateBack}
        />

        {/* 2. Center Pitch Component with Turf Green Background & 0s Drag Tracking */}
        <Pitch
          players={startingXI}
          formation={formation}
          playstyle={playstyle}
          onSwapPlayers={handleSwapPlayers}
          onMovePlayer={handleMovePlayer}
          onOpenFormationModal={() => setActiveModal('formation')}
          onOpenPlaystyleModal={() => setActiveModal('playstyle')}
          isCoach={isCoach}
          externalSwapTargetId={subTargetPlayerId}
        />

        {/* 3. Right Panel (Collective Strength + Auto-pick with safe mobile bounds) */}
        <RightPanel
          collectiveStrength={collectiveStrength}
          onAutoPick={handleAutoPick}
          onSubmitLineup={async () => {
            if (onSaveMatchLineup) {
              await onSaveMatchLineup(activeFixtureId, startingXI, substitutes, formation, currentCaptain?.id);
            } else {
              await saveTeamTacticsAndSquad(teamId, {
                startingXI,
                substitutes,
                reserves,
                formation,
                playstyle,
              });
              showToast('Official Matchday Lineup committed to database!');
            }
          }}
          isCoach={isCoach}
          onPermissionDenied={handlePermissionDenied}
        />

        {/* 4. Substitutes & Reserves Sliding Drawer */}
        <SubstitutesDrawer
          isOpen={activeModal === 'substitutes' || activeModal === 'reserves'}
          title={activeModal === 'reserves' ? 'Reserves Squad' : 'Substitutes Bench'}
          onClose={() => setActiveModal('none')}
          substitutes={activeModal === 'reserves' ? reserves : substitutes}
          onDragStart={(e, player) => {
            e.dataTransfer.setData('text/plain', player.id);
          }}
          onTouchDragStart={handleSubTouchDragStart}
          onPointerDragStart={handleSubPointerDragStart}
          onSwapWithPitch={handleSwapPlayers}
          onSubDirectly={handleSubDirectly}
        />

        {/* 5. Head Coach Detail Modal (Coach Photo, Phone, Email, License) */}
        <ManagerModal
          isOpen={activeModal === 'manager'}
          onClose={() => setActiveModal('none')}
          manager={manager}
          onUploadCoachPhoto={handleUploadCoachPhoto}
          onUpdateManager={handleUpdateManager}
          isCoach={isCoach}
          onPermissionDenied={handlePermissionDenied}
        />

        {/* 6. Team Modal (Upload Crest, Sample Crests, In-Match Roles, Formation & Playstyle) */}
        <TeamModal
          isOpen={activeModal === 'team' || activeModal === 'formation' || activeModal === 'playstyle'}
          onClose={() => setActiveModal('none')}
          collectiveStrength={collectiveStrength}
          players={startingXI}
          teamName={currentTeam.name}
          teamCrest={currentTeam.crestUrl}
          currentTeamId={currentTeamId}
          teamsList={Object.values(TEAMS_DATA)}
          onSelectTeam={handleSelectTeam}
          onSetCaptain={handleSetCaptain}
          inMatchRoles={inMatchRoles}
          onUpdateInMatchRoles={handleUpdateInMatchRoles}
          onUploadCrest={handleUploadCrest}
          onSelectSampleCrest={handleSelectSampleCrest}
          formation={formation}
          playstyle={playstyle}
          onSelectFormation={handleSelectFormation}
          onSelectPlaystyle={(p) => {
            if (!isCoach) {
              showToast('Permission Denied: Only Head Coach can change team tactical playstyle.');
              return;
            }
            setPlaystyle(p);
            triggerAutoSave(startingXI, substitutes, reserves, formation, p, inMatchRoles, manager, customCrest);
            showToast(`Team Playstyle changed to ${p}`);
          }}
          onAutoPick={handleAutoPick}
          isCoach={isCoach}
          onPermissionDenied={handlePermissionDenied}
        />

        {/* Toast Feedback Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0085ff]/90 border border-white/40 text-white px-5 py-2 rounded-full text-[13px] font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
            {toastMessage}
          </div>
        )}

        {/* Floating Substitute Dragged Card (Snaps completely over target pitch player) */}
        {subDragPlayer && subDragPos && (() => {
          let renderX = subDragPos.x;
          let renderY = subDragPos.y;
          let hasSnapped = false;

          if (subTargetPlayerId) {
            const targetEl = document.querySelector(`[data-player-id="${subTargetPlayerId}"]`);
            if (targetEl) {
              const rect = targetEl.getBoundingClientRect();
              renderX = rect.left + rect.width / 2;
              renderY = rect.top + rect.height / 2;
              hasSnapped = true;
            }
          }

          return (
            <div
              className="fixed pointer-events-none z-[100] card-dragging-glow"
              style={{
                left: `${renderX}px`,
                top: `${renderY}px`,
                transform: 'translate(-50%, -50%) scale(1.14)',
                transition: hasSnapped
                  ? 'left 0.12s ease-out, top 0.12s ease-out, transform 0.12s ease-out'
                  : 'none',
              }}
            >
              <PlayerCard
                player={subDragPlayer}
                size="md"
                isDragging={true}
              />
            </div>
          );
        })()}
      </main>
    </LandscapeGuard>
  );
};

export default TeamSquadView;

