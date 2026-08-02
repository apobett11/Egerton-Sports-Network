import React from 'react';
import { Player, UserRole } from '../types';
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
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-16">
      {/* REGISTERED PLAYER DIRECTORY HEADER */}
      <section className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl p-5 md:p-6 shadow-xl space-y-2">
        <h1 className="text-lg md:text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-emerald-400 shrink-0" />
          <span>Official Egerton FC Player Directory</span>
        </h1>
        <p className="text-xs text-gray-400">
          Registered team player list, medical availability, jersey numbers, and player profile records.
        </p>
      </section>

      {/* PLAYER DIRECTORY LIST */}
      <section className="space-y-4">
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
