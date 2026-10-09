import React, { useMemo } from 'react';
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

export const Leg1TeamAnalytics: React.FC<Leg1TeamAnalyticsProps> = ({
  teamName,
  teamLogo = '',
  teamId = '',
  standing,
  standings = [],
  fixtures,
}) => {
  // 1. Calculate Leg 1 Completed Matches
  const finishedMatches = useMemo(() => {
    return fixtures
      .filter((f) => f.status === 'FINISHED')
      .sort((a, b) => (a.scheduled_time || a.date || '').localeCompare(b.scheduled_time || b.date || ''));
  }, [fixtures]);

  // 2. Computed Core Record (Matches Fallback if Standings record not loaded yet)
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

    // If standing is missing or incomplete, derive from matches
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

  // 3. Last 5 Form Matches
  const formMatches = useMemo(() => {
    return finishedMatches.slice(-5).map((m) => {
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
      const opponent = isHome
        ? m.awayTeamName || m.opponentName || 'Opponent'
        : m.homeTeamName || m.opponentName || 'Opponent';

      let result: 'W' | 'D' | 'L' = 'D';
      if (teamScore > oppScore) result = 'W';
      else if (teamScore < oppScore) result = 'L';

      return {
        id: m.id,
        result,
        scoreText: `${teamScore}-${oppScore}`,
        opponent,
        isHome,
      };
    });
  }, [finishedMatches, teamName]);

  const formPoints = useMemo(() => {
    return formMatches.reduce((acc, m) => acc + (m.result === 'W' ? 3 : m.result === 'D' ? 1 : 0), 0);
  }, [formMatches]);

  // 4. Matchday-by-Matchday Position Trend Graph Calculation
  const positionTrend = useMemo(() => {
    if (finishedMatches.length === 0) {
      return [{ matchday: 1, pos: standing?.position || 1, result: 'W' as const }];
    }

    const totalTeams = standings.length > 0 ? standings.length : 10;
    const currentPos = standing?.position || Math.min(totalTeams, Math.max(1, 10 - stats.won));

    let runningPts = 0;
    let runningGD = 0;

    return finishedMatches.map((m, idx) => {
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
      const diff = teamScore - oppScore;

      let res: 'W' | 'D' | 'L' = 'D';
      if (diff > 0) {
        res = 'W';
        runningPts += 3;
      } else if (diff === 0) {
        res = 'D';
        runningPts += 1;
      } else {
        res = 'L';
      }
      runningGD += diff;

      // Realistic position estimation converging smoothly to current official rank
      const progress = (idx + 1) / finishedMatches.length;
      const maxPossiblePts = (idx + 1) * 3;
      const efficiency = maxPossiblePts > 0 ? runningPts / maxPossiblePts : 0.5;

      const estimatedRank = Math.max(
        1,
        Math.min(totalTeams, Math.round(totalTeams - efficiency * (totalTeams - 1)))
      );

      // Interpolate towards actual current rank at the end of the series
      const weightedPos = Math.round(estimatedRank * (1 - progress) + currentPos * progress);

      return {
        matchday: m.matchday || idx + 1,
        pos: idx === finishedMatches.length - 1 ? currentPos : weightedPos,
        result: res,
      };
    });
  }, [finishedMatches, standing?.position, standings.length, stats.won, teamName]);

  // 5. AI Tactical Analysis & Compliment-First Directive Generation
  const aiDirective = useMemo(() => {
    // Determine prominent strength for the compliment
    let compliment = '';
    if (stats.cleanSheetRate >= 35 || parseFloat(stats.gaPerGame) <= 0.9) {
      compliment = `Exceptional defensive compactness, collective box defending, and backline resilience have established ${teamName} as one of the most formidable defensive units in Leg 1.`;
    } else if (parseFloat(stats.gfPerGame) >= 1.6 || stats.gf >= 15) {
      compliment = `Outstanding offensive fluidity, incisive chance creation, and clinical frontline combinations have made ${teamName}'s attack a constant menace across campus derbies.`;
    } else if (stats.homePlayed > 0 && stats.homeWon / stats.homePlayed >= 0.6) {
      compliment = `Commanding home pitch dominance and relentless physical tempo have turned home fixtures into an impenetrable stronghold for ${teamName}.`;
    } else if (stats.winRate >= 50) {
      compliment = `Superb tactical maturity, disciplined game management, and matchday composure have consistently secured vital 3-point hauls throughout Leg 1.`;
    } else {
      compliment = `Commendable team fighting spirit, tactical adaptability, and unwavering work rate demonstrate high collective unity across every fixture.`;
    }

    // Determine exact single-line tactical focus (what needs to be changed in a positive note)
    let tacticalFocus = '';
    if (stats.deductionPts > 0) {
      tacticalFocus = `To overcome the official point sanction, sharpen ruthlessness in 1-goal margins to convert every competitive opportunity into maximum points.`;
    } else if (stats.drawn >= 3) {
      tacticalFocus = `To convert stalemates into runaway victories, commit secondary runners into the box during low-block second halves.`;
    } else if (stats.cleanSheetRate < 25 && parseFloat(stats.gaPerGame) > 1.2) {
      tacticalFocus = `To solidify league supremacy, tighten transitional rest-defense immediately after losing possession in the middle third.`;
    } else if (stats.awayPlayed > 0 && stats.awayWon === 0 && stats.played > 3) {
      tacticalFocus = `To solidify title contention, replicate the high-pressing intensity and early authority shown at home when traveling away.`;
    } else if (parseFloat(stats.gfPerGame) < 1.1) {
      tacticalFocus = `To maximize points efficiency, increase direct vertical tempo and deliver earlier crosses into the penalty area.`;
    } else {
      tacticalFocus = `To maintain top-tier consistency, sustain high-intensity pressing rotations and protect defensive shape in the closing 15 minutes.`;
    }

    return { compliment, tacticalFocus };
  }, [stats, teamName]);

  const teamPosition = standing?.position || positionTrend[positionTrend.length - 1]?.pos || 1;

  // SVG Trend Path Calculation
  const totalSlots = Math.max(positionTrend.length, 1);
  const minPos = 1;
  const maxPos = Math.max(10, standings.length || 10);

  const getSvgCoordinates = (index: number, pos: number) => {
    const x = totalSlots > 1 ? (index / (totalSlots - 1)) * 320 + 20 : 180;
    // Invert Y so #1 is top (y=15), bottom rank is bottom (y=85)
    const normalizedY = ((pos - minPos) / (maxPos - minPos));
    const y = 15 + normalizedY * 70;
    return { x, y };
  };

  const trendPoints = positionTrend.map((pt, idx) => getSvgCoordinates(idx, pt.pos));
  const polylineStr = trendPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full bg-[#0B1320] border border-purple-500/30 rounded-xl overflow-hidden shadow-xl mb-6 select-none animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. DOSSIER HEADER & OFFICIAL IDENTIFICATION                               */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-purple-950/70 via-[#101b2d] to-zinc-950 px-4 py-3 border-b border-purple-500/25 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-sm">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-600 text-white shadow-xs">
                LEG 1
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                Official Team Analytics
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase mt-0.5">
              {teamName} • Leg 1 Performance & Tactical Dossier
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-md bg-zinc-900/90 border border-purple-500/30 text-right">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase">Table Rank</span>
            <span className="text-xs font-black text-amber-400 font-mono">#{teamPosition}</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-zinc-900/90 border border-emerald-500/30 text-right">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase">Points</span>
            <span className="text-xs font-black text-emerald-400 font-mono">{stats.pts} PTS</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-5 space-y-5">
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
              <span className="text-[9px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full">
                ⚠️ -{stats.deductionPts} Pts Sanction Applied
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#070D18]">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-slate-900/90 text-[10px] font-black uppercase text-slate-400 border-b border-slate-800">
                  <th className="py-2 px-2.5 text-left">Pos</th>
                  <th className="py-2 px-3 text-left">Club</th>
                  <th className="py-2 px-2">P</th>
                  <th className="py-2 px-2">W</th>
                  <th className="py-2 px-2">D</th>
                  <th className="py-2 px-2">L</th>
                  <th className="py-2 px-2">GF</th>
                  <th className="py-2 px-2">GA</th>
                  <th className="py-2 px-2">GD</th>
                  <th className="py-2 px-3 font-extrabold text-white">PTS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800/60 font-medium text-slate-200 bg-purple-950/20">
                  <td className="py-2.5 px-2.5 text-left font-black text-amber-400 font-mono">
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
                  <td className={`py-2.5 px-2 font-mono font-bold ${stats.gd > 0 ? 'text-emerald-400' : stats.gd < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
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

          <div className="rounded-lg border border-slate-800 bg-[#070D18] p-3 flex flex-wrap items-center justify-between gap-3">
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
                    key={`${m.id}-${idx}`}
                    className="flex flex-col items-center gap-0.5"
                    title={`${m.result} vs ${m.opponent} (${m.scoreText})`}
                  >
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center text-[10.5px] font-black uppercase font-mono shadow-xs text-white ${
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
            <div className="flex items-center gap-3 divide-x divide-slate-800">
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
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. FULL PROFESSIONAL TEAM ANALYTICS GRID                                */}
        {/* ========================================================================= */}
        <div>
          <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Tactical & Performance Metrics Breakdown
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Metric 1: Clean Sheets & Conceded Rate */}
            <div className="bg-[#070D18] border border-slate-800/80 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-black uppercase">Clean Sheets</span>
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base sm:text-lg font-black text-white font-mono leading-none">
                {stats.cleanSheets} <span className="text-[10px] text-emerald-400 font-sans">({stats.cleanSheetRate}%)</span>
              </div>
              <span className="text-[9px] text-slate-400 mt-1 block font-medium">
                {stats.gaPerGame} goals conceded / match
              </span>
            </div>

            {/* Metric 2: Scoring Rate & Conversion */}
            <div className="bg-[#070D18] border border-slate-800/80 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-black uppercase">Goal Output</span>
                <Target className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-base sm:text-lg font-black text-white font-mono leading-none">
                {stats.gf} <span className="text-[10px] text-purple-400 font-sans">({stats.gfPerGame} GF/G)</span>
              </div>
              <span className="text-[9px] text-slate-400 mt-1 block font-medium">
                Net GD: <strong className={stats.gd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{stats.gd > 0 ? `+${stats.gd}` : stats.gd}</strong>
              </span>
            </div>

            {/* Metric 3: Home Dominance */}
            <div className="bg-[#070D18] border border-slate-800/80 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-black uppercase">Home Pitch</span>
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-base sm:text-lg font-black text-white font-mono leading-none">
                {stats.homeWon}W - {stats.homeDrawn}D - {stats.homeLost}L
              </div>
              <span className="text-[9px] text-slate-400 mt-1 block font-medium">
                {stats.homePlayed > 0 ? Math.round((stats.homeWon / stats.homePlayed) * 100) : 0}% Home Win Rate
              </span>
            </div>

            {/* Metric 4: Points Efficiency */}
            <div className="bg-[#070D18] border border-slate-800/80 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-black uppercase">PPG Efficiency</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base sm:text-lg font-black text-white font-mono leading-none">
                {stats.ppg} <span className="text-[10px] text-amber-400 font-sans">PPG</span>
              </div>
              <span className="text-[9px] text-slate-400 mt-1 block font-medium">
                {stats.winRate}% Win / {stats.drawRate}% Draw
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. POSITION TREND GRAPH UP TO NOW                                        */}
        {/* ========================================================================= */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              League Table Position Trend (Leg 1 Progression)
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Current Rank: #{teamPosition}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#070D18] p-3 sm:p-4">
            <div className="w-full h-32 relative">
              <svg viewBox="0 0 360 100" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal guide lines */}
                <line x1="20" y1="15" x2="340" y2="15" stroke="#1f2937" strokeDasharray="3 3" />
                <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2937" strokeDasharray="3 3" />
                <line x1="20" y1="85" x2="340" y2="85" stroke="#1f2937" strokeDasharray="3 3" />

                {/* Rank labels */}
                <text x="8" y="18" fill="#9ca3af" fontSize="8" fontFamily="monospace">#1</text>
                <text x="8" y="53" fill="#6b7280" fontSize="8" fontFamily="monospace">#5</text>
                <text x="8" y="88" fill="#4b5563" fontSize="8" fontFamily="monospace">#{maxPos}</text>

                {/* Area fill */}
                {trendPoints.length > 1 && (
                  <polygon
                    points={`${trendPoints[0].x},85 ${polylineStr} ${trendPoints[trendPoints.length - 1].x},85`}
                    fill="url(#trendGradient)"
                  />
                )}

                {/* Main line */}
                {trendPoints.length > 1 ? (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylineStr}
                  />
                ) : (
                  <circle cx="180" cy="50" r="4" fill="#10b981" />
                )}

                {/* Matchday Data Dots */}
                {trendPoints.map((pt, idx) => {
                  const m = positionTrend[idx];
                  return (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill={m.result === 'W' ? '#10b981' : m.result === 'D' ? '#f59e0b' : '#f43f5e'}
                        stroke="#070D18"
                        strokeWidth="1.5"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 7}
                        fill="#ffffff"
                        fontSize="7.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        #{m.pos}
                      </text>
                      <text
                        x={pt.x}
                        y="97"
                        fill="#64748b"
                        fontSize="7"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        M{m.matchday}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-1 border-t border-slate-800/60 mt-1">
              <span>Matchday 1</span>
              <span>Trajectory: {positionTrend[0]?.pos > teamPosition ? '📈 Climbing Upward' : '⚖️ Stable Competitive Stance'}</span>
              <span>Current Matchday</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. AI TACTICAL ADVICE & DIRECTIVE (COMPLIMENT FIRST PROTOCOL)            */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-[#0a1220] to-zinc-950 p-3 sm:p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-300">
              AI Tactical Directive • Coaching Staff & Squad Briefing
            </span>
            <span className="text-[8px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded-full ml-auto">
              PRO INSIGHT
            </span>
          </div>

          <div className="space-y-2">
            {/* Positive Compliment First */}
            <div className="flex items-start gap-2 bg-emerald-950/30 border border-emerald-500/25 rounded-lg p-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">
                  Squad Strength & Merit
                </span>
                <p className="text-[11px] sm:text-xs text-slate-200 leading-snug font-medium">
                  {aiDirective.compliment}
                </p>
              </div>
            </div>

            {/* Exactly One-Line Tactical Focus (Where the Issue is, in a Positive Note) */}
            <div className="flex items-start gap-2 bg-purple-950/30 border border-purple-500/30 rounded-lg p-2.5">
              <Target className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-purple-300 block mb-0.5">
                  Tactical Focus For Leg 2 (Primary Priority)
                </span>
                <p className="text-[11px] sm:text-xs font-bold text-white leading-snug">
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
