import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Clock,
  Trash2,
  AlertTriangle,
  Radio,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useJournalistLiveAlgorithm } from '../../../../../hooks/useJournalistLiveAlgorithm';
import type { CurrentMatchEvent } from '../../JournalistTypes';
import type {
  GoalType,
  CardType,
  Period,
  MatchEvent,
  MatchSquad,
  SquadPlayer,
} from '../../../../../services/matchLiveEngineAdapter';

/**
 * Checks if a fixture is scheduled for today or currently in-progress.
 * Journalists are restricted to editing matches within matchday only.
 */
export function isMatchScheduledToday(match: CurrentMatchEvent | null): boolean {
  if (!match) return false;
  if (
    match.status === 'LIVE' ||
    match.status === 'HT' ||
    match.status === 'SECOND_HALF' ||
    (match.status as string) === '1H' ||
    (match.status as string) === '2H'
  ) {
    return true;
  }

  const raw = match.scheduledTime || (match as any).scheduled_time;
  if (!raw) return true;

  const d = new Date(raw);
  if (isNaN(d.getTime())) return true;

  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

interface MatchEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: CurrentMatchEvent | null;
  cardBg: string;
  triggerToast: (msg: string) => void;
  onMatchUpdated?: () => void;
}

export const MatchEventsModal: React.FC<MatchEventsModalProps> = ({
  isOpen,
  onClose,
  match: currentMatch,
  cardBg,
  triggerToast,
  onMatchUpdated,
}) => {
  if (!isOpen || !currentMatch) return null;

  return (
    <MatchEventsModalContent
      match={currentMatch}
      onClose={onClose}
      cardBg={cardBg}
      triggerToast={triggerToast}
      onMatchUpdated={onMatchUpdated}
    />
  );
};

const MatchEventsModalContent: React.FC<{
  match: CurrentMatchEvent;
  onClose: () => void;
  cardBg: string;
  triggerToast: (msg: string) => void;
  onMatchUpdated?: () => void;
}> = ({ match: currentMatch, onClose, triggerToast, onMatchUpdated }) => {
  const matchUid = currentMatch.id;
  const {
    match: algoMatch,
    liveState,
    squads,
    isSubmitting,
    engineError,
    setEngineError,
    startMatch,
    setPeriod,
    addGoal,
    addCard,
    addInjury,
    cancelEvent,
  } = useJournalistLiveAlgorithm(matchUid);

  // Sub-modal states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isInjuryModalOpen, setIsInjuryModalOpen] = useState(false);

  // Form states
  const homeTeamUid = algoMatch?.home_team_uid || currentMatch.homeTeamId || 'home-team';
  const awayTeamUid = algoMatch?.away_team_uid || currentMatch.awayTeamId || 'away-team';

  const [selectedTeamUid, setSelectedTeamUid] = useState<string>(homeTeamUid);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string>('');
  const [goalType, setGoalType] = useState<GoalType>('TAP_IN');
  const [cardType, setCardType] = useState<CardType>('YELLOW');

  const homeSquad: SquadPlayer[] = squads.find((s: MatchSquad) => s.team_uid === homeTeamUid)?.players || [];
  const awaySquad: SquadPlayer[] = squads.find((s: MatchSquad) => s.team_uid === awayTeamUid)?.players || [];
  const currentTeamSquad: SquadPlayer[] = selectedTeamUid === homeTeamUid ? homeSquad : awaySquad;

  const currentScoreHome = liveState?.home_score ?? currentMatch.scoreHome ?? 0;
  const currentScoreAway = liveState?.away_score ?? currentMatch.scoreAway ?? 0;
  const activePeriod = liveState?.period || 'FIRST_HALF';
  const matchStatus = liveState?.status || algoMatch?.status || currentMatch.status || 'SCHEDULED';

  const isMatchLive = matchStatus === 'LIVE' || matchStatus === 'HALF_TIME' || matchStatus === 'SECOND_HALF';
  const isMatchFinished = matchStatus === 'FULL_TIME' || matchStatus === 'FINALIZED' || matchStatus === 'LOCKED' || matchStatus === 'WALKOVER' || matchStatus === 'CANCELLED';

  // Automated match clock state (in seconds)
  const [clockSeconds, setClockSeconds] = useState<number>(() => {
    if (activePeriod === 'HALF_TIME') return 45 * 60;
    if (activePeriod === 'SECOND_HALF') return 46 * 60;
    if (activePeriod === 'FULL_TIME') return 90 * 60;
    if (currentMatch.minute) {
      const parsed = parseInt(currentMatch.minute.replace("'", ''), 10);
      if (!isNaN(parsed) && parsed > 0) return parsed * 60;
    }
    return 1 * 60;
  });

  // Clock runs only when match is live, not in half-time, and not finished
  const isClockRunning = isMatchLive && activePeriod !== 'HALF_TIME' && !isMatchFinished;

  useEffect(() => {
    if (activePeriod === 'HALF_TIME') {
      setClockSeconds(45 * 60);
      return;
    }
    if (activePeriod === 'FULL_TIME' || isMatchFinished) {
      setClockSeconds(90 * 60);
      return;
    }
    if (activePeriod === 'SECOND_HALF') {
      setClockSeconds((prev) => Math.max(prev, 46 * 60));
    }
  }, [activePeriod, isMatchFinished]);

  useEffect(() => {
    if (!isClockRunning) return;
    const timer = setInterval(() => {
      setClockSeconds((prev) => {
        if (activePeriod === 'FIRST_HALF') {
          return Math.min(prev + 1, 45 * 60);
        }
        if (activePeriod === 'SECOND_HALF') {
          return Math.min(prev + 1, 90 * 60);
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isClockRunning, activePeriod]);

  // Derived current automated minute
  const currentAutomatedMinute = React.useMemo(() => {
    if (activePeriod === 'HALF_TIME') return 45;
    if (activePeriod === 'FULL_TIME' || isMatchFinished) return 90;
    const min = Math.max(1, Math.floor(clockSeconds / 60));
    if (activePeriod === 'SECOND_HALF') {
      return Math.max(46, min);
    }
    return Math.min(45, min);
  }, [clockSeconds, activePeriod, isMatchFinished]);

  const isEditableToday = isMatchScheduledToday(currentMatch);

  const handleStartMatch = () => {
    if (!isEditableToday) {
      triggerToast('Date restricted: Match events can only be started on the scheduled match day.');
      return;
    }
    // Instant UI activation (0ms)
    setClockSeconds(60);
    triggerToast('Match successfully started and live input activated!');

    startMatch()
      .then(() => {
        if (onMatchUpdated) onMatchUpdated();
      })
      .catch((err: any) => {
        triggerToast(`Start failed: ${err.message || 'Error'}`);
      });
  };

  const handleSetPeriod = (period: Period) => {
    if (!isEditableToday) {
      triggerToast('Date restricted: Match status can only be updated on the scheduled match day.');
      return;
    }
    // Instant UI feedback (0ms)
    if (period === 'HALF_TIME') {
      setClockSeconds(45 * 60);
    } else if (period === 'SECOND_HALF') {
      setClockSeconds(46 * 60);
    } else if (period === 'FULL_TIME') {
      setClockSeconds(90 * 60);
    }

    triggerToast(
      period === 'FULL_TIME'
        ? '🏁 Match ended! Final result registered.'
        : `Period progressed to: ${period.replace('_', ' ')}`
    );

    setPeriod(period)
      .then(() => {
        if (onMatchUpdated) onMatchUpdated();
      })
      .catch((err: any) => {
        triggerToast(`Period change failed: ${err.message || 'Error'}`);
      });
  };

  const handleOpenGoalModal = () => {
    if (!isEditableToday) {
      triggerToast('Date restricted: Goal logging is only permitted on the scheduled match day.');
      return;
    }
    setSelectedTeamUid(homeTeamUid);
    setSelectedPlayerUid('');
    setGoalType('TAP_IN');
    setIsGoalModalOpen(true);
  };

  const handleOpenCardModal = () => {
    if (!isEditableToday) {
      triggerToast('Date restricted: Card logging is only permitted on the scheduled match day.');
      return;
    }
    setSelectedTeamUid(homeTeamUid);
    setSelectedPlayerUid('');
    setCardType('YELLOW');
    setIsCardModalOpen(true);
  };

  const handleOpenInjuryModal = () => {
    if (!isEditableToday) {
      triggerToast('Date restricted: Injury logging is only permitted on the scheduled match day.');
      return;
    }
    setSelectedTeamUid(homeTeamUid);
    setSelectedPlayerUid('');
    setIsInjuryModalOpen(true);
  };

  const handleSubmitGoal = () => {
    if (!isEditableToday) {
      triggerToast('Editing restricted: Events can only be logged on the scheduled match day.');
      return;
    }
    const minuteToLog = currentAutomatedMinute;
    const teamToLog = selectedTeamUid;
    const playerToLog = selectedPlayerUid;
    const typeToLog = goalType;

    // Instant close submodal & instant toast (0ms latency)
    setIsGoalModalOpen(false);
    triggerToast(`⚽ Goal logged at ${minuteToLog}'! Live score updated.`);

    // Asynchronous background write to database
    addGoal({
      team_uid: teamToLog,
      player_uid: playerToLog || undefined,
      goal_type: typeToLog,
      minute: minuteToLog,
      period: activePeriod,
    })
      .then(() => {
        if (onMatchUpdated) onMatchUpdated();
      })
      .catch((err: any) => {
        triggerToast(`Goal recording error: ${err.message || 'Database sync failed'}`);
      });
  };

  const handleSubmitCard = () => {
    if (!isEditableToday) {
      triggerToast('Editing restricted: Events can only be logged on the scheduled match day.');
      return;
    }
    const minuteToLog = currentAutomatedMinute;
    const teamToLog = selectedTeamUid;
    const playerToLog = selectedPlayerUid;
    const cardToLog = cardType;

    // Instant close submodal & instant toast (0ms latency)
    setIsCardModalOpen(false);
    triggerToast(`${cardToLog} card saved in match database at ${minuteToLog}'.`);

    addCard({
      team_uid: teamToLog,
      player_uid: playerToLog || undefined,
      card_type: cardToLog,
      minute: minuteToLog,
      period: activePeriod,
    })
      .then(() => {
        if (onMatchUpdated) onMatchUpdated();
      })
      .catch((err: any) => {
        triggerToast(`Card recording error: ${err.message || 'Database sync failed'}`);
      });
  };

  const handleSubmitInjury = () => {
    if (!isEditableToday) {
      triggerToast('Editing restricted: Events can only be logged on the scheduled match day.');
      return;
    }
    const minuteToLog = currentAutomatedMinute;
    const teamToLog = selectedTeamUid;
    const playerToLog = selectedPlayerUid;

    // Instant close submodal & instant toast (0ms latency)
    setIsInjuryModalOpen(false);
    triggerToast(`Injury timeout event registered at ${minuteToLog}'.`);

    addInjury({
      team_uid: teamToLog,
      player_uid: playerToLog || undefined,
      minute: minuteToLog,
      period: activePeriod,
    })
      .then(() => {
        if (onMatchUpdated) onMatchUpdated();
      })
      .catch((err: any) => {
        triggerToast(`Injury recording error: ${err.message || 'Database sync failed'}`);
      });
  };

  const handleConfirmCancelEvent = (eventUid: string) => {
    if (!isEditableToday) {
      triggerToast('Editing restricted: Events can only be deleted on the scheduled match day.');
      return;
    }
    // Instant feedback
    triggerToast('Event deleted from database and score recalculated.');

    cancelEvent(eventUid)
      .then(() => {
        if (onMatchUpdated) onMatchUpdated();
      })
      .catch((err: any) => {
        triggerToast(`Cancellation failed: ${err.message || 'Error'}`);
      });
  };

  const activeEvents: MatchEvent[] = liveState?.active_events || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-[#0e1e2d] border border-[#1a2e45] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-[#0e1e2d] border-b border-[#1a2e45] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#ff0046] animate-pulse" /> Live Match Events Engine
            </h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Real-time incident intake & database synchronization
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white rounded-sm p-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* DIALOG BODY */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* DAY-ONLY EDITING RESTRICTION BANNER */}
          {!isEditableToday && (
            <div className="p-3.5 rounded-sm bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Matchday Restricted: Journalists can only log and edit events on the scheduled match day. This fixture is scheduled for{' '}
                {currentMatch.scheduledTime
                  ? new Date(currentMatch.scheduledTime).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : currentMatch.time || 'an upcoming matchday'}
                .
              </span>
            </div>
          )}

          <div className="bg-[#0e1c2b] border border-[#1a2e45] rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="truncate">{currentMatch.competition}</span>
              <span className="truncate">{currentMatch.venue}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-right flex-1 min-w-0 font-black text-sm sm:text-base text-white truncate">
                {currentMatch.homeTeam}
              </div>

              <div className="px-3.5 py-1.5 rounded-sm bg-[#112236] text-white font-mono font-black text-base sm:text-lg border border-[#1a2e45] tracking-widest flex items-center gap-2 shrink-0">
                <span className={isMatchLive ? 'text-[#ff0046]' : 'text-white'}>{currentScoreHome}</span>
                <span className="text-slate-400">-</span>
                <span className={isMatchLive ? 'text-[#ff0046]' : 'text-white'}>{currentScoreAway}</span>
              </div>

              <div className="text-left flex-1 min-w-0 font-black text-sm sm:text-base text-white truncate">
                {currentMatch.awayTeam}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1 border-t border-[#14263b]">
              <span>
                MATCH ID: <strong className="text-slate-300 font-mono">{currentMatch.id}</strong>
              </span>
              {isMatchLive ? (
                <span className="font-mono text-xs font-black text-[#ff0046] flex items-center gap-1.5" data-testid="live-match-minute">
                  <span className={`w-1.5 h-1.5 rounded-full bg-[#ff0046] ${isClockRunning ? 'animate-pulse' : ''}`} />
                  <span>
                    {activePeriod === 'HALF_TIME' ? "45' (HT)" : `${currentAutomatedMinute}'`}
                  </span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-sm bg-[#102237] text-slate-400 border border-[#1a2e45]">
                  {matchStatus}
                </span>
              )}
            </div>
          </div>

          {/* ENGINE WARNING / ERROR ALERT */}
          {engineError && (
            <div className="p-3.5 rounded-sm bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-400 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{engineError}</span>
              </div>
              <button
                onClick={() => setEngineError(null)}
                className="px-2.5 py-1 rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* MATCH PERIOD STEPPER */}
          <div className="bg-[#0e1c2b] border border-[#1a2e45] rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5 text-white font-black">
                <Activity className="w-3.5 h-3.5 text-[#ff0046]" /> Match Status & Period
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-[#152a40] text-slate-300 border border-white/10 text-[10px] font-black uppercase tracking-wider">
                {matchStatus}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {matchStatus === 'SCHEDULED' && (
                <button
                  onClick={handleStartMatch}
                  disabled={!isEditableToday || isSubmitting}
                  className="px-3.5 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Start Match
                </button>
              )}

              <div className="flex flex-wrap items-center gap-1 p-1 rounded-sm bg-[#102237] border border-[#1a2e45]">
                {(['FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'FULL_TIME'] as Period[]).map((p: Period) => {
                  const isActive = activePeriod === p;
                  return (
                    <button
                      key={p}
                      onClick={() => handleSetPeriod(p)}
                      disabled={!isEditableToday || isSubmitting || isMatchFinished}
                      className={`px-3 py-1.5 rounded-sm text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isActive
                          ? 'bg-[#ff0046] text-white shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-[#152a40]'
                      }`}
                    >
                      {p === 'FIRST_HALF' ? '1st Half' : p === 'HALF_TIME' ? 'HT' : p === 'SECOND_HALF' ? '2nd Half' : 'Full Time'}
                    </button>
                  );
                })}
              </div>

              {/* DEDICATED INSTANT END MATCH BUTTON */}
              {!isMatchFinished && matchStatus !== 'SCHEDULED' && (
                <button
                  onClick={() => handleSetPeriod('FULL_TIME')}
                  disabled={!isEditableToday || isSubmitting}
                  className="px-3 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors active:scale-95 ml-auto"
                  title="End match instantly and record final score in database"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>End Match (FT)</span>
                </button>
              )}
            </div>
          </div>

          {/* INCIDENT ACTION BUTTONS (+GOAL #ff0046, +CARD #152a40, +INJURY #152a40) */}
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Add Live Match Event (Real-time Intake)</span>
              {!isEditableToday && (
                <span className="text-amber-400 text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked until matchday
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* + GOAL BUTTON */}
              <button
                onClick={handleOpenGoalModal}
                disabled={!isEditableToday || isSubmitting || isMatchFinished}
                className="p-3 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-lg leading-none">⚽</span>
                <span>+ Goal</span>
              </button>

              {/* + CARD BUTTON */}
              <button
                onClick={handleOpenCardModal}
                disabled={!isEditableToday || isSubmitting || isMatchFinished}
                className="p-3 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-amber-400 font-bold uppercase text-xs tracking-wider border border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-lg leading-none">🟨</span>
                <span>+ Card</span>
              </button>

              {/* + INJURY BUTTON */}
              <button
                onClick={handleOpenInjuryModal}
                disabled={!isEditableToday || isSubmitting || isMatchFinished}
                className="p-3 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-slate-200 font-bold uppercase text-xs tracking-wider border border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-lg leading-none">🩹</span>
                <span>+ Injury</span>
              </button>
            </div>
          </div>

          {/* LOGGED EVENT LIST WITH DIRECT DELETION */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 border-t border-[#1a2e45] pt-3">
              <span>Logged Events ({activeEvents.length})</span>
              <span className="text-[10px] text-[#ff0046] font-bold uppercase tracking-wider">Synced with database</span>
            </div>

            {activeEvents.length === 0 ? (
              <div className="p-6 rounded-sm bg-[#0e1c2b] border border-dashed border-[#1a2e45] text-center space-y-1">
                <Clock className="w-5 h-5 text-slate-500 mx-auto" />
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">No events recorded for this match yet</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Click +Goal, +Card, or +Injury above to log an event</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {activeEvents.map((evt: MatchEvent) => {
                  const isHome = evt.team_uid === homeTeamUid;
                  const teamName = isHome ? currentMatch.homeTeam : currentMatch.awayTeam;
                  const player = currentTeamSquad.find((p: SquadPlayer) => p.player_uid === evt.player_uid);

                  return (
                    <div
                      key={evt.event_uid}
                      className="p-3 rounded-sm bg-[#0e1c2b] hover:bg-[#13263b] border border-[#1a2e45] flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-sm bg-[#152a40] border border-white/10 flex items-center justify-center font-mono font-black text-[#ff0046] text-xs shrink-0">
                          {evt.minute !== null && evt.minute !== undefined ? `${evt.minute}'` : "—'"}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black uppercase tracking-wider text-white">
                              {evt.type === 'GOAL' ? '⚽ Goal' : evt.type === 'CARD' ? (evt.card_type === 'RED' ? '🟥 Red Card' : '🟨 Yellow Card') : '🩹 Injury'}
                            </span>
                            {evt.goal_type && (
                              <span className="px-1.5 py-0.5 rounded-sm bg-[#14263b] text-[#ff0046] border border-[#1a2e45] text-[10px] font-bold uppercase tracking-wider">
                                {evt.goal_type}
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">• {teamName}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                            {player ? `${player.display_name} (#${player.jersey_number})` : evt.player_uid ? `Player ${evt.player_uid}` : 'Player Unassigned'}
                          </div>
                        </div>
                      </div>

                      {/* DELETE EVENT ACTION */}
                      <button
                        onClick={() => handleConfirmCancelEvent(evt.event_uid)}
                        disabled={!isEditableToday || isSubmitting}
                        className="p-2 rounded-sm bg-rose-500/10 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-rose-400 hover:text-white border border-rose-500/20 transition-colors cursor-pointer shrink-0"
                        title={isEditableToday ? "Delete event from match" : "Deletion locked on non-matchday"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-[#0e1e2d] border-t border-[#1a2e45] px-6 py-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-black text-xs uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
          >
            Done Managing Events
          </button>
        </div>

        {/* SUBMODAL 1: ADD GOAL */}
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#0e1e2d] border border-[#1a2e45] rounded-xl shadow-2xl overflow-hidden space-y-0">
              <div className="bg-[#0e1e2d] border-b border-[#1a2e45] px-5 py-3.5 flex items-center justify-between text-white font-black uppercase text-xs tracking-wider">
                <h3 className="flex items-center gap-2">
                  <span>⚽</span> Record Live Goal
                </h3>
                <button
                  onClick={() => setIsGoalModalOpen(false)}
                  className="bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white rounded-sm p-1 border border-white/10 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs bg-[#081018]">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Scoring Team
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTeamUid(homeTeamUid)}
                      className={`p-2.5 rounded-sm font-black text-xs uppercase tracking-wider border text-center transition-colors cursor-pointer ${
                        selectedTeamUid === homeTeamUid
                          ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                          : 'bg-[#15273b] hover:bg-[#152a40] border-[#223b56] text-slate-300'
                      }`}
                    >
                      {currentMatch.homeTeam}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTeamUid(awayTeamUid)}
                      className={`p-2.5 rounded-sm font-black text-xs uppercase tracking-wider border text-center transition-colors cursor-pointer ${
                        selectedTeamUid === awayTeamUid
                          ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                          : 'bg-[#15273b] hover:bg-[#152a40] border-[#223b56] text-slate-300'
                      }`}
                    >
                      {currentMatch.awayTeam}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Goal Scorer (Squad)
                  </label>
                  <select
                    data-testid="select-player"
                    value={selectedPlayerUid}
                    onChange={(e) => setSelectedPlayerUid(e.target.value)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] text-white font-bold text-xs focus:border-[#ff0046] focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">-- Select Player --</option>
                    {currentTeamSquad.map((p: SquadPlayer) => (
                      <option key={p.player_uid} value={p.player_uid}>
                        #{p.jersey_number} {p.display_name} {p.is_starting_xi ? '(Starting XI)' : '(Substitute)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Goal Type
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] text-white font-bold text-xs focus:border-[#ff0046] focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="TAP_IN">Open Play (TAP_IN)</option>
                    <option value="HEADER">Header</option>
                    <option value="FREE_KICK">Direct Free Kick</option>
                    <option value="PENALTY">Penalty</option>
                    <option value="SCREAMER">Long Range Screamer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* AUTOMATED MATCH TIME DISPLAY */}
                <div className="p-3 rounded-sm bg-[#112236] border border-[#1a2e45] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#ff0046]" />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Automated Match Time
                      </div>
                      <div className="text-[11px] text-slate-300 font-bold">
                        {activePeriod === 'HALF_TIME' ? 'Half Time (Clock Stopped)' : 'Live Match Clock (Auto-fetched)'}
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-3 py-1 rounded-sm bg-[#152a40] border border-white/10 font-mono font-black text-sm text-[#ff0046] flex items-center gap-1.5"
                    data-testid="automated-event-minute"
                  >
                    {activePeriod === 'HALF_TIME' ? (
                      <span>45' HT</span>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff0046] animate-pulse" />
                        <span>{currentAutomatedMinute}'</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-[#0e1e2d] border-t border-[#1a2e45] flex justify-end gap-2">
                <button
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitGoal}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer transition-colors"
                >
                  Save Goal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODAL 2: ADD CARD */}
        {isCardModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#0e1e2d] border border-[#1a2e45] rounded-xl shadow-2xl overflow-hidden space-y-0">
              <div className="bg-[#0e1e2d] border-b border-[#1a2e45] px-5 py-3.5 flex items-center justify-between text-white font-black uppercase text-xs tracking-wider">
                <h3 className="flex items-center gap-2">
                  <span>🟨</span> Issue Card
                </h3>
                <button
                  onClick={() => setIsCardModalOpen(false)}
                  className="bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white rounded-sm p-1 border border-white/10 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs bg-[#081018]">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Team
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTeamUid(homeTeamUid)}
                      className={`p-2.5 rounded-sm font-black text-xs uppercase tracking-wider border text-center transition-colors cursor-pointer ${
                        selectedTeamUid === homeTeamUid
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                          : 'bg-[#15273b] hover:bg-[#152a40] border-[#223b56] text-slate-300'
                      }`}
                    >
                      {currentMatch.homeTeam}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTeamUid(awayTeamUid)}
                      className={`p-2.5 rounded-sm font-black text-xs uppercase tracking-wider border text-center transition-colors cursor-pointer ${
                        selectedTeamUid === awayTeamUid
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                          : 'bg-[#15273b] hover:bg-[#152a40] border-[#223b56] text-slate-300'
                      }`}
                    >
                      {currentMatch.awayTeam}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Player Booked (Squad)
                  </label>
                  <select
                    data-testid="select-card-player"
                    value={selectedPlayerUid}
                    onChange={(e) => setSelectedPlayerUid(e.target.value)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] text-white font-bold text-xs focus:border-[#ff0046] focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">-- Select Player --</option>
                    {currentTeamSquad.map((p: SquadPlayer) => (
                      <option key={p.player_uid} value={p.player_uid}>
                        #{p.jersey_number} {p.display_name} {p.is_starting_xi ? '(Starting XI)' : '(Substitute)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Card Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['YELLOW', 'SECOND_YELLOW', 'RED'] as CardType[]).map((c: CardType) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCardType(c)}
                        className={`p-2 rounded-sm font-black text-xs uppercase tracking-wider border text-center transition-colors cursor-pointer ${
                          cardType === c
                            ? c === 'RED' || c === 'SECOND_YELLOW'
                              ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                              : 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                            : 'bg-[#15273b] hover:bg-[#152a40] border-[#223b56] text-slate-300'
                        }`}
                      >
                        {c === 'YELLOW' ? 'Yellow' : c === 'SECOND_YELLOW' ? '2nd Yellow' : 'Red'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AUTOMATED MATCH TIME DISPLAY */}
                <div className="p-3 rounded-sm bg-[#112236] border border-[#1a2e45] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#ff0046]" />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Automated Match Time
                      </div>
                      <div className="text-[11px] text-slate-300 font-bold">
                        {activePeriod === 'HALF_TIME' ? 'Half Time (Clock Stopped)' : 'Live Match Clock (Auto-fetched)'}
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-3 py-1 rounded-sm bg-[#152a40] border border-white/10 font-mono font-black text-sm text-amber-400 flex items-center gap-1.5"
                    data-testid="automated-event-minute"
                  >
                    {activePeriod === 'HALF_TIME' ? (
                      <span>45' HT</span>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>{currentAutomatedMinute}'</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-[#0e1e2d] border-t border-[#1a2e45] flex justify-end gap-2">
                <button
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-4 py-2 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCard}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-sm bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer transition-colors"
                >
                  Save Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODAL 3: ADD INJURY */}
        {isInjuryModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#0e1e2d] border border-[#1a2e45] rounded-xl shadow-2xl overflow-hidden space-y-0">
              <div className="bg-[#0e1e2d] border-b border-[#1a2e45] px-5 py-3.5 flex items-center justify-between text-white font-black uppercase text-xs tracking-wider">
                <h3 className="flex items-center gap-2">
                  <span>🩹</span> Record Injury
                </h3>
                <button
                  onClick={() => setIsInjuryModalOpen(false)}
                  className="bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white rounded-sm p-1 border border-white/10 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs bg-[#081018]">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Team
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTeamUid(homeTeamUid)}
                      className={`p-2.5 rounded-sm font-black text-xs uppercase tracking-wider border text-center transition-colors cursor-pointer ${
                        selectedTeamUid === homeTeamUid
                          ? 'bg-[#152a40] text-white border-white/20 shadow-xs ring-1 ring-white/20'
                          : 'bg-[#15273b] hover:bg-[#152a40] border-[#223b56] text-slate-300'
                      }`}
                    >
                      {currentMatch.homeTeam}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTeamUid(awayTeamUid)}
                      className={`p-2.5 rounded-sm font-black text-xs uppercase tracking-wider border text-center transition-colors cursor-pointer ${
                        selectedTeamUid === awayTeamUid
                          ? 'bg-[#152a40] text-white border-white/20 shadow-xs ring-1 ring-white/20'
                          : 'bg-[#15273b] hover:bg-[#152a40] border-[#223b56] text-slate-300'
                      }`}
                    >
                      {currentMatch.awayTeam}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Injured Player (Squad)
                  </label>
                  <select
                    data-testid="select-injury-player"
                    value={selectedPlayerUid}
                    onChange={(e) => setSelectedPlayerUid(e.target.value)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] text-white font-bold text-xs focus:border-[#ff0046] focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">-- Select Player --</option>
                    {currentTeamSquad.map((p: SquadPlayer) => (
                      <option key={p.player_uid} value={p.player_uid}>
                        #{p.jersey_number} {p.display_name} {p.is_starting_xi ? '(Starting XI)' : '(Substitute)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AUTOMATED MATCH TIME DISPLAY */}
                <div className="p-3 rounded-sm bg-[#112236] border border-[#1a2e45] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#ff0046]" />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Automated Match Time
                      </div>
                      <div className="text-[11px] text-slate-300 font-bold">
                        {activePeriod === 'HALF_TIME' ? 'Half Time (Clock Stopped)' : 'Live Match Clock (Auto-fetched)'}
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-3 py-1 rounded-sm bg-[#152a40] border border-white/10 font-mono font-black text-sm text-[#ff0046] flex items-center gap-1.5"
                    data-testid="automated-injury-minute"
                  >
                    {activePeriod === 'HALF_TIME' ? (
                      <span>45' HT</span>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff0046] animate-pulse" />
                        <span>{currentAutomatedMinute}'</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-[#0e1e2d] border-t border-[#1a2e45] flex justify-end gap-2">
                <button
                  onClick={() => setIsInjuryModalOpen(false)}
                  className="px-4 py-2 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitInjury}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer transition-colors"
                >
                  Save Injury
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
