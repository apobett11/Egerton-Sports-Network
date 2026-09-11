import React, { useState, useMemo } from 'react';
import { formatMatchTime, formatMatchPitch } from '../../../../lib/matchdayHelper';
import { StandingEntry, Match, TeamFormEntry } from '../types';
import {
  Trophy,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  Activity,
  Clock,
  Radio,
} from 'lucide-react';

interface StandingsPageProps {
  standings: StandingEntry[];
  fixtures: Match[];
  teamForm?: TeamFormEntry[];
  currentTeamName?: string;
  currentTeamLogo?: string;
}

export const StandingsPage: React.FC<StandingsPageProps> = ({
  standings,
  fixtures,
  currentTeamName,
  currentTeamLogo,
}) => {
  const [showFullStandings, setShowFullStandings] = useState<boolean>(false);
  const [showFullFormTable, setShowFullFormTable] = useState<boolean>(false);
  const [activeFixtureFilter, setActiveFixtureFilter] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');

  // Find index of current team in standings
  const currentTeamIndex = useMemo(() => {
    const idx = standings.findIndex((t) =>
      t.isCurrent ||
      (currentTeamName && t.teamName.toLowerCase() === currentTeamName.toLowerCase()) ||
      t.teamName.toLowerCase().includes('egerton')
    );
    return idx !== -1 ? idx : 3;
  }, [standings, currentTeamName]);

  // Contextual 5-team snippet: 2 above, current team, 2 below
  const contextualStandings = useMemo(() => {
    if (showFullStandings) return standings;
    const startIdx = Math.max(0, currentTeamIndex - 2);
    const endIdx = Math.min(standings.length, currentTeamIndex + 3);
    return standings.slice(startIdx, endIdx);
  }, [standings, currentTeamIndex, showFullStandings]);

  const contextualFormStandings = useMemo(() => {
    if (showFullFormTable) return standings;
    const startIdx = Math.max(0, currentTeamIndex - 2);
    const endIdx = Math.min(standings.length, currentTeamIndex + 3);
    return standings.slice(startIdx, endIdx);
  }, [standings, currentTeamIndex, showFullFormTable]);

  // Filter fixtures
  const filteredFixtures = useMemo(() => {
    if (activeFixtureFilter === 'UPCOMING') {
      return fixtures.filter((f) => f.status === 'UPCOMING');
    }
    if (activeFixtureFilter === 'FINISHED') {
      return fixtures.filter((f) => f.status === 'FINISHED');
    }
    return fixtures;
  }, [fixtures, activeFixtureFilter]);

  // Flashscore Guest 6-Form Badges
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

  const calculateFormPoints = (formList: ('W' | 'D' | 'L')[]) => {
    return (formList || []).slice(-6).reduce((sum, outcome) => {
      if (outcome === 'W') return sum + 3;
      if (outcome === 'D') return sum + 1;
      return sum;
    }, 0);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full select-none pb-24 sm:pb-16">
      {/* 1. PAGE HEADER BAR */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Tables & Fixtures
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#00b04f]/15 text-[#00b04f]">
            2026/27
          </span>
        </div>
      </div>

      {/* 2. TABLE 1: LEAGUE STANDINGS (FLASHSCORE GUEST STYLE) */}
      <section className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
        {/* Table Header Banner */}
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#ff0046]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {showFullStandings ? 'Full League Standings' : 'League Standings Snippet (2 Above, Our Club, 2 Below)'}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowFullStandings((prev) => !prev)}
            className="px-3 py-1 rounded-full text-xs font-black bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            {showFullStandings ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#ff0046]" />
                <span>Show 5-Team Snippet</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#ff0046]" />
                <span>Expand Full Table ({standings.length})</span>
              </>
            )}
          </button>
        </div>

        {/* Table Content */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-2 text-center w-8"># ▲</th>
                <th className="py-2 px-3 min-w-[140px] sm:min-w-[200px]">TEAM</th>
                <th className="py-2 px-2 text-center w-8">MP</th>
                <th className="py-2 px-2 text-center w-8">W</th>
                <th className="py-2 px-2 text-center w-8">D</th>
                <th className="py-2 px-2 text-center w-8">L</th>
                <th className="py-2 px-2 text-center w-14 hidden sm:table-cell">G</th>
                <th className="py-2 px-2 text-center w-10 hidden sm:table-cell">GD</th>
                <th className="py-2 px-3 text-center w-12 font-black text-slate-900 dark:text-white">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {contextualStandings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 px-4 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No standings data recorded.
                  </td>
                </tr>
              ) : (
                contextualStandings.map((team, idx) => {
                  const isOurTeam = team.isCurrent || (currentTeamName ? team.teamName.toLowerCase() === currentTeamName.toLowerCase() : team.teamName.toLowerCase().includes('egerton'));
                  const zoneBorder = isOurTeam
                    ? 'border-l-2 border-l-[#ff0046]/40 bg-[#ff0046]/4 dark:bg-[#ff0046]/6'
                    : team.position <= 4
                    ? 'border-l-2 border-l-[#00b04f]/40'
                    : 'border-l-2 border-l-transparent';

                  return (
                    <tr
                      key={team.teamName || idx}
                      className={`hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors ${zoneBorder}`}
                    >
                      <td className="py-2.5 px-2 text-center font-bold text-slate-500 dark:text-slate-400">
                        {team.position}.
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {team.teamLogo ? (
                            <img
                              src={team.teamLogo}
                              alt={team.teamName}
                              className="w-4.5 h-4.5 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-4.5 h-4.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0 flex items-center justify-center text-[8px] font-black">
                              {team.teamName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className={`truncate ${
                            isOurTeam ? 'font-black text-slate-900 dark:text-white' : 'font-extrabold text-slate-800 dark:text-slate-200'
                          }`}>
                            {team.teamName}
                          </span>
                          {isOurTeam && (
                            <span className="text-[9px] bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/20 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shrink-0">
                              Our Club
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center font-medium text-slate-600 dark:text-slate-300">{team.played}</td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-600 dark:text-slate-300">{team.won}</td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-600 dark:text-slate-300">{team.drawn}</td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-600 dark:text-slate-300">{team.lost}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {team.goalsFor}:{team.goalsAgainst}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black font-mono text-sm text-slate-900 dark:text-white">
                        {team.points}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. TABLE 2: FORM STANDINGS (FLASHSCORE GUEST STYLE) */}
      <section className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00b04f]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {showFullFormTable ? 'Full Recent Form Standings' : 'Form Standings Snippet (Latest 6 Games Spectrum)'}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowFullFormTable((prev) => !prev)}
            className="px-3 py-1 rounded-full text-xs font-black bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            {showFullFormTable ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#ff0046]" />
                <span>Show 5-Team Snippet</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#ff0046]" />
                <span>Expand Full Form Table ({standings.length})</span>
              </>
            )}
          </button>
        </div>

        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center w-8">#</th>
                <th className="py-2.5 px-3 min-w-[140px] sm:min-w-[200px]">TEAM</th>
                <th className="py-2.5 px-3 text-center w-12">PLAYED</th>
                <th className="py-2.5 px-3 text-center min-w-[140px]">LAST 6 MATCHES</th>
                <th className="py-2.5 px-4 text-center w-14 font-black text-slate-900 dark:text-white">PTS (L6)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {contextualFormStandings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No recent form data available.
                  </td>
                </tr>
              ) : (
                contextualFormStandings.map((team, idx) => {
                  const isOurTeam = team.isCurrent || (currentTeamName ? team.teamName.toLowerCase() === currentTeamName.toLowerCase() : team.teamName.toLowerCase().includes('egerton'));
                  const formList = (team.recentForm && team.recentForm.length > 0)
                    ? team.recentForm
                    : ['W', 'W', 'D', 'W', 'L', 'W'] as ('W' | 'D' | 'L')[];
                  const ptsL6 = calculateFormPoints(formList);

                  return (
                    <tr
                      key={team.teamName || idx}
                      className={`hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors ${
                        isOurTeam ? 'border-l-2 border-l-[#ff0046]/40 bg-[#ff0046]/4 dark:bg-[#ff0046]/6' : 'border-l-2 border-l-transparent'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                        {team.position}.
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {team.teamLogo ? (
                            <img
                              src={team.teamLogo}
                              alt={team.teamName}
                              className="w-4.5 h-4.5 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-4.5 h-4.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0 flex items-center justify-center text-[8px] font-black">
                              {team.teamName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className={`truncate ${
                            isOurTeam ? 'font-black text-slate-900 dark:text-white' : 'font-extrabold text-slate-800 dark:text-slate-200'
                          }`}>
                            {team.teamName}
                          </span>
                          {isOurTeam && (
                            <span className="text-[9px] bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/20 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shrink-0">
                              Our Club
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-600 dark:text-slate-300">
                        {team.played}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {render6FormBadges(formList)}
                      </td>

                      <td className="py-2.5 px-4 text-center font-black font-mono text-sm text-[#00b04f]">
                        {ptsL6}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. FIXTURES & MATCH SCHEDULE (FLASHSCORE GUEST FEED STYLE) */}
      <section className="w-full mt-10 sm:mt-4 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
        {/* Flashscore Filter Row */}
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#ff0046]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Fixtures & Match Results
            </h3>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {([
              { id: 'ALL' as const, label: 'All Matches' },
              { id: 'UPCOMING' as const, label: 'Upcoming' },
              { id: 'FINISHED' as const, label: 'Past Results' },
            ]).map((filter) => {
              const isActive = activeFixtureFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFixtureFilter(filter.id)}
                  className={`px-3 py-1 rounded-full text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#ff0046] text-white shadow-xs'
                      : 'bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3450]'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fixtures Feed */}
        {filteredFixtures.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-1">
            <Calendar className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              No matches found for filter: {activeFixtureFilter.toLowerCase()}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
            {filteredFixtures.map((fixture) => {
              const isFinished = fixture.status === 'FINISHED';
              const isLive = fixture.status === 'LIVE';
              const isHome = fixture.isHome !== false;
              const homeName = fixture.homeTeamName || (isHome ? (currentTeamName || 'Egerton FC') : fixture.opponentName);
              const homeLogo = fixture.homeTeamLogo || (isHome ? currentTeamLogo : fixture.opponentLogo);
              const awayName = fixture.awayTeamName || (!isHome ? (currentTeamName || 'Egerton FC') : fixture.opponentName);
              const awayLogo = fixture.awayTeamLogo || (!isHome ? currentTeamLogo : fixture.opponentLogo);
              const isOurHomeTeam = currentTeamName ? homeName.toLowerCase() === currentTeamName.toLowerCase() : isHome;
              const isOurAwayTeam = currentTeamName ? awayName.toLowerCase() === currentTeamName.toLowerCase() : !isHome;

              return (
                <div
                  key={fixture.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors"
                >
                  {/* Left Column: Match Status / Time & Matchday */}
                  <div className="w-24 text-center flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block whitespace-nowrap">
                      MD{fixture.matchday || 1} • {fixture.date}
                    </span>
                    {isLive ? (
                      <span className="text-[11px] font-extrabold text-[#ff0046] flex items-center gap-0.5 mt-0.5">
                        <Radio className="w-3 h-3 animate-pulse" />
                        LIVE
                      </span>
                    ) : isFinished ? (
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                        Finished
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                        {formatMatchTime(fixture.scheduled_time || fixture.time)}
                      </span>
                    )}
                  </div>

                  {/* Middle Column: Two Stacked Teams */}
                  <div className="flex-1 px-3 flex flex-col justify-center gap-1.5 min-w-0">
                    {/* Team Home */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {homeLogo ? (
                          <img
                            src={homeLogo}
                            alt={homeName}
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">
                            {homeName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className={`text-xs truncate ${
                          isOurHomeTeam ? 'font-black text-[#ff0046]' : 'font-bold text-slate-800 dark:text-slate-100'
                        }`}>
                          {homeName}
                        </span>
                      </div>
                      {fixture.score && (
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white ml-2">
                          {fixture.score.split('-')[0]?.trim() || '0'}
                        </span>
                      )}
                    </div>

                    {/* Team Away */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {awayLogo ? (
                          <img
                            src={awayLogo}
                            alt={awayName}
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">
                            {awayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className={`text-xs truncate ${
                          isOurAwayTeam ? 'font-black text-[#ff0046]' : 'font-bold text-slate-800 dark:text-slate-100'
                        }`}>
                          {awayName}
                        </span>
                      </div>
                      {fixture.score && (
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white ml-2">
                          {fixture.score.split('-')[1]?.trim() || '0'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Venue */}
                  <div className="text-right hidden sm:flex flex-col items-end justify-center text-[10px] text-slate-400 shrink-0 min-w-[100px]">
                    {fixture.location && (
                      <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#ff0046]" />
                        <span className="truncate max-w-[110px]">{formatMatchPitch(fixture.location, true) || fixture.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default StandingsPage;
