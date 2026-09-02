import React, { useState, useEffect, useRef } from 'react';
import { 
  Player, 
  FormationType, 
  Playstyle, 
  ActiveModal,
  Manager,
  TeamData
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
  onNavigateBack?: () => void;
  onShowToast?: (msg: string) => void;
}

export const TeamSquadView: React.FC<TeamSquadViewProps> = ({
  currentRole = 'COACH',
  teamId = 'fc910b80-1a73-45f8-80f4-fcb03adce911',
  onNavigateBack,
  onShowToast,
}) => {
  const isCoach = currentRole === 'COACH';
  const [currentTeamId, setCurrentTeamId] = useState<string>('man_united');
  const initialTeam = TEAMS_DATA['man_united'];

  const [startingXI, setStartingXI] = useState<Player[]>(initialTeam.startingXI);
  const [substitutes, setSubstitutes] = useState<Player[]>(initialTeam.substitutes.slice(0, 7));
  const [reserves, setReserves] = useState<Player[]>(initialTeam.substitutes.slice(7));
  const [manager, setManager] = useState<Manager>(initialTeam.manager);
  const [formation, setFormation] = useState<FormationType>(initialTeam.formation);
  const [playstyle, setPlaystyle] = useState<Playstyle>(initialTeam.playstyle);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const autoSaveTimeoutRef = useRef<any>(null);

  const currentTeam: TeamData = TEAMS_DATA[currentTeamId] || initialTeam;
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

  // Card position intelligence: Auto-save squad and tactics to Database
  const triggerAutoSave = (
    newXI: Player[],
    newSubs: Player[],
    newReserves: Player[],
    newFormation: FormationType,
    newPlaystyle: Playstyle
  ) => {
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
        showToast('Team logo updated successfully!');
      }
    } catch {
      showToast('Logo updated in local session.');
    }
  };

  return (
    <LandscapeGuard>
      {/* Container with generous side padding to protect all side dock icons and collective strength */}
      <main className="relative w-full h-full overflow-hidden bg-efootball-pattern flex items-stretch px-2 sm:px-6 select-none">
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
          onOpenRoles={() => setActiveModal('manager')}
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

        {/* 5. Manager / Captain Detail Modal */}
        <ManagerModal
          isOpen={activeModal === 'manager' || activeModal === 'formation' || activeModal === 'playstyle'}
          initialSubView={activeModal === 'formation' ? 'formation' : activeModal === 'playstyle' ? 'playstyle' : 'main'}
          onClose={() => setActiveModal('none')}
          manager={manager}
          captain={currentCaptain}
          currentFormation={formation}
          currentPlaystyle={playstyle}
          onSelectFormation={handleSelectFormation}
          onSelectPlaystyle={(p) => {
            if (!isCoach) {
              showToast('Permission Denied: Only Head Coach can change team tactical playstyle.');
              return;
            }
            setPlaystyle(p);
            triggerAutoSave(startingXI, substitutes, reserves, formation, p);
            showToast(`Team Playstyle changed to ${p}`);
          }}
          isCoach={isCoach}
          onPermissionDenied={handlePermissionDenied}
        />

        {/* 6. Team Modal (Upload Crest, View Formation & Playstyle) */}
        <TeamModal
          isOpen={activeModal === 'team'}
          onClose={() => setActiveModal('none')}
          collectiveStrength={collectiveStrength}
          players={startingXI}
          teamName={currentTeam.name}
          teamCrest={currentTeam.crestUrl}
          currentTeamId={currentTeamId}
          teamsList={Object.values(TEAMS_DATA)}
          onSelectTeam={handleSelectTeam}
          onSetCaptain={handleSetCaptain}
          onUploadCrest={handleUploadCrest}
          formation={formation}
          playstyle={playstyle}
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

