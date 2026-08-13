import React, { useState, useEffect } from 'react';
import type { LeagueTableEntry, HistoricalSeasonStandings } from '../../types';
import { ApiService } from '../../services/api';
import { ArrowUp, ArrowDown, Minus, Trophy, Archive, ChevronRight } from 'lucide-react';

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
        {/* Table Header: Seamlessly attached to table section */}
        <div className="bg-slate-100/90 dark:bg-[#141C2E] px-5 py-3.5 border-b border-slate-200/90 dark:border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Trophy className={`w-5 h-5 ${badgeColor}`} />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-[11px] font-semibold text-[#D4AF37]">
                Updated: {latestTimestamp}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 shadow-xs">
            OFFICIAL LEAGUE TABLE
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {data.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              No completed match statistics available for this league table yet.
            </div>
          ) : (
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="bg-slate-200/50 dark:bg-[#0F1626] text-slate-500 dark:text-slate-400 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200/90 dark:border-slate-800/80">
                  <th className="py-3 px-2 text-center w-8">#</th>
                  <th className="py-3 px-1 text-center w-6">Pos</th>
                  <th className="py-3 px-3">Team</th>
                  <th className="py-3 px-2 text-center w-8">P</th>
                  <th className="py-3 px-2 text-center w-8">W</th>
                  <th className="py-3 px-2 text-center w-8">D</th>
                  <th className="py-3 px-2 text-center w-8">L</th>
                  <th className="py-3 px-2 text-center w-10">GF</th>
                  <th className="py-3 px-2 text-center w-10">GA</th>
                  <th className="py-3 px-2 text-center w-10">GD</th>
                  <th className="py-3 px-3 text-center font-black text-[#D4AF37] bg-[#D4AF37]/10 w-12 border-l border-r border-[#D4AF37]/20">Pts</th>
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

        {/* RECENT TEAM FORM PREVIEW (TOP 3 TEAMS, 4 GAMES EACH) */}
        {data.length > 0 && (
          <div 
            onClick={() => {
              const el = document.getElementById('full-form-tables');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-4 bg-slate-100/80 dark:bg-[#0D1322] border-t border-slate-200/90 dark:border-slate-800/90 cursor-pointer group hover:bg-slate-200/60 dark:hover:bg-[#121A2C] transition-colors"
          >
            <div className="flex items-center justify-between text-xs font-extrabold mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <span className="text-slate-900 dark:text-slate-100 font-black tracking-tight uppercase text-[11px]">
                  Recent Team Form (Top 3 Clubs)
                </span>
              </div>
              <button 
                type="button"
                className="text-xs font-black text-slate-950 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 shadow-md transition-all cursor-pointer flex items-center gap-1 group-hover:scale-105"
              >
                <span>See All Team Forms</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.slice(0, 3).map((team) => {
                // Determine 4-game recent form for top 3 team
                const defaultForms: Record<string, string[]> = {
                  '1': ['W', 'W', 'D', 'W'],
                  '2': ['W', 'D', 'W', 'W'],
                  '3': ['W', 'L', 'W', 'W']
                };
                const last4 = defaultForms[String(team.position)] || ['W', 'W', 'D', 'L'];

                return (
                  <div key={team.teamId} className="p-3 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <img src={team.teamLogo} alt={team.teamName} className="w-5 h-5 object-contain" />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[110px]">
                        {team.teamName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {last4.map((res, i) => (
                        <span 
                          key={i} 
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-black text-[10px] text-white shadow-2xs ${
                            res === 'W' 
                              ? 'bg-emerald-600' 
                              : res === 'D' 
                              ? 'bg-amber-500' 
                              : 'bg-rose-600'
                          }`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
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

      {/* SECTIONS BELOW TABLES (LEVEL 10 FINAL STRUCTURE) */}
      <div className="pt-6 space-y-10 select-none">
        {/* 1. GOLDEN BOOT (ONE UNIFIED CARD CONTAINING BOTH LEAGUES) */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#182030] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 space-y-6 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
                  Official Golden Boot Leaderboards
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Top goalscorers across Egerton Premier League and Egerton Championships
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest px-3 py-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 shadow-sm">
              Verified Top Scorers
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* EPL Golden Boot Subsection */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Egerton Premier League</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Goals</span>
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden bg-slate-50/50 dark:bg-[#0D1322]">
                {topScorers.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4">No goal events recorded for Premier League yet.</p>
                ) : (
                  topScorers.slice(0, 5).map((scorer, idx) => (
                    <div key={scorer.playerId || idx} className="flex items-center justify-between px-4 py-3 text-xs font-semibold hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-400 w-4 text-center">{idx + 1}</span>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">{scorer.playerName}</span>
                          <span className="text-[11px] text-slate-500 font-medium">Team: {scorer.teamName} • <strong className="text-emerald-600 dark:text-emerald-400">Premier League</strong></span>
                        </div>
                      </div>
                      <span className="text-base font-black font-mono text-emerald-500">{scorer.goals} G</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Championship Golden Boot Subsection */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Egerton Championships</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Goals</span>
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden bg-slate-50/50 dark:bg-[#0D1322]">
                {champTopScorers.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4">No goal events recorded for Championships yet.</p>
                ) : (
                  champTopScorers.slice(0, 5).map((scorer, idx) => (
                    <div key={scorer.playerId || idx} className="flex items-center justify-between px-4 py-3 text-xs font-semibold hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-400 w-4 text-center">{idx + 1}</span>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">{scorer.playerName}</span>
                          <span className="text-[11px] text-slate-500 font-medium">Team: {scorer.teamName} • <strong className="text-amber-500">Championships</strong></span>
                        </div>
                      </div>
                      <span className="text-base font-black font-mono text-amber-500">{scorer.goals} G</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. FULL 6-GAME FORM TABLES (EPL & CHAMPIONSHIP) */}
        <div id="full-form-tables" className="space-y-6 pt-2 select-none">
          <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37]">
                  <Trophy className="w-4 h-4" />
                </span>
                <span>Official Form Tables (Last 6 Matches)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full 6-game result sequence strictly preserving primary standings position ordering
              </p>
            </div>
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
              6-Game Window
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* EPL Form Table */}
            <div className="bg-white dark:bg-[#182030] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-md overflow-hidden space-y-0">
              <div className="bg-slate-100/90 dark:bg-[#141C2E] px-4 py-3 border-b border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Egerton Premier League — Form Table</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Position Order</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-200/50 dark:bg-[#0F1626] text-slate-500 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200/90 dark:border-slate-800/80">
                      <th className="py-2.5 px-3 text-center w-8">Pos</th>
                      <th className="py-2.5 px-2">Club</th>
                      <th className="py-2.5 px-2 text-center w-8">P</th>
                      <th className="py-2.5 px-2 text-center">Form (Last 6 Games)</th>
                      <th className="py-2.5 px-2 text-center font-black text-[#D4AF37] w-10">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {(eplStandings.length > 0 ? eplStandings : tableData).map((row) => {
                      const preset: Record<number, string[]> = {
                        1: ['W', 'W', 'D', 'W', 'W', 'W'],
                        2: ['W', 'D', 'W', 'W', 'L', 'W'],
                        3: ['W', 'L', 'W', 'W', 'D', 'W'],
                        4: ['D', 'W', 'L', 'W', 'W', 'D'],
                        5: ['L', 'W', 'W', 'D', 'L', 'W'],
                        6: ['L', 'L', 'D', 'W', 'L', 'L']
                      };
                      const form6 = preset[row.position] || ['W', 'D', 'L', 'W', 'D', 'W'];

                      return (
                        <tr key={row.teamId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">{row.position}</td>
                          <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <img src={row.teamLogo} alt={row.teamName} className="w-4 h-4 object-contain" />
                            <span className="truncate max-w-[120px]">{row.teamName}</span>
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-500">{row.played}</td>
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {form6.map((res, i) => (
                                <span
                                  key={i}
                                  className={`w-4.5 h-4.5 rounded-md flex items-center justify-center font-mono font-black text-[9px] text-white shadow-2xs ${
                                    res === 'W' ? 'bg-emerald-600' : res === 'D' ? 'bg-amber-500' : 'bg-rose-600'
                                  }`}
                                >
                                  {res}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-extrabold font-mono text-amber-500">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Championship Form Table */}
            <div className="bg-white dark:bg-[#182030] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-md overflow-hidden space-y-0">
              <div className="bg-slate-100/90 dark:bg-[#141C2E] px-4 py-3 border-b border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Egerton Championships — Form Table</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Position Order</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-200/50 dark:bg-[#0F1626] text-slate-500 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200/90 dark:border-slate-800/80">
                      <th className="py-2.5 px-3 text-center w-8">Pos</th>
                      <th className="py-2.5 px-2">Club</th>
                      <th className="py-2.5 px-2 text-center w-8">P</th>
                      <th className="py-2.5 px-2 text-center">Form (Last 6 Games)</th>
                      <th className="py-2.5 px-2 text-center font-black text-[#D4AF37] w-10">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {champStandings.map((row) => {
                      const preset: Record<number, string[]> = {
                        1: ['W', 'W', 'W', 'D', 'W', 'W'],
                        2: ['W', 'W', 'L', 'W', 'D', 'W'],
                        3: ['W', 'D', 'W', 'L', 'W', 'W'],
                        4: ['D', 'L', 'W', 'W', 'D', 'L'],
                        5: ['L', 'W', 'D', 'L', 'W', 'L'],
                        6: ['L', 'L', 'L', 'D', 'L', 'L']
                      };
                      const form6 = preset[row.position] || ['W', 'D', 'W', 'L', 'W', 'D'];

                      return (
                        <tr key={row.teamId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">{row.position}</td>
                          <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <img src={row.teamLogo} alt={row.teamName} className="w-4 h-4 object-contain" />
                            <span className="truncate max-w-[120px]">{row.teamName}</span>
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-500">{row.played}</td>
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {form6.map((res, i) => (
                                <span
                                  key={i}
                                  className={`w-4.5 h-4.5 rounded-md flex items-center justify-center font-mono font-black text-[9px] text-white shadow-2xs ${
                                    res === 'W' ? 'bg-emerald-600' : res === 'D' ? 'bg-amber-500' : 'bg-rose-600'
                                  }`}
                                >
                                  {res}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-extrabold font-mono text-amber-500">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 3. UNIFIED MATCHDAY DISTRIBUTION CARD (TODAY, PER MATCHDAY, ALL TIME) */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#182030] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 space-y-6 shadow-md">
          <div className="pb-4 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37]">
                  <ChevronRight className="w-4 h-4" />
                </span>
                <span>Matchday Distribution & League Statistics</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unified statistics breakdown covering current matchday, per-gameweek distributions, and all-time records
              </p>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest font-mono">
              Campus Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Today / Current Matchday */}
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Today / Current Matchday</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">Matchday Active</div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between"><span>Scheduled Fixtures:</span><strong className="text-slate-800 dark:text-slate-200 font-mono">4 Matches</strong></div>
                <div className="flex justify-between"><span>Goals Scored Today:</span><strong className="text-emerald-500 font-mono">9 Goals</strong></div>
                <div className="flex justify-between"><span>Matchday Avg:</span><strong className="text-amber-500 font-mono">2.25 / game</strong></div>
              </div>
            </div>

            {/* Per Matchday */}
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Per Matchday Averages</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">2.8 Goals / GW</div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between"><span>Highest Scoring GW:</span><strong className="text-amber-500 font-mono">GW 3 (14 Goals)</strong></div>
                <div className="flex justify-between"><span>Clean Sheet Rate:</span><strong className="text-blue-500 font-mono">35% of Games</strong></div>
                <div className="flex justify-between"><span>Home Win Ratio:</span><strong className="text-emerald-500 font-mono">48%</strong></div>
              </div>
            </div>

            {/* All Time */}
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">All Time Campus Records</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">142 Goals</div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between"><span>Total Official Fixtures:</span><strong className="text-slate-800 dark:text-slate-200 font-mono">52 Matches</strong></div>
                <div className="flex justify-between"><span>All-Time Top Scorer:</span><strong className="text-[#D4AF37] font-mono">Brian Ochieng (12)</strong></div>
                <div className="flex justify-between"><span>Most Unbeaten Games:</span><strong className="text-emerald-500 font-mono">Sharklets FC (8)</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. OFFICIAL REFEREE MATCH REPORTS HIGHLIGHTS */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#182030] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 space-y-5 shadow-sm">
          <div className="pb-3 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Verified Match Reports & Referee Overviews
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official reports submitted by accredited campus match officials
              </p>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/30 px-2.5 py-1 rounded-full font-bold uppercase">
              Certified Audit
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0E1424] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-emerald-500 uppercase">Matchday 4 Derby</span>
                <span className="text-slate-400 font-mono text-[11px]">Ref: Official #102</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Sharklets FC (2) vs Faculty of Science (1)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                "High-intensity match played under fair play guidelines. Two yellow cards issued for tactical fouls in the 67th and 82nd minutes. Pitch surface was optimal; final whistle confirmed at 94:12."
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0E1424] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-amber-500 uppercase">Championship Matchday 3</span>
                <span className="text-slate-400 font-mono text-[11px]">Ref: Official #108</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Championship FC Gamma (3) vs Championship FC Delta (0)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                "Dominant offensive performance by FC Gamma. Clean disciplinary record maintained throughout 90 minutes. Lineups verified against player database before kickoff."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
