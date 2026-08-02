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

      {/* SECTIONS BELOW TABLE (Natural Extension of League Table) */}
      <div className="pt-8 space-y-12 select-none">
        {/* 1. LEADERBOARD (Golden Boot & Top Assists) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Golden Boot */}
          <div className="p-6 md:p-8 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                <span>⚽</span>
                <span className="uppercase tracking-wider">Golden Boot Leaderboard</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">Goals</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-gray-900 dark:text-gray-100">1. FOA Player 10 (Arts)</span>
                <span className="text-lg font-black font-mono text-amber-500">8</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>2. SHK Player 9 (Sharklets)</span>
                <span className="font-mono font-bold text-gray-400">7</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>3. FOS Player 11 (Science)</span>
                <span className="font-mono font-bold text-gray-400">6</span>
              </div>
            </div>
          </div>

          {/* Top Assists */}
          <div className="p-6 md:p-8 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                <span>🎯</span>
                <span className="uppercase tracking-wider">Top Assists Leaderboard</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">Assists</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-gray-900 dark:text-gray-100">1. FOA Player 8 (Arts)</span>
                <span className="text-lg font-black font-mono text-emerald-500">6</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>2. FOS Player 7 (Science)</span>
                <span className="font-mono font-bold text-gray-400">5</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>3. SHK Player 10 (Sharklets)</span>
                <span className="font-mono font-bold text-gray-400">4</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MINI CARDS (Best Defence & Team Form) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Defence */}
          <div className="p-6 md:p-8 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
              <span>🧤</span>
              <span className="uppercase tracking-wider">Defensive Records</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800">
                <div className="text-[10px] text-gray-400 font-bold">Sharklets</div>
                <div className="text-xl font-black text-emerald-500 mt-1">8 GA</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800">
                <div className="text-[10px] text-gray-400 font-bold">Arts</div>
                <div className="text-xl font-black text-blue-500 mt-1">12 GA</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800">
                <div className="text-[10px] text-gray-400 font-bold">Science</div>
                <div className="text-xl font-black text-gray-400 mt-1">14 GA</div>
              </div>
            </div>
          </div>

          {/* Recent Form */}
          <div className="p-6 md:p-8 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
              <span>📈</span>
              <span className="uppercase tracking-wider">Recent Form</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-black/30">
                <span className="font-bold text-gray-900 dark:text-gray-100">Egerton Sharklets</span>
                <div className="flex gap-1 font-mono text-[10px] font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white">D</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">W</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-black/30">
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
        </div>

        {/* 3. WIDE STORY (Key Upcoming Matchday Focus) */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
              <span>📅</span>
              <span className="uppercase tracking-wider">Key Fixture Focus</span>
            </div>
            <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">
              Faculty of Arts vs Egerton Sharklets
            </h4>
            <p className="text-xs text-gray-500">
              Title Decider • Saturday 16:00 • Egerton Pavilion Stadium
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl self-start md:self-auto">
            Matchday 14
          </span>
        </div>

        {/* 4. HISTORICAL CARD (League Champions Roll of Honor) */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
            <span>🏆</span>
            <span className="uppercase tracking-wider">Historical Champions Roll of Honor</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 flex items-center justify-between font-bold">
              <span>2024 / 2025: Egerton Sharklets</span>
              <span className="text-amber-500 font-mono">31 Pts</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800 flex items-center justify-between font-bold">
              <span>2023 / 2024: Faculty of Arts</span>
              <span className="text-amber-500 font-mono">28 Pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
