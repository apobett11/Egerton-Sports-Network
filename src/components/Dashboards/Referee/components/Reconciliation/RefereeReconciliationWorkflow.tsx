import React, { useState, useEffect, useRef } from 'react';
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
  PenTool,
  X,
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useRefereeReconciliationAlgorithm } from '../../../../../hooks/useRefereeReconciliationAlgorithm';
import { MatchEventsDetailView } from '../../../../shared/MatchEventsDetailView';
import { formatMatchPitch } from '../../../../../lib/matchdayHelper';
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

  // Electronic Signature Pad state
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

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

  // Setup signature canvas when Confirm Normal modal opens
  useEffect(() => {
    if (isConfirmNormalModalOpen && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#15273b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      setHasSignature(false);
    }
  }, [isConfirmNormalModalOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    ctx.lineTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const handleClearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#15273b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  if (!selectedFixture) {
    return (
      <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-8 text-center space-y-3 shadow-xs">
        <AlertTriangle className="w-8 h-8 text-[#ff0046] mx-auto" />
        <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">No Match Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Please select a fixture from the overview to begin referee reconciliation.</p>
        <button
          onClick={() => setActiveTab('overview')}
          className="px-4 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider cursor-pointer shadow-xs transition-colors"
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
    } catch {
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
    } catch {
      // Handled in hook
    }
  };

  const handleRemoveEvent = async (eventUid: string) => {
    try {
      await removeEvent(eventUid);
      setSuccessMsg('Event removed from working set.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      // Handled in hook
    }
  };

  const handleClearAll = async () => {
    try {
      await clearEvents();
      setIsClearModalOpen(false);
      setSuccessMsg('All working set events cleared.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      // Handled in hook
    }
  };

  const handleConfirmNormal = async () => {
    try {
      await confirmNormalResult();
      setIsConfirmNormalModalOpen(false);
      if (onSuccess) onSuccess();
    } catch {
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
    } catch {
      // Handled in hook
    }
  };

  const handleCancelMatch = async () => {
    try {
      await cancelMatch();
      setIsCancelMatchModalOpen(false);
      if (onSuccess) onSuccess();
    } catch {
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
    <div className="space-y-5 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => setActiveTab('overview')}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-[#ff0046] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Referee Dashboard
      </button>

      {/* SUCCESS / ERROR NOTICES */}
      {successMsg && (
        <div className="p-3.5 rounded-md bg-[#00b04f]/10 border border-[#00b04f]/30 text-xs font-black uppercase tracking-wider text-[#00b04f] flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#00b04f] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {engineError && (
        <div className="p-3.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-500 dark:text-rose-400 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Algorithm Validation Notice: {engineError}</span>
          </div>
          <button
            onClick={() => setEngineError(null)}
            className="px-2.5 py-1 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white text-[11px] font-black uppercase tracking-wider cursor-pointer border border-white/10 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* CANONICAL COMMITTED BANNER */}
      {canonicalResult && (
        <div className="p-4 sm:p-5 rounded-none sm:rounded-sm bg-[#0e1e2d] text-white border border-[#00b04f]/40 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-[#00b04f] font-black text-xs uppercase tracking-wider">
            <FileCheck className="w-4 h-4" /> Canonical Result Locked & Committed (Algorithm 1 Boundary)
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <span className="text-xs sm:text-sm font-bold text-slate-300">
              Outcome: <strong className="text-white uppercase font-black">{canonicalResult.outcome}</strong> ({canonicalResult.home_score} - {canonicalResult.away_score})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Confirmed at: {new Date(canonicalResult.confirmed_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 sm:p-6 lg:p-7 space-y-6 shadow-xs relative overflow-hidden">
        {/* Subtle sports brand accent ambient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#ff0046]/5 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER & DERIVED SCOREBOARD */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1a2e45] pb-5">
          <div>
            <span className="px-2.5 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#152a40] text-white border border-[#223b56]">
              OFFICIAL REFEREE RECONCILIATION ENGINE
            </span>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1.5 font-sans">
              {selectedFixture.teamA.name} vs {selectedFixture.teamB.name}
            </h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
              Venue: {formatMatchPitch(selectedFixture.venue) || selectedFixture.venue || 'TBD'} • Matchday {selectedFixture.matchday || 1}
            </p>
          </div>

          {/* DERIVED SCOREBOARD DISPLAY */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#0e1e2d] p-3 sm:p-4 rounded-md border border-slate-200 dark:border-[#1a2e45] shadow-xs">
            <div className="text-center min-w-[50px]">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate max-w-[80px]">
                {selectedFixture.teamA.shortName || selectedFixture.teamA.name}
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                {derivedHomeScore}
              </div>
            </div>
            <span className="text-xl font-black text-slate-400 font-mono">:</span>
            <div className="text-center min-w-[50px]">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate max-w-[80px]">
                {selectedFixture.teamB.shortName || selectedFixture.teamB.name}
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                {derivedAwayScore}
              </div>
            </div>
            <button
              onClick={() => openWorkingSet()}
              disabled={isSubmitting || !!canonicalResult}
              className="ml-2 px-3 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] disabled:opacity-50 text-white font-black uppercase text-[11px] tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 border border-white/10 shadow-xs"
              title="Resync working set from live intake"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>Sync Live Feed</span>
            </button>
          </div>
        </div>

        {/* PRELOAD & REFEREE EDIT/DELETE CONTROL BANNER */}
        <div className="bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md p-4 flex items-start gap-3 shadow-xs">
          <div className="w-7 h-7 rounded-sm bg-[#152a40] text-[#ff0046] flex items-center justify-center font-black shrink-0 border border-[#223b56] text-sm">
            ℹ
          </div>
          <div className="text-xs space-y-1">
            <div className="font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Live Feed Preload Active • Referee Authority & Reconciliation
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Events below are <strong>preloaded from the live match intake & journalist stream</strong>. As the match official, you have sole authoritative control to <strong>edit</strong> or <strong>delete/dismiss any unverified event</strong> before committing the canonical result. Missing events can be added directly via the action buttons.
            </p>
          </div>
        </div>

        {/* 3 STEP WIZARD NAVIGATION WITH FLASHSCORE STEP INDICATORS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { num: 1, label: `1. Reconcile Events Timeline` },
            { num: 2, label: `2. Disciplinary Breakdown (${cardsList.length})` },
            { num: 3, label: '3. Terminal Finalize' },
          ].map((s) => {
            const isActive = activeStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num as 1 | 2 | 3)}
                className={`p-3 rounded-md text-center text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-[#152a40] text-white border-b-2 border-b-[#ff0046] ring-1 ring-white/10 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#102237] text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] border border-slate-200 dark:border-[#1a2e45]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-[#ff0046] text-white shadow-xs' : 'bg-[#15273b] text-slate-400'
                  }`}
                >
                  {s.num}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* STEP 1: RECONCILE MATCH EVENTS TIMELINE */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <MatchEventsDetailView
              matchId={selectedFixture.id}
              initialMatch={selectedFixture}
              canEdit={!canonicalResult}
              role="referee"
              actorUid={user?.id}
              onMatchUpdated={() => openWorkingSet()}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-[#1a2e45]">
              <button
                onClick={() => setActiveStep(2)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-bold uppercase text-xs tracking-wider border border-white/10 cursor-pointer transition-colors"
              >
                Inspect Disciplinary Cards →
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                Next: Terminal Finalization Action Center →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DISCIPLINARY & CARDS */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>🟨</span> Cards & Cautions ({cardsList.length})
              </h4>
              <button
                onClick={() => handleOpenAddModal('CARD')}
                disabled={isSubmitting || !!canonicalResult}
                className="px-3.5 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> + Issue Card
              </button>
            </div>

            {cardsList.length === 0 ? (
              <div className="p-8 rounded-md border border-dashed border-slate-300 dark:border-[#1a2e45] bg-slate-50/50 dark:bg-[#102237]/30 text-center text-xs text-slate-400 space-y-1">
                <p className="font-bold">No disciplinary cautions or dismissals recorded.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cardsList.map((c: MatchEvent) => {
                  const isHome = c.team_uid === homeTeamUid;
                  const teamName = isHome ? selectedFixture.teamA.name : selectedFixture.teamB.name;
                  const squad = isHome ? homeSquad : awaySquad;
                  const player = squad.find((p: SquadPlayer) => p.player_uid === c.player_uid);

                  return (
                    <div
                      key={c.event_uid}
                      className="p-3.5 sm:p-4 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] flex items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-sm font-mono font-black flex items-center justify-center shrink-0 border ${
                            c.card_type === 'RED' || c.derived_red
                              ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {c.minute !== null && c.minute !== undefined ? `${c.minute}'` : "—'"}
                        </span>
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                            <span>
                              {c.card_type === 'RED' ? '🟥 Red Card' : c.card_type === 'SECOND_YELLOW' ? '🟨 Second Yellow' : '🟨 Yellow Card'}
                            </span>
                            {c.derived_red && (
                              <span className="px-2 py-0.5 rounded-xs bg-rose-500/20 text-rose-500 text-[10px] font-black border border-rose-500/30 uppercase tracking-wider">
                                Derived Red (2nd Yellow Dismissal)
                              </span>
                            )}
                            <span className="text-slate-400 font-bold">• {teamName}</span>
                            {c.created_by_role === 'JOURNALIST' ? (
                              <span className="px-2 py-0.5 rounded-xs text-[10px] font-extrabold bg-sky-500/15 text-sky-400 border border-sky-500/30 uppercase tracking-wider">
                                Preloaded (Live Feed)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-xs text-[10px] font-extrabold bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30 uppercase tracking-wider">
                                Official Referee
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {player ? (
                              <span className="text-slate-300 font-bold">
                                {player.display_name} (Jersey #{player.jersey_number})
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold">
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
                          className="p-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 transition-colors cursor-pointer"
                          title="Edit card details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveEvent(c.event_uid)}
                          disabled={!!canonicalResult}
                          className="p-2 rounded-md bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                          title="Delete / Dismiss card from official record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-[#1a2e45]">
              <button
                onClick={() => setActiveStep(1)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-bold uppercase text-xs tracking-wider border border-white/10 cursor-pointer transition-colors"
              >
                ← Back to Timeline
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                Next: Terminal Finalization Action Center →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TERMINAL FINALIZATION ACTION CENTER */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="p-4 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] text-xs text-slate-300 space-y-1">
              <div className="font-black flex items-center gap-1.5 text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                <Shield className="w-4 h-4 text-[#ff0046]" /> Algorithm 1 Terminal Pipeline Selector
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Choose exactly one of the 3 independent finalization pipelines below. Once committed, the match will be permanently locked and handed over to Algorithm 2.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PIPELINE A: CONFIRM NORMAL RESULT */}
              <div className="p-5 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] space-y-4 flex flex-col justify-between shadow-xs hover:border-[#00b04f]/50 transition-all">
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30 inline-block">
                    Pipeline A (Standard)
                  </span>
                  <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#00b04f]" /> Confirm Full-Time Result
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Commits the reconciled score ({derivedHomeScore} - {derivedAwayScore}) and all verified goal/card records. Requires match at FULL_TIME.
                  </p>
                </div>

                <button
                  onClick={() => setIsConfirmNormalModalOpen(true)}
                  disabled={isSubmitting || !!canonicalResult}
                  className="w-full py-3 rounded-md bg-[#00b04f] hover:bg-[#009b45] text-white font-black uppercase text-xs tracking-wider cursor-pointer shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Confirm Normal FT ({derivedHomeScore} - {derivedAwayScore})
                </button>
              </div>

              {/* PIPELINE B: DECLARE WALKOVER */}
              <div className="p-5 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] space-y-4 flex flex-col justify-between shadow-xs hover:border-purple-500/50 transition-all">
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 inline-block">
                    Pipeline B (3-0 Administrative)
                  </span>
                  <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Ban className="w-4 h-4 text-purple-400" /> Award Official Walkover
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Awards a 3-0 administrative victory to the chosen team. Zero individual goal scorers are credited in permanent history.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setWalkoverWinnerUid(homeTeamUid);
                    setIsWalkoverModalOpen(true);
                  }}
                  disabled={isSubmitting || !!canonicalResult}
                  className="w-full py-3 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-black uppercase text-xs tracking-wider cursor-pointer border border-white/10 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Declare 3-0 Walkover
                </button>
              </div>

              {/* PIPELINE C: CANCEL MATCH */}
              <div className="p-5 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] space-y-4 flex flex-col justify-between shadow-xs hover:border-rose-500/50 transition-all">
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-500 border border-rose-500/30 inline-block">
                    Pipeline C (0-0 Abandoned)
                  </span>
                  <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <XOctagon className="w-4 h-4 text-rose-500" /> Cancel / Abandon Match
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Sets terminal status to CANCELLED at 0-0 with zero events recorded. Irrevocable finalization.
                  </p>
                </div>

                <button
                  onClick={() => setIsCancelMatchModalOpen(true)}
                  disabled={isSubmitting || !!canonicalResult}
                  className="w-full py-3 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 dark:text-rose-400 border border-rose-500/30 font-black uppercase text-xs tracking-wider cursor-pointer shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Cancel Match (0 - 0)
                </button>
              </div>
            </div>

            {/* DESTRUCTIVE RESET: CLEAR WORKING SET */}
            <div className="p-4 rounded-md bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-rose-500 uppercase tracking-wider">Destructive Reset</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Cancel all working set events and reset scores back to 0-0.</div>
              </div>
              <button
                onClick={() => setIsClearModalOpen(true)}
                disabled={isSubmitting || !!canonicalResult}
                className="px-3.5 py-2 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 dark:text-rose-400 border border-rose-500/30 font-black uppercase text-xs tracking-wider cursor-pointer transition-colors disabled:opacity-50"
              >
                Clear Working Set
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD EVENT TO WORKING SET */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl bg-[#0e1e2d] border border-[#1a2e45] text-white shadow-2xl overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 bg-[#0b1522] border-b border-[#14263b] flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider text-white">
                Add Event ({formEventType}) - Referee Working Set
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Select Team</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTeamUid(homeTeamUid);
                      setFormJerseyNumber('');
                      setFormPlayerUid('');
                    }}
                    className={`p-2.5 rounded-md font-black uppercase text-xs tracking-wider border text-center transition-colors cursor-pointer ${
                      formTeamUid === homeTeamUid
                        ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                        : 'bg-[#152a40] text-slate-300 border-[#223b56] hover:bg-[#1c3857]'
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
                    className={`p-2.5 rounded-md font-black uppercase text-xs tracking-wider border text-center transition-colors cursor-pointer ${
                      formTeamUid === awayTeamUid
                        ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                        : 'bg-[#152a40] text-slate-300 border-[#223b56] hover:bg-[#1c3857]'
                    }`}
                  >
                    {selectedFixture.teamB.name}
                  </button>
                </div>
              </div>

              {/* Jersey Number & Squad Picker (Dual Lookup) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Jersey # (0-99)</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    placeholder="# No"
                    value={formJerseyNumber}
                    onChange={(e) => handleJerseyNumberChange(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  />
                </div>
                <div className="sm:col-span-8">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Select Squad Player</label>
                  <select
                    value={formPlayerUid}
                    onChange={(e) => {
                      setFormPlayerUid(e.target.value);
                      const p = currentFormSquad.find((x: SquadPlayer) => x.player_uid === e.target.value);
                      if (p) setFormJerseyNumber(String(p.jersey_number));
                    }}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  >
                    <option value="" className="bg-[#0e1e2d]">-- Choose from Match Squad --</option>
                    {currentFormSquad.map((p: SquadPlayer) => (
                      <option key={p.player_uid} value={p.player_uid} className="bg-[#0e1e2d]">
                        #{p.jersey_number} - {p.display_name} {p.eligible_for_match ? '' : '(Ineligible)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formEventType === 'GOAL' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Goal Type</label>
                  <select
                    value={formGoalType}
                    onChange={(e) => setFormGoalType(e.target.value as GoalType)}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  >
                    <option value="TAP_IN" className="bg-[#0e1e2d]">TAP_IN</option>
                    <option value="HEADER" className="bg-[#0e1e2d]">HEADER</option>
                    <option value="FREE_KICK" className="bg-[#0e1e2d]">FREE_KICK</option>
                    <option value="PENALTY" className="bg-[#0e1e2d]">PENALTY</option>
                    <option value="SCREAMER" className="bg-[#0e1e2d]">SCREAMER</option>
                    <option value="OTHER" className="bg-[#0e1e2d]">OTHER</option>
                  </select>
                </div>
              )}

              {formEventType === 'CARD' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Card Type</label>
                  <select
                    value={formCardType}
                    onChange={(e) => setFormCardType(e.target.value as CardType)}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  >
                    <option value="YELLOW" className="bg-[#0e1e2d]">Yellow</option>
                    <option value="SECOND_YELLOW" className="bg-[#0e1e2d]">Second Yellow</option>
                    <option value="RED" className="bg-[#0e1e2d]">Direct Red</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={formMinute}
                    onChange={(e) => setFormMinute(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Period</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  >
                    <option value="FIRST_HALF" className="bg-[#0e1e2d]">First Half</option>
                    <option value="HALF_TIME" className="bg-[#0e1e2d]">Half Time</option>
                    <option value="SECOND_HALF" className="bg-[#0e1e2d]">Second Half</option>
                    <option value="FULL_TIME" className="bg-[#0e1e2d]">Full Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#0b1522] border-t border-[#14263b] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAddEvent}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                Add to Working Set
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT WORKING SET EVENT */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl bg-[#0e1e2d] border border-[#1a2e45] text-white shadow-2xl overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 bg-[#0b1522] border-b border-[#14263b] flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider text-white">
                Edit Working Set Event ({editingEvent.type})
              </h3>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Jersey #</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={formJerseyNumber}
                    onChange={(e) => handleJerseyNumberChange(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  />
                </div>
                <div className="sm:col-span-8">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Player</label>
                  <select
                    value={formPlayerUid}
                    onChange={(e) => {
                      setFormPlayerUid(e.target.value);
                      const p = currentFormSquad.find((x: SquadPlayer) => x.player_uid === e.target.value);
                      if (p) setFormJerseyNumber(String(p.jersey_number));
                    }}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  >
                    <option value="" className="bg-[#0e1e2d]">-- Unassigned --</option>
                    {currentFormSquad.map((p: SquadPlayer) => (
                      <option key={p.player_uid} value={p.player_uid} className="bg-[#0e1e2d]">
                        #{p.jersey_number} - {p.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editingEvent.type === 'GOAL' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Goal Type</label>
                  <select
                    value={formGoalType}
                    onChange={(e) => setFormGoalType(e.target.value as GoalType)}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  >
                    <option value="TAP_IN" className="bg-[#0e1e2d]">TAP_IN</option>
                    <option value="HEADER" className="bg-[#0e1e2d]">HEADER</option>
                    <option value="FREE_KICK" className="bg-[#0e1e2d]">FREE_KICK</option>
                    <option value="PENALTY" className="bg-[#0e1e2d]">PENALTY</option>
                    <option value="SCREAMER" className="bg-[#0e1e2d]">SCREAMER</option>
                    <option value="OTHER" className="bg-[#0e1e2d]">OTHER</option>
                  </select>
                </div>
              )}

              {editingEvent.type === 'CARD' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Card Type</label>
                  <select
                    value={formCardType}
                    onChange={(e) => setFormCardType(e.target.value as CardType)}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  >
                    <option value="YELLOW" className="bg-[#0e1e2d]">Yellow</option>
                    <option value="SECOND_YELLOW" className="bg-[#0e1e2d]">Second Yellow</option>
                    <option value="RED" className="bg-[#0e1e2d]">Direct Red</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={formMinute}
                    onChange={(e) => setFormMinute(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Period</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as Period)}
                    className="w-full p-2.5 rounded-md bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] text-white font-bold text-xs outline-none transition-colors"
                  >
                    <option value="FIRST_HALF" className="bg-[#0e1e2d]">First Half</option>
                    <option value="HALF_TIME" className="bg-[#0e1e2d]">Half Time</option>
                    <option value="SECOND_HALF" className="bg-[#0e1e2d]">Second Half</option>
                    <option value="FULL_TIME" className="bg-[#0e1e2d]">Full Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#0b1522] border-t border-[#14263b] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitUpdateEvent}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM NORMAL RESULT (PIPELINE A) WITH ELECTRONIC SIGNATURE PAD */}
      {isConfirmNormalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-xl bg-[#0e1e2d] border border-[#1a2e45] text-white shadow-2xl overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 bg-[#0b1522] border-b border-[#14263b] flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-white">
                <Trophy className="w-4 h-4 text-[#ff0046]" /> Official Result Verification & Signature
              </div>
              <button onClick={() => setIsConfirmNormalModalOpen(false)} className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-slate-400 font-medium">
                Please verify all reconciliation criteria and provide the match official electronic signature before committing permanent match outcome:
              </p>

              {/* Verification Checklist */}
              <div className="space-y-2 bg-[#0e1c2b] p-3.5 rounded-md border border-[#1a2e45]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase text-[10px] font-black tracking-wider">Final Score:</span>
                  <strong className="font-mono text-[#00b04f] font-black text-sm">{derivedHomeScore} - {derivedAwayScore}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase text-[10px] font-black tracking-wider">Active Goals Scored:</span>
                  <strong className="text-white font-bold">{goalsList.length}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase text-[10px] font-black tracking-wider">Cards Issued:</span>
                  <strong className="text-white font-bold">{cardsList.length}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase text-[10px] font-black tracking-wider">Squad Player Attributions:</span>
                  <strong className={isReadyForNormalFinalize ? 'text-[#00b04f] font-bold' : 'text-amber-400 font-bold'}>
                    {isReadyForNormalFinalize ? 'All Verified' : 'Check Unresolved Players'}
                  </strong>
                </div>
              </div>

              {/* ELECTRONIC SIGNATURE PAD */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-[#ff0046]" /> Match Official Sign-Off (Electronic Signature)
                  </label>
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-[#ff0046] bg-[#ff0046]/10 border border-[#ff0046]/30 hover:bg-[#ff0046]/20 transition-colors cursor-pointer"
                  >
                    Clear Signature
                  </button>
                </div>
                <div className="relative rounded-md border border-[#223b56] bg-[#15273b] overflow-hidden">
                  <canvas
                    ref={signatureCanvasRef}
                    width={460}
                    height={110}
                    className="w-full h-[110px] cursor-crosshair touch-none bg-[#15273b]"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawingTouch}
                    onTouchMove={drawTouch}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 text-xs font-bold uppercase tracking-wider opacity-60">
                      Sign with mouse or stylus here
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  By signing and committing, you certify under FKF regulations that this reconciliation report accurately reflects the events of the match.
                </p>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#0b1522] border-t border-[#14263b] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsConfirmNormalModalOpen(false)}
                className="px-4 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNormal}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs cursor-pointer flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Commit Canonical Result
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DECLARE WALKOVER (PIPELINE B) */}
      {isWalkoverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl bg-[#0e1e2d] border border-[#1a2e45] text-white shadow-2xl overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 bg-[#0b1522] border-b border-[#14263b] flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400 font-black text-sm uppercase tracking-wider">
                <Ban className="w-4 h-4 text-purple-400" /> Award Official 3-0 Walkover
              </div>
              <button onClick={() => setIsWalkoverModalOpen(false)} className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-xs text-slate-400 font-medium">
                Select the team receiving the 3-0 administrative victory. All existing live events will be discarded from permanent history.
              </p>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Award Victory To:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkoverWinnerUid(homeTeamUid)}
                    className={`p-3 rounded-md font-black uppercase text-xs tracking-wider border text-center transition-all cursor-pointer ${
                      walkoverWinnerUid === homeTeamUid
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-[#152a40] text-slate-300 border-[#223b56] hover:bg-[#1c3857]'
                    }`}
                  >
                    {selectedFixture.teamA.name} (3 - 0)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkoverWinnerUid(awayTeamUid)}
                    className={`p-3 rounded-md font-black uppercase text-xs tracking-wider border text-center transition-all cursor-pointer ${
                      walkoverWinnerUid === awayTeamUid
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-[#152a40] text-slate-300 border-[#223b56] hover:bg-[#1c3857]'
                    }`}
                  >
                    {selectedFixture.teamB.name} (0 - 3)
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#0b1522] border-t border-[#14263b] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsWalkoverModalOpen(false)}
                className="px-4 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclareWalkover}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-xs tracking-wider shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                Commit Walkover Outcome
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CANCEL MATCH (PIPELINE C) */}
      {isCancelMatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full p-6 rounded-xl bg-[#0e1e2d] border border-[#1a2e45] text-white space-y-4 shadow-2xl text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/30">
              <XOctagon className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm uppercase tracking-wider text-white">Confirm Match Cancellation?</h3>
            <p className="text-xs text-slate-400 font-medium">
              The match will be permanently cancelled at 0-0 with zero events credited. This terminal action is final.
            </p>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setIsCancelMatchModalOpen(false)}
                className="px-4 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
              >
                Abort
              </button>
              <button
                onClick={handleCancelMatch}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CLEAR WORKING SET */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full p-6 rounded-xl bg-[#0e1e2d] border border-[#1a2e45] text-white space-y-4 shadow-2xl text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm uppercase tracking-wider text-white">Clear Working Set Events?</h3>
            <p className="text-xs text-slate-400 font-medium">
              All currently active working set events will be cancelled and scores reset back to 0-0.
            </p>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
              >
                Keep Events
              </button>
              <button
                onClick={handleClearAll}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer transition-colors disabled:opacity-50"
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
