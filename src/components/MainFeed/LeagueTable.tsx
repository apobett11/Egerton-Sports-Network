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
  title = 'Egerton Premier League Standings',
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

  const displayData = activeTab === 'historical' && activeSeasonData
    ? activeSeasonData.entries
    : tableData;

  // Determine latest calculation timestamp
  const latestTimestamp = displayData.length > 0 && displayData[0].lastUpdated
    ? new Date(displayData[0].lastUpdated!).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm overflow-hidden select-none transition-colors">
      {/* Header with Title & Season View Selector */}
      <div className="bg-gray-50 dark:bg-black/20 px-4 py-3 border-b border-gray-150 dark:border-gray-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
            {activeTab === 'historical' && activeSeasonData
              ? activeSeasonData.seasonName
              : title}
          </h3>
        </div>

        {allowHistoricalView && historicalSeasons.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                activeTab === 'current'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Live Standings
            </button>
            <button
              onClick={() => setActiveTab('historical')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'historical'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-3 h-3" /> Historical Archive
            </button>

            {activeTab === 'historical' && (
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-[11px] rounded px-2 py-0.5"
              >
                {historicalSeasons.map((s) => (
                  <option key={s.seasonId} value={s.seasonId}>
                    {s.seasonName}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans text-xs">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-[#151515]/30 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-850">
              <th className="py-2.5 px-3 text-center w-8">#</th>
              <th className="py-2.5 px-1 text-center w-6">Pos</th>
              <th className="py-2.5 px-2">Team</th>
              <th className="py-2.5 px-2 text-center w-8">P</th>
              <th className="py-2.5 px-2 text-center w-8">W</th>
              <th className="py-2.5 px-2 text-center w-8">D</th>
              <th className="py-2.5 px-2 text-center w-8">L</th>
              <th className="py-2.5 px-2 text-center w-10">GF</th>
              <th className="py-2.5 px-2 text-center w-10">GA</th>
              <th className="py-2.5 px-2 text-center w-10">GD</th>
              <th className="py-2.5 px-3 text-center font-extrabold w-10">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
            {displayData.map((row) => {
              const isTopThree = row.position <= 3;
              const isBottomTwo = row.position >= displayData.length - 1;

              // Row background style based on standing
              let rowClass = 'hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors';
              let positionBadgeClass = 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';

              if (isTopThree) {
                rowClass += ' bg-emerald-500/[0.03] dark:bg-emerald-500/[0.015] border-l-4 border-l-emerald-500';
                positionBadgeClass = 'text-white bg-emerald-600';
              } else if (isBottomTwo) {
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

                  {/* Standings Movement Indicator */}
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
                      <span className="hidden sm:inline truncate max-w-[150px]">{row.teamName}</span>
                      <span className="sm:hidden truncate max-w-[90px]">{row.teamName.replace('Faculty of ', 'Fac. ')}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-500 dark:text-gray-400">{row.played}</td>
                  <td className="py-3 px-2 text-center">{row.won}</td>
                  <td className="py-3 px-2 text-center">{row.drawn}</td>
                  <td className="py-3 px-2 text-center">{row.lost}</td>
                  <td className="py-3 px-2 text-center text-gray-500 dark:text-gray-400">{row.goalsFor}</td>
                  <td className="py-3 px-2 text-center text-gray-500 dark:text-gray-400">{row.goalsAgainst}</td>
                  <td className="py-3 px-2 text-center font-medium">
                    <span className={row.goalDifference > 0 ? 'text-emerald-600 dark:text-emerald-500' : row.goalDifference < 0 ? 'text-rose-600 dark:text-rose-500' : ''}>
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-gray-900 dark:text-white">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend & Last Updated Timestamp Footer */}
      <div className="border-t border-gray-100 dark:border-gray-800/80 px-4 py-2.5 bg-gray-50/50 dark:bg-black/10 flex flex-wrap items-center justify-between gap-4 text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
            <span>Promotion Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-600" />
            <span>Relegation Zone</span>
          </div>
        </div>

        {/* Automatic Standings Calculation Timestamp */}
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-mono">
          <Clock className="w-3 h-3 text-emerald-500" />
          <span>Updated: {latestTimestamp}</span>
        </div>
      </div>

      {/* CONTINUOUS DISCOVERY SECTIONS FOR LEAGUE TABLE PAGE */}
      <div className="mt-8 space-y-8 select-none">
        {/* 1. POSITION CHANGES */}
        <div className="bg-white dark:bg-[#191c1e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
            Position Changes (Last 3 Matchdays)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-gray-800 dark:text-gray-200">Sharklets</span>
              <span className="text-emerald-500 font-black flex items-center gap-0.5"><ArrowUp className="w-3.5 h-3.5" /> +1</span>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-gray-800 dark:text-gray-200">Fac. of Arts</span>
              <span className="text-rose-500 font-black flex items-center gap-0.5"><ArrowDown className="w-3.5 h-3.5" /> -1</span>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-gray-800 dark:text-gray-200">Fac. of Science</span>
              <span className="text-emerald-500 font-black flex items-center gap-0.5"><ArrowUp className="w-3.5 h-3.5" /> +2</span>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-gray-800 dark:text-gray-200">Njoro FC</span>
              <span className="text-gray-400 font-black flex items-center gap-0.5"><Minus className="w-3.5 h-3.5" /> 0</span>
            </div>
          </div>
        </div>

        {/* 2. GOLDEN BOOT */}
        <div className="bg-white dark:bg-[#191c1e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 mb-3">
            Golden Boot Leaderboard
          </h4>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            <div className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 font-black text-amber-500">1</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">FOA Player 10</span>
                <span className="text-[10px] text-gray-400">(Faculty of Arts)</span>
              </div>
              <span className="font-mono font-black text-amber-500">8 Goals</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 font-black text-gray-400">2</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">SHK Player 9</span>
                <span className="text-[10px] text-gray-400">(Egerton Sharklets)</span>
              </div>
              <span className="font-mono font-black text-gray-700 dark:text-gray-300">7 Goals</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 font-black text-gray-400">3</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">FOS Player 11</span>
                <span className="text-[10px] text-gray-400">(Faculty of Science)</span>
              </div>
              <span className="font-mono font-black text-gray-700 dark:text-gray-300">6 Goals</span>
            </div>
          </div>
        </div>

        {/* 3. TOP ASSISTS */}
        <div className="bg-white dark:bg-[#191c1e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
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

        {/* 4. BEST DEFENCE */}
        <div className="bg-white dark:bg-[#191c1e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-blue-500 mb-3">
            Best Defensive Records
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 text-center">
              <div className="font-bold text-gray-900 dark:text-gray-100">Egerton Sharklets</div>
              <div className="text-lg font-black text-emerald-500 mt-1">8 GA</div>
              <div className="text-[10px] text-gray-400">0.66 goals/match</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 text-center">
              <div className="font-bold text-gray-900 dark:text-gray-100">Faculty of Arts</div>
              <div className="text-lg font-black text-blue-500 mt-1">12 GA</div>
              <div className="text-[10px] text-gray-400">1.00 goals/match</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 text-center">
              <div className="font-bold text-gray-900 dark:text-gray-100">Faculty of Science</div>
              <div className="text-lg font-black text-gray-400 mt-1">14 GA</div>
              <div className="text-[10px] text-gray-400">1.16 goals/match</div>
            </div>
          </div>
        </div>

        {/* 5. RECENT FORM */}
        <div className="bg-white dark:bg-[#191c1e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">
            Recent Team Form
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/30">
              <span className="font-bold text-gray-900 dark:text-gray-100">Egerton Sharklets</span>
              <div className="flex gap-1 font-mono text-[10px] font-bold">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white">D</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/30">
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

        {/* 6. UPCOMING FIXTURES */}
        <div className="bg-white dark:bg-[#191c1e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
            Upcoming Key Fixtures
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-gray-800 dark:text-gray-200">Faculty of Education vs Faculty of Agriculture</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">18:00 Today</span>
            </div>
            <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-gray-800 dark:text-gray-200">Faculty of Arts vs Egerton Sharklets</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Tomorrow</span>
            </div>
          </div>
        </div>

        {/* 7. RELATED NEWS */}
        <div className="bg-white dark:bg-[#191c1e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">
            Related League News
          </h4>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Match Report</span>
            <div className="font-bold text-xs text-gray-900 dark:text-gray-100">
              Egerton Premier League: Sharklets Maintain Lead as FOA Pressures from Second Place
            </div>
          </div>
        </div>

        {/* 8. HISTORICAL STANDINGS */}
        <div className="bg-white dark:bg-[#191c1e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 mb-2">
            Historical League Champions
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div><strong className="text-gray-900 dark:text-gray-100">2024/2025:</strong> Egerton Sharklets (31 pts)</div>
            <div><strong className="text-gray-900 dark:text-gray-100">2023/2024:</strong> Faculty of Arts (28 pts)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
