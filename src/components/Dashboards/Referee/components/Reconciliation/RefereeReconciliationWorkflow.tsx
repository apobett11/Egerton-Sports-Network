import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  XOctagon,
  Trophy,
  Ban,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useRefereeReconciliationAlgorithm } from '../../../../../hooks/useRefereeReconciliationAlgorithm';
import type { Match } from '../../../../../types';
import type { RefereeTab, PlayerLookupItem } from '../../types';
import type {
  EventType,
  GoalType,
  CardType,
  Period,
  MatchEvent,
  MatchSquad,
  SquadPlayer,
} from '../../../../../services/matchLiveEngineAdapter';

interface RefereeReconciliationWorkflowProps {
  selectedFixture: Match | null;
  homeLineup: PlayerLookupItem[];
  awayLineup: PlayerLookupItem[];
  setActiveTab: (tab: RefereeTab) => void;
  onSuccess?: () => void;
}

export const RefereeReconciliationWorkflow: React.FC<RefereeReconciliationWorkflowProps> = ({
  selectedFixture,
  setActiveTab,
  onSuccess,
}) => {
  const { user } = useAuth();
  const matchUid = selectedFixture?.id;
  const {
    match,
    workingSet,
    canonicalResult,
    squads,
    isSubmitting,
    engineError,
    setEngineError,

    successMsg,
    setSuccessMsg,
    openWorkingSet,
    addEvent,
    updateEvent,
    removeEvent,
    clearEvents,
    confirmNormalResult,
    declareWalkover,
    cancelMatch,
  } = useRefereeReconciliationAlgorithm(matchUid, user?.id);

  // Workflow step
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isWalkoverModalOpen, setIsWalkoverModalOpen] = useState(false);
  const [isCancelMatchModalOpen, setIsCancelMatchModalOpen] = useState(false);
  const [isConfirmNormalModalOpen, setIsConfirmNormalModalOpen] = useState(false);

  // Form states for Add / Edit Event
  const [formEventType, setFormEventType] = useState<EventType>('GOAL');
  const [formTeamUid, setFormTeamUid] = useState<string>('');
  const [formJerseyNumber, setFormJerseyNumber] = useState<string>('');
  const [formPlayerUid, setFormPlayerUid] = useState<string>('');
  const [formGoalType, setFormGoalType] = useState<GoalType>('TAP_IN');
  const [formCardType, setFormCardType] = useState<CardType>('YELLOW');
  const [formMinute, setFormMinute] = useState<string>('1');
  const [formPeriod, setFormPeriod] = useState<Period>('SECOND_HALF');

  // Walkover form
  const [walkoverWinnerUid, setWalkoverWinnerUid] = useState<string>('');

  const homeTeamUid = match?.home_team_uid || selectedFixture?.teamA.id || 'home-1';
  const awayTeamUid = match?.away_team_uid || selectedFixture?.teamB.id || 'away-1';

  const homeSquad: SquadPlayer[] = squads.find((s: MatchSquad) => s.team_uid === homeTeamUid)?.players || [];
  const awaySquad: SquadPlayer[] = squads.find((s: MatchSquad) => s.team_uid === awayTeamUid)?.players || [];
  const currentFormSquad: SquadPlayer[] = formTeamUid === homeTeamUid ? homeSquad : awaySquad;

  // Auto-initialize working set on mount if not yet open
  useEffect(() => {
    if (matchUid && !workingSet && !canonicalResult) {
      openWorkingSet().catch(() => {});
    }
  }, [matchUid, workingSet, canonicalResult, openWorkingSet]);

  if (!selectedFixture) {
    return (
      <div className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xl">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">No Match Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Please select a fixture from the overview to begin referee reconciliation.</p>
        <button
          onClick={() => setActiveTab('overview')}
          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
        >
          Return to Overview
        </button>
      </div>
    );
  }

  // Handle Jersey number change with auto-squad lookup
  const handleJerseyNumberChange = (numStr: string) => {
    setFormJerseyNumber(numStr);
    const num = parseInt(numStr, 10);
    if (!isNaN(num)) {
      const found = currentFormSquad.find((p: SquadPlayer) => p.jersey_number === num);
      if (found) {
        setFormPlayerUid(found.player_uid);
      }
    }
  };

  const handleOpenAddModal = (type: EventType) => {
    setFormEventType(type);
    setFormTeamUid(homeTeamUid);
    setFormJerseyNumber('');
    setFormPlayerUid('');
    setFormGoalType('TAP_IN');
    setFormCardType('YELLOW');
    setFormMinute('1');
    setFormPeriod(workingSet?.period || 'SECOND_HALF');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (evt: MatchEvent) => {
    setEditingEvent(evt);
    setFormEventType(evt.type);
    setFormTeamUid(evt.team_uid);
    setFormJerseyNumber(evt.player_number !== null && evt.player_number !== undefined ? String(evt.player_number) : '');
    setFormPlayerUid(evt.player_uid || '');
    if (evt.goal_type) setFormGoalType(evt.goal_type);
    if (evt.card_type) setFormCardType(evt.card_type);
    setFormMinute(evt.minute !== null && evt.minute !== undefined ? String(evt.minute) : '');
    setFormPeriod(evt.period || 'SECOND_HALF');
  };

  const handleSubmitAddEvent = async () => {
    const min = formMinute ? parseInt(formMinute, 10) : null;
    const jNum = formJerseyNumber ? parseInt(formJerseyNumber, 10) : undefined;

    try {
      await addEvent({
        team_uid: formTeamUid,
        type: formEventType,
        goal_type: formEventType === 'GOAL' ? formGoalType : undefined,
        card_type: formEventType === 'CARD' ? formCardType : undefined,
        player_number: jNum,
        player_uid: formPlayerUid || undefined,
        minute: min,
        period: formPeriod,
        injury_player_optional: formEventType === 'INJURY',
      });
      setIsAddModalOpen(false);
      setSuccessMsg(`Event added to official working set.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      // Handled in hook
    }
  };

  const handleSubmitUpdateEvent = async () => {
    if (!editingEvent) return;
    const min = formMinute ? parseInt(formMinute, 10) : null;
    const jNum = formJerseyNumber ? parseInt(formJerseyNumber, 10) : null;

    try {
      await updateEvent({
        event_uid: editingEvent.event_uid,
        player_number: jNum,
        player_uid: formPlayerUid || null,
        goal_type: editingEvent.type === 'GOAL' ? formGoalType : undefined,
        card_type: editingEvent.type === 'CARD' ? formCardType : undefined,
        minute: min,
        period: formPeriod,
      });
      setEditingEvent(null);
      setSuccessMsg('Event updated in working set.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      // Handled in hook
    }
  };

  const handleRemoveEvent = async (eventUid: string) => {
    try {
      await removeEvent(eventUid);
      setSuccessMsg('Event removed from working set.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      // Handled in hook
    }
  };

  const handleClearAll = async () => {
    try {
      await clearEvents();
      setIsClearModalOpen(false);
      setSuccessMsg('All working set events cleared.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      // Handled in hook
    }
  };

  const handleConfirmNormal = async () => {
    try {
      await confirmNormalResult();
      setIsConfirmNormalModalOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Handled in hook
    }
  };

  const handleDeclareWalkover = async () => {
    if (!walkoverWinnerUid) {
      setEngineError('Please select the winning team for the walkover.');
      return;
    }
    try {
      await declareWalkover(walkoverWinnerUid);
      setIsWalkoverModalOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Handled in hook
    }
  };

  const handleCancelMatch = async () => {
    try {
      await cancelMatch();
      setIsCancelMatchModalOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Handled in hook
    }
  };

  const activeEvents: MatchEvent[] = (workingSet?.events || []).filter((e: MatchEvent) => e.status === 'ACTIVE');
  const goalsList: MatchEvent[] = activeEvents.filter((e: MatchEvent) => e.type === 'GOAL');
  const cardsList: MatchEvent[] = activeEvents.filter((e: MatchEvent) => e.type === 'CARD');

  const derivedHomeScore = workingSet?.home_score ?? selectedFixture.scoreA ?? 0;
  const derivedAwayScore = workingSet?.away_score ?? selectedFixture.scoreB ?? 0;

  // Validation checks for step 3 readiness
  const isReadyForNormalFinalize =
    (match?.status === 'FULL_TIME' || selectedFixture.status === 'FT') &&
    goalsList.every((g: MatchEvent) => g.player_uid) &&
    cardsList.every((c: MatchEvent) => c.player_uid);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => setActiveTab('overview')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Referee Dashboard
      </button>

      {/* SUCCESS / ERROR NOTICES */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {engineError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-500 dark:text-rose-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Algorithm Validation Notice: {engineError}</span>
          </div>
          <button
            onClick={() => setEngineError(null)}
            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black cursor-pointer hover:bg-rose-500"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* CANONICAL COMMITTED BANNER */}
      {canonicalResult && (
        <div className="p-5 rounded-3xl bg-slate-900 text-white border border-emerald-500/40 space-y-2 shadow-2xl">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
            <FileCheck className="w-4 h-4" /> Canonical Result Locked & Committed (Algorithm 1 Boundary)
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-300">
              Outcome: <strong className="text-white uppercase">{canonicalResult.outcome}</strong> ({canonicalResult.home_score} - {canonicalResult.away_score})
            </span>
            <span className="text-xs text-slate-400">
              Confirmed at: {new Date(canonicalResult.confirmed_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* MAIN CARD */}
      <div className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
        {/* Ambient Gradient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER & DERIVED SCORE BOARD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-[#D4AF37] border border-amber-500/30">
              OFFICIAL REFEREE RECONCILIATION ENGINE
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1.5">
              {selectedFixture.teamA.name} vs {selectedFixture.teamB.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Venue: {selectedFixture.venue || 'Campus Pitch'} • Matchday {selectedFixture.matchday || 1}
            </p>
          </div>

          {/* DERIVED SCOREBOARD DISPLAY */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase">{selectedFixture.teamA.shortName}</div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">{derivedHomeScore}</div>
            </div>
            <span className="text-lg font-black text-slate-400">:</span>
            <div className="text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase">{selectedFixture.teamB.shortName}</div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">{derivedAwayScore}</div>
            </div>
            <button
              onClick={() => openWorkingSet()}
              disabled={isSubmitting || !!canonicalResult}
              className="ml-2 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Resync working set from live intake"
            >
              <RotateCw className="w-3.5 h-3.5" /> Sync Live Feed
            </button>
          </div>
        </div>

        {/* 3 STEP TABS */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: 1, label: `1. Goals (${goalsList.length})` },
            { num: 2, label: `2. Disciplinary (${cardsList.length})` },
            { num: 3, label: '3. Terminal Finalize' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num as any)}
              className={`p-3.5 rounded-2xl text-center text-xs font-black transition-all cursor-pointer ${
                activeStep === s.num
                  ? 'bg-amber-500/15 text-amber-600 dark:text-[#D4AF37] border border-amber-500/30 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/60 text-slate-500 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* STEP 1: GOALS & WORKING SET EVENTS */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>⚽</span> Reconciled Goal Records ({goalsList.length})
              </h4>
              <button
                onClick={() => handleOpenAddModal('GOAL')}
                disabled={isSubmitting || !!canonicalResult}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" /> + Add Goal Event
              </button>
            </div>

            {goalsList.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400 space-y-1">
                <p className="font-bold">No goals in current working set (Current score: 0 - 0).</p>
                <p className="text-[11px] text-slate-500">Click "+ Add Goal Event" above to record an official goal.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {goalsList.map((g: MatchEvent, idx: number) => {
                  const isHome = g.team_uid === homeTeamUid;
                  const teamName = isHome ? selectedFixture.teamA.name : selectedFixture.teamB.name;
                  const squad = isHome ? homeSquad : awaySquad;
                  const player = squad.find((p: SquadPlayer) => p.player_uid === g.player_uid);

                  return (
                    <div
                      key={g.event_uid}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-black flex items-center justify-center shrink-0">
                          {g.minute !== null && g.minute !== undefined ? `${g.minute}'` : "—'"}
                        </span>
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>Goal #{idx + 1} ({g.goal_type || 'TAP_IN'})</span>
                            <span className="text-slate-400 font-bold">• {teamName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            {player ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                {player.display_name} (Jersey #{player.jersey_number})
                              </span>
                            ) : (
                              <span className="text-amber-500 font-bold">
                                ⚠️ Player Unresolved ({g.player_number ? `Jersey #${g.player_number}` : 'Missing Player UID'})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(g)}
                          disabled={!!canonicalResult}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveEvent(g.event_uid)}
                          disabled={!!canonicalResult}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveStep(2)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                Next: Review Cards & Disciplinary →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DISCIPLINARY & CARDS (WITH DERIVED RED DERIVATION) */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>🟨</span> Cards & Cautions ({cardsList.length})
              </h4>
              <button
                onClick={() => handleOpenAddModal('CARD')}
                disabled={isSubmitting || !!canonicalResult}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" /> + Issue Card
              </button>
            </div>

            {cardsList.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400 space-y-1">
                <p className="font-bold">No disciplinary cautions or dismissals recorded.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cardsList.map((c: MatchEvent, idx: number) => {
                  const isHome = c.team_uid === homeTeamUid;
                  const teamName = isHome ? selectedFixture.teamA.name : selectedFixture.teamB.name;
                  const squad = isHome ? homeSquad : awaySquad;
                  const player = squad.find((p: SquadPlayer) => p.player_uid === c.player_uid);

                  return (
                    <div
                      key={c.event_uid}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-9 h-9 rounded-xl font-mono font-black flex items-center justify-center shrink-0 ${
                          c.card_type === 'RED' || c.derived_red
                            ? 'bg-rose-500/20 text-rose-500'
                            : 'bg-amber-500/20 text-amber-600'
                        }`}>
                          {c.minute !== null && c.minute !== undefined ? `${c.minute}'` : "—'"}
                        </span>
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>
                              {c.card_type === 'RED' ? '🟥 Red Card' : c.card_type === 'SECOND_YELLOW' ? '🟨 Second Yellow' : '🟨 Yellow Card'}
                            </span>
                            {c.derived_red && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-500 text-[10px] font-black border border-rose-500/30">
                                Derived Red (2nd Yellow Dismissal)
                              </span>
                            )}
                            <span className="text-slate-400 font-bold">• {teamName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            {player ? (
                              <span className="text-slate-300 font-bold">
                                {player.display_name} (Jersey #{player.jersey_number})
                              </span>
                            ) : (
                              <span className="text-amber-500 font-bold">
                                ⚠️ Player Unresolved ({c.player_number ? `Jersey #${c.player_number}` : 'Missing Player UID'})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          disabled={!!canonicalResult}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveEvent(c.event_uid)}
                          disabled={!!canonicalResult}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                ← Back to Goals
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                Next: Terminal Finalization Action Center →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TERMINAL FINALIZATION ACTION CENTER */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <div className="font-black flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                <Shield className="w-4 h-4" /> Algorithm 1 Terminal Pipeline Selector
              </div>
              <p>
                Choose exactly one of the 3 independent finalization pipelines below. Once committed, the match will be permanently locked and handed over to Algorithm 2.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PIPELINE A: CONFIRM NORMAL RESULT */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-md">
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    Pipeline A (Standard)
                  </span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Confirm Full-Time Result
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Commits the reconciled score ({derivedHomeScore} - {derivedAwayScore}) and all verified goal/card records. Requires match at FULL_TIME.
                  </p>
                </div>

                <button
                  onClick={() => setIsConfirmNormalModalOpen(true)}
                  disabled={isSubmitting || !!canonicalResult}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  Confirm Normal FT ({derivedHomeScore} - {derivedAwayScore})
                </button>
              </div>

              {/* PIPELINE B: DECLARE WALKOVER */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-md">
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    Pipeline B (3-0 Administrative)
                  </span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Ban className="w-4 h-4 text-purple-500" /> Award Official Walkover
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Awards a 3-0 administrative victory to the chosen team. Zero individual goal scorers are credited in permanent history.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setWalkoverWinnerUid(homeTeamUid);
                    setIsWalkoverModalOpen(true);
                  }}
                  disabled={isSubmitting || !!canonicalResult}
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  Declare 3-0 Walkover
                </button>
              </div>

              {/* PIPELINE C: CANCEL MATCH */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-md">
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-500 border border-rose-500/30">
                    Pipeline C (0-0 Abandoned)
                  </span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <XOctagon className="w-4 h-4 text-rose-500" /> Cancel / Abandon Match
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sets terminal status to CANCELLED at 0-0 with zero events recorded. Irrevocable finalization.
                  </p>
                </div>

                <button
                  onClick={() => setIsCancelMatchModalOpen(true)}
                  disabled={isSubmitting || !!canonicalResult}
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel Match (0 - 0)
                </button>
              </div>
            </div>

            {/* DANGER ZONE: CLEAR WORKING SET */}
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-rose-500 uppercase">Destructive Reset</div>
                <div className="text-[11px] text-slate-500">Cancel all working set events and reset scores back to 0-0.</div>
              </div>
              <button
                onClick={() => setIsClearModalOpen(true)}
                disabled={isSubmitting || !!canonicalResult}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer"
              >
                Clear Working Set
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD EVENT TO WORKING SET */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Add Event ({formEventType}) - Referee Working Set
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Team</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTeamUid(homeTeamUid);
                      setFormJerseyNumber('');
                      setFormPlayerUid('');
                    }}
                    className={`p-2.5 rounded-xl font-extrabold border text-center ${
                      formTeamUid === homeTeamUid ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {selectedFixture.teamA.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTeamUid(awayTeamUid);
                      setFormJerseyNumber('');
                      setFormPlayerUid('');
                    }}
                    className={`p-2.5 rounded-xl font-extrabold border text-center ${
                      formTeamUid === awayTeamUid ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {selectedFixture.teamB.name}
                  </button>
                </div>
              </div>

              {/* Jersey Number & Squad Picker (Dual Lookup) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-amber-500 uppercase mb-1">Jersey # (0-99)</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    placeholder="# No"
                    value={formJerseyNumber}
                    onChange={(e) => handleJerseyNumberChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-amber-500/40 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div className="sm:col-span-8">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Squad Player</label>
                  <select
                    value={formPlayerUid}
                    onChange={(e) => {
                      setFormPlayerUid(e.target.value);
                      const p = currentFormSquad.find((x: SquadPlayer) => x.player_uid === e.target.value);
                      if (p) setFormJerseyNumber(String(p.jersey_number));
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="">-- Choose from Match Squad --</option>
                    {currentFormSquad.map((p: SquadPlayer) => (
                      <option key={p.player_uid} value={p.player_uid}>
                        #{p.jersey_number} - {p.display_name} {p.eligible_for_match ? '' : '(Ineligible)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formEventType === 'GOAL' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Goal Type</label>
                  <select
                    value={formGoalType}
                    onChange={(e) => setFormGoalType(e.target.value as GoalType)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
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

              {formEventType === 'CARD' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Card Type</label>
                  <select
                    value={formCardType}
                    onChange={(e) => setFormCardType(e.target.value as CardType)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
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
                    value={formMinute}
                    onChange={(e) => setFormMinute(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Period</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
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
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAddEvent}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
              >
                Add to Working Set
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT WORKING SET EVENT */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Edit Working Set Event ({editingEvent.type})
              </h3>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-amber-500 uppercase mb-1">Jersey #</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={formJerseyNumber}
                    onChange={(e) => handleJerseyNumberChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-amber-500/40 font-bold"
                  />
                </div>
                <div className="sm:col-span-8">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Player</label>
                  <select
                    value={formPlayerUid}
                    onChange={(e) => {
                      setFormPlayerUid(e.target.value);
                      const p = currentFormSquad.find((x: SquadPlayer) => x.player_uid === e.target.value);
                      if (p) setFormJerseyNumber(String(p.jersey_number));
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="">-- Unassigned --</option>
                    {currentFormSquad.map((p: SquadPlayer) => (
                      <option key={p.player_uid} value={p.player_uid}>
                        #{p.jersey_number} - {p.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editingEvent.type === 'GOAL' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Goal Type</label>
                  <select
                    value={formGoalType}
                    onChange={(e) => setFormGoalType(e.target.value as GoalType)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
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
                    value={formCardType}
                    onChange={(e) => setFormCardType(e.target.value as CardType)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
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
                    value={formMinute}
                    onChange={(e) => setFormMinute(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Period</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
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
                onClick={handleSubmitUpdateEvent}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM NORMAL RESULT (PIPELINE A) */}
      {isConfirmNormalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-500 font-black text-sm">
              <Trophy className="w-5 h-5" /> Official Result Verification Checklist
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please verify all criteria before committing permanent match outcome:
            </p>

            <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span>Final Score:</span>
                <strong className="font-mono text-emerald-500 font-black">{derivedHomeScore} - {derivedAwayScore}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Active Goals Scored:</span>
                <strong>{goalsList.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Cards Issued:</span>
                <strong>{cardsList.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Squad Player Attributions:</span>
                <strong className={isReadyForNormalFinalize ? 'text-emerald-500' : 'text-amber-500'}>
                  {isReadyForNormalFinalize ? 'All Verified' : 'Check Unresolved Players'}
                </strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsConfirmNormalModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNormal}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Commit Canonical Result
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DECLARE WALKOVER (PIPELINE B) */}
      {isWalkoverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-2 text-purple-500 font-black text-sm">
              <Ban className="w-5 h-5" /> Award Official 3-0 Walkover
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select the team receiving the 3-0 administrative victory. All existing live events will be discarded from permanent history.
            </p>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Award Victory To:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWalkoverWinnerUid(homeTeamUid)}
                  className={`p-3 rounded-2xl font-black text-xs border text-center transition-all ${
                    walkoverWinnerUid === homeTeamUid ? 'bg-purple-600 text-white border-purple-500 shadow-md' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {selectedFixture.teamA.name} (3 - 0)
                </button>
                <button
                  type="button"
                  onClick={() => setWalkoverWinnerUid(awayTeamUid)}
                  className={`p-3 rounded-2xl font-black text-xs border text-center transition-all ${
                    walkoverWinnerUid === awayTeamUid ? 'bg-purple-600 text-white border-purple-500 shadow-md' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {selectedFixture.teamB.name} (0 - 3)
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsWalkoverModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclareWalkover}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg cursor-pointer"
              >
                Commit Walkover Outcome
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL MATCH (PIPELINE C) */}
      {isCancelMatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <XOctagon className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white">Confirm Match Cancellation?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The match will be permanently cancelled at 0-0 with zero events credited. This terminal action is final.
            </p>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setIsCancelMatchModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Abort
              </button>
              <button
                onClick={handleCancelMatch}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLEAR WORKING SET */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white">Clear Working Set Events?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All currently active working set events will be cancelled and scores reset back to 0-0.
            </p>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Keep Events
              </button>
              <button
                onClick={handleClearAll}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
