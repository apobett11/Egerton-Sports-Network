import React, { useState } from 'react';
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

interface TeamSquadViewProps {
  currentRole?: 'COACH' | 'CAPTAIN' | 'PLAYER' | 'GUEST' | string;
  onNavigateBack?: () => void;
  onShowToast?: (msg: string) => void;
}

export const TeamSquadView: React.FC<TeamSquadViewProps> = ({
  currentRole = 'COACH',
  onNavigateBack,
  onShowToast,
}) => {
  const isCoach = currentRole === 'COACH';
  const [currentTeamId, setCurrentTeamId] = useState<string>('man_united');
  const initialTeam = TEAMS_DATA['man_united'];

  const [startingXI, setStartingXI] = useState<Player[]>(initialTeam.startingXI);
  const [substitutes, setSubstitutes] = useState<Player[]>(initialTeam.substitutes);
  const [manager, setManager] = useState<Manager>(initialTeam.manager);
  const [formation, setFormation] = useState<FormationType>(initialTeam.formation);
  const [playstyle, setPlaystyle] = useState<Playstyle>(initialTeam.playstyle);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentTeam: TeamData = TEAMS_DATA[currentTeamId] || initialTeam;

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

  // Switch Team dynamically (Coach only)
  const handleSelectTeam = (teamId: string) => {
    if (!isCoach) {
      showToast('Permission Denied: Only Head Coach can switch team presets.');
      return;
    }

    const selectedTeam = TEAMS_DATA[teamId];
    if (!selectedTeam) return;

    setCurrentTeamId(teamId);
    setManager(selectedTeam.manager);
    setStartingXI(selectedTeam.startingXI);
    setSubstitutes(selectedTeam.substitutes);
    setFormation(selectedTeam.formation);
    setPlaystyle(selectedTeam.playstyle);

    showToast(`Switched to ${selectedTeam.name} Game Plan`);
  };

  // Collective strength calculator
  const calculateCollectiveStrength = (players: Player[]) => {
    const total = players.reduce((sum, p) => sum + p.rating * 2.65, 0);
    return Math.round(total);
  };

  const collectiveStrength = calculateCollectiveStrength(startingXI);

  // Swap two players between pitch or pitch <-> bench
  const handleSwapPlayers = (sourceId: string, targetId: string) => {
    const sourceInXI = startingXI.find((p) => p.id === sourceId);
    const targetInXI = startingXI.find((p) => p.id === targetId);

    const sourceInSub = substitutes.find((p) => p.id === sourceId);
    const targetInSub = substitutes.find((p) => p.id === targetId);

    // Case 1: Swapping two players within starting XI
    if (sourceInXI && targetInXI) {
      const sourceCoord = sourceInXI.coord;
      const targetCoord = targetInXI.coord;
      const sourcePos = sourceInXI.position;
      const targetPos = targetInXI.position;

      setStartingXI((prev) =>
        prev.map((p) => {
          if (p.id === sourceId) {
            return { ...p, coord: targetCoord, position: targetPos };
          }
          if (p.id === targetId) {
            return { ...p, coord: sourceCoord, position: sourcePos };
          }
          return p;
        })
      );
      showToast(`Swapped ${sourceInXI.name} with ${targetInXI.name}`);
      return;
    }

    // Case 2: Subbing from Bench into Pitch (Source in Subs, Target in XI)
    if (sourceInSub && targetInXI) {
      const targetCoord = targetInXI.coord;
      const targetPos = targetInXI.position;

      setStartingXI((prev) =>
        prev.map((p) =>
          p.id === targetId
            ? { ...sourceInSub, coord: targetCoord, position: targetPos }
            : p
        )
      );

      setSubstitutes((prev) =>
        prev.map((p) =>
          p.id === sourceId
            ? { ...targetInXI, coord: undefined, position: targetInXI.defaultPosition }
            : p
        )
      );

      showToast(`Substituted ${sourceInSub.name} in for ${targetInXI.name}`);
      return;
    }

    // Case 3: Subbing from Pitch to Bench (Source in XI, Target in Subs)
    if (sourceInXI && targetInSub) {
      const sourceCoord = sourceInXI.coord;
      const sourcePos = sourceInXI.position;

      setStartingXI((prev) =>
        prev.map((p) =>
          p.id === sourceId
            ? { ...targetInSub, coord: sourceCoord, position: sourcePos }
            : p
        )
      );

      setSubstitutes((prev) =>
        prev.map((p) =>
          p.id === targetId
            ? { ...sourceInXI, coord: undefined, position: sourceInXI.defaultPosition }
            : p
        )
      );

      showToast(`Substituted ${targetInSub.name} in for ${sourceInXI.name}`);
    }
  };

  // Move player coordinate on pitch
  const handleMovePlayer = (playerId: string, coord: { x: number; y: number }) => {
    setStartingXI((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, coord } : p))
    );
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
    setStartingXI((prev) => {
      return prev.map((player, idx) => {
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
    });

    showToast(`Formation updated to ${newFormation}`);
  };

  // Set Captain (Coach only)
  const handleSetCaptain = (playerId: string) => {
    if (!isCoach) {
      showToast('Permission Denied: Only Head Coach can appoint or change the Team Captain.');
      return;
    }

    setStartingXI((prev) =>
      prev.map((p) => ({
        ...p,
        isCaptain: p.id === playerId,
      }))
    );
    const player = startingXI.find((p) => p.id === playerId);
    showToast(`${player?.name || 'Player'} is now Team Captain`);
  };

  // Auto-pick players (Coach only)
  const handleAutoPick = () => {
    if (!isCoach) {
      showToast('Permission Denied: Only Head Coach can auto-optimize the squad.');
      return;
    }

    const allPlayers = [...startingXI, ...substitutes];
    allPlayers.sort((a, b) => b.rating - a.rating);

    const gk = allPlayers.find((p) => p.defaultPosition === 'GK') || allPlayers[0];
    const outfield = allPlayers.filter((p) => p.id !== gk.id);

    const newStartingOutfield = outfield.slice(0, 10);
    const newStartingXI = [gk, ...newStartingOutfield];
    const newSubs = outfield.slice(10);

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
    showToast('Squad auto-optimized for highest Collective Strength!');
  };

  return (
    <LandscapeGuard>
      <div className="relative w-full h-full min-h-[580px] lg:h-[calc(100vh-110px)] overflow-hidden bg-efootball-pattern rounded-3xl flex items-stretch select-none border border-[#1a2d54] shadow-2xl">
        {/* Abstract Curved Polygon Background Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top Left Dark Blue Arc */}
          <div className="absolute -left-[10%] -top-[20%] w-[55%] h-[90%] rounded-full bg-gradient-to-br from-[#0c2269]/40 to-transparent blur-3xl" />
          
          {/* Right Navy Ribbon Graphic */}
          <div className="absolute right-0 top-0 bottom-0 w-[42%] bg-gradient-to-l from-[#061545]/80 via-[#071954]/50 to-transparent" />
          
          {/* Curved stylized blue ribbon overlay shape on right */}
          <svg
            viewBox="0 0 400 800"
            className="absolute right-0 top-0 h-full w-[35%] opacity-35 pointer-events-none"
            preserveAspectRatio="none"
          >
            <path
              d="M 120 0 C 250 150, 400 300, 320 500 C 240 700, 50 750, 0 800 L 400 800 L 400 0 Z"
              fill="url(#ribbonGradSquad)"
            />
            <defs>
              <linearGradient id="ribbonGradSquad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0055ff" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#001a75" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#040c2e" stopOpacity="0.95" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* 1. Left Dock Sidebar */}
        <Sidebar
          manager={manager}
          teamName={currentTeam.name}
          teamCrest={currentTeam.crestUrl}
          onOpenManager={() => setActiveModal('manager')}
          onOpenTeam={() => setActiveModal('team')}
          onOpenSubstitutes={() =>
            setActiveModal(activeModal === 'substitutes' ? 'none' : 'substitutes')
          }
          onOpenReserves={() =>
            setActiveModal(activeModal === 'reserves' ? 'none' : 'reserves')
          }
          activeDrawer={activeModal}
          onBack={onNavigateBack}
        />

        {/* 2. Center Pitch Component */}
        <Pitch
          players={startingXI}
          formation={formation}
          playstyle={playstyle}
          onSwapPlayers={handleSwapPlayers}
          onMovePlayer={handleMovePlayer}
          onOpenFormationModal={() => setActiveModal('manager')}
          onOpenPlaystyleModal={() => setActiveModal('manager')}
          isCoach={isCoach}
        />

        {/* 3. Right Panel (Collective Strength + Auto-pick) */}
        <RightPanel
          collectiveStrength={collectiveStrength}
          onAutoPick={handleAutoPick}
          isCoach={isCoach}
          onPermissionDenied={handlePermissionDenied}
        />

        {/* 4. Substitutes Sliding Drawer */}
        <SubstitutesDrawer
          isOpen={activeModal === 'substitutes' || activeModal === 'reserves'}
          onClose={() => setActiveModal('none')}
          substitutes={substitutes}
          onDragStart={(e, player) => {
            e.dataTransfer.setData('text/plain', player.id);
          }}
          onSwapWithPitch={handleSwapPlayers}
        />

        {/* 5. Manager Modal */}
        <ManagerModal
          isOpen={activeModal === 'manager'}
          onClose={() => setActiveModal('none')}
          manager={manager}
          currentFormation={formation}
          currentPlaystyle={playstyle}
          onSelectFormation={handleSelectFormation}
          onSelectPlaystyle={(p) => {
            if (!isCoach) {
              showToast('Permission Denied: Only Head Coach can change team tactical playstyle.');
              return;
            }
            setPlaystyle(p);
            showToast(`Team Playstyle changed to ${p}`);
          }}
          isCoach={isCoach}
          onPermissionDenied={handlePermissionDenied}
        />

        {/* 6. Team Modal (Dynamic Club/Country selector) */}
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
          isCoach={isCoach}
          onPermissionDenied={handlePermissionDenied}
        />

        {/* Local Toast Feedback Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0085ff]/90 border border-white/40 text-white px-5 py-2 rounded-full text-[13px] font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
            {toastMessage}
          </div>
        )}
      </div>
    </LandscapeGuard>
  );
};

export default TeamSquadView;
