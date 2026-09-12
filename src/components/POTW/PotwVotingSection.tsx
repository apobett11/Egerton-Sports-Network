import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  Vote, 
  Loader2, 
  ShieldAlert,
  ArrowRight,
  Share2
} from 'lucide-react';
import { PotwNomineeCard } from './PotwNomineeCard';
import type { PotwCandidate } from '../../types/potw';
import { 
  getActiveBallotCandidates, 
  hasDeviceVoted, 
  castVote, 
  getWeeklyCycleStatus, 
  EPL_COMP_ID, 
  CHAMP_COMP_ID,
  buildWhatsAppShareUrl
} from '../../services/potwService';
import { useDeviceIdentity } from '../../hooks/useDeviceIdentity';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

interface PotwVotingSectionProps {
  onNavigateToStandings?: () => void;
  initialLeague?: 'epl' | 'champ';
  preselectedPlayerId?: string | null;
}

export const PotwVotingSection: React.FC<PotwVotingSectionProps> = ({
  onNavigateToStandings,
  initialLeague = 'epl',
  preselectedPlayerId = null,
}) => {
  // Selected League Toggle (EPL vs Championship)
  const [selectedCompId, setSelectedCompId] = useState<string>(
    initialLeague === 'champ' ? CHAMP_COMP_ID : EPL_COMP_ID
  );

  const { deviceId } = useDeviceIdentity();
  const { showSuccess, showError } = useToast();

  // State
  const [candidates, setCandidates] = useState<PotwCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(preselectedPlayerId);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [votedCandidateName, setVotedCandidateName] = useState<string | null>(null);
  const [matchweek, setMatchweek] = useState<number>(1);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [cycleStage, setCycleStage] = useState<string>('VOTING_ACTIVE');
  const [isVotingOpen, setIsVotingOpen] = useState<boolean>(true);

  // Parse URL search params for deep link if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPlayer = params.get('potw_player');
      const urlLeague = params.get('league');

      if (urlLeague === 'champ' || urlLeague === 'championship') {
        setSelectedCompId(CHAMP_COMP_ID);
      } else if (urlLeague === 'epl' || urlLeague === 'premier') {
        setSelectedCompId(EPL_COMP_ID);
      }

      if (urlPlayer) {
        setSelectedPlayerId(urlPlayer);
      }
    }
  }, []);

  // Update Weekly Cycle Countdown
  useEffect(() => {
    const updateCountdown = () => {
      const status = getWeeklyCycleStatus(matchweek);
      setTimeRemaining(status.timeRemainingSeconds);
      setCycleStage(status.stage);
      setIsVotingOpen(status.isVotingOpen);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [matchweek]);

  // Format countdown string
  const formattedCountdown = useMemo(() => {
    if (timeRemaining <= 0) return 'Voting Closed';
    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  // Determine current matchweek for the league
  const resolveCurrentMatchweek = useCallback(async (compId: string): Promise<number> => {
    try {
      const { data } = await supabase
        .from('fixtures')
        .select('matchday')
        .eq('competition_id', compId)
        .order('matchday', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data?.matchday || 1;
    } catch {
      return 1;
    }
  }, []);

  // Fetch candidates and check device vote status
  const loadBallot = useCallback(async () => {
    setLoading(true);
    try {
      const resolvedMw = await resolveCurrentMatchweek(selectedCompId);
      setMatchweek(resolvedMw);

      // Check device vote status
      if (deviceId) {
        const voted = await hasDeviceVoted(deviceId, selectedCompId, resolvedMw);
        setHasVoted(voted);

        // Check local storage for voted candidate name if previously recorded
        const cacheKey = `esn_potw_voted_${selectedCompId}_mw${resolvedMw}_${deviceId}`;
        const cachedName = localStorage.getItem(cacheKey);
        if (cachedName) {
          setVotedCandidateName(cachedName);
        }
      }

      // Fetch condensed ballot candidates
      const activeCandidates = await getActiveBallotCandidates(selectedCompId);
      setCandidates(activeCandidates);

      // If preselected player exists in candidates, keep it selected
      if (preselectedPlayerId && activeCandidates.some((c) => c.player_id === preselectedPlayerId)) {
        setSelectedPlayerId(preselectedPlayerId);
      }
    } catch (err) {
      console.error('Failed to load POTW ballot:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCompId, deviceId, preselectedPlayerId, resolveCurrentMatchweek]);

  useEffect(() => {
    loadBallot();
  }, [loadBallot]);

  // Handle Vote Submission
  const handleVoteSubmit = async () => {
    if (!selectedPlayerId || !deviceId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const candidate = candidates.find((c) => c.player_id === selectedPlayerId);
      const result = await castVote({
        deviceId,
        playerId: selectedPlayerId,
        competitionId: selectedCompId,
        matchweek,
      });

      if (!result.success) {
        showError(result.error || 'Failed to submit your vote.');
        if (result.error?.includes('already cast')) {
          setHasVoted(true);
        }
        return;
      }

      // Successful vote
      const playerName = candidate?.player_name || 'your chosen player';
      setVotedCandidateName(playerName);
      setHasVoted(true);

      const cacheKey = `esn_potw_voted_${selectedCompId}_mw${matchweek}_${deviceId}`;
      try {
        localStorage.setItem(cacheKey, playerName);
      } catch {}

      showSuccess(`🎉 Vote confirmed! You backed ${playerName} for Player of the Week.`);

      // Seamless route to Standings page after short moment
      setTimeout(() => {
        if (onNavigateToStandings) {
          onNavigateToStandings();
        } else if (typeof window !== 'undefined') {
          window.location.hash = '/standings?section=potw';
        }
      }, 1500);
    } catch (err: any) {
      showError(err?.message || 'Error recording vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCandidate = candidates.find((c) => c.player_id === selectedPlayerId);

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 select-none">
      {/* SECTION HEADER & LEAGUE SELECTOR */}
      <div className="bg-[#0e1c2b] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff0046]/10 border border-[#ff0046]/20 text-[#ff0046] text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Fan Ballot</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              PLAYER OF THE WEEK
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Back the weekend's most outstanding campus star. Match of the Match awardees go head-to-head for the weekly crown.
            </p>
          </div>

          {/* Voting Window Countdown Badge */}
          <div className="bg-[#14263b] border border-white/10 rounded-xl px-4 py-3 sm:text-right shrink-0">
            <div className="flex items-center sm:justify-end gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Voting Closes In</span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-white tracking-tight mt-0.5">
              {formattedCountdown}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Deadline: Tuesday 5:00 PM EAT
            </div>
          </div>
        </div>

        {/* Dual League Switcher Tabs */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCompId(EPL_COMP_ID);
              setSelectedPlayerId(null);
            }}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              selectedCompId === EPL_COMP_ID
                ? 'bg-[#ff0046] text-white shadow-lg shadow-[#ff0046]/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>Egerton Premier League</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCompId(CHAMP_COMP_ID);
              setSelectedPlayerId(null);
            }}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              selectedCompId === CHAMP_COMP_ID
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-black" />
            <span>Egerton Championship</span>
          </button>
        </div>
      </div>

      {/* CONFIRMED VOTE BANNER (WHEN DEVICE HAS ALREADY VOTED) */}
      {hasVoted && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-emerald-200">
                Vote Recorded for Matchweek {matchweek}
              </div>
              <div className="text-xs text-emerald-300/90 mt-0.5">
                {votedCandidateName
                  ? `You backed ${votedCandidateName}. Your device vote has been secured.`
                  : 'Your device vote for this matchweek has been secured.'}{' '}
                1 device = 1 vote strictly enforced.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToStandings || (() => (window.location.hash = '/standings?section=potw'))}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>View Standings & Spotlight</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VOTING BALLOT LIST / GRID */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff0046]" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Loading Matchday MOTM Nominees...
          </span>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-[#0e1c2b] border border-white/10 rounded-2xl p-10 text-center space-y-3">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Active Ballot for this Matchweek</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Man of the Match nominations are compiled following each weekend's completed matches. Check back after the next matchday fixtures conclude.
          </p>
          {onNavigateToStandings && (
            <button
              type="button"
              onClick={onNavigateToStandings}
              className="mt-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl border border-white/10 transition-colors inline-flex items-center gap-2"
            >
              <span>View Historical Winners</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Official Candidates ({candidates.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {hasVoted ? 'Ballot locked' : 'Tap a card to select candidate'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((candidate) => (
              <PotwNomineeCard
                key={candidate.player_id}
                candidate={candidate}
                isSelected={selectedPlayerId === candidate.player_id}
                onSelect={() => setSelectedPlayerId(candidate.player_id)}
                disabled={hasVoted || !isVotingOpen}
              />
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMATION DRAWER (FLOATING BOTTOM BAR) */}
      {!hasVoted && isVotingOpen && selectedCandidate && (
        <div className="fixed bottom-4 left-0 right-0 z-40 max-w-2xl mx-auto px-4 animate-in slide-in-from-bottom duration-200">
          <div className="bg-[#0e1c2b]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl flex items-center justify-between gap-4 ring-1 ring-white/10">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-bold text-[#ff0046] tracking-wider">
                Confirm Your Choice
              </div>
              <div className="text-sm sm:text-base font-black text-white truncate">
                {selectedCandidate.player_name}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {selectedCandidate.team_name} • Matchweek {matchweek}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPlayerId(null)}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Change
              </button>

              <button
                type="button"
                onClick={handleVoteSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#ff0046] hover:bg-[#ff1a5b] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#ff0046]/40 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Vote className="w-4 h-4" />
                    <span>Confirm Vote</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
