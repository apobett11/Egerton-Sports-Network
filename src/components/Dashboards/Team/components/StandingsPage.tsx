import React, { useState, useMemo } from 'react';
import { StandingEntry, Match, TeamFormEntry } from '../types';
import { initialTeamForm } from '../mockData';
import {
  Trophy,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
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
  const [showFullTable, setShowFullTable] = useState<boolean>(false);
  const [activeFixtureFilter, setActiveFixtureFilter] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');

  // Find index of current team in standings
  const currentTeamIndex = useMemo(() => {
    const idx = standings.findIndex((t) => t.isCurrent || t.teamName.toLowerCase().includes('egerton'));
    return idx !== -1 ? idx : 3;
  }, [standings]);

  // Contextual 5-team snippet: 2 above, current team, 2 below
  const contextualStandings = useMemo(() => {
    if (showFullTable) return standings;
    const startIdx = Math.max(0, currentTeamIndex - 2);
    const endIdx = Math.min(standings.length, currentTeamIndex + 3);
    return standings.slice(startIdx, endIdx);
  }, [standings, currentTeamIndex, showFullTable]);

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
          className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[9px] md:text-[10px] font-black shadow-xs"
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
          className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-[9px] md:text-[10px] font-black shadow-xs"
          title="Loss"
        >
          ✗
        </span>
      );
    }
    return (
      <span
        key={idx}
        className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-[9px] md:text-[10px] font-black shadow-xs"
        title="Draw"
      >
        –
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full select-none pb-12">
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
            Official league standings with latest 6 matches form status and matchday fixture schedule.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 bg-[#161B22] border border-[#2A3441] px-3 py-1.5 rounded-xl">
            Live Database Synced
          </span>
        </div>
      </div>

      {/* 2. STANDINGS TABLE WITH LATEST 6 GAMES FORM IN THE TABLE */}
      <section className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#2A3441] pb-3 gap-2">
          <div>
            <h3 className="font-black text-sm md:text-base text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>{showFullTable ? 'Full League Standings' : 'Contextual Table Snippet (Top 5 Spectrum)'}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Showing 2 clubs above, your highlighted team, and 2 clubs below in the current table.
            </p>
          </div>

          <button
            onClick={() => setShowFullTable((prev) => !prev)}
            className="px-3.5 py-1.5 rounded-xl bg-[#0D1117] hover:bg-slate-800 text-slate-300 hover:text-white font-extrabold text-xs transition-colors border border-[#2A3441] flex items-center gap-1.5 cursor-pointer"
          >
            {showFullTable ? (
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

        {/* TABLE WRAPPER */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px] border-collapse">
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
                <th className="py-3 px-3 text-center font-black">PTS</th>
                <th className="py-3 px-4 text-center">FORM (LATEST 6)</th>
              </tr>
            </thead>
            <tbody>
              {contextualStandings.map((team, idx) => {
                const isOurTeam = team.isCurrent || team.teamName.toLowerCase().includes('egerton');
                const formList = team.recentForm || ['W', 'W', 'D', 'W', 'L', 'W'];

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
                    <td className="py-3.5 px-3 text-center font-mono font-black text-sm text-amber-400">
                      {team.points}
                    </td>

                    {/* FORM COLUMN (LATEST 6 GAMES WITH GREEN TICKS, RED CROSSES, YELLOW DRAWS) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {formList.map((outcome, formIdx) => renderFormBadge(outcome, formIdx))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. TEAM FIXTURES & UPCOMING MATCHES */}
      <section className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#2A3441] pb-3 gap-2">
          <div>
            <h3 className="font-black text-sm md:text-base text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Fixtures & Match Calendar</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Querying database fixtures for your authenticated team schedule.
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

        {/* FIXTURES LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredFixtures.map((fixture) => (
            <div
              key={fixture.id}
              className="p-4 rounded-2xl bg-[#0D1117] border border-[#2A3441] hover:border-emerald-500/40 transition-all space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {fixture.league}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  fixture.status === 'FINISHED'
                    ? 'bg-slate-800 text-slate-300'
                    : fixture.status === 'LIVE'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {fixture.status}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={fixture.opponentLogo} alt={fixture.opponentName} className="w-10 h-10 object-contain rounded-xl" />
                  <div>
                    <h4 className="font-extrabold text-sm text-white">vs {fixture.opponentName}</h4>
                    <span className="text-[11px] text-slate-400">{fixture.date} • {fixture.time}</span>
                  </div>
                </div>

                {fixture.score && (
                  <div className="px-3 py-1 rounded-xl bg-slate-900 font-mono font-black text-base text-emerald-400 border border-slate-800">
                    {fixture.score}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#2A3441]/60">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {fixture.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
