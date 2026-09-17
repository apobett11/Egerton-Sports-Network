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
  Radio,
  PenTool,
} from 'lucide-react';

interface StandingsPageProps {
  standings: StandingEntry[];
  fixtures: Match[];
  teamForm?: TeamFormEntry[];
  currentTeamName?: string;
  currentTeamLogo?: string;
  onOpenMatchEventsModal?: (matchId?: string) => void;
}

export const StandingsPage: React.FC<StandingsPageProps> = ({
  standings,
  fixtures,
  currentTeamName,
  currentTeamLogo,
  onOpenMatchEventsModal,
}) => {
  const [showFullStandings, setShowFullStandings] = useState<boolean>(false);
  const [showFullFormTable, setShowFullFormTable] = useState<boolean>(false);
  const [activeFixtureFilter, setActiveFixtureFilter] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');

  // Find index of current team in standings
  const currentTeamIndex = useMemo(() => {
    const idx = standings.findIndex(
      (t) =>
        t.isCurrent ||
        (currentTeamName && t.teamName.toLowerCase() === currentTeamName.toLowerCase()) ||
        t.teamName.toLowerCase().includes('egerton')
    );
    return idx !== -1 ? idx : 3;
  }, [standings, currentTeamName]);

  // Contextual 5-team snippet: 2 above, current team, 2 below (or all teams if <= 5)
  const contextualStandings = useMemo(() => {
    if (showFullStandings || standings.length <= 5) return standings;
    let startIdx = Math.max(0, currentTeamIndex - 2);
    let endIdx = startIdx + 5;
    if (endIdx > standings.length) {
      endIdx = standings.length;
      startIdx = Math.max(0, endIdx - 5);
    }
    return standings.slice(startIdx, endIdx);
  }, [standings, currentTeamIndex, showFullStandings]);

  const contextualFormStandings = useMemo(() => {
    if (showFullFormTable || standings.length <= 5) return standings;
    let startIdx = Math.max(0, currentTeamIndex - 2);
    let endIdx = startIdx + 5;
    if (endIdx > standings.length) {
      endIdx = standings.length;
      startIdx = Math.max(0, endIdx - 5);
    }
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

  // Minimalist 6-Form Badges
  const render6FormBadges = (formList: ('W' | 'D' | 'L')[]) => {
    if (!formList || formList.length === 0) {
      return <span className="text-xs text-slate-400 font-medium">—</span>;
    }
    const form6 = formList.slice(-6);

    return (
      <div className="flex items-center gap-1 justify-center">
        {form6.map((res, i) => (
          <span
            key={i}
            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] text-white shadow-xs transition-transform hover:scale-105 select-none ${
              res === 'W'
                ? 'bg-[#00b04f]'
                : res === 'D'
                ? 'bg-amber-500'
                : res === 'L'
                ? 'bg-[#ff0046]'
                : 'bg-slate-400'
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
    <div className="space-y-6 max-w-7xl mx-auto w-full select-none pb-24 sm:pb-16">
      {/* 1. GOOGLE FORMS MINIMALIST PAGE HEADER */}
      <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-[#ff0046] to-[#00b04f]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Table & Fixtures Desk
                </h1>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-[#00b04f] border border-emerald-500/20">
                2026/27 Season
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl pl-10.5">
              Official League Standings & Fixtures Desk: real-time matchday fixtures, standings rankings, and competitive form spectrum.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto pl-10.5 sm:pl-0">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-bold text-slate-400 block">Total Fixtures</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{fixtures.length} matches</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CARD 1: LEAGUE STANDINGS TABLE */}
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl overflow-hidden shadow-xs relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-[#ff0046]" />
        {/* Card Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#14263b] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0b1623]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#ff0046]/10 text-[#ff0046] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white">
                {showFullStandings ? 'Full League Standings' : 'League Standings Snippet (2 Above, Our Club, 2 Below)'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {showFullStandings ? `Complete ${standings.length}-club leaderboard` : 'Focused 5-club competitive zone'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFullStandings((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#152a40] hover:bg-slate-100 dark:hover:bg-[#1c3857] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
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
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[540px] sm:min-w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#14263b] text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-[#0b1623]/30">
                <th className="py-3 px-3 text-center w-10">#</th>
                <th className="py-3 px-4 min-w-[160px] sm:min-w-[220px]">Club</th>
                <th className="py-3 px-2.5 text-center w-10">MP</th>
                <th className="py-3 px-2.5 text-center w-10">W</th>
                <th className="py-3 px-2.5 text-center w-10">D</th>
                <th className="py-3 px-2.5 text-center w-10">L</th>
                <th className="py-3 px-3 text-center w-24 whitespace-nowrap">GD</th>
                <th className="py-3 px-4 text-center w-14 font-black text-slate-900 dark:text-white">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#14263b]">
              {contextualStandings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-xs text-slate-400 font-medium">
                    No league standings data recorded.
                  </td>
                </tr>
              ) : (
                contextualStandings.map((team, idx) => {
                  const isOurTeam =
                    team.isCurrent ||
                    (currentTeamName
                      ? team.teamName.toLowerCase() === currentTeamName.toLowerCase()
                      : team.teamName.toLowerCase().includes('egerton'));

                  const isTop4 = team.position <= 4;

                  return (
                    <tr
                      key={team.teamName || idx}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#13263b]/70 transition-colors ${
                        isOurTeam
                          ? 'bg-[#ff0046]/5 dark:bg-[#ff0046]/10 font-bold'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black ${
                            isOurTeam
                              ? 'bg-[#ff0046] text-white'
                              : isTop4
                              ? 'bg-emerald-500/15 text-[#00b04f]'
                              : 'text-slate-400'
                          }`}
                        >
                          {team.position}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {((isOurTeam && currentTeamLogo) ? currentTeamLogo : team.teamLogo) ? (
                            <img
                              src={(isOurTeam && currentTeamLogo) ? currentTeamLogo : team.teamLogo}
                              alt={team.teamName}
                              className="w-6 h-6 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-white/10"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 flex items-center justify-center text-[9px] font-black border border-slate-200/60 dark:border-white/10">
                              {team.teamName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`truncate ${
                              isOurTeam
                                ? 'font-black text-slate-900 dark:text-white'
                                : 'font-semibold text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {team.teamName}
                          </span>
                          {isOurTeam && (
                            <span className="text-[9px] bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                              Our Club
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-2.5 text-center font-medium text-slate-600 dark:text-slate-300">
                        {team.played}
                      </td>
                      <td className="py-3 px-2.5 text-center font-medium text-slate-600 dark:text-slate-300">
                        {team.won}
                      </td>
                      <td className="py-3 px-2.5 text-center font-medium text-slate-600 dark:text-slate-300">
                        {team.drawn}
                      </td>
                      <td className="py-3 px-2.5 text-center font-medium text-slate-600 dark:text-slate-300">
                        {team.lost}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {team.goalsFor}:{team.goalsAgainst}{' '}
                        <span className={team.goalDifference > 0 ? 'text-[#00b04f]' : team.goalDifference < 0 ? 'text-[#ff0046]' : ''}>
                          ({team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-black font-mono text-sm text-slate-900 dark:text-white">
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

      {/* 3. CARD 2: RECENT FORM STANDINGS */}
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl overflow-hidden shadow-xs relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00b04f] to-teal-500" />
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#14263b] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0b1623]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-[#00b04f] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white">
                {showFullFormTable ? 'Full Recent Form Standings' : 'Form Standings Snippet (Latest 6 Games Spectrum)'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Momentum tracker across the latest 6 competitive fixtures
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFullFormTable((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#152a40] hover:bg-slate-100 dark:hover:bg-[#1c3857] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
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
              <tr className="border-b border-slate-100 dark:border-[#14263b] text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-[#0b1623]/30">
                <th className="py-3 px-3 text-center w-10">#</th>
                <th className="py-3 px-4 min-w-[160px] sm:min-w-[220px]">Club</th>
                <th className="py-3 px-3 text-center w-12">Played</th>
                <th className="py-3 px-4 text-center min-w-[160px]">Last 6 Matches</th>
                <th className="py-3 px-4 text-center w-16 font-black text-slate-900 dark:text-white">PTS (L6)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#14263b]">
              {contextualFormStandings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-4 text-center text-xs text-slate-400 font-medium">
                    No recent form data available.
                  </td>
                </tr>
              ) : (
                contextualFormStandings.map((team, idx) => {
                  const isOurTeam =
                    team.isCurrent ||
                    (currentTeamName
                      ? team.teamName.toLowerCase() === currentTeamName.toLowerCase()
                      : team.teamName.toLowerCase().includes('egerton'));

                  const formList =
                    team.recentForm && team.recentForm.length > 0
                      ? team.recentForm
                      : (['W', 'W', 'D', 'W', 'L', 'W'] as ('W' | 'D' | 'L')[]);
                  const ptsL6 = calculateFormPoints(formList);

                  return (
                    <tr
                      key={team.teamName || idx}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#13263b]/70 transition-colors ${
                        isOurTeam ? 'bg-[#ff0046]/5 dark:bg-[#ff0046]/10 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <span className="text-slate-400 font-mono text-[11px] font-bold">
                          {team.position}.
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {((isOurTeam && currentTeamLogo) ? currentTeamLogo : team.teamLogo) ? (
                            <img
                              src={(isOurTeam && currentTeamLogo) ? currentTeamLogo : team.teamLogo}
                              alt={team.teamName}
                              className="w-6 h-6 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-white/10"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 flex items-center justify-center text-[9px] font-black border border-slate-200/60 dark:border-white/10">
                              {team.teamName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`truncate ${
                              isOurTeam
                                ? 'font-black text-slate-900 dark:text-white'
                                : 'font-semibold text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {team.teamName}
                          </span>
                          {isOurTeam && (
                            <span className="text-[9px] bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                              Our Club
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-600 dark:text-slate-300">
                        {team.played}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {render6FormBadges(formList)}
                      </td>

                      <td className="py-3 px-4 text-center font-black font-mono text-sm text-[#00b04f]">
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

      {/* 4. CARD 3: FIXTURES & MATCH SCHEDULE */}
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl overflow-hidden shadow-xs relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        {/* Header & Segmented Pill Controls */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#14263b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0b1623]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#ff0046]/10 text-[#ff0046] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white">
                Fixtures & Match Results
              </h2>
              <p className="text-[11px] text-slate-400">
                Scheduled fixtures, kick-off times, and official FT scorelines
              </p>
            </div>
          </div>

          {/* Minimalist Segmented Filter Buttons (Contract with Playwright tests) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center p-0.5 rounded-xl bg-slate-200/60 dark:bg-[#14263b] border border-slate-200/80 dark:border-white/5">
              <button
                type="button"
                onClick={() => setActiveFixtureFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFixtureFilter === 'ALL'
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Matches
              </button>

              <button
                type="button"
                onClick={() => setActiveFixtureFilter('UPCOMING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFixtureFilter === 'UPCOMING'
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Upcoming
              </button>

              <button
                type="button"
                onClick={() => setActiveFixtureFilter('FINISHED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFixtureFilter === 'FINISHED'
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Past Results
              </button>
            </div>

            {onOpenMatchEventsModal && (
              <button
                type="button"
                onClick={() => onOpenMatchEventsModal()}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Record Events</span>
              </button>
            )}
          </div>
        </div>

        {/* Fixtures Feed */}
        {filteredFixtures.length === 0 ? (
          <div className="py-14 px-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#14263b] flex items-center justify-center mx-auto text-slate-400">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              No matches found for filter: {activeFixtureFilter.toLowerCase()}
            </p>
            <p className="text-[11px] text-slate-400">
              Try switching back to 'All Matches' to view the complete season schedule.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#14263b]">
            {filteredFixtures.map((fixture) => {
              const isFinished = fixture.status === 'FINISHED';
              const isLive = fixture.status === 'LIVE';
              const isHome = fixture.isHome !== false;
              const homeName = fixture.homeTeamName || (isHome ? currentTeamName || 'Egerton FC' : fixture.opponentName);
              const awayName = fixture.awayTeamName || (!isHome ? currentTeamName || 'Egerton FC' : fixture.opponentName);
              const isOurHomeTeam = currentTeamName ? homeName.toLowerCase() === currentTeamName.toLowerCase() : isHome;
              const isOurAwayTeam = currentTeamName ? awayName.toLowerCase() === currentTeamName.toLowerCase() : !isHome;
              const homeLogo = isOurHomeTeam && currentTeamLogo ? currentTeamLogo : (fixture.homeTeamLogo || (isHome ? currentTeamLogo : fixture.opponentLogo));
              const awayLogo = isOurAwayTeam && currentTeamLogo ? currentTeamLogo : (fixture.awayTeamLogo || (!isHome ? currentTeamLogo : fixture.opponentLogo));

              return (
                <div
                  key={fixture.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-[#13263b]/70 transition-colors gap-3"
                >
                  {/* Left Column: Matchday & Date / Status */}
                  <div className="w-24 text-center flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block whitespace-nowrap">
                      MD{fixture.matchday || 1} • {fixture.date}
                    </span>
                    {isLive ? (
                      <span className="text-[11px] font-extrabold text-[#ff0046] flex items-center gap-1 mt-0.5 animate-pulse">
                        <Radio className="w-3 h-3" />
                        LIVE
                      </span>
                    ) : isFinished ? (
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5">
                        Finished
                      </span>
                    ) : (
                      <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">
                        {formatMatchTime(fixture.scheduled_time || fixture.time)}
                      </span>
                    )}
                  </div>

                  {/* Middle Column: Two Teams & Score */}
                  <div className="flex-1 px-2 sm:px-4 flex flex-col justify-center gap-2 min-w-0">
                    {/* Home Team */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {homeLogo ? (
                          <img
                            src={homeLogo}
                            alt={homeName}
                            className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200/60 dark:border-white/10"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            {homeName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`text-xs truncate ${
                            isOurHomeTeam
                              ? 'font-black text-[#ff0046]'
                              : 'font-semibold text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {homeName}
                        </span>
                      </div>
                      {fixture.score && (
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-[#14263b]">
                          {fixture.score.split('-')[0]?.trim() || '0'}
                        </span>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {awayLogo ? (
                          <img
                            src={awayLogo}
                            alt={awayName}
                            className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200/60 dark:border-white/10"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            {awayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`text-xs truncate ${
                            isOurAwayTeam
                              ? 'font-black text-[#ff0046]'
                              : 'font-semibold text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {awayName}
                        </span>
                      </div>
                      {fixture.score && (
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-[#14263b]">
                          {fixture.score.split('-')[1]?.trim() || '0'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Venue & Actions */}
                  <div className="text-right flex flex-col items-end justify-center gap-1.5 text-[10px] text-slate-400 shrink-0 min-w-[90px]">
                    {fixture.location && (
                      <span className="font-medium text-slate-600 dark:text-slate-300 hidden sm:flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#ff0046]" />
                        <span className="truncate max-w-[120px]">
                          {formatMatchPitch(fixture.location, true) || fixture.location}
                        </span>
                      </span>
                    )}
                    {isFinished && onOpenMatchEventsModal && (
                      <button
                        type="button"
                        onClick={() => onOpenMatchEventsModal(fixture.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-[10px] font-bold transition-all cursor-pointer"
                        title="Record scorers, assists and cards for this match"
                      >
                        Input Events
                      </button>
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
