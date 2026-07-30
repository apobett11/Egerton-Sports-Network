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
    </div>
  );
};
