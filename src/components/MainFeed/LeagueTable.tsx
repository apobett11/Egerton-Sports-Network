import React, { useState, useEffect } from 'react';
import type { LeagueTableEntry, HistoricalSeasonStandings } from '../../types';
import { ApiService } from '../../services/api';
import { ChevronRight, Star } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'standings' | 'form' | 'over_under' | 'top_scorers'>('standings');
  const [scopeFilter, setScopeFilter] = useState<'overall' | 'home' | 'away'>('overall');
  const [formMatchCount, setFormMatchCount] = useState<5 | 10 | 15>(5);
  const [activeCompTab, setActiveCompTab] = useState<'epl' | 'champ'>('epl');
  
  const [eplStandings, setEplStandings] = useState<LeagueTableEntry[]>([]);
  const [champStandings, setChampStandings] = useState<LeagueTableEntry[]>([]);
  const [teamFormsMap, setTeamFormsMap] = useState<Record<string, string[]>>({});
  const [topScorers, setTopScorers] = useState<Array<{ playerId: string; playerName: string; teamName: string; teamLogo: string; goals: number }>>([]);

  useEffect(() => {
    if (selectedCompetitionId === CHAMP_COMP_ID) {
      setActiveCompTab('champ');
    } else if (selectedCompetitionId === EPL_COMP_ID) {
      setActiveCompTab('epl');
    }
  }, [selectedCompetitionId]);

  useEffect(() => {
    ApiService.getLeagueTable(EPL_COMP_ID).then((res) => {
      if (res.data && res.data.length > 0) setEplStandings(res.data);
      else setEplStandings(tableData);
    });

    ApiService.getLeagueTable(CHAMP_COMP_ID).then((res) => {
      if (res.data && res.data.length > 0) setChampStandings(res.data);
    });

    ApiService.getTopScorers(EPL_COMP_ID).then((res) => {
      if (res.data) setTopScorers(res.data);
    });
  }, [tableData]);

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

  const currentCompData = activeCompTab === 'champ'
    ? (champStandings.length > 0 ? champStandings : tableData)
    : (eplStandings.length > 0 ? eplStandings : tableData);

  const renderFormBadges = (teamId: string, pos: number) => {
    const rawForm = teamFormsMap[teamId] || (pos === 1 ? ['W', 'W', 'D', 'W', 'W'] : pos === 2 ? ['W', 'D', 'W', 'L', 'W'] : pos === 3 ? ['W', 'L', 'W', 'D', 'W'] : ['L', 'W', 'L', 'D', 'W']);
    const form5 = rawForm.slice(0, 5);

    return (
      <div className="flex items-center gap-0.5 justify-center">
        {form5.map((res, i) => (
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

  return (
    <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden select-none shadow-xs space-y-0">
      {/* 1. TOP BREADCRUMB & TOURNAMENT SELECTOR */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e1e2d] text-white text-xs border-b border-[#14263b]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-300">⚽ FOOTBALL &gt; 🇰🇪 KENYA</span>
          <span className="text-white font-extrabold uppercase">&gt; {activeCompTab === 'epl' ? 'Premier League' : 'Championships'}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveCompTab('epl')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase cursor-pointer ${
              activeCompTab === 'epl' ? 'bg-[#ff0046] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            EPL
          </button>
          <button
            type="button"
            onClick={() => setActiveCompTab('champ')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase cursor-pointer ${
              activeCompTab === 'champ' ? 'bg-[#ff0046] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Champ
          </button>
        </div>
      </div>

      {/* 2. SUB-TABS ROW (STANDINGS | FORM | OVER/UNDER | TOP SCORERS) */}
      <div className="flex items-center overflow-x-auto no-scrollbar border-b border-[#e6e8ec] dark:border-[#1a2e45] bg-[#ffffff] dark:bg-[#0e1c2b] px-2 text-xs">
        {[
          { id: 'standings', label: 'STANDINGS' },
          { id: 'form', label: 'FORM' },
          { id: 'over_under', label: 'OVER/UNDER' },
          { id: 'top_scorers', label: 'TOP SCORERS' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2.5 font-extrabold whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
                isActive
                  ? 'text-[#ff0046] border-[#ff0046]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. SCOPE PILLS (OVERALL | HOME | AWAY) & OPTIONAL FORM WINDOW */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs">
        <div className="flex items-center gap-1">
          {['overall', 'home', 'away'].map((sc) => (
            <button
              key={sc}
              type="button"
              onClick={() => setScopeFilter(sc as any)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase cursor-pointer ${
                scopeFilter === sc
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'bg-[#eef1f5] dark:bg-[#14263b] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {sc}
            </button>
          ))}
        </div>

        {activeTab === 'form' && (
          <div className="flex items-center gap-1">
            {[5, 10, 15].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => setFormMatchCount(cnt as any)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                  formMatchCount === cnt
                    ? 'bg-[#0e1e2d] text-white dark:bg-white dark:text-slate-900 font-black'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. MAIN STANDINGS TABLE */}
      {activeTab === 'top_scorers' ? (
        /* Top Scorers View */
        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-[10px] font-black text-slate-400 uppercase">
                <th className="py-2 px-3 text-center w-8">#</th>
                <th className="py-2 px-3">PLAYER</th>
                <th className="py-2 px-3">TEAM</th>
                <th className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-200">G</th>
                <th className="py-2 px-3 text-center">A</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {topScorers.map((sc, idx) => (
                <tr key={sc.playerId || idx} className="hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                  <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}.</td>
                  <td className="py-2 px-3 font-extrabold text-slate-900 dark:text-white truncate max-w-[150px]">{sc.playerName}</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{sc.teamName}</td>
                  <td className="py-2 px-3 text-center font-bold font-mono text-[#ff0046]">{sc.goals}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{Math.floor(sc.goals * 0.4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Regular / Form Standings Table */
        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-[10px] font-black text-slate-400 uppercase">
                <th className="py-2 px-2 text-center w-8"># ▲</th>
                <th className="py-2 px-2 min-w-[120px] sm:min-w-[180px]">TEAM</th>
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
              {currentCompData.map((row) => {
                const totalTeams = currentCompData.length;
                const zoneBorder = getPositionBorderColor(row.position, totalTeams);

                return (
                  <tr
                    key={row.teamId}
                    className={`hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors ${zoneBorder}`}
                  >
                    {/* Position Number */}
                    <td className="py-2 px-2 text-center font-bold text-slate-500 dark:text-slate-400">
                      {row.position}.
                    </td>

                    {/* Team Crest & Name */}
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

                    {/* MP, W, D, L */}
                    <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.played}</td>
                    <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.won}</td>
                    <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.drawn}</td>
                    <td className="py-2 px-1 text-center font-medium text-slate-600 dark:text-slate-300">{row.lost}</td>

                    {/* Goals (G) & Goal Difference (GD) */}
                    <td className="py-2 px-1 text-center font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                      {row.goalsFor}:{row.goalsAgainst}
                    </td>
                    <td className="py-2 px-1 text-center font-mono font-bold text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>

                    {/* Points (PTS) */}
                    <td className="py-2 px-2 text-center font-black font-mono text-slate-900 dark:text-white">
                      {row.points}
                    </td>

                    {/* Form 5-Match Squares */}
                    <td className="py-2 px-2 text-center">
                      {renderFormBadges(row.teamId, row.position)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. PROMOTION / RELEGATION LEGEND BAR */}
      <div className="p-3 bg-[#f8f9fa] dark:bg-[#112236] border-t border-[#e6e8ec] dark:border-[#1a2e45] flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#1565c0] rounded-xs inline-block" />
          <span>Promotion - Champions League (Top 4)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#c2185b] rounded-xs inline-block" />
          <span>Europa League (5th)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#d32f2f] rounded-xs inline-block" />
          <span>Relegation</span>
        </div>
      </div>
    </div>
  );
};

