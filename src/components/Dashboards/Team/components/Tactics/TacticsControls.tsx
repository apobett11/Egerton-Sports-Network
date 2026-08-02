import React, { useState } from 'react';
import { Sparkles, Sliders, ChevronDown, UserCheck, Check, Save, ShieldCheck, Users, UserPlus, ArrowRightLeft } from 'lucide-react';
import type { UserRole, Player } from '../../types';

interface TacticsControlsProps {
  collectiveRating: number;
  collectiveStrength: number;
  formation: string;
  setFormation: (f: string) => void;
  activePlaystyle: string;
  setActivePlaystyle: (p: string) => void;
  playstyleSliders: {
    attackingDepth: number;
    defensiveLine: number;
    teamWidth: number;
    pressingIntensity: number;
    buildUpStyle: string;
  };
  setPlaystyleSliders: React.Dispatch<React.SetStateAction<{
    attackingDepth: number;
    defensiveLine: number;
    teamWidth: number;
    pressingIntensity: number;
    buildUpStyle: string;
  }>>;
  startingXILength: number;
  handleSaveSquadDraft: () => void;
  handleSubmitMatchSquad: () => void;
  showToast: (msg: string) => void;
  currentRole?: UserRole;
  onSaveFormation?: () => void;
  onSaveSquad?: () => void;
  onOpenRolesModal?: () => void;
  activeSquadType?: 'NEXT_GAME' | 'DEFAULT';
  setActiveSquadType?: (type: 'NEXT_GAME' | 'DEFAULT') => void;
  roster?: Player[];
  startingXI?: number[];
  selectedPitchSlot?: number | null;
  onSwapPlayer?: (benchRosterIdx: number) => void;
  onOpenInviteModal?: () => void;
}

export const TacticsControls: React.FC<TacticsControlsProps> = ({
  collectiveRating,
  collectiveStrength,
  formation,
  setFormation,
  activePlaystyle,
  setActivePlaystyle,
  playstyleSliders,
  setPlaystyleSliders,
  startingXILength,
  handleSaveSquadDraft,
  handleSubmitMatchSquad,
  showToast,
  currentRole = 'COACH',
  onSaveFormation,
  onSaveSquad,
  onOpenRolesModal,
  activeSquadType = 'NEXT_GAME',
  setActiveSquadType,
  roster = [],
  startingXI = [],
  selectedPitchSlot = null,
  onSwapPlayer,
  onOpenInviteModal,
}) => {
  const isCoach = currentRole === 'COACH';
  const isCaptain = currentRole === 'CAPTAIN';

  // Side-by-side tab switch state: Coach defaults to SUBS; Captain defaults to TACTICS
  const [activeTab, setActiveTab] = useState<'SUBS' | 'TACTICS'>(isCoach ? 'SUBS' : 'TACTICS');

  const defaultSquadHeading = "Egerton FC Default Squad";
  const nextGameSquadHeading = "Egerton FC vs Engineering FC Squad";
  const currentHeading = activeSquadType === 'DEFAULT' ? defaultSquadHeading : nextGameSquadHeading;

  // Filter bench players from full roster
  const benchPlayersWithIdx = roster
    .map((player, idx) => ({ player, idx }))
    .filter(({ idx }) => !startingXI.includes(idx));

  return (
    <div className="flex flex-col gap-4">
      {/* SQUAD CONTEXT & SELECTION HEADER CARD */}
      <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <div className="space-y-1">
            {isCoach && setActiveSquadType && (
              <div className="flex items-center gap-2 mb-1.5">
                <button
                  onClick={() => setActiveSquadType('NEXT_GAME')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeSquadType === 'NEXT_GAME'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-[#111111] text-gray-400 border border-[#2A2A2A] hover:text-white'
                  }`}
                >
                  Next Game Squad
                </button>
                <button
                  onClick={() => setActiveSquadType('DEFAULT')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeSquadType === 'DEFAULT'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-[#111111] text-gray-400 border border-[#2A2A2A] hover:text-white'
                  }`}
                >
                  Default Squad
                </button>
              </div>
            )}

            <h2 className="text-xs md:text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{currentHeading}</span>
            </h2>
            <p className="text-[11px] text-gray-400">
              {isCoach
                ? `Coach Mode: Managing ${activeSquadType === 'DEFAULT' ? 'Permanent Baseline Squad' : 'Match Fixture Lineup & Bench'}`
                : 'Captain Mode: Tactical Layout & In-Match Execution'}
            </p>
          </div>

          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-1 rounded shrink-0">
            {startingXILength}/11 XI
          </span>
        </div>

        {/* Coach Squad Save Controls */}
        {isCoach && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                if (onSaveSquad) onSaveSquad();
                else handleSaveSquadDraft();
                showToast(
                  activeSquadType === 'DEFAULT'
                    ? 'Saved Egerton FC Default Squad successfully'
                    : 'Saved Egerton FC vs Engineering FC Squad successfully'
                );
              }}
              className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors min-h-[40px] cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{activeSquadType === 'DEFAULT' ? 'Save Default Squad' : 'Save Next-Game Squad'}</span>
            </button>

            {activeSquadType === 'NEXT_GAME' && (
              <button
                onClick={handleSubmitMatchSquad}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors min-h-[40px] cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Submit Match Squad</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* SIDE-BY-SIDE TOGGLE BUTTONS FOR COACH & CAPTAIN */}
      <div className="grid grid-cols-2 gap-2 bg-[#111111] p-1.5 rounded-xl border border-[#2A2A2A]">
        <button
          onClick={() => setActiveTab('SUBS')}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] ${
            activeTab === 'SUBS'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1F1F1F]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Substitutes ({benchPlayersWithIdx.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TACTICS')}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] ${
            activeTab === 'TACTICS'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1F1F1F]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Team Info & Tactics</span>
        </button>
      </div>

      {/* TAB 1: SUBSTITUTES LIST VIEW (DEFAULT FOR COACH) */}
      {activeTab === 'SUBS' && (
        <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2.5">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Match Substitutes Bench</span>
              </h3>
              <p className="text-[11px] text-gray-400">
                {isCoach
                  ? 'Coach Control: View subs, swap players onto pitch, or add registered players.'
                  : 'Captain View: Match Substitutes List'}
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
              {benchPlayersWithIdx.length} BENCH
            </span>
          </div>

          {/* Swap Indicator Banner */}
          {selectedPitchSlot !== null && isCoach && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 font-semibold flex items-center justify-between">
              <span>
                👉 Pitch Node #{selectedPitchSlot + 1} selected ({roster[startingXI[selectedPitchSlot]]?.name || 'Starter'}). Tap a sub to swap!
              </span>
            </div>
          )}

          {/* Bench Players List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {benchPlayersWithIdx.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No substitutes on the bench.</p>
            ) : (
              benchPlayersWithIdx.map(({ player, idx }) => (
                <div
                  key={player.id}
                  onClick={() => {
                    if (isCoach && onSwapPlayer && selectedPitchSlot !== null) {
                      onSwapPlayer(idx);
                    }
                  }}
                  className={`p-3 rounded-xl bg-[#111111] border border-[#2A2A2A] hover:border-emerald-500/50 transition-all flex items-center justify-between gap-3 ${
                    isCoach && selectedPitchSlot !== null ? 'cursor-pointer ring-2 ring-emerald-500/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#1F1F1F] border border-[#2A2A2A] overflow-hidden shrink-0">
                      <img src={player.cardImage} alt={player.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs md:text-sm font-semibold text-gray-100 truncate">
                        {player.name} (#{player.number})
                      </div>
                      <div className="text-[11px] font-medium text-gray-400">
                        {player.position} • Fit: {player.stamina}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs md:text-sm font-bold text-white">
                      {player.rating} OVR
                    </span>
                    {isCoach && selectedPitchSlot !== null && (
                      <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Button: Add Substitutes from Side Players (Coach Only) */}
          {isCoach && (
            <button
              onClick={() => {
                if (onOpenInviteModal) onOpenInviteModal();
                else showToast('Opening player registry to add substitutes...');
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[44px] mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Substitutes from Registered Players</span>
            </button>
          )}
        </div>
      )}

      {/* TAB 2: TEAM INFO & TACTICS VIEW (DEFAULT FOR CAPTAIN) */}
      {activeTab === 'TACTICS' && (
        <>
          <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <div>
                <h3 className="text-sm md:text-base font-semibold tracking-wide text-gray-100">
                  Team Collective Rating
                </h3>
                <p className="text-[11px] md:text-xs font-medium text-gray-400">
                  Starting XI power metrics
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-base md:text-lg font-bold text-white flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{collectiveRating} OVR</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  STR: {collectiveStrength}
                </span>
              </div>
            </div>

            {/* Formation Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs md:text-sm font-semibold text-gray-300">
                  Starting Formation
                </label>
                {/* Save Formation ONLY rendered for Captain */}
                {isCaptain && (
                  <button
                    onClick={() => {
                      if (onSaveFormation) onSaveFormation();
                      else showToast(`Saved Formation: ${formation}`);
                    }}
                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/30 flex items-center gap-1 transition-colors min-h-[36px] cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save Formation</span>
                  </button>
                )}
              </div>

              {/* Coach view is read-only badge; Captain can change presets */}
              {isCaptain ? (
                <div className="grid grid-cols-3 gap-2">
                  {['4-4-1-1', '4-3-3', '4-2-3-1'].map(f => (
                    <button
                      key={f}
                      onClick={() => {
                        setFormation(f);
                        showToast(`Applied formation preset: ${f}`);
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all min-h-[44px] cursor-pointer ${
                        formation === f
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                          : 'bg-[#111111] border-[#2A2A2A] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A] flex items-center justify-between">
                  <span className="text-xs text-gray-400">Current Formation (Set by Captain):</span>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/30">
                    {formation}
                  </span>
                </div>
              )}
            </div>

            {/* Tactical Philosophy */}
            <div>
              <label className="text-xs md:text-sm font-semibold text-gray-300 block mb-1.5">
                Primary Tactical Philosophy
              </label>
              <select
                disabled={!isCaptain}
                value={activePlaystyle}
                onChange={e => {
                  setActivePlaystyle(e.target.value);
                  showToast(`Tactical philosophy updated to ${e.target.value}`);
                }}
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <option value="Quick Counter">⚡ Quick Counter</option>
                <option value="Possession Game">⚽ Possession Game</option>
                <option value="Out Wide">Out Wide</option>
                <option value="Long Ball Counter">🚀 Long Ball Counter</option>
              </select>
            </div>

            {/* In Match Roles Modal Trigger Button */}
            {onOpenRolesModal && (
              <button
                onClick={onOpenRolesModal}
                className="w-full py-2.5 px-3 bg-[#111111] hover:bg-[#252525] text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>In-Match Roles ({isCaptain ? 'Edit' : 'View'})</span>
              </button>
            )}
          </div>

          <details className="group border border-[#2A2A2A] rounded-xl bg-[#1F1F1F] overflow-hidden">
            <summary className="px-4 py-3.5 cursor-pointer font-semibold text-sm md:text-base text-gray-100 flex items-center justify-between min-h-[44px] hover:bg-[#252525] transition-colors select-none">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Advanced Playstyle Parameters</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>

            <div className="p-4 border-t border-[#2A2A2A] space-y-4 bg-[#181818]">
              <div>
                <div className="flex justify-between text-xs md:text-sm font-normal text-gray-300 mb-1">
                  <span>Attacking Depth</span>
                  <span className="font-mono text-white font-bold">{playstyleSliders.attackingDepth}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  disabled={!isCaptain}
                  value={playstyleSliders.attackingDepth}
                  onChange={e =>
                    setPlaystyleSliders(prev => ({ ...prev, attackingDepth: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px] disabled:opacity-50"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs md:text-sm font-normal text-gray-300 mb-1">
                  <span>Defensive Line Height</span>
                  <span className="font-mono text-white font-bold">{playstyleSliders.defensiveLine}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  disabled={!isCaptain}
                  value={playstyleSliders.defensiveLine}
                  onChange={e =>
                    setPlaystyleSliders(prev => ({ ...prev, defensiveLine: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px] disabled:opacity-50"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs md:text-sm font-normal text-gray-300 mb-1">
                  <span>Team Support Width</span>
                  <span className="font-mono text-white font-bold">{playstyleSliders.teamWidth}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  disabled={!isCaptain}
                  value={playstyleSliders.teamWidth}
                  onChange={e =>
                    setPlaystyleSliders(prev => ({ ...prev, teamWidth: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px] disabled:opacity-50"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs md:text-sm font-normal text-gray-300 mb-1">
                  <span>Pressing Intensity</span>
                  <span className="font-mono text-white font-bold">{playstyleSliders.pressingIntensity}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  disabled={!isCaptain}
                  value={playstyleSliders.pressingIntensity}
                  onChange={e =>
                    setPlaystyleSliders(prev => ({ ...prev, pressingIntensity: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px] disabled:opacity-50"
                />
              </div>
            </div>
          </details>
        </>
      )}
    </div>
  );
};

export default TacticsControls;
