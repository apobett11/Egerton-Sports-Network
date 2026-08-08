import React, { useState } from 'react';
import { Trophy, Award, Search, UserCheck, Shield, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import type { SeasonTeam } from '../../types/seasonMode';
import { COMPETITIONS, OPERATIONAL_STATUS_COLORS } from '../../constants/seasonConstants';

interface TeamsViewProps {
  isDark: boolean;
  premierLeagueTeams: SeasonTeam[];
  championshipTeams: SeasonTeam[];
  onOpenCoachModal: () => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  isDark,
  premierLeagueTeams,
  championshipTeams,
  onOpenCoachModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'epl' | 'championship'>('all');

  const filterTeams = (list: SeasonTeam[]) => {
    return list.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const matchName = t.name.toLowerCase().includes(q);
      const matchCoach = t.coach_profile ? `${t.coach_profile.first_name} ${t.coach_profile.last_name}`.toLowerCase().includes(q) : false;
      return matchName || matchCoach;
    });
  };

  const filteredEpl = filterTeams(premierLeagueTeams);
  const filteredChampionship = filterTeams(championshipTeams);

  return (
    <div className="space-y-8">
      {/* SECTION TITLE & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Registered Season Teams Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Review Egerton Premier League & Egerton Championship rosters concurrently.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCoachModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-sm transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            + Register Coach & Team
          </button>
        </div>
      </div>

      {/* SEARCH & CONCURRENT FILTER TOOLBAR */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter teams by name or coach..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none font-medium ${
              isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
        </div>

        {/* Competition Scope Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[44px] ${
              selectedFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : isDark
                ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Competitions ({premierLeagueTeams.length + championshipTeams.length})
          </button>
          <button
            onClick={() => setSelectedFilter('epl')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[44px] ${
              selectedFilter === 'epl'
                ? 'bg-amber-500 text-white'
                : isDark
                ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            EPL ({premierLeagueTeams.length})
          </button>
          <button
            onClick={() => setSelectedFilter('championship')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[44px] ${
              selectedFilter === 'championship'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Championship ({championshipTeams.length})
          </button>
        </div>
      </div>

      {/* DUAL COMPETITION RACK (CONCURRENT VISIBILITY) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DIVISION 1: EGERTON PREMIER LEAGUE */}
        {(selectedFilter === 'all' || selectedFilter === 'epl') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Egerton Premier League
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Top Tier Division — {filteredEpl.length} Teams
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
                Tier 1
              </span>
            </div>

            {filteredEpl.length === 0 ? (
              <div
                className={`p-8 rounded-2xl border text-center text-xs text-slate-500 ${
                  isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                No Premier League teams match current filter criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEpl.map((team) => (
                  <div
                    key={team.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDark ? 'bg-[#0E1424] border-slate-800/80 hover:border-amber-500/30' : 'bg-white border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-inner shrink-0"
                          style={{ backgroundColor: team.color_code || '#D4AF37' }}
                        >
                          {team.short_name || team.name.slice(0, 3)}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{team.name}</h3>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Coach:{' '}
                            <span className="text-slate-300 font-bold">
                              {team.coach_profile
                                ? `${team.coach_profile.first_name} ${team.coach_profile.last_name}`
                                : 'Assigned Official Coach'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                          OPERATIONAL_STATUS_COLORS[team.status || 'approved']
                        }`}
                      >
                        {team.status || 'approved'}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>ID: {team.id.slice(0, 8)}...</span>
                      <span>Cap: {team.captain_profile ? `${team.captain_profile.first_name}` : 'Roster Active'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DIVISION 2: EGERTON CHAMPIONSHIPS */}
        {(selectedFilter === 'all' || selectedFilter === 'championship') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Egerton Championships
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Second Tier Division — {filteredChampionship.length} Teams
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider">
                Tier 2
              </span>
            </div>

            {filteredChampionship.length === 0 ? (
              <div
                className={`p-8 rounded-2xl border text-center text-xs text-slate-500 ${
                  isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                No Championship teams match current filter criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChampionship.map((team) => (
                  <div
                    key={team.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDark ? 'bg-[#0E1424] border-slate-800/80 hover:border-blue-500/30' : 'bg-white border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-inner shrink-0"
                          style={{ backgroundColor: team.color_code || '#2563EB' }}
                        >
                          {team.short_name || team.name.slice(0, 3)}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{team.name}</h3>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Coach:{' '}
                            <span className="text-slate-300 font-bold">
                              {team.coach_profile
                                ? `${team.coach_profile.first_name} ${team.coach_profile.last_name}`
                                : 'Assigned Official Coach'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                          OPERATIONAL_STATUS_COLORS[team.status || 'approved']
                        }`}
                      >
                        {team.status || 'approved'}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>ID: {team.id.slice(0, 8)}...</span>
                      <span>Cap: {team.captain_profile ? `${team.captain_profile.first_name}` : 'Roster Active'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
