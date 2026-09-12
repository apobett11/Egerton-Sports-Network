import React, { useState, useMemo, useEffect } from 'react';
import {
  X, Trophy, CheckCircle2, AlertTriangle, Plus, Trash2,
  ArrowRight, ShieldCheck, ShieldAlert, Flag, Minus
} from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { formatMatchTime, formatMatchPitch } from '../../../../../lib/matchdayHelper';
import type { Match, MatchStatus } from '../../../../../types';
import type { GoalEntry, CardEntry, InjuryEntry } from '../../types';
import { EPL_COMP_ID, CHAMP_COMP_ID } from '../../../../../services/potwService';

export interface RecordedEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'substitution';
  goalType?: 'open_play' | 'penalty' | 'free_kick' | 'own_goal';
  teamTarget: 'home' | 'away';
  teamName: string;
  playerId: string;
  playerName: string;
  jerseyNumber?: number | '';
  subPlayerInId?: string;
  subPlayerInName?: string;
  dbId?: string;
}

export interface PlayerRosterItem {
  id: string;
  name: string;
  jerseyNumber?: number;
  isSub?: boolean;
  position?: string;
}

export interface MotmNominationData {
  playerId: string;
  teamId: string;
  competitionId?: string;
  playerName?: string;
  jerseyNumber?: number;
}

interface EndMatchModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (data: {
    scoreHome: number;
    scoreAway: number;
    matchState: MatchStatus;
    goals: GoalEntry[];
    cards: CardEntry[];
    injuries: InjuryEntry[];
    motmNomination?: MotmNominationData;
  }) => Promise<void>;
  onAwardWalkover?: (fixtureId: string, winningTeamTarget: 'home' | 'away') => Promise<void>;
  onCancelMatch?: (fixtureId: string) => Promise<void>;
  isSubmitting: boolean;
  homeSquad?: PlayerRosterItem[];
  awaySquad?: PlayerRosterItem[];
}

// ─── Team Event State ────────────────────────────────────────────────────────
interface TeamEventState {
  goalCount: number;
  goalScorers: string[]; // jersey numbers as strings
  yellowCards: string[]; // jersey numbers
  redCards: string[];    // jersey numbers
}

const emptyTeamState = (): TeamEventState => ({
  goalCount: 0,
  goalScorers: [],
  yellowCards: [],
  redCards: [],
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isValidUuid = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

const resolvePlayerFromSquad = (jerseyStr: string, squad: PlayerRosterItem[]) => {
  const num = parseInt(jerseyStr, 10);
  if (isNaN(num)) return null;
  return squad.find((p) => p.jerseyNumber === num) || null;
};

type ModalStep = 'type-select' | 'team-a' | 'team-b' | 'confirm' | 'walkover';

// ─── Main Component ───────────────────────────────────────────────────────────
export const EndMatchModal: React.FC<EndMatchModalProps> = ({
  match,
  isOpen,
  onClose,
  onSubmitReport,
  onAwardWalkover,
  isSubmitting,
  homeSquad = [],
  awaySquad = [],
}) => {
  const [step, setStep] = useState<ModalStep>('type-select');
  const [teamAState, setTeamAState] = useState<TeamEventState>(emptyTeamState());
  const [teamBState, setTeamBState] = useState<TeamEventState>(emptyTeamState());
  const [walkoverWinner, setWalkoverWinner] = useState<'home' | 'away'>('home');
  const [isLocallySubmitting, setIsLocallySubmitting] = useState(false);

  // Squads
  const [fetchedHomeSquad, setFetchedHomeSquad] = useState<PlayerRosterItem[]>([]);
  const [fetchedAwaySquad, setFetchedAwaySquad] = useState<PlayerRosterItem[]>([]);

  const isMatchLocked =
    match.status === 'FT' ||
    (match.status as any) === 'WALKOVER' ||
    Boolean((match as any).stats_processed);

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep('type-select');
      setTeamAState(emptyTeamState());
      setTeamBState(emptyTeamState());
      setWalkoverWinner('home');
      setIsLocallySubmitting(false);
    }
  }, [isOpen, match.id]);

  // Pre-fetch rosters
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadRosters() {
      try {
        const homeId = match.teamA.id;
        const awayId = match.teamB.id;
        const { data: lineups } = await supabase
          .from('match_lineups')
          .select('*')
          .eq('fixture_id', match.id);
        if (!isMounted || !lineups?.length) return;
        const homeL = lineups.find((l: any) => l.team_id === homeId);
        const awayL = lineups.find((l: any) => l.team_id === awayId);
        const mapPlayer = (p: any, isSub: boolean): PlayerRosterItem => ({
          id: p.id || p.player_id || `${isSub ? 'sub' : 'xi'}_${p.jersey_number || p.number}`,
          name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `#${p.jersey_number || p.number}`,
          jerseyNumber: p.jersey_number || p.number || 0,
          position: p.position || (isSub ? 'SUB' : 'FWD'),
          isSub,
        });
        if (homeL) {
          setFetchedHomeSquad([
            ...(homeL.starting_xi || []).map((p: any) => mapPlayer(p, false)),
            ...(homeL.substitutes || []).map((p: any) => mapPlayer(p, true)),
          ]);
        }
        if (awayL) {
          setFetchedAwaySquad([
            ...(awayL.starting_xi || []).map((p: any) => mapPlayer(p, false)),
            ...(awayL.substitutes || []).map((p: any) => mapPlayer(p, true)),
          ]);
        }
      } catch { /* non-blocking */ }
    }
    loadRosters();
    return () => { isMounted = false; };
  }, [isOpen, match.id, match.teamA.id, match.teamB.id]);

  const resolvedHomeSquad = useMemo(() =>
    fetchedHomeSquad.length ? fetchedHomeSquad : homeSquad,
  [fetchedHomeSquad, homeSquad]);

  const resolvedAwaySquad = useMemo(() =>
    fetchedAwaySquad.length ? fetchedAwaySquad : awaySquad,
  [fetchedAwaySquad, awaySquad]);

  // ── Build events from team states for submission ──────────────────────────
  const buildEvents = (): RecordedEvent[] => {
    const evts: RecordedEvent[] = [];
    const DUMMY_MINUTE = 1;

    const addTeamEvents = (
      state: TeamEventState,
      teamTarget: 'home' | 'away',
      teamName: string,
      squad: PlayerRosterItem[],
    ) => {
      // Goals
      state.goalScorers.forEach((jerseyStr, i) => {
        const player = resolvePlayerFromSquad(jerseyStr, squad);
        const jerseyNum = parseInt(jerseyStr, 10);
        evts.push({
          id: `evt_g_${teamTarget}_${i}_${Date.now()}`,
          minute: DUMMY_MINUTE,
          type: 'goal',
          goalType: 'open_play',
          teamTarget,
          teamName,
          playerId: player && isValidUuid(player.id) ? player.id : '',
          playerName: player?.name || (jerseyStr ? `Player #${jerseyStr}` : 'Player'),
          jerseyNumber: isNaN(jerseyNum) ? '' : jerseyNum,
        });
      });
      // Yellow cards
      state.yellowCards.forEach((jerseyStr, i) => {
        const player = resolvePlayerFromSquad(jerseyStr, squad);
        const jerseyNum = parseInt(jerseyStr, 10);
        evts.push({
          id: `evt_y_${teamTarget}_${i}_${Date.now()}`,
          minute: DUMMY_MINUTE,
          type: 'yellow',
          teamTarget,
          teamName,
          playerId: player && isValidUuid(player.id) ? player.id : '',
          playerName: player?.name || (jerseyStr ? `Player #${jerseyStr}` : 'Player'),
          jerseyNumber: isNaN(jerseyNum) ? '' : jerseyNum,
        });
      });
      // Red cards
      state.redCards.forEach((jerseyStr, i) => {
        const player = resolvePlayerFromSquad(jerseyStr, squad);
        const jerseyNum = parseInt(jerseyStr, 10);
        evts.push({
          id: `evt_r_${teamTarget}_${i}_${Date.now()}`,
          minute: DUMMY_MINUTE,
          type: 'red',
          teamTarget,
          teamName,
          playerId: player && isValidUuid(player.id) ? player.id : '',
          playerName: player?.name || (jerseyStr ? `Player #${jerseyStr}` : 'Player'),
          jerseyNumber: isNaN(jerseyNum) ? '' : jerseyNum,
        });
      });
    };

    addTeamEvents(teamAState, 'home', match.teamA.name, resolvedHomeSquad);
    addTeamEvents(teamBState, 'away', match.teamB.name, resolvedAwaySquad);
    return evts;
  };

  const scoreA = teamAState.goalCount;
  const scoreB = teamBState.goalCount;

  // ── Submit FT ─────────────────────────────────────────────────────────────
  const handleConfirmFT = async () => {
    if (isSubmitting || isLocallySubmitting || isMatchLocked) return;
    setIsLocallySubmitting(true);
    try {
      const allEvents = buildEvents();
      const goals: GoalEntry[] = allEvents
        .filter((e) => e.type === 'goal')
        .map((g) => ({
          id: g.id,
          teamTarget: g.teamTarget,
          minute: g.minute,
          jerseyNumber: g.jerseyNumber ?? '',
          playerId: isValidUuid(g.playerId) ? g.playerId : undefined,
          playerName: g.playerName,
          goalType: 'normal',
        }));
      const cards: CardEntry[] = allEvents
        .filter((e) => e.type === 'yellow' || e.type === 'red')
        .map((c) => ({
          id: c.id,
          teamTarget: c.teamTarget,
          minute: c.minute,
          jerseyNumber: c.jerseyNumber ?? '',
          playerId: isValidUuid(c.playerId) ? c.playerId : undefined,
          playerName: c.playerName,
          cardType: c.type === 'yellow' ? 'yellow' : 'red',
        }));
      onClose();
      const compId =
        (match as any).competitionId ||
        (match as any).competition_id ||
        (match.league?.toLowerCase().includes('champ') ? CHAMP_COMP_ID : EPL_COMP_ID);
      await onSubmitReport({
        scoreHome: scoreA,
        scoreAway: scoreB,
        matchState: 'FT',
        goals,
        cards,
        injuries: [],
      });
    } catch (err) {
      console.error('Submit match report error:', err);
    } finally {
      setIsLocallySubmitting(false);
    }
  };

  // ── Submit Walkover ────────────────────────────────────────────────────────
  const handleConfirmWalkover = async () => {
    if (isSubmitting || isLocallySubmitting || isMatchLocked || !onAwardWalkover) return;
    setIsLocallySubmitting(true);
    try {
      await onAwardWalkover(match.id, walkoverWinner);
      onClose();
    } catch (err) {
      console.error('Walkover error:', err);
    } finally {
      setIsLocallySubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-[#090f17] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto text-white flex flex-col max-h-[96vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── TOP BAR ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#070c13] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                End Match Portal
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {match.teamA.name} vs {match.teamB.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── MATCH HEADER STRIP ─────────────────────────────────────────── */}
        <div className="px-5 py-3 bg-[#070c13] border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <img src={match.teamA.logo} alt={match.teamA.name} className="w-7 h-7 rounded-full object-contain bg-black/40 p-0.5 shrink-0 border border-white/10" />
              <span className="font-black text-xs uppercase text-white truncate">{match.teamA.name}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-emerald-500/30 shrink-0">
              <span className="text-base font-mono font-black text-emerald-400">{scoreA}</span>
              <span className="text-xs text-slate-500">—</span>
              <span className="text-base font-mono font-black text-emerald-400">{scoreB}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <span className="font-black text-xs uppercase text-white truncate">{match.teamB.name}</span>
              <img src={match.teamB.logo} alt={match.teamB.name} className="w-7 h-7 rounded-full object-contain bg-black/40 p-0.5 shrink-0 border border-white/10" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-1.5 text-[10px] text-slate-400">
            <span>{formatMatchPitch(match.venue) || match.venue || 'Main Stadium'}</span>
            <span>·</span>
            <span>KO: {formatMatchTime(match.scheduledTime || match.time)}</span>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ════════════════════════════════════════════════════════════════
              STEP: TYPE SELECT
          ════════════════════════════════════════════════════════════════ */}
          {step === 'type-select' && (
            <div className="p-5 space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  How did the match end?
                </h3>
                <p className="text-[11px] text-slate-400">Choose the match outcome to proceed.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Normal End */}
                <button
                  type="button"
                  onClick={() => setStep('team-a')}
                  disabled={isMatchLocked}
                  className="group p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] hover:border-emerald-400 text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <span className="text-xl">⚽</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm text-white uppercase tracking-wider">Normal Match End</p>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">Full Time (FT) — enter goals &amp; cards for each team</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-emerald-400 ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* Walkover */}
                <button
                  type="button"
                  onClick={() => setStep('walkover')}
                  disabled={isMatchLocked || !onAwardWalkover}
                  className="group p-4 rounded-2xl border-2 border-amber-500/30 bg-amber-500/[0.05] hover:bg-amber-500/[0.10] hover:border-amber-400 text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Flag className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm text-white uppercase tracking-wider">Walkover</p>
                      <p className="text-[11px] text-amber-400 font-semibold mt-0.5">Team failed to appear — award 3-0 victory</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-amber-400 ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>

              {isMatchLocked && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>This match result is already locked (FT / Walkover).</span>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP: TEAM A EVENTS
          ════════════════════════════════════════════════════════════════ */}
          {step === 'team-a' && (
            <TeamEventPanel
              teamName={match.teamA.name}
              teamLogo={match.teamA.logo}
              teamLabel="Team A (Home)"
              stepBadge="Step 1 of 2"
              accentColor="emerald"
              state={teamAState}
              onChange={setTeamAState}
              onConfirm={() => setStep('team-b')}
              onBack={() => setStep('type-select')}
            />
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP: TEAM B EVENTS
          ════════════════════════════════════════════════════════════════ */}
          {step === 'team-b' && (
            <TeamEventPanel
              teamName={match.teamB.name}
              teamLogo={match.teamB.logo}
              teamLabel="Team B (Away)"
              stepBadge="Step 2 of 2"
              accentColor="blue"
              state={teamBState}
              onChange={setTeamBState}
              onConfirm={() => setStep('confirm')}
              onBack={() => setStep('team-a')}
            />
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP: CONFIRM RESULTS
          ════════════════════════════════════════════════════════════════ */}
          {step === 'confirm' && (
            <ConfirmResultsPanel
              match={match}
              scoreA={scoreA}
              scoreB={scoreB}
              teamAState={teamAState}
              teamBState={teamBState}
              isSubmitting={isSubmitting || isLocallySubmitting}
              onBack={() => setStep('team-b')}
              onConfirm={handleConfirmFT}
            />
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP: WALKOVER
          ════════════════════════════════════════════════════════════════ */}
          {step === 'walkover' && (
            <WalkoverPanel
              match={match}
              winner={walkoverWinner}
              onChangeWinner={setWalkoverWinner}
              isMatchLocked={isMatchLocked}
              isSubmitting={isSubmitting || isLocallySubmitting}
              onBack={() => setStep('type-select')}
              onConfirm={handleConfirmWalkover}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TeamEventPanel — collect goals / yellow / red for one team
// ─────────────────────────────────────────────────────────────────────────────
interface TeamEventPanelProps {
  teamName: string;
  teamLogo: string;
  teamLabel: string;
  stepBadge: string;
  accentColor: 'emerald' | 'blue';
  state: TeamEventState;
  onChange: (s: TeamEventState) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const TeamEventPanel: React.FC<TeamEventPanelProps> = ({
  teamName, teamLogo, teamLabel, stepBadge, accentColor,
  state, onChange, onConfirm, onBack,
}) => {
  const accent = accentColor === 'emerald'
    ? { border: 'border-emerald-400', ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
    : { border: 'border-blue-400', ring: 'ring-blue-500/20', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };

  const setGoalCount = (n: number) => {
    const clamped = Math.max(0, n);
    const scorers = [...state.goalScorers];
    while (scorers.length < clamped) scorers.push('');
    onChange({ ...state, goalCount: clamped, goalScorers: scorers.slice(0, clamped) });
  };

  const setScorer = (idx: number, val: string) => {
    const scorers = [...state.goalScorers];
    scorers[idx] = val;
    onChange({ ...state, goalScorers: scorers });
  };

  const addCard = (type: 'yellow' | 'red') => {
    if (type === 'yellow') onChange({ ...state, yellowCards: [...state.yellowCards, ''] });
    else onChange({ ...state, redCards: [...state.redCards, ''] });
  };

  const setCard = (type: 'yellow' | 'red', idx: number, val: string) => {
    if (type === 'yellow') {
      const arr = [...state.yellowCards]; arr[idx] = val;
      onChange({ ...state, yellowCards: arr });
    } else {
      const arr = [...state.redCards]; arr[idx] = val;
      onChange({ ...state, redCards: arr });
    }
  };

  const removeCard = (type: 'yellow' | 'red', idx: number) => {
    if (type === 'yellow') onChange({ ...state, yellowCards: state.yellowCards.filter((_, i) => i !== idx) });
    else onChange({ ...state, redCards: state.redCards.filter((_, i) => i !== idx) });
  };

  return (
    <div className="p-5 space-y-5">
      {/* Team header */}
      <div className={`flex items-center gap-3 p-3 rounded-2xl ${accent.bg} border ${accent.border}/40`}>
        <img src={teamLogo} alt={teamName} className="w-10 h-10 rounded-full object-contain bg-black/40 p-0.5 shrink-0 border border-white/10" />
        <div className="min-w-0">
          <span className={`text-[10px] font-black uppercase tracking-widest ${accent.text}`}>{stepBadge} · {teamLabel}</span>
          <h3 className="font-black text-sm uppercase text-white truncate">{teamName}</h3>
        </div>
        <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${accent.badge}`}>{stepBadge}</span>
      </div>

      {/* ── Goals section ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span>⚽</span> Goals Scored
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGoalCount(state.goalCount - 1)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-mono font-black text-lg text-white">{state.goalCount}</span>
            <button
              type="button"
              onClick={() => setGoalCount(state.goalCount + 1)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {state.goalCount > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Scorer jersey numbers ({state.goalCount} goal{state.goalCount > 1 ? 's' : ''})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: state.goalCount }).map((_, i) => (
                <div key={i} className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 select-none">#{i + 1}</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={state.goalScorers[i] ?? ''}
                    onChange={(e) => setScorer(i, e.target.value)}
                    placeholder="No."
                    className="w-full pl-8 pr-2 py-2.5 rounded-xl bg-black/60 border border-white/20 font-mono text-sm font-bold text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">Enter jersey number for each scorer. Leave blank if unknown.</p>
          </div>
        )}
      </div>

      {/* ── Yellow Cards section ──────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span>🟨</span> Yellow Cards
          </label>
          <button
            type="button"
            onClick={() => addCard('yellow')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider hover:bg-amber-500/25 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        {state.yellowCards.length === 0 && (
          <p className="text-[10px] text-slate-500 italic">No yellow cards. Tap "Add" to add one.</p>
        )}
        {state.yellowCards.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="99"
              value={val}
              onChange={(e) => setCard('yellow', i, e.target.value)}
              placeholder="Jersey No."
              className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 font-mono text-sm font-bold text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeCard('yellow', i)}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Red Cards section ─────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span>🟥</span> Red Cards
          </label>
          <button
            type="button"
            onClick={() => addCard('red')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/25 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        {state.redCards.length === 0 && (
          <p className="text-[10px] text-slate-500 italic">No red cards. Tap "Add" to add one.</p>
        )}
        {state.redCards.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="99"
              value={val}
              onChange={(e) => setCard('red', i, e.target.value)}
              placeholder="Jersey No."
              className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-red-500/30 font-mono text-sm font-bold text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeCard('red', i)}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Actions ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase transition-colors cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 ${
            accentColor === 'emerald'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/25'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white shadow-lg shadow-blue-500/25'
          }`}
        >
          <span>Confirm {teamLabel.split(' ')[0]} {teamLabel.split(' ')[1]}</span>
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmResultsPanel — final review before submission
// ─────────────────────────────────────────────────────────────────────────────
interface ConfirmResultsPanelProps {
  match: Match;
  scoreA: number;
  scoreB: number;
  teamAState: TeamEventState;
  teamBState: TeamEventState;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

const ConfirmResultsPanel: React.FC<ConfirmResultsPanelProps> = ({
  match, scoreA, scoreB, teamAState, teamBState, isSubmitting, onBack, onConfirm,
}) => {
  const totalEvents =
    teamAState.goalScorers.length + teamAState.yellowCards.length + teamAState.redCards.length +
    teamBState.goalScorers.length + teamBState.yellowCards.length + teamBState.redCards.length;

  return (
    <div className="p-5 space-y-5">
      <div className="text-center space-y-1">
        <h3 className="font-black text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Confirm Results
        </h3>
        <p className="text-[11px] text-slate-400">Review the match summary below, then confirm to finalize.</p>
      </div>

      {/* Score */}
      <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 text-center space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Score — Full Time</span>
        <div className="flex items-center justify-center gap-3 font-mono font-black text-2xl text-white">
          <span className="text-slate-200 text-base truncate max-w-[100px]">{match.teamA.name}</span>
          <span className="px-4 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-2xl">
            {scoreA} — {scoreB}
          </span>
          <span className="text-slate-200 text-base truncate max-w-[100px]">{match.teamB.name}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
          Match Events ({totalEvents})
        </span>

        {totalEvents === 0 ? (
          <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-white/[0.02] border border-white/5">
            No events recorded. Match will be finalized as 0 — 0.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {/* Team A events */}
            {(teamAState.goalScorers.length + teamAState.yellowCards.length + teamAState.redCards.length) > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">{match.teamA.name}</span>
                {teamAState.goalScorers.map((j, i) => (
                  <div key={`ag${i}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
                    <span>⚽</span>
                    <span className="font-bold text-white">Goal</span>
                    {j && <span className="text-slate-400">— Jersey #{j}</span>}
                  </div>
                ))}
                {teamAState.yellowCards.map((j, i) => (
                  <div key={`ay${i}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
                    <span>🟨</span>
                    <span className="font-bold text-white">Yellow Card</span>
                    {j && <span className="text-slate-400">— Jersey #{j}</span>}
                  </div>
                ))}
                {teamAState.redCards.map((j, i) => (
                  <div key={`ar${i}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
                    <span>🟥</span>
                    <span className="font-bold text-white">Red Card</span>
                    {j && <span className="text-slate-400">— Jersey #{j}</span>}
                  </div>
                ))}
              </div>
            )}
            {/* Team B events */}
            {(teamBState.goalScorers.length + teamBState.yellowCards.length + teamBState.redCards.length) > 0 && (
              <div className="space-y-1 mt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">{match.teamB.name}</span>
                {teamBState.goalScorers.map((j, i) => (
                  <div key={`bg${i}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
                    <span>⚽</span>
                    <span className="font-bold text-white">Goal</span>
                    {j && <span className="text-slate-400">— Jersey #{j}</span>}
                  </div>
                ))}
                {teamBState.yellowCards.map((j, i) => (
                  <div key={`by${i}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
                    <span>🟨</span>
                    <span className="font-bold text-white">Yellow Card</span>
                    {j && <span className="text-slate-400">— Jersey #{j}</span>}
                  </div>
                ))}
                {teamBState.redCards.map((j, i) => (
                  <div key={`br${i}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
                    <span>🟥</span>
                    <span className="font-bold text-white">Red Card</span>
                    {j && <span className="text-slate-400">— Jersey #{j}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>Confirming will instantly finalize this match as Full Time and update the standings. This cannot be undone.</p>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase transition-colors cursor-pointer disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isSubmitting ? 'Finalizing...' : 'Confirm & End Match'}</span>
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// WalkoverPanel — inline walkover flow
// ─────────────────────────────────────────────────────────────────────────────
interface WalkoverPanelProps {
  match: Match;
  winner: 'home' | 'away';
  onChangeWinner: (w: 'home' | 'away') => void;
  isMatchLocked: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

const WalkoverPanel: React.FC<WalkoverPanelProps> = ({
  match, winner, onChangeWinner, isMatchLocked, isSubmitting, onBack, onConfirm,
}) => {
  const winnerName = winner === 'home' ? match.teamA.name : match.teamB.name;
  const loserName = winner === 'home' ? match.teamB.name : match.teamA.name;

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
          <Flag className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-sm uppercase tracking-wider text-white">Walkover</h3>
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Official 3 — 0 Regulatory Decision</p>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-2.5">
          Which team wins the walkover?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['home', 'away'] as const).map((side) => {
            const team = side === 'home' ? match.teamA : match.teamB;
            const isSelected = winner === side;
            return (
              <button
                key={side}
                type="button"
                onClick={() => onChangeWinner(side)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 text-left ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <img src={team.logo} alt={team.name} className="w-10 h-10 rounded-full object-contain bg-black/40 p-0.5 shrink-0 border border-white/10" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">{side === 'home' ? 'Home' : 'Away'}</span>
                  <p className="font-black text-xs uppercase text-white truncate">{team.name}</p>
                  {isSelected && <span className="text-[10px] text-amber-400 font-bold block">Wins 3 — 0 ✓</span>}
                </div>
                <div className="ml-auto shrink-0">
                  {isSelected
                    ? <CheckCircle2 className="w-5 h-5 text-amber-400" />
                    : <div className="w-5 h-5 rounded-full border border-slate-600" />
                  }
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-black/60 border border-amber-500/30 text-center space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outcome Summary</span>
        <div className="flex items-center justify-center gap-3 font-mono font-black text-xl text-white py-1">
          <span className={winner === 'home' ? 'text-amber-400 text-sm' : 'text-slate-400 text-sm'}>{match.teamA.name}</span>
          <span className="px-3 py-0.5 rounded-lg bg-white/10 text-amber-400 text-lg">
            {winner === 'home' ? '3 — 0' : '0 — 3'}
          </span>
          <span className={winner === 'away' ? 'text-amber-400 text-sm' : 'text-slate-400 text-sm'}>{match.teamB.name}</span>
        </div>
        <p className="text-[11px] text-slate-300">
          <strong className="text-white">{winnerName}</strong> gets 3 points. <strong className="text-white">{loserName}</strong> forfeits.
        </p>
      </div>

      {isMatchLocked && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>This match is already finalized. Walkover cannot be awarded.</span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase transition-colors cursor-pointer disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting || isMatchLocked}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          <span>{isSubmitting ? 'Awarding Walkover...' : 'Confirm Walkover (3-0 FT)'}</span>
        </button>
      </div>
    </div>
  );
};

export default EndMatchModal;
