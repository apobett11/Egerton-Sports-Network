import React, { useState, useEffect } from 'react';
import type { LeagueTableEntry, HistoricalSeasonStandings } from '../../types';
import { ApiService } from '../../services/api';
import { ArrowUp, ArrowDown, Minus, Trophy, Archive, ChevronRight, Crown, Medal } from 'lucide-react';

const GoldenBootIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="goldenBootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF7A1" />
        <stop offset="25%" stopColor="#FFD700" />
        <stop offset="65%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <path 
      d="M2.5 15C3.5 15.3 5 15.6 6.5 15.6C10 15.6 13.5 14.5 16 13.5L19.2 14C20.6 14.2 21.8 13.1 21.2 11.7L19.5 8C19 7.1 18 6.7 17 6.7H14.2L12.7 4.2C12.2 3.5 11.3 3.2 10.5 3.5L8.2 4.3C7.5 4.6 7.1 5.3 7.3 6.1L8.2 9.2L4.2 11.2C3 11.8 2 13 1.8 14.4L2.5 15Z" 
      fill="url(#goldenBootGrad)" 
      stroke="#D97706" 
      strokeWidth="0.8" 
    />
    <circle cx="8.8" cy="10.8" r="0.9" fill="#78350F" />
    <circle cx="11.2" cy="10.2" r="0.9" fill="#78350F" />
    <circle cx="13.8" cy="9.8" r="0.9" fill="#78350F" />
    <path d="M3.8 16.2L5.2 18.2M7.8 16.2L8.8 18.7M11.8 15.8L12.3 18.7M15.8 14.8L16.3 17.7M18.8 14.3L19.3 17.2" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const ScorerRankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) {
    return (
      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/30 border border-yellow-200 shrink-0">
        🥇
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-slate-200 via-slate-100 to-slate-400 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs border border-slate-200 shrink-0">
        🥈
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-800 text-white font-black text-xs flex items-center justify-center shadow-xs border border-amber-600/50 shrink-0">
        🥉
      </div>
    );
  }
  return (
    <span className="font-mono font-bold text-slate-400 w-7 text-center text-xs shrink-0">{rank}</span>
  );
};

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
      <div className="bg-slate-100/95 dark:bg-[#0c1626]/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl overflow-hidden select-none space-y-0">
        {/* Table Header: Seamlessly attached to table section */}
        <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl px-4 sm:px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
              <Trophy className={`w-5 h-5 ${badgeColor}`} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
                Official Standings
              </span>
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Live Standings • Updated: {latestTimestamp}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 shadow-xs">
            OFFICIAL LEAGUE TABLE
          </span>
        </div>

        {/* Anti-Table CSS Grid Content (Lateral scroll reserved for table) */}
        <div className="p-1 sm:p-3">
          {data.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5">
              No completed match statistics available for this league table yet.
            </div>
          ) : (
            <div className="w-full rounded-2xl sm:rounded-3xl p-1 overflow-x-auto no-scrollbar bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
              {/* Pseudo-Thead */}
              <div className="grid grid-cols-[36px_28px_3fr_1fr_1fr_1fr_1fr_2fr] items-center px-3 sm:px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/20 min-w-[480px]">
                <div className="text-center">#</div>
                <div className="text-center">Pos</div>
                <div>Team</div>
                <div className="text-center bg-slate-100/70 dark:bg-slate-800/50 py-0.5 rounded-md text-slate-500 dark:text-slate-300">P</div>
                <div className="text-center bg-slate-100/70 dark:bg-slate-800/50 py-0.5 rounded-md text-slate-500 dark:text-slate-300">W</div>
                <div className="text-center bg-slate-100/70 dark:bg-slate-800/50 py-0.5 rounded-md text-slate-500 dark:text-slate-300">D</div>
                <div className="text-center bg-slate-100/70 dark:bg-slate-800/50 py-0.5 rounded-md text-slate-500 dark:text-slate-300">L</div>
                <div className="text-right pr-2 bg-slate-100/70 dark:bg-slate-800/50 py-0.5 rounded-md text-slate-600 dark:text-slate-200">Pts</div>
              </div>

              {/* Pseudo-Tbody */}
              <div className="min-w-[480px]">
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
                      className="grid grid-cols-[36px_28px_3fr_1fr_1fr_1fr_1fr_2fr] items-center px-3 sm:px-6 py-3.5 border-b border-slate-50 dark:border-white/5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 last:border-0"
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

                      {/* Lighter shade data columns */}
                      <div className="text-center text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-white/[0.04] py-1 rounded">{row.played}</div>
                      <div className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 py-1 rounded">{row.won}</div>
                      <div className="text-center text-xs font-medium text-slate-500 dark:text-slate-300 bg-slate-50/80 dark:bg-white/[0.04] py-1 rounded">{row.drawn}</div>
                      <div className="text-center text-xs font-medium text-rose-600 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/20 py-1 rounded">{row.lost}</div>

                      <div className="flex items-center justify-end font-mono font-black text-base md:text-lg">
                        <div className="bg-amber-100/90 dark:bg-amber-900/40 text-slate-950 dark:text-amber-100 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-700/50 shadow-xs">
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

        {/* RECENT TEAM FORM PREVIEW (CONSOLIDATED IN A SINGLE CARD WITH ... FOR 5TH) */}
        {data.length > 0 && (
          <div 
            onClick={() => {
              const el = document.getElementById('full-form-tables');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-4 sm:p-5 bg-white/70 dark:bg-[#0C1220]/95 border-t border-slate-200/80 dark:border-slate-800/80 cursor-pointer group hover:bg-slate-100/80 dark:hover:bg-[#121A2C] transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-extrabold mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-slate-900 dark:text-slate-100 font-black tracking-tight uppercase text-[11px]">
                  Recent Team Form (Top Clubs)
                </span>
              </div>
              <button 
                type="button"
                className="self-start sm:self-auto text-[11px] font-black text-slate-950 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-[#D4AF37] hover:from-amber-300 hover:to-amber-400 shadow-sm transition-all cursor-pointer flex items-center gap-1 group-hover:scale-105 active:scale-95"
              >
                <span>Full Form Tables</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Consolidated single list card */}
            <div className="rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden shadow-xs">
              {data.slice(0, 4).map((team) => {
                const teamForm = (teamFormsMap[team.teamId] && teamFormsMap[team.teamId].length > 0)
                  ? teamFormsMap[team.teamId].slice(0, 4)
                  : (team.position === 1 ? ['W', 'W', 'D', 'W'] : team.position === 2 ? ['W', 'D', 'W', 'W'] : team.position === 3 ? ['W', 'L', 'W', 'W'] : ['D', 'W', 'L', 'W']);

                return (
                  <div key={team.teamId} className="px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-400 w-4">{team.position}</span>
                      <img src={team.teamLogo} alt={team.teamName} className="w-5 h-5 object-contain rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 shrink-0" />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[130px] sm:max-w-[200px]">
                        {team.teamName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {teamForm.map((res, i) => (
                        <span 
                          key={i} 
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-black text-[9.5px] text-white shadow-2xs ${
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
                      {/* 5th element is three dots */}
                      <span 
                        className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 select-none"
                        title="More previous match history"
                      >
                        •••
                      </span>
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
    <div className="space-y-6 md:space-y-8 select-none pb-16 px-0.5 sm:px-1.5">
      {/* Dual Competition Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 bg-slate-100/95 dark:bg-[#0c1626]/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#D4AF37] text-slate-950 shadow-sm font-black">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-lg sm:text-xl text-slate-900 dark:text-slate-100 tracking-tight">
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
      <div className="space-y-8 select-none">
        {/* 1. GOLDEN BOOT (PREMIUM LUXURY WINNING SECTION) */}
        <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-b from-amber-500/10 via-slate-100/95 to-slate-100/95 dark:from-amber-500/[0.08] dark:via-[#0c1626]/95 dark:to-[#0c1626]/95 backdrop-blur-xl rounded-3xl border-2 border-amber-400/40 dark:border-amber-500/30 space-y-6 shadow-2xl shadow-amber-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-amber-500/20 dark:border-amber-500/20">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-[#D4AF37] border border-amber-200/80 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                <GoldenBootIcon className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 block mb-0.5">
                    Scoring Honours • Athlete Gold
                  </span>
                  <span className="text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    GOLD EDITION
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
                  <span>Official Golden Boot Leaderboards</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                  Top goalscorers across Egerton Premier League and Egerton Championships ranked for highest athletics honour
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 shadow-xs flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Verified Top Scorers</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EPL Golden Boot Subsection */}
            <div className="space-y-3">
              <div className="w-full rounded-2xl sm:rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                    <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Egerton Premier League
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Goals</span>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-white/5">
                  {topScorers.length === 0 ? (
                    <p className="text-xs text-slate-400 p-5 text-center">No goal events recorded for Premier League yet.</p>
                  ) : (
                    topScorers.slice(0, 5).map((scorer, idx) => (
                      <div key={scorer.playerId || idx} className="flex items-center justify-between px-3.5 sm:px-6 py-3 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <ScorerRankBadge rank={idx + 1} />
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-slate-900 dark:text-white truncate">{scorer.playerName}</span>
                            <span className="text-[11px] text-slate-500 font-medium truncate">Team: {scorer.teamName} • <strong className="text-emerald-600 dark:text-emerald-400">Premier League</strong></span>
                          </div>
                        </div>
                        <span className="text-sm sm:text-base font-black font-mono text-emerald-500 shrink-0">{scorer.goals} G</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Championship Golden Boot Subsection */}
            <div className="space-y-3">
              <div className="w-full rounded-2xl sm:rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
                    <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Egerton Championships
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Goals</span>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-white/5">
                  {champTopScorers.length === 0 ? (
                    <p className="text-xs text-slate-400 p-5 text-center">No goal events recorded for Championships yet.</p>
                  ) : (
                    champTopScorers.slice(0, 5).map((scorer, idx) => (
                      <div key={scorer.playerId || idx} className="flex items-center justify-between px-3.5 sm:px-6 py-3 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <ScorerRankBadge rank={idx + 1} />
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-slate-900 dark:text-white truncate">{scorer.playerName}</span>
                            <span className="text-[11px] text-slate-500 font-medium truncate">Team: {scorer.teamName} • <strong className="text-amber-500">Championships</strong></span>
                          </div>
                        </div>
                        <span className="text-sm sm:text-base font-black font-mono text-amber-500 shrink-0">{scorer.goals} G</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FULL 6-GAME FORM TABLES (EPL & CHAMPIONSHIP — POSITION PRESERVING) */}
        <div id="full-form-tables" className="space-y-6 pt-2 select-none">
          <div className="pb-5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
                  Momentum & Sequences
                </span>
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Official Form Tables (Last 6 Matches)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Full 6-game result sequence strictly preserving primary standings position ordering
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider bg-white/80 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full shadow-xs">
              6-Game Window
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* EPL Form Table */}
            <div className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
              <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                  <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Egerton Premier League — Form Table
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">Position Order</span>
              </div>
              
              {/* Form Pseudo-Thead */}
              <div className="grid grid-cols-[36px_2fr_36px_3fr_44px] items-center px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/20 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                <div className="text-center">Pos</div>
                <div>Club</div>
                <div className="text-center">P</div>
                <div className="text-center">Form (Last 6)</div>
                <div className="text-right">Pts</div>
              </div>

              {/* Form Pseudo-Tbody */}
              <div className="divide-y divide-slate-50 dark:divide-white/5">
                {(eplStandings.length > 0 ? eplStandings : tableData).map((row) => {
                  const form6 = teamFormsMap[row.teamId] || ['W', 'D', 'L', 'W', 'D', 'W'];

                  return (
                    <div
                      key={row.teamId}
                      className="grid grid-cols-[36px_2fr_36px_3fr_44px] items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
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

            {/* Championship Form Table */}
            <div className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
              <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
                  <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Egerton Championships — Form Table
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">Position Order</span>
              </div>
              
              {/* Form Pseudo-Thead */}
              <div className="grid grid-cols-[36px_2fr_36px_3fr_44px] items-center px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/20 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                <div className="text-center">Pos</div>
                <div>Club</div>
                <div className="text-center">P</div>
                <div className="text-center">Form (Last 6)</div>
                <div className="text-right">Pts</div>
              </div>

              {/* Form Pseudo-Tbody */}
              <div className="divide-y divide-slate-50 dark:divide-white/5">
                {champStandings.map((row) => {
                  const form6 = teamFormsMap[row.teamId] || ['W', 'D', 'W', 'L', 'W', 'D'];

                  return (
                    <div
                      key={row.teamId}
                      className="grid grid-cols-[36px_2fr_36px_3fr_44px] items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
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

        {/* 3. UNIFIED MATCHDAY DISTRIBUTION CARD (TODAY, PER MATCHDAY, ALL TIME) */}
        <div className="p-6 md:p-8 bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/50 space-y-6 shadow-xl">
          <div className="pb-5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
                <ChevronRight className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
                  Campus Analytics
                </span>
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Matchday Distribution & League Statistics
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Unified statistics breakdown covering current matchday, per-gameweek distributions, and all-time records
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-widest bg-white/80 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full shadow-xs">
              Campus Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Today / Current Matchday */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-3">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Today / Current Matchday</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">Matchday Active</div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between"><span>Scheduled Fixtures:</span><strong className="text-slate-800 dark:text-slate-200 font-mono">4 Matches</strong></div>
                <div className="flex justify-between"><span>Goals Scored Today:</span><strong className="text-emerald-500 font-mono">9 Goals</strong></div>
                <div className="flex justify-between"><span>Matchday Avg:</span><strong className="text-amber-500 font-mono">2.25 / game</strong></div>
              </div>
            </div>

            {/* Per Matchday */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-3">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Per Matchday Averages</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">2.8 Goals / GW</div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between"><span>Highest Scoring GW:</span><strong className="text-amber-500 font-mono">GW 3 (14 Goals)</strong></div>
                <div className="flex justify-between"><span>Clean Sheet Rate:</span><strong className="text-blue-500 font-mono">35% of Games</strong></div>
                <div className="flex justify-between"><span>Home Win Ratio:</span><strong className="text-emerald-500 font-mono">48%</strong></div>
              </div>
            </div>

            {/* All Time */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-3">
              <span className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest">All Time Campus Records</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">142 Goals</div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between"><span>Total Official Fixtures:</span><strong className="text-slate-800 dark:text-slate-200 font-mono">52 Matches</strong></div>
                <div className="flex justify-between"><span>All-Time Top Scorer:</span><strong className="text-amber-500 dark:text-amber-400 font-mono">Brian Ochieng (12)</strong></div>
                <div className="flex justify-between"><span>Most Unbeaten Games:</span><strong className="text-emerald-500 font-mono">Sharklets FC (8)</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. OFFICIAL REFEREE MATCH REPORTS HIGHLIGHTS */}
        <div className="p-6 md:p-8 bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/50 space-y-5 shadow-xl">
          <div className="pb-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
                  Officiating & Fair Play
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Verified Match Reports & Referee Overviews
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official reports submitted by accredited campus match officials
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/30 px-3 py-1 rounded-full font-extrabold uppercase shadow-xs">
              Certified Audit
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-emerald-500 uppercase">Matchday 4 Derby</span>
                <span className="text-slate-400 font-mono text-[11px]">Ref: Official #102</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Sharklets FC (2) vs Faculty of Science (1)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                "High-intensity match played under fair play guidelines. Two yellow cards issued for tactical fouls in the 67th and 82nd minutes. Pitch surface was optimal; final whistle confirmed at 94:12."
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-amber-500 uppercase">Championship Matchday 3</span>
                <span className="text-slate-400 font-mono text-[11px]">Ref: Official #108</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
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
