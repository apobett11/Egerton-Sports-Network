import React, { useState, useEffect } from 'react';
import type { LeagueTableEntry, HistoricalSeasonStandings } from '../../types';
import { ApiService } from '../../services/api';
import { ArrowUp, ArrowDown, Minus, Clock, Archive, Trophy } from 'lucide-react';

interface LeagueTableProps {
  tableData: LeagueTableEntry[];
  title?: string;
  allowHistoricalView?: boolean;
}

export const LeagueTable: React.FC<LeagueTableProps> = ({
  tableData,
  allowHistoricalView = true
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'historical'>('current');
  const [historicalSeasons, setHistoricalSeasons] = useState<HistoricalSeasonStandings[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  useEffect(() => {
    if (allowHistoricalView) {
      ApiService.getHistoricalStandings().then((res) => {
        if (res.data && res.data.length > 0) {
          setHistoricalSeasons(res.data);
          setSelectedSeasonId(res.data[0].seasonId);
        }
      });
    }
  }, [allowHistoricalView]);

  const activeSeasonData = historicalSeasons.find((s) => s.seasonId === selectedSeasonId);

  // Premier League Data
  const premierData: LeagueTableEntry[] = activeTab === 'historical' && activeSeasonData
    ? activeSeasonData.entries
    : tableData;

  // Championships Data
  const championshipsData: LeagueTableEntry[] = [
    { position: 1, teamId: 'est', teamName: 'Egerton Staff FC', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=EST&backgroundColor=4b5563', played: 10, won: 7, drawn: 2, lost: 1, goalsFor: 18, goalsAgainst: 6, goalDifference: 12, points: 23, movement: 'up' },
    { position: 2, teamId: 'ttr', teamName: 'Tatton Warriors', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=TTR&backgroundColor=10b981', played: 10, won: 6, drawn: 2, lost: 2, goalsFor: 16, goalsAgainst: 8, goalDifference: 8, points: 20, movement: 'same' },
    { position: 3, teamId: 'vet', teamName: 'Vet Med FC', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=VET&backgroundColor=8b5cf6', played: 10, won: 5, drawn: 3, lost: 2, goalsFor: 14, goalsAgainst: 9, goalDifference: 5, points: 18, movement: 'up' },
    { position: 4, teamId: 'eng', teamName: 'Engineering Stars', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=ENG&backgroundColor=f59e0b', played: 10, won: 4, drawn: 1, lost: 5, goalsFor: 12, goalsAgainst: 14, goalDifference: -2, points: 13, movement: 'down' },
    { position: 5, teamId: 'njr', teamName: 'Njoro FC', teamLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=NJR&backgroundColor=dc2626', played: 10, won: 1, drawn: 1, lost: 8, goalsFor: 6, goalsAgainst: 29, goalDifference: -23, points: 4, movement: 'down' }
  ];

  const renderTable = (title: string, data: LeagueTableEntry[], badgeColor: string) => {
    const latestTimestamp = data.length > 0 && data[0].lastUpdated
      ? new Date(data[0].lastUpdated!).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
      : new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden select-none space-y-0">
        {/* Table Header */}
        <div className="bg-gray-50 dark:bg-black/30 px-5 py-4 border-b border-gray-200/80 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className={`w-5 h-5 ${badgeColor}`} />
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            OFFICIAL TABLE
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-[#151515]/30 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-850">
                <th className="py-3 px-3 text-center w-8">#</th>
                <th className="py-3 px-1 text-center w-6">Pos</th>
                <th className="py-3 px-2">Team</th>
                <th className="py-3 px-2 text-center w-8">P</th>
                <th className="py-3 px-2 text-center w-8">W</th>
                <th className="py-3 px-2 text-center w-8">D</th>
                <th className="py-3 px-2 text-center w-8">L</th>
                <th className="py-3 px-2 text-center w-10">GF</th>
                <th className="py-3 px-2 text-center w-10">GA</th>
                <th className="py-3 px-2 text-center w-10">GD</th>
                <th className="py-3 px-3 text-center font-extrabold w-10">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {data.map((row) => {
                const isTop = row.position <= 2;
                const isBottom = row.position >= data.length;

                let rowClass = 'hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors';
                let positionBadgeClass = 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';

                if (isTop) {
                  rowClass += ' bg-emerald-500/[0.03] dark:bg-emerald-500/[0.015] border-l-4 border-l-emerald-500';
                  positionBadgeClass = 'text-white bg-emerald-600';
                } else if (isBottom) {
                  rowClass += ' bg-rose-500/[0.03] dark:bg-rose-500/[0.015] border-l-4 border-l-rose-500';
                  positionBadgeClass = 'text-white bg-rose-600';
                }

                return (
                  <tr key={row.teamId} className={rowClass}>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${positionBadgeClass}`}>
                        {row.position}
                      </span>
                    </td>

                    <td className="py-3 px-1 text-center">
                      {row.movement === 'up' && (
                        <span className="inline-flex items-center text-emerald-500 font-bold" title="Climbed position">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {row.movement === 'down' && (
                        <span className="inline-flex items-center text-rose-500 font-bold" title="Dropped position">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {(!row.movement || row.movement === 'same') && (
                        <span className="inline-flex items-center text-gray-400" title="Position unchanged">
                          <Minus className="w-3 h-3" />
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-2 font-semibold">
                      <div className="flex items-center gap-2">
                        <img
                          src={row.teamLogo}
                          alt={row.teamName}
                          className="w-5 h-5 rounded-full object-contain bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                        />
                        <span className="truncate max-w-[160px]">{row.teamName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-500 dark:text-gray-400">{row.played}</td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-600">{row.won}</td>
                    <td className="py-3 px-2 text-center text-gray-400">{row.drawn}</td>
                    <td className="py-3 px-2 text-center text-rose-500">{row.lost}</td>
                    <td className="py-3 px-2 text-center text-gray-500">{row.goalsFor}</td>
                    <td className="py-3 px-2 text-center text-gray-500">{row.goalsAgainst}</td>
                    <td className="py-3 px-2 text-center font-mono font-bold">
                      <span className={row.goalDifference > 0 ? 'text-emerald-600 dark:text-emerald-500' : row.goalDifference < 0 ? 'text-rose-600 dark:text-rose-500' : ''}>
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-black text-amber-500 text-sm">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* POSITIONAL CHANGES ANALYTICS WITHIN TABLE */}
        <div className="p-4 bg-gray-50/70 dark:bg-black/20 border-t border-gray-200/80 dark:border-gray-800">
          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2.5">
            Positional Changes Analytics (Recent Matchdays)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {data.map((team) => (
              <div key={team.teamId} className="p-2 rounded-xl bg-white dark:bg-[#15191B] border border-gray-200/80 dark:border-gray-800 flex items-center justify-between">
                <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[100px]">{team.teamName}</span>
                <span className={`font-black flex items-center gap-0.5 ${team.movement === 'up' ? 'text-emerald-500' : team.movement === 'down' ? 'text-rose-500' : 'text-gray-400'}`}>
                  {team.movement === 'up' ? <ArrowUp className="w-3.5 h-3.5" /> : team.movement === 'down' ? <ArrowDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  {team.movement === 'up' ? '+1' : team.movement === 'down' ? '-1' : '0'}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-2 text-[10px] text-gray-400 font-mono text-right">
            Updated: {latestTimestamp}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 select-none pb-12">
      {/* Historical View Toggle Bar */}
      {allowHistoricalView && historicalSeasons.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="font-black text-sm text-gray-900 dark:text-gray-100">Egerton Campus Football Standings</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'current'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Live Standings
            </button>
            <button
              onClick={() => setActiveTab('historical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'historical'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-3.5 h-3.5" /> Historical Archive
            </button>
            {activeTab === 'historical' && (
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-xl px-3 py-1"
              >
                {historicalSeasons.map((s) => (
                  <option key={s.seasonId} value={s.seasonId}>
                    {s.seasonName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* TABLE 1: EGERTON PREMIER LEAGUE */}
      {renderTable('Egerton Premier League Standings', premierData, 'text-emerald-500')}

      {/* TABLE 2: EGERTON CHAMPIONSHIPS */}
      {renderTable('Egerton Championships Standings', championshipsData, 'text-amber-500')}

      {/* GOLDEN BOOT LEADERBOARD (NOT ATTACHED - BREATHING SPACE) */}
      <div className="pt-6">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-500">
                Official Golden Boot Leaderboard
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              TOP GOALSCORERS
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            <div className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-black/20 px-2 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 font-black text-amber-500 text-sm">1</span>
                <div>
                  <div className="font-extrabold text-gray-900 dark:text-gray-100">FOA Player 10</div>
                  <div className="text-[10px] text-gray-400">Faculty of Arts</div>
                </div>
              </div>
              <span className="font-mono font-black text-amber-500 text-sm">8 Goals</span>
            </div>

            <div className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-black/20 px-2 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 font-black text-gray-400 text-sm">2</span>
                <div>
                  <div className="font-extrabold text-gray-900 dark:text-gray-100">SHK Player 9</div>
                  <div className="text-[10px] text-gray-400">Egerton Sharklets</div>
                </div>
              </div>
              <span className="font-mono font-black text-gray-700 dark:text-gray-300 text-sm">7 Goals</span>
            </div>

            <div className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-black/20 px-2 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 font-black text-gray-400 text-sm">3</span>
                <div>
                  <div className="font-extrabold text-gray-900 dark:text-gray-100">FOS Player 11</div>
                  <div className="text-[10px] text-gray-400">Faculty of Science</div>
                </div>
              </div>
              <span className="font-mono font-black text-gray-700 dark:text-gray-300 text-sm">6 Goals</span>
            </div>

            <div className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-black/20 px-2 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 font-black text-gray-400 text-sm">4</span>
                <div>
                  <div className="font-extrabold text-gray-900 dark:text-gray-100">EST Player 10</div>
                  <div className="text-[10px] text-gray-400">Egerton Staff FC</div>
                </div>
              </div>
              <span className="font-mono font-black text-gray-700 dark:text-gray-300 text-sm">5 Goals</span>
            </div>
          </div>
        </div>

        {/* REMAINING DISCOVERY FLOW SECTIONS BELOW GOLDEN BOOT */}
        <div className="mt-8 space-y-8">
          {/* TOP ASSISTS */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Top Assists Leaderboard
            </h4>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              <div className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 font-black text-emerald-500">1</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">FOA Player 8</span>
                  <span className="text-[10px] text-gray-400">(Faculty of Arts)</span>
                </div>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">6 Assists</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 font-black text-gray-400">2</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">FOS Player 7</span>
                  <span className="text-[10px] text-gray-400">(Faculty of Science)</span>
                </div>
                <span className="font-mono font-black text-gray-700 dark:text-gray-300">5 Assists</span>
              </div>
            </div>
          </div>

          {/* BEST DEFENCE */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-500">
              Best Defensive Records
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 text-center">
                <div className="font-bold text-gray-900 dark:text-gray-100">Egerton Sharklets</div>
                <div className="text-lg font-black text-emerald-500 mt-1">8 GA</div>
                <div className="text-[10px] text-gray-400">0.66 goals/match</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 text-center">
                <div className="font-bold text-gray-900 dark:text-gray-100">Faculty of Arts</div>
                <div className="text-lg font-black text-blue-500 mt-1">12 GA</div>
                <div className="text-[10px] text-gray-400">1.00 goals/match</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 text-center">
                <div className="font-bold text-gray-900 dark:text-gray-100">Faculty of Science</div>
                <div className="text-lg font-black text-gray-400 mt-1">14 GA</div>
                <div className="text-[10px] text-gray-400">1.16 goals/match</div>
              </div>
            </div>
          </div>

          {/* RECENT FORM */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Recent Team Form
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-black/30">
                <span className="font-bold text-gray-900 dark:text-gray-100">Egerton Sharklets</span>
                <div className="flex gap-1 font-mono text-[10px] font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white">D</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-black/30">
                <span className="font-bold text-gray-900 dark:text-gray-100">Faculty of Arts</span>
                <div className="flex gap-1 font-mono text-[10px] font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white">L</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white">D</span>
                </div>
              </div>
            </div>
          </div>

          {/* UPCOMING KEY FIXTURES */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Upcoming Key Fixtures
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="font-bold text-gray-800 dark:text-gray-200">Faculty of Education vs Faculty of Agriculture</span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">18:00 Today</span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="font-bold text-gray-800 dark:text-gray-200">Faculty of Arts vs Egerton Sharklets</span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Tomorrow</span>
              </div>
            </div>
          </div>

          {/* RELATED NEWS */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Related League News
            </h4>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Match Report</span>
              <div className="font-bold text-gray-900 dark:text-gray-100">
                Egerton Premier League: Sharklets Maintain Lead as FOA Pressures from Second Place
              </div>
            </div>
          </div>

          {/* HISTORICAL STANDINGS */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">
              Historical League Champions
            </h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div><strong className="text-gray-900 dark:text-gray-100">2024/2025:</strong> Egerton Sharklets (31 pts)</div>
              <div><strong className="text-gray-900 dark:text-gray-100">2023/2024:</strong> Faculty of Arts (28 pts)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
