import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Activity,
  Brain,
  Award,
  Sparkles,
  BarChart3,
  Calendar,
  Zap,
  Info,
  Layers,
  AlertTriangle,
  ChevronRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import type { Match, StandingEntry } from '../Dashboards/Team/types';
import { TeamLogo } from '../common/TeamLogo';

interface Leg1TeamAnalyticsProps {
  teamName: string;
  teamLogo?: string;
  teamId?: string;
  standing?: StandingEntry;
  standings?: StandingEntry[];
  fixtures: Match[];
}

// Points deductions map (official sanctions)
const OFFICIAL_SANCTIONS: Record<string, { pts: number; reason: string }> = {
  '10000000-0000-4000-8000-000000000007': { pts: 4, reason: 'Disciplinary sanction (4 pts deducted)' },
  '20000000-0000-4000-8000-000000000008': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
  '20000000-0000-4000-8000-000000000007': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
  '20000000-0000-4000-8000-000000000005': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
  '20000000-0000-4000-8000-00000000000a': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
};

type ActiveGraphTab = 'form' | 'winloss' | 'goals' | 'position' | 'cleansheets' | 'all';

interface MatchdayDataPoint {
  index: number;
  matchday: number;
  date: string;
  opponent: string;
  isHome: boolean;
  teamGoals: number;
  oppGoals: number;
  scoreText: string;
  result: 'W' | 'D' | 'L';
  amplitude: number; // +1.0 for W, 0.0 for D, -1.0 for L
  cumWins: number;
  cumLosses: number;
  cumDraws: number;
  cumGF: number;
  cumGA: number;
  cumGD: number;
  cumCleanSheets: number;
  isCleanSheet: boolean;
  cumPoints: number;
  estimatedPosition: number;
}

export const Leg1TeamAnalytics: React.FC<Leg1TeamAnalyticsProps> = ({
  teamName,
  teamLogo = '',
  teamId = '',
  standing,
  standings = [],
  fixtures,
}) => {
  const [activeGraph, setActiveGraph] = useState<ActiveGraphTab>('form');

  // 1. Separate Finished Matches (historical records) & Upcoming Matches (future schedule)
  const finishedMatches = useMemo(() => {
    return fixtures
      .filter((f) => f.status === 'FINISHED')
      .sort((a, b) => (a.scheduled_time || a.date || '').localeCompare(b.scheduled_time || b.date || ''));
  }, [fixtures]);

  const upcomingMatches = useMemo(() => {
    return fixtures
      .filter((f) => f.status !== 'FINISHED')
      .sort((a, b) => (a.scheduled_time || a.date || '').localeCompare(b.scheduled_time || b.date || ''));
  }, [fixtures]);

  // 2. Computed Core Record
  const stats = useMemo(() => {
    let played = standing?.played ?? 0;
    let won = standing?.won ?? 0;
    let drawn = standing?.drawn ?? 0;
    let lost = standing?.lost ?? 0;
    let gf = standing?.goalsFor ?? 0;
    let ga = standing?.goalsAgainst ?? 0;
    let pts = standing?.points ?? 0;

    let homePlayed = 0;
    let homeWon = 0;
    let homeDrawn = 0;
    let homeLost = 0;
    let homeGF = 0;
    let homeGA = 0;

    let awayPlayed = 0;
    let awayWon = 0;
    let awayDrawn = 0;
    let awayLost = 0;
    let awayGF = 0;
    let awayGA = 0;

    let cleanSheets = 0;
    let failedToScore = 0;

    finishedMatches.forEach((m) => {
      let sh = m.scoreHome ?? 0;
      let sa = m.scoreAway ?? 0;
      if (m.score && m.score.includes('-')) {
        const parts = m.score.split('-').map((s) => parseInt(s.trim(), 10));
        if (!isNaN(parts[0])) sh = parts[0];
        if (!isNaN(parts[1])) sa = parts[1];
      }

      const isHome = m.isHome ?? (m.homeTeamName === teamName);
      const teamScore = isHome ? sh : sa;
      const oppScore = isHome ? sa : sh;

      if (oppScore === 0) cleanSheets += 1;
      if (teamScore === 0) failedToScore += 1;

      if (isHome) {
        homePlayed += 1;
        homeGF += teamScore;
        homeGA += oppScore;
        if (teamScore > oppScore) homeWon += 1;
        else if (teamScore === oppScore) homeDrawn += 1;
        else homeLost += 1;
      } else {
        awayPlayed += 1;
        awayGF += teamScore;
        awayGA += oppScore;
        if (teamScore > oppScore) awayWon += 1;
        else if (teamScore === oppScore) awayDrawn += 1;
        else awayLost += 1;
      }
    });

    if (played === 0 && finishedMatches.length > 0) {
      played = finishedMatches.length;
      won = homeWon + awayWon;
      drawn = homeDrawn + awayDrawn;
      lost = homeLost + awayLost;
      gf = homeGF + awayGF;
      ga = homeGA + awayGA;
      pts = won * 3 + drawn;
    }

    const gd = gf - ga;
    const sanction = OFFICIAL_SANCTIONS[teamId];
    const deductionPts = sanction?.pts || 0;
    const effectivePts = Math.max(0, pts - (standing?.points ? 0 : deductionPts));

    const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
    const drawRate = played > 0 ? Math.round((drawn / played) * 100) : 0;
    const lossRate = played > 0 ? Math.round((lost / played) * 100) : 0;
    const cleanSheetRate = played > 0 ? Math.round((cleanSheets / played) * 100) : 0;
    const ppg = played > 0 ? (effectivePts / played).toFixed(2) : '0.00';
    const gfPerGame = played > 0 ? (gf / played).toFixed(1) : '0.0';
    const gaPerGame = played > 0 ? (ga / played).toFixed(1) : '0.0';

    return {
      played,
      won,
      drawn,
      lost,
      gf,
      ga,
      gd,
      pts: standing?.points ?? effectivePts,
      deductionPts,
      sanctionReason: sanction?.reason,
      homePlayed,
      homeWon,
      homeDrawn,
      homeLost,
      homeGF,
      homeGA,
      awayPlayed,
      awayWon,
      awayDrawn,
      awayLost,
      awayGF,
      awayGA,
      cleanSheets,
      failedToScore,
      cleanSheetRate,
      winRate,
      drawRate,
      lossRate,
      ppg,
      gfPerGame,
      gaPerGame,
    };
  }, [standing, finishedMatches, teamName, teamId]);

  // 3. Time Series Evolution (From Match 1 to Date)
  const timeSeries = useMemo<MatchdayDataPoint[]>(() => {
    const totalTeams = standings.length > 0 ? standings.length : 10;
    const finalRank = standing?.position || Math.min(totalTeams, Math.max(1, totalTeams - stats.won));

    let runWins = 0;
    let runLosses = 0;
    let runDraws = 0;
    let runGF = 0;
    let runGA = 0;
    let runCS = 0;
    let runPts = 0;

    return finishedMatches.map((m, idx) => {
      let sh = m.scoreHome ?? 0;
      let sa = m.scoreAway ?? 0;
      if (m.score && m.score.includes('-')) {
        const parts = m.score.split('-').map((s) => parseInt(s.trim(), 10));
        if (!isNaN(parts[0])) sh = parts[0];
        if (!isNaN(parts[1])) sa = parts[1];
      }

      const isHome = m.isHome ?? (m.homeTeamName === teamName);
      const teamGoals = isHome ? sh : sa;
      const oppGoals = isHome ? sa : sh;
      const opponent = isHome
        ? m.awayTeamName || m.opponentName || 'Opponent'
        : m.homeTeamName || m.opponentName || 'Opponent';

      let result: 'W' | 'D' | 'L' = 'D';
      let amplitude = 0.0;
      if (teamGoals > oppGoals) {
        result = 'W';
        amplitude = 1.0;
        runWins += 1;
        runPts += 3;
      } else if (teamGoals < oppGoals) {
        result = 'L';
        amplitude = -1.0;
        runLosses += 1;
      } else {
        result = 'D';
        amplitude = 0.0;
        runDraws += 1;
        runPts += 1;
      }

      runGF += teamGoals;
      runGA += oppGoals;
      const isCS = oppGoals === 0;
      if (isCS) runCS += 1;

      // Position convergence across matchdays
      const progress = (idx + 1) / finishedMatches.length;
      const maxPossiblePts = (idx + 1) * 3;
      const efficiency = maxPossiblePts > 0 ? runPts / maxPossiblePts : 0.5;
      const estimatedRank = Math.max(
        1,
        Math.min(totalTeams, Math.round(totalTeams - efficiency * (totalTeams - 1)))
      );
      const weightedPos = Math.round(estimatedRank * (1 - progress) + finalRank * progress);

      return {
        index: idx,
        matchday: m.matchday || idx + 1,
        date: m.date || m.scheduled_time || `MD ${idx + 1}`,
        opponent,
        isHome,
        teamGoals,
        oppGoals,
        scoreText: `${teamGoals}-${oppGoals}`,
        result,
        amplitude,
        cumWins: runWins,
        cumLosses: runLosses,
        cumDraws: runDraws,
        cumGF: runGF,
        cumGA: runGA,
        cumGD: runGF - runGA,
        cumCleanSheets: runCS,
        isCleanSheet: isCS,
        cumPoints: runPts,
        estimatedPosition: idx === finishedMatches.length - 1 ? finalRank : weightedPos,
      };
    });
  }, [finishedMatches, teamName, standing?.position, standings.length, stats.won]);

  // 4. Form Matches (Last 5)
  const formMatches = useMemo(() => {
    return timeSeries.slice(-5);
  }, [timeSeries]);

  const formPoints = useMemo(() => {
    return formMatches.reduce((acc, m) => acc + (m.result === 'W' ? 3 : m.result === 'D' ? 1 : 0), 0);
  }, [formMatches]);

  const teamPosition = standing?.position || timeSeries[timeSeries.length - 1]?.estimatedPosition || 1;
  const totalTeams = standings.length > 0 ? standings.length : 10;

  // 5. Strategic AI Motivation ("Selling False Hope" & Coach Tactical Roadmap)
  const aiDirective = useMemo(() => {
    // Determine prominent squad compliment
    let compliment = '';
    if (stats.cleanSheetRate >= 35 || parseFloat(stats.gaPerGame) <= 0.9) {
      compliment = `High-level spatial compactness, aerial dominance in the box, and exceptional defensive discipline have anchored ${teamName} as one of the tournament's most impenetrable backlines.`;
    } else if (parseFloat(stats.gfPerGame) >= 1.6 || stats.gf >= 15) {
      compliment = `Electrifying attacking transition speed, pinpoint vertical combinations, and clinical finishing efficiency make ${teamName}'s frontline an elite offensive threat.`;
    } else if (stats.homePlayed > 0 && stats.homeWon / stats.homePlayed >= 0.6) {
      compliment = `Commanding physical presence and high-octane pressing tempo have transformed ${teamName}'s home ground into an intimidating tactical fortress.`;
    } else if (stats.winRate >= 50) {
      compliment = `Exemplary tactical maturity, resilient game management, and matchday composure under pressure have consistently delivered crucial three-point results.`;
    } else {
      compliment = `Unbreakable dressing room solidarity, relentless physical work rate, and fierce competitive character define ${teamName}'s collective identity.`;
    }

    // Inspect next upcoming fixture (e.g. tomorrow's final Leg 1 match or opening Leg 2 clash)
    const nextFixture = upcomingMatches[0];
    const nextOpponent = nextFixture
      ? nextFixture.isHome
        ? nextFixture.awayTeamName || nextFixture.opponentName
        : nextFixture.homeTeamName || nextFixture.opponentName
      : null;

    // Check if next fixture is tomorrow (2026-10-11 or impending)
    const isTomorrow = nextFixture
      ? (nextFixture.date && nextFixture.date.includes('2026-10-11')) ||
        (nextFixture.scheduled_time && nextFixture.scheduled_time.includes('2026-10-11'))
      : false;

    const nextMatchLabel = nextOpponent
      ? isTomorrow
        ? `tomorrow's Leg 1 finale against ${nextOpponent}`
        : `the upcoming encounter against ${nextOpponent}`
      : 'the opening Leg 2 fixture';

    // Tailor strategic "selling hope" motivation based on exact standing & upcoming fixture runway
    let strategicHope = '';
    const isFirst = teamPosition === 1;
    const isContender = teamPosition === 2 || teamPosition === 3;
    const isBottomThree = teamPosition >= totalTeams - 2;

    if (isFirst) {
      const runnerUp = standings[1] || { teamName: 'the chasers', points: Math.max(0, stats.pts - 3) };
      const lead = Math.max(1, stats.pts - runnerUp.points);
      strategicHope = `Holding a commanding +${stats.gd} goal differential and a ${lead}-point cushion at the summit, taking all 3 points in ${nextMatchLabel} followed by an aggressive Leg 2 opening sprint stretches the gap to a demoralizing ${lead + 6} points over ${runnerUp.teamName}. This will decisively crush our pursuers' psychological resolve and lock down the league championship early.`;
    } else if (isContender) {
      const leader = standings[0] || { teamName: 'the leaders', points: stats.pts + 3 };
      const deficit = Math.max(1, leader.points - stats.pts);
      strategicHope = `Trailing ${leader.teamName} by only ${deficit} points while carrying superior underlying chance generation (+${stats.gd} GD), seizing 3 points in ${nextMatchLabel} combined with our favorable Leg 2 opening schedule shifts the championship momentum squarely onto our pitch, pushing the leaders into panic mode.`;
    } else if (isBottomThree) {
      const safeRank = Math.max(1, totalTeams - 3);
      const safeTeam = standings[safeRank - 1] || { teamName: 'safety zone', points: stats.pts + 3 };
      const safetyGap = Math.max(1, safeTeam.points - stats.pts);
      strategicHope = `Relegation safety is completely within our grasp—a mere ${safetyGap} points separate us from complete security${stats.deductionPts > 0 ? ` even after absorbing the -${stats.deductionPts} pts sanction` : ''}. Clinching maximum points in ${nextMatchLabel} and targeting direct 6-pointer duels in early Leg 2 instantly vaults this squad clear of the drop zone and establishes safe mid-table comfort.`;
    } else {
      const podiumRank = 3;
      const podiumTeam = standings[podiumRank - 1] || { teamName: '3rd place', points: stats.pts + 3 };
      const podiumGap = Math.max(1, podiumTeam.points - stats.pts);
      strategicHope = `Sitting only ${podiumGap} points shy of the top-tier podium with high performance consistency, claiming maximum points in ${nextMatchLabel} and sustaining high pressing intensity into Leg 2 immediately launches this team into the elite championship playoff conversation.`;
    }

    // Exactly one or two lines on tactical fix (in a positive, constructive tone)
    let tacticalFocus = '';
    if (stats.deductionPts > 0) {
      tacticalFocus = `To triumph over the disciplinary sanction, channel collective hunger into high-tempo first-half finishes to seal matches before the 75th minute.`;
    } else if (stats.drawn >= 3) {
      tacticalFocus = `To convert tight stalemates into runaway victories, commit secondary central runners into the box during transitional second halves.`;
    } else if (stats.cleanSheetRate < 25 && parseFloat(stats.gaPerGame) > 1.2) {
      tacticalFocus = `To achieve complete defensive supremacy, synchronize the backline step-up and seal central channels within 5 seconds of losing possession.`;
    } else if (stats.awayPlayed > 0 && stats.awayWon === 0 && stats.played > 3) {
      tacticalFocus = `To turn away days into routine celebrations, project the same commanding physical authority and early high press displayed on our home pitch.`;
    } else if (parseFloat(stats.gfPerGame) < 1.1) {
      tacticalFocus = `To convert territorial dominance into goals, deliver earlier low crosses across the face of goal and take quick shots from the edge of the box.`;
    } else {
      tacticalFocus = `To sustain our elite winning rhythm, manage energy with smart ball circulation and maintain razor-sharp defensive shape through stoppage time.`;
    }

    return { compliment, strategicHope, tacticalFocus };
  }, [stats, teamPosition, totalTeams, standings, upcomingMatches, teamName]);

  // Safe fallback if zero matches played
  const matchCount = Math.max(timeSeries.length, 1);
  const chartWidth = 520;
  const leftMargin = 78;
  const rightMargin = 22;
  const plotWidth = chartWidth - leftMargin - rightMargin;

  const getX = (idx: number) => {
    if (timeSeries.length <= 1) return leftMargin + plotWidth / 2;
    return leftMargin + (idx / (timeSeries.length - 1)) * plotWidth;
  };

  return (
    <div className="w-full bg-[#0B1320] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl mb-6 select-none animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. DOSSIER HEADER & OFFICIAL IDENTIFICATION (APPLE HIG STYLE)            */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#111C2E] via-[#0E1726] to-[#0A101D] px-4 py-3.5 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-sm backdrop-blur-md">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs">
                LEG 1
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/90">
                Official Performance Dossier
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase mt-0.5">
              {teamName} • Leg 1 Tactical Analytics & Visual Graphs
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-right backdrop-blur-md">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase">Table Rank</span>
            <span className="text-xs font-black text-amber-400 font-mono">#{teamPosition}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-emerald-500/30 text-right backdrop-blur-md">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase">Points</span>
            <span className="text-xs font-black text-emerald-400 font-mono">{stats.pts} PTS</span>
          </div>
        </div>
      </div>

      <div className="p-3.5 sm:p-5 space-y-5">
        {/* ========================================================================= */}
        {/* 2. THE GAME'S ROW IN THE STANDINGS                                       */}
        {/* ========================================================================= */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              Official Standings Row
            </span>
            {stats.deductionPts > 0 && (
              <span className="text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Sanction Applied: -{stats.deductionPts} Pts Deducted
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#070D18]">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-white/[0.03] text-[10px] font-black uppercase text-slate-400 border-b border-white/[0.08]">
                  <th className="py-2.5 px-3 text-left">Pos</th>
                  <th className="py-2.5 px-3 text-left">Club</th>
                  <th className="py-2.5 px-2">P</th>
                  <th className="py-2.5 px-2">W</th>
                  <th className="py-2.5 px-2">D</th>
                  <th className="py-2.5 px-2">L</th>
                  <th className="py-2.5 px-2">GF</th>
                  <th className="py-2.5 px-2">GA</th>
                  <th className="py-2.5 px-2">GD</th>
                  <th className="py-2.5 px-3 font-extrabold text-white">PTS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/[0.04] font-medium text-slate-200 bg-purple-950/20">
                  <td className="py-2.5 px-3 text-left font-black text-amber-400 font-mono">
                    #{teamPosition}
                  </td>
                  <td className="py-2.5 px-3 text-left">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <TeamLogo
                        teamId={teamId}
                        src={teamLogo}
                        alt={teamName}
                        className="w-4 h-4 rounded-full object-cover shrink-0 bg-slate-800"
                      />
                      <span className="font-bold text-white truncate">{teamName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 font-mono font-bold text-slate-300">{stats.played}</td>
                  <td className="py-2.5 px-2 font-mono text-emerald-400 font-bold">{stats.won}</td>
                  <td className="py-2.5 px-2 font-mono text-amber-400 font-bold">{stats.drawn}</td>
                  <td className="py-2.5 px-2 font-mono text-rose-400 font-bold">{stats.lost}</td>
                  <td className="py-2.5 px-2 font-mono text-slate-300">{stats.gf}</td>
                  <td className="py-2.5 px-2 font-mono text-slate-300">{stats.ga}</td>
                  <td
                    className={`py-2.5 px-2 font-mono font-bold ${
                      stats.gd > 0 ? 'text-emerald-400' : stats.gd < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {stats.gd > 0 ? `+${stats.gd}` : stats.gd}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-black text-emerald-400 text-sm">
                    {stats.pts}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. THE GAME'S ROW IN THE FORM TABLE                                      */}
        {/* ========================================================================= */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Leg 1 Form Table Row (Last 5 Fixtures)
            </span>
            <span className="text-[9.5px] font-mono text-zinc-400">
              Form Points: <strong className="text-white">{formPoints} / 15 PTS</strong>
            </span>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#070D18] p-3 flex flex-wrap items-center justify-between gap-3">
            {/* Form Sequence Pips */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight mr-1">
                Sequence:
              </span>
              {formMatches.length === 0 ? (
                <span className="text-xs text-slate-500 font-mono">No recent fixtures</span>
              ) : (
                formMatches.map((m, idx) => (
                  <div
                    key={`${m.matchday}-${idx}`}
                    className="flex flex-col items-center gap-0.5"
                    title={`${m.result} vs ${m.opponent} (${m.scoreText})`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10.5px] font-black uppercase font-mono shadow-xs text-white ${
                        m.result === 'W'
                          ? 'bg-emerald-600'
                          : m.result === 'D'
                          ? 'bg-amber-500'
                          : 'bg-rose-600'
                      }`}
                    >
                      {m.result}
                    </span>
                    <span className="text-[8.5px] font-mono text-slate-400 font-bold">
                      {m.scoreText}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Form Quick Metrics */}
            <div className="flex items-center gap-3 divide-x divide-white/[0.08]">
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Form PPG</span>
                <span className="text-xs font-black font-mono text-emerald-400 mt-1 block">
                  {formMatches.length > 0 ? (formPoints / formMatches.length).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="pl-3 text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Form Win%</span>
                <span className="text-xs font-black font-mono text-purple-400 mt-1 block">
                  {formMatches.length > 0
                    ? Math.round((formMatches.filter((m) => m.result === 'W').length / formMatches.length) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. FULL PROFESSIONAL TEAM ANALYTICS METRIC CARDS                         */}
        {/* ========================================================================= */}
        <div>
          <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Tactical & Performance Metrics Breakdown
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Metric 1: Clean Sheets & Conceded Rate */}
            <div className="bg-[#070D18] border border-white/[0.08] rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-black uppercase">Clean Sheets</span>
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base sm:text-lg font-black text-white font-mono leading-none">
                {stats.cleanSheets}{' '}
                <span className="text-[10px] text-emerald-400 font-sans">({stats.cleanSheetRate}%)</span>
              </div>
              <span className="text-[9px] text-slate-400 mt-1.5 block font-medium">
                {stats.gaPerGame} goals conceded / match
              </span>
            </div>

            {/* Metric 2: Scoring Rate & Conversion */}
            <div className="bg-[#070D18] border border-white/[0.08] rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-black uppercase">Goal Output</span>
                <Target className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-base sm:text-lg font-black text-white font-mono leading-none">
                {stats.gf} <span className="text-[10px] text-purple-400 font-sans">({stats.gfPerGame} GF/G)</span>
              </div>
              <span className="text-[9px] text-slate-400 mt-1.5 block font-medium">
                Net GD:{' '}
                <strong className={stats.gd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {stats.gd > 0 ? `+${stats.gd}` : stats.gd}
                </strong>
              </span>
            </div>

            {/* Metric 3: Home Dominance */}
            <div className="bg-[#070D18] border border-white/[0.08] rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-black uppercase">Home Pitch</span>
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-base sm:text-lg font-black text-white font-mono leading-none">
                {stats.homeWon}W - {stats.homeDrawn}D - {stats.homeLost}L
              </div>
              <span className="text-[9px] text-slate-400 mt-1.5 block font-medium">
                {stats.homePlayed > 0 ? Math.round((stats.homeWon / stats.homePlayed) * 100) : 0}% Home Win Rate
              </span>
            </div>

            {/* Metric 4: Points Efficiency */}
            <div className="bg-[#070D18] border border-white/[0.08] rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-black uppercase">PPG Efficiency</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base sm:text-lg font-black text-white font-mono leading-none">
                {stats.ppg} <span className="text-[10px] text-amber-400 font-sans">PPG</span>
              </div>
              <span className="text-[9px] text-slate-400 mt-1.5 block font-medium">
                {stats.winRate}% Win / {stats.drawRate}% Draw
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. PROFESSIONAL GRAPHS SUITE (APPLE DESIGN SEGMENTED CONTROLS)           */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Professional Match Analytics & Trajectory Graphs
            </span>

            {/* Apple-style Segmented Pills */}
            <div className="flex items-center flex-wrap bg-black/50 p-1 rounded-xl border border-white/10 gap-1 backdrop-blur-md">
              {[
                { id: 'form', label: 'Form (±1)' },
                { id: 'winloss', label: 'Wins vs Losses' },
                { id: 'goals', label: 'Goals Scored / Conceded' },
                { id: 'position', label: 'Position Trend' },
                { id: 'cleansheets', label: 'Clean Sheets' },
                { id: 'all', label: 'All Graphs' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveGraph(tab.id as ActiveGraphTab)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-tight transition-all duration-150 cursor-pointer ${
                    activeGraph === tab.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* GRAPH A: FORM CHANGE LINE GRAPH (+1 to -1 AMPLITUDE)                   */}
          {/* --------------------------------------------------------------------- */}
          {(activeGraph === 'form' || activeGraph === 'all') && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#070D18] p-3.5 sm:p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Form Change & Performance Amplitude
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Continuous trajectory from Match 1 to date (+1.0 for Win, 0.0 for Draw, -1.0 for Loss)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> +1.0 Win (Positive)
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> 0.0 Draw
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> -1.0 Loss (Negative)
                  </span>
                </div>
              </div>

              <div className="w-full h-44 relative">
                <svg viewBox={`0 0 ${chartWidth} 140`} className="w-full h-full overflow-visible">
                  <defs>
                    {/* Continuous gradient: Green positive (>0), Red negative (<0) */}
                    <linearGradient id="formAmplitudeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="42%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="58%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>

                    <linearGradient id="positiveAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>

                    <linearGradient id="negativeAreaGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Plot Lines & Side Scales */}
                  {/* +1.0 WIN (Y=25) */}
                  <line
                    x1={leftMargin}
                    y1="25"
                    x2={chartWidth - rightMargin}
                    y2="25"
                    stroke="#10b981"
                    strokeOpacity="0.25"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={leftMargin - 10}
                    y="29"
                    fill="#10b981"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    +1.0 WIN
                  </text>

                  {/* 0.0 DRAW BASELINE (Y=70) */}
                  <line
                    x1={leftMargin}
                    y1="70"
                    x2={chartWidth - rightMargin}
                    y2="70"
                    stroke="#64748b"
                    strokeOpacity="0.5"
                    strokeWidth="1.2"
                  />
                  <text
                    x={leftMargin - 10}
                    y="74"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    0.0 DRAW
                  </text>

                  {/* -1.0 LOSS (Y=115) */}
                  <line
                    x1={leftMargin}
                    y1="115"
                    x2={chartWidth - rightMargin}
                    y2="115"
                    stroke="#f43f5e"
                    strokeOpacity="0.25"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={leftMargin - 10}
                    y="119"
                    fill="#f43f5e"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    -1.0 LOSS
                  </text>

                  {/* Vertical matchday grid lines */}
                  {timeSeries.map((pt, idx) => (
                    <line
                      key={`grid-${idx}`}
                      x1={getX(idx)}
                      y1="20"
                      x2={getX(idx)}
                      y2="120"
                      stroke="#ffffff"
                      strokeOpacity="0.04"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Continuous Polyline */}
                  {timeSeries.length > 1 ? (
                    <polyline
                      fill="none"
                      stroke="url(#formAmplitudeGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={timeSeries
                        .map((pt, idx) => {
                          const y = pt.amplitude === 1 ? 25 : pt.amplitude === 0 ? 70 : 115;
                          return `${getX(idx)},${y}`;
                        })
                        .join(' ')}
                    />
                  ) : timeSeries.length === 1 ? (
                    <circle
                      cx={getX(0)}
                      cy={timeSeries[0].amplitude === 1 ? 25 : timeSeries[0].amplitude === 0 ? 70 : 115}
                      r="4"
                      fill="#10b981"
                    />
                  ) : null}

                  {/* Plot Dots and Labels */}
                  {timeSeries.map((pt, idx) => {
                    const cx = getX(idx);
                    const cy = pt.amplitude === 1 ? 25 : pt.amplitude === 0 ? 70 : 115;
                    const dotColor = pt.amplitude === 1 ? '#10b981' : pt.amplitude === 0 ? '#f59e0b' : '#f43f5e';

                    return (
                      <g key={`amp-${idx}`}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r="4"
                          fill={dotColor}
                          stroke="#070D18"
                          strokeWidth="2"
                        />
                        {/* Score Text above dot */}
                        <text
                          x={cx}
                          y={cy - 8}
                          fill="#ffffff"
                          fontSize="7.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {pt.scoreText}
                        </text>
                        {/* X-axis Matchday label */}
                        <text
                          x={cx}
                          y="134"
                          fill="#64748b"
                          fontSize="7.5"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          M{pt.matchday}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-1.5 border-t border-white/[0.05] mt-1">
                <span>Start: Matchday 1</span>
                <span>Amplitude Swing: {stats.won}W / {stats.drawn}D / {stats.lost}L</span>
                <span>Latest: Matchday {timeSeries[timeSeries.length - 1]?.matchday || stats.played}</span>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* GRAPH B: WINS VS LOSSES (CUMULATIVE EVOLUTION)                         */}
          {/* --------------------------------------------------------------------- */}
          {(activeGraph === 'winloss' || activeGraph === 'all') && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#070D18] p-3.5 sm:p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Wins vs Losses Progression
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Cumulative tally of victories compared against defeats across all matchdays
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Cumulative Wins ({stats.won})
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Cumulative Losses ({stats.lost})
                  </span>
                </div>
              </div>

              <div className="w-full h-44 relative">
                {(() => {
                  const maxVal = Math.max(stats.won, stats.lost, stats.played, 5);
                  const getYVal = (val: number) => 115 - (val / maxVal) * 90;

                  const winPoints = timeSeries.map((pt, idx) => `${getX(idx)},${getYVal(pt.cumWins)}`).join(' ');
                  const lossPoints = timeSeries.map((pt, idx) => `${getX(idx)},${getYVal(pt.cumLosses)}`).join(' ');

                  return (
                    <svg viewBox={`0 0 ${chartWidth} 140`} className="w-full h-full overflow-visible">
                      {/* Grid Lines and Y-Axis scale */}
                      {[0, Math.round(maxVal / 2), maxVal].map((tickVal, i) => {
                        const y = getYVal(tickVal);
                        return (
                          <g key={`wl-tick-${i}`}>
                            <line
                              x1={leftMargin}
                              y1={y}
                              x2={chartWidth - rightMargin}
                              y2={y}
                              stroke="#ffffff"
                              strokeOpacity="0.08"
                              strokeDasharray="2 2"
                            />
                            <text
                              x={leftMargin - 10}
                              y={y + 3}
                              fill="#94a3b8"
                              fontSize="8.5"
                              fontFamily="monospace"
                              textAnchor="end"
                            >
                              {tickVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* Cumulative Wins Line (Emerald) */}
                      {timeSeries.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={winPoints}
                        />
                      )}

                      {/* Cumulative Losses Line (Rose) */}
                      {timeSeries.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={lossPoints}
                        />
                      )}

                      {/* Markers */}
                      {timeSeries.map((pt, idx) => {
                        const cx = getX(idx);
                        const cyWin = getYVal(pt.cumWins);
                        const cyLoss = getYVal(pt.cumLosses);
                        return (
                          <g key={`wl-marker-${idx}`}>
                            <circle cx={cx} cy={cyWin} r="3.5" fill="#10b981" stroke="#070D18" strokeWidth="1.5" />
                            <circle cx={cx} cy={cyLoss} r="3.5" fill="#f43f5e" stroke="#070D18" strokeWidth="1.5" />
                            <text
                              x={cx}
                              y="134"
                              fill="#64748b"
                              fontSize="7.5"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              M{pt.matchday}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-1.5 border-t border-white/[0.05] mt-1">
                <span>Win Ratio: {stats.winRate}%</span>
                <span>Draws: {stats.drawn}</span>
                <span>Loss Ratio: {stats.lossRate}%</span>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* GRAPH C: SCORED GOALS VS CONCEDED GOALS (WITH DEDUCTED PTS IN AMBER)   */}
          {/* --------------------------------------------------------------------- */}
          {(activeGraph === 'goals' || activeGraph === 'all') && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#070D18] p-3.5 sm:p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                    Goals Scored vs Conceded (Cumulative)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Attacking production vs defensive stability (Sanctions / deducted points highlighted in amber)
                  </p>
                </div>
                <div className="flex items-center flex-wrap gap-2.5 text-[9px] font-mono">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2.5 h-1.5 rounded-full bg-cyan-400 inline-block" /> Scored GF ({stats.gf})
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Conceded GA ({stats.ga})
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{' '}
                    {stats.deductionPts > 0 ? `-${stats.deductionPts} Pts Deducted` : 'Sanctions: 0'}
                  </span>
                </div>
              </div>

              <div className="w-full h-44 relative">
                {(() => {
                  const maxVal = Math.max(stats.gf, stats.ga, 10);
                  const getYVal = (val: number) => 115 - (val / maxVal) * 90;

                  const gfPoints = timeSeries.map((pt, idx) => `${getX(idx)},${getYVal(pt.cumGF)}`).join(' ');
                  const gaPoints = timeSeries.map((pt, idx) => `${getX(idx)},${getYVal(pt.cumGA)}`).join(' ');

                  return (
                    <svg viewBox={`0 0 ${chartWidth} 140`} className="w-full h-full overflow-visible">
                      {/* Grid Lines and Y-Axis scale */}
                      {[0, Math.round(maxVal / 2), maxVal].map((tickVal, i) => {
                        const y = getYVal(tickVal);
                        return (
                          <g key={`goals-tick-${i}`}>
                            <line
                              x1={leftMargin}
                              y1={y}
                              x2={chartWidth - rightMargin}
                              y2={y}
                              stroke="#ffffff"
                              strokeOpacity="0.08"
                              strokeDasharray="2 2"
                            />
                            <text
                              x={leftMargin - 10}
                              y={y + 3}
                              fill="#94a3b8"
                              fontSize="8.5"
                              fontFamily="monospace"
                              textAnchor="end"
                            >
                              {tickVal} G
                            </text>
                          </g>
                        );
                      })}

                      {/* Amber Deducted Points Zone / Indicator Line */}
                      {stats.deductionPts > 0 && (
                        <g>
                          <line
                            x1={leftMargin}
                            y1="25"
                            x2={chartWidth - rightMargin}
                            y2="25"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          <rect
                            x={chartWidth - rightMargin - 130}
                            y="16"
                            width="130"
                            height="18"
                            rx="4"
                            fill="#f59e0b"
                            fillOpacity="0.15"
                            stroke="#f59e0b"
                            strokeWidth="1"
                          />
                          <text
                            x={chartWidth - rightMargin - 65}
                            y="28"
                            fill="#fbbf24"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            ⚠️ -{stats.deductionPts} PTS SANCTION
                          </text>
                        </g>
                      )}

                      {/* Cumulative Goals Scored Line (Cyan) */}
                      {timeSeries.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={gfPoints}
                        />
                      )}

                      {/* Cumulative Goals Conceded Line (Rose) */}
                      {timeSeries.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={gaPoints}
                        />
                      )}

                      {/* Matchday Data Dots */}
                      {timeSeries.map((pt, idx) => {
                        const cx = getX(idx);
                        const cyGF = getYVal(pt.cumGF);
                        const cyGA = getYVal(pt.cumGA);
                        return (
                          <g key={`goals-dot-${idx}`}>
                            <circle cx={cx} cy={cyGF} r="3.5" fill="#06b6d4" stroke="#070D18" strokeWidth="1.5" />
                            <circle cx={cx} cy={cyGA} r="3.5" fill="#f43f5e" stroke="#070D18" strokeWidth="1.5" />
                            <text
                              x={cx}
                              y="134"
                              fill="#64748b"
                              fontSize="7.5"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              M{pt.matchday}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-1.5 border-t border-white/[0.05] mt-1">
                <span>Scored: {stats.gf} goals ({stats.gfPerGame} GF/G)</span>
                <span>Net Difference: {stats.gd > 0 ? `+${stats.gd}` : stats.gd}</span>
                <span>Conceded: {stats.ga} goals ({stats.gaPerGame} GA/G)</span>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* GRAPH D: POSITIONAL CHANGE GRAPH                                      */}
          {/* --------------------------------------------------------------------- */}
          {(activeGraph === 'position' || activeGraph === 'all') && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#070D18] p-3.5 sm:p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Table Position Evolution (Rank 1 to {totalTeams})
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Matchday-by-matchday rank progression (#1 at the summit, inverted scale)
                  </p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Current Rank: #{teamPosition}
                </span>
              </div>

              <div className="w-full h-44 relative">
                {(() => {
                  const minRank = 1;
                  const maxRank = Math.max(totalTeams, 10);
                  const getYPos = (rank: number) => {
                    const normalized = (rank - minRank) / (maxRank - minRank);
                    return 25 + normalized * 90;
                  };

                  const posPoints = timeSeries.map((pt, idx) => `${getX(idx)},${getYPos(pt.estimatedPosition)}`).join(' ');

                  return (
                    <svg viewBox={`0 0 ${chartWidth} 140`} className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="positionAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Rank Grid Lines & Scales */}
                      {[1, Math.round(maxRank / 2), maxRank].map((r, i) => {
                        const y = getYPos(r);
                        return (
                          <g key={`rank-tick-${i}`}>
                            <line
                              x1={leftMargin}
                              y1={y}
                              x2={chartWidth - rightMargin}
                              y2={y}
                              stroke="#ffffff"
                              strokeOpacity="0.08"
                              strokeDasharray="2 2"
                            />
                            <text
                              x={leftMargin - 10}
                              y={y + 3}
                              fill={r === 1 ? '#fbbf24' : '#94a3b8'}
                              fontSize="8.5"
                              fontFamily="monospace"
                              fontWeight={r === 1 ? 'bold' : 'normal'}
                              textAnchor="end"
                            >
                              #{r}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Fill */}
                      {timeSeries.length > 1 && (
                        <polygon
                          points={`${getX(0)},115 ${posPoints} ${getX(timeSeries.length - 1)},115`}
                          fill="url(#positionAreaGradient)"
                        />
                      )}

                      {/* Rank Curve Polyline */}
                      {timeSeries.length > 1 ? (
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={posPoints}
                        />
                      ) : timeSeries.length === 1 ? (
                        <circle cx={getX(0)} cy={getYPos(teamPosition)} r="4" fill="#10b981" />
                      ) : null}

                      {/* Matchday Data Dots */}
                      {timeSeries.map((pt, idx) => {
                        const cx = getX(idx);
                        const cy = getYPos(pt.estimatedPosition);
                        const dotColor = pt.result === 'W' ? '#10b981' : pt.result === 'D' ? '#f59e0b' : '#f43f5e';
                        return (
                          <g key={`pos-dot-${idx}`}>
                            <circle cx={cx} cy={cy} r="4" fill={dotColor} stroke="#070D18" strokeWidth="1.5" />
                            <text
                              x={cx}
                              y={cy - 7}
                              fill="#ffffff"
                              fontSize="7.5"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              #{pt.estimatedPosition}
                            </text>
                            <text
                              x={cx}
                              y="134"
                              fill="#64748b"
                              fontSize="7.5"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              M{pt.matchday}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-1.5 border-t border-white/[0.05] mt-1">
                <span>Matchday 1: #{timeSeries[0]?.estimatedPosition || teamPosition}</span>
                <span>
                  Trajectory:{' '}
                  {(timeSeries[0]?.estimatedPosition || teamPosition) > teamPosition
                    ? '📈 Climbing Upward'
                    : '⚖️ Table Position Stable'}
                </span>
                <span>Current: #{teamPosition}</span>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* GRAPH E: CLEAN SHEETS TRACKER                                         */}
          {/* --------------------------------------------------------------------- */}
          {(activeGraph === 'cleansheets' || activeGraph === 'all') && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#070D18] p-3.5 sm:p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Clean Sheet Milestones & Shutouts
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Accumulation of zero-conceded fixtures preserving clean sheets across the tournament
                  </p>
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  {stats.cleanSheets} Total ({stats.cleanSheetRate}%)
                </span>
              </div>

              <div className="w-full h-44 relative">
                {(() => {
                  const maxCS = Math.max(stats.cleanSheets, stats.played, 5);
                  const getYVal = (val: number) => 115 - (val / maxCS) * 90;

                  const csPoints = timeSeries.map((pt, idx) => `${getX(idx)},${getYVal(pt.cumCleanSheets)}`).join(' ');

                  return (
                    <svg viewBox={`0 0 ${chartWidth} 140`} className="w-full h-full overflow-visible">
                      {/* Grid Lines */}
                      {[0, Math.round(maxCS / 2), maxCS].map((tickVal, i) => {
                        const y = getYVal(tickVal);
                        return (
                          <g key={`cs-tick-${i}`}>
                            <line
                              x1={leftMargin}
                              y1={y}
                              x2={chartWidth - rightMargin}
                              y2={y}
                              stroke="#ffffff"
                              strokeOpacity="0.08"
                              strokeDasharray="2 2"
                            />
                            <text
                              x={leftMargin - 10}
                              y={y + 3}
                              fill="#94a3b8"
                              fontSize="8.5"
                              fontFamily="monospace"
                              textAnchor="end"
                            >
                              {tickVal} CS
                            </text>
                          </g>
                        );
                      })}

                      {/* Stepped / Polyline Clean Sheets Curve */}
                      {timeSeries.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={csPoints}
                        />
                      )}

                      {/* Shield Markers on Clean Sheet matches */}
                      {timeSeries.map((pt, idx) => {
                        const cx = getX(idx);
                        const cy = getYVal(pt.cumCleanSheets);
                        return (
                          <g key={`cs-dot-${idx}`}>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={pt.isCleanSheet ? 5 : 3}
                              fill={pt.isCleanSheet ? '#10b981' : '#475569'}
                              stroke="#070D18"
                              strokeWidth="1.5"
                            />
                            {pt.isCleanSheet && (
                              <text
                                x={cx}
                                y={cy - 8}
                                fill="#10b981"
                                fontSize="7"
                                fontFamily="monospace"
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                🛡️
                              </text>
                            )}
                            <text
                              x={cx}
                              y="134"
                              fill="#64748b"
                              fontSize="7.5"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              M{pt.matchday}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-1.5 border-t border-white/[0.05] mt-1">
                <span>Clean Sheets: {stats.cleanSheets} / {stats.played} matches</span>
                <span>Shutout Efficiency: {stats.cleanSheetRate}%</span>
                <span>Avg Conceded: {stats.gaPerGame} GA/match</span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 6. AI STRATEGIC DIRECTIVE & MOTIVATIONAL ROADMAP (SELLING FALSE HOPE)    */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-[#0a1220] to-zinc-950 p-4 sm:p-5 relative overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
              Pro Tactical Briefing & Strategic Leg 2 Roadmap
            </span>
            <span className="text-[8px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full ml-auto">
              HIGH MOTIVATION
            </span>
          </div>

          <div className="space-y-2.5">
            {/* 1. Positive Compliment First */}
            <div className="flex items-start gap-2.5 bg-emerald-950/30 border border-emerald-500/25 rounded-xl p-3">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">
                  Squad Identity & Verified Strengths
                </span>
                <p className="text-[11.5px] sm:text-xs text-slate-200 leading-relaxed font-medium">
                  {aiDirective.compliment}
                </p>
              </div>
            </div>

            {/* 2. Selling Strategic Hope (Upcoming Fixtures Motivation) */}
            <div className="flex items-start gap-2.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3">
              <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-300 block mb-0.5">
                  Next Step Projection • Path To Objective
                </span>
                <p className="text-[11.5px] sm:text-xs text-slate-200 leading-relaxed font-medium">
                  {aiDirective.strategicHope}
                </p>
              </div>
            </div>

            {/* 3. Single-Sentence Tactical Fix in Positive Note */}
            <div className="flex items-start gap-2.5 bg-purple-950/30 border border-purple-500/30 rounded-xl p-3">
              <Target className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-purple-300 block mb-0.5">
                  Tactical Priority For Squad Execution
                </span>
                <p className="text-[11.5px] sm:text-xs font-bold text-white leading-relaxed">
                  {aiDirective.tacticalFocus}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leg1TeamAnalytics;
