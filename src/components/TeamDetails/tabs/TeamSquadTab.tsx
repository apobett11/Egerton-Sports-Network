import React, { useState, useMemo } from 'react';
import {
  Crown,
  X,
  Shield,
  Target,
  CornerDownRight,
  Zap,
  Users,
  Shirt,
  Sparkles,
  ChevronDown,
  Info,
} from 'lucide-react';
import type { Player, DBTeam } from '../../Dashboards/Team/types';

interface TeamSquadTabProps {
  teamId: string;
  roster: Player[];
  teamName?: string;
  teamCrest?: string;
  team?: DBTeam | null;
  startingXIIds?: string[];
  onNavigateBack?: () => void;
}

type FormationKey = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2';

interface FormationSlot {
  slotId: number;
  position: string;
  category: 'GK' | 'DF' | 'MD' | 'FW';
  x: number; // 0 to 100% horizontal
  y: number; // 0 to 100% vertical (0 top forward, 100 bottom goalkeeper)
}

const FORMATIONS: Record<FormationKey, { name: string; slots: FormationSlot[] }> = {
  '4-3-3': {
    name: '4-3-3 Attack',
    slots: [
      { slotId: 0, position: 'GK', category: 'GK', x: 50, y: 89 },
      { slotId: 1, position: 'LB', category: 'DF', x: 18, y: 72 },
      { slotId: 2, position: 'CB', category: 'DF', x: 38, y: 74 },
      { slotId: 3, position: 'CB', category: 'DF', x: 62, y: 74 },
      { slotId: 4, position: 'RB', category: 'DF', x: 82, y: 72 },
      { slotId: 5, position: 'LCM', category: 'MD', x: 28, y: 47 },
      { slotId: 6, position: 'DM', category: 'MD', x: 50, y: 55 },
      { slotId: 7, position: 'RCM', category: 'MD', x: 72, y: 47 },
      { slotId: 8, position: 'LW', category: 'FW', x: 22, y: 20 },
      { slotId: 9, position: 'CF', category: 'FW', x: 50, y: 13 },
      { slotId: 10, position: 'RW', category: 'FW', x: 78, y: 20 },
    ],
  },
  '4-4-2': {
    name: '4-4-2 Classic',
    slots: [
      { slotId: 0, position: 'GK', category: 'GK', x: 50, y: 89 },
      { slotId: 1, position: 'LB', category: 'DF', x: 18, y: 72 },
      { slotId: 2, position: 'CB', category: 'DF', x: 38, y: 74 },
      { slotId: 3, position: 'CB', category: 'DF', x: 62, y: 74 },
      { slotId: 4, position: 'RB', category: 'DF', x: 82, y: 72 },
      { slotId: 5, position: 'LM', category: 'MD', x: 18, y: 47 },
      { slotId: 6, position: 'CM', category: 'MD', x: 40, y: 49 },
      { slotId: 7, position: 'CM', category: 'MD', x: 60, y: 49 },
      { slotId: 8, position: 'RM', category: 'MD', x: 82, y: 47 },
      { slotId: 9, position: 'CF', category: 'FW', x: 38, y: 15 },
      { slotId: 10, position: 'CF', category: 'FW', x: 62, y: 15 },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1 Modern',
    slots: [
      { slotId: 0, position: 'GK', category: 'GK', x: 50, y: 89 },
      { slotId: 1, position: 'LB', category: 'DF', x: 18, y: 72 },
      { slotId: 2, position: 'CB', category: 'DF', x: 38, y: 74 },
      { slotId: 3, position: 'CB', category: 'DF', x: 62, y: 74 },
      { slotId: 4, position: 'RB', category: 'DF', x: 82, y: 72 },
      { slotId: 5, position: 'DM', category: 'MD', x: 38, y: 57 },
      { slotId: 6, position: 'DM', category: 'MD', x: 62, y: 57 },
      { slotId: 7, position: 'LAM', category: 'MD', x: 24, y: 34 },
      { slotId: 8, position: 'CAM', category: 'MD', x: 50, y: 31 },
      { slotId: 9, position: 'RAM', category: 'MD', x: 76, y: 34 },
      { slotId: 10, position: 'CF', category: 'FW', x: 50, y: 13 },
    ],
  },
  '3-5-2': {
    name: '3-5-2 Attacking',
    slots: [
      { slotId: 0, position: 'GK', category: 'GK', x: 50, y: 89 },
      { slotId: 1, position: 'CB', category: 'DF', x: 28, y: 74 },
      { slotId: 2, position: 'CB', category: 'DF', x: 50, y: 76 },
      { slotId: 3, position: 'CB', category: 'DF', x: 72, y: 74 },
      { slotId: 4, position: 'LWB', category: 'MD', x: 15, y: 48 },
      { slotId: 5, position: 'CM', category: 'MD', x: 36, y: 51 },
      { slotId: 6, position: 'DM', category: 'MD', x: 50, y: 59 },
      { slotId: 7, position: 'CM', category: 'MD', x: 64, y: 51 },
      { slotId: 8, position: 'RWB', category: 'MD', x: 85, y: 48 },
      { slotId: 9, position: 'CF', category: 'FW', x: 38, y: 15 },
      { slotId: 10, position: 'CF', category: 'FW', x: 62, y: 15 },
    ],
  },
};

const getPositionBadgeColor = (category: string) => {
  switch (category) {
    case 'GK':
      return 'bg-amber-500 text-white';
    case 'DF':
      return 'bg-blue-600 text-white';
    case 'MD':
      return 'bg-emerald-600 text-white';
    case 'FW':
      return 'bg-[#ff0046] text-white';
    default:
      return 'bg-slate-600 text-white';
  }
};

export const TeamSquadTab: React.FC<TeamSquadTabProps> = ({
  teamId: _teamId,
  roster = [],
  teamName = 'Team',
  teamCrest,
  team,
  startingXIIds,
  onNavigateBack: _onNavigateBack,
}) => {
  // Selected formation (persisted in team tactics_config or default)
  const [selectedFormation, setSelectedFormation] = useState<FormationKey>('4-3-3');
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<Player | null>(null);

  // Derive Starting XI (11 players)
  const startingXI = useMemo(() => {
    if (startingXIIds && startingXIIds.length > 0) {
      const matched = startingXIIds
        .map((id) => roster.find((p) => p.id === id))
        .filter((p): p is Player => p !== undefined);
      if (matched.length === 11) return matched;
    }
    // Fallback: order by GK, DF, MD, FW
    const gks = roster.filter((p) => p.position === 'GK');
    const dfs = roster.filter((p) => p.position === 'DF');
    const mds = roster.filter((p) => p.position === 'MD');
    const fws = roster.filter((p) => p.position === 'FW');

    const ordered = [...gks.slice(0, 1), ...dfs.slice(0, 4), ...mds.slice(0, 3), ...fws.slice(0, 3)];
    if (ordered.length >= 11) return ordered.slice(0, 11);
    return roster.slice(0, 11);
  }, [roster, startingXIIds]);

  // Derive Substitutes (bench) & Reserves
  const startingXIIdSet = useMemo(() => new Set(startingXI.map((p) => p.id)), [startingXI]);
  const benchPlayers = useMemo(
    () => roster.filter((p) => !startingXIIdSet.has(p.id)),
    [roster, startingXIIdSet]
  );
  const substitutes = useMemo(() => benchPlayers.slice(0, 7), [benchPlayers]);
  const reserves = useMemo(() => benchPlayers.slice(7), [benchPlayers]);

  // Identify Team Captain
  const captain = useMemo(() => {
    if (team?.captain_id) {
      const match = roster.find((p) => p.id === team.captain_id);
      if (match) return match;
    }
    return startingXI[0] || roster[0] || null;
  }, [team, roster, startingXI]);

  // In-match set piece assignments
  const inMatchRoles = useMemo(() => {
    const defaultCorner = startingXI.find((p) => p.position === 'MD' && p.id !== captain?.id) || startingXI[1] || captain;
    const defaultRightFK = startingXI.find((p) => p.position === 'FW' && p.id !== captain?.id) || startingXI[2] || captain;
    const defaultLeftFK = startingXI.find((p) => p.position === 'MD' && p.id !== captain?.id && p.id !== defaultCorner?.id) || startingXI[3] || captain;
    const defaultPenalty = startingXI.find((p) => p.position === 'FW') || captain || startingXI[0];

    return [
      {
        id: 'captain',
        label: 'Team Captain',
        desc: 'Primary matchday leadership and referee consultation',
        icon: Crown,
        iconColor: 'text-amber-400',
        bgGlow: 'bg-amber-500/10 border-amber-500/30',
        player: captain,
      },
      {
        id: 'penalty',
        label: 'Penalty Taker',
        desc: 'Designated 1st choice spot-kick taker',
        icon: Zap,
        iconColor: 'text-rose-400',
        bgGlow: 'bg-rose-500/10 border-rose-500/30',
        player: defaultPenalty,
      },
      {
        id: 'corner',
        label: 'Corner Specialist',
        desc: 'Left & right corner set-piece delivery',
        icon: CornerDownRight,
        iconColor: 'text-blue-400',
        bgGlow: 'bg-blue-500/10 border-blue-500/30',
        player: defaultCorner,
      },
      {
        id: 'rightFK',
        label: 'Right Free-Kick Taker',
        desc: 'Direct shots and crosses from the right wing',
        icon: Target,
        iconColor: 'text-emerald-400',
        bgGlow: 'bg-emerald-500/10 border-emerald-500/30',
        player: defaultRightFK,
      },
      {
        id: 'leftFK',
        label: 'Left Free-Kick Taker',
        desc: 'Direct curling shots and crosses from the left wing',
        icon: Target,
        iconColor: 'text-cyan-400',
        bgGlow: 'bg-cyan-500/10 border-cyan-500/30',
        player: defaultLeftFK,
      },
    ];
  }, [startingXI, captain]);

  // Current formation slots
  const activeSlots = FORMATIONS[selectedFormation]?.slots || FORMATIONS['4-3-3'].slots;

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none animate-in fade-in duration-150">
      {/* 1. TOP TACTICAL CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] p-3.5 sm:p-4 rounded-none sm:rounded-sm shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#00b04f]/10 text-[#00b04f] flex items-center justify-center shrink-0">
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {teamName} Tactical Squad
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#00b04f] text-white">
                Active XI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Upright tactical pitch simulation & athlete lineup
            </p>
          </div>
        </div>

        {/* Action Controls: Formation Switcher & In-Match Roles Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Formation Dropdown */}
          <div className="relative">
            <select
              value={selectedFormation}
              onChange={(e) => setSelectedFormation(e.target.value as FormationKey)}
              aria-label="Select tactical formation"
              className="appearance-none bg-slate-100 dark:bg-[#14263b] border border-slate-200 dark:border-[#1a2e45] text-slate-900 dark:text-white text-xs font-black px-3 py-1.5 pr-7 rounded-md cursor-pointer hover:bg-slate-200 dark:hover:bg-[#1f3a5a] transition-colors"
            >
              <option value="4-3-3">4-3-3 Attack</option>
              <option value="4-4-2">4-4-2 Classic</option>
              <option value="4-2-3-1">4-2-3-1 Modern</option>
              <option value="3-5-2">3-5-2 Wingbacks</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* IN-MATCH ROLES POPUP TRIGGER BUTTON */}
          <button
            type="button"
            onClick={() => setIsRolesModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-2xs"
          >
            <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>In-Match Roles</span>
          </button>
        </div>
      </div>

      {/* 2. UPRIGHT TACTICAL PITCH SIMULATION (PHONE UPRIGHT PORTRAIT VIEW) */}
      <div className="relative w-full max-w-lg mx-auto aspect-[3/4.2] sm:aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-[#0a3e23] bg-gradient-to-b from-[#13683a] via-[#105d33] to-[#0c4e2a] select-none">
        {/* Pitch Mowing Grass Stripes */}
        <div className="absolute inset-0 flex flex-col pointer-events-none opacity-25">
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${i % 2 === 0 ? 'bg-black/25' : 'bg-transparent'}`}
            />
          ))}
        </div>

        {/* Pitch Outer Perimeter White Line */}
        <div className="absolute inset-3 sm:inset-4 border-2 border-white/50 rounded-lg pointer-events-none" />

        {/* Halfway Line & Center Circle */}
        <div className="absolute top-1/2 left-3 right-3 sm:left-4 sm:right-4 h-0.5 bg-white/50 pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 border-2 border-white/50 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white/70 rounded-full pointer-events-none" />

        {/* Top Penalty Box (Opponent End) */}
        <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-20 sm:h-24 border-2 border-t-0 border-white/50 pointer-events-none" />
        <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-8 sm:h-10 border-2 border-t-0 border-white/50 pointer-events-none" />
        <div className="absolute top-18 sm:top-22 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/70 rounded-full pointer-events-none" />

        {/* Bottom Penalty Box (Our Goal End) */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-20 sm:h-24 border-2 border-b-0 border-white/50 pointer-events-none" />
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-8 sm:h-10 border-2 border-b-0 border-white/50 pointer-events-none" />
        <div className="absolute bottom-18 sm:bottom-22 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/70 rounded-full pointer-events-none" />

        {/* 11 STARTING PLAYERS SIMULATION PITCH TOKENS */}
        {activeSlots.map((slot, index) => {
          const player = startingXI[index] || {
            id: `slot_${slot.slotId}`,
            name: `Player ${slot.slotId + 1}`,
            number: slot.slotId + 1,
            position: slot.category as any,
            rating: 78,
          };

          const isCap = captain?.id === player.id;
          const posBadgeColor = getPositionBadgeColor(slot.category);

          return (
            <div
              key={slot.slotId}
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
              }}
              onClick={() => setSelectedPlayerModal(player)}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group transition-transform duration-150 hover:scale-110 active:scale-95 z-20"
            >
              {/* Player Avatar Token */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 bg-slate-900/90 shadow-xl overflow-hidden border-2 transition-colors ${
                    isCap
                      ? 'border-amber-400 ring-2 ring-amber-400/40'
                      : 'border-white/80 group-hover:border-[#ff0046]'
                  }`}
                >
                  <img
                    src={
                      player.cardImage ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                    }
                    alt={player.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                {/* Jersey Number Tag */}
                <div className="absolute -top-1 -left-1.5 w-4 h-4 rounded-full bg-black/85 text-white font-mono text-[9px] font-black flex items-center justify-center border border-white/30 shadow-xs">
                  {player.number}
                </div>

                {/* Captain Crown Indicator */}
                {isCap && (
                  <div className="absolute -top-2 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center shadow-xs border border-white">
                    <Crown className="w-2.5 h-2.5 fill-current" />
                  </div>
                )}
              </div>

              {/* Player Name Pill */}
              <div className="mt-1 flex flex-col items-center">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-white bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded-full truncate max-w-[70px] sm:max-w-[85px] shadow-sm text-center border border-white/10">
                  {player.name.split(' ').pop()}
                </span>
                {/* Position Badge & Rating */}
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded-xs shadow-2xs ${posBadgeColor}`}>
                    {slot.position}
                  </span>
                  {player.rating && (
                    <span className="text-[8px] font-mono font-bold text-amber-300 bg-black/70 px-1 py-0.2 rounded-xs">
                      {player.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. ROSTER LISTS BELOW PITCH: STARTING XI, SUBSTITUTES, & RESERVES */}
      <div className="space-y-6 pt-2">
        {/* STARTING XI DIRECTORY */}
        <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-3.5 sm:px-4 py-3 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#ff0046]" />
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Starting XI Lineup
              </h3>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                (11 Players • {FORMATIONS[selectedFormation]?.name})
              </span>
            </div>
            {teamCrest && (
              <img
                src={teamCrest}
                alt={teamName}
                className="w-5 h-5 rounded-full object-contain"
              />
            )}
          </div>

          <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
            {startingXI.map((player, idx) => {
              const isCap = captain?.id === player.id;
              const posColor = getPositionBadgeColor(player.position);

              return (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayerModal(player)}
                  className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center font-mono text-xs font-black text-slate-400">
                      #{player.number || idx + 1}
                    </span>

                    <img
                      src={
                        player.cardImage ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={player.name}
                      className="w-8 h-8 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
                      }}
                    />

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {player.name}
                        </span>
                        {isCap && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-0.5 shrink-0">
                            <Crown className="w-2.5 h-2.5 fill-current" />
                            CAPTAIN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {player.status || 'Active Roster'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${posColor}`}>
                      {player.position}
                    </span>
                    {player.rating && (
                      <span className="w-7 text-right font-mono text-xs font-black text-slate-700 dark:text-slate-200">
                        {player.rating}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SUBSTITUTES & BENCH */}
        {substitutes.length > 0 && (
          <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-3.5 sm:px-4 py-3 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Substitutes & Bench
                </h3>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  ({substitutes.length} Available)
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {substitutes.map((player) => {
                const posColor = getPositionBadgeColor(player.position);

                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayerModal(player)}
                    className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center font-mono text-xs font-black text-slate-400">
                        #{player.number}
                      </span>

                      <img
                        src={
                          player.cardImage ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                        }
                        alt={player.name}
                        className="w-8 h-8 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
                        }}
                      />

                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {player.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {player.status || 'Bench Substitute'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${posColor}`}>
                        {player.position}
                      </span>
                      {player.rating && (
                        <span className="w-7 text-right font-mono text-xs font-black text-slate-700 dark:text-slate-200">
                          {player.rating}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RESERVES SQUAD (IF ANY) */}
        {reserves.length > 0 && (
          <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-3.5 sm:px-4 py-3 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Reserve Athletes
                </h3>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  ({reserves.length} Squad Members)
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {reserves.map((player) => {
                const posColor = getPositionBadgeColor(player.position);

                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayerModal(player)}
                    className="flex items-center justify-between px-3.5 sm:px-4 py-2 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center font-mono text-xs font-black text-slate-400">
                        #{player.number}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {player.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${posColor}`}>
                        {player.position}
                      </span>
                      {player.rating && (
                        <span className="w-7 text-right font-mono text-xs font-black text-slate-600 dark:text-slate-400">
                          {player.rating}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. IN-MATCH ROLES POPUP MODAL (OPENED BY IN-MATCH ROLES BUTTON, CLOSABLE VIA X OR CLOSE BUTTON) */}
      {isRolesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-in fade-in duration-100">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header with X Close Button */}
            <div className="flex items-center justify-between px-5 py-4 bg-[#f8f9fa] dark:bg-[#112236] border-b border-slate-200 dark:border-[#1a2e45]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Crown className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    In-Match Roles & Set-Pieces
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Official designations for {teamName}
                  </p>
                </div>
              </div>

              {/* Close Button X */}
              <button
                type="button"
                onClick={() => setIsRolesModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1a2e45] flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Roles Cards List */}
            <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
              {inMatchRoles.map((role) => {
                const IconComponent = role.icon;
                const assignedPlayer = role.player;

                return (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${role.bgGlow}`}>
                        <IconComponent className={`w-4 h-4 ${role.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase block tracking-wider">
                          {role.label}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {role.desc}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Player Details */}
                    {assignedPlayer ? (
                      <div className="flex items-center gap-2 pl-2 shrink-0">
                        <img
                          src={
                            assignedPlayer.cardImage ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'
                          }
                          alt={assignedPlayer.name}
                          className="w-7 h-7 rounded-full object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-[100px]">
                            {assignedPlayer.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            #{assignedPlayer.number} • {assignedPlayer.position}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold">Unassigned</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer with Close Button */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#f8f9fa] dark:bg-[#112236] border-t border-slate-200 dark:border-[#1a2e45]">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Official team roles from match tactics
              </span>
              <button
                type="button"
                onClick={() => setIsRolesModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#00b04f] hover:bg-[#009944] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. PLAYER DETAILS QUICK MODAL */}
      {selectedPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none animate-in fade-in duration-100">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedPlayerModal(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5">
              <img
                src={
                  selectedPlayerModal.cardImage ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'
                }
                alt={selectedPlayerModal.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-slate-300 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {selectedPlayerModal.name}
                  </span>
                  {captain?.id === selectedPlayerModal.id && (
                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono">
                  #{selectedPlayerModal.number} • {selectedPlayerModal.position} • {teamName}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#00b04f]/10 text-[#00b04f]">
                  {selectedPlayerModal.status || 'Match Ready'}
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100 dark:border-[#1a2e45]">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#14263b]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rating</span>
                <span className="text-sm font-black text-amber-500 font-mono">
                  {selectedPlayerModal.rating || 80}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#14263b]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Position</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">
                  {selectedPlayerModal.position}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#14263b]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Number</span>
                <span className="text-sm font-black text-slate-800 dark:text-white font-mono">
                  #{selectedPlayerModal.number}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPlayerModal(null)}
              className="w-full py-2 bg-slate-100 dark:bg-[#14263b] hover:bg-slate-200 dark:hover:bg-[#1a2e45] text-slate-900 dark:text-white text-xs font-black uppercase rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSquadTab;
