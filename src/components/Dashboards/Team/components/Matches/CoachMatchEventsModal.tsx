import React, { useState, useEffect, useMemo } from 'react';
import { X, Trophy, AlertCircle, Save, Loader2, Calendar, MapPin, Plus, Trash2, CheckCircle2, Lock } from 'lucide-react';
import type { Match, Player } from '../../types';
import {
  fetchCoachMatchEvents,
  saveCoachMatchEvents,
  CoachGoalEvent,
} from '../../lib/supabaseClient';

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
  // 1. Filter past/completed matches
  const pastMatches = useMemo(() => {
    return (fixtures || []).filter(
      (f) => f.status === 'FINISHED' || f.score !== undefined
    );
  }, [fixtures]);

  // Selected match state
  const [currentMatchId, setCurrentMatchId] = useState<string>(() => {
    if (selectedMatchId && pastMatches.some((m) => m.id === selectedMatchId)) {
      return selectedMatchId;
    }
    return pastMatches[0]?.id || '';
  });

  // Keep in sync if selectedMatchId prop changes
  useEffect(() => {
    if (selectedMatchId && pastMatches.some((m) => m.id === selectedMatchId)) {
      setCurrentMatchId(selectedMatchId);
    } else if (!currentMatchId && pastMatches.length > 0) {
      setCurrentMatchId(pastMatches[0].id);
    }
  }, [selectedMatchId, pastMatches]);

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

        // If existing goals recorded, display them (locked)
        if (existing.goals.length > 0) {
          setGoals(existing.goals);
        } else {
          // Strictly prefill default slots matching the official final score
          const initialSlots: CoachGoalEvent[] = [];
          for (let i = 0; i < matchGoalsCount; i++) {
            initialSlots.push({
              playerId: '',
              assistPlayerId: '',
              minute: Math.min(90, 15 + i * 25),
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

  const handleAddGoalSlot = () => {
    setGoals((prev) => [
      ...prev,
      {
        playerId: '',
        assistPlayerId: '',
        minute: 90,
      },
    ]);
  };

  const handleRemoveGoalSlot = (index: number) => {
    setGoals((prev) => prev.filter((_, idx) => idx !== index));
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

  // Submission
  const handleSave = async () => {
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

    setIsSaving(true);
    try {
      const res = await saveCoachMatchEvents(activeMatch.id, teamId, isHome, {
        goals,
        yellowCardPlayerIds: yellowCards,
        redCardPlayerIds: redCards,
      });

      if (res.success) {
        if (onShowToast) {
          onShowToast('Match scorers and events recorded successfully!');
        }
        if (onEventsSaved) {
          onEventsSaved();
        }
        onClose();
      } else {
        setValidationError(res.error || 'Failed to save events. Please try again.');
      }
    } catch (err: any) {
      setValidationError(err.message || 'An unexpected error occurred while saving.');
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

  const currentClubName = teamName || (activeMatch ? (isHome ? activeMatch.homeTeamName : activeMatch.awayTeamName) : 'Our Team');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[#0e1c2b] border border-[#1a2e45] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-[#112236] border-b border-[#1a2e45] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff0046]/15 border border-[#ff0046]/30 flex items-center justify-center text-[#ff0046] shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  Record Past Match Events
                </h2>
                {isAlreadyRecorded && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Locked</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Log goal scorers, optional assists, and cards for {currentClubName} (One-Time Update Policy)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-100">
          {/* 1. MATCH SELECTOR CARD */}
          <div className="bg-[#081018] border border-[#1a2e45] rounded-xl p-4 space-y-3">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#ff0046]" />
              <span>Select Past Fixture (Strictly Your Team&apos;s Matches)</span>
            </label>

            {pastMatches.length === 0 ? (
              <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No finished matches available yet for your team.</span>
              </div>
            ) : (
              <select
                value={currentMatchId}
                onChange={(e) => setCurrentMatchId(e.target.value)}
                disabled={isLoadingExisting || isSaving}
                className="w-full bg-[#112236] border border-[#1a2e45] text-white text-xs sm:text-sm font-bold rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#ff0046] transition-colors cursor-pointer disabled:opacity-60"
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
            )}

            {/* Match Snapshot Banner */}
            {activeMatch && (
              <div className="mt-2 pt-3 border-t border-[#1a2e45]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {opponentLogo && (
                    <img
                      src={opponentLogo}
                      alt={opponentName}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  )}
                  <span className="font-bold text-slate-200">
                    vs {opponentName} ({isHome ? 'Home' : 'Away'})
                  </span>
                  {activeMatch.location && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 hidden sm:inline-flex">
                      <MapPin className="w-3 h-3 text-[#ff0046]" />
                      <span>{activeMatch.location}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Match Score (Locked):</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#00b04f]/15 border border-[#00b04f]/30 text-[#00b04f] font-mono font-black text-xs">
                    {matchGoalsCount} {matchGoalsCount === 1 ? 'Goal' : 'Goals'} Scored
                  </span>
                  {isAlreadyRecorded && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[10px] flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Recorded</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ONE-TIME UPDATE LOCK BANNER */}
          {isAlreadyRecorded && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center gap-2.5">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Events Finalized (One-Time Update):</strong> Match events for this fixture have already been submitted. To preserve official league integrity, submitted entries cannot be rewritten.
              </span>
            </div>
          )}

          {/* LOADING STATE */}
          {isLoadingExisting && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-[#ff0046]" />
              <span>Loading saved events for this match...</span>
            </div>
          )}

          {!isLoadingExisting && activeMatch && (
            <>
              {/* 2. GOALS SECTION */}
              <div className="bg-[#081018] border border-[#1a2e45] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1a2e45] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚽</span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        Goal Scorers & Assists
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Select each scorer for your team. Assist is optional (e.g. solo goal, free kick). Score numbers cannot be modified.
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#112236] px-2.5 py-1 rounded-md border border-[#1a2e45]">
                    {matchGoalsCount} {matchGoalsCount === 1 ? 'Goal Required' : 'Goals Required'}
                  </span>
                </div>

                {goals.length === 0 ? (
                  <div className="p-4 rounded-lg bg-[#112236]/40 border border-[#1a2e45] text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-300">
                      0 goals scored by {currentClubName} in this match.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Official score is locked. You can record cards below if any were received.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {goals.map((goal, idx) => (
                      <div
                        key={idx}
                        className="bg-[#112236] border border-[#1a2e45] rounded-xl p-3.5 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-black text-emerald-400 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span>Goal #{idx + 1}</span>
                          </span>

                          <span className="text-[10px] font-mono text-slate-400">
                            Min {goal.minute || Math.min(85, 15 + idx * 25)}&apos;
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Scorer Picker (Required) */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                              Goal Scorer <span className="text-[#ff0046]">*</span>
                            </label>
                            <select
                              value={goal.playerId}
                              onChange={(e) => handleUpdateGoal(idx, 'playerId', e.target.value)}
                              disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                              className={`w-full bg-[#081018] border text-xs font-bold rounded-lg px-3 py-2 text-white focus:outline-none transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                                !goal.playerId && validationError
                                  ? 'border-rose-500 focus:border-rose-400'
                                  : 'border-[#1a2e45] focus:border-[#ff0046]'
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

                          {/* Assist Picker (Optional) */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                              Assist <span className="text-slate-400 text-[9px] lowercase font-normal">(optional)</span>
                            </label>
                            <select
                              value={goal.assistPlayerId || ''}
                              onChange={(e) => handleUpdateGoal(idx, 'assistPlayerId', e.target.value)}
                              disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                              className="w-full bg-[#081018] border border-[#1a2e45] text-xs font-medium rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff0046] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                    ))}
                  </div>
                )}
              </div>

              {/* 3. DISCIPLINARY CARDS SECTION */}
              <div className="bg-[#081018] border border-[#1a2e45] rounded-xl p-4 space-y-4">
                <div className="border-b border-[#1a2e45] pb-2.5">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="w-2.5 h-3.5 rounded-[2px] bg-amber-400 inline-block"></span>
                    <span className="w-2.5 h-3.5 rounded-[2px] bg-rose-600 inline-block -ml-1"></span>
                    <span>Cards & Disciplinary</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Select players from your roster who received yellow or red cards in this game.
                  </p>
                </div>

                {/* Yellow Cards Subsection */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-3.5 rounded-[2px] bg-amber-400 inline-block"></span>
                      <span>Yellow Cards ({yellowCards.length})</span>
                    </label>

                    {!isAlreadyRecorded && (
                      <div className="w-48 sm:w-56">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddYellowCard(e.target.value);
                            }
                          }}
                          disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                          className="w-full bg-[#112236] border border-[#1a2e45] text-slate-200 text-[11px] font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
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
                            className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg"
                          >
                            <span className="w-2 h-2.5 rounded-[1px] bg-amber-400 shrink-0"></span>
                            <span>{pName}</span>
                            {!isAlreadyRecorded && (
                              <button
                                type="button"
                                onClick={() => handleRemoveYellowCard(pid)}
                                className="text-amber-300 hover:text-white cursor-pointer ml-1"
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
                    <p className="text-[11px] text-slate-500 italic">No yellow cards recorded.</p>
                  )}
                </div>

                {/* Red Cards Subsection */}
                <div className="space-y-2.5 pt-2 border-t border-[#1a2e45]/60">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-3.5 rounded-[2px] bg-rose-600 inline-block"></span>
                      <span>Red Cards ({redCards.length})</span>
                    </label>

                    {!isAlreadyRecorded && (
                      <div className="w-48 sm:w-56">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddRedCard(e.target.value);
                            }
                          }}
                          disabled={isAlreadyRecorded || isLoadingExisting || isSaving}
                          className="w-full bg-[#112236] border border-[#1a2e45] text-slate-200 text-[11px] font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-400 transition-colors cursor-pointer"
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
                            className="inline-flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold px-2.5 py-1 rounded-lg"
                          >
                            <span className="w-2 h-2.5 rounded-[1px] bg-rose-600 shrink-0"></span>
                            <span>{pName}</span>
                            {!isAlreadyRecorded && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRedCard(pid)}
                                className="text-rose-300 hover:text-white cursor-pointer ml-1"
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
                    <p className="text-[11px] text-slate-500 italic">No red cards recorded.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* VALIDATION ERROR BANNER */}
          {validationError && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="px-5 py-4 bg-[#112236] border-t border-[#1a2e45] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isAlreadyRecorded ? 'Close' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isAlreadyRecorded || isSaving || isLoadingExisting || !activeMatch}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#ff0046] hover:bg-[#e0003c] active:scale-[0.98] text-white flex items-center gap-2 shadow-lg shadow-[#ff0046]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
};

export default CoachMatchEventsModal;
