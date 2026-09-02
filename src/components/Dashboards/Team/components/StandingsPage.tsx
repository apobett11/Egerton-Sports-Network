import React, { useState, useMemo } from 'react';
import { StandingEntry, Match, TeamFormEntry } from '../types';
import {
  Trophy,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  Activity,
  UserCheck,
  Flame,
  Clock,
  Shield,
} from 'lucide-react';

interface StandingsPageProps {
  standings: StandingEntry[];
  fixtures: Match[];
  teamForm?: TeamFormEntry[];
}

export const StandingsPage: React.FC<StandingsPageProps> = ({
  standings,
  fixtures,
}) => {
  const [showFullStandings, setShowFullStandings] = useState<boolean>(false);
  const [showFullFormTable, setShowFullFormTable] = useState<boolean>(false);
  const [activeFixtureFilter, setActiveFixtureFilter] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');

  // Find index of current team in standings
  const currentTeamIndex = useMemo(() => {
    const idx = standings.findIndex((t) => t.isCurrent || t.teamName.toLowerCase().includes('egerton'));
    return idx !== -1 ? idx : 3;
  }, [standings]);

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

  const renderFormBadge = (outcome: 'W' | 'D' | 'L', idx: number) => {
    if (outcome === 'W') {
      return (
        <span
          key={idx}
          className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] md:text-xs font-black shadow-xs"
          title="Win"
        >
          ✓
        </span>
      );
    }
    if (outcome === 'L') {
      return (
        <span
          key={idx}
          className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-[10px] md:text-xs font-black shadow-xs"
          title="Loss"
        >
          ✗
        </span>
      );
    }
    return (
      <span
        key={idx}
        className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-[10px] md:text-xs font-black shadow-xs"
        title="Draw"
      >
        –
      </span>
    );
  };

  const calculateFormPoints = (formList: ('W' | 'D' | 'L')[]) => {
    return formList.reduce((sum, outcome) => {
      if (outcome === 'W') return sum + 3;
      if (outcome === 'D') return sum + 1;
      return sum;
    }, 0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full select-none pb-16">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#2A3441] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span>Table & Fixtures Desk</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Season 2026/27
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Points standings snippet, 6-match form spectrum, and full-width matchday fixtures schedule.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 bg-[#161B22] border border-[#2A3441] px-3 py-1.5 rounded-xl">
            Live Database Synced
          </span>
        </div>
      </div>

      {/* 2. TABLE 1: LEAGUE POINTS STANDINGS (5-TEAM SNIPPET) */}
      <section className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#2A3441] pb-3 gap-2">
          <div>
            <h3 className="font-black text-sm md:text-base text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>{showFullStandings ? 'Full League Standings' : 'League Standings Snippet (2 Above, Our Club, 2 Below)'}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Current table position, points total, and goal differential.
            </p>
          </div>

          <button
            onClick={() => setShowFullStandings((prev) => !prev)}
            className="px-3.5 py-1.5 rounded-xl bg-[#0D1117] hover:bg-slate-800 text-slate-300 hover:text-white font-extrabold text-xs transition-colors border border-[#2A3441] flex items-center gap-1.5 cursor-pointer"
          >
            {showFullStandings ? (
              <>
                <ChevronUp className="w-4 h-4 text-amber-400" />
                <span>Show 5-Team Snippet</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-amber-400" />
                <span>Expand Full Table ({standings.length} Teams)</span>
              </>
            )}
          </button>
        </div>

        {/* TABLE 1 WRAPPER */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-[#2A3441] text-slate-400 font-mono text-[10px] uppercase font-black tracking-wider">
                <th className="py-3 px-3 text-center w-12">POS</th>
                <th className="py-3 px-4">CLUB / TEAM</th>
                <th className="py-3 px-3 text-center">PL</th>
                <th className="py-3 px-3 text-center">W</th>
                <th className="py-3 px-3 text-center">D</th>
                <th className="py-3 px-3 text-center">L</th>
                <th className="py-3 px-3 text-center">GF</th>
                <th className="py-3 px-3 text-center">GA</th>
                <th className="py-3 px-3 text-center">GD</th>
                <th className="py-3 px-4 text-center font-black">PTS</th>
              </tr>
            </thead>
            <tbody>
              {contextualStandings.map((team, idx) => {
                const isOurTeam = team.isCurrent || team.teamName.toLowerCase().includes('egerton');
                return (
                  <tr
                    key={idx}
                    className={`border-b last:border-0 border-[#2A3441]/50 transition-all font-semibold ${
                      isOurTeam
                        ? 'bg-gradient-to-r from-emerald-950/60 to-teal-950/40 text-emerald-400 border-l-4 border-l-emerald-400'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center font-mono font-black text-xs">
                      {team.position}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold flex items-center gap-3">
                      <img src={team.teamLogo} alt={team.teamName} className="w-6 h-6 object-contain rounded-md" />
                      <span className={isOurTeam ? 'text-white font-black text-sm' : ''}>{team.teamName}</span>
                      {isOurTeam && (
                        <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          Our Club
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">{team.played}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-300">{team.won}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">{team.drawn}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">{team.lost}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">{team.goalsFor}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">{team.goalsAgainst}</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold">
                      {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-black text-sm text-amber-400">
                      {team.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. TABLE 2: FORM & MOMENTUM SPECTRUM (5-TEAM SNIPPET) */}
      <section className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#2A3441] pb-3 gap-2">
          <div>
            <h3 className="font-black text-sm md:text-base text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>{showFullFormTable ? 'Full Form Standings' : 'Form Standings Snippet (Latest 6 Games Spectrum)'}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Match outcomes with green tick (Win), red cross (Loss), yellow dash (Draw), and recent form points.
            </p>
          </div>

          <button
            onClick={() => setShowFullFormTable((prev) => !prev)}
            className="px-3.5 py-1.5 rounded-xl bg-[#0D1117] hover:bg-slate-800 text-slate-300 hover:text-white font-extrabold text-xs transition-colors border border-[#2A3441] flex items-center gap-1.5 cursor-pointer"
          >
            {showFullFormTable ? (
              <>
                <ChevronUp className="w-4 h-4 text-purple-400" />
                <span>Show 5-Team Snippet</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-purple-400" />
                <span>Expand Full Form Table ({standings.length} Teams)</span>
              </>
            )}
          </button>
        </div>

        {/* TABLE 2 WRAPPER */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-[#2A3441] text-slate-400 font-mono text-[10px] uppercase font-black tracking-wider">
                <th className="py-3 px-3 text-center w-12">POS</th>
                <th className="py-3 px-4">CLUB / TEAM</th>
                <th className="py-3 px-6 text-center">LAST 6 MATCHES</th>
                <th className="py-3 px-4 text-center">PTS (L6)</th>
                <th className="py-3 px-4 text-center">STREAK / STATUS</th>
              </tr>
            </thead>
            <tbody>
              {contextualFormStandings.map((team, idx) => {
                const isOurTeam = team.isCurrent || team.teamName.toLowerCase().includes('egerton');
                const formList = team.recentForm || ['W', 'W', 'D', 'W', 'L', 'W'];
                const ptsL6 = calculateFormPoints(formList);

                return (
                  <tr
                    key={idx}
                    className={`border-b last:border-0 border-[#2A3441]/50 transition-all font-semibold ${
                      isOurTeam
                        ? 'bg-gradient-to-r from-purple-950/50 to-indigo-950/40 text-purple-300 border-l-4 border-l-purple-400'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center font-mono font-black text-xs">
                      {team.position}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold flex items-center gap-3">
                      <img src={team.teamLogo} alt={team.teamName} className="w-6 h-6 object-contain rounded-md" />
                      <span className={isOurTeam ? 'text-white font-black text-sm' : ''}>{team.teamName}</span>
                      {isOurTeam && (
                        <span className="text-[9px] bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          Our Club
                        </span>
                      )}
                    </td>

                    {/* LATEST 6 GAMES FORM BREAKDOWN WITH TICKS/CROSSES/DASHES */}
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {formList.map((outcome, fIdx) => renderFormBadge(outcome, fIdx))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-black text-sm text-emerald-400">
                      {ptsL6} / 18
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#0D1117] border border-[#2A3441] text-slate-300">
                        {ptsL6 >= 13 ? '🔥 High Momentum' : ptsL6 >= 9 ? '⚡ Steady Form' : '⚠️ Mixed Form'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. FIXTURES & PAST GAMES IN STRETCHED INLINE CARDS WITH BREATHING SPACE */}
      <section className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#2A3441] pb-3 gap-2">
          <div>
            <h3 className="font-black text-sm md:text-base text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Fixtures & Match Calendar</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Official league schedule, venue assignments, and referee designations.
            </p>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-[#0D1117] border border-[#2A3441]">
            <button
              onClick={() => setActiveFixtureFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeFixtureFilter === 'ALL' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setActiveFixtureFilter('UPCOMING')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeFixtureFilter === 'UPCOMING' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveFixtureFilter('FINISHED')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeFixtureFilter === 'FINISHED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Past Results
            </button>
          </div>
        </div>

        {/* INLINE STRETCHED FIXTURES LIST WITH GENEROUS BREATHING SPACE */}
        <div className="space-y-3.5">
          {filteredFixtures.map((fixture) => {
            const isFinished = fixture.status === 'FINISHED';
            const isLive = fixture.status === 'LIVE';

            return (
              <div
                key={fixture.id}
                className="w-full p-4 md:p-5 rounded-2xl bg-[#0D1117] border border-[#2A3441] hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md"
              >
                {/* LEFT: MATCHDAY & METADATA */}
                <div className="space-y-1.5 md:w-1/4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      MD {fixture.matchday || 24}
                    </span>
                    <span className="text-[11px] font-bold text-slate-300 truncate">
                      {fixture.league}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      {fixture.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {fixture.time}
                    </span>
                  </div>
                </div>

                {/* CENTER: MATCHUP BOARD (HOME VS AWAY) */}
                <div className="flex-1 flex items-center justify-between sm:justify-center gap-4 md:gap-8 py-2 border-y md:border-y-0 md:border-x border-[#2A3441]/60 px-2 md:px-6">
                  {/* HOME / OUR CLUB */}
                  <div className="flex items-center gap-2.5 sm:w-44 justify-end">
                    <span className="font-extrabold text-xs md:text-sm text-white text-right">
                      Egerton FC
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                      EFC
                    </div>
                  </div>

                  {/* SCORELINE / VS BADGE */}
                  <div className="px-3.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-center shrink-0">
                    {fixture.score ? (
                      <span className="font-mono font-black text-sm md:text-base text-emerald-400">
                        {fixture.score}
                      </span>
                    ) : (
                      <span className="font-mono font-black text-xs text-amber-400 uppercase">
                        VS
                      </span>
                    )}
                  </div>

                  {/* AWAY / OPPONENT */}
                  <div className="flex items-center gap-2.5 sm:w-44 justify-start">
                    <img
                      src={fixture.opponentLogo}
                      alt={fixture.opponentName}
                      className="w-8 h-8 object-contain rounded-xl shrink-0"
                    />
                    <span className="font-extrabold text-xs md:text-sm text-slate-200 truncate">
                      {fixture.opponentName}
                    </span>
                  </div>
                </div>

                {/* RIGHT: VENUE, REFEREE & STATUS */}
                <div className="flex items-center justify-between md:justify-end gap-4 md:w-1/4">
                  <div className="text-left md:text-right space-y-0.5">
                    <div className="text-[11px] text-slate-300 font-semibold flex items-center md:justify-end gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{fixture.location}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center md:justify-end gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{fixture.referee || 'Ref. Kiplagat'}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase shrink-0 shadow-xs ${
                      isFinished
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : isLive
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {fixture.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
