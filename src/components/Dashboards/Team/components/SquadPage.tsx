import React, { useState } from 'react';
import type { Player, UserRole, RoleAssignments } from '../types';
import { PitchCanvas } from './Tactics/PitchCanvas';
import { KitsSection } from './Kits/KitsSection';
import {
  Users,
  Shield,
  Save,
  Check,
  Lock,
  ArrowLeft,
  UserCheck,
  Shirt,
  Settings,
  Activity,
  AlertTriangle,
  Award,
  ChevronRight,
  Flame,
  Zap,
  Info,
  RotateCcw
} from 'lucide-react';

interface SquadPageProps {
  roster: Player[];
  setRoster?: React.Dispatch<React.SetStateAction<Player[]>>;
  startingXI: number[];
  setStartingXI: React.Dispatch<React.SetStateAction<number[]>>;
  currentRole: UserRole;
  showToast: (msg: string) => void;
  formation: string;
  setFormation: (form: string) => void;
  activePlaystyle: string;
  setActivePlaystyle: (style: string) => void;
  onOpenInviteModal?: () => void;
  onUpdatePlayerStatus?: (playerId: string, status: 'Active' | 'Injured' | 'Suspended') => void;
  onUploadPlayerImage?: (playerId: string, imageUrl: string) => void;
  onSaveSquad?: () => void;
  onSaveFormation?: () => void;
  roleAssignments?: RoleAssignments;
  setRoleAssignments?: React.Dispatch<React.SetStateAction<RoleAssignments>>;
  squadConfigType?: 'DEFAULT' | 'NEXT_MATCH';
  setSquadConfigType?: (type: 'DEFAULT' | 'NEXT_MATCH') => void;
}

type SideTab = 'PITCH' | 'MANAGER' | 'TEAM' | 'SUBS' | 'KITS' | 'SELECTED';

export const SquadPage: React.FC<SquadPageProps> = ({
  roster,
  startingXI,
  setStartingXI,
  currentRole,
  showToast,
  formation,
  setFormation,
  activePlaystyle,
  setActivePlaystyle,
  onUpdatePlayerStatus,
  onSaveSquad,
  onSaveFormation,
  roleAssignments,
  setRoleAssignments,
  squadConfigType = 'NEXT_MATCH',
  setSquadConfigType,
}) => {
  const isCoach = currentRole === 'COACH';
  const isCaptain = currentRole === 'CAPTAIN';

  const [activeSideTab, setActiveSideTab] = useState<SideTab>('SUBS');
  const [selectedPitchSlot, setSelectedPitchSlot] = useState<number | null>(null);
  const [selectedBenchPlayerId, setSelectedBenchPlayerId] = useState<string | null>(null);

  // Formations list
  const availableFormations = [
    '4-4-1-1',
    '4-3-3',
    '4-2-3-1',
    '4-4-2',
    '4-5-1',
    '3-5-2',
    '3-4-3',
    '5-3-2',
  ];

  // Playstyles list
  const availablePlaystyles = [
    'Quick Counter',
    'Possession Game',
    'Out Wide',
    'Long Ball Counter',
    'Park the Bus',
  ];

  // Calculate Collective Strength & Ratings
  const startingPlayers = startingXI.map((idx) => roster[idx]).filter(Boolean);
  const collectiveRating =
    startingPlayers.length > 0
      ? Math.round(startingPlayers.reduce((sum, p) => sum + p.rating, 0) / startingPlayers.length)
      : 75;
  const collectiveStrength =
    startingPlayers.reduce((sum, p) => sum + p.rating, 0) * 2 + 500;

  // Bench players (not in starting XI)
  const benchPlayers = roster.filter((_, idx) => !startingXI.includes(idx));

  // Currently selected player on pitch or bench
  const selectedPlayer =
    selectedPitchSlot !== null
      ? roster[startingXI[selectedPitchSlot]]
      : selectedBenchPlayerId
      ? roster.find((p) => p.id === selectedBenchPlayerId)
      : null;

  // Swap pitch slot with bench player index in roster
  const handleSwapWithBench = (pitchSlotIndex: number, benchRosterIndex: number) => {
    if (!isCoach) {
      showToast('Access Denied: Captain cannot execute squad substitutions.');
      return;
    }
    const benchPlayer = roster[benchRosterIndex];
    if (
      benchPlayer &&
      (benchPlayer.status === 'Injured' ||
        benchPlayer.status === 'Suspended' ||
        benchPlayer.isInjured ||
        benchPlayer.isSuspended ||
        (benchPlayer.redCards && benchPlayer.redCards > 0))
    ) {
      showToast(
        `Cannot select ${benchPlayer.name}: Player is currently ${benchPlayer.status || 'Unavailable'}.`
      );
      return;
    }

    const updatedXI = [...startingXI];
    const oldPlayerName = roster[updatedXI[pitchSlotIndex]]?.name || 'Player';
    const newPlayerName = benchPlayer?.name || 'Player';
    updatedXI[pitchSlotIndex] = benchRosterIndex;

    setStartingXI(updatedXI);
    setSelectedPitchSlot(null);
    setSelectedBenchPlayerId(null);
    showToast(`Substituted ${newPlayerName} in for ${oldPlayerName}`);
  };

  // Swap two pitch slots
  const handleSwapPitchSlots = (slotA: number, slotB: number) => {
    if (!isCoach) {
      showToast('Access Denied: Captain cannot rearrange squad positions.');
      return;
    }
    const updatedXI = [...startingXI];
    const temp = updatedXI[slotA];
    updatedXI[slotA] = updatedXI[slotB];
    updatedXI[slotB] = temp;

    setStartingXI(updatedXI);
    showToast('Swapped player positions on tactical pitch.');
  };

  // Bench Drag Start
  const handleBenchDragStart = (e: React.DragEvent, rosterIndex: number) => {
    if (!isCoach) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'BENCH', rosterIndex }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Role Assignment helper
  const handleSetPlayerRole = (roleKey: keyof RoleAssignments, playerId: string) => {
    if (!setRoleAssignments) return;
    setRoleAssignments((prev) => ({
      ...prev,
      [roleKey]: playerId,
    }));
    const p = roster.find((x) => x.id === playerId);
    showToast(`Assigned ${p?.name || 'Player'} as ${roleKey}`);
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none max-w-7xl mx-auto pb-12">
      {/* TOP STATUS BAR & MODE SELECTOR */}
      <div className="bg-[#191919] border border-[#2A2A2A] rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white uppercase tracking-wider">
                Egerton FC Squad Management
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                eFootball Engine
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {isCoach
                ? 'Coach Control: Manage Starting XI, Bench, Formations & Playstyles'
                : 'Captain Mode: Squad Overview & In-Match Role Assignments'}
            </p>
          </div>
        </div>

        {/* Squad Mode Toggle (Default vs Next Match) */}
        <div className="flex items-center bg-[#111111] p-1 rounded-xl border border-[#2A2A2A]">
          <button
            onClick={() => setSquadConfigType && setSquadConfigType('NEXT_MATCH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              squadConfigType === 'NEXT_MATCH'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Next Match Squad
          </button>
          <button
            onClick={() => setSquadConfigType && setSquadConfigType('DEFAULT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              squadConfigType === 'DEFAULT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Default Squad
          </button>
        </div>

        {/* Coach Action Buttons */}
        {isCoach ? (
          <div className="flex items-center gap-2">
            {onSaveFormation && (
              <button
                onClick={onSaveFormation}
                className="px-3 py-2 bg-[#1F1F1F] hover:bg-[#252525] text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>Save Formation</span>
              </button>
            )}
            {onSaveSquad && (
              <button
                onClick={onSaveSquad}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>Save Squad</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-[#111111] px-3 py-2 rounded-xl border border-[#2A2A2A]">
            <Lock className="w-4 h-4" />
            <span>Captain View Mode</span>
          </div>
        )}
      </div>

      {/* MAIN 3-COLUMN eFOOTBALL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: SIDE ICON NAVIGATION & SUMMARY CARDS */}
        <div className="lg:col-span-3 flex flex-col md:flex-row lg:flex-col gap-4">
          {/* Side Icon Shortcuts Bar */}
          <div className="bg-[#191919] border border-[#2A2A2A] rounded-2xl p-2 flex lg:flex-row flex-wrap justify-between items-center gap-1">
            <button
              onClick={() => setActiveSideTab('MANAGER')}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-1 justify-center min-h-[44px] cursor-pointer ${
                activeSideTab === 'MANAGER'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:bg-[#252525] hover:text-white'
              }`}
              title="Manager Panel"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline lg:hidden text-[10px]">Manager</span>
            </button>

            <button
              onClick={() => setActiveSideTab('TEAM')}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-1 justify-center min-h-[44px] cursor-pointer ${
                activeSideTab === 'TEAM'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:bg-[#252525] hover:text-white'
              }`}
              title="Team Panel"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline lg:hidden text-[10px]">Club</span>
            </button>

            <button
              onClick={() => setActiveSideTab('SUBS')}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-1 justify-center min-h-[44px] cursor-pointer ${
                activeSideTab === 'SUBS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:bg-[#252525] hover:text-white'
              }`}
              title="Substitutes Panel"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline lg:hidden text-[10px]">Bench</span>
            </button>

            <button
              onClick={() => setActiveSideTab('KITS')}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-1 justify-center min-h-[44px] cursor-pointer ${
                activeSideTab === 'KITS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:bg-[#252525] hover:text-white'
              }`}
              title="Kits Shortcuts"
            >
              <Shirt className="w-4 h-4" />
              <span className="hidden sm:inline lg:hidden text-[10px]">Kits</span>
            </button>

            <button
              onClick={() => {
                setSelectedPitchSlot(null);
                setSelectedBenchPlayerId(null);
                setActiveSideTab('SUBS');
              }}
              className="p-2.5 rounded-xl text-xs font-bold text-gray-400 hover:bg-[#252525] hover:text-white transition-all flex-1 justify-center min-h-[44px] cursor-pointer"
              title="Reset Selection"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Manager Summary Panel */}
          <div className="bg-[#191919] border border-[#2A2A2A] rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3 mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Manager Profile
                </span>
                <span className="text-[10px] font-mono text-gray-400 font-bold">LICENSED</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/40 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                    alt="Manager"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Coach Pep Guardiola</h3>
                  <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3" /> {activePlaystyle}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#2A2A2A] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-semibold">Formation</span>
                <span className="text-white font-mono font-bold">{formation}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-semibold">Team Affinity</span>
                <span className="text-emerald-400 font-mono font-bold">98 / 100</span>
              </div>
            </div>
          </div>

          {/* Team Summary Panel */}
          <div className="bg-[#191919] border border-[#2A2A2A] rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3 mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Club Status
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/40 p-1 bg-[#111111] shrink-0">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZhG6dvXVnCTj57MdspJa73P-F8qYvkI0_9IJGuRTnRHwc8G4kixfeSPzaw6Kpzrf1agcR4SzQVcmUmrbJk5sdlCe3FL8ViUpi6vOevQ2rM_XCry_Q3s_ejoAkBJ24eTcZvL0vsc9qfJnfdKqPEaDtMEBE-UW90XIpwBcKj06Pt3AQz2K0_y6ux1217HyL0tw44OZ7jGDbwkIn4XUsGHS04JKiSJ-E7sKC3e7bqltCB7L7MwXX1KeyB3cB9GgAonsdpktmZK2HkJgN"
                    alt="Egerton FC Crest"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Egerton FC</h3>
                  <div className="text-xs text-gray-400 font-semibold mt-0.5">
                    Premier League Division
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#2A2A2A] grid grid-cols-2 gap-2">
              <div className="bg-[#111111] p-2 rounded-xl border border-[#2A2A2A] text-center">
                <div className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">
                  Strength
                </div>
                <div className="text-sm font-mono font-extrabold text-amber-400 mt-0.5">
                  {collectiveStrength}
                </div>
              </div>
              <div className="bg-[#111111] p-2 rounded-xl border border-[#2A2A2A] text-center">
                <div className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">
                  Avg OVR
                </div>
                <div className="text-sm font-mono font-extrabold text-emerald-400 mt-0.5">
                  {collectiveRating}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: FOOTBALL PITCH CANVAS */}
        <div className="lg:col-span-5 bg-[#191919] border border-[#2A2A2A] rounded-2xl p-3 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                Pitch Lineup ({formation})
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">
              {isCoach ? 'Drag or tap to swap' : 'View Mode'}
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <PitchCanvas
              formation={formation}
              startingXI={startingXI}
              roster={roster}
              selectedPitchSlot={selectedPitchSlot}
              setSelectedPitchSlot={(slot) => {
                setSelectedPitchSlot(slot);
                if (slot !== null) {
                  setSelectedBenchPlayerId(null);
                  setActiveSideTab('SELECTED');
                }
              }}
              onSwapPitchSlots={handleSwapPitchSlots}
              onSwapWithBench={handleSwapWithBench}
              isCoach={isCoach}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONTEXTUAL SIDE PANEL */}
        <div className="lg:col-span-4 bg-[#191919] border border-[#2A2A2A] rounded-2xl p-4 shadow-xl flex flex-col min-h-[500px]">
          {/* TAB 1: SUBSTITUTES BENCH PANEL */}
          {activeSideTab === 'SUBS' && (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" /> Substitutes ({benchPlayers.length})
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {isCoach ? 'Drag player onto pitch or tap to inspect' : 'Bench Overview'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[520px]">
                {benchPlayers.map((player) => {
                  const rosterIndex = roster.findIndex((p) => p.id === player.id);
                  const isSelected = selectedBenchPlayerId === player.id;
                  const isUnavailable =
                    player.status === 'Injured' ||
                    player.status === 'Suspended' ||
                    player.isInjured ||
                    player.isSuspended ||
                    (player.redCards && player.redCards > 0);

                  return (
                    <div
                      key={player.id}
                      draggable={isCoach && !isUnavailable}
                      onDragStart={(e) => handleBenchDragStart(e, rosterIndex)}
                      onClick={() => {
                        setSelectedBenchPlayerId(player.id);
                        if (selectedPitchSlot !== null && isCoach && !isUnavailable) {
                          handleSwapWithBench(selectedPitchSlot, rosterIndex);
                        } else {
                          setActiveSideTab('SELECTED');
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                          : isUnavailable
                          ? 'bg-rose-950/20 border-rose-500/40 opacity-80'
                          : 'bg-[#111111] border-[#2A2A2A] hover:border-emerald-500/50 hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2A2A2A] shrink-0 relative">
                          <img
                            src={player.cardImage}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-white truncate max-w-[120px]">
                              {player.name}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-gray-400">
                              #{player.number}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 font-semibold">
                            <span className="text-emerald-400 font-bold">{player.position}</span>
                            <span>•</span>
                            <span>OVR {player.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUnavailable ? (
                          <span className="px-2 py-0.5 bg-rose-950 border border-rose-500/40 text-rose-400 text-[9px] font-bold rounded-md uppercase">
                            {player.status || 'Unavailable'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold rounded-md uppercase">
                            Fit
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MANAGER CONTROLS PANEL */}
          {activeSideTab === 'MANAGER' && (
            <div className="flex flex-col h-full space-y-4">
              <div className="border-b border-[#2A2A2A] pb-3">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" /> Manager Tactics & Formations
                </h3>
                <p className="text-[11px] text-gray-400">
                  {isCoach
                    ? 'Adjust playstyle, default formation & team tactics'
                    : 'Tactical Briefing (Read Only)'}
                </p>
              </div>

              {/* Formation Selector */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">
                  Formation
                </label>
                {isCoach ? (
                  <select
                    value={formation}
                    onChange={(e) => setFormation(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] text-white text-xs font-bold rounded-xl p-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {availableFormations.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-[#111111] border border-[#2A2A2A] rounded-xl text-xs font-bold text-white">
                    {formation}
                  </div>
                )}
              </div>

              {/* Playstyle Selector */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">
                  Team Playstyle
                </label>
                {isCoach ? (
                  <div className="space-y-1.5">
                    {availablePlaystyles.map((style) => (
                      <button
                        key={style}
                        onClick={() => setActivePlaystyle(style)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between min-h-[44px] cursor-pointer ${
                          activePlaystyle === style
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                            : 'bg-[#111111] border-[#2A2A2A] text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>{style}</span>
                        {activePlaystyle === style && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#111111] border border-[#2A2A2A] rounded-xl text-xs font-bold text-emerald-400">
                    {activePlaystyle}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TEAM & GAME PLAN PANEL */}
          {activeSideTab === 'TEAM' && (
            <div className="flex flex-col h-full space-y-4">
              <div className="border-b border-[#2A2A2A] pb-3">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Game Plan & Match Support
                </h3>
                <p className="text-[11px] text-gray-400">
                  Configure match roles, squad numbers & base team settings
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-[#111111] border border-[#2A2A2A] rounded-xl flex items-center justify-between text-xs font-bold text-gray-300">
                  <span>In-Match Roles</span>
                  <span className="text-emerald-400 font-mono">Configured</span>
                </div>
                <div className="p-3 bg-[#111111] border border-[#2A2A2A] rounded-xl flex items-center justify-between text-xs font-bold text-gray-300">
                  <span>Automatic Match Support</span>
                  <span className="text-emerald-400 font-mono">On</span>
                </div>
                <div className="p-3 bg-[#111111] border border-[#2A2A2A] rounded-xl flex items-center justify-between text-xs font-bold text-gray-300">
                  <span>Squad Numbers</span>
                  <span className="text-gray-400 font-mono">Auto-assigned</span>
                </div>
                <div className="p-3 bg-[#111111] border border-[#2A2A2A] rounded-xl flex items-center justify-between text-xs font-bold text-gray-300">
                  <span>Base Team Settings</span>
                  <span className="text-gray-400 font-mono">Egerton FC</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SELECTED PLAYER PANEL */}
          {activeSideTab === 'SELECTED' && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" /> Selected Player Details
                </h3>
                <button
                  onClick={() => setActiveSideTab('SUBS')}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {selectedPlayer ? (
                <div className="space-y-4">
                  <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 shrink-0">
                      <img
                        src={selectedPlayer.cardImage}
                        alt={selectedPlayer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white leading-tight">
                        {selectedPlayer.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          {selectedPlayer.position}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          OVR {selectedPlayer.rating}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-400">
                          #{selectedPlayer.number}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Athletic Stats Breakdown */}
                  <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                      <div className="text-[9px] text-gray-400 font-bold uppercase">SPD</div>
                      <div className="font-mono font-extrabold text-white mt-0.5">
                        {selectedPlayer.speed}
                      </div>
                    </div>
                    <div className="p-2 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                      <div className="text-[9px] text-gray-400 font-bold uppercase">SHO</div>
                      <div className="font-mono font-extrabold text-white mt-0.5">
                        {selectedPlayer.shooting}
                      </div>
                    </div>
                    <div className="p-2 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                      <div className="text-[9px] text-gray-400 font-bold uppercase">PAS</div>
                      <div className="font-mono font-extrabold text-white mt-0.5">
                        {selectedPlayer.passing}
                      </div>
                    </div>
                    <div className="p-2 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                      <div className="text-[9px] text-gray-400 font-bold uppercase">DRI</div>
                      <div className="font-mono font-extrabold text-white mt-0.5">
                        {selectedPlayer.dribbling}
                      </div>
                    </div>
                    <div className="p-2 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                      <div className="text-[9px] text-gray-400 font-bold uppercase">DEF</div>
                      <div className="font-mono font-extrabold text-white mt-0.5">
                        {selectedPlayer.defense}
                      </div>
                    </div>
                    <div className="p-2 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                      <div className="text-[9px] text-gray-400 font-bold uppercase">PHY</div>
                      <div className="font-mono font-extrabold text-white mt-0.5">
                        {selectedPlayer.physical}
                      </div>
                    </div>
                  </div>

                  {/* Coach Status Modification Controls (Tasks 11, 15, 16) */}
                  {isCoach && onUpdatePlayerStatus && (
                    <div className="space-y-2 pt-2 border-t border-[#2A2A2A]">
                      <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">
                        Availability Status
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdatePlayerStatus(selectedPlayer.id, 'Active')}
                          className="flex-1 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-xl min-h-[44px] cursor-pointer"
                        >
                          End Injury / Active
                        </button>
                        <button
                          onClick={() => onUpdatePlayerStatus(selectedPlayer.id, 'Injured')}
                          className="flex-1 py-2 bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-xl min-h-[44px] cursor-pointer"
                        >
                          Mark Injured
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Captain & Coach In-Match Role Assignments (Task 12) */}
                  {roleAssignments && (
                    <div className="space-y-2 pt-2 border-t border-[#2A2A2A]">
                      <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">
                        In-Match Role Assignments
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleSetPlayerRole('captainId', selectedPlayer.id)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                            roleAssignments.captainId === selectedPlayer.id
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-[#111111] border-[#2A2A2A] text-gray-300 hover:text-white'
                          }`}
                        >
                          Set Captain
                        </button>
                        <button
                          onClick={() => handleSetPlayerRole('penaltyTakerId', selectedPlayer.id)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                            roleAssignments.penaltyTakerId === selectedPlayer.id
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-[#111111] border-[#2A2A2A] text-gray-300 hover:text-white'
                          }`}
                        >
                          Set Penalty Taker
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <Info className="w-8 h-8 text-gray-500 mb-2" />
                  <p className="text-xs font-semibold">
                    Select a player on the pitch or bench to view stats and assign roles.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: KITS SHORTCUTS PANEL */}
          {activeSideTab === 'KITS' && (
            <div className="flex flex-col h-full space-y-4">
              <div className="border-b border-[#2A2A2A] pb-3">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-emerald-400" /> Kit Shortcuts & Preview
                </h3>
                <p className="text-[11px] text-gray-400">
                  Preview Home, Away, and Third team uniforms
                </p>
              </div>

              <KitsSection />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SquadPage;
