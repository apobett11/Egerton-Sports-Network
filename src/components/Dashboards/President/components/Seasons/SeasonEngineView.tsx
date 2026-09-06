import React from 'react';
import type { TeamItem } from '../../types';

interface SeasonEngineViewProps {
  isDark: boolean;
  teams: TeamItem[];
}

export const SeasonEngineView: React.FC<SeasonEngineViewProps> = ({
  isDark,
  teams,
}) => {
  const premierTeams = teams.filter((t) => t.league === 'premier' || !t.league);
  const championshipTeams = teams.filter((t) => t.league === 'championship');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className={`text-xl md:text-2xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
          League Registration Overview
        </h2>
        <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Pre-season registration breakdown of teams, assigned head coaches, team captains, registered players, and medical personnel across league divisions.
        </p>
      </div>

      {/* SECTION 1: LEAGUE A (EGERTON PREMIER LEAGUE) */}
      <div className={`p-4 sm:p-5 rounded-none sm:rounded-sm border space-y-4 shadow-xs ${isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'}`}>
        <div className="flex items-center justify-between border-b pb-3 border-[#14263b]">
          <div>
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/20">
              Tier 1 Division
            </span>
            <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              League A — Egerton Premier League
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {premierTeams.length} Registered Teams
          </span>
        </div>

        {premierTeams.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs font-bold">
            No teams registered in League A yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#112236] border-[#1a2e45] text-slate-400' : 'bg-[#f8f9fa] border-[#e6e8ec] text-slate-600'}`}>
                <tr>
                  <th className="px-4 py-2.5">Team Name</th>
                  <th className="px-4 py-2.5">Coach</th>
                  <th className="px-4 py-2.5">Captain</th>
                  <th className="px-4 py-2.5">Players Registered</th>
                  <th className="px-4 py-2.5 text-right">Team Doctor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14263b]">
                {premierTeams.map((t) => (
                  <tr key={t.id} className={`hover:bg-[#13263b] transition-colors ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    <td className="px-4 py-2.5 font-black">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff0046]" />
                        <span>{t.name}</span>
                        {t.code && <span className="text-[10px] font-mono text-slate-400">[{t.code}]</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-bold">{t.coach || 'Unassigned'}</td>
                    <td className="px-4 py-2.5 font-bold">{t.captain || 'Unassigned'}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-200">
                      {t.playerCount || 16} Players
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider ${t.doctorStatus === 'Assigned' || t.doctorName ? 'bg-[#00b04f]/10 text-[#00b04f] border border-[#00b04f]/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                        {t.doctorName || (t.doctorStatus === 'Assigned' ? 'Dr. Assigned' : 'Unassigned')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: LEAGUE B (EGERTON CHAMPIONSHIP) */}
      <div className={`p-4 sm:p-5 rounded-none sm:rounded-sm border space-y-4 shadow-xs ${isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'}`}>
        <div className="flex items-center justify-between border-b pb-3 border-[#14263b]">
          <div>
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#152a40] text-slate-300 border border-[#223b56]">
              Tier 2 Division
            </span>
            <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              League B — Egerton Championship
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {championshipTeams.length} Registered Teams
          </span>
        </div>

        {championshipTeams.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs font-bold">
            No teams registered in League B yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#112236] border-[#1a2e45] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <tr>
                  <th className="px-4 py-2.5">Team Name</th>
                  <th className="px-4 py-2.5">Coach</th>
                  <th className="px-4 py-2.5">Captain</th>
                  <th className="px-4 py-2.5">Players Registered</th>
                  <th className="px-4 py-2.5 text-right">Team Doctor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14263b]">
                {championshipTeams.map((t) => (
                  <tr key={t.id} className={`hover:bg-[#13263b] transition-colors ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    <td className="px-4 py-2.5 font-black">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>{t.name}</span>
                        {t.code && <span className="text-[10px] font-mono text-slate-400">[{t.code}]</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-bold">{t.coach || 'Unassigned'}</td>
                    <td className="px-4 py-2.5 font-bold">{t.captain || 'Unassigned'}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-200">
                      {t.playerCount || 16} Players
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider ${t.doctorStatus === 'Assigned' || t.doctorName ? 'bg-[#00b04f]/10 text-[#00b04f] border border-[#00b04f]/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                        {t.doctorName || (t.doctorStatus === 'Assigned' ? 'Dr. Assigned' : 'Unassigned')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
