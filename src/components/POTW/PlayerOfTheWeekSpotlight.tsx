import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  Crown, 
  Sparkles, 
  ArrowRight, 
  Vote, 
  Shield, 
  Share2, 
  Copy,
  Check,
  Flame,
  Activity,
  Calendar,
  CameraOff
} from 'lucide-react';
import type { PotwWinner } from '../../types/potw';
import { 
  getCurrentWinner, 
  getWeeklyCycleStatus, 
  EPL_COMP_ID, 
  CHAMP_COMP_ID,
  buildMysteryWinnerShareUrl,
  buildMysteryWinnerShareText,
  ESN_DOMAIN
} from '../../services/potwService';
import { useToast } from '../../contexts/ToastContext';

interface PlayerOfTheWeekSpotlightProps {
  selectedCompetitionId?: string;
  onNavigateToVoting?: () => void;
  onNavigateToScores?: () => void;
  onScrollToStandings?: () => void;
  highlight?: boolean;
  showVoteSection?: boolean;
}

export const PlayerOfTheWeekSpotlight: React.FC<PlayerOfTheWeekSpotlightProps> = ({
  selectedCompetitionId = EPL_COMP_ID,
  onNavigateToVoting,
  onNavigateToScores,
  onScrollToStandings,
  highlight = false,
  showVoteSection = false,
}) => {
  // Normalize competition ID (EPL vs CHAMP)
  const [activeCompId, setActiveCompId] = useState<string>(() => {
    if (selectedCompetitionId === CHAMP_COMP_ID) return CHAMP_COMP_ID;
    return EPL_COMP_ID;
  });

  const [winner, setWinner] = useState<PotwWinner | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isHighlighted, setIsHighlighted] = useState<boolean>(highlight);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [screenshotShieldActive, setScreenshotShieldActive] = useState<boolean>(false);

  const { showSuccess, showInfo, showWarning } = useToast();

  // Sync with prop changes if parent selects specific competition
  useEffect(() => {
    if (selectedCompetitionId === CHAMP_COMP_ID) {
      setActiveCompId(CHAMP_COMP_ID);
    } else if (selectedCompetitionId === EPL_COMP_ID) {
      setActiveCompId(EPL_COMP_ID);
    }
  }, [selectedCompetitionId]);

  // Check URL params for highlight pulse
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isPotw = params.get('section') === 'potw' || params.get('potw_winner') === '1' || window.location.hash.includes('potw');
      if (isPotw || highlight) {
        setIsHighlighted(true);
        const timer = setTimeout(() => setIsHighlighted(false), 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [highlight]);

  // Anti-Screenshot & Screen Capture Protection System
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
        (e.ctrlKey && (e.key === 'p' || e.key === 'P'))
      ) {
        setScreenshotShieldActive(true);
        showWarning('📸 Screenshots are disabled on Player of the Week to keep suspense alive! Share the mystery announcement link instead.');
        setTimeout(() => setScreenshotShieldActive(false), 3000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setScreenshotShieldActive(true);
      } else {
        setTimeout(() => setScreenshotShieldActive(false), 800);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showWarning]);

  // Fetch current winner for active competition
  const loadCurrentWinner = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCurrentWinner(activeCompId);
      setWinner(data);
    } catch (err) {
      console.error('Failed to load POTW winner:', err);
      setWinner(null);
    } finally {
      setLoading(false);
    }
  }, [activeCompId]);

  useEffect(() => {
    loadCurrentWinner();
  }, [loadCurrentWinner]);

  const competitionName = activeCompId === CHAMP_COMP_ID ? 'Egerton Championships' : 'Egerton Premier League';
  const matchweekNumber = winner?.matchweek || 1;

  // Mystery WhatsApp Share (Conceals winner's name to drive massive curiosity & site visits)
  const handleMysteryShare = () => {
    const shareUrl = buildMysteryWinnerShareUrl(competitionName, matchweekNumber);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  // Copy Mystery Invite Link
  const handleCopyMysteryText = async () => {
    try {
      const text = buildMysteryWinnerShareText(competitionName, matchweekNumber);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedLink(true);
      showSuccess('✨ Mystery Announcement link copied! Share to WhatsApp, Status, or X to build hype.');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      showInfo('Unable to copy automatically. Tap Share on WhatsApp instead.');
    }
  };

  const handleVoteClick = () => {
    if (onNavigateToVoting) {
      onNavigateToVoting();
    } else if (typeof window !== 'undefined') {
      window.location.hash = '/potw';
    }
  };

  const isEpl = activeCompId === EPL_COMP_ID;

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className={`relative rounded-2xl transition-all duration-500 overflow-hidden select-none print:hidden ${
        isHighlighted
          ? 'ring-4 ring-[#ff0046] shadow-[0_0_40px_rgba(255,0,70,0.4)] animate-pulse'
          : 'shadow-xl'
      }`}
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      {/* SCREENSHOT & SPOILER SHIELD OVERLAY */}
      {screenshotShieldActive && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-3 shadow-lg shadow-rose-500/20">
            <CameraOff className="w-7 h-7" />
          </div>
          <h4 className="text-base font-black uppercase tracking-wider text-white">
            Screenshots Protected
          </h4>
          <p className="text-xs text-slate-300 max-w-sm mt-1.5 leading-relaxed">
            Player of the Week winner identity is protected to prevent spoilers. Share the official mystery announcement template instead!
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleMysteryShare}
              className="px-4 py-2 bg-emerald-500 text-black text-xs font-black uppercase rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Mystery Teaser</span>
            </button>
            <button
              type="button"
              onClick={() => setScreenshotShieldActive(false)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Spotlight Outer Wrapper */}
      <div className="relative bg-gradient-to-br from-[#0a1523] via-[#0e1c2b] to-[#12253a] border border-white/10 rounded-2xl p-5 sm:p-7 overflow-hidden">
        {/* Glow backdrop effects */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#ff0046]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic Watermark Pattern in background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex flex-wrap gap-8 items-center justify-center font-mono font-black text-xs uppercase tracking-widest text-white rotate-12 select-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i}>EGTERTON SPORTS NETWORK • OFFICIAL AWARDS •</span>
          ))}
        </div>

        {/* Top Header: Badge, League Selector & Actions */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-900 shadow-md">
              <Crown className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Official Weekly Crown
                </span>
                <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] font-bold text-slate-300">
                  MW {matchweekNumber}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wide leading-none mt-0.5">
                PLAYER OF THE WEEK SPOTLIGHT
              </h3>
            </div>
          </div>

          {/* League Switcher Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-black/30 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveCompId(EPL_COMP_ID)}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                isEpl
                  ? 'bg-[#ff0046] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Premier League
            </button>
            <button
              type="button"
              onClick={() => setActiveCompId(CHAMP_COMP_ID)}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                !isEpl
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Championship
            </button>
          </div>
        </div>

        {/* Card Body */}
        {loading ? (
          <div className="py-12 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-wider">
            Loading Weekly Spotlight...
          </div>
        ) : winner ? (
          /* WINNER CROWNED STATE */
          <div className="relative z-10 pt-6 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left: Player Avatar / Hero Visual */}
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className="relative">
                  {winner.team_logo ? (
                    <img
                      src={winner.team_logo}
                      alt={winner.team_name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-contain bg-black/40 p-2 border-2 border-amber-400/40 shadow-xl"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-600/30 to-amber-900/30 flex items-center justify-center border-2 border-amber-400/40 shadow-xl">
                      <Trophy className="w-10 h-10 text-amber-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-md">
                    👑
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>Matchweek {winner.matchweek} Laureate</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug truncate">
                    {winner.player_name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-semibold truncate">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>{winner.team_name}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 font-normal">{winner.competition_name}</span>
                  </div>
                </div>
              </div>

              {/* Right: Vote Metric & Viral Mystery Share Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Fan Vote Share
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono tracking-tight mt-0.5">
                    {winner.vote_share_percentage}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {winner.vote_count > 0 ? `${winner.vote_count} votes cast` : 'Decisive Majority'}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleMysteryShare}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30 active:scale-95"
                    title="Share mystery announcement on WhatsApp (Hides player name to create hype!)"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Mystery</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyMysteryText}
                    className="p-3 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    title="Copy mystery teaser text"
                    aria-label="Copy mystery teaser text"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* VIRAL ENGAGEMENT BAR: DRIVES USERS TO STAY & EXPLORE THE SITE */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Keep exploring live action & rankings:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onScrollToStandings) {
                      onScrollToStandings();
                    } else if (typeof window !== 'undefined') {
                      window.location.hash = '/standings';
                      const el = document.querySelector('table');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Full Table & Form</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToScores) {
                      onNavigateToScores();
                    } else if (typeof window !== 'undefined') {
                      window.location.hash = '/scores';
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-[#ff0046]" />
                  <span>Next Fixtures</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.hash = '/standings?tab=scorers';
                      const scorers = Array.from(document.querySelectorAll('h2, div')).find((el) =>
                        el.textContent?.includes('TOP SCORERS')
                      );
                      if (scorers) scorers.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Golden Boot Race</span>
                </button>
              </div>
            </div>
          </div>
        ) : showVoteSection ? (
          /* VOTING IS LIVE / NO WINNER CROWNED YET */
          <div className="relative z-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ff0046]/15 border border-[#ff0046]/30 text-[#ff0046] text-[10px] font-black uppercase tracking-wider">
                <Vote className="w-3 h-3" />
                <span>Fan Voting is Open</span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-white">
                Who was the weekend's best campus player?
              </h4>
              <p className="text-xs text-slate-300 max-w-lg">
                The official crown is decided by campus fans! Back your squad's Match of the Match hero before voting closes Tuesday at 5:00 PM.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleVoteClick}
                className="w-full sm:w-auto px-6 py-3 bg-[#ff0046] hover:bg-[#ff1a5b] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#ff0046]/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <span>Vote for Player of the Week</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleMysteryShare}
                className="w-full sm:w-auto px-4 py-3 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Share mystery voting teaser on WhatsApp"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Share Ballot</span>
              </button>
            </div>
          </div>
        ) : (
          /* NO WINNER CROWNED YET (SPOTLIGHT INFORMATION STATE WITHOUT VOTING SECTION) */
          <div className="relative z-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                <Crown className="w-3 h-3" />
                <span>Weekly Laureate Spotlight</span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-white">
                Matchweek {matchweekNumber} Spotlight
              </h4>
              <p className="text-xs text-slate-300 max-w-lg">
                Official player ratings and weekly star crowns are calculated following each matchday's completed fixtures.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onScrollToStandings) onScrollToStandings();
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>View Standings</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerOfTheWeekSpotlight;

