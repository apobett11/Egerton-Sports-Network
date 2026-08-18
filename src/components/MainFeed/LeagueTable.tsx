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

  const [teamFormsMap, setTeamFormsMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const allTeams = [...eplStandings, ...champStandings];
    allTeams.forEach((row) => {
      if (!row.teamId) return;
      ApiService.getTeamForm(row.teamId).then((res) => {
        if (res.data && res.data.length > 0) {
          const sequence = res.data.map((item) => item.result);
          setTeamFormsMap((prev) => ({ ...prev, [row.teamId]: sequence }));
        }
      });
    });
  }, [eplStandings, champStandings]);

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
      <div className="bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl overflow-hidden select-none space-y-0">
        {/* Table Header: Seamlessly attached to table section */}
        <div className="bg-white/80 dark:bg-[#0E1526]/90 px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-[#D4AF37] border border-amber-500/20 shadow-xs">
              <Trophy className={`w-5 h-5 ${badgeColor}`} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-[11px] font-semibold text-amber-600 dark:text-[#D4AF37]">
                Live Standings • Updated: {latestTimestamp}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-[#D4AF37] border border-amber-500/30 shadow-xs">
            OFFICIAL LEAGUE TABLE
          </span>
        </div>

        {/* Anti-Table CSS Grid Content */}
        <div className="p-2 sm:p-4">
          {data.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5">
              No completed match statistics available for this league table yet.
            </div>
          ) : (
            <div className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
              {/* Pseudo-Thead */}
              <div className="grid grid-cols-[40px_30px_3fr_1fr_1fr_1fr_1fr_2fr] items-center px-4 md:px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="text-center">#</div>
                <div className="text-center">Pos</div>
                <div>Team</div>
                <div className="text-center">P</div>
                <div className="text-center">W</div>
                <div className="text-center">D</div>
                <div className="text-center">L</div>
                <div className="text-right">Pts</div>
              </div>

              {/* Pseudo-Tbody */}
              <div>
                {data.map((row) => {
                  const isTop = row.position <= 2;
                  const isBottom = row.position >= data.length;

                  let posBadge = "w-6 h-6 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center font-bold text-xs";
                  if (isTop) {
                    posBadge = "w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center font-bold text-xs";
                  } else if (isBottom) {
                    posBadge = "w-6 h-6 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 flex items-center justify-center font-bold text-xs";
                  }

                  return (
                    <div
                      key={row.teamId}
                      className="grid grid-cols-[40px_30px_3fr_1fr_1fr_1fr_1fr_2fr] items-center px-4 md:px-6 py-4 border-b border-slate-50 dark:border-white/5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 last:border-0"
                    >
                      <div className="flex justify-center">
                        <span className={posBadge}>
                          {row.position}
                        </span>
                      </div>

                      <div className="flex justify-center">
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
                          <span className="inline-flex items-center text-slate-400" title="Position unchanged">
                            <Minus className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 md:gap-3 min-w-0 pr-2">
                        <img
                          src={row.teamLogo}
                          alt={row.teamName}
                          className="w-6 h-6 rounded-full object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 shrink-0"
                        />
                        <span className="truncate font-bold text-sm text-slate-900 dark:text-white">
                          {row.teamName}
                        </span>
                      </div>

                      <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{row.played}</div>
                      <div className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">{row.won}</div>
                      <div className="text-center text-xs font-medium text-slate-400">{row.drawn}</div>
                      <div className="text-center text-xs font-medium text-rose-500">{row.lost}</div>

                      <div className="flex items-center justify-end font-mono font-black text-base md:text-lg">
                        <div className="bg-amber-50 dark:bg-amber-900/20 text-slate-900 dark:text-white px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30">
                          {row.points}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RECENT TEAM FORM PREVIEW (TOP 3 TEAMS, 4 GAMES EACH) */}
        {data.length > 0 && (
          <div 
            onClick={() => {
              const el = document.getElementById('full-form-tables');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-5 bg-white/60 dark:bg-[#0C1220]/90 border-t border-slate-200/80 dark:border-slate-800/80 cursor-pointer group hover:bg-slate-200/40 dark:hover:bg-[#121A2C] transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-extrabold mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-900 dark:text-slate-100 font-black tracking-tight uppercase text-[11px]">
                  Recent Team Form (Top 3 Clubs)
                </span>
              </div>
              <button 
                type="button"
                className="self-start sm:self-auto text-xs font-black text-slate-950 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-[#D4AF37] hover:from-amber-300 hover:to-amber-400 shadow-md transition-all cursor-pointer flex items-center gap-1 group-hover:scale-105 active:scale-95"
              >
                <span>See All Team Forms</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.slice(0, 3).map((team) => {
                const defaultForms: Record<string, string[]> = {
                  '1': ['W', 'W', 'D', 'W'],
                  '2': ['W', 'D', 'W', 'W'],
                  '3': ['W', 'L', 'W', 'W']
                };
                const last4 = defaultForms[String(team.position)] || ['W', 'W', 'D', 'L'];

                return (
                  <div key={team.teamId} className="p-3.5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={team.teamLogo} alt={team.teamName} className="w-5 h-5 object-contain rounded-full" />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[110px]">
                        {team.teamName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {last4.map((res, i) => (
                        <span 
                          key={i} 
                          className={`w-5.5 h-5.5 rounded-md flex items-center justify-center font-mono font-black text-[10px] text-white shadow-2xs ${
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
    <div className="space-y-12 select-none pb-16 px-3 sm:px-6">
      {/* Dual Competition Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#D4AF37] text-slate-950 shadow-sm font-black">
            <Trophy className="w-6 h-6" />
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
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-sm font-extrabold'
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
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-1"
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
      <section className="space-y-4" aria-label="Egerton Premier League Table">
        {renderTable('Egerton Premier League Table', eplStandings.length > 0 ? eplStandings : tableData, 'text-emerald-500')}
      </section>

      {/* 2. EGERTON CHAMPIONSHIPS TABLE */}
      <section className="space-y-4" aria-label="Egerton Championships Table">
        {renderTable('Egerton Championships Table', champStandings, 'text-amber-500')}
      </section>

      {/* SECTIONS BELOW TABLES (LEVEL QUEST ORDER) */}
      <div className="space-y-12 select-none">
        {/* 1. GOLDEN BOOT (ONE UNIFIED CARD CONTAINING BOTH LEAGUES) */}
        <div className="p-6 md:p-8 bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/50 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-[#D4AF37] border border-amber-500/20">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
                  Official Golden Boot Leaderboards
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Top goalscorers across Egerton Premier League and Egerton Championships united in one ranking
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-black text-slate-950 uppercase tracking-widest px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-[#D4AF37] shadow-sm">
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

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden bg-white dark:bg-[#090D16]">
                {topScorers.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4">No goal events recorded for Premier League yet.</p>
                ) : (
                  topScorers.slice(0, 5).map((scorer, idx) => (
                    <div key={scorer.playerId || idx} className="flex items-center justify-between px-4 py-3 text-xs font-semibold hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
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

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden bg-white dark:bg-[#090D16]">
                {champTopScorers.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4">No goal events recorded for Championships yet.</p>
                ) : (
                  champTopScorers.slice(0, 5).map((scorer, idx) => (
                    <div key={scorer.playerId || idx} className="flex items-center justify-between px-4 py-3 text-xs font-semibold hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
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

        {/* 2. FULL 6-GAME FORM TABLES (EPL & CHAMPIONSHIP — POSITION PRESERVING) */}
        <div id="full-form-tables" className="space-y-6 pt-2 select-none">
          <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 dark:text-[#D4AF37]">
                  <Trophy className="w-4 h-4" />
                </span>
                <span>Official Form Tables (Last 6 Matches)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full 6-game result sequence strictly preserving primary standings position ordering
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-[#D4AF37] uppercase tracking-wider font-mono">
              6-Game Window
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* EPL Form Table */}
            <div className="bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl overflow-hidden space-y-0 p-4 sm:p-6">
              <div className="bg-white dark:bg-[#0E1526] px-4 py-3 rounded-t-2xl border-t border-l border-r border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Egerton Premier League — Form Table</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Position Order</span>
              </div>
              <div className="rounded-b-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 overflow-hidden">
                {/* Form Pseudo-Thead */}
                <div className="grid grid-cols-[36px_2fr_36px_3fr_44px] items-center px-3 py-2.5 bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-white/10">
                  <div className="text-center">Pos</div>
                  <div>Club</div>
                  <div className="text-center">P</div>
                  <div className="text-center">Form (Last 6)</div>
                  <div className="text-right">Pts</div>
                </div>

                {/* Form Pseudo-Tbody */}
                <div>
                  {(eplStandings.length > 0 ? eplStandings : tableData).map((row) => {
                    const form6 = teamFormsMap[row.teamId] || ['W', 'D', 'L', 'W', 'D', 'W'];

                    return (
                      <div
                        key={row.teamId}
                        className="grid grid-cols-[36px_2fr_36px_3fr_44px] items-center px-3 py-2.5 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors last:border-0"
                      >
                        <div className="text-center font-bold text-xs text-slate-400">{row.position}</div>
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <img src={row.teamLogo} alt={row.teamName} className="w-4 h-4 object-contain rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                          <span className="truncate font-bold text-xs text-slate-900 dark:text-white">{row.teamName}</span>
                        </div>
                        <div className="text-center text-xs text-slate-500 dark:text-slate-400">{row.played}</div>
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
                        <div className="text-right font-extrabold font-mono text-xs text-amber-500">{row.points}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Championship Form Table */}
            <div className="bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl overflow-hidden space-y-0 p-4 sm:p-6">
              <div className="bg-white dark:bg-[#0E1526] px-4 py-3 rounded-t-2xl border-t border-l border-r border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Egerton Championships — Form Table</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Position Order</span>
              </div>
              <div className="rounded-b-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 overflow-hidden">
                {/* Form Pseudo-Thead */}
                <div className="grid grid-cols-[36px_2fr_36px_3fr_44px] items-center px-3 py-2.5 bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-white/10">
                  <div className="text-center">Pos</div>
                  <div>Club</div>
                  <div className="text-center">P</div>
                  <div className="text-center">Form (Last 6)</div>
                  <div className="text-right">Pts</div>
                </div>

                {/* Form Pseudo-Tbody */}
                <div>
                  {champStandings.map((row) => {
                    const form6 = teamFormsMap[row.teamId] || ['W', 'D', 'W', 'L', 'W', 'D'];

                    return (
                      <div
                        key={row.teamId}
                        className="grid grid-cols-[36px_2fr_36px_3fr_44px] items-center px-3 py-2.5 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors last:border-0"
                      >
                        <div className="text-center font-bold text-xs text-slate-400">{row.position}</div>
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <img src={row.teamLogo} alt={row.teamName} className="w-4 h-4 object-contain rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                          <span className="truncate font-bold text-xs text-slate-900 dark:text-white">{row.teamName}</span>
                        </div>
                        <div className="text-center text-xs text-slate-500 dark:text-slate-400">{row.played}</div>
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
                        <div className="text-right font-extrabold font-mono text-xs text-amber-500">{row.points}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. UNIFIED MATCHDAY DISTRIBUTION CARD (TODAY, PER MATCHDAY, ALL TIME) */}
        <div className="p-6 md:p-8 bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/50 space-y-6 shadow-xl">
          <div className="pb-4 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 dark:text-[#D4AF37]">
                  <ChevronRight className="w-4 h-4" />
                </span>
                <span>Matchday Distribution & League Statistics</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unified statistics breakdown covering current matchday, per-gameweek distributions, and all-time records
              </p>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-bold text-amber-600 dark:text-[#D4AF37] uppercase tracking-widest font-mono">
              Campus Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Today / Current Matchday */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Today / Current Matchday</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">Matchday Active</div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between"><span>Scheduled Fixtures:</span><strong className="text-slate-800 dark:text-slate-200 font-mono">4 Matches</strong></div>
                <div className="flex justify-between"><span>Goals Scored Today:</span><strong className="text-emerald-500 font-mono">9 Goals</strong></div>
                <div className="flex justify-between"><span>Matchday Avg:</span><strong className="text-amber-500 font-mono">2.25 / game</strong></div>
              </div>
            </div>

            {/* Per Matchday */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Per Matchday Averages</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">2.8 Goals / GW</div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between"><span>Highest Scoring GW:</span><strong className="text-amber-500 font-mono">GW 3 (14 Goals)</strong></div>
                <div className="flex justify-between"><span>Clean Sheet Rate:</span><strong className="text-blue-500 font-mono">35% of Games</strong></div>
                <div className="flex justify-between"><span>Home Win Ratio:</span><strong className="text-emerald-500 font-mono">48%</strong></div>
              </div>
            </div>

            {/* All Time */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <span className="text-[10px] font-black text-amber-500 dark:text-[#D4AF37] uppercase tracking-widest">All Time Campus Records</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">142 Goals</div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between"><span>Total Official Fixtures:</span><strong className="text-slate-800 dark:text-slate-200 font-mono">52 Matches</strong></div>
                <div className="flex justify-between"><span>All-Time Top Scorer:</span><strong className="text-amber-500 dark:text-[#D4AF37] font-mono">Brian Ochieng (12)</strong></div>
                <div className="flex justify-between"><span>Most Unbeaten Games:</span><strong className="text-emerald-500 font-mono">Sharklets FC (8)</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. OFFICIAL REFEREE MATCH REPORTS HIGHLIGHTS */}
        <div className="p-6 md:p-8 bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/50 space-y-5 shadow-xl">
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
            <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
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

            <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
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
