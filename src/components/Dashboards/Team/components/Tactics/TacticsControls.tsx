import React, { useState } from 'react';
import {
  Sliders,
  ChevronDown,
  ShieldCheck,
  Users,
  Save,
  ArrowRightLeft,
  Crown,
  Briefcase,
  AlertTriangle,
  Flame,
  Maximize2,
  MoveUp,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import type { UserRole, Player, FormationName, TacticalSliders } from '../../types';

interface TacticsControlsProps {
  collectiveRating: number;
  collectiveStrength: number;
  formation: FormationName;
  setFormation: (f: FormationName) => void;
  playstyleSliders: TacticalSliders;
  setPlaystyleSliders: React.Dispatch<React.SetStateAction<TacticalSliders>>;
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
}

const ALL_FORMATIONS: FormationName[] = [
  '4-3-3 Attack',
  '4-3-3 Defend',
  '4-4-2 Flat',
  '4-4-2 Diamond',
  '4-2-3-1 Wide',
  '4-1-4-1',
  '3-5-2',
  '3-4-3',
  '5-3-2',
  '5-4-1',
  '4-4-1-1',
];

export const TacticsControls: React.FC<TacticsControlsProps> = ({
  collectiveRating,
  collectiveStrength,
  formation,
  setFormation,
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
}) => {
  const isCoach = currentRole === 'COACH';
  const isCaptain = currentRole === 'CAPTAIN';

  const [activeTab, setActiveTab] = useState<'TACTICS' | 'SUBS'>('TACTICS');
  const [showImpendingWarning, setShowImpendingWarning] = useState<boolean>(false);

  // Bench players from full roster
  const benchPlayersWithIdx = roster
    .map((player, idx) => ({ player, idx }))
    .filter(({ idx }) => !startingXI.includes(idx));

  const handleSliderChange = (key: keyof TacticalSliders, value: number) => {
    setPlaystyleSliders((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleOutWidePreset = () => {
    setPlaystyleSliders((prev) => ({
      ...prev,
      teamSupportWidth: 85,
      attackingDepth: 70,
    }));
    showToast('Intelligently expanded team width for Out-Wide play');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. SQUAD TYPE SELECTOR (IMPENDING MATCH VS PERMANENT DEFAULT) */}
      <div className="bg-[#161B22] border border-[#2A3441] rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#2A3441] pb-3">
          <div className="space-y-1">
            {setActiveSquadType && (
              <div className="flex items-center gap-2 mb-1.5">
                <button
                  onClick={() => {
                    setActiveSquadType('NEXT_GAME');
                    setShowImpendingWarning(true);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSquadType === 'NEXT_GAME'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40'
                      : 'bg-[#0D1117] text-slate-400 border border-[#2A3441] hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  <span>Next Match Squad (Temporary)</span>
                </button>

                <button
                  onClick={() => setActiveSquadType('DEFAULT')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSquadType === 'DEFAULT'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/40'
                      : 'bg-[#0D1117] text-slate-400 border border-[#2A3441] hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                  <span>Default Base Squad</span>
                </button>
              </div>
            )}

            <h2 className="text-sm md:text-base font-black text-white tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {activeSquadType === 'NEXT_GAME'
                  ? 'Impending Match Lineup (Egerton vs Engineering XI)'
                  : 'Permanent Default Squad (Teams Table)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {activeSquadType === 'NEXT_GAME'
                ? 'Temporary tactical squad for the upcoming game. Reverts to default afterwards.'
                : 'Permanent baseline squad written to database first 11 & substitutes strings.'}
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Team Rating</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{collectiveRating}</span>
          </div>
        </div>

        {/* Impending Notice Banner */}
        {activeSquadType === 'NEXT_GAME' && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 font-bold">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Only applies to next matchday fixture!</span>
            </span>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-amber-500/20 rounded-md">
              Temp Match Mode
            </span>
          </div>
        )}
      </div>

      {/* 2. TAB SWITCHER: TACTICAL CONTROLS (CAPTAIN/COACH) VS SUBSTITUTIONS BENCH */}
      <div className="flex items-center p-1 rounded-2xl bg-[#161B22] border border-[#2A3441]">
        <button
          onClick={() => setActiveTab('TACTICS')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'TACTICS'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Captain's Tactical Sliders & Formations</span>
        </button>

        <button
          onClick={() => setActiveTab('SUBS')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'SUBS'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Bench & Substitutions ({benchPlayersWithIdx.length})</span>
        </button>
      </div>

      {/* TAB 1: TACTICAL SLIDERS & FORMATIONS */}
      {activeTab === 'TACTICS' && (
        <div className="bg-[#161B22] border border-[#2A3441] rounded-2xl p-5 shadow-xl space-y-5">
          {/* FORMATION SELECTOR DROPDOWN */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Formation Structure</span>
              <span className="text-emerald-400 font-mono font-bold">11 Formations Available</span>
            </label>
            <div className="relative">
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value as FormationName)}
                className="w-full p-3 rounded-xl bg-[#0D1117] border border-[#2A3441] text-white font-extrabold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
              >
                {ALL_FORMATIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* TACTICAL SLIDERS (ATTACKING DEPTH, DEFENSIVE LINE, SUPPORT WIDTH, PRESSING) */}
          <div className="space-y-4 pt-2 border-t border-[#2A3441]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>On-Pitch Dynamic Tactical Modifiers</span>
              </h3>
              <button
                onClick={handleOutWidePreset}
                className="text-[10px] font-black text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg cursor-pointer transition-colors"
              >
                Out Wide Preset ⚡
              </button>
            </div>

            {/* SLIDER 1: ATTACKING DEPTH */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <MoveUp className="w-3.5 h-3.5 text-emerald-400" />
                  Attacking Depth
                </span>
                <span className="font-mono font-black text-emerald-400">{playstyleSliders.attackingDepth}</span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                value={playstyleSliders.attackingDepth}
                onChange={(e) => handleSliderChange('attackingDepth', Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                <span>Direct Penetration</span>
                <span>Deep Forward Push</span>
              </div>
            </div>

            {/* SLIDER 2: DEFENSIVE LINE HEIGHT */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Defensive Line Height
                </span>
                <span className="font-mono font-black text-blue-400">{playstyleSliders.defensiveLineHeight}</span>
              </div>
              <input
                type="range"
                min="20"
                max="85"
                value={playstyleSliders.defensiveLineHeight}
                onChange={(e) => handleSliderChange('defensiveLineHeight', Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                <span>Low Block</span>
                <span>High Defensive Line</span>
              </div>
            </div>

            {/* SLIDER 3: TEAM SUPPORT WIDTH / OUT WIDE */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  Team Support Width (Out Wide)
                </span>
                <span className="font-mono font-black text-amber-400">{playstyleSliders.teamSupportWidth}</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                value={playstyleSliders.teamSupportWidth}
                onChange={(e) => handleSliderChange('teamSupportWidth', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                <span>Narrow Central Channel</span>
                <span>Wide Flank Overlaps</span>
              </div>
            </div>

            {/* SLIDER 4: PRESSING INTENSITY */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Pressing Intensity
                </span>
                <span className="font-mono font-black text-rose-400">{playstyleSliders.pressingIntensity}</span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                value={playstyleSliders.pressingIntensity}
                onChange={(e) => handleSliderChange('pressingIntensity', Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                <span>Zonal Caution</span>
                <span>Gegenpressing Squeeze</span>
              </div>
            </div>
          </div>

          {/* PROMINENT ACTION BUTTONS (CAPTAIN SET PIECES & PROMISCUOUS SAVE SQUAD) */}
          <div className="space-y-3 pt-3 border-t border-[#2A3441]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={onOpenRolesModal}
                className="px-4 py-3 rounded-2xl bg-[#0D1117] hover:bg-slate-800 text-white font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#2A3441] shadow-md hover:border-amber-400/50"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Set Piece Roles</span>
              </button>

              <button
                onClick={onSaveFormation}
                className="px-4 py-3 rounded-2xl bg-[#0D1117] hover:bg-slate-800 text-white font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#2A3441] shadow-md hover:border-blue-400/50"
              >
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Save Formation & Sliders</span>
              </button>
            </div>

            {/* HIGH-PROMINENCE MASTER SQUAD COMMIT BUTTON */}
            <button
              onClick={() => {
                if (onSaveSquad) onSaveSquad();
                else handleSubmitMatchSquad();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 text-white font-black text-sm shadow-2xl shadow-emerald-950/80 ring-2 ring-emerald-400/80 hover:ring-emerald-300 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 transform hover:-translate-y-0.5"
            >
              <Save className="w-5 h-5 text-white" />
              <span>
                {activeSquadType === 'DEFAULT' ? 'SAVE DEFAULT BASE SQUAD TO DATABASE' : 'COMMIT IMPENDING MATCH SQUAD (TEMPORARY)'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSTITUTIONS BENCH CARDS */}
      {activeTab === 'SUBS' && (
        <div className="bg-[#161B22] border border-[#2A3441] rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#2A3441] pb-2">
            <h3 className="text-xs font-black uppercase text-slate-300">
              Bench Reserves ({benchPlayersWithIdx.length} Available)
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {selectedPitchSlot !== null
                ? `Select bench player to swap with slot #${selectedPitchSlot + 1}`
                : 'Click a pitch node first to swap'}
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {benchPlayersWithIdx.map(({ player, idx }) => (
              <div
                key={player.id}
                className="p-3 rounded-xl bg-[#0D1117] border border-[#2A3441] hover:border-emerald-500/50 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                    <img src={player.cardImage} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-white truncate flex items-center gap-1.5">
                      <span>{player.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">#{player.number}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span className="font-bold text-blue-400">{player.position}</span>
                      <span>•</span>
                      <span>Rating: {player.rating}</span>
                      <span>•</span>
                      <span className="text-emerald-400">{player.status}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onSwapPlayer) onSwapPlayer(idx);
                  }}
                  disabled={selectedPitchSlot === null}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Swap In</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
