import React from 'react';
import { Player, UserRole } from '../types';
import { KitsSection } from './Kits/KitsSection';
import { RosterListView } from './Roster/RosterListView';
import { Save, Check, Lock, Users } from 'lucide-react';

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
  onSaveFormation: () => void;
}

export const SquadPage: React.FC<SquadPageProps> = ({
  roster,
  setRoster,
  startingXI,
  setStartingXI,
  currentRole,
  showToast,
  formation,
  setFormation,
  activePlaystyle,
  setActivePlaystyle,
  onOpenInviteModal,
  onUpdatePlayerStatus,
  onUploadPlayerImage,
  onSaveSquad,
  onSaveFormation,
}) => {
  const isCoach = currentRole === 'COACH';

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto pb-16">
      {/* TASK 9: KITS PAGE / SECTION AT TOP */}
      <KitsSection />

      {/* TASK 7: SQUAD MANAGEMENT (COACH ONLY EDITING, CAPTAIN VIEW ONLY) */}
      <section className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A2A] pb-3">
          <div>
            <h2 className="text-base md:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Squad & Lineup Management</span>
            </h2>
            <p className="text-xs text-gray-400">
              {isCoach
                ? 'Coach Control: Manage First 11, Bench, Formations & Roles'
                : 'Captain Mode: Squad Roster (View Only)'}
            </p>
          </div>

          {isCoach ? (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={onSaveFormation}
                className="px-3.5 py-2 bg-[#111111] hover:bg-[#252525] text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 min-h-[44px] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Formation</span>
              </button>
              <button
                onClick={onSaveSquad}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 min-h-[44px] cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Squad</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-[#111111] px-3 py-2 rounded-xl border border-[#2A2A2A]">
              <Lock className="w-4 h-4" />
              <span>Squad View Only</span>
            </div>
          )}
        </div>

        {/* TASK 7 REQUIREMENT DISPLAY NOTE */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-400 leading-relaxed">
          💡 This squad applies only to the current fixture and automatically reverts to the default squad before the next fixture.
        </div>
      </section>

      {/* TASK 10: PLAYER LIST BELOW KITS SECTION */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
          Team Player List
        </h2>
        <RosterListView
          searchTerm=""
          setSearchTerm={() => {}}
          positionFilter="ALL"
          setPositionFilter={() => {}}
          currentRole={currentRole}
          onOpenInviteModal={onOpenInviteModal}
          filteredRoster={roster}
          startingXI={startingXI}
          roster={roster}
          onUpdatePlayerStatus={onUpdatePlayerStatus}
          onUploadPlayerImage={onUploadPlayerImage}
        />
      </section>
    </div>
  );
};

export default SquadPage;
