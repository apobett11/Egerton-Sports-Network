import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  Crown, 
  Sparkles, 
  ArrowRight, 
  Vote, 
  Shield, 
  Percent, 
  Calendar,
  Share2,
  Award
} from 'lucide-react';
import type { PotwWinner } from '../../types/potw';
import { 
  getCurrentWinner, 
  getWeeklyCycleStatus, 
  EPL_COMP_ID, 
  CHAMP_COMP_ID,
  buildWhatsAppShareUrl,
  ESN_DOMAIN
} from '../../services/potwService';

interface PlayerOfTheWeekSpotlightProps {
  selectedCompetitionId?: string;
  onNavigateToVoting?: () => void;
  highlight?: boolean;
}

export const PlayerOfTheWeekSpotlight: React.FC<PlayerOfTheWeekSpotlightProps> = ({
  selectedCompetitionId = EPL_COMP_ID,
  onNavigateToVoting,
  highlight = false,
}) => {
  // Normalize competition ID (EPL vs CHAMP)
  const [activeCompId, setActiveCompId] = useState<string>(() => {
    if (selectedCompetitionId === CHAMP_COMP_ID) return CHAMP_COMP_ID;
    return EPL_COMP_ID;
  });

  const [winner, setWinner] = useState<PotwWinner | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isHighlighted, setIsHighlighted] = useState<boolean>(highlight);

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

  const cycleStatus = getWeeklyCycleStatus();

  const handleShareWinner = () => {
    if (!winner) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : `https://${ESN_DOMAIN}`;
    const shareText = `👑 OFFICIAL PLAYER OF THE WEEK! 🏆⭐\n\n${winner.player_name} (${winner.team_name}) has been crowned ${winner.competition_name} Player of the Week for Matchweek ${winner.matchweek} with ${winner.vote_share_percentage}% of the fan vote!\n\nCheck out the full stats & standings:\n${origin}/#/standings?section=potw\n\n⚡ Egerton Sports Network (${ESN_DOMAIN})`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
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
      className={`rounded-2xl transition-all duration-500 overflow-hidden ${
        isHighlighted
          ? 'ring-4 ring-[#ff0046] shadow-[0_0_40px_rgba(255,0,70,0.4)] animate-pulse'
          : 'shadow-xl'
      }`}
    >
      {/* Spotlight Outer Wrapper */}
      <div className="relative bg-gradient-to-br from-[#0a1523] via-[#0e1c2b] to-[#12253a] border border-white/10 rounded-2xl p-5 sm:p-7 overflow-hidden select-none">
        {/* Glow backdrop effects */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#ff0046]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Badge, League Selector & Share */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-900 shadow-md">
              <Crown className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Official Crown
              </span>
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
          <div className="relative z-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
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

            {/* Right: Vote Metric & WhatsApp Share */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
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

              <button
                type="button"
                onClick={handleShareWinner}
                className="px-4 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                title="Share official winner on WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share Winner</span>
              </button>
            </div>
          </div>
        ) : (
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

            <button
              type="button"
              onClick={handleVoteClick}
              className="w-full sm:w-auto px-6 py-3 bg-[#ff0046] hover:bg-[#ff1a5b] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#ff0046]/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <span>Vote for Player of the Week</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
