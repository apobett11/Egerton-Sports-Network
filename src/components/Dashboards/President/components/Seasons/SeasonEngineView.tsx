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
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          League Registration Overview
        </h2>
        <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Pre-season registration breakdown of teams, assigned head coaches, team captains, registered players, and medical personnel across league divisions.
        </p>
      </div>

      {/* SECTION 1: LEAGUE A (EGERTON PREMIER LEAGUE) */}
      <div className={`p-6 md:p-8 rounded-3xl border elevation-card space-y-4 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between border-b pb-4 border-slate-700/20">
          <div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Tier 1 Division
            </span>
            <h3 className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
              <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#090D16]/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <tr>
                  <th className="px-4 py-3">Team Name</th>
                  <th className="px-4 py-3">Coach</th>
                  <th className="px-4 py-3">Captain</th>
                  <th className="px-4 py-3">Players Registered</th>
                  <th className="px-4 py-3 text-right">Team Doctor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {premierTeams.map((t) => (
                  <tr key={t.id} className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                    <td className="px-4 py-3 font-black">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>{t.name}</span>
                        {t.code && <span className="text-[10px] font-mono text-slate-400">[{t.code}]</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold">{t.coach || 'Unassigned'}</td>
                    <td className="px-4 py-3 font-bold">{t.captain || 'Unassigned'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-500">
                      {t.playerCount || 16} Players
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${t.doctorStatus === 'Assigned' || t.doctorName ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
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
      <div className={`p-6 md:p-8 rounded-3xl border elevation-card space-y-4 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between border-b pb-4 border-slate-700/20">
          <div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              Tier 2 Division
            </span>
            <h3 className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
              <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#090D16]/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <tr>
                  <th className="px-4 py-3">Team Name</th>
                  <th className="px-4 py-3">Coach</th>
                  <th className="px-4 py-3">Captain</th>
                  <th className="px-4 py-3">Players Registered</th>
                  <th className="px-4 py-3 text-right">Team Doctor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {championshipTeams.map((t) => (
                  <tr key={t.id} className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                    <td className="px-4 py-3 font-black">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>{t.name}</span>
                        {t.code && <span className="text-[10px] font-mono text-slate-400">[{t.code}]</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold">{t.coach || 'Unassigned'}</td>
                    <td className="px-4 py-3 font-bold">{t.captain || 'Unassigned'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-500">
                      {t.playerCount || 16} Players
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${t.doctorStatus === 'Assigned' || t.doctorName ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
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
