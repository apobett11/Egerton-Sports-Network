import React, { useState, useEffect } from 'react';
import type { LeagueTableEntry, HistoricalSeasonStandings } from '../../types';
import { ApiService } from '../../services/api';
import { ArrowUp, ArrowDown, Minus, Trophy, Archive } from 'lucide-react';

interface LeagueTableProps {
  tableData: LeagueTableEntry[];
  title?: string;
  allowHistoricalView?: boolean;
  selectedCompetitionId?: string;
}

const EPL_COMP_ID = '11111111-1111-1111-1111-111111111111';
const CHAMP_COMP_ID = '22222222-2222-2222-2222-222222222222';

export const LeagueTable: React.FC<LeagueTableProps> = ({
  tableData,
  allowHistoricalView = true,
  selectedCompetitionId = 'all'
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'historical'>('current');
  const [activeCompTab, setActiveCompTab] = useState<'epl' | 'champ'>('epl');
  
  const [eplStandings, setEplStandings] = useState<LeagueTableEntry[]>([]);
  const [champStandings, setChampStandings] = useState<LeagueTableEntry[]>([]);

  const [historicalSeasons, setHistoricalSeasons] = useState<HistoricalSeasonStandings[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [topScorers, setTopScorers] = useState<Array<{ playerId: string; playerName: string; teamName: string; teamLogo: string; goals: number }>>([]);
  const [champTopScorers, setChampTopScorers] = useState<Array<{ playerId: string; playerName: string; teamName: string; teamLogo: string; goals: number }>>([]);

  useEffect(() => {
    // Sync activeCompTab if prop changes
    if (selectedCompetitionId === CHAMP_COMP_ID) {
      setActiveCompTab('champ');
    } else if (selectedCompetitionId === EPL_COMP_ID) {
      setActiveCompTab('epl');
    }
  }, [selectedCompetitionId]);

  useEffect(() => {
    // Fetch live standings for both competitions from database
    ApiService.getLeagueTable(EPL_COMP_ID).then((res) => {
      if (res.data && res.data.length > 0) setEplStandings(res.data);
      else setEplStandings(tableData);
    });

    ApiService.getLeagueTable(CHAMP_COMP_ID).then((res) => {
      if (res.data && res.data.length > 0) setChampStandings(res.data);
    });

    if (allowHistoricalView) {
      ApiService.getHistoricalStandings().then((res) => {
        if (res.data && res.data.length > 0) {
          setHistoricalSeasons(res.data);
          setSelectedSeasonId(res.data[0].seasonId);
        }
      });
    }

    // Top scorers per competition
    ApiService.getTopScorers(EPL_COMP_ID).then((res) => {
      if (res.data) setTopScorers(res.data);
    });
    ApiService.getTopScorers(CHAMP_COMP_ID).then((res) => {
      if (res.data) setChampTopScorers(res.data);
    });
  }, [allowHistoricalView, tableData]);

  const activeSeasonData = historicalSeasons.find((s) => s.seasonId === selectedSeasonId);

  const currentCompData = activeCompTab === 'champ'
    ? (champStandings.length > 0 ? champStandings : tableData)
    : (eplStandings.length > 0 ? eplStandings : tableData);

  const displayData: LeagueTableEntry[] = activeTab === 'historical' && activeSeasonData
    ? activeSeasonData.entries
    : currentCompData;

  // Defensive records computed strictly from live database standings
  const defensiveRecords = [...displayData].sort((a, b) => a.goalsAgainst - b.goalsAgainst).slice(0, 3);

  const renderTable = (title: string, data: LeagueTableEntry[], badgeColor: string) => {
    const latestTimestamp = data.length > 0 && data[0].lastUpdated
      ? new Date(data[0].lastUpdated!).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
      : new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

    return (
      <div className="bg-white dark:bg-[#182030] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-md overflow-hidden select-none space-y-0">
        {/* Table Header */}
        <div className="bg-slate-50 dark:bg-[#0D121F]/90 px-5 py-4 border-b border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className={`w-5 h-5 ${badgeColor}`} />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            OFFICIAL TABLE
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {data.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs font-semibold">
              No completed match statistics available for this league table yet.
            </div>
          ) : (
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
          )}
        </div>

        {/* POSITIONAL CHANGES ANALYTICS WITHIN TABLE */}
        {data.length > 0 && (
          <div className="p-4 bg-gray-50/70 dark:bg-black/20 border-t border-gray-200/80 dark:border-gray-800">
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2.5">
              Positional Analytics
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
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 select-none pb-12">
      {/* Dual Competition Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-[#0E1424] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-sm">
            <Trophy className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="font-black text-xl text-slate-900 dark:text-slate-100 tracking-tight">
              Official Campus League Standings
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Live standings for Egerton Premier League and Egerton Championships
            </p>
          </div>
        </div>

        {/* Historical View Toggle */}
        {allowHistoricalView && historicalSeasons.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'current'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Live Standings
            </button>
            <button
              onClick={() => setActiveTab('historical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'historical'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
        )}
      </div>

      {/* 1. EGERTON PREMIER LEAGUE TABLE */}
      <section space-y-4 aria-label="Egerton Premier League Table">
        {renderTable('Egerton Premier League Table', eplStandings.length > 0 ? eplStandings : tableData, 'text-emerald-500')}
      </section>

      {/* 2. EGERTON CHAMPIONSHIPS TABLE */}
      <section space-y-4 aria-label="Egerton Championships Table">
        {renderTable('Egerton Championships Table', champStandings, 'text-amber-500')}
      </section>

      {/* SECTIONS BELOW TABLES (Top Scorers per competition) */}
      <div className="pt-4 space-y-8 select-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EPL Top Scorers */}
          <div className="p-6 bg-white dark:bg-[#182030] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase tracking-wider">
                <span>⚽</span>
                <span>Egerton Premier League — Top Scorers</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Goals</span>
            </div>
            {topScorers.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No goal events recorded for Premier League yet.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {topScorers.slice(0, 5).map((scorer, idx) => (
                  <div key={scorer.playerId || idx} className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900 dark:text-slate-100">
                      {idx + 1}. {scorer.playerName} ({scorer.teamName})
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-500">{scorer.goals}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Championship Top Scorers */}
          <div className="p-6 bg-white dark:bg-[#182030] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-wider">
                <span>⚽</span>
                <span>Egerton Championships — Top Scorers</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Goals</span>
            </div>
            {champTopScorers.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No goal events recorded for Championships yet.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {champTopScorers.slice(0, 5).map((scorer, idx) => (
                  <div key={scorer.playerId || idx} className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900 dark:text-slate-100">
                      {idx + 1}. {scorer.playerName} ({scorer.teamName})
                    </span>
                    <span className="text-sm font-black font-mono text-amber-500">{scorer.goals}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
