import React, { useState, useMemo, useEffect } from 'react';
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
  Share2,
  X,
  Copy,
  Link2,
  ExternalLink,
  MessageCircle,
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
  '10000000-0000-4000-8000-000000000007': { pts: 2, reason: 'Disciplinary sanction (2 pts deducted)' },
  '20000000-0000-4000-8000-000000000008': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
  '20000000-0000-4000-8000-000000000007': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
  '20000000-0000-4000-8000-000000000005': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
  '20000000-0000-4000-8000-00000000000a': { pts: 2, reason: 'Championship sanction (2 pts deducted)' },
};

type ActiveGraphTab = 'winloss' | 'goals' | 'position' | 'cleansheets' | 'all';

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
  const [activeGraph, setActiveGraph] = useState<ActiveGraphTab>('all');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Lock body scroll when share modal is open so no background bars/navigation bleed through
  useEffect(() => {
    if (isShareModalOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isShareModalOpen]);

  // Strictly use team name slug — never use team UID as specifier
  const teamSlug = useMemo(() => {
    const raw = teamName || 'team';
    return raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }, [teamName]);

  const specificTeamLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const path = window.location.pathname.replace(/\/$/, '');
    return `${origin}${path}/#/team/${teamSlug}?tab=analytics`;
  }, [teamSlug]);

  // 1. Filter Leg 1 Finished Matches: Matchdays 1 to 11 (ignore matchday 22 or beyond Leg 1)
  const leg1FinishedMatches = useMemo(() => {
    return fixtures
      .filter((f) => {
        if (f.status !== 'FINISHED') return false;
        if (f.matchday === 22) return false;
        if (typeof f.matchday === 'number' && f.matchday > 11) return false;
        return true;
      })
      .sort((a, b) => (a.scheduled_time || a.date || '').localeCompare(b.scheduled_time || b.date || ''))
      .slice(0, 11); // Completed matches for Leg 1 (up to 11 matches)
  }, [fixtures]);

  const hasPlayedMatchday11 = useMemo(() => {
    return leg1FinishedMatches.some((m) => m.matchday === 11);
  }, [leg1FinishedMatches]);

  // 2. Identify Next/Upcoming Match
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

  // 6. Coach Match Talk & Tactical Blueprint (Real English, Coach to Players, 3 Direct Points)
  const coachAdvice = useMemo(() => {
    // Point 1: Three checklist items (one short sentence each, specific to team stats)
    let attackSentence = '';
    let attackAvoid = '';
    let attackFocus = '';
    if (stats.gf <= 10) {
      attackSentence = 'Create more clear scoring chances and put them away to build up our goal difference.';
      attackAvoid = 'hesitation in front of goal';
      attackFocus = 'finish our chances with ruthless belief';
    } else if (stats.gf >= 16) {
      attackSentence = 'Keep punishing defenders early so our massive goal difference stays ahead of the pack.';
      attackAvoid = 'taking our foot off the pedal';
      attackFocus = 'attack with total relentless power';
    } else {
      attackSentence = 'Add more goals in the first half to boost our goal difference and take the game away from opponents.';
      attackAvoid = 'wasting easy scoring chances';
      attackFocus = 'strike early and stay dangerous';
    }

    let defenceSentence = '';
    let defenceAvoid = '';
    let defenceFocus = '';
    if (stats.ga >= 12) {
      defenceSentence = 'Reduce the goals conceded by strengthening our defence and closing down spaces much faster.';
      defenceAvoid = 'soft mistakes at the back';
      defenceFocus = 'keep our backline solid as steel';
    } else if (stats.cleanSheets >= 4) {
      defenceSentence = 'Protect our clean sheets with fearless discipline and give away zero cheap chances in the box.';
      defenceAvoid = 'cheap fouls near our penalty area';
      defenceFocus = 'keep our defensive fortress locked down';
    } else {
      defenceSentence = 'Cut down conceded goals by communicating better in the back and winning all our aerial duels.';
      defenceAvoid = 'lapses in concentration in our box';
      defenceFocus = 'stand tall and clear every dangerous ball';
    }

    let battleSentence = '';
    if (stats.deductionPts > 0) {
      battleSentence = 'Fight with double the hunger to wipe out the points sanction and put fear into the rest of the table.';
    } else if (stats.drawn >= 3) {
      battleSentence = 'Turn our tight draws into victories by hunting down the winning goal before the final whistle.';
    } else if (stats.awayPlayed > 0 && stats.awayWon === 0 && stats.played > 3) {
      battleSentence = 'Bring the exact same intimidation and fire into our away games as we bring on our home pitch.';
    } else {
      battleSentence = 'Kill off matches with composure before the 75th minute and protect our lead through stoppage time.';
    }

    const checklist = [attackSentence, defenceSentence, battleSentence];

    // Point 2: Comparison to upcoming games / Leg 2 using "we"
    const beatenTeams = Array.from(new Set(timeSeries.filter((m) => m.result === 'W').map((m) => m.opponent)));
    const drawnTeams = Array.from(new Set(timeSeries.filter((m) => m.result === 'D').map((m) => m.opponent)));
    const lostTeams = Array.from(new Set(timeSeries.filter((m) => m.result === 'L').map((m) => m.opponent)));

    let leg2Comparison = '';
    if (beatenTeams.length >= 2) {
      const b1 = beatenTeams[0];
      const b2 = beatenTeams[1];
      if (drawnTeams.length > 0) {
        const d1 = drawnTeams[0];
        leg2Comparison = `We beat ${b1} and ${b2} in the first leg—we go out and do that again in the second leg. We drew against ${d1} last time; this time we know how they play, and we can beat them to take all three points. We can do this—we fight for every ball and take what is ours.`;
      } else if (lostTeams.length > 0) {
        const l1 = lostTeams[0];
        leg2Comparison = `We beat ${b1} and ${b2} in the first leg—we repeat that with ruthless hunger in the second leg. We slipped against ${l1} before, but this time we can beat them and settle the score. We can do this—we control the game and make them feel our presence.`;
      } else {
        leg2Comparison = `We beat ${b1} and ${b2} in the first leg—we go out and do that again in the second leg without mercy. Against ${tomorrowOpponent}, we set the tone right from the opening whistle. We can do this—we play our football and dominate every duel.`;
      }
    } else if (beatenTeams.length === 1) {
      const b1 = beatenTeams[0];
      if (drawnTeams.length > 0) {
        const d1 = drawnTeams[0];
        leg2Comparison = `We proved what we can do when we beat ${b1}. We do that in the second leg against every team, starting by beating ${d1} who we drew with last time. We can do this—we step up, take control, and grab all three points.`;
      } else {
        leg2Comparison = `We showed our strength when we beat ${b1}. In the second leg, we take that same fight against ${tomorrowOpponent} and everyone in our way. We can do this—we back ourselves and fight together till the end.`;
      }
    } else {
      if (drawnTeams.length > 0) {
        const d1 = drawnTeams[0];
        leg2Comparison = `We held ${d1} to a draw last time, and we know we can beat them when we meet again in the second leg. Against ${tomorrowOpponent}, we start on the front foot and chase the victory. We can do this—we play with heart and turn these games into three points.`;
      } else {
        leg2Comparison = `The second leg is our clean slate. Against ${tomorrowOpponent} and every rival ahead, we step out with zero fear and full belief. We can do this—we fight for every inch and take our wins.`;
      }
    }

    // Point 3: General advice / War cry
    const generalAdvice = `We should maintain our consistency in every single match. If we avoid ${defenceAvoid} and ${attackAvoid}, and we ${attackFocus} while we ${defenceFocus}, we will all rise. Football is our thing, this is what we do. Let's do it!`;

    return {
      checklist,
      leg2Comparison,
      generalAdvice,
    };
  }, [stats, timeSeries, tomorrowOpponent]);

  const primaryTagline = useMemo(() => {
    if (stats.ga <= 5) return 'Defensive Champions';
    if (stats.cleanSheetRate >= 40) return 'Impenetrable Fortress';
    if (stats.gf >= 12) return 'Clinical Finishers';
    if (stats.winRate >= 50) return 'Title Contenders';
    return 'Resilient Contenders';
  }, [stats]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(specificTeamLink);
      setCopiedToast('Specific team link copied!');
      setTimeout(() => setCopiedToast(null), 2500);
    }
  };

  const coachShareTemplateText = useMemo(() => {
    const gdSign = stats.gd > 0 ? `+${stats.gd}` : `${stats.gd}`;
    const sanctionLine = stats.deductionPts > 0
      ? `⚠️ *POINTS SANCTION:* -${stats.deductionPts} PTS (${stats.sanctionReason || 'Official League Sanction'})\n`
      : '';

    return `🏆 *EGERTON SPORTS NETWORK | COACH DOSSIER*
⚽ *${teamName.toUpperCase()} — TABLE #${teamPosition} (${stats.pts} PTS)*
━━━━━━━━━━━━━━━━━━━━━
📊 *OFFICIAL MATCH RECORD*
• *Matches Played:* ${stats.played}
• *Record:* ${stats.won}W - ${stats.drawn}D - ${stats.lost}L (${stats.winRate}% Win Rate)
• *Points:* ${stats.pts} PTS (PPG: ${stats.ppg} pts/match)
${sanctionLine}🎯 *GOALS & DEFENSE*
• *Goals Scored:* ${stats.gf} (${stats.gfPerGame}/match)
• *Goals Conceded:* ${stats.ga} (${stats.gaPerGame}/match)
• *Goal Difference:* ${gdSign}
• *Clean Sheets:* ${stats.cleanSheets} (${stats.cleanSheetRate}% Shutout Rate)

📍 *VENUE RECORD (HOME vs AWAY)*
• *Home Record:* ${stats.homeWon}W - ${stats.homeDrawn}D - ${stats.homeLost}L (${stats.homeGF} GF : ${stats.homeGA} GA)
• *Away Record:* ${stats.awayWon}W - ${stats.awayDrawn}D - ${stats.awayLost}L (${stats.awayGF} GF : ${stats.awayGA} GA)

🧠 *TACTICAL PROFILE*
• *Tactical Identity:* ${primaryTagline}
• *Attack Directive:* ${coachAdvice.checklist[0]}
• *Defense Directive:* ${coachAdvice.checklist[1]}
• *Match Control:* ${coachAdvice.checklist[2]}

${hasPlayedMatchday11
  ? (tomorrowMatch ? `🔥 *UPCOMING FIXTURE:* vs ${tomorrowOpponent} (MD${tomorrowMatch.matchday || 12})\n` : `🔥 *LEG 1 COMPLETED (11/11 MATCHES PLAYED)*\n`)
  : `🔥 *MATCHDAY 11 (PENDING):* vs ${tomorrowOpponent}\n`}
🔗 *LIVE SQUAD & ANALYTICS:*
${specificTeamLink}
━━━━━━━━━━━━━━━━━━━━━`;
  }, [
    teamName,
    teamPosition,
    stats,
    primaryTagline,
    coachAdvice,
    tomorrowOpponent,
    tomorrowMatch,
    hasPlayedMatchday11,
    specificTeamLink,
  ]);

  const handleShareToWhatsApp = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(coachShareTemplateText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopySnippet = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(coachShareTemplateText);
      setCopiedToast('Coach analytics template copied!');
      setTimeout(() => setCopiedToast(null), 2500);
    }
  };

  const handleNativeShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: `${teamName} - Coach Analytics Dossier`,
          text: coachShareTemplateText,
          url: specificTeamLink,
        })
        .catch(() => {});
    } else {
      handleCopySnippet();
    }
  };

  // Chart Layout Dimensions (Solid Scale & Coordinate System)
  const chartWidth = 560;
  const chartHeight = 160;
  const leftMargin = 85;
  const rightMargin = 25;
  const topMargin = 25;
  const bottomMargin = 125;
  const plotWidth = chartWidth - leftMargin - rightMargin;
  const plotHeight = bottomMargin - topMargin;

  // Maximum matchdays shown in graphs is Leg 1 (Matchdays 1 to 11)
  const maxMatchdayInGraph = 11;

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
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer border border-purple-400/30 active:scale-95"
              title="Share Analytics Report"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Analytics</span>
            </button>
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

          <div className="w-full rounded-xl border border-white/[0.08] bg-[#070D18] overflow-hidden">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-white/[0.03] text-[10px] font-black uppercase text-slate-400 border-b border-white/[0.08]">
                  <th className="py-2.5 px-2 text-center w-8 sm:w-10">#</th>
                  <th className="py-2.5 px-2 text-left">CLUB</th>
                  <th className="py-2.5 px-1 text-center w-8 sm:w-10">P</th>
                  <th className="py-2.5 px-1 text-center w-8 sm:w-10 text-emerald-400">W</th>
                  <th className="py-2.5 px-1 text-center w-8 sm:w-10 text-amber-400">D</th>
                  <th className="py-2.5 px-1 text-center w-8 sm:w-10 text-rose-400">L</th>
                  <th className="py-2.5 px-1.5 text-center min-w-[70px]">GD (F:A)</th>
                  <th className="py-2.5 px-2 text-center w-12 text-white font-black">PTS</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. ROW 1: OFFICIAL STANDINGS ROW */}
                <tr className="border-b border-white/[0.08] font-medium text-slate-200 bg-purple-950/20">
                  <td className="py-2.5 px-2 text-center font-black text-amber-400 font-mono text-sm">
                    #{teamPosition}
                  </td>
                  <td className="py-2.5 px-2 text-left">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLogo
                        teamId={teamId}
                        src={teamLogo}
                        alt={teamName}
                        className="w-5 h-5 rounded-full object-cover shrink-0 bg-slate-800"
                      />
                      <span className="font-black text-white truncate text-xs">{teamName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-1 font-mono font-bold text-slate-300">{stats.played}</td>
                  <td className="py-2.5 px-1 font-mono text-emerald-400 font-bold">{stats.won}</td>
                  <td className="py-2.5 px-1 font-mono text-amber-400 font-bold">{stats.drawn}</td>
                  <td className="py-2.5 px-1 font-mono text-rose-400 font-bold">{stats.lost}</td>
                  <td className="py-2.5 px-1.5 font-mono font-bold whitespace-nowrap text-[11px]">
                    <span className="text-slate-300">{stats.gf}:{stats.ga}</span>{' '}
                    <span className={stats.gd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      ({stats.gd > 0 ? `+${stats.gd}` : stats.gd})
                    </span>
                  </td>
                  <td className="py-2.5 px-2 font-mono font-black text-emerald-400 text-sm">
                    {stats.pts}
                  </td>
                </tr>

                {/* 2. ROW 2: FORM OF 11 MATCHES (PLACED BELOW POINTS ROW WITHOUT DUPLICATE PTS/METRICS) */}
                <tr className="font-medium text-slate-200 bg-indigo-950/20">
                  <td className="py-2.5 px-2 text-center font-mono font-black text-cyan-400 text-[10px]">
                    FORM
                  </td>
                  <td className="py-2.5 px-2 text-left">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLogo
                        teamId={teamId}
                        src={teamLogo}
                        alt={teamName}
                        className="w-5 h-5 rounded-full object-cover shrink-0 bg-slate-800"
                      />
                      <span className="font-bold text-slate-200 truncate text-xs">{teamName}</span>
                    </div>
                  </td>
                  <td colSpan={6} className="py-2.5 px-2 text-left">
                    <div className="flex items-center flex-wrap gap-1 sm:gap-1.5">
                      {/* 10 Finished Matches of Leg 1 */}
                      {timeSeries.map((m, idx) => (
                        <div
                          key={`row-form-${idx}`}
                          className="flex flex-col items-center"
                          title={`Matchday ${m.matchday}: ${m.result} vs ${m.opponent} (${m.scoreText})`}
                        >
                          <span
                            className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded flex items-center justify-center text-[9px] font-black uppercase font-mono shadow-xs text-white ${
                              m.result === 'W'
                                ? 'bg-emerald-600'
                                : m.result === 'D'
                                ? 'bg-amber-500'
                                : 'bg-rose-600'
                            }`}
                          >
                            {m.result}
                          </span>
                          <span className="text-[7px] font-mono text-slate-400 font-bold mt-0.5">
                            M{m.matchday}
                          </span>
                        </div>
                      ))}

                      {/* If team did not play Matchday 11, show the pending 11th match box */}
                      {!hasPlayedMatchday11 && (
                        <div
                          className="flex flex-col items-center"
                          title={`Matchday 11 (Pending): vs ${tomorrowOpponent}`}
                        >
                          <span className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[9px] font-black uppercase font-mono shadow-xs border border-purple-400/40">
                            -
                          </span>
                          <span className="text-[7px] font-mono text-purple-300 font-bold mt-0.5">
                            M11
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 2: TACTICAL & PERFORMANCE IN LEG 1 (DERBY CARD STYLE)                */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0A1322] overflow-hidden shadow-2xl">
        {/* Section Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-[#191508] via-[#0E1726] to-[#0A101D] border-b border-[#ff9800]/25 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff9800]/20 border border-[#ff9800]/40 flex items-center justify-center shrink-0">
              <Flame className="w-4.5 h-4.5 text-[#ff9800]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#ff9800] text-black shadow-xs">
                  SECTION 2
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff9800]">
                  High-Impact Intelligence
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase mt-0.5">
                TACTICAL & PERFORMANCE IN LEG 1
              </h2>
            </div>
          </div>
          <span className="text-[9.5px] font-mono text-amber-300/80 hidden sm:inline-block">
            Verified Tactical Data
          </span>
        </div>

        {/* Tactical Metrics Grid - Derby Golden Style with Extra Stats */}
        <div className="p-3.5 sm:p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Goals Scored Output */}
            <div className="bg-gradient-to-b from-[#1c1505] via-[#0d1726] to-[#070D18] border-2 border-[#ff9800]/50 hover:border-[#ff9800] rounded-xl p-3.5 sm:p-4 shadow-lg hover:shadow-2xl transition-all duration-200 glow-derby flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#ff9800] mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Goals Scored</span>
                  <Target className="w-4 h-4 text-[#ff9800]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white leading-none">
                  {stats.gf}
                </div>
                <div className="text-xs font-black text-[#ff9800] mt-1.5 truncate">
                  {stats.gf >= 15 ? 'Lethal Attack Force' : stats.gf >= 10 ? 'Clinical Finishers' : 'Attacking Unit'}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#ff9800]/20 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-slate-400 font-bold uppercase">Scoring Rate</span>
                  <span className="font-black px-1.5 py-0.5 rounded bg-[#ff9800]/15 text-[#ff9800] border border-[#ff9800]/30">
                    {Math.round(((stats.played - stats.failedToScore) / Math.max(1, stats.played)) * 100)}% Rate
                  </span>
                </div>
                <div className="text-[8.5px] font-mono text-slate-400 truncate">
                  ↑ +{(stats.gf / Math.max(1, stats.played)).toFixed(1)}/match • vs early Leg 1
                </div>
              </div>
            </div>

            {/* Card 2: Goals Conceded */}
            <div className="bg-gradient-to-b from-[#1c1505] via-[#0d1726] to-[#070D18] border-2 border-[#ff9800]/50 hover:border-[#ff9800] rounded-xl p-3.5 sm:p-4 shadow-lg hover:shadow-2xl transition-all duration-200 glow-derby flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#ff9800] mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Goals Conceded</span>
                  <Shield className="w-4 h-4 text-[#ff9800]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white leading-none">
                  {stats.ga}
                </div>
                <div className="text-xs font-black text-[#ff9800] mt-1.5 truncate">
                  {stats.ga <= 5 ? 'Defensive Champions' : stats.ga <= 9 ? 'Solid Backline' : 'Resilient Wall'}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#ff9800]/20 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-slate-400 font-bold uppercase">Resilience</span>
                  <span className="font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {Math.round(((stats.played - Math.min(stats.played, stats.ga)) / Math.max(1, stats.played)) * 100)}% Index
                  </span>
                </div>
                <div className="text-[8.5px] font-mono text-slate-400 truncate">
                  ↓ {stats.gaPerGame} GA/match • {stats.ga <= 6 ? 'Top 3 League Defense' : 'Resilient Wall'}
                </div>
              </div>
            </div>

            {/* Card 3: Clean Sheets */}
            <div className="bg-gradient-to-b from-[#1c1505] via-[#0d1726] to-[#070D18] border-2 border-[#ff9800]/50 hover:border-[#ff9800] rounded-xl p-3.5 sm:p-4 shadow-lg hover:shadow-2xl transition-all duration-200 glow-derby flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#ff9800] mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Clean Sheets</span>
                  <CheckCircle2 className="w-4 h-4 text-[#ff9800]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white leading-none">
                  {stats.cleanSheets}
                </div>
                <div className="text-xs font-black text-[#ff9800] mt-1.5 truncate">
                  {stats.cleanSheetRate >= 40 ? 'Impenetrable Fortress' : stats.cleanSheetRate >= 20 ? 'Shutout Specialists' : 'Defensive Solidity'}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#ff9800]/20 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-slate-400 font-bold uppercase">Shutout Rate</span>
                  <span className="font-black px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {stats.cleanSheetRate}% Rate
                  </span>
                </div>
                <div className="text-[8.5px] font-mono text-slate-400 truncate">
                  ↑ +{Math.min(stats.cleanSheets, 2)} in last 3 matches • 🔒 Shutouts
                </div>
              </div>
            </div>

            {/* Card 4: Total Points */}
            <div className="bg-gradient-to-b from-[#1c1505] via-[#0d1726] to-[#070D18] border-2 border-[#ff9800]/50 hover:border-[#ff9800] rounded-xl p-3.5 sm:p-4 shadow-lg hover:shadow-2xl transition-all duration-200 glow-derby flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#ff9800] mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Total Points</span>
                  <TrendingUp className="w-4 h-4 text-[#ff9800]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white leading-none">
                  {stats.pts}
                </div>
                <div className="text-xs font-black text-[#ff9800] mt-1.5 truncate">
                  {stats.winRate >= 60 ? 'Championship Contenders' : stats.winRate >= 40 ? 'Top Tier Competitors' : 'Fierce Competitors'}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#ff9800]/20 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-slate-400 font-bold uppercase">Win Efficiency</span>
                  <span className="font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {stats.winRate}% Victory
                  </span>
                </div>
                <div className="text-[8.5px] font-mono text-slate-400 truncate">
                  +{stats.pts >= 6 ? 6 : stats.pts} pts in recent run • {stats.ppg} PPG
                </div>
              </div>
            </div>
          </div>

          {/* Home vs Away Performance Breakdown Bar (Side by Side in Derby Card Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/[0.06]">
            <div className="bg-[#070D18] border border-[#ff9800]/30 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block">
                  Home Pitch Record
                </span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {stats.homeWon}W - {stats.homeDrawn}D - {stats.homeLost}L
                </span>
                <span className="text-[10px] font-extrabold text-[#ff9800]">
                  Home Fortress
                </span>
              </div>
              <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/30">
                {stats.homePlayed > 0 ? Math.round((stats.homeWon / stats.homePlayed) * 100) : 0}% Home Win Rate
              </span>
            </div>

            <div className="bg-[#070D18] border border-[#ff9800]/30 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block">
                  Away Pitch Record
                </span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {stats.awayWon}W - {stats.awayDrawn}D - {stats.awayLost}L
                </span>
                <span className="text-[10px] font-extrabold text-[#ff9800]">
                  Away Travel Resilience
                </span>
              </div>
              <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/30">
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
                { id: 'all', label: 'All Graphs (Default)' },
                { id: 'winloss', label: 'Wins vs Losses' },
                { id: 'goals', label: 'Goals Scored vs Conceded' },
                { id: 'position', label: 'Position Trend' },
                { id: 'cleansheets', label: 'Clean Sheets' },
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

                      {/* X-Axis Solid Scale Labels (M1 to M11) */}
                      {Array.from({ length: 11 }, (_, i) => i + 1).map((mDay) => {
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
                <span>{hasPlayedMatchday11 ? 'Cutoff: Matchday 11 (Completed)' : 'Cutoff: Matchday 10 (Matchday 11 Pending)'}</span>
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

                      {/* X-Axis Solid Scale Labels (M1 to M11) */}
                      {Array.from({ length: 11 }, (_, i) => i + 1).map((mDay) => {
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

                      {/* X-Axis Solid Scale Labels (M1 to M11) */}
                      {Array.from({ length: 11 }, (_, i) => i + 1).map((mDay) => {
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
                <span>{hasPlayedMatchday11 ? `Leg 1 Position: #${teamPosition}` : `Latest Position: #${teamPosition} (MD10)`}</span>
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

                      {/* X-Axis Solid Scale Labels (M1 to M11) */}
                      {Array.from({ length: 11 }, (_, i) => i + 1).map((mDay) => {
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
                <span>Total Clean Sheets: {stats.cleanSheets} / {leg1FinishedMatches.length} Matches</span>
                <span>Shutout Efficiency: {stats.cleanSheetRate}%</span>
                <span>Average Conceded: {stats.gaPerGame} Goals/Match</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 4: FORM CHANGE & PERFORMANCE AMPLITUDE GRAPH (±1.0 to -1.0)           */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0A1322] overflow-hidden shadow-2xl">
        {/* Section Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-[#0d2218] via-[#0E1726] to-[#0A101D] border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Activity className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-600 text-white shadow-xs">
                  SECTION 4
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Momentum & Result Oscillation
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase mt-0.5">
                FORM CHANGE & PERFORMANCE AMPLITUDE GRAPH (±1.0 to -1.0)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[9.5px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> +1.0 Win
            </span>
            <span className="flex items-center gap-1.5 text-slate-300 bg-slate-500/10 px-2 py-0.5 rounded-md border border-slate-500/30 font-bold">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> 0.0 Draw
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> -1.0 Loss
            </span>
          </div>
        </div>

        {/* Section Body: Graph & Matchday Sequence */}
        <div className="p-3.5 sm:p-5 space-y-5">
          {/* Main SVG Graph */}
          <div className="rounded-xl border border-white/[0.08] bg-[#070D18] p-3.5 sm:p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.06]">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Continuous Performance Wave Across Leg 1 Matches
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Visualizes match-by-match trajectory: victory peaks at +1.0, parity at 0.0, and setbacks at -1.0
                </p>
              </div>
              <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold self-start sm:self-auto">
                {stats.won}W - {stats.drawn}D - {stats.lost}L Completed
              </span>
            </div>

            <div className="w-full h-52 sm:h-56 relative">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="amplitudeGradientSection4" x1="0" y1="0" x2="0" y2="1">
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
                  strokeOpacity="0.3"
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
                  strokeOpacity="0.3"
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

                {/* Matchday Vertical Lines (M1 to M11) */}
                {Array.from({ length: 11 }, (_, i) => i + 1).map((mDay) => {
                  const x = getXCoordinate(mDay);
                  return (
                    <g key={`sec4-amp-tick-${mDay}`}>
                      <line
                        x1={x}
                        y1="25"
                        x2={x}
                        y2="125"
                        stroke="#ffffff"
                        strokeOpacity="0.05"
                      />
                      <text
                        x={x}
                        y="142"
                        fill="#64748b"
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

                {/* Single Continuous Amplitude Polyline */}
                {timeSeries.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="url(#amplitudeGradientSection4)"
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
                    <g key={`sec4-amp-dot-${idx}`}>
                      <circle cx={cx} cy={cy} r="4.5" fill={dotColor} stroke="#070D18" strokeWidth="2" />
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
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-2 border-t border-white/[0.05] mt-1">
              <span>Start: Matchday 1</span>
              <span>Sequence: {leg1FinishedMatches.length} Completed Matches</span>
              <span>{hasPlayedMatchday11 ? 'Leg 1 Complete (MD11 Finished)' : `Pending: Matchday 11 vs ${tomorrowOpponent}`}</span>
            </div>
          </div>

          {/* Match-by-Match Sequence Breakdown Cards */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                Match-by-Match Performance Amplitude Breakdown:
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                {hasPlayedMatchday11 ? 'Full 11-Match Sequence (Completed)' : '10 Completed + 1 Pending Decider'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {timeSeries.map((m, idx) => {
                const ampColor =
                  m.amplitude === 1
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    : m.amplitude === 0
                    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    : 'text-rose-400 border-rose-500/30 bg-rose-500/10';
                const ampBadge =
                  m.amplitude === 1
                    ? '+1.0 WIN'
                    : m.amplitude === 0
                    ? '0.0 DRAW'
                    : '-1.0 LOSS';

                return (
                  <div
                    key={`sec4-card-${idx}`}
                    className="p-2.5 rounded-xl bg-[#070D18] border border-white/[0.08] flex flex-col justify-between gap-1.5 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="font-bold text-slate-400">M{m.matchday}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-black border ${ampColor}`}>
                        {ampBadge}
                      </span>
                    </div>

                    <div className="truncate">
                      <span className="text-[11px] font-bold text-white block truncate" title={m.opponent}>
                        {m.isHome ? 'vs ' : '@ '}
                        {m.opponent}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {m.isHome ? 'Home' : 'Away'}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono font-bold">
                      <span className="text-slate-300">{m.scoreText}</span>
                      <span className={m.amplitude === 1 ? 'text-emerald-400' : m.amplitude === 0 ? 'text-amber-400' : 'text-rose-400'}>
                        {m.result}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* 11th Match: Only show as PENDING if the team did NOT play Matchday 11 yet! */}
              {!hasPlayedMatchday11 && (
                <div className="p-2.5 rounded-xl bg-gradient-to-b from-purple-950/30 to-[#070D18] border border-purple-500/40 flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="font-bold text-purple-300">M11</span>
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-black border border-purple-400/40 bg-purple-500/20 text-purple-300">
                      PENDING
                    </span>
                  </div>

                  <div className="truncate">
                    <span className="text-[11px] font-black text-purple-200 block truncate" title={tomorrowOpponent}>
                      vs {tomorrowOpponent}
                    </span>
                    <span className="text-[9px] font-mono text-purple-300/80">
                      Leg 1 Decider
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-purple-500/20 flex items-center justify-between text-[9.5px] font-mono font-black text-purple-300">
                    <span>Matchday 11</span>
                    <span>DECIDER</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SHARE ANALYTICS MODAL & TEMPLATE SNIPPET (POPUP ISOLATION)                */}
      {/* ========================================================================= */}
      {isShareModalOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div 
            className="bg-[#0A1322] border border-purple-500/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl space-y-0 relative z-[100000]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-purple-950/50 via-[#0e1a2d] to-[#0A1322] border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-10 bg-[#0A1322]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Share Team Analytics
                  </h3>
                  <p className="text-[10px] text-purple-300 font-semibold">
                    Executive Matchday Snippet & Direct Team Link
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Snippet Template Preview */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Analytics Template Snippet Preview:
                </span>
                <span className="text-[9px] font-mono text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded border border-purple-500/30 font-bold">
                  Official ESN Format
                </span>
              </div>

              {/* Visual Report Card Preview */}
              <div className="p-4 rounded-xl bg-[#070D18] border border-white/[0.1] space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <TeamLogo
                      teamId={teamId}
                      src={teamLogo}
                      alt={teamName}
                      className="w-8 h-8 rounded-full object-cover bg-slate-800 shrink-0"
                    />
                    <div>
                      <span className="text-sm font-black text-white block uppercase leading-tight">
                        {teamName}
                      </span>
                      <span className="text-[10px] font-mono text-purple-300 font-bold">
                        Coach Analytics Dossier • Leg 1 Performance
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-purple-600/30 text-purple-300 border border-purple-500/40 inline-block">
                      #{teamPosition} • {stats.pts} PTS
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 block mt-0.5 font-bold">
                      {stats.ppg} PPG
                    </span>
                  </div>
                </div>

                {/* 4 Key Metrics side by side */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/[0.06] text-center">
                  <div className="bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
                    <span className="text-[8px] font-mono uppercase text-slate-400 block">Record</span>
                    <span className="text-[10.5px] font-black font-mono text-emerald-400">
                      {stats.won}W-{stats.drawn}D-{stats.lost}L
                    </span>
                    <span className="text-[7.5px] font-mono text-slate-400 block">{stats.winRate}% Win</span>
                  </div>
                  <div className="bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
                    <span className="text-[8px] font-mono uppercase text-slate-400 block">Scored</span>
                    <span className="text-[10.5px] font-black font-mono text-cyan-400">{stats.gf}</span>
                    <span className="text-[7.5px] font-mono text-slate-400 block">{stats.gfPerGame}/m</span>
                  </div>
                  <div className="bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
                    <span className="text-[8px] font-mono uppercase text-slate-400 block">Conceded</span>
                    <span className="text-[10.5px] font-black font-mono text-rose-400">{stats.ga}</span>
                    <span className="text-[7.5px] font-mono text-slate-400 block">{stats.gaPerGame}/m</span>
                  </div>
                  <div className="bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
                    <span className="text-[8px] font-mono uppercase text-slate-400 block">Shutouts</span>
                    <span className="text-[10.5px] font-black font-mono text-purple-400">{stats.cleanSheets}</span>
                    <span className="text-[7.5px] font-mono text-slate-400 block">{stats.cleanSheetRate}% CS</span>
                  </div>
                </div>

                {/* Venue Split & Goal Difference */}
                <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06] grid grid-cols-3 gap-2 text-[9.5px] font-mono text-center">
                  <div>
                    <span className="text-slate-400 text-[8px] uppercase block">Home</span>
                    <span className="text-slate-200 font-bold">{stats.homeWon}W-{stats.homeDrawn}D-{stats.homeLost}L</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[8px] uppercase block">Away</span>
                    <span className="text-slate-200 font-bold">{stats.awayWon}W-{stats.awayDrawn}D-{stats.awayLost}L</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[8px] uppercase block">Diff (GD)</span>
                    <span className={stats.gd >= 0 ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                      {stats.gd > 0 ? `+${stats.gd}` : stats.gd}
                    </span>
                  </div>
                </div>

                {/* Tactical Directives Box */}
                <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-500/20 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-extrabold text-amber-300 uppercase tracking-wide flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      {primaryTagline}
                    </span>
                    <span className="text-[9px] font-mono text-purple-300">
                      {hasPlayedMatchday11 ? (tomorrowMatch ? `Next: vs ${tomorrowOpponent}` : 'Leg 1 Complete') : `M11: vs ${tomorrowOpponent}`}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-300 leading-tight">
                    🎯 <span className="text-slate-200 font-medium">{coachAdvice.checklist[0]}</span>
                  </p>
                  <p className="text-[9px] text-slate-300 leading-tight">
                    🛡️ <span className="text-slate-200 font-medium">{coachAdvice.checklist[1]}</span>
                  </p>
                </div>

                {/* Specific Direct Link */}
                <div className="p-2 rounded-lg bg-black/60 border border-white/10 flex items-center justify-between gap-2 text-[10.5px] font-mono text-slate-300">
                  <span className="truncate">{specificTeamLink}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                </div>
              </div>

              {copiedToast && (
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in duration-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{copiedToast}</span>
                </div>
              )}

              {/* Action Buttons: Direct WhatsApp Share Primary */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleShareToWhatsApp}
                  className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-black text-black" />
                  <span>Share Directly on WhatsApp</span>
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySnippet}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Coach Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#070D18] hover:bg-white/5 border border-white/15 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Link2 className="w-4 h-4" />
                    <span>Copy Link Only</span>
                  </button>

                  {typeof navigator !== 'undefined' && !!navigator.share && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                      title="Share via device apps"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-medium">
                Recipients joining via the link land directly on {teamName}'s analytics and can browse all fixtures, roster, and league tables freely.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leg1TeamAnalytics;
