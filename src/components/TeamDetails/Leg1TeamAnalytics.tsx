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
  Clock,
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

// Official Points deductions map
const OFFICIAL_SANCTIONS: Record<string, { pts: number; reason: string }> = {
  '10000000-0000-4000-8000-000000000007': { pts: 4, reason: 'Disciplinary sanction (4 pts deducted)' },
  '20000000-0000-4000-8000-000000000008': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
  '20000000-0000-4000-8000-000000000007': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
  '20000000-0000-4000-8000-000000000005': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
  '20000000-0000-4000-8000-00000000000a': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
};

type ActiveGraphTab = 'winloss' | 'form' | 'goals' | 'position' | 'cleansheets' | 'all';

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
  const [activeGraph, setActiveGraph] = useState<ActiveGraphTab>('winloss');

  // 1. Filter Leg 1 Finished Matches: Strictly up to Matchday 10 (ignore matchday 22 or beyond Leg 1)
  const leg1FinishedMatches = useMemo(() => {
    return fixtures
      .filter((f) => {
        if (f.status !== 'FINISHED') return false;
        if (f.matchday === 22) return false;
        if (typeof f.matchday === 'number' && f.matchday > 10) return false;
        return true;
      })
      .sort((a, b) => (a.scheduled_time || a.date || '').localeCompare(b.scheduled_time || b.date || ''))
      .slice(0, 10); // Strictly max 10 completed matches for Leg 1 historical analysis
  }, [fixtures]);

  // 2. Identify Upcoming Tomorrow's Match (Matchday 11 - Final game of Leg 1)
  const upcomingMatches = useMemo(() => {
    return fixtures
      .filter((f) => f.status !== 'FINISHED' && f.matchday !== 22)
      .sort((a, b) => (a.scheduled_time || a.date || '').localeCompare(b.scheduled_time || b.date || ''));
  }, [fixtures]);

  const tomorrowMatch = useMemo(() => {
    return (
      upcomingMatches.find(
        (m) =>
          m.matchday === 11 ||
          (m.date && m.date.includes('2026-10-11')) ||
          (m.scheduled_time && m.scheduled_time.includes('2026-10-11'))
      ) ||
      upcomingMatches[0] ||
      null
    );
  }, [upcomingMatches]);

  // 3. Computed Core Statistics for Leg 1
  const stats = useMemo(() => {
    let played = leg1FinishedMatches.length;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let gf = 0;
    let ga = 0;
    let pts = 0;

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

    leg1FinishedMatches.forEach((m) => {
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

      gf += teamScore;
      ga += oppScore;

      if (oppScore === 0) cleanSheets += 1;
      if (teamScore === 0) failedToScore += 1;

      if (teamScore > oppScore) {
        won += 1;
        pts += 3;
      } else if (teamScore === oppScore) {
        drawn += 1;
        pts += 1;
      } else {
        lost += 1;
      }

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

    // Use official standing overrides if available, otherwise computed
    const officialPlayed = standing?.played ?? played;
    const officialWon = standing?.won ?? won;
    const officialDrawn = standing?.drawn ?? drawn;
    const officialLost = standing?.lost ?? lost;
    const officialGF = standing?.goalsFor ?? gf;
    const officialGA = standing?.goalsAgainst ?? ga;
    const officialPts = standing?.points ?? pts;

    const gd = officialGF - officialGA;
    const sanction = OFFICIAL_SANCTIONS[teamId];
    const deductionPts = sanction?.pts || 0;
    const effectivePts = Math.max(0, officialPts - (standing?.points ? 0 : deductionPts));

    const winRate = officialPlayed > 0 ? Math.round((officialWon / officialPlayed) * 100) : 0;
    const drawRate = officialPlayed > 0 ? Math.round((officialDrawn / officialPlayed) * 100) : 0;
    const lossRate = officialPlayed > 0 ? Math.round((officialLost / officialPlayed) * 100) : 0;
    const cleanSheetRate = officialPlayed > 0 ? Math.round((cleanSheets / officialPlayed) * 100) : 0;
    const ppg = officialPlayed > 0 ? (effectivePts / officialPlayed).toFixed(2) : '0.00';
    const gfPerGame = officialPlayed > 0 ? (officialGF / officialPlayed).toFixed(2) : '0.00';
    const gaPerGame = officialPlayed > 0 ? (officialGA / officialPlayed).toFixed(2) : '0.00';

    return {
      played: officialPlayed,
      won: officialWon,
      drawn: officialDrawn,
      lost: officialLost,
      gf: officialGF,
      ga: officialGA,
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
  }, [leg1FinishedMatches, standing, teamName, teamId]);

  // 4. Matchday-by-Matchday Time Series (Matchday 1 to Matchday 10 strictly)
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

    return leg1FinishedMatches.map((m, idx) => {
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

      // Smooth position interpolation converging to official current standing
      const progress = (idx + 1) / leg1FinishedMatches.length;
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
        date: m.date || m.scheduled_time || `Matchday ${idx + 1}`,
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
        estimatedPosition: idx === leg1FinishedMatches.length - 1 ? finalRank : weightedPos,
      };
    });
  }, [leg1FinishedMatches, standing?.position, standings.length, stats.won, teamName]);

  const teamPosition = standing?.position || timeSeries[timeSeries.length - 1]?.estimatedPosition || 1;
  const totalTeams = standings.length > 0 ? standings.length : 10;

  // 5. Tomorrow's Match Details (Matchday 11 - The Decisive Final Round of Leg 1)
  const tomorrowOpponent = useMemo(() => {
    if (!tomorrowMatch) return 'Direct League Rival';
    return tomorrowMatch.isHome
      ? tomorrowMatch.awayTeamName || tomorrowMatch.opponentName || 'Opponent'
      : tomorrowMatch.homeTeamName || tomorrowMatch.opponentName || 'Opponent';
  }, [tomorrowMatch]);

  // 6. Pro Tactical Evaluation & Calculated False-Hope Roadmap (Leg 1 Consistency & Leg 2 Runway)
  const aiDirective = useMemo(() => {
    // 1. Compliment First (Leg 1 Verified Merit)
    let compliment = '';
    if (stats.cleanSheetRate >= 35 || parseFloat(stats.gaPerGame) <= 0.9) {
      compliment = `High-level spatial compactness, aerial dominance in the box, and exceptional defensive discipline have anchored ${teamName} as one of the tournament's most impenetrable backlines throughout Leg 1.`;
    } else if (parseFloat(stats.gfPerGame) >= 1.6 || stats.gf >= 15) {
      compliment = `Electrifying attacking transition speed, pinpoint vertical combinations, and clinical finishing efficiency have established ${teamName}'s frontline as an elite scoring juggernaut across the campus.`;
    } else if (stats.homePlayed > 0 && stats.homeWon / stats.homePlayed >= 0.6) {
      compliment = `Commanding physical presence and high-octane pressing tempo have transformed ${teamName}'s home pitch into an intimidating tactical fortress during Leg 1.`;
    } else if (stats.winRate >= 50) {
      compliment = `Exemplary tactical maturity, resilient game management, and matchday composure under pressure have consistently delivered crucial three-point results throughout the first 10 matchdays.`;
    } else {
      compliment = `Unbreakable dressing room solidarity, relentless physical work rate, and fierce competitive character define ${teamName}'s collective identity across every fixture.`;
    }

    // 2. Selling Strategic Hope using Tomorrow's Matchday 11 and Leg 2
    let strategicHope = '';
    const isFirst = teamPosition === 1;
    const isContender = teamPosition === 2 || teamPosition === 3;
    const isBottomThree = teamPosition >= totalTeams - 2;

    if (isFirst) {
      const runnerUp = standings[1] || { teamName: 'the chasers', points: Math.max(0, stats.pts - 3) };
      const lead = Math.max(1, stats.pts - runnerUp.points);
      strategicHope = `Holding a commanding +${stats.gd} goal difference and a ${lead}-point cushion at the summit, taking all 3 points in tomorrow's Matchday 11 clash against ${tomorrowOpponent} followed by an aggressive Leg 2 opening sprint stretches the gap to a demoralizing ${lead + 6} points over ${runnerUp.teamName}. This will decisively crush our pursuers' psychological resolve and lock down the league championship early.`;
    } else if (isContender) {
      const leader = standings[0] || { teamName: 'the leaders', points: stats.pts + 3 };
      const deficit = Math.max(1, leader.points - stats.pts);
      strategicHope = `Trailing ${leader.teamName} by only ${deficit} points while carrying superior underlying chance generation (+${stats.gd} GD), seizing 3 points tomorrow in Matchday 11 against ${tomorrowOpponent} combined with our favorable Leg 2 opening schedule shifts the championship momentum squarely onto our pitch, pushing the leaders into panic mode.`;
    } else if (isBottomThree) {
      const safeRank = Math.max(1, totalTeams - 3);
      const safeTeam = standings[safeRank - 1] || { teamName: 'safety zone', points: stats.pts + 3 };
      const safetyGap = Math.max(1, safeTeam.points - stats.pts);
      strategicHope = `Relegation safety is completely within our grasp—a mere ${safetyGap} points separate us from complete security${stats.deductionPts > 0 ? ` even after absorbing the -${stats.deductionPts} pts sanction` : ''}. Clinching maximum points in tomorrow's Matchday 11 battle against ${tomorrowOpponent} and targeting direct 6-pointer duels in early Leg 2 instantly vaults this squad clear of the drop zone and establishes safe mid-table comfort.`;
    } else {
      const podiumRank = 3;
      const podiumTeam = standings[podiumRank - 1] || { teamName: '3rd place', points: stats.pts + 3 };
      const podiumGap = Math.max(1, podiumTeam.points - stats.pts);
      strategicHope = `Sitting only ${podiumGap} points shy of the top-tier podium with high performance consistency, claiming maximum points in tomorrow's Matchday 11 battle against ${tomorrowOpponent} and sustaining high pressing intensity into Leg 2 immediately launches this team into the elite championship playoff conversation.`;
    }

    // 3. Exactly 1-2 sentences on tactical fix in positive tone
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
  }, [stats, teamPosition, totalTeams, standings, tomorrowOpponent, teamName]);

  // Chart Layout Dimensions (Solid Scale & Coordinate System)
  const chartWidth = 560;
  const chartHeight = 160;
  const leftMargin = 85;
  const rightMargin = 25;
  const topMargin = 25;
  const bottomMargin = 125;
  const plotWidth = chartWidth - leftMargin - rightMargin;
  const plotHeight = bottomMargin - topMargin;

  // Maximum matchdays shown in graphs is strictly Matchday 10
  const maxMatchdayInGraph = 10;

  const getXCoordinate = (matchdayNum: number) => {
    if (maxMatchdayInGraph <= 1) return leftMargin + plotWidth / 2;
    return leftMargin + ((matchdayNum - 1) / (maxMatchdayInGraph - 1)) * plotWidth;
  };

  return (
    <div className="w-full space-y-5 select-none animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* CARD 1: STANDINGS & FORM IN LEG 1 (SAME TABLE STACKED ROWS)              */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0A1322] overflow-hidden shadow-2xl">
        {/* Section Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-[#111C2E] via-[#0E1726] to-[#0A101D] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Award className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-600 text-white shadow-xs">
                  SECTION 1
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/90">
                  Official League Records
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase mt-0.5">
                STANDINGS & FORM IN LEG 1
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-right">
              <span className="text-[8.5px] font-mono text-zinc-400 block uppercase">Table Index</span>
              <span className="text-xs font-black text-amber-400 font-mono">#{teamPosition}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-black/40 border border-emerald-500/30 text-right">
              <span className="text-[8.5px] font-mono text-zinc-400 block uppercase">Points</span>
              <span className="text-xs font-black text-emerald-400 font-mono">{stats.pts} PTS</span>
            </div>
          </div>
        </div>

        {/* Unified Table: Standing Row on Top, Form Row Immediately Below */}
        <div className="p-3.5 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Official Row Comparison • Standings & 11-Match Leg 1 Sequence
            </span>
            {stats.deductionPts > 0 && (
              <span className="text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Sanction: -{stats.deductionPts} Points Deducted
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#070D18]">
            <table className="w-full text-center text-xs min-w-[720px]">
              <thead>
                <tr className="bg-white/[0.03] text-[10px] font-black uppercase text-slate-400 border-b border-white/[0.08]">
                  <th className="py-2.5 px-3 text-left w-12">#</th>
                  <th className="py-2.5 px-3 text-left min-w-[160px]">RECORD TYPE / CLUB</th>
                  <th className="py-2.5 px-2">PLAYED</th>
                  <th className="py-2.5 px-2">WON</th>
                  <th className="py-2.5 px-2">DRAWN</th>
                  <th className="py-2.5 px-2">LOST</th>
                  <th className="py-2.5 px-2">GF</th>
                  <th className="py-2.5 px-2">GA</th>
                  <th className="py-2.5 px-2">GD</th>
                  <th className="py-2.5 px-2 font-black text-white">PTS</th>
                  <th className="py-2.5 px-4 text-left min-w-[320px]">LEG 1 MATCH FORM SEQUENCE (10 + TOMORROW)</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. ROW 1: STANDING ROW */}
                <tr className="border-b border-white/[0.06] font-medium text-slate-200 bg-purple-950/20">
                  <td className="py-3 px-3 text-left font-black text-amber-400 font-mono text-sm">
                    #{teamPosition}
                  </td>
                  <td className="py-3 px-3 text-left">
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        teamId={teamId}
                        src={teamLogo}
                        alt={teamName}
                        className="w-5 h-5 rounded-full object-cover shrink-0 bg-slate-800"
                      />
                      <div>
                        <span className="font-black text-white block leading-tight">{teamName}</span>
                        <span className="text-[9px] uppercase font-bold text-purple-300/80">
                          Official Standings Row
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-mono font-bold text-slate-300">{stats.played}</td>
                  <td className="py-3 px-2 font-mono text-emerald-400 font-bold">{stats.won}</td>
                  <td className="py-3 px-2 font-mono text-amber-400 font-bold">{stats.drawn}</td>
                  <td className="py-3 px-2 font-mono text-rose-400 font-bold">{stats.lost}</td>
                  <td className="py-3 px-2 font-mono text-slate-300">{stats.gf}</td>
                  <td className="py-3 px-2 font-mono text-slate-300">{stats.ga}</td>
                  <td
                    className={`py-3 px-2 font-mono font-bold ${
                      stats.gd > 0 ? 'text-emerald-400' : stats.gd < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {stats.gd > 0 ? `+${stats.gd}` : stats.gd}
                  </td>
                  <td className="py-3 px-2 font-mono font-black text-emerald-400 text-sm">
                    {stats.pts}
                  </td>
                  <td className="py-3 px-4 text-left">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-900/30 border border-purple-500/30 text-[10px] font-bold text-purple-200">
                      <CheckCircle2 className="w-3 h-3 text-purple-400" />
                      Leg 1 Record: {stats.won}W - {stats.drawn}D - {stats.lost}L ({stats.winRate}% Win Efficiency)
                    </span>
                  </td>
                </tr>

                {/* 2. ROW 2: FORM ROW (DIRECTLY UNDERNEATH IN THE SAME TABLE, SAME POSITION INDEX) */}
                <tr className="border-b border-white/[0.04] font-medium text-slate-200 bg-indigo-950/20">
                  <td className="py-3 px-3 text-left font-black text-amber-400 font-mono text-sm">
                    #{teamPosition}
                  </td>
                  <td className="py-3 px-3 text-left">
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        teamId={teamId}
                        src={teamLogo}
                        alt={teamName}
                        className="w-5 h-5 rounded-full object-cover shrink-0 bg-slate-800"
                      />
                      <div>
                        <span className="font-black text-white block leading-tight">{teamName}</span>
                        <span className="text-[9px] uppercase font-bold text-cyan-300/80">
                          Leg 1 Complete Form Row
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-mono font-bold text-cyan-300">
                    10 <span className="text-[9px] text-slate-400">(+1 TMRW)</span>
                  </td>
                  <td className="py-3 px-2 font-mono text-emerald-400 font-bold">{stats.won}</td>
                  <td className="py-3 px-2 font-mono text-amber-400 font-bold">{stats.drawn}</td>
                  <td className="py-3 px-2 font-mono text-rose-400 font-bold">{stats.lost}</td>
                  <td className="py-3 px-2 font-mono text-slate-300">{stats.gf}</td>
                  <td className="py-3 px-2 font-mono text-slate-300">{stats.ga}</td>
                  <td
                    className={`py-3 px-2 font-mono font-bold ${
                      stats.gd > 0 ? 'text-emerald-400' : stats.gd < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {stats.gd > 0 ? `+${stats.gd}` : stats.gd}
                  </td>
                  <td className="py-3 px-2 font-mono font-black text-emerald-400 text-sm">
                    {stats.pts}
                  </td>
                  {/* Complete 11-Match Sequence (10 Finished + Tomorrow MD11) */}
                  <td className="py-3 px-4 text-left">
                    <div className="flex items-center flex-wrap gap-1.5">
                      {/* The 10 Matches of Leg 1 */}
                      {timeSeries.map((m, idx) => (
                        <div
                          key={`row-form-${idx}`}
                          className="flex flex-col items-center"
                          title={`Matchday ${m.matchday}: ${m.result} vs ${m.opponent} (${m.scoreText})`}
                        >
                          <span
                            className={`w-5.5 h-5.5 rounded flex items-center justify-center text-[9px] font-black uppercase font-mono shadow-xs text-white ${
                              m.result === 'W'
                                ? 'bg-emerald-600'
                                : m.result === 'D'
                                ? 'bg-amber-500'
                                : 'bg-rose-600'
                            }`}
                          >
                            {m.result}
                          </span>
                          <span className="text-[7.5px] font-mono text-slate-400 font-bold mt-0.5">
                            M{m.matchday}
                          </span>
                        </div>
                      ))}

                      {/* Matchday 11: Scheduled For Tomorrow */}
                      <div
                        className="flex flex-col items-center"
                        title={`Matchday 11 (Tomorrow): vs ${tomorrowOpponent}`}
                      >
                        <span className="px-2 h-5.5 rounded bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[9px] font-black uppercase font-mono shadow-xs animate-pulse">
                          TMRW
                        </span>
                        <span className="text-[7.5px] font-mono text-purple-300 font-black mt-0.5">
                          M11
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 2: TACTICAL & PERFORMANCE IN LEG 1 (NO ABBREVIATIONS FOR PLAYERS)    */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0A1322] overflow-hidden shadow-2xl">
        {/* Section Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-[#111C2E] via-[#0E1726] to-[#0A101D] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Activity className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-600 text-white shadow-xs">
                  SECTION 2
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/90">
                  Comprehensive Evaluation
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase mt-0.5">
                TACTICAL & PERFORMANCE IN LEG 1
              </h2>
            </div>
          </div>
          <span className="text-[9.5px] font-mono text-slate-400 hidden sm:inline-block">
            Leg 1 Complete Overview
          </span>
        </div>

        {/* Tactical Metrics Grid (No Cryptic Abbreviations) */}
        <div className="p-3.5 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Metric 1: Goals Scored Average */}
            <div className="bg-[#070D18] border border-white/[0.08] rounded-xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wide">Goals Scored Output</span>
                <Target className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono leading-none">
                {stats.gf} <span className="text-xs text-purple-300 font-sans">Total Goals Scored</span>
              </div>
              <p className="text-[10px] text-slate-300 mt-2 font-medium">
                Average of <strong className="text-white">{stats.gfPerGame}</strong> Goals Scored Per Match
              </p>
              <div className="text-[9.5px] text-slate-400 mt-1 font-mono">
                Goal Difference:{' '}
                <strong className={stats.gd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {stats.gd > 0 ? `+${stats.gd}` : stats.gd}
                </strong>
              </div>
            </div>

            {/* Metric 2: Goals Conceded Average */}
            <div className="bg-[#070D18] border border-white/[0.08] rounded-xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wide">Goals Conceded Stability</span>
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono leading-none">
                {stats.ga} <span className="text-xs text-emerald-300 font-sans">Total Goals Conceded</span>
              </div>
              <p className="text-[10px] text-slate-300 mt-2 font-medium">
                Average of <strong className="text-white">{stats.gaPerGame}</strong> Goals Conceded Per Match
              </p>
              <div className="text-[9.5px] text-slate-400 mt-1 font-mono">
                Failed to Score in: <strong className="text-amber-400">{stats.failedToScore}</strong> Matches
              </div>
            </div>

            {/* Metric 3: Clean Sheets & Defensive Shutouts */}
            <div className="bg-[#070D18] border border-white/[0.08] rounded-xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wide">Clean Sheets & Shutouts</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono leading-none">
                {stats.cleanSheets} <span className="text-xs text-cyan-300 font-sans">Clean Sheets Kept</span>
              </div>
              <p className="text-[10px] text-slate-300 mt-2 font-medium">
                Achieved in <strong className="text-cyan-400">{stats.cleanSheetRate}%</strong> of all completed matches
              </p>
              <div className="text-[9.5px] text-slate-400 mt-1 font-mono">
                Defensive Shutout Record
              </div>
            </div>

            {/* Metric 4: Points Efficiency Average */}
            <div className="bg-[#070D18] border border-white/[0.08] rounded-xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wide">Points Per Game Average</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono leading-none">
                {stats.ppg} <span className="text-xs text-amber-300 font-sans">Points Per Match</span>
              </div>
              <p className="text-[10px] text-slate-300 mt-2 font-medium">
                Accumulated <strong className="text-white">{stats.pts}</strong> Total Points in Leg 1
              </p>
              <div className="text-[9.5px] text-slate-400 mt-1 font-mono">
                {stats.winRate}% Victory / {stats.drawRate}% Draw Ratio
              </div>
            </div>
          </div>

          {/* Home vs Away Performance Breakdown Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/[0.06]">
            <div className="bg-[#070D18] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                  Home Pitch Performance
                </span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {stats.homeWon} Wins, {stats.homeDrawn} Draws, {stats.homeLost} Losses
                </span>
              </div>
              <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/30">
                {stats.homePlayed > 0 ? Math.round((stats.homeWon / stats.homePlayed) * 100) : 0}% Home Win Rate
              </span>
            </div>

            <div className="bg-[#070D18] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                  Away Pitch Performance
                </span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {stats.awayWon} Wins, {stats.awayDrawn} Draws, {stats.awayLost} Losses
                </span>
              </div>
              <span className="text-xs font-mono font-black text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/30">
                {stats.awayPlayed > 0 ? Math.round((stats.awayWon / stats.awayPlayed) * 100) : 0}% Away Win Rate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 3: WINS & LOSSES PROGRESSION & MATCH TRAJECTORY GRAPHS              */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0A1322] overflow-hidden shadow-2xl">
        {/* Section Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-[#111C2E] via-[#0E1726] to-[#0A101D] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-600 text-white shadow-xs">
                  SECTION 3
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/90">
                  Trajectory & Scale Visualizer
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase mt-0.5">
                WINS & LOSSES PROGRESSION & MATCH TRAJECTORY GRAPHS
              </h2>
            </div>
          </div>
          <span className="text-[9.5px] font-mono text-slate-400 hidden sm:inline-block">
            Matchday 1 to Matchday 10 (MD11 Tomorrow)
          </span>
        </div>

        <div className="p-3.5 sm:p-5 space-y-4">
          {/* Prominent, Capsuled Sort Buttons Above Graph Plot (Inside the section) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-white/[0.08]">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Select Metric View:
            </span>

            {/* Capsuled sort buttons designed like normal buttons */}
            <div className="flex items-center flex-wrap gap-1.5">
              {[
                { id: 'winloss', label: 'Wins vs Losses' },
                { id: 'form', label: 'Form Amplitude (±1.0)' },
                { id: 'goals', label: 'Goals Scored vs Conceded' },
                { id: 'position', label: 'Position Trend' },
                { id: 'cleansheets', label: 'Clean Sheets' },
                { id: 'all', label: 'All Graphs' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setActiveGraph(btn.id as ActiveGraphTab)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight transition-all duration-150 cursor-pointer border ${
                    activeGraph === btn.id
                      ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                      : 'bg-[#070D18] border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* GRAPH A: WINS VS LOSSES PROGRESSION (SOLID AXES, SCALE & GRID BOXES)  */}
          {/* --------------------------------------------------------------------- */}
          {(activeGraph === 'winloss' || activeGraph === 'all') && (
            <div className="rounded-xl border border-white/[0.08] bg-[#070D18] p-3.5 sm:p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Wins vs Losses Progression (Matchday 1 to 10)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Solid Y-Axis (Win/Loss Count) and X-Axis (Matchday 1 to 10) with grid reading boxes
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[9.5px] font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Cumulative Wins ({stats.won})
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Cumulative Losses ({stats.lost})
                  </span>
                </div>
              </div>

              <div className="w-full h-48 relative">
                {(() => {
                  const maxVal = Math.max(stats.won, stats.lost, stats.played, 5);
                  const getYVal = (val: number) => bottomMargin - (val / maxVal) * plotHeight;

                  const winPoints = timeSeries.map((pt) => `${getXCoordinate(pt.matchday)},${getYVal(pt.cumWins)}`).join(' ');
                  const lossPoints = timeSeries.map((pt) => `${getXCoordinate(pt.matchday)},${getYVal(pt.cumLosses)}`).join(' ');

                  return (
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                      {/* Alternating Reading Grid Boxes */}
                      {[1, 3, 5, 7, 9].map((mDay) => {
                        const x = getXCoordinate(mDay);
                        const nextX = getXCoordinate(Math.min(10, mDay + 1));
                        return (
                          <rect
                            key={`box-${mDay}`}
                            x={x}
                            y={topMargin}
                            width={nextX - x}
                            height={plotHeight}
                            fill="#ffffff"
                            fillOpacity="0.015"
                          />
                        );
                      })}

                      {/* Solid Y-Axis Line */}
                      <line
                        x1={leftMargin}
                        y1={topMargin}
                        x2={leftMargin}
                        y2={bottomMargin}
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />

                      {/* Solid X-Axis Line */}
                      <line
                        x1={leftMargin}
                        y1={bottomMargin}
                        x2={chartWidth - rightMargin}
                        y2={bottomMargin}
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />

                      {/* Y-Axis Solid Scale & Horizontal Grid Lines */}
                      {[0, Math.round(maxVal / 2), maxVal].map((tickVal, i) => {
                        const y = getYVal(tickVal);
                        return (
                          <g key={`wl-axis-${i}`}>
                            <line
                              x1={leftMargin - 4}
                              y1={y}
                              x2={chartWidth - rightMargin}
                              y2={y}
                              stroke="#ffffff"
                              strokeOpacity={tickVal === 0 ? '0.2' : '0.07'}
                              strokeDasharray={tickVal === 0 ? undefined : '3 3'}
                              strokeWidth="1"
                            />
                            <text
                              x={leftMargin - 8}
                              y={y + 3.5}
                              fill="#94a3b8"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="end"
                            >
                              {tickVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* X-Axis Solid Scale Labels (M1 to M10) */}
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((mDay) => {
                        const x = getXCoordinate(mDay);
                        return (
                          <g key={`x-tick-${mDay}`}>
                            <line
                              x1={x}
                              y1={bottomMargin}
                              x2={x}
                              y2={bottomMargin + 4}
                              stroke="#64748b"
                              strokeWidth="1.5"
                            />
                            <text
                              x={x}
                              y={bottomMargin + 16}
                              fill="#94a3b8"
                              fontSize="8"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              M{mDay}
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

                      {/* Data Markers */}
                      {timeSeries.map((pt, idx) => {
                        const cx = getXCoordinate(pt.matchday);
                        const cyWin = getYVal(pt.cumWins);
                        const cyLoss = getYVal(pt.cumLosses);
                        return (
                          <g key={`wl-dot-${idx}`}>
                            <circle cx={cx} cy={cyWin} r="3.5" fill="#10b981" stroke="#070D18" strokeWidth="1.5" />
                            <circle cx={cx} cy={cyLoss} r="3.5" fill="#f43f5e" stroke="#070D18" strokeWidth="1.5" />
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-2 border-t border-white/[0.05] mt-1">
                <span>Start: Matchday 1</span>
                <span>Cumulative: {stats.won} Wins vs {stats.lost} Defeats</span>
                <span>Cutoff: Matchday 10 (Matchday 11 updates tomorrow)</span>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* GRAPH B: FORM AMPLITUDE OSCILLATION (+1.0 to -1.0 CONTINUOUS LINE)     */}
          {/* --------------------------------------------------------------------- */}
          {(activeGraph === 'form' || activeGraph === 'all') && (
            <div className="rounded-xl border border-white/[0.08] bg-[#070D18] p-3.5 sm:p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Form Change & Performance Amplitude (±1.0 to -1.0)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Continuous line (+1.0 Green for Win, 0.0 for Draw, -1.0 Red for Loss)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[9.5px] font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> +1.0 Win (Positive)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> 0.0 Draw
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> -1.0 Loss (Negative)
                  </span>
                </div>
              </div>

              <div className="w-full h-48 relative">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="amplitudeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="45%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="55%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  {/* +1.0 WIN (Y=30) */}
                  <line
                    x1={leftMargin}
                    y1="30"
                    x2={chartWidth - rightMargin}
                    y2="30"
                    stroke="#10b981"
                    strokeOpacity="0.25"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={leftMargin - 10}
                    y="34"
                    fill="#10b981"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    +1.0 WIN
                  </text>

                  {/* 0.0 DRAW BASELINE (Y=75) */}
                  <line
                    x1={leftMargin}
                    y1="75"
                    x2={chartWidth - rightMargin}
                    y2="75"
                    stroke="#64748b"
                    strokeOpacity="0.5"
                    strokeWidth="1.2"
                  />
                  <text
                    x={leftMargin - 10}
                    y="79"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    0.0 DRAW
                  </text>

                  {/* -1.0 LOSS (Y=120) */}
                  <line
                    x1={leftMargin}
                    y1="120"
                    x2={chartWidth - rightMargin}
                    y2="120"
                    stroke="#f43f5e"
                    strokeOpacity="0.25"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={leftMargin - 10}
                    y="124"
                    fill="#f43f5e"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    -1.0 LOSS
                  </text>

                  {/* Matchday Vertical Lines */}
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((mDay) => {
                    const x = getXCoordinate(mDay);
                    return (
                      <g key={`amp-tick-${mDay}`}>
                        <line
                          x1={x}
                          y1="25"
                          x2={x}
                          y2="125"
                          stroke="#ffffff"
                          strokeOpacity="0.04"
                        />
                        <text
                          x={x}
                          y="142"
                          fill="#64748b"
                          fontSize="8"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          M{mDay}
                        </text>
                      </g>
                    );
                  })}

                  {/* Single Continuous Amplitude Polyline */}
                  {timeSeries.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="url(#amplitudeGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={timeSeries
                        .map((pt) => {
                          const y = pt.amplitude === 1 ? 30 : pt.amplitude === 0 ? 75 : 120;
                          return `${getXCoordinate(pt.matchday)},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Amplitude Data Nodes */}
                  {timeSeries.map((pt, idx) => {
                    const cx = getXCoordinate(pt.matchday);
                    const cy = pt.amplitude === 1 ? 30 : pt.amplitude === 0 ? 75 : 120;
                    const dotColor = pt.amplitude === 1 ? '#10b981' : pt.amplitude === 0 ? '#f59e0b' : '#f43f5e';
                    return (
                      <g key={`amp-dot-${idx}`}>
                        <circle cx={cx} cy={cy} r="4" fill={dotColor} stroke="#070D18" strokeWidth="2" />
                        <text
                          x={cx}
                          y={cy - 7}
                          fill="#ffffff"
                          fontSize="7.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {pt.scoreText}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-2 border-t border-white/[0.05] mt-1">
                <span>Amplitude Range: +1.0 (Win) to -1.0 (Loss)</span>
                <span>Current Sequence Record</span>
                <span>Matchday 10 End of Completed Series</span>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* GRAPH C: SCORED VS CONCEDED GOALS (WITH AMBER DEDUCTED POINTS)        */}
          {/* --------------------------------------------------------------------- */}
          {(activeGraph === 'goals' || activeGraph === 'all') && (
            <div className="rounded-xl border border-white/[0.08] bg-[#070D18] p-3.5 sm:p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    Goals Scored vs Conceded (Solid Scale & Deducted Points in Amber)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Attacking production vs defensive stability (Deducted Points highlighted in Apple Amber)
                  </p>
                </div>
                <div className="flex items-center flex-wrap gap-2.5 text-[9.5px] font-mono">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2.5 h-1.5 rounded-full bg-cyan-400 inline-block" /> Scored Goals ({stats.gf})
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Conceded Goals ({stats.ga})
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{' '}
                    {stats.deductionPts > 0 ? `-${stats.deductionPts} Pts Deducted` : 'Sanctions: 0'}
                  </span>
                </div>
              </div>

              <div className="w-full h-48 relative">
                {(() => {
                  const maxVal = Math.max(stats.gf, stats.ga, 10);
                  const getYVal = (val: number) => bottomMargin - (val / maxVal) * plotHeight;

                  const gfPoints = timeSeries.map((pt) => `${getXCoordinate(pt.matchday)},${getYVal(pt.cumGF)}`).join(' ');
                  const gaPoints = timeSeries.map((pt) => `${getXCoordinate(pt.matchday)},${getYVal(pt.cumGA)}`).join(' ');

                  return (
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                      {/* Solid Y-Axis Line */}
                      <line
                        x1={leftMargin}
                        y1={topMargin}
                        x2={leftMargin}
                        y2={bottomMargin}
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />

                      {/* Solid X-Axis Line */}
                      <line
                        x1={leftMargin}
                        y1={bottomMargin}
                        x2={chartWidth - rightMargin}
                        y2={bottomMargin}
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />

                      {/* Y-Axis Solid Scale & Grid Lines */}
                      {[0, Math.round(maxVal / 2), maxVal].map((tickVal, i) => {
                        const y = getYVal(tickVal);
                        return (
                          <g key={`goals-axis-${i}`}>
                            <line
                              x1={leftMargin - 4}
                              y1={y}
                              x2={chartWidth - rightMargin}
                              y2={y}
                              stroke="#ffffff"
                              strokeOpacity={tickVal === 0 ? '0.2' : '0.07'}
                              strokeDasharray={tickVal === 0 ? undefined : '3 3'}
                              strokeWidth="1"
                            />
                            <text
                              x={leftMargin - 8}
                              y={y + 3.5}
                              fill="#94a3b8"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="end"
                            >
                              {tickVal} G
                            </text>
                          </g>
                        );
                      })}

                      {/* Deducted Points Indicator (Distinct Amber Color) */}
                      {stats.deductionPts > 0 && (
                        <g>
                          <line
                            x1={leftMargin}
                            y1={topMargin + 10}
                            x2={chartWidth - rightMargin}
                            y2={topMargin + 10}
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          <rect
                            x={chartWidth - rightMargin - 150}
                            y={topMargin}
                            width="150"
                            height="18"
                            rx="4"
                            fill="#f59e0b"
                            fillOpacity="0.18"
                            stroke="#f59e0b"
                            strokeWidth="1"
                          />
                          <text
                            x={chartWidth - rightMargin - 75}
                            y={topMargin + 12}
                            fill="#fbbf24"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            ⚠️ -{stats.deductionPts} PTS DEDUCTED
                          </text>
                        </g>
                      )}

                      {/* X-Axis Solid Scale Labels (M1 to M10) */}
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((mDay) => {
                        const x = getXCoordinate(mDay);
                        return (
                          <g key={`goals-xtick-${mDay}`}>
                            <line
                              x1={x}
                              y1={bottomMargin}
                              x2={x}
                              y2={bottomMargin + 4}
                              stroke="#64748b"
                              strokeWidth="1.5"
                            />
                            <text
                              x={x}
                              y={bottomMargin + 16}
                              fill="#94a3b8"
                              fontSize="8"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              M{mDay}
                            </text>
                          </g>
                        );
                      })}

                      {/* Cumulative Goals Scored (Cyan) */}
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

                      {/* Cumulative Goals Conceded (Rose) */}
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

                      {/* Data Markers */}
                      {timeSeries.map((pt, idx) => {
                        const cx = getXCoordinate(pt.matchday);
                        const cyGF = getYVal(pt.cumGF);
                        const cyGA = getYVal(pt.cumGA);
                        return (
                          <g key={`goals-dot-${idx}`}>
                            <circle cx={cx} cy={cyGF} r="3.5" fill="#06b6d4" stroke="#070D18" strokeWidth="1.5" />
                            <circle cx={cx} cy={cyGA} r="3.5" fill="#f43f5e" stroke="#070D18" strokeWidth="1.5" />
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-2 border-t border-white/[0.05] mt-1">
                <span>Scored: {stats.gf} Goals ({stats.gfPerGame} Goals/Match)</span>
                <span>Net Difference: {stats.gd > 0 ? `+${stats.gd}` : stats.gd}</span>
                <span>Conceded: {stats.ga} Goals ({stats.gaPerGame} Goals/Match)</span>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* GRAPH D: POSITIONAL CHANGE GRAPH (SOLID SCALE & INVERTED RANK)        */}
          {/* --------------------------------------------------------------------- */}
          {(activeGraph === 'position' || activeGraph === 'all') && (
            <div className="rounded-xl border border-white/[0.08] bg-[#070D18] p-3.5 sm:p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Table Position Evolution (Rank 1 to {totalTeams})
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Solid Y-Axis inverted scale (#1 at the summit) across Matchdays 1 to 10
                  </p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Current Rank: #{teamPosition}
                </span>
              </div>

              <div className="w-full h-48 relative">
                {(() => {
                  const minRank = 1;
                  const maxRank = Math.max(totalTeams, 10);
                  const getYPos = (rank: number) => {
                    const normalized = (rank - minRank) / (maxRank - minRank);
                    return topMargin + normalized * plotHeight;
                  };

                  const posPoints = timeSeries.map((pt) => `${getXCoordinate(pt.matchday)},${getYPos(pt.estimatedPosition)}`).join(' ');

                  return (
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                      {/* Solid Y-Axis Line */}
                      <line
                        x1={leftMargin}
                        y1={topMargin}
                        x2={leftMargin}
                        y2={bottomMargin}
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />

                      {/* Solid X-Axis Line */}
                      <line
                        x1={leftMargin}
                        y1={bottomMargin}
                        x2={chartWidth - rightMargin}
                        y2={bottomMargin}
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />

                      {/* Rank Grid Lines & Solid Scale */}
                      {[1, 3, 5, 8, maxRank].map((r, i) => {
                        const y = getYPos(r);
                        return (
                          <g key={`rank-tick-${i}`}>
                            <line
                              x1={leftMargin - 4}
                              y1={y}
                              x2={chartWidth - rightMargin}
                              y2={y}
                              stroke="#ffffff"
                              strokeOpacity={r === 1 ? '0.15' : '0.07'}
                              strokeDasharray={r === 1 ? undefined : '3 3'}
                            />
                            <text
                              x={leftMargin - 8}
                              y={y + 3.5}
                              fill={r === 1 ? '#fbbf24' : '#94a3b8'}
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight={r === 1 ? 'bold' : 'normal'}
                              textAnchor="end"
                            >
                              #{r}
                            </text>
                          </g>
                        );
                      })}

                      {/* X-Axis Solid Scale Labels (M1 to M10) */}
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((mDay) => {
                        const x = getXCoordinate(mDay);
                        return (
                          <g key={`pos-xtick-${mDay}`}>
                            <line
                              x1={x}
                              y1={bottomMargin}
                              x2={x}
                              y2={bottomMargin + 4}
                              stroke="#64748b"
                              strokeWidth="1.5"
                            />
                            <text
                              x={x}
                              y={bottomMargin + 16}
                              fill="#94a3b8"
                              fontSize="8"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              M{mDay}
                            </text>
                          </g>
                        );
                      })}

                      {/* Rank Curve Polyline */}
                      {timeSeries.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={posPoints}
                        />
                      )}

                      {/* Matchday Data Dots */}
                      {timeSeries.map((pt, idx) => {
                        const cx = getXCoordinate(pt.matchday);
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
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-2 border-t border-white/[0.05] mt-1">
                <span>Matchday 1 Position: #{timeSeries[0]?.estimatedPosition || teamPosition}</span>
                <span>
                  Trajectory:{' '}
                  {(timeSeries[0]?.estimatedPosition || teamPosition) > teamPosition
                    ? '📈 Climbing Upward'
                    : '⚖️ Table Position Stable'}
                </span>
                <span>Latest Matchday 10: #{teamPosition}</span>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* GRAPH E: CLEAN SHEETS TRACKER (SOLID SCALE & DEFENSIVE MILESTONES)   */}
          {/* --------------------------------------------------------------------- */}
          {(activeGraph === 'cleansheets' || activeGraph === 'all') && (
            <div className="rounded-xl border border-white/[0.08] bg-[#070D18] p-3.5 sm:p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Clean Sheet Accumulation & Shutout Rate
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Matches with zero goals conceded across Matchdays 1 to 10
                  </p>
                </div>
                <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  {stats.cleanSheets} Shutouts ({stats.cleanSheetRate}% Rate)
                </span>
              </div>

              <div className="w-full h-48 relative">
                {(() => {
                  const maxCS = Math.max(stats.cleanSheets, stats.played, 5);
                  const getYVal = (val: number) => bottomMargin - (val / maxCS) * plotHeight;

                  const csPoints = timeSeries.map((pt) => `${getXCoordinate(pt.matchday)},${getYVal(pt.cumCleanSheets)}`).join(' ');

                  return (
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                      {/* Solid Y-Axis Line */}
                      <line
                        x1={leftMargin}
                        y1={topMargin}
                        x2={leftMargin}
                        y2={bottomMargin}
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />

                      {/* Solid X-Axis Line */}
                      <line
                        x1={leftMargin}
                        y1={bottomMargin}
                        x2={chartWidth - rightMargin}
                        y2={bottomMargin}
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />

                      {/* Y-Axis Solid Scale & Grid Lines */}
                      {[0, Math.round(maxCS / 2), maxCS].map((tickVal, i) => {
                        const y = getYVal(tickVal);
                        return (
                          <g key={`cs-axis-${i}`}>
                            <line
                              x1={leftMargin - 4}
                              y1={y}
                              x2={chartWidth - rightMargin}
                              y2={y}
                              stroke="#ffffff"
                              strokeOpacity={tickVal === 0 ? '0.2' : '0.07'}
                              strokeDasharray={tickVal === 0 ? undefined : '3 3'}
                              strokeWidth="1"
                            />
                            <text
                              x={leftMargin - 8}
                              y={y + 3.5}
                              fill="#94a3b8"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="end"
                            >
                              {tickVal} CS
                            </text>
                          </g>
                        );
                      })}

                      {/* X-Axis Solid Scale Labels (M1 to M10) */}
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((mDay) => {
                        const x = getXCoordinate(mDay);
                        return (
                          <g key={`cs-xtick-${mDay}`}>
                            <line
                              x1={x}
                              y1={bottomMargin}
                              x2={x}
                              y2={bottomMargin + 4}
                              stroke="#64748b"
                              strokeWidth="1.5"
                            />
                            <text
                              x={x}
                              y={bottomMargin + 16}
                              fill="#94a3b8"
                              fontSize="8"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              M{mDay}
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
                        const cx = getXCoordinate(pt.matchday);
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
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-2 border-t border-white/[0.05] mt-1">
                <span>Total Clean Sheets: {stats.cleanSheets} / 10 Matches</span>
                <span>Shutout Efficiency: {stats.cleanSheetRate}%</span>
                <span>Average Conceded: {stats.gaPerGame} Goals/Match</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 4: STRATEGY & LEG 2 ROADMAP (SINGLE UNIFIED CARD AS OPPOSED TO 3)    */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-[#0A1322] to-zinc-950 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-purple-500/25">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/35 flex items-center justify-center shrink-0">
            <Brain className="w-4.5 h-4.5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs">
                SECTION 4
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                Strategic Leg 2 Roadmap
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase mt-0.5">
              STRATEGY & LEG 2 ROADMAP (BASED ON LEG 1 CONSISTENCY & MATCHES)
            </h2>
          </div>
        </div>

        {/* Single Unified Content Body (All in One Seamless Structure) */}
        <div className="space-y-4">
          {/* 1. Verified Squad Strengths (Compliment First) */}
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                Squad Identity & Verified Consistency
              </h4>
              <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed font-medium mt-1">
                {aiDirective.compliment}
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-white/[0.06]" />

          {/* 2. Calculated Strategic Objective & Motivation (Selling Hope with Tomorrow's MD11) */}
          <div className="flex items-start gap-3">
            <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                  Targeted Objective • Path To Victory via Tomorrow's Matchday 11
                </h4>
                <span className="text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  HIGH MOTIVATION
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed font-medium mt-1">
                {aiDirective.strategicHope}
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-white/[0.06]" />

          {/* 3. Single-Sentence Tactical Priority in a Positive Tone */}
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-purple-300">
                Tactical Priority For Immediate Execution
              </h4>
              <p className="text-xs sm:text-[13px] font-bold text-white leading-relaxed mt-1">
                {aiDirective.tacticalFocus}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leg1TeamAnalytics;
