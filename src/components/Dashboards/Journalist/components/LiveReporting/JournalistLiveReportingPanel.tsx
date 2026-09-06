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
    <div className={`p-4 sm:p-5 rounded-none sm:rounded-sm border ${cardBg} space-y-5 shadow-xs relative overflow-hidden`}>
      {/* HEADER WITH REALTIME ENGINE INDICATOR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-[#1a2e45] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#14263b] text-[#ff0046] border border-[#1a2e45] flex items-center gap-1.5 shadow-xs">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#ff0046]" />
              Algorithm 1 Live Engine
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              v{liveState?.version ?? 1} • Seq #{liveState?.event_sequence ?? 0}
            </span>
          </div>
          <h3 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
            Live Match Event Intake Center
          </h3>
        </div>

        {/* CURRENT MATCH STATUS & PERIOD */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-sm text-xs font-black uppercase tracking-wider ${
            isMatchLive
              ? 'bg-[#ff0046] text-white animate-pulse'
              : isMatchFinished
              ? 'bg-[#14263b] text-slate-300 border border-[#1a2e45]'
              : 'bg-[#152a40] text-white border border-white/10'
          }`}>
            {matchStatus}
          </span>
          {activePeriod && (
            <span className="px-2.5 py-0.5 rounded-sm bg-[#102237] border border-[#1a2e45] text-xs font-bold text-slate-300 uppercase tracking-wider">
              {activePeriod.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* SCOREBOARD HEADER BANNER */}
      <div className="p-4 sm:p-5 rounded-none sm:rounded-sm bg-[#0e1c2b] border border-[#1a2e45] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex-1 text-center sm:text-right">
          <h4 className="font-black text-base sm:text-lg text-white uppercase tracking-tight">{currentEvent.homeTeam}</h4>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Home Team</span>
        </div>

        <div className="flex flex-col items-center justify-center px-5 py-2 bg-[#112236] border border-[#1a2e45] rounded-sm min-w-[140px]">
          <div className="font-mono font-black text-3xl text-white tracking-wider">
            {currentScoreHome} : {currentScoreAway}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {isMatchLive ? (
              <span className="px-2 py-0.5 rounded-sm bg-[#ff0046] text-white text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {currentEvent.minute || activePeriod.replace('_', ' ')}
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                {matchStatus}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h4 className="font-black text-base sm:text-lg text-white uppercase tracking-tight">{currentEvent.awayTeam}</h4>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Away Team</span>
        </div>
      </div>

      {/* ENGINE WARNING / ERROR ALERT */}
      {engineError && (
        <div className="p-3.5 rounded-sm bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Algorithm Rule Notice: {engineError}</span>
          </div>
          <button
            onClick={() => setEngineError(null)}
            className="px-2.5 py-1 rounded-sm bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-rose-500 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MATCH CONTROL BAR: START MATCH & PERIOD STEPPER */}
      <div className="p-3.5 rounded-sm bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 uppercase text-[10px] font-bold tracking-wider">
            <Activity className="w-4 h-4 text-[#ff0046]" /> Match Execution Controls
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider">
            Derived Live Score: <strong className="text-[#ff0046] font-mono text-xs">{currentScoreHome} - {currentScoreAway}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Start Match Button */}
          {matchStatus === 'SCHEDULED' && (
            <button
              onClick={handleStartMatch}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs transition-colors active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> Start Match Activation
            </button>
          )}

          {/* Period Progression State Machine Buttons */}
          <div className="flex items-center gap-1 p-0.5 rounded-sm bg-[#0a1520] border border-[#1a2e45]">
            {(['FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'FULL_TIME'] as Period[]).map((p: Period) => {
              const isActive = activePeriod === p;
              return (
                <button
                  key={p}
                  onClick={() => handleSetPeriod(p)}
                  disabled={isSubmitting || isMatchFinished}
                  className={`px-3 py-1.5 rounded-[2px] text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#ff0046] text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
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
      <div className="space-y-2.5">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Record Live Match Incident (Algorithm 1 Intake)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* + GOAL BUTTON */}
          <button
            onClick={handleOpenGoalModal}
            disabled={isSubmitting || isMatchFinished}
            className="p-3 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs flex items-center justify-between cursor-pointer transition-colors disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">⚽</span>
              <span>+ Record Goal</span>
            </span>
            <span className="px-2 py-0.5 rounded-sm bg-black/20 text-[10px] font-bold">Type</span>
          </button>

          {/* + CARD BUTTON */}
          <button
            onClick={handleOpenCardModal}
            disabled={isSubmitting || isMatchFinished}
            className="p-3 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-bold uppercase text-xs tracking-wider rounded-sm border border-white/10 flex items-center justify-between cursor-pointer transition-colors disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🟨</span>
              <span>+ Issue Card</span>
            </span>
            <span className="px-2 py-0.5 rounded-sm bg-white/10 text-[10px] font-bold text-amber-400">Discipline</span>
          </button>

          {/* + INJURY BUTTON */}
          <button
            onClick={handleOpenInjuryModal}
            disabled={isSubmitting || isMatchFinished}
            className="p-3 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-bold uppercase text-xs tracking-wider rounded-sm border border-white/10 flex items-center justify-between cursor-pointer transition-colors disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🩹</span>
              <span>+ Record Injury</span>
            </span>
            <span className="px-2 py-0.5 rounded-sm bg-white/10 text-[10px] font-bold text-slate-300">Timeout</span>
          </button>
        </div>
      </div>

      {/* MATCH EVENTS DETAIL VIEW: CENTRAL MINUTE TIMELINE WITH MINI POPUP & SAVE */}
      <div className="pt-2 rounded-sm bg-[#0e1c2b] border border-[#1a2e45] p-3 shadow-xs">
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-5 rounded-xl bg-[#0e1e2d] border border-[#1a2e45] space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1a2e45] pb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <span>⚽</span> Record Live Goal (Algorithm 1)
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-sm hover:bg-[#152a40] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Team Selector */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Scoring Team</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(homeTeamUid)}
                    className={`p-2.5 rounded-sm font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === homeTeamUid
                        ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                        : 'bg-[#15273b] border-[#223b56] text-slate-300 hover:border-[#1a2e45]'
                    }`}
                  >
                    {currentEvent.homeTeam}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(awayTeamUid)}
                    className={`p-2.5 rounded-sm font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === awayTeamUid
                        ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                        : 'bg-[#15273b] border-[#223b56] text-slate-300 hover:border-[#1a2e45]'
                    }`}
                  >
                    {currentEvent.awayTeam}
                  </button>
                </div>
              </div>

              {/* Goal Type */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Goal Type (Exact Enum)</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as GoalType)}
                  className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none text-white font-bold transition-colors"
                >
                  <option value="TAP_IN" className="bg-[#0e1e2d] text-white">TAP_IN (Open Play)</option>
                  <option value="HEADER" className="bg-[#0e1e2d] text-white">HEADER</option>
                  <option value="FREE_KICK" className="bg-[#0e1e2d] text-white">FREE_KICK</option>
                  <option value="PENALTY" className="bg-[#0e1e2d] text-white">PENALTY</option>
                  <option value="SCREAMER" className="bg-[#0e1e2d] text-white">SCREAMER (Long Range)</option>
                  <option value="OTHER" className="bg-[#0e1e2d] text-white">OTHER</option>
                </select>
              </div>

              {/* Minute & Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Minute (0 - 200)</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={minuteStr}
                    onChange={(e) => setMinuteStr(e.target.value)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none font-mono font-bold text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none font-bold text-white transition-colors"
                  >
                    <option value="FIRST_HALF" className="bg-[#0e1e2d] text-white">First Half</option>
                    <option value="HALF_TIME" className="bg-[#0e1e2d] text-white">Half Time</option>
                    <option value="SECOND_HALF" className="bg-[#0e1e2d] text-white">Second Half</option>
                    <option value="FULL_TIME" className="bg-[#0e1e2d] text-white">Full Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1a2e45]">
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="px-4 py-2 rounded-sm bg-[#14263b] hover:bg-[#1c3857] text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitGoal}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Confirm Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CARD */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-5 rounded-xl bg-[#0e1e2d] border border-[#1a2e45] space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1a2e45] pb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <span>🟨</span> Issue Disciplinary Card
              </h3>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-sm hover:bg-[#152a40] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Team</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(homeTeamUid)}
                    className={`p-2.5 rounded-sm font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === homeTeamUid
                        ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                        : 'bg-[#15273b] border-[#223b56] text-slate-300 hover:border-[#1a2e45]'
                    }`}
                  >
                    {currentEvent.homeTeam}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(awayTeamUid)}
                    className={`p-2.5 rounded-sm font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === awayTeamUid
                        ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                        : 'bg-[#15273b] border-[#223b56] text-slate-300 hover:border-[#1a2e45]'
                    }`}
                  >
                    {currentEvent.awayTeam}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Card Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['YELLOW', 'SECOND_YELLOW', 'RED'] as CardType[]).map((c: CardType) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCardType(c)}
                      className={`p-2 rounded-sm font-extrabold border text-center transition-all cursor-pointer ${
                        cardType === c
                          ? c === 'RED' || c === 'SECOND_YELLOW'
                            ? 'bg-[#ff0046] text-white border-[#ff0046]'
                            : 'bg-[#f59e0b] text-slate-950 border-[#f59e0b]'
                          : 'bg-[#15273b] border-[#223b56] text-slate-300 hover:border-[#1a2e45]'
                      }`}
                    >
                      {c === 'YELLOW' ? 'Yellow' : c === 'SECOND_YELLOW' ? '2nd Yellow' : 'Direct Red'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={minuteStr}
                    onChange={(e) => setMinuteStr(e.target.value)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none font-mono font-bold text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none font-bold text-white transition-colors"
                  >
                    <option value="FIRST_HALF" className="bg-[#0e1e2d] text-white">First Half</option>
                    <option value="HALF_TIME" className="bg-[#0e1e2d] text-white">Half Time</option>
                    <option value="SECOND_HALF" className="bg-[#0e1e2d] text-white">Second Half</option>
                    <option value="FULL_TIME" className="bg-[#0e1e2d] text-white">Full Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1a2e45]">
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="px-4 py-2 rounded-sm bg-[#14263b] hover:bg-[#1c3857] text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCard}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Submit Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD INJURY */}
      {isInjuryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-5 rounded-xl bg-[#0e1e2d] border border-[#1a2e45] space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1a2e45] pb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <span>🩹</span> Record Match Injury
              </h3>
              <button
                onClick={() => setIsInjuryModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-sm hover:bg-[#152a40] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Team</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(homeTeamUid)}
                    className={`p-2.5 rounded-sm font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === homeTeamUid
                        ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                        : 'bg-[#15273b] border-[#223b56] text-slate-300 hover:border-[#1a2e45]'
                    }`}
                  >
                    {currentEvent.homeTeam}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(awayTeamUid)}
                    className={`p-2.5 rounded-sm font-extrabold border text-center transition-all cursor-pointer ${
                      selectedTeamUid === awayTeamUid
                        ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                        : 'bg-[#15273b] border-[#223b56] text-slate-300 hover:border-[#1a2e45]'
                    }`}
                  >
                    {currentEvent.awayTeam}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={minuteStr}
                    onChange={(e) => setMinuteStr(e.target.value)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none font-mono font-bold text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none font-bold text-white transition-colors"
                  >
                    <option value="FIRST_HALF" className="bg-[#0e1e2d] text-white">First Half</option>
                    <option value="HALF_TIME" className="bg-[#0e1e2d] text-white">Half Time</option>
                    <option value="SECOND_HALF" className="bg-[#0e1e2d] text-white">Second Half</option>
                    <option value="FULL_TIME" className="bg-[#0e1e2d] text-white">Full Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1a2e45]">
              <button
                onClick={() => setIsInjuryModalOpen(false)}
                className="px-4 py-2 rounded-sm bg-[#14263b] hover:bg-[#1c3857] text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitInjury}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Submit Injury
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT EVENT */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-5 rounded-xl bg-[#0e1e2d] border border-[#1a2e45] space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1a2e45] pb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#ff0046]" /> Edit Live Event ({editingEvent.type})
              </h3>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-sm hover:bg-[#152a40] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {editingEvent.type === 'GOAL' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Goal Type</label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none font-bold text-white transition-colors"
                  >
                    <option value="TAP_IN" className="bg-[#0e1e2d] text-white">TAP_IN</option>
                    <option value="HEADER" className="bg-[#0e1e2d] text-white">HEADER</option>
                    <option value="FREE_KICK" className="bg-[#0e1e2d] text-white">FREE_KICK</option>
                    <option value="PENALTY" className="bg-[#0e1e2d] text-white">PENALTY</option>
                    <option value="SCREAMER" className="bg-[#0e1e2d] text-white">SCREAMER</option>
                    <option value="OTHER" className="bg-[#0e1e2d] text-white">OTHER</option>
                  </select>
                </div>
              )}

              {editingEvent.type === 'CARD' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Card Type</label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as CardType)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none font-bold text-white transition-colors"
                  >
                    <option value="YELLOW" className="bg-[#0e1e2d] text-white">Yellow</option>
                    <option value="SECOND_YELLOW" className="bg-[#0e1e2d] text-white">Second Yellow</option>
                    <option value="RED" className="bg-[#0e1e2d] text-white">Direct Red</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={minuteStr}
                    onChange={(e) => setMinuteStr(e.target.value)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none font-mono font-bold text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none font-bold text-white transition-colors"
                  >
                    <option value="FIRST_HALF" className="bg-[#0e1e2d] text-white">First Half</option>
                    <option value="HALF_TIME" className="bg-[#0e1e2d] text-white">Half Time</option>
                    <option value="SECOND_HALF" className="bg-[#0e1e2d] text-white">Second Half</option>
                    <option value="FULL_TIME" className="bg-[#0e1e2d] text-white">Full Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1a2e45]">
              <button
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 rounded-sm bg-[#14263b] hover:bg-[#1c3857] text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateExistingEvent}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CANCEL CONFIRMATION */}
      {cancellingEventUid && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full p-5 rounded-xl bg-[#0e1e2d] border border-[#1a2e45] space-y-4 shadow-2xl text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm uppercase tracking-wider text-white">Cancel Live Event?</h3>
            <p className="text-xs text-slate-400 font-medium">
              This action will mark the event as CANCELLED, recalculate the live score and disciplinary standing, and cannot be undone.
            </p>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setCancellingEventUid(null)}
                className="px-4 py-2 rounded-sm bg-[#14263b] hover:bg-[#1c3857] text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors cursor-pointer"
              >
                Keep Event
              </button>
              <button
                onClick={handleConfirmCancelEvent}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
