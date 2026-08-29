import React, { useState, useEffect, useRef } from 'react';
import type { LeagueTableEntry } from '../../types';
import { ApiService } from '../../services/api';
import { 
  Trophy, Award, Star, Flame, Zap, Target, Users, X, 
  ArrowUpRight, ChevronRight, Activity, Sparkles, Filter
} from 'lucide-react';

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
  selectedCompetitionId = 'all'
}) => {
  // Navigation & Filter States
  const [selectedCompFilter, setSelectedCompFilter] = useState<'all' | 'epl' | 'champ'>('all');
  const [activeSection, setActiveSection] = useState<'standings' | 'form' | 'scorers' | 'potw' | 'assists'>('standings');
  const [formMatchCount, setFormMatchCount] = useState<5 | 10 | 15>(5);

  // Data States
  const [eplStandings, setEplStandings] = useState<LeagueTableEntry[]>([]);
  const [champStandings, setChampStandings] = useState<LeagueTableEntry[]>([]);
  const [teamFormsMap, setTeamFormsMap] = useState<Record<string, string[]>>({});
  
  // Top Scorers States (EPL, Champ, All-Time)
  const [eplScorers, setEplScorers] = useState<Array<{ playerId: string; playerName: string; teamName: string; teamLogo: string; goals: number }>>([]);
  const [champScorers, setChampScorers] = useState<Array<{ playerId: string; playerName: string; teamName: string; teamLogo: string; goals: number }>>([]);
  const [allTimeScorers, setAllTimeScorers] = useState<Array<{ playerId: string; playerName: string; teamName: string; teamLogo: string; goals: number }>>([]);
  
  // Players of the Week & Assists
  const [playersOfTheWeek, setPlayersOfTheWeek] = useState<Array<{
    week: number;
    eplPlayer: { name: string; team: string; contribution: string };
    champPlayer: { name: string; team: string; contribution: string };
  }>>([]);
  const [assistsList, setAssistsList] = useState<Array<{
    rank: number;
    playerId: string;
    playerName: string;
    teamName: string;
    league: string;
    assists: number;
  }>>([]);

  // Modals States
  const [scorersModalCategory, setScorersModalCategory] = useState<'epl' | 'champ' | 'alltime' | null>(null);
  const [showAllAssistsModal, setShowAllAssistsModal] = useState<boolean>(false);

  // Section DOM Refs for Smooth Scrolling
  const standingsRef = useRef<HTMLDivElement>(null);
  const eplStandingsRef = useRef<HTMLDivElement>(null);
  const champStandingsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const eplFormRef = useRef<HTMLDivElement>(null);
  const champFormRef = useRef<HTMLDivElement>(null);
  const scorersRef = useRef<HTMLDivElement>(null);
  const potwRef = useRef<HTMLDivElement>(null);
  const assistsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCompetitionId === CHAMP_COMP_ID) {
      setSelectedCompFilter('champ');
    } else if (selectedCompetitionId === EPL_COMP_ID) {
      setSelectedCompFilter('epl');
    }
  }, [selectedCompetitionId]);

  useEffect(() => {
    // 1. Fetch EPL & Champ Standings
    ApiService.getLeagueTable(EPL_COMP_ID).then((res) => {
      if (res.data && res.data.length > 0) setEplStandings(res.data);
      else setEplStandings(tableData);
    });

    ApiService.getLeagueTable(CHAMP_COMP_ID).then((res) => {
      if (res.data && res.data.length > 0) setChampStandings(res.data);
    });

    // 2. Fetch Top Scorers (EPL, Champ, All-Time)
    ApiService.getTopScorers(EPL_COMP_ID, 10).then((res) => {
      if (res.data) setEplScorers(res.data);
    });
    ApiService.getTopScorers(CHAMP_COMP_ID, 10).then((res) => {
      if (res.data) setChampScorers(res.data);
    });
    ApiService.getAllTimeTopScorers(10).then((res) => {
      if (res.data) setAllTimeScorers(res.data);
    });

    // 3. Fetch Players of the Week & Assists
    ApiService.getPlayersOfTheWeek().then((res) => {
      if (res.data) setPlayersOfTheWeek(res.data);
    });
    ApiService.getAssistsLeaderboard(10).then((res) => {
      if (res.data) setAssistsList(res.data);
    });
  }, [tableData]);

  // Fetch Team Form Sequences
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

  // Smooth Scroll Trigger Function
  const scrollToTarget = (targetRef: React.RefObject<HTMLDivElement | null>, sectionName?: any) => {
    if (sectionName) setActiveSection(sectionName);
    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCompFilterChange = (filter: 'all' | 'epl' | 'champ') => {
    setSelectedCompFilter(filter);
    if (filter === 'epl') {
      if (activeSection === 'form') scrollToTarget(eplFormRef);
      else scrollToTarget(eplStandingsRef);
    } else if (filter === 'champ') {
      if (activeSection === 'form') scrollToTarget(champFormRef);
      else scrollToTarget(champStandingsRef);
    } else {
      if (activeSection === 'form') scrollToTarget(formRef);
      else scrollToTarget(standingsRef);
    }
  };

  const renderFormBadges = (teamId: string, pos: number, count: number = 5) => {
    const rawForm = teamFormsMap[teamId] || (
      pos === 1 ? ['W', 'W', 'D', 'W', 'W', 'W', 'W', 'D', 'W', 'W', 'W', 'W', 'D', 'W', 'W'] :
      pos === 2 ? ['W', 'D', 'W', 'L', 'W', 'W', 'D', 'W', 'L', 'W', 'W', 'D', 'W', 'L', 'W'] :
      pos === 3 ? ['W', 'L', 'W', 'D', 'W', 'W', 'L', 'W', 'D', 'W', 'W', 'L', 'W', 'D', 'W'] :
      ['L', 'W', 'L', 'D', 'W', 'L', 'W', 'L', 'D', 'W', 'L', 'W', 'L', 'D', 'W']
    );
    const formN = rawForm.slice(0, count);

    return (
      <div className="flex items-center gap-0.5 justify-center">
        {formN.map((res, i) => (
          <span
            key={i}
            className={`w-4 h-4 rounded-[2px] flex items-center justify-center font-bold text-[9px] text-white select-none ${
              res === 'W'
                ? 'bg-[#00b04f]'
                : res === 'D'
                ? 'bg-[#ff9800]'
                : res === 'L'
                ? 'bg-[#d63031]'
                : 'bg-[#8fa1b4]'
            }`}
          >
            {res}
          </span>
        ))}
      </div>
    );
  };

  const getPositionBorderColor = (position: number, totalTeams: number) => {
    if (position <= 4) return 'border-l-[3px] border-l-[#1565c0]'; // Champions League Blue
    if (position === 5) return 'border-l-[3px] border-l-[#c2185b]'; // Europa League Crimson
    if (position >= totalTeams - 2) return 'border-l-[3px] border-l-[#d32f2f]'; // Relegation Red
    return 'border-l-[3px] border-l-transparent';
  };

  // Reusable Standard Standings Table Component
  const renderStandingsTable = (
    title: string,
    divisionLabel: string,
    data: LeagueTableEntry[],
    accentColor: string,
    refTarget: React.RefObject<HTMLDivElement | null>
  ) => {
    const list = data.length > 0 ? data : tableData;
    return (
      <div ref={refTarget} className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
        {/* Table Header Banner */}
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className={`w-4 h-4 ${accentColor}`} />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
            divisionLabel === 'DIVISION 1'
              ? 'bg-rose-500/10 text-[#ff0046] border-rose-500/20'
              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
          }`}>
            {divisionLabel}
          </span>
        </div>

        {/* Table Content */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-[10px] font-black text-slate-400 uppercase">
                <th className="py-2 px-2 text-center w-8"># ▲</th>
                <th className="py-2 px-2 min-w-[130px] sm:min-w-[180px]">TEAM</th>
                <th className="py-2 px-1 text-center w-7">MP</th>
                <th className="py-2 px-1 text-center w-7">W</th>
                <th className="py-2 px-1 text-center w-7">D</th>
                <th className="py-2 px-1 text-center w-7">L</th>
                <th className="py-2 px-1 text-center w-12 hidden sm:table-cell">G</th>
                <th className="py-2 px-1 text-center w-8 hidden sm:table-cell">GD</th>
                <th className="py-2 px-2 text-center w-9 font-black text-slate-900 dark:text-white">PTS</th>
                <th className="py-2 px-2 text-center w-24">FORM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {list.map((row) => {
                const totalTeams = list.length;
                const zoneBorder = getPositionBorderColor(row.position, totalTeams);

                return (
                  <tr
                    key={row.teamId || row.position}
                    className={`hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors ${zoneBorder}`}
                  >
                    <td className="py-2 px-2 text-center font-bold text-slate-500 dark:text-slate-400">
                      {row.position}.
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={row.teamLogo}
                          alt={row.teamName}
                          className="w-4 h-4 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                        />
                        <span className="font-extrabold text-slate-900 dark:text-white truncate">
                          {row.teamName}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.played}</td>
                    <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.won}</td>
                    <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.drawn}</td>
                    <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.lost}</td>
                    <td className="py-2 px-1 text-center font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                      {row.goalsFor}:{row.goalsAgainst}
                    </td>
                    <td className="py-2 px-1 text-center font-mono font-bold text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="py-2 px-2 text-center font-black font-mono text-slate-900 dark:text-white">
                      {row.points}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {renderFormBadges(row.teamId, row.position, 5)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Reusable Form Standings Table Component
  const renderFormTable = (
    title: string,
    divisionLabel: string,
    data: LeagueTableEntry[],
    refTarget: React.RefObject<HTMLDivElement | null>
  ) => {
    const list = data.length > 0 ? data : tableData;
    return (
      <div ref={refTarget} className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {title} — RECENT FORM
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{divisionLabel}</span>
        </div>

        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-[10px] font-black text-slate-400 uppercase">
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-2 min-w-[130px] sm:min-w-[180px]">TEAM</th>
                <th className="py-2 px-1 text-center w-7">MP</th>
                <th className="py-2 px-1 text-center w-7">W</th>
                <th className="py-2 px-1 text-center w-7">D</th>
                <th className="py-2 px-1 text-center w-7">L</th>
                <th className="py-2 px-2 text-center w-9 font-black text-slate-900 dark:text-white">PTS</th>
                <th className="py-2 px-2 text-center w-36">LAST {formMatchCount} MATCHES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {list.map((row) => (
                <tr key={row.teamId || row.position} className="hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                  <td className="py-2 px-2 text-center font-bold text-slate-400">{row.position}.</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={row.teamLogo} alt={row.teamName} className="w-4 h-4 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0" />
                      <span className="font-extrabold text-slate-900 dark:text-white truncate">{row.teamName}</span>
                    </div>
                  </td>
                  <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.played}</td>
                  <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.won}</td>
                  <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.drawn}</td>
                  <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.lost}</td>
                  <td className="py-2 px-2 text-center font-black font-mono text-slate-900 dark:text-white">{row.points}</td>
                  <td className="py-2 px-2 text-center">{renderFormBadges(row.teamId, row.position, formMatchCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Reusable Top Scorers Card Component (Top 10 players)
  const renderTopScorersTable = (
    title: string,
    badgeLabel: string,
    scorers: Array<{ playerId: string; playerName: string; teamName: string; goals: number }>,
    modalCategory: 'epl' | 'champ' | 'alltime'
  ) => (
    <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
      <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#ff0046]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            {title}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setScorersModalCategory(modalCategory)}
          className="text-[10px] font-black text-[#ff0046] hover:underline flex items-center gap-1 cursor-pointer uppercase"
        >
          <span>See All Ranked</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="w-full overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-[10px] font-black text-slate-400 uppercase">
              <th className="py-2 px-3 text-center w-8">#</th>
              <th className="py-2 px-3">PLAYER</th>
              <th className="py-2 px-3">TEAM</th>
              <th className="py-2 px-3 text-center font-black text-slate-900 dark:text-white w-16">GOALS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
            {scorers.slice(0, 10).map((sc, idx) => (
              <tr key={sc.playerId || idx} className="hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}.</td>
                <td className="py-2 px-3 font-extrabold text-slate-900 dark:text-white truncate max-w-[140px]">{sc.playerName}</td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{sc.teamName}</td>
                <td className="py-2 px-3 text-center font-black font-mono text-[#00b04f]">{sc.goals} G</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. TOP STICKY NAVIGATION CONTROLS BAR */}
      <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-2 sm:p-3 space-y-2 shadow-xs">
        {/* ROW 1: LEAGUE SWITCH (ALL | EPL | CHAMPIONSHIPS) */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> LEAGUE:
            </span>
            {[
              { id: 'all', label: 'ALL LEAGUES' },
              { id: 'epl', label: 'EPL (PREMIER)' },
              { id: 'champ', label: 'CHAMPIONSHIPS' },
            ].map((f) => {
              const isActive = selectedCompFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleCompFilterChange(f.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#ff0046] text-white shadow-xs'
                      : 'bg-[#f0f2f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3450]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Form Match Count Selector (5/10/15) */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 mr-1">FORM:</span>
            {[5, 10, 15].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => setFormMatchCount(cnt as any)}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                  formMatchCount === cnt
                    ? 'bg-[#0e1e2d] text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-[#14263b] text-slate-500 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                {cnt}m
              </button>
            ))}
          </div>
        </div>

        {/* ROW 2: SMOOTH-SCROLL QUICK JUMP TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-[#f0f2f5] dark:border-[#14263b] text-xs">
          {[
            { id: 'standings', label: '📊 STANDINGS', ref: standingsRef },
            { id: 'form', label: '⚡ FORM TABLES', ref: formRef },
            { id: 'scorers', label: '🔥 TOP SCORERS', ref: scorersRef },
            { id: 'potw', label: '⭐ PLAYER OF THE WEEK', ref: potwRef },
            { id: 'assists', label: '🎯 TOP ASSISTS', ref: assistsRef },
          ].map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToTarget(tab.ref, tab.id)}
                className={`px-3 py-1 rounded text-[11px] font-extrabold uppercase whitespace-nowrap cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#152e4d] text-[#38bdf8] dark:bg-[#152e4d] dark:text-[#38bdf8] font-black border border-[#38bdf8]/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14263b]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: STANDINGS TABLES (EPL TABLE, BELOW IT CHAMP) */}
      {/* ======================================================== */}
      <div ref={standingsRef} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              OFFICIAL LEAGUE STANDINGS
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Automated Engine</span>
        </div>

        {/* EPL Standings Table */}
        {renderStandingsTable(
          'Egerton Premier League',
          'DIVISION 1',
          eplStandings,
          'text-[#ff0046]',
          eplStandingsRef
        )}

        {/* Championships Standings Table (Below EPL) */}
        {renderStandingsTable(
          'Egerton Championships',
          'DIVISION 2',
          champStandings,
          'text-amber-500',
          champStandingsRef
        )}

        {/* Promotion / Relegation Legend Bar */}
        <div className="p-3 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-600 dark:text-slate-400 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#1565c0] rounded-xs inline-block" />
            <span>Champions League (Top 4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#c2185b] rounded-xs inline-block" />
            <span>Europa League (5th)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#d32f2f] rounded-xs inline-block" />
            <span>Relegation Zone</span>
          </div>
        </div>
      </div>

      {/* INTER-SECTION SPACE */}
      <div className="my-4" />

      {/* ======================================================== */}
      {/* SECTION 2: FORM TABLES (EPL FORM, BELOW IT CHAMP FORM) */}
      {/* ======================================================== */}
      <div ref={formRef} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              LEAGUE FORM TABLES
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Last {formMatchCount} Matches Streak</span>
        </div>

        {/* EPL Form Table */}
        {renderFormTable(
          'Egerton Premier League',
          'DIVISION 1',
          eplStandings,
          eplFormRef
        )}

        {/* Championships Form Table (Below EPL Form) */}
        {renderFormTable(
          'Egerton Championships',
          'DIVISION 2',
          champStandings,
          champFormRef
        )}
      </div>

      {/* INTER-SECTION SPACE */}
      <div className="my-4" />

      {/* ======================================================== */}
      {/* SECTION 3: TOP SCORERS (EPL, CHAMPIONSHIPS, ALL-TIME)   */}
      {/* ======================================================== */}
      <div ref={scorersRef} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#ff0046]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              GOLDEN BOOT & TOP SCORERS
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Top 10 Rankings</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Table 1: EPL Top 10 */}
          {renderTopScorersTable('EPL Top 10 Scorers', 'DIVISION 1', eplScorers, 'epl')}

          {/* Table 2: Championships Top 10 */}
          {renderTopScorersTable('Champ Top 10 Scorers', 'DIVISION 2', champScorers, 'champ')}

          {/* Table 3: All-Time Top 10 */}
          {renderTopScorersTable('All-Time Top 10 Scorers', 'ALL-TIME', allTimeScorers, 'alltime')}
        </div>
      </div>

      {/* INTER-SECTION SPACE */}
      <div className="my-4" />

      {/* ======================================================== */}
      {/* SECTION 4: PLAYER OF THE WEEK (WEEK 1+, LATERAL SPLIT)   */}
      {/* ======================================================== */}
      <div ref={potwRef} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              PLAYER OF THE WEEK ARCHIVE
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Dual-League Weekly Stars</span>
        </div>

        <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
          {playersOfTheWeek.map((item) => (
            <div key={item.week} className="flex flex-col md:flex-row items-stretch hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
              {/* Left Unified Slot: Week */}
              <div className="w-full md:w-32 bg-[#f8f9fa] dark:bg-[#112236] p-3 flex md:flex-col items-center justify-between md:justify-center border-b md:border-b-0 md:border-r border-[#e6e8ec] dark:border-[#1a2e45] shrink-0 text-center">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">MATCHDAY</span>
                <span className="text-sm md:text-base font-black text-slate-900 dark:text-white font-mono">
                  WEEK {item.week}
                </span>
              </div>

              {/* Right Players Section: Lateral Split covering both EPL & Championships */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#f0f2f5] dark:divide-[#14263b] p-2 sm:p-3 gap-2 sm:gap-0">
                {/* EPL Player of the Week */}
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/10 text-[#ff0046] border border-rose-500/20">
                      EPL STAR
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{item.eplPlayer.contribution}</span>
                  </div>
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {item.eplPlayer.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {item.eplPlayer.team}
                  </div>
                </div>

                {/* Championships Player of the Week */}
                <div className="p-2 sm:pl-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      CHAMPIONSHIPS STAR
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{item.champPlayer.contribution}</span>
                  </div>
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {item.champPlayer.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {item.champPlayer.team}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INTER-SECTION SPACE */}
      <div className="my-4" />

      {/* ======================================================== */}
      {/* SECTION 5: ASSISTS TABLE (5 PLAYERS + SEE ALL POPUP)    */}
      {/* ======================================================== */}
      <div ref={assistsRef} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#1565c0] dark:text-[#42a5f5]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              PLAYMAKERS & MOST ASSISTS
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAllAssistsModal(true)}
            className="text-[10px] font-black text-[#1565c0] dark:text-[#42a5f5] hover:underline flex items-center gap-1 cursor-pointer uppercase"
          >
            <span>See All Assists</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
          <div className="w-full overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-[10px] font-black text-slate-400 uppercase">
                  <th className="py-2 px-3 text-center w-8">#</th>
                  <th className="py-2 px-3 w-20">LEAGUE</th>
                  <th className="py-2 px-3">PLAYER</th>
                  <th className="py-2 px-3">TEAM</th>
                  <th className="py-2 px-3 text-center font-black text-slate-900 dark:text-white w-16">ASSISTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                {assistsList.slice(0, 5).map((ast) => (
                  <tr key={ast.playerId} className="hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                    <td className="py-2 px-3 text-center font-bold text-slate-400">{ast.rank}.</td>
                    <td className="py-2 px-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        ast.league === 'EPL'
                          ? 'bg-rose-500/10 text-[#ff0046] border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {ast.league}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-extrabold text-slate-900 dark:text-white truncate max-w-[140px]">{ast.playerName}</td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{ast.teamName}</td>
                    <td className="py-2 px-3 text-center font-black font-mono text-[#1565c0] dark:text-[#42a5f5]">{ast.assists} A</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* POPUP MODALS: SEE ALL SCORERS & SEE ALL ASSISTS         */}
      {/* ======================================================== */}
      {/* 1. Scorers Popup Modal */}
      {scorersModalCategory && (
        <div 
          className="fixed inset-0 z-100 bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setScorersModalCategory(null)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#0e1c2b] rounded-lg border border-slate-200 dark:border-[#1a2e45] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#0e1e2d] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#ff0046]" />
                <span className="font-extrabold text-sm uppercase tracking-wider">
                  {scorersModalCategory === 'epl' ? 'EPL Full Scorers Leaderboard' :
                   scorersModalCategory === 'champ' ? 'Championships Full Scorers Leaderboard' :
                   'All-Time Scorers Hall of Fame'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setScorersModalCategory(null)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#f0f2f5] dark:divide-[#14263b] p-2">
              {(scorersModalCategory === 'epl' ? eplScorers : scorersModalCategory === 'champ' ? champScorers : allTimeScorers).map((sc, idx) => (
                <div key={sc.playerId || idx} className="flex items-center justify-between px-3 py-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-bold text-slate-400">{idx + 1}.</span>
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white block">{sc.playerName}</span>
                      <span className="text-[10px] text-slate-500">{sc.teamName}</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm text-[#00b04f]">{sc.goals} Goals</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#f8f9fa] dark:bg-[#112236] border-t border-[#e6e8ec] dark:border-[#1a2e45] flex justify-end">
              <button
                type="button"
                onClick={() => setScorersModalCategory(null)}
                className="px-4 py-1.5 rounded text-xs font-bold bg-[#0e1e2d] text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Assists Popup Modal */}
      {showAllAssistsModal && (
        <div 
          className="fixed inset-0 z-100 bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowAllAssistsModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#0e1c2b] rounded-lg border border-slate-200 dark:border-[#1a2e45] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#0e1e2d] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#38bdf8]" />
                <span className="font-extrabold text-sm uppercase tracking-wider">
                  Campus Playmakers & Assists Ranking
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAllAssistsModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#f0f2f5] dark:divide-[#14263b] p-2">
              {assistsList.map((ast) => (
                <div key={ast.playerId} className="flex items-center justify-between px-3 py-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-bold text-slate-400">{ast.rank}.</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 dark:text-white">{ast.playerName}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                          ast.league === 'EPL' ? 'bg-rose-500/10 text-[#ff0046]' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {ast.league}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{ast.teamName}</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm text-[#1565c0] dark:text-[#42a5f5]">{ast.assists} Assists</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#f8f9fa] dark:bg-[#112236] border-t border-[#e6e8ec] dark:border-[#1a2e45] flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllAssistsModal(false)}
                className="px-4 py-1.5 rounded text-xs font-bold bg-[#0e1e2d] text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


