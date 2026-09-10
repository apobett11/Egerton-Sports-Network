import React, { useState, useMemo } from 'react';
import {
  Search,
  Shield,
  Star,
  Shirt,
  Users,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Hash,
} from 'lucide-react';
import type { Player, PlayerPosition } from '../../Dashboards/Team/types';

interface TeamPlayersTabProps {
  roster: Player[];
  teamName?: string;
  teamId?: string;
  startingXIIds?: string[];
}

type SortCriterion = 'rating' | 'number' | 'name' | 'position' | 'status';

const POSITION_WEIGHT: Record<string, number> = {
  GK: 1,
  DF: 2,
  MD: 3,
  FW: 4,
};

const STATUS_WEIGHT: Record<string, number> = {
  Fit: 1,
  Active: 2,
  Recovering: 3,
  Injured: 4,
  Suspended: 5,
};

export const TeamPlayersTab: React.FC<TeamPlayersTabProps> = ({
  roster,
  teamName = 'Team',
  startingXIIds = [],
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [activeSubMenu, setActiveSubMenu] = useState<'players' | 'kits'>('players');
  const [sortBy, setSortBy] = useState<SortCriterion>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredRoster = useMemo(() => {
    return roster.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.number).includes(searchTerm);

      const matchesPos =
        positionFilter === 'ALL' ||
        p.position === positionFilter ||
        (positionFilter === 'DF' && (p.position as any) === 'DEF') ||
        (positionFilter === 'FW' && (p.position as any) === 'FWD');

      return matchesSearch && matchesPos;
    });
  }, [roster, searchTerm, positionFilter]);

  const handleSortClick = (criterion: SortCriterion) => {
    if (sortBy === criterion) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(criterion);
      if (criterion === 'rating') setSortOrder('desc');
      else setSortOrder('asc');
    }
  };

  const sortedRoster = useMemo(() => {
    const list = [...filteredRoster];
    list.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'rating') {
        comp = (a.rating || 0) - (b.rating || 0);
      } else if (sortBy === 'number') {
        comp = (a.number || 0) - (b.number || 0);
      } else if (sortBy === 'name') {
        comp = a.name.localeCompare(b.name);
      } else if (sortBy === 'position') {
        const pA = POSITION_WEIGHT[a.position] || 99;
        const pB = POSITION_WEIGHT[b.position] || 99;
        comp = pA - pB;
      } else if (sortBy === 'status') {
        const sA = STATUS_WEIGHT[a.status] || 99;
        const sB = STATUS_WEIGHT[b.status] || 99;
        comp = sA - sB;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
    return list;
  }, [filteredRoster, sortBy, sortOrder]);

  const getPositionBadgeStyle = (pos: PlayerPosition) => {
    switch (pos) {
      case 'GK':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      case 'DF':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30';
      case 'MD':
        return 'bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30';
      case 'FW':
        return 'bg-[#ff0046]/15 text-[#ff0046] border border-[#ff0046]/30';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full select-none pb-20 animate-in fade-in duration-150">
      {/* 1. Sub-Main Segmented Tabs */}
      <div className="flex items-center justify-between border-b border-[#e6e8ec] dark:border-[#1a2e45] pb-4">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSubMenu('players')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubMenu === 'players'
                ? 'bg-white dark:bg-[#1c3554] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Players Directory</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                activeSubMenu === 'players'
                  ? 'bg-[#ff0046]/15 text-[#ff0046]'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {roster.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubMenu('kits')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubMenu === 'kits'
                ? 'bg-white dark:bg-[#1c3554] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Team Kits</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                activeSubMenu === 'kits'
                  ? 'bg-[#00b04f]/15 text-[#00b04f]'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              4 Kits
            </span>
          </button>
        </div>

        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
          {teamName} Squad
        </span>
      </div>

      {/* 2. PLAYERS DIRECTORY SUB-VIEW */}
      {activeSubMenu === 'players' && (
        <div className="space-y-6">
          {/* Main Heading & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-blue-500" />
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Official Squad Roster
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  {roster.length} Athletes
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified player profiles and squad registrations from the database
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search athlete or #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
              />
            </div>
          </div>

          {/* Sorting Controls & Position Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl p-3 shadow-xs">
            {/* Position Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'ALL', label: 'ALL' },
                { id: 'GK', label: 'GOALKEEPERS' },
                { id: 'DF', label: 'DEFENDERS' },
                { id: 'MD', label: 'MIDFIELDERS' },
                { id: 'FW', label: 'FORWARDS' },
              ].map((item) => {
                const isActive = positionFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPositionFilter(item.id)}
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#00b04f] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#14263b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3450]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Sorting Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" />
                <span>Sort:</span>
              </span>

              <button
                type="button"
                onClick={() => handleSortClick('rating')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  sortBy === 'rating'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-100 dark:bg-[#14263b] text-slate-600 dark:text-slate-400'
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
                <span>Rating</span>
                {sortBy === 'rating' &&
                  (sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
              </button>

              <button
                type="button"
                onClick={() => handleSortClick('number')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  sortBy === 'number'
                    ? 'bg-blue-500 text-white font-black'
                    : 'bg-slate-100 dark:bg-[#14263b] text-slate-600 dark:text-slate-400'
                }`}
              >
                <Hash className="w-3 h-3" />
                <span>Number</span>
                {sortBy === 'number' &&
                  (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
              </button>

              <button
                type="button"
                onClick={() => handleSortClick('name')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  sortBy === 'name'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black'
                    : 'bg-slate-100 dark:bg-[#14263b] text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Name</span>
                {sortBy === 'name' &&
                  (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
              </button>
            </div>
          </div>

          {/* Player Cards Grid */}
          {sortedRoster.length === 0 ? (
            <div className="bg-white dark:bg-[#0e1c2b] p-12 text-center rounded-xl border border-[#e6e8ec] dark:border-[#1a2e45] text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No players match the current filter.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Try searching with another name or resetting position filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {sortedRoster.map((player) => {
                const isStarting =
                  startingXIIds.includes(player.id) ||
                  roster.findIndex((p) => p.id === player.id) < 11;

                return (
                  <div
                    key={player.id}
                    className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl p-3 shadow-xs hover:border-[#00b04f]/40 hover:shadow-md transition-all flex flex-col justify-between gap-2.5 relative group"
                  >
                    {/* Top Row: Rating, Position, Number */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-amber-500 text-slate-950 font-black font-mono text-[10px] flex items-center gap-0.5 shadow-2xs">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{player.rating || 78}</span>
                        </span>

                        <span
                          className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase ${getPositionBadgeStyle(
                            player.position
                          )}`}
                        >
                          {player.position}
                        </span>
                      </div>

                      <span className="font-mono font-black text-[11px] text-slate-400">
                        #{player.number}
                      </span>
                    </div>

                    {/* Player Image & Name */}
                    <div className="flex flex-col items-center text-center space-y-1.5 py-1">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-[#e6e8ec] dark:border-[#1a2e45] shrink-0 group-hover:border-[#00b04f] transition-colors">
                        <img
                          src={
                            player.cardImage ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={player.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="w-full">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {player.name}
                        </h4>
                        {isStarting && (
                          <span className="text-[9px] font-black uppercase text-[#00b04f] block mt-0.5">
                            Starting XI
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer: Fitness Status & Foot */}
                    <div className="pt-2 border-t border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between text-[9px]">
                      <span
                        className={`px-1.5 py-0.5 rounded-full font-bold uppercase truncate ${
                          player.status === 'Fit' || player.status === 'Active'
                            ? 'bg-[#00b04f]/15 text-[#00b04f]'
                            : player.status === 'Recovering'
                            ? 'bg-blue-500/15 text-blue-500'
                            : 'bg-[#ff0046]/15 text-[#ff0046]'
                        }`}
                      >
                        {player.status || 'Fit'}
                      </span>

                      <span className="text-slate-400 font-semibold uppercase">
                        {player.preferredFoot || 'Right'} Foot
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. TEAM KITS SUB-VIEW */}
      {activeSubMenu === 'kits' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Shirt className="w-5 h-5 text-[#00b04f]" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Official Uniforms & Strip Identity
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registered kit combinations approved for league fixtures
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'home', label: 'Home Kit', color: 'Royal Gold', hex: '#D4AF37', accent: '#0F172A' },
              { id: 'away', label: 'Away Kit', color: 'Arctic White', hex: '#FFFFFF', accent: '#D4AF37' },
              { id: 'third', label: 'Third Kit', color: 'Obsidian Black', hex: '#0F172A', accent: '#00B04F' },
              { id: 'gk', label: 'Goalkeeper Kit', color: 'Emerald Glow', hex: '#00B04F', accent: '#FFFFFF' },
            ].map((kit) => (
              <div
                key={kit.id}
                className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl p-4 shadow-xs flex flex-col items-center text-center space-y-3"
              >
                <div
                  className="w-20 h-24 rounded-lg flex items-center justify-center border-2 border-white/20 shadow-md relative overflow-hidden"
                  style={{ backgroundColor: kit.hex }}
                >
                  <Shirt
                    className="w-12 h-12"
                    style={{ color: kit.accent }}
                  />
                  <span
                    className="absolute bottom-1 right-1 text-[8px] font-black uppercase px-1 rounded-xs"
                    style={{ backgroundColor: kit.accent, color: kit.hex }}
                  >
                    {kit.id.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                    {kit.label}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {kit.color}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPlayersTab;
