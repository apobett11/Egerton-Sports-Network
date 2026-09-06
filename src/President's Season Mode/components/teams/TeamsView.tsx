import React, { useState } from 'react';
import { Shield, Search, UserCheck, Users } from 'lucide-react';
import type { SeasonTeam } from '../../types/seasonMode';

interface TeamsViewProps {
  isDark: boolean;
  premierLeagueTeams: SeasonTeam[];
  championshipTeams: SeasonTeam[];
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  isDark,
  premierLeagueTeams,
  championshipTeams,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filterTeams = (list: SeasonTeam[]) =>
    list.filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.short_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const eplFiltered = filterTeams(premierLeagueTeams);
  const champFiltered = filterTeams(championshipTeams);

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Official Team Roster Operational Oversight
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Concurrent operational tables for Egerton Premier League and Egerton Championships.
          </p>
        </div>

        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-sm border text-xs ${
            isDark ? 'bg-[#15273b] border-[#1a2e45] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teams or coaches..."
            className="bg-transparent outline-none text-xs w-40 sm:w-56 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* SECTION 1: EGERTON PREMIER LEAGUE TABLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#ff0046]" />
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Egerton Premier League
            </h2>
            <span className="px-2.5 py-0.5 rounded-xs text-xs font-black bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/20">
              {premierLeagueTeams.length} Teams
            </span>
          </div>
        </div>

        <div
          className={`rounded-sm border overflow-hidden transition-all ${
            isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b text-[10px] font-black uppercase tracking-wider ${
                    isDark ? 'bg-[#102237] border-[#1a2e45] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Head Coach</th>
                  <th className="py-3 px-4">Captain</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Division</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2e45] font-medium">
                {eplFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No Premier League teams matched your search.
                    </td>
                  </tr>
                ) : (
                  eplFiltered.map((team) => (
                    <tr
                      key={team.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-[#15273b]/60 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xs bg-[#15273b] text-slate-200 flex items-center justify-center font-black text-xs border border-[#1a2e45]">
                          {team.short_name.slice(0, 3)}
                        </div>
                        <span>{team.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{team.short_name}</td>
                      <td className="py-3.5 px-4">
                        {team.coach_profile
                          ? `${team.coach_profile.first_name} ${team.coach_profile.last_name}`
                          : 'Head Coach Assigned'}
                      </td>
                      <td className="py-3.5 px-4">
                        {team.captain_profile
                          ? `${team.captain_profile.first_name} ${team.captain_profile.last_name}`
                          : 'Team Captain'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30">
                          {team.status || 'approved'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-300">Premier League</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: EGERTON CHAMPIONSHIPS TABLE */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Egerton Championships
            </h2>
            <span className="px-2.5 py-0.5 rounded-xs text-xs font-black bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {championshipTeams.length} Teams
            </span>
          </div>
        </div>

        <div
          className={`rounded-sm border overflow-hidden transition-all ${
            isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b text-[10px] font-black uppercase tracking-wider ${
                    isDark ? 'bg-[#102237] border-[#1a2e45] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Head Coach</th>
                  <th className="py-3 px-4">Captain</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Division</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2e45] font-medium">
                {champFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No Championship teams matched your search.
                    </td>
                  </tr>
                ) : (
                  champFiltered.map((team) => (
                    <tr
                      key={team.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-[#15273b]/60 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xs bg-[#15273b] text-slate-200 flex items-center justify-center font-black text-xs border border-[#1a2e45]">
                          {team.short_name.slice(0, 3)}
                        </div>
                        <span>{team.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{team.short_name}</td>
                      <td className="py-3.5 px-4">
                        {team.coach_profile
                          ? `${team.coach_profile.first_name} ${team.coach_profile.last_name}`
                          : 'Head Coach Assigned'}
                      </td>
                      <td className="py-3.5 px-4">
                        {team.captain_profile
                          ? `${team.captain_profile.first_name} ${team.captain_profile.last_name}`
                          : 'Team Captain'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30">
                          {team.status || 'approved'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-300">Championship</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
