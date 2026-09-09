import React, { useState, useEffect, useRef } from 'react';
import { 
  Player, 
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
import { saveTeamTacticsAndSquad, uploadTeamCrest } from '../../lib/supabaseClient';

interface TeamSquadViewProps {
  currentRole?: 'COACH' | 'CAPTAIN' | 'PLAYER' | 'GUEST' | string;
  teamId?: string;
  roster?: any[];
  teamName?: string;
  teamCrest?: string;
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
  activeFixtureId,
  onNavigateBack,
  onShowToast,
  onSaveMatchLineup,
}) => {
  const isCoach = currentRole === 'COACH';
  const initialTeam = TEAMS_DATA['man_united'];

  // Map real database roster to pitch player models if available
  const dbMappedSquad = React.useMemo(() => {
    if (roster && roster.length > 0) {
      const template = FORMATIONS['4-3-3'];
      const mapped: Player[] = roster.map((p, idx) => {
        let pos: any = 'CMF';
        if (p.position === 'GK') pos = 'GK';
        else if (p.position === 'DF') pos = idx % 2 === 0 ? 'CB' : 'LB';
        else if (p.position === 'FW') pos = idx % 2 === 0 ? 'CF' : 'RWF';

        return {
          id: p.id,
          name: p.name,
          number: p.number || idx + 1,
          position: pos,
          defaultPosition: pos,
          rating: p.rating || 78,
          photoUrl: p.cardImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          flagUrl: 'https://flagcdn.com/w80/ke.png',
          clubLogoUrl: teamCrest || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
          cardTheme: p.rating >= 85 ? 'epic' : p.rating >= 80 ? 'gold' : 'blue',
          isCaptain: idx === 0,
        };
      });

      const xi = mapped.slice(0, 11).map((player, idx) => {
        const slot = template.coords[idx] || { x: 50, y: 50, position: 'CMF' };
        return {
          ...player,
          position: slot.position as any,
          coord: { x: slot.x, y: slot.y },
        };
      });

      return {
        startingXI: xi,
        substitutes: mapped.slice(11, 18),
        reserves: mapped.slice(18),
        manager: {
          name: 'Coach Marcus',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          proficiencies: {
            'Possession Game': 85,
            'Quick Counter': 80,
            'Long Ball Counter': 75,
            'Out Wide': 70,
            'Long Ball': 65,
          },
        },
      };
    }
    return null;
  }, [roster, teamCrest]);

  const CACHE_KEY = `esn_squad_tactics_${teamId}`;

  // Read local storage cache for instant restore without resetting to default on reload
  const cachedData = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, [CACHE_KEY]);

  const [currentTeamId, setCurrentTeamId] = useState<string>(cachedData?.teamId || (dbMappedSquad ? 'egerton_fc' : 'man_united'));

  const [startingXI, setStartingXI] = useState<Player[]>(() => {
    if (cachedData?.startingXI && cachedData.startingXI.length === 11) return cachedData.startingXI;
    return dbMappedSquad ? dbMappedSquad.startingXI : initialTeam.startingXI;
  });
  const [substitutes, setSubstitutes] = useState<Player[]>(() => {
    if (cachedData?.substitutes) return cachedData.substitutes;
    return dbMappedSquad ? dbMappedSquad.substitutes : initialTeam.substitutes.slice(0, 7);
  });
  const [reserves, setReserves] = useState<Player[]>(() => {
    if (cachedData?.reserves) return cachedData.reserves;
    return dbMappedSquad ? dbMappedSquad.reserves : initialTeam.substitutes.slice(7);
  });
  const [manager, setManager] = useState<Manager>(() => {
    if (cachedData?.manager) return cachedData.manager;
    return dbMappedSquad ? dbMappedSquad.manager : initialTeam.manager;
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

  // Preserve local cache on reload - only fall back to default template if no cache exists
  React.useEffect(() => {
    if (cachedData) return;
    if (dbMappedSquad) {
      setStartingXI(dbMappedSquad.startingXI);
      setSubstitutes(dbMappedSquad.substitutes);
      setReserves(dbMappedSquad.reserves);
      setManager(dbMappedSquad.manager);
    }
  }, [dbMappedSquad, cachedData]);

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
    name: teamName || (dbMappedSquad ? 'Egerton FC First Team' : initialTeam.name),
    shortName: 'EFC',
    crestUrl: customCrest || teamCrest || (dbMappedSquad ? 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80' : initialTeam.crestUrl),
    formation,
    playstyle,
    manager,
    startingXI,
    substitutes,
  };
  const currentCaptain = startingXI.find((p) => p.isCaptain) || startingXI[0];

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

      const updatedSubs = substitutes.map((p) =>
        p.id === sourceId
          ? { ...targetInXI, coord: undefined, position: targetInXI.defaultPosition }
          : p
      );

      setStartingXI(updatedXI);
      setSubstitutes(updatedSubs);
      triggerAutoSave(updatedXI, updatedSubs, reserves, formation, playstyle);
      showToast(`Substituted ${sourceInSub.name} in for ${targetInXI.name}`);
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

      const updatedRes = reserves.map((p) =>
        p.id === sourceId
          ? { ...targetInXI, coord: undefined, position: targetInXI.defaultPosition }
          : p
      );

      setStartingXI(updatedXI);
      setReserves(updatedRes);
      triggerAutoSave(updatedXI, substitutes, updatedRes, formation, playstyle);
      showToast(`Substituted ${sourceInRes.name} in for ${targetInXI.name}`);
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
      </main>
    </LandscapeGuard>
  );
};

export default TeamSquadView;

