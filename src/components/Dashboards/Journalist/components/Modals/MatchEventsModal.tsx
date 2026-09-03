import React, { useState } from 'react';
import {
  X,
  Play,
  Clock,
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
}> = ({ match: currentMatch, onClose, cardBg, triggerToast, onMatchUpdated }) => {
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
  const [minuteStr, setMinuteStr] = useState<string>('1');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('FIRST_HALF');
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

  const handleStartMatch = async () => {
    try {
      await startMatch();
      triggerToast('Match successfully started and live input activated!');
      if (onMatchUpdated) onMatchUpdated();
    } catch (err: any) {
      triggerToast(`Start failed: ${err.message || 'Error'}`);
    }
  };

  const handleSetPeriod = async (period: Period) => {
    try {
      await setPeriod(period);
      triggerToast(`Period progressed to: ${period.replace('_', ' ')}`);
      if (onMatchUpdated) onMatchUpdated();
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
      triggerToast(`⚽ Goal logged in database! Live score updated.`);
      if (onMatchUpdated) onMatchUpdated();
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
      triggerToast(`${cardType} card saved in match database.`);
      if (onMatchUpdated) onMatchUpdated();
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
      if (onMatchUpdated) onMatchUpdated();
    } catch (err: any) {
      // Handled in hook
    }
  };

  const handleConfirmCancelEvent = async (eventUid: string) => {
    try {
      await cancelEvent(eventUid);
      triggerToast('Event deleted from database and score recalculated.');
      if (onMatchUpdated) onMatchUpdated();
    } catch (err: any) {
      triggerToast(`Cancellation failed: ${err.message || 'Error'}`);
    }
  };

  const activeEvents: MatchEvent[] = liveState?.active_events || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className={`w-full max-w-2xl ${cardBg} p-5 md:p-6 rounded-3xl shadow-2xl space-y-5 border border-slate-700/60 max-h-[92vh] overflow-y-auto`}>
        {/* MODAL HEADER WITH TEAMS & LIVE SCORE */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-emerald-500" />
                Live Match Events Engine
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Match ID: <strong className="text-slate-200">{currentMatch.id}</strong>
              </span>
            </div>
            <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{currentMatch.homeTeam}</span>
              <span className="px-2.5 py-0.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-sm font-black border border-emerald-500/40">
                {currentScoreHome} - {currentScoreAway}
              </span>
              <span>{currentMatch.awayTeam}</span>
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>{currentMatch.competition}</span>
              <span>•</span>
              <span>{currentMatch.venue}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ENGINE WARNING / ERROR ALERT */}
        {engineError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-500 dark:text-rose-400 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{engineError}</span>
            </div>
            <button
              onClick={() => setEngineError(null)}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black cursor-pointer hover:bg-rose-500"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* MATCH PERIOD STEPPER */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-200 font-extrabold">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Match Status & Period
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
              {matchStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {matchStatus === 'SCHEDULED' && (
              <button
                onClick={handleStartMatch}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5" /> Start Match
              </button>
            )}

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200 dark:bg-slate-800">
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
        <div className="space-y-2.5">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Add Live Match Event (Auto-Preloads for Referee)
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* + GOAL BUTTON */}
            <button
              onClick={handleOpenGoalModal}
              disabled={isSubmitting || isMatchFinished}
              className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="text-lg">⚽</span>
              <span>+ Add Goal</span>
            </button>

            {/* + CARD BUTTON */}
            <button
              onClick={handleOpenCardModal}
              disabled={isSubmitting || isMatchFinished}
              className="p-3 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-extrabold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="text-lg">🟨</span>
              <span>+ Add Card</span>
            </button>

            {/* + INJURY BUTTON */}
            <button
              onClick={handleOpenInjuryModal}
              disabled={isSubmitting || isMatchFinished}
              className="p-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-extrabold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="text-lg">🩹</span>
              <span>+ Add Injury</span>
            </button>
          </div>
        </div>

        {/* LIVE EVENT LIST WITH DIRECT DELETION */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
            <span>Logged Events ({activeEvents.length})</span>
            <span className="text-[10px] text-emerald-500 font-bold">Stored in DB for Preload</span>
          </div>

          {activeEvents.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-1">
              <Clock className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-400">No events recorded for this match yet.</p>
              <p className="text-[11px] text-slate-500">Add a goal, card, or injury above to register it live.</p>
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
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-mono font-black text-emerald-500 text-xs shrink-0">
                        {evt.minute !== null && evt.minute !== undefined ? `${evt.minute}'` : "—'"}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            {evt.type === 'GOAL' ? '⚽ Goal' : evt.type === 'CARD' ? (evt.card_type === 'RED' ? '🟥 Red Card' : '🟨 Yellow Card') : '🩹 Injury'}
                          </span>
                          {evt.goal_type && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              {evt.goal_type}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">• {teamName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {player ? `${player.display_name} (#${player.jersey_number})` : evt.player_uid ? `Player ${evt.player_uid}` : 'Player Unassigned'}
                        </div>
                      </div>
                    </div>

                    {/* DELETE EVENT ACTION */}
                    <button
                      onClick={() => handleConfirmCancelEvent(evt.event_uid)}
                      disabled={isSubmitting}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white transition-colors cursor-pointer shrink-0"
                      title="Delete event from match"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL CLOSE BUTTON */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-extrabold text-xs cursor-pointer"
          >
            Done Managing Events
          </button>
        </div>

        {/* SUBMODAL 1: ADD GOAL */}
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={`max-w-md w-full p-5 rounded-3xl ${cardBg} space-y-4 shadow-2xl border border-slate-700`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>⚽</span> Record Live Goal
                </h3>
                <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-xs font-bold">✕</button>
              </div>

              <div className="space-y-3 text-xs">
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
                      {currentMatch.homeTeam}
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
                      {currentMatch.awayTeam}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Goal Type</label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value="TAP_IN">Open Play (TAP_IN)</option>
                    <option value="HEADER">Header</option>
                    <option value="FREE_KICK">Direct Free Kick</option>
                    <option value="PENALTY">Penalty</option>
                    <option value="SCREAMER">Long Range Screamer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
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
                  Save Goal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODAL 2: ADD CARD */}
        {isCardModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={`max-w-md w-full p-5 rounded-3xl ${cardBg} space-y-4 shadow-2xl border border-slate-700`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>🟨</span> Issue Card
                </h3>
                <button onClick={() => setIsCardModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-xs font-bold">✕</button>
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
                      {currentMatch.homeTeam}
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
                      {currentMatch.awayTeam}
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
                        className={`p-2 rounded-xl font-extrabold border text-center transition-all cursor-pointer ${
                          cardType === c
                            ? c === 'RED' || c === 'SECOND_YELLOW'
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {c === 'YELLOW' ? 'Yellow' : c === 'SECOND_YELLOW' ? '2nd Yellow' : 'Red'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
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
                  Save Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODAL 3: ADD INJURY */}
        {isInjuryModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={`max-w-md w-full p-5 rounded-3xl ${cardBg} space-y-4 shadow-2xl border border-slate-700`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>🩹</span> Record Injury
                </h3>
                <button onClick={() => setIsInjuryModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-xs font-bold">✕</button>
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
                      {currentMatch.homeTeam}
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
                      {currentMatch.awayTeam}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
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
