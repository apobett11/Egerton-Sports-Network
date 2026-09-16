import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Trophy,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Footprints,
  Flame,
} from 'lucide-react';
import type { Match, Player } from '../../types';
import {
  fetchCoachMatchEvents,
  saveCoachMatchEvents,
  fetchRecordedFixtureIds,
  CoachGoalEvent,
} from '../../lib/supabaseClient';

export type CoachModalStep =
  | 'GUIDE'
  | 'SELECT_MATCH'
  | 'RECORD_EVENTS'
  | 'CONFIRM_SUBMIT'
  | 'REMAINING_MATCHES';

interface CoachMatchEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName?: string;
  roster: Player[];
  fixtures: Match[];
  selectedMatchId?: string;
  onShowToast?: (msg: string) => void;
  onEventsSaved?: () => void;
}

export const CoachMatchEventsModal: React.FC<CoachMatchEventsModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  roster,
  fixtures,
  selectedMatchId,
  onShowToast,
  onEventsSaved,
}) => {
  // Prevent background body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 1. Filter past/completed matches (up to 4 played matches list)
  const pastMatches = useMemo(() => {
    return (fixtures || []).filter(
      (f) => f.status === 'FINISHED' || f.score !== undefined
    );
  }, [fixtures]);

  const playedMatchesList = useMemo(() => {
    return pastMatches.slice(0, 4);
  }, [pastMatches]);

  // Modal Step State
  const [step, setStep] = useState<CoachModalStep>('GUIDE');

  // Selected match state
  const [currentMatchId, setCurrentMatchId] = useState<string>(() => {
    if (selectedMatchId && pastMatches.some((m) => m.id === selectedMatchId)) {
      return selectedMatchId;
    }
    return pastMatches[0]?.id || '';
  });

  // Recorded Fixture IDs (tracks which past fixtures already have events submitted)
  const [recordedFixtureIds, setRecordedFixtureIds] = useState<string[]>([]);

  // Load recorded fixture IDs when pastMatches change
  const refreshRecordedFixtures = useCallback(() => {
    if (!teamId || pastMatches.length === 0) return;
    fetchRecordedFixtureIds(pastMatches.map((m) => m.id), teamId).then((ids) => {
      setRecordedFixtureIds(ids);
    });
  }, [teamId, pastMatches]);

  useEffect(() => {
    if (isOpen) {
      refreshRecordedFixtures();
    }
  }, [isOpen, refreshRecordedFixtures]);

  // Reset or sync match selection if prop changes
  useEffect(() => {
    if (selectedMatchId && pastMatches.some((m) => m.id === selectedMatchId)) {
      setCurrentMatchId(selectedMatchId);
    } else if (!currentMatchId && pastMatches.length > 0) {
      setCurrentMatchId(pastMatches[0].id);
    }
  }, [selectedMatchId, pastMatches, currentMatchId]);

  const activeMatch = useMemo(() => {
    return pastMatches.find((m) => m.id === currentMatchId) || pastMatches[0];
  }, [pastMatches, currentMatchId]);

  // Determine team role (Home or Away) and team's goals count in the selected match
  const isHome = useMemo(() => {
    if (!activeMatch) return true;
    if (activeMatch.isHome !== undefined) return activeMatch.isHome;
    if (activeMatch.homeTeamId && teamId) {
      if (activeMatch.homeTeamId === teamId) return true;
      if (activeMatch.awayTeamId === teamId) return false;
    }
    const myName = (teamName || 'egerton').toLowerCase();
    if (activeMatch.homeTeamName && activeMatch.homeTeamName.toLowerCase().includes(myName)) {
      return true;
    }
    if (activeMatch.awayTeamName && activeMatch.awayTeamName.toLowerCase().includes(myName)) {
      return false;
    }
    return true;
  }, [activeMatch, teamId, teamName]);

  const matchGoalsCount = useMemo(() => {
    if (!activeMatch) return 0;
    const scoreVal = isHome ? activeMatch.scoreHome : activeMatch.scoreAway;
    if (scoreVal !== undefined && scoreVal !== null) {
      return Math.max(0, Number(scoreVal));
    }
    if (activeMatch.score && activeMatch.score.includes('-')) {
      const parts = activeMatch.score.split('-').map((s) => parseInt(s.trim(), 10));
      const parsed = isHome ? parts[0] : parts[1];
      return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    return 0;
  }, [activeMatch, isHome]);

  // Form State
  const [goals, setGoals] = useState<CoachGoalEvent[]>([]);
  const [yellowCards, setYellowCards] = useState<string[]>([]);
  const [redCards, setRedCards] = useState<string[]>([]);
  const [isAlreadyRecorded, setIsAlreadyRecorded] = useState<boolean>(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load existing match events whenever activeMatch changes
  useEffect(() => {
    if (!isOpen || !activeMatch?.id || !teamId) return;

    let isMounted = true;
    setIsLoadingExisting(true);
    setValidationError(null);

    fetchCoachMatchEvents(activeMatch.id, teamId)
      .then((existing) => {
        if (!isMounted) return;

        const hasExisting =
          (existing.goals && existing.goals.length > 0) ||
          (existing.yellowCardPlayerIds && existing.yellowCardPlayerIds.length > 0) ||
          (existing.redCardPlayerIds && existing.redCardPlayerIds.length > 0);

        setIsAlreadyRecorded(hasExisting);

        if (hasExisting) {
          setRecordedFixtureIds((prev) => Array.from(new Set([...prev, activeMatch.id])));
        }

        // If existing goals recorded, display them (locked)
        if (existing.goals.length > 0) {
          setGoals(existing.goals);
        } else {
          // Prefill default slots matching the official final score
          const initialSlots: CoachGoalEvent[] = [];
          for (let i = 0; i < matchGoalsCount; i++) {
            initialSlots.push({
              playerId: '',
              assistPlayerId: '',
              minute: Math.min(90, 15 + i * 25),
              goalType: 'regular',
            });
          }
          setGoals(initialSlots);
        }

        setYellowCards(existing.yellowCardPlayerIds || []);
        setRedCards(existing.redCardPlayerIds || []);
      })
      .catch((err) => {
        console.warn('[CoachMatchEventsModal] Error loading existing events:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingExisting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeMatch?.id, teamId, matchGoalsCount]);

  if (!isOpen) return null;

  // Sorted roster for dropdowns
  const sortedRoster = [...roster].sort((a, b) => {
    const ja = Number(a.number || 999);
    const jb = Number(b.number || 999);
    if (ja !== jb) return ja - jb;
    return a.name.localeCompare(b.name);
  });

  // Goal handlers
  const handleUpdateGoal = (index: number, field: keyof CoachGoalEvent, value: any) => {
    setGoals((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
    setValidationError(null);
  };

  const handleSetGoalType = (index: number, type: 'regular' | 'solo' | 'freekick' | 'penalty') => {
    setGoals((prev) => {
      const updated = [...prev];
      const current = updated[index];
      const isSoloType = type === 'solo' || type === 'freekick' || type === 'penalty';
      updated[index] = {
        ...current,
        goalType: type,
        assistPlayerId: isSoloType ? '' : current.assistPlayerId,
      };
      return updated;
    });
    setValidationError(null);
  };

  // Card handlers
  const handleAddYellowCard = (playerId: string) => {
    if (!playerId) return;
    if (!yellowCards.includes(playerId)) {
      setYellowCards((prev) => [...prev, playerId]);
    }
  };

  const handleRemoveYellowCard = (playerId: string) => {
    setYellowCards((prev) => prev.filter((id) => id !== playerId));
  };

  const handleAddRedCard = (playerId: string) => {
    if (!playerId) return;
    if (!redCards.includes(playerId)) {
      setRedCards((prev) => [...prev, playerId]);
    }
  };

  const handleRemoveRedCard = (playerId: string) => {
    setRedCards((prev) => prev.filter((id) => id !== playerId));
  };

  // Validation before confirmation
  const handleProceedToConfirmation = () => {
    setValidationError(null);

    if (isAlreadyRecorded) {
      setValidationError('Match events for this fixture have already been submitted and cannot be rewritten.');
      return;
    }

    // Validate that all recorded goals have a scorer selected
    for (let i = 0; i < goals.length; i++) {
      if (!goals[i].playerId) {
        setValidationError(`Please select a goal scorer for Goal #${i + 1}`);
        return;
      }
    }

    if (!activeMatch?.id) {
      setValidationError('No match selected.');
      return;
    }

    // Open confirmation popup
    setStep('CONFIRM_SUBMIT');
  };

  // Final submission execution
  const handleConfirmSave = async () => {
    if (!activeMatch?.id || !teamId) return;

    setIsSaving(true);
    setValidationError(null);

    try {
      const res = await saveCoachMatchEvents(activeMatch.id, teamId, isHome, {
        goals,
        yellowCardPlayerIds: yellowCards,
        redCardPlayerIds: redCards,
      });

      if (res.success) {
        // Mark as recorded
        setIsAlreadyRecorded(true);
        setRecordedFixtureIds((prev) => Array.from(new Set([...prev, activeMatch.id])));

        if (onShowToast) {
          onShowToast('Match scorers and events recorded successfully!');
        }
        if (onEventsSaved) {
          onEventsSaved();
        }

        // Show remaining matches popup
        setStep('REMAINING_MATCHES');
      } else {
        setValidationError(res.error || 'Failed to save events. Please try again.');
        setStep('RECORD_EVENTS');
      }
    } catch (err: any) {
      setValidationError(err.message || 'An unexpected error occurred while saving.');
      setStep('RECORD_EVENTS');
    } finally {
      setIsSaving(false);
    }
  };

  const opponentName = activeMatch
    ? (isHome ? activeMatch.awayTeamName : activeMatch.homeTeamName) || activeMatch.opponentName || 'Opponent'
    : 'Opponent';

  const opponentLogo = activeMatch
    ? (isHome ? activeMatch.awayTeamLogo : activeMatch.homeTeamLogo) || activeMatch.opponentLogo
    : undefined;

  const currentClubName =
    teamName ||
    (activeMatch ? (isHome ? activeMatch.homeTeamName : activeMatch.awayTeamName) : 'Our Team');

  // Remaining played matches that still need events logged
  const remainingMatches = useMemo(() => {
    return playedMatchesList.filter(
      (m) => m.id !== activeMatch?.id && !recordedFixtureIds.includes(m.id)
    );
  }, [playedMatchesList, activeMatch?.id, recordedFixtureIds]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden select-none animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent top gradient bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0046] via-amber-500 to-[#00b04f]" />

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 1: COACH INSTRUCTION & GUIDANCE POPUP                          */}
        {/* ------------------------------------------------------------------- */}
        {step === 'GUIDE' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#0b1623]/50 border-b border-slate-100 dark:border-[#14263b] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Record Past Match Events
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Official Coach Match Events &amp; Player Analytics Logging
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-900 dark:text-slate-100 overscroll-contain">
              {/* Guidance Hero Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-slate-50 dark:via-[#112236] to-transparent border border-emerald-500/25 rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Coach Action Required: Update Player Match Data</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  Welcome Coach! You are required to update the{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    goal scorers and assist players
                  </strong>{' '}
                  for your team in all recently played matches (strictly your own team&apos;s players
                  data).
                </p>

                {/* Consequence Alert */}
                <div className="p-4 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>Crucial: Player Analytics &amp; Rewards Impact</span>
                  </div>
                  <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    If you don&apos;t record your scorers and assists,{' '}
                    <strong className="font-black text-amber-950 dark:text-white underline decoration-amber-400 underline-offset-2">
                      your players will not be included in the player analytics, leaderboards, and
                      potential rewards
                    </strong>{' '}
                    (such as the Golden Boot, Top Playmaker, Team of the Season, and performance
                    bonuses).
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Logging your squad&apos;s events ensures every goal, assist, and card is
                    officially recognized across the entire Egerton Sports Network.
                  </p>
                </div>

                {/* Quick Step Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-[#0e1c2b]/70 border border-slate-200/60 dark:border-white/5 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      Select played match from your list of 4
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-[#0e1c2b]/70 border border-slate-200/60 dark:border-white/5 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      Log each goal scorer, assist, or solo/free kick/penalty
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-[#0e1c2b]/70 border border-slate-200/60 dark:border-white/5 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      Confirm cards, review popup, and submit
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guidance Footer */}
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#0b1623]/50 border-t border-slate-100 dark:border-[#14263b] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedMatchId && pastMatches.some((m) => m.id === selectedMatchId)) {
                    setStep('RECORD_EVENTS');
                  } else {
                    setStep('SELECT_MATCH');
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#ff0046] hover:bg-[#e0003c] active:scale-[0.98] text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 2: 4-MATCH SELECTION VIEW                                      */}
        {/* ------------------------------------------------------------------- */}
        {step === 'SELECT_MATCH' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#0b1623]/50 border-b border-slate-100 dark:border-[#14263b] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('GUIDE')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] transition-colors cursor-pointer"
                  title="Back to Guide"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Select Played Match
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Choose from your team&apos;s played matches (List of {playedMatchesList.length})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
              {playedMatchesList.length === 0 ? (
                <div className="p-6 text-center space-y-2 bg-slate-50 dark:bg-[#112236] rounded-2xl border border-slate-200/80 dark:border-[#1a2e45]">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    No finished matches available yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Completed matches will appear here for you to log scorers and assists.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {playedMatchesList.map((m) => {
                    const matchIsHome =
                      m.isHome !== undefined
                        ? m.isHome
                        : m.homeTeamId === teamId ||
                          (m.homeTeamName && m.homeTeamName.toLowerCase().includes((teamName || 'egerton').toLowerCase()));
                    const oppName =
                      (matchIsHome ? m.awayTeamName : m.homeTeamName) || m.opponentName || 'Opponent';
                    const oppLogo =
                      (matchIsHome ? m.awayTeamLogo : m.homeTeamLogo) || m.opponentLogo;
                    const goalsForMyTeam = matchIsHome
                      ? m.scoreHome ?? (m.score ? parseInt(m.score.split('-')[0], 10) : 0)
                      : m.scoreAway ?? (m.score ? parseInt(m.score.split('-')[1], 10) : 0);
                    const isRecorded = recordedFixtureIds.includes(m.id);

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setCurrentMatchId(m.id);
                          setStep('RECORD_EVENTS');
                        }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isRecorded
                            ? 'bg-slate-50/70 dark:bg-[#112236]/60 border-slate-200 dark:border-[#1a2e45] hover:border-slate-300 dark:hover:border-slate-600'
                            : 'bg-emerald-500/[0.04] dark:bg-[#112236] border-emerald-500/30 hover:border-emerald-500 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          {oppLogo ? (
                            <img
                              src={oppLogo}
                              alt={oppName}
                              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0">
                              {oppName.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                vs {oppName}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                ({matchIsHome ? 'Home' : 'Away'})
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>Score: {m.score || `${m.scoreHome ?? 0} - ${m.scoreAway ?? 0}`}</span>
                              {m.date && <span>• {m.date}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-start sm:self-auto">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
                            {goalsForMyTeam} {goalsForMyTeam === 1 ? 'Goal' : 'Goals'} Scored
                          </span>

                          {isRecorded ? (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Recorded</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-[#ff0046]/10 border border-[#ff0046]/30 text-[#ff0046] text-xs font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>Needs Events</span>
                            </span>
                          )}

                          <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#0b1623]/50 border-t border-slate-100 dark:border-[#14263b] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setStep('GUIDE')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Guide</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 3: GUIDED GOALS & CARDS SECTION                                */}
        {/* ------------------------------------------------------------------- */}
        {step === 'RECORD_EVENTS' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-[#0b1623]/50 border-b border-slate-100 dark:border-[#14263b] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_MATCH')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] transition-colors cursor-pointer"
                  title="Back to Match List"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Record Past Match Events
                    </h2>
                    {isAlreadyRecorded && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentClubName} vs {opponentName} • Final Score:{' '}
                    {activeMatch?.score || `${activeMatch?.scoreHome ?? 0} - ${activeMatch?.scoreAway ?? 0}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 dark:text-slate-100 overscroll-contain">
              {/* Match Header Bar & Dropdown for fast switcher */}
              <div className="bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {opponentLogo && (
                      <img
                        src={opponentLogo}
                        alt={opponentName}
                        className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10"
                      />
                    )}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      vs {opponentName} ({isHome ? 'Home' : 'Away'})
                    </span>
                    {activeMatch?.location && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 hidden sm:inline-flex">
                        <MapPin className="w-3 h-3 text-[#ff0046]" />
                        <span>{activeMatch.location}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Match Score (Locked):
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#00b04f]/15 border border-[#00b04f]/30 text-[#00b04f] font-mono font-black text-xs">
                      {matchGoalsCount} {matchGoalsCount === 1 ? 'Goal' : 'Goals'} Scored
                    </span>
                  </div>
                </div>

                {/* Match Switcher Dropdown (Supports keyboard and test automation) */}
                {pastMatches.length > 1 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-[#1a2e45]/60">
                    <select
                      value={currentMatchId}
                      onChange={(e) => setCurrentMatchId(e.target.value)}
                      disabled={isLoadingExisting || isSaving}
                      className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#ff0046] transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {pastMatches.map((m) => {
                        const homeTxt = m.homeTeamName || (m.isHome ? currentClubName : m.opponentName);
                        const awayTxt = m.awayTeamName || (!m.isHome ? currentClubName : m.opponentName);
                        const scoreTxt = m.score || `${m.scoreHome ?? 0} - ${m.scoreAway ?? 0}`;
                        return (
                          <option key={m.id} value={m.id}>
                            {homeTxt} {scoreTxt} {awayTxt} • ({m.date})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Locked Warning Banner */}
              {isAlreadyRecorded && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5">
                  <Lock className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    <strong>Events Finalized (One-Time Update):</strong> Match events for this
                    fixture have already been submitted. To preserve official league integrity,
                    submitted entries cannot be rewritten.
                  </span>
                </div>
              )}

              {/* Loading Indicator */}
              {isLoadingExisting && (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-[#ff0046]" />
                  <span>Loading saved events for this match...</span>
                </div>
              )}

              {!isLoadingExisting && activeMatch && (
                /* ------------------------------------------------------------- */
                /* GUIDED TIMELINE BORDER: GOAL 1 -> GOAL 2 -> CARDS -> SUBMIT  */
                /* ------------------------------------------------------------- */
                <div className="relative border-l-2 border-emerald-500/40 pl-5 sm:pl-7 space-y-7 sm:space-y-8 my-4 ml-3 sm:ml-4">
                  {/* Step Banner */}
                  <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2 -ml-2">
                    <Footprints className="w-4 h-4" />
                    <span>Follow Guided Steps: Goals &rarr; Disciplinary Cards</span>
                  </div>

                  {/* NO GOALS SCORED STATE */}
                  {goals.length === 0 && (
                    <div className="relative">
                      <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px] font-mono font-black border-2 border-white dark:border-[#0e1c2b]">
                        0
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] text-center space-y-1">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          0 goals scored by {currentClubName} in this match.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Official score is locked. Proceed below to log any yellow or red cards.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* GOAL CARDS WITH GENEROUS SPACING */}
                  {goals.map((goal, idx) => {
                    const isSolo = goal.goalType === 'solo';
                    const isFreekick = goal.goalType === 'freekick';
                    const isPenalty = goal.goalType === 'penalty';
                    const isRegular = !isSolo && !isFreekick && !isPenalty;

                    return (
                      <div key={idx} className="relative">
                        {/* Guided Node Indicator */}
                        <div className="absolute -left-[31px] sm:-left-[39px] top-3 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-mono font-black shadow-sm border-2 border-white dark:border-[#0e1c2b]">
                          {idx + 1}
                        </div>

                        {/* Goal Item Card */}
                        <div className="bg-slate-50 dark:bg-[#112236] border border-slate-200/90 dark:border-[#1a2e45] rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-[#1a2e45] pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-base">⚽</span>
                              <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                                Goal #{idx + 1}
                              </span>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                Required
                              </span>
                            </div>

                            <span className="text-[11px] font-mono text-slate-400">
                              Min {goal.minute || Math.min(85, 15 + idx * 25)}&apos;
                            </span>
                          </div>

                          {/* Scorer Selection */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                              <span>
                                Goal Scorer <span className="text-[#ff0046]">*</span>
                              </span>
                              {goal.playerId && (
                                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Selected
                                </span>
                              )}
                            </label>
                            <select
                              value={goal.playerId}
                              onChange={(e) => handleUpdateGoal(idx, 'playerId', e.target.value)}
                              disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                              className={`w-full bg-white dark:bg-[#0e1c2b] border text-xs font-bold rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                                !goal.playerId && validationError
                                  ? 'border-rose-500 focus:border-rose-400'
                                  : 'border-slate-200 dark:border-[#1a2e45] focus:border-[#ff0046]'
                              }`}
                            >
                              <option value="">-- Select Goal Scorer --</option>
                              {sortedRoster.map((p) => (
                                <option key={p.id} value={p.id}>
                                  #{p.number || '—'} {p.name} ({p.position})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Assist & Goal Type (Inline Options) */}
                          <div className="space-y-2 pt-1 border-t border-slate-200/50 dark:border-white/5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                              Assist / Goal Type
                            </label>

                            {/* Inline Clickable Options: Solo, Free Kick, Penalty, Regular Assist */}
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSetGoalType(idx, 'regular')}
                                disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  isRegular
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                                    : 'bg-white dark:bg-[#0e1c2b] border-slate-200 dark:border-[#1a2e45] text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                              >
                                🤝 Assisted Goal
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetGoalType(idx, 'solo')}
                                disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  isSolo
                                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-300'
                                    : 'bg-white dark:bg-[#0e1c2b] border-slate-200 dark:border-[#1a2e45] text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                              >
                                👟 Solo Goal
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetGoalType(idx, 'freekick')}
                                disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  isFreekick
                                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300'
                                    : 'bg-white dark:bg-[#0e1c2b] border-slate-200 dark:border-[#1a2e45] text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                              >
                                🎯 Free Kick
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetGoalType(idx, 'penalty')}
                                disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  isPenalty
                                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'
                                    : 'bg-white dark:bg-[#0e1c2b] border-slate-200 dark:border-[#1a2e45] text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                              >
                                ⚽ Penalty
                              </button>
                            </div>

                            {/* Assist Dropdown */}
                            <div className="pt-1">
                              <select
                                value={goal.assistPlayerId || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateGoal(idx, 'assistPlayerId', val);
                                  handleUpdateGoal(idx, 'goalType', val ? 'regular' : goal.goalType || 'regular');
                                }}
                                disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                                className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] text-xs font-medium rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#ff0046] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                <option value="">None (Solo Goal / Free Kick / Direct)</option>
                                {sortedRoster
                                  .filter((p) => p.id !== goal.playerId)
                                  .map((p) => (
                                    <option key={p.id} value={p.id}>
                                      #{p.number || '—'} {p.name} ({p.position})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* ----------------------------------------------------------- */}
                  {/* STEP: CARDS & DISCIPLINARY SECTION                          */}
                  {/* ----------------------------------------------------------- */}
                  <div className="relative">
                    {/* Guided Node Indicator */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-3 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-mono font-black shadow-sm border-2 border-white dark:border-[#0e1c2b]">
                      🟨
                    </div>

                    <div className="bg-slate-50 dark:bg-[#112236] border border-slate-200/90 dark:border-[#1a2e45] rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
                      <div className="border-b border-slate-200/70 dark:border-[#1a2e45] pb-2.5">
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="w-2.5 h-3.5 rounded-[2px] bg-amber-400 inline-block"></span>
                          <span className="w-2.5 h-3.5 rounded-[2px] bg-rose-600 inline-block -ml-1"></span>
                          <span>Cards &amp; Disciplinary</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Select players from your roster who received yellow or red cards in this game.
                        </p>
                      </div>

                      {/* Yellow Cards */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <span className="w-2.5 h-3.5 rounded-[2px] bg-amber-400 inline-block"></span>
                            <span>Yellow Cards ({yellowCards.length})</span>
                          </label>

                          {!isAlreadyRecorded && (
                            <div className="w-44 sm:w-52">
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAddYellowCard(e.target.value);
                                  }
                                }}
                                disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                                className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
                              >
                                <option value="">+ Add Yellow Card</option>
                                {sortedRoster
                                  .filter((p) => !yellowCards.includes(p.id))
                                  .map((p) => (
                                    <option key={p.id} value={p.id}>
                                      #{p.number || '—'} {p.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {yellowCards.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {yellowCards.map((pid) => {
                              const player = roster.find((p) => p.id === pid);
                              const pName = player ? `#${player.number || ''} ${player.name}` : pid;
                              return (
                                <span
                                  key={pid}
                                  className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg"
                                >
                                  <span className="w-2 h-2.5 rounded-[1px] bg-amber-400 shrink-0"></span>
                                  <span>{pName}</span>
                                  {!isAlreadyRecorded && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveYellowCard(pid)}
                                      className="text-amber-500 hover:text-amber-700 dark:hover:text-white cursor-pointer ml-1"
                                      title="Remove card"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No yellow cards recorded.</p>
                        )}
                      </div>

                      {/* Red Cards */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-200/60 dark:border-[#1a2e45]/60">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                            <span className="w-2.5 h-3.5 rounded-[2px] bg-rose-600 inline-block"></span>
                            <span>Red Cards ({redCards.length})</span>
                          </label>

                          {!isAlreadyRecorded && (
                            <div className="w-44 sm:w-52">
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAddRedCard(e.target.value);
                                  }
                                }}
                                disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                                className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-rose-400 transition-colors cursor-pointer"
                              >
                                <option value="">+ Add Red Card</option>
                                {sortedRoster
                                  .filter((p) => !redCards.includes(p.id))
                                  .map((p) => (
                                    <option key={p.id} value={p.id}>
                                      #{p.number || '—'} {p.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {redCards.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {redCards.map((pid) => {
                              const player = roster.find((p) => p.id === pid);
                              const pName = player ? `#${player.number || ''} ${player.name}` : pid;
                              return (
                                <span
                                  key={pid}
                                  className="inline-flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold px-2.5 py-1 rounded-lg"
                                >
                                  <span className="w-2 h-2.5 rounded-[1px] bg-rose-600 shrink-0"></span>
                                  <span>{pName}</span>
                                  {!isAlreadyRecorded && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveRedCard(pid)}
                                      className="text-rose-500 hover:text-rose-700 dark:hover:text-white cursor-pointer ml-1"
                                      title="Remove card"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No red cards recorded.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Error Banner */}
              {validationError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-[#0b1623]/50 border-t border-slate-100 dark:border-[#14263b] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setStep('SELECT_MATCH')}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Match</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {isAlreadyRecorded ? 'Close' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={handleProceedToConfirmation}
                  disabled={isAlreadyRecorded || isSaving || isLoadingExisting || !activeMatch}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#ff0046] hover:bg-[#e0003c] active:scale-[0.98] text-white flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAlreadyRecorded ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-300" />
                      <span>Events Recorded (Locked)</span>
                    </>
                  ) : isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Events...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Match Events</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 4: POPUP CONFIRMATION (SCORERS, ASSISTERS, CARDS)             */}
        {/* ------------------------------------------------------------------- */}
        {step === 'CONFIRM_SUBMIT' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#0b1623]/50 border-b border-slate-100 dark:border-[#14263b] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Confirm Match Events Submission
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Verify all scorers, assists, and cards before permanent lock
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('RECORD_EVENTS')}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] transition-colors cursor-pointer"
                aria-label="Back to form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              {/* Match Header Summary */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] rounded-xl flex items-center justify-between text-xs font-bold">
                <span>
                  {currentClubName} vs {opponentName}
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {matchGoalsCount} {matchGoalsCount === 1 ? 'Goal' : 'Goals'} Scored
                </span>
              </div>

              {/* Goals & Assisters Breakdown */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span>⚽</span>
                  <span>Goal Scorers &amp; Assists ({goals.length})</span>
                </h4>

                {goals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-[#112236] rounded-xl">
                    No goals scored for {currentClubName} in this fixture.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {goals.map((g, idx) => {
                      const scorer = roster.find((p) => p.id === g.playerId);
                      const assist = roster.find((p) => p.id === g.assistPlayerId);
                      let assistLabel = assist ? `#${assist.number || ''} ${assist.name}` : 'None (Solo Goal)';
                      if (g.goalType === 'penalty') assistLabel = 'Penalty Kick';
                      else if (g.goalType === 'freekick') assistLabel = 'Direct Free Kick';
                      else if (g.goalType === 'solo') assistLabel = 'Solo Effort';

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-white dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                              Goal #{idx + 1}:
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {scorer ? `#${scorer.number || ''} ${scorer.name}` : 'Unknown Scorer'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <span className="text-[10px] uppercase font-semibold">Assist:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {assistLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cards Breakdown */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200/60 dark:border-[#1a2e45]/60">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span>🟨🟥</span>
                  <span>Disciplinary Cards</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Yellows */}
                  <div className="p-3 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">
                      Yellow Cards ({yellowCards.length})
                    </span>
                    {yellowCards.length > 0 ? (
                      <div className="space-y-1">
                        {yellowCards.map((pid) => {
                          const p = roster.find((player) => player.id === pid);
                          return (
                            <div key={pid} className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              • #{p?.number || '—'} {p?.name || pid}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">None</span>
                    )}
                  </div>

                  {/* Reds */}
                  <div className="p-3 bg-rose-500/[0.08] border border-rose-500/20 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">
                      Red Cards ({redCards.length})
                    </span>
                    {redCards.length > 0 ? (
                      <div className="space-y-1">
                        {redCards.map((pid) => {
                          const p = roster.find((player) => player.id === pid);
                          return (
                            <div key={pid} className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              • #{p?.number || '—'} {p?.name || pid}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#0b1623] border border-slate-200 dark:border-[#1a2e45] rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>One-Time Final Submission:</strong> Once you confirm, these entries will
                  be locked and permanently feed into official league analytics and player rewards.
                </span>
              </div>
            </div>

            {/* Confirmation Footer */}
            <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-[#0b1623]/50 border-t border-slate-100 dark:border-[#14263b] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setStep('RECORD_EVENTS')}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Review &amp; Edit</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#ff0046] hover:bg-[#e0003c] active:scale-[0.98] text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting to League...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm &amp; Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 5: REMAINING MATCHES POPUP (POST-SUBMISSION)                   */}
        {/* ------------------------------------------------------------------- */}
        {step === 'REMAINING_MATCHES' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-500/10 dark:bg-emerald-500/15 border-b border-emerald-500/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Match Events Recorded!
                  </h2>
                  <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                    Player analytics and reward points have been officially logged.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              {remainingMatches.length > 0 ? (
                <>
                  <div className="space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#ff0046]" />
                      <span>Remaining Matches Requiring Event Data:</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select the next played match below to record scorers and assists for your squad:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {remainingMatches.map((m) => {
                      const matchIsHome =
                        m.isHome !== undefined
                          ? m.isHome
                          : m.homeTeamId === teamId ||
                            (m.homeTeamName &&
                              m.homeTeamName.toLowerCase().includes((teamName || 'egerton').toLowerCase()));
                      const oppName =
                        (matchIsHome ? m.awayTeamName : m.homeTeamName) || m.opponentName || 'Opponent';
                      const oppLogo =
                        (matchIsHome ? m.awayTeamLogo : m.homeTeamLogo) || m.opponentLogo;
                      const goalsForMyTeam = matchIsHome
                        ? m.scoreHome ?? (m.score ? parseInt(m.score.split('-')[0], 10) : 0)
                        : m.scoreAway ?? (m.score ? parseInt(m.score.split('-')[1], 10) : 0);

                      return (
                        <div
                          key={m.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-[#112236] border border-emerald-500/30 hover:border-emerald-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            {oppLogo ? (
                              <img
                                src={oppLogo}
                                alt={oppName}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0">
                                {oppName.slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div>
                              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block">
                                vs {oppName} ({matchIsHome ? 'Home' : 'Away'})
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Score: {m.score || `${m.scoreHome ?? 0} - ${m.scoreAway ?? 0}`}{' '}
                                {m.date && `• ${m.date}`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                              {goalsForMyTeam} {goalsForMyTeam === 1 ? 'Goal' : 'Goals'} Scored
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setCurrentMatchId(m.id);
                                setStep('RECORD_EVENTS');
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#ff0046] hover:bg-[#e0003c] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            >
                              <span>Input Events</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* ALL MATCHES LOGGED STATE */
                <div className="p-6 text-center space-y-3 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-2xl border border-emerald-500/20">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    All Played Matches Recorded!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                    Great work Coach! Every completed match has its official scorers, assists, and
                    disciplinary cards verified. Your players are fully counted across all leaderboards
                    and season awards.
                  </p>
                </div>
              )}
            </div>

            {/* Remaining Matches Footer */}
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#0b1623]/50 border-t border-slate-100 dark:border-[#14263b] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all cursor-pointer"
              >
                {remainingMatches.length > 0 ? 'Done for Now' : 'Complete & Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachMatchEventsModal;
