import React, { useState } from 'react';
import { Player, UserRole } from '../types';
import { RosterListView } from './Roster/RosterListView';
import { Save, Users, ShieldAlert, Check } from 'lucide-react';

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
}) => {
  const isCoach = currentRole === 'COACH';
  const [squadViewType, setSquadViewType] = useState<'DEFAULT' | 'NEXT_GAME'>('NEXT_GAME');

  const defaultSquadHeading = "Egerton FC Default Squad";
  const nextGameSquadHeading = "Egerton FC vs Engineering FC Squad";

  const currentHeading = squadViewType === 'DEFAULT' ? defaultSquadHeading : nextGameSquadHeading;

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-16">
      {/* SQUAD HEADER CARD */}
      <section className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
          <div className="space-y-1">
            {/* SQUAD TYPE SELECTOR FOR COACH */}
            {isCoach && (
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setSquadViewType('NEXT_GAME')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    squadViewType === 'NEXT_GAME'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-[#111111] text-gray-400 border border-[#2A2A2A] hover:text-white'
                  }`}
                >
                  Next Game Squad
                </button>
                <button
                  onClick={() => setSquadViewType('DEFAULT')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    squadViewType === 'DEFAULT'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-[#111111] text-gray-400 border border-[#2A2A2A] hover:text-white'
                  }`}
                >
                  Default Squad
                </button>
              </div>
            )}

            {/* TASK 9 & TASK 10 HEADINGS */}
            <h1 className="text-lg md:text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>{currentHeading}</span>
            </h1>
            <p className="text-xs text-gray-400">
              {isCoach
                ? `Coach Control: Managing ${squadViewType === 'DEFAULT' ? 'Club Master Default Squad' : 'Upcoming Match Lineup & Substitutes'}`
                : 'Captain Mode: Match Roster View (Read-Only Squad Selection)'}
            </p>
          </div>

          {/* TASK 2 & TASK 3: Coach Save Buttons vs Captain Read-Only (No Buttons Rendered) */}
          {isCoach && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => {
                  onSaveSquad();
                  showToast(
                    squadViewType === 'DEFAULT'
                      ? 'Saved Egerton FC Default Squad successfully'
                      : 'Saved Egerton FC vs Engineering FC Squad successfully'
                  );
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 min-h-[44px] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{squadViewType === 'DEFAULT' ? 'Save Default Squad' : 'Save Next-Game Squad'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Context Banner */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-400 leading-relaxed">
          {squadViewType === 'DEFAULT'
            ? '📌 Egerton FC Default Squad serves as the baseline blueprint for all upcoming fixtures.'
            : '💡 Egerton FC vs Engineering FC Squad applies exclusively to the next match fixture and automatically resets after match completion.'}
        </div>
      </section>

      {/* SQUAD PLAYER LIST SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
            {squadViewType === 'DEFAULT' ? 'Default Squad Roster' : 'Next Game Match Roster'}
          </h2>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30">
            {startingXI.length}/11 Starting XI Selected
          </span>
        </div>

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
