import React, { useState } from 'react';
import {
  Play,
  Clock,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Radio,
  Activity,
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
import { MatchEventsDetailView } from '../../../../shared/MatchEventsDetailView';

interface JournalistLiveReportingPanelProps {
  currentEvent: CurrentMatchEvent;
  cardBg: string;
  hoverBg: string;
  triggerToast: (msg: string) => void;
}

export const JournalistLiveReportingPanel: React.FC<JournalistLiveReportingPanelProps> = ({
  currentEvent,
  cardBg,
  hoverBg,
  triggerToast,
}) => {
  const matchUid = currentEvent.id;
  const {
    match,
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
    updateEvent,
    cancelEvent,
    refreshState,
  } = useJournalistLiveAlgorithm(matchUid);

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isInjuryModalOpen, setIsInjuryModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);
  const [cancellingEventUid, setCancellingEventUid] = useState<string | null>(null);

  // Form states
  const [selectedTeamUid, setSelectedTeamUid] = useState<string>(
    match?.home_team_uid || currentEvent.homeTeamId || 'home-team'
  );
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string>('');
  const [minuteStr, setMinuteStr] = useState<string>('1');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('FIRST_HALF');

  // Goal specific
  const [goalType, setGoalType] = useState<GoalType>('TAP_IN');

  // Card specific
  const [cardType, setCardType] = useState<CardType>('YELLOW');

  const homeTeamUid = match?.home_team_uid || currentEvent.homeTeamId || 'home-team';
  const awayTeamUid = match?.away_team_uid || currentEvent.awayTeamId || 'away-team';

  const homeSquad: SquadPlayer[] = squads.find((s: MatchSquad) => s.team_uid === homeTeamUid)?.players || [];
  const awaySquad: SquadPlayer[] = squads.find((s: MatchSquad) => s.team_uid === awayTeamUid)?.players || [];
  const currentTeamSquad: SquadPlayer[] = selectedTeamUid === homeTeamUid ? homeSquad : awaySquad;

  const currentScoreHome = liveState?.home_score ?? currentEvent.scoreHome ?? 0;
  const currentScoreAway = liveState?.away_score ?? currentEvent.scoreAway ?? 0;
  const activePeriod = liveState?.period || 'FIRST_HALF';
  const matchStatus = liveState?.status || match?.status || 'SCHEDULED';

  const isMatchLive = matchStatus === 'LIVE' || matchStatus === 'HALF_TIME' || matchStatus === 'SECOND_HALF';
  const isMatchFinished = matchStatus === 'FULL_TIME' || matchStatus === 'FINALIZED' || matchStatus === 'LOCKED' || matchStatus === 'WALKOVER' || matchStatus === 'CANCELLED';

  const handleStartMatch = async () => {
    try {
      await startMatch();
      triggerToast('Match successfully started and live input activated!');
    } catch (err: any) {
      triggerToast(`Start failed: ${err.message || 'Error'}`);
    }
  };

  const handleSetPeriod = async (period: Period) => {
    try {
      await setPeriod(period);
      triggerToast(`Period progressed to: ${period.replace('_', ' ')}`);
    } catch (err: any) {
      triggerToast(`Period change failed: ${err.message || 'Error'}`);
    }
  };

  const handleOpenGoalModal = () => {
    setSelectedTeamUid(homeTeamUid);
    setSelectedPlayerUid('');
    setMinuteStr('1');
    setSelectedPeriod(activePeriod);
    setGoalType('TAP_IN');
    setIsGoalModalOpen(true);
  };

  const handleOpenCardModal = () => {
    setSelectedTeamUid(homeTeamUid);
    setSelectedPlayerUid('');
    setMinuteStr('1');
    setSelectedPeriod(activePeriod);
    setCardType('YELLOW');
    setIsCardModalOpen(true);
  };

  const handleOpenInjuryModal = () => {
    setSelectedTeamUid(homeTeamUid);
    setSelectedPlayerUid('');
    setMinuteStr('1');
    setSelectedPeriod(activePeriod);
    setIsInjuryModalOpen(true);
  };

  const handleSubmitGoal = async () => {
    const min = parseInt(minuteStr, 10);
    if (isNaN(min) || min < 0 || min > 200) {
      setEngineError('Minute must be between 0 and 200.');
      return;
    }
    try {
      await addGoal({
        team_uid: selectedTeamUid,
        goal_type: goalType,
        minute: min,
        period: selectedPeriod,
      });
      setIsGoalModalOpen(false);
      triggerToast(`Goal recorded! Score is now ${currentScoreHome + (selectedTeamUid === homeTeamUid ? 1 : 0)} - ${currentScoreAway + (selectedTeamUid === awayTeamUid ? 1 : 0)}`);
    } catch (err: any) {
      // Handled in hook
    }
  };

  const handleSubmitCard = async () => {
    const min = parseInt(minuteStr, 10);
    if (isNaN(min) || min < 0 || min > 200) {
      setEngineError('Minute must be between 0 and 200.');
      return;
    }
    try {
      await addCard({
        team_uid: selectedTeamUid,
        card_type: cardType,
        minute: min,
        period: selectedPeriod,
      });
      setIsCardModalOpen(false);
      triggerToast(`${cardType} card successfully submitted!`);
    } catch (err: any) {
      // Handled in hook
    }
  };

  const handleSubmitInjury = async () => {
    const min = parseInt(minuteStr, 10);
    if (isNaN(min) || min < 0 || min > 200) {
      setEngineError('Minute must be between 0 and 200.');
      return;
    }
    try {
      await addInjury({
        team_uid: selectedTeamUid,
        player_uid: selectedPlayerUid || undefined,
        minute: min,
        period: selectedPeriod,
      });
      setIsInjuryModalOpen(false);
      triggerToast('Injury timeout event registered.');
    } catch (err: any) {
      // Handled in hook
    }
  };

  const handleUpdateExistingEvent = async () => {
    if (!editingEvent) return;
    const min = minuteStr ? parseInt(minuteStr, 10) : null;
    try {
      await updateEvent({
        event_uid: editingEvent.event_uid,
        goal_type: editingEvent.type === 'GOAL' ? goalType : undefined,
        card_type: editingEvent.type === 'CARD' ? cardType : undefined,
        player_uid: selectedPlayerUid || null,
        minute: min,
        period: selectedPeriod,
      });
      setEditingEvent(null);
      triggerToast('Live event updated in algorithm!');
    } catch (err: any) {
      // Handled in hook
    }
  };

  const handleConfirmCancelEvent = async () => {
    if (!cancellingEventUid) return;
    try {
      await cancelEvent(cancellingEventUid);
      setCancellingEventUid(null);
      triggerToast('Live event cancelled and score recalculated.');
    } catch (err: any) {
      triggerToast(`Cancellation failed: ${err.message || 'Error'}`);
    }
  };

  const activeEvents: MatchEvent[] = liveState?.active_events || [];

  return (
    <div className={`p-6 rounded-3xl border ${cardBg} space-y-6 shadow-xl relative overflow-hidden`}>
      {/* Ambient background decoration */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER WITH REALTIME ENGINE INDICATOR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
              Algorithm 1 Live Engine
            </span>
            <span className="text-xs font-bold text-slate-400">
              v{liveState?.version ?? 1} • Seq #{liveState?.event_sequence ?? 0}
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
            Live Match Event Intake Center
          </h3>
        </div>

        {/* CURRENT MATCH STATUS & PERIOD */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-xl text-xs font-black tracking-wider ${
            isMatchLive
              ? 'bg-rose-600 text-white animate-pulse'
              : isMatchFinished
              ? 'bg-slate-800 text-slate-200'
              : 'bg-emerald-600 text-white'
          }`}>
            {matchStatus}
          </span>
          {activePeriod && (
            <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-300">
              {activePeriod.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* ENGINE WARNING / ERROR ALERT */}
      {engineError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-500 dark:text-rose-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Algorithm Rule Notice: {engineError}</span>
          </div>
          <button
            onClick={() => setEngineError(null)}
            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black cursor-pointer hover:bg-rose-500"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MATCH CONTROL BAR: START MATCH & PERIOD STEPPER */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-500" /> Match Execution Controls
          </span>
          <span>Derived Live Score: <strong className="text-emerald-500 font-mono text-sm">{currentScoreHome} - {currentScoreAway}</strong></span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Start Match Button */}
          {matchStatus === 'SCHEDULED' && (
            <button
              onClick={handleStartMatch}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Play className="w-4 h-4" /> Start Match Activation
            </button>
          )}

          {/* Period Progression State Machine Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200 dark:bg-slate-800">
            {(['FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'FULL_TIME'] as Period[]).map((p: Period) => {
              const isActive = activePeriod === p;
              return (
                <button
                  key={p}
                  onClick={() => handleSetPeriod(p)}
                  disabled={isSubmitting || isMatchFinished}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p === 'FIRST_HALF' ? '1st Half' : p === 'HALF_TIME' ? 'HT' : p === 'SECOND_HALF' ? '2nd Half' : 'Full Time'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* QUICK INTAKE ACTION BUTTONS (+ GOAL, + CARD, + INJURY) */}
      <div className="space-y-3">
        <div className="text-xs font-black uppercase tracking-wider text-slate-400">
          Record Live Match Incident (Algorithm 1 Intake)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* + GOAL BUTTON */}
          <button
            onClick={handleOpenGoalModal}
            disabled={isSubmitting || isMatchFinished}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs flex items-center justify-between cursor-pointer shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">⚽</span>
              <span>+ Record Goal</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px]">Pills / Type</span>
          </button>

          {/* + CARD BUTTON */}
          <button
            onClick={handleOpenCardModal}
            disabled={isSubmitting || isMatchFinished}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-extrabold text-xs flex items-center justify-between cursor-pointer shadow-lg shadow-amber-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🟨</span>
              <span>+ Issue Card</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px]">Yellow / Red</span>
          </button>

          {/* + INJURY BUTTON */}
          <button
            onClick={handleOpenInjuryModal}
            disabled={isSubmitting || isMatchFinished}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-extrabold text-xs flex items-center justify-between cursor-pointer shadow-lg shadow-sky-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🩹</span>
              <span>+ Record Injury</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px]">Optional Player</span>
          </button>
        </div>
      </div>

      {/* MATCH EVENTS DETAIL VIEW: CENTRAL MINUTE TIMELINE WITH MINI POPUP & SAVE */}
      <div className="pt-2">
        <MatchEventsDetailView
          matchId={matchUid}
          initialMatch={currentEvent}
          canEdit={!isMatchFinished}
          role="journalist"
          onMatchUpdated={() => {
            refreshState();
            triggerToast('Live match state updated from database.');
          }}
        />
      </div>

      {/* MODAL 1: ADD GOAL */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-6 rounded-3xl border ${cardBg} space-y-4 shadow-2xl animate-fadeIn`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>⚽</span> Record Live Goal (Algorithm 1)
              </h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Team Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Scoring Team</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(homeTeamUid)}
                    className={`p-2.5 rounded-xl font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === homeTeamUid
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {currentEvent.homeTeam}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(awayTeamUid)}
                    className={`p-2.5 rounded-xl font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === awayTeamUid
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {currentEvent.awayTeam}
                  </button>
                </div>
              </div>

              {/* Goal Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Goal Type (Exact Enum)</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as GoalType)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                >
                  <option value="TAP_IN">TAP_IN (Open Play)</option>
                  <option value="HEADER">HEADER</option>
                  <option value="FREE_KICK">FREE_KICK</option>
                  <option value="PENALTY">PENALTY</option>
                  <option value="SCREAMER">SCREAMER (Long Range)</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              {/* Minute & Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Minute (0 - 200)</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={minuteStr}
                    onChange={(e) => setMinuteStr(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="FIRST_HALF">First Half</option>
                    <option value="HALF_TIME">Half Time</option>
                    <option value="SECOND_HALF">Second Half</option>
                    <option value="FULL_TIME">Full Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitGoal}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Confirm Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CARD */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-6 rounded-3xl border ${cardBg} space-y-4 shadow-2xl animate-fadeIn`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🟨</span> Issue Disciplinary Card
              </h3>
              <button onClick={() => setIsCardModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Team</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(homeTeamUid)}
                    className={`p-2.5 rounded-xl font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === homeTeamUid
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {currentEvent.homeTeam}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(awayTeamUid)}
                    className={`p-2.5 rounded-xl font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === awayTeamUid
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {currentEvent.awayTeam}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Card Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['YELLOW', 'SECOND_YELLOW', 'RED'] as CardType[]).map((c: CardType) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCardType(c)}
                      className={`p-2.5 rounded-xl font-extrabold border text-center transition-all cursor-pointer ${
                        cardType === c
                          ? c === 'RED' || c === 'SECOND_YELLOW'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {c === 'YELLOW' ? 'Yellow' : c === 'SECOND_YELLOW' ? '2nd Yellow' : 'Direct Red'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={minuteStr}
                    onChange={(e) => setMinuteStr(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="FIRST_HALF">First Half</option>
                    <option value="HALF_TIME">Half Time</option>
                    <option value="SECOND_HALF">Second Half</option>
                    <option value="FULL_TIME">Full Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCard}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Submit Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD INJURY */}
      {isInjuryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-6 rounded-3xl border ${cardBg} space-y-4 shadow-2xl animate-fadeIn`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🩹</span> Record Match Injury
              </h3>
              <button onClick={() => setIsInjuryModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Team</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(homeTeamUid)}
                    className={`p-2.5 rounded-xl font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === homeTeamUid
                        ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {currentEvent.homeTeam}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(awayTeamUid)}
                    className={`p-2.5 rounded-xl font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === awayTeamUid
                        ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {currentEvent.awayTeam}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={minuteStr}
                    onChange={(e) => setMinuteStr(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="FIRST_HALF">First Half</option>
                    <option value="HALF_TIME">Half Time</option>
                    <option value="SECOND_HALF">Second Half</option>
                    <option value="FULL_TIME">Full Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsInjuryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitInjury}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Submit Injury
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT EVENT */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-6 rounded-3xl border ${cardBg} space-y-4 shadow-2xl animate-fadeIn`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-500" /> Edit Live Event ({editingEvent.type})
              </h3>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-200 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              {editingEvent.type === 'GOAL' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Goal Type</label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="TAP_IN">TAP_IN</option>
                    <option value="HEADER">HEADER</option>
                    <option value="FREE_KICK">FREE_KICK</option>
                    <option value="PENALTY">PENALTY</option>
                    <option value="SCREAMER">SCREAMER</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              )}

              {editingEvent.type === 'CARD' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Card Type</label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as CardType)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="YELLOW">Yellow</option>
                    <option value="SECOND_YELLOW">Second Yellow</option>
                    <option value="RED">Direct Red</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={minuteStr}
                    onChange={(e) => setMinuteStr(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="FIRST_HALF">First Half</option>
                    <option value="HALF_TIME">Half Time</option>
                    <option value="SECOND_HALF">Second Half</option>
                    <option value="FULL_TIME">Full Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateExistingEvent}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CANCEL CONFIRMATION */}
      {cancellingEventUid && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-sm w-full p-6 rounded-3xl border ${cardBg} space-y-4 shadow-2xl text-center animate-fadeIn`}>
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Cancel Live Event?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This action will mark the event as CANCELLED, recalculate the live score and disciplinary standing, and cannot be undone.
            </p>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setCancellingEventUid(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Keep Event
              </button>
              <button
                onClick={handleConfirmCancelEvent}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Yes, Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
