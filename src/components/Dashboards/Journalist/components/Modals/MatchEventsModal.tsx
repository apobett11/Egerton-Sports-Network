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
          {/* FLASHSCORE SCORE HEADER */}
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
                <span className="font-mono text-xs font-black text-[#ff0046] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff0046] animate-pulse" />
                  {currentMatch.minute || 'LIVE'}
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
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors active:scale-95 disabled:opacity-50"
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
                      disabled={isSubmitting || isMatchFinished}
                      className={`px-3 py-1.5 rounded-sm text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
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
            </div>
          </div>

          {/* INCIDENT ACTION BUTTONS (+GOAL #ff0046, +CARD #152a40, +INJURY #152a40) */}
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Add Live Match Event (Real-time Intake)
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* + GOAL BUTTON */}
              <button
                onClick={handleOpenGoalModal}
                disabled={isSubmitting || isMatchFinished}
                className="p-3 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors active:scale-95 disabled:opacity-50"
              >
                <span className="text-lg leading-none">⚽</span>
                <span>+ Goal</span>
              </button>

              {/* + CARD BUTTON */}
              <button
                onClick={handleOpenCardModal}
                disabled={isSubmitting || isMatchFinished}
                className="p-3 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-amber-400 font-bold uppercase text-xs tracking-wider border border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors active:scale-95 disabled:opacity-50"
              >
                <span className="text-lg leading-none">🟨</span>
                <span>+ Card</span>
              </button>

              {/* + INJURY BUTTON */}
              <button
                onClick={handleOpenInjuryModal}
                disabled={isSubmitting || isMatchFinished}
                className="p-3 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-slate-200 font-bold uppercase text-xs tracking-wider border border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors active:scale-95 disabled:opacity-50"
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
                        disabled={isSubmitting}
                        className="p-2 rounded-sm bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 transition-colors cursor-pointer shrink-0"
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

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Minute (0 - 200)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={minuteStr}
                      onChange={(e) => setMinuteStr(e.target.value)}
                      className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] font-mono font-bold text-xs text-white focus:border-[#ff0046] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Period
                    </label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                      className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] text-white font-bold text-xs focus:border-[#ff0046] focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="FIRST_HALF">First Half</option>
                      <option value="HALF_TIME">Half Time</option>
                      <option value="SECOND_HALF">Second Half</option>
                      <option value="FULL_TIME">Full Time</option>
                    </select>
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

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Minute
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={minuteStr}
                      onChange={(e) => setMinuteStr(e.target.value)}
                      className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] font-mono font-bold text-xs text-white focus:border-[#ff0046] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Period
                    </label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                      className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] text-white font-bold text-xs focus:border-[#ff0046] focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="FIRST_HALF">First Half</option>
                      <option value="HALF_TIME">Half Time</option>
                      <option value="SECOND_HALF">Second Half</option>
                      <option value="FULL_TIME">Full Time</option>
                    </select>
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

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Minute
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={minuteStr}
                      onChange={(e) => setMinuteStr(e.target.value)}
                      className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] font-mono font-bold text-xs text-white focus:border-[#ff0046] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Period
                    </label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                      className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] text-white font-bold text-xs focus:border-[#ff0046] focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="FIRST_HALF">First Half</option>
                      <option value="HALF_TIME">Half Time</option>
                      <option value="SECOND_HALF">Second Half</option>
                      <option value="FULL_TIME">Full Time</option>
                    </select>
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
