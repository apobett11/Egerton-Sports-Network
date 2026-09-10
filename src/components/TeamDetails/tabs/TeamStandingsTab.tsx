import React, { useState, useMemo } from 'react';
import { Trophy, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import type { StandingEntry, Match } from '../../Dashboards/Team/types';

interface TeamStandingsTabProps {
  standings: StandingEntry[];
  fixtures: Match[];
  currentTeamName?: string;
  currentTeamLogo?: string;
}

export const TeamStandingsTab: React.FC<TeamStandingsTabProps> = ({
  standings,
  fixtures: _fixtures,
  currentTeamName = '',
  currentTeamLogo,
}) => {
  const [showFullStandings, setShowFullStandings] = useState<boolean>(true);
  const [showFullFormTable, setShowFullFormTable] = useState<boolean>(true);

  // Find index of current team in standings
  const currentTeamIndex = useMemo(() => {
    const idx = standings.findIndex(
      (t) =>
        t.isCurrent ||
        (currentTeamName && t.teamName.toLowerCase() === currentTeamName.toLowerCase())
    );
    return idx !== -1 ? idx : 0;
  }, [standings, currentTeamName]);

  const displayedStandings = useMemo(() => {
    if (showFullStandings) return standings;
    const startIdx = Math.max(0, currentTeamIndex - 2);
    const endIdx = Math.min(standings.length, currentTeamIndex + 3);
    return standings.slice(startIdx, endIdx);
  }, [standings, currentTeamIndex, showFullStandings]);

  const displayedFormStandings = useMemo(() => {
    if (showFullFormTable) return standings;
    const startIdx = Math.max(0, currentTeamIndex - 2);
    const endIdx = Math.min(standings.length, currentTeamIndex + 3);
    return standings.slice(startIdx, endIdx);
  }, [standings, currentTeamIndex, showFullFormTable]);

  const render6FormBadges = (formList: ('W' | 'D' | 'L')[]) => {
    if (!formList || formList.length === 0) {
      return <span className="text-[11px] text-slate-400 font-medium">—</span>;
    }
    const form6 = formList.slice(-6);

    return (
      <div className="flex items-center gap-1 justify-center">
        {form6.map((res, i) => (
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
            title={res === 'W' ? 'Win' : res === 'D' ? 'Draw' : 'Loss'}
          >
            {res}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full select-none pb-20 animate-in fade-in duration-150">
      {/* 1. STANDINGS TABLE CARD */}
      <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Official League Standings
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFullStandings(!showFullStandings)}
            className="text-[10px] font-black uppercase text-[#ff0046] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showFullStandings ? 'Compact View' : 'Full Table'}</span>
            {showFullStandings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-[#112236]/60 border-b border-[#e6e8ec] dark:border-[#1a2e45] text-[10px] font-black text-slate-400 uppercase">
                <th className="py-2.5 px-3 text-center w-8">#</th>
                <th className="py-2.5 px-3 min-w-[160px]">TEAM</th>
                <th className="py-2.5 px-2 text-center w-8">MP</th>
                <th className="py-2.5 px-2 text-center w-8">W</th>
                <th className="py-2.5 px-2 text-center w-8">D</th>
                <th className="py-2.5 px-2 text-center w-8">L</th>
                <th className="py-2.5 px-2 text-center w-12 hidden sm:table-cell">G</th>
                <th className="py-2.5 px-2 text-center w-10 hidden sm:table-cell">GD</th>
                <th className="py-2.5 px-3 text-center w-12 font-black text-slate-900 dark:text-white">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {displayedStandings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 px-4 text-center text-xs text-slate-400">
                    No standings records available for this competition yet.
                  </td>
                </tr>
              ) : (
                displayedStandings.map((row) => {
                  const isHighlighted =
                    row.isCurrent ||
                    (currentTeamName && row.teamName.toLowerCase() === currentTeamName.toLowerCase());

                  return (
                    <tr
                      key={row.teamId || row.position}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-[#ff0046]/5 dark:bg-[#ff0046]/10 font-bold border-l-2 border-l-[#ff0046]'
                          : 'hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                        {row.position}.
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={
                              row.teamLogo ||
                              (isHighlighted ? currentTeamLogo : '') ||
                              'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={row.teamName}
                            className="w-4.5 h-4.5 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span
                            className={`truncate ${
                              isHighlighted
                                ? 'font-black text-[#ff0046] dark:text-[#ff0046]'
                                : 'font-extrabold text-slate-900 dark:text-white'
                            }`}
                          >
                            {row.teamName}
                          </span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.2 rounded-xs text-[8px] font-black uppercase bg-[#ff0046] text-white shrink-0">
                              CURRENT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-600 dark:text-slate-300">
                        {row.played}
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-600 dark:text-slate-300">
                        {row.won}
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-600 dark:text-slate-300">
                        {row.drawn}
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-600 dark:text-slate-300">
                        {row.lost}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {row.goalsFor}:{row.goalsAgainst}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black font-mono text-sm text-slate-900 dark:text-white">
                        {row.points}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. RECENT FORM TABLE CARD */}
      <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Recent Match Form (Last 6 Games)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFullFormTable(!showFullFormTable)}
            className="text-[10px] font-black uppercase text-[#ff0046] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showFullFormTable ? 'Compact View' : 'Full Table'}</span>
            {showFullFormTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-[#112236]/60 border-b border-[#e6e8ec] dark:border-[#1a2e45] text-[10px] font-black text-slate-400 uppercase">
                <th className="py-2.5 px-3 text-center w-8">#</th>
                <th className="py-2.5 px-3 min-w-[160px]">TEAM</th>
                <th className="py-2.5 px-3 text-center w-12">PLAYED</th>
                <th className="py-2.5 px-3 text-center min-w-[140px]">LAST 6 MATCHES</th>
                <th className="py-2.5 px-4 text-center w-14 font-black text-slate-900 dark:text-white">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {displayedFormStandings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-xs text-slate-400">
                    No form streaks recorded yet.
                  </td>
                </tr>
              ) : (
                displayedFormStandings.map((row) => {
                  const isHighlighted =
                    row.isCurrent ||
                    (currentTeamName && row.teamName.toLowerCase() === currentTeamName.toLowerCase());

                  return (
                    <tr
                      key={row.teamId || row.position}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-[#ff0046]/5 dark:bg-[#ff0046]/10 font-bold border-l-2 border-l-[#ff0046]'
                          : 'hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                        {row.position}.
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={
                              row.teamLogo ||
                              (isHighlighted ? currentTeamLogo : '') ||
                              'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={row.teamName}
                            className="w-4.5 h-4.5 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span
                            className={`truncate ${
                              isHighlighted
                                ? 'font-black text-[#ff0046]'
                                : 'font-extrabold text-slate-900 dark:text-white'
                            }`}
                          >
                            {row.teamName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-600 dark:text-slate-300">
                        {row.played}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {render6FormBadges(row.recentForm || [])}
                      </td>
                      <td className="py-2.5 px-4 text-center font-black font-mono text-sm text-slate-900 dark:text-white">
                        {row.points}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamStandingsTab;
