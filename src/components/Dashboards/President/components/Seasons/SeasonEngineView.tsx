import React from 'react';
import { Plus } from 'lucide-react';
import type { SeasonItem, LeagueItem } from '../../types';

interface SeasonEngineViewProps {
  isDark: boolean;
  seasons: SeasonItem[];
  leagues: LeagueItem[];
  setShowCreateSeasonModal: (show: boolean) => void;
  setShowCreateLeagueModal: (show: boolean) => void;
  handleToggleSeasonStatus: (id: string, status: 'active' | 'inactive' | 'archived') => void;
  handleToggleLeagueStatus: (id: string) => void;
  handleArchiveLeague: (id: string) => void;
  handleDeleteLeague: (id: string) => void;
}

export const SeasonEngineView: React.FC<SeasonEngineViewProps> = ({
  isDark,
  seasons,
  leagues,
  setShowCreateSeasonModal,
  setShowCreateLeagueModal,
  handleToggleSeasonStatus,
  handleToggleLeagueStatus,
  handleArchiveLeague,
  handleDeleteLeague,
}) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            TAB 1 — Season & League Engine
          </h2>
          <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Initialize seasons, manage league tiers, configure team capacities, and monitor season status indicators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateSeasonModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Season
          </button>
          <button
            onClick={() => setShowCreateLeagueModal(true)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'}`}
          >
            <Plus className="w-4 h-4 inline mr-1" /> Add League
          </button>
        </div>
      </div>

      {/* SEASONS LIST TABLE */}
      <div className={`p-6 rounded-3xl border elevation-card space-y-4 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Seasons Registry</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#090D16]/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <tr>
                <th className="px-4 py-3">Season Name</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Reg. Cutoff</th>
                <th className="px-4 py-3">Status Indicator</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {seasons.map((s) => (
                <tr key={s.id} className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                  <td className="px-4 py-3 font-black">{s.name}</td>
                  <td className="px-4 py-3 font-mono">{s.startDate}</td>
                  <td className="px-4 py-3 font-mono">{s.endDate}</td>
                  <td className="px-4 py-3 font-mono">{s.registrationCutoff}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        s.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                          : s.status === 'inactive'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                      }`}
                    >
                      {s.status} Badge
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleToggleSeasonStatus(s.id, s.status === 'active' ? 'inactive' : 'active')}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
                    >
                      Toggle Status
                    </button>
                    <button
                      onClick={() => handleToggleSeasonStatus(s.id, 'archived')}
                      className="px-2.5 py-1 rounded-lg bg-slate-700/20 text-slate-400 hover:bg-slate-700 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEAGUES LIST TABLE */}
      <div className={`p-6 rounded-3xl border elevation-card space-y-4 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Leagues & Competitions Management</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#090D16]/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <tr>
                <th className="px-4 py-3">League Name</th>
                <th className="px-4 py-3">Tier / Division</th>
                <th className="px-4 py-3">Team Capacity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {leagues.map((l) => (
                <tr key={l.id} className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                  <td className="px-4 py-3 font-black">{l.name}</td>
                  <td className="px-4 py-3">{l.tier}</td>
                  <td className="px-4 py-3 font-mono">{l.currentTeamsCount} / {l.maxTeams} Teams</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${l.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleToggleLeagueStatus(l.id)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
                    >
                      Toggle Status
                    </button>
                    <button
                      onClick={() => handleArchiveLeague(l.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-700/20 text-slate-400 hover:bg-slate-700 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => handleDeleteLeague(l.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
