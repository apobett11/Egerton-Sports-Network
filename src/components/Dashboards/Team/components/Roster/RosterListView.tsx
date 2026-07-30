import React from 'react';
import { Search, Plus, Lock, Trash2 } from 'lucide-react';
import type { Player, UserRole } from '../../types';

interface RosterListViewProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  positionFilter: string;
  setPositionFilter: (pos: string) => void;
  currentRole: UserRole;
  setShowAddPlayerModal: (show: boolean) => void;
  filteredRoster: Player[];
  startingXI: number[];
  roster: Player[];
  setPlayerToDelete: (player: Player | null) => void;
}

export const RosterListView: React.FC<RosterListViewProps> = ({
  searchTerm,
  setSearchTerm,
  positionFilter,
  setPositionFilter,
  currentRole,
  setShowAddPlayerModal,
  filteredRoster,
  startingXI,
  roster,
  setPlayerToDelete,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1F1F1F] p-4 rounded-xl border border-[#2A2A2A]">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player by name or #..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg pl-9 pr-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
            />
          </div>

          <select
            value={positionFilter}
            onChange={e => setPositionFilter(e.target.value)}
            className="bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
          >
            <option value="ALL">All Positions</option>
            <option value="GK">GK</option>
            <option value="DF">DF</option>
            <option value="MD">MD</option>
            <option value="FW">FW</option>
          </select>
        </div>

        {currentRole === 'COACH' ? (
          <button
            onClick={() => setShowAddPlayerModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-bold rounded-lg transition-colors min-h-[44px] cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Roster Athlete</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-medium text-gray-400 px-3 py-2 bg-[#111111] border border-[#2A2A2A] rounded-lg min-h-[44px]">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Coach Access required to Add/Drop players</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredRoster.map(player => {
          const isStarting = startingXI.includes(roster.findIndex(p => p.id === player.id));

          return (
            <div
              key={player.id}
              className="p-3 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 min-h-[44px]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-11 h-11 rounded-full bg-[#111111] border border-[#2A2A2A] overflow-hidden shrink-0">
                  <img
                    src={player.cardImage}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-100 truncate">{player.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      #{player.number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] md:text-xs font-medium text-gray-400">
                      Pos: <strong className="text-gray-200">{player.position}</strong>
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-[11px] md:text-xs font-medium text-gray-400">
                      Fit: <strong className="text-emerald-400">{player.stamina}%</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="font-mono text-base md:text-lg font-bold text-white">
                    {player.rating}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isStarting ? 'text-emerald-400' : 'text-gray-400'
                    }`}
                  >
                    {isStarting ? 'XI START' : 'BENCH'}
                  </span>
                </div>

                {currentRole === 'COACH' && (
                  <button
                    onClick={() => setPlayerToDelete(player)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    title="Remove player from roster"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
