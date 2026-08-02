import React from 'react';
import { Player, UserRole } from '../types';
import { KitsSection } from './Kits/KitsSection';
import { RosterListView } from './Roster/RosterListView';
import { Users } from 'lucide-react';

interface SquadPageProps {
  roster: Player[];
  setRoster: React.Dispatch<React.SetStateAction<Player[]>>;
  startingXI: number[];
  setStartingXI: React.Dispatch<React.SetStateAction<number[]>>;
  currentRole: UserRole;
  showToast: (msg: string) => void;
  formation: string;
  setFormation: (form: string) => void;
  activePlaystyle: string;
  setActivePlaystyle: (style: string) => void;
  onOpenInviteModal: () => void;
  onUpdatePlayerStatus: (playerId: string, status: 'Active' | 'Injured' | 'Suspended') => void;
  onUploadPlayerImage: (playerId: string, imageUrl: string) => void;
  onSaveSquad: () => void;
  onSaveFormation?: () => void;
}

export const SquadPage: React.FC<SquadPageProps> = ({
  roster,
  currentRole,
  onOpenInviteModal,
  onUpdatePlayerStatus,
  onUploadPlayerImage,
}) => {
  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto pb-16">
      {/* JERSEYS / KITS SECTION AT TOP */}
      <KitsSection />

      {/* PLAYER DIRECTORY LIST SECTION WITH H2 */}
      <section className="space-y-4">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Team Player List</span>
        </h2>
        <RosterListView
          searchTerm=""
          setSearchTerm={() => {}}
          positionFilter="ALL"
          setPositionFilter={() => {}}
          currentRole={currentRole}
          onOpenInviteModal={onOpenInviteModal}
          filteredRoster={roster}
          startingXI={[]}
          roster={roster}
          onUpdatePlayerStatus={onUpdatePlayerStatus}
          onUploadPlayerImage={onUploadPlayerImage}
        />
      </section>
    </div>
  );
};

export default SquadPage;
