import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, AlertTriangle, Trophy, Plus, Minus,
  ShieldCheck, Flag, ShieldAlert
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

const isValidUuid = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

// ─── Counter widget ───────────────────────────────────────────────────────────
const Counter: React.FC<{
  value: number;
  onChange: (n: number) => void;
  min?: number;
  accentClass?: string;
}> = ({ value, onChange, min = 0, accentClass = 'bg-emerald-500' }) => (
  <div className="flex items-center gap-1.5">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
    >
      <Minus className="w-3.5 h-3.5" />
    </button>
    <span className={`w-8 text-center font-mono font-black text-lg text-white select-none`}>
      {value}
    </span>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
    >
      <Plus className="w-3.5 h-3.5" />
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const EndMatchModal: React.FC<EndMatchModalProps> = ({
  match,
  isOpen,
  onClose,
  onSubmitReport,
  onAwardWalkover,
  isSubmitting,
}) => {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [yellowA, setYellowA] = useState(0);
  const [yellowB, setYellowB] = useState(0);
  const [redA, setRedA] = useState(0);
  const [redB, setRedB] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLocallySubmitting, setIsLocallySubmitting] = useState(false);

  // Walkover state (used when modal is opened via walkover path)
  const [walkoverWinner, setWalkoverWinner] = useState<'home' | 'away'>('home');
  const [isWalkoverMode] = useState(false); // driven by parent — kept for compat

  const isMatchLocked =
    match.status === 'FT' ||
    (match.status as any) === 'WALKOVER' ||
    Boolean((match as any).stats_processed);

  useEffect(() => {
    if (!isOpen) {
      setScoreA(0); setScoreB(0);
      setYellowA(0); setYellowB(0);
      setRedA(0); setRedB(0);
      setIsConfirmOpen(false);
      setIsLocallySubmitting(false);
      setWalkoverWinner('home');
    }
  }, [isOpen, match.id]);

  // Pre-seed scores from existing match data
  useEffect(() => {
    if (isOpen && match.status !== 'UPCOMING') {
      setScoreA(match.scoreA ?? 0);
      setScoreB(match.scoreB ?? 0);
    }
  }, [isOpen, match.id]);

  // ── Build synthetic events from counts ────────────────────────────────────
  const buildPayload = () => {
    const goals: GoalEntry[] = [];
    const cards: CardEntry[] = [];
    const DUMMY_MIN = 1;

    for (let i = 0; i < scoreA; i++) {
      goals.push({ id: `g_a_${i}`, teamTarget: 'home', minute: DUMMY_MIN, jerseyNumber: '', playerName: 'Player', goalType: 'normal' });
    }
    for (let i = 0; i < scoreB; i++) {
      goals.push({ id: `g_b_${i}`, teamTarget: 'away', minute: DUMMY_MIN, jerseyNumber: '', playerName: 'Player', goalType: 'normal' });
    }
    for (let i = 0; i < yellowA; i++) {
      cards.push({ id: `y_a_${i}`, teamTarget: 'home', minute: DUMMY_MIN, jerseyNumber: '', playerName: 'Player', cardType: 'yellow' });
    }
    for (let i = 0; i < yellowB; i++) {
      cards.push({ id: `y_b_${i}`, teamTarget: 'away', minute: DUMMY_MIN, jerseyNumber: '', playerName: 'Player', cardType: 'yellow' });
    }
    for (let i = 0; i < redA; i++) {
      cards.push({ id: `r_a_${i}`, teamTarget: 'home', minute: DUMMY_MIN, jerseyNumber: '', playerName: 'Player', cardType: 'red' });
    }
    for (let i = 0; i < redB; i++) {
      cards.push({ id: `r_b_${i}`, teamTarget: 'away', minute: DUMMY_MIN, jerseyNumber: '', playerName: 'Player', cardType: 'red' });
    }
    return { goals, cards };
  };

  const handleConfirmFT = async () => {
    if (isSubmitting || isLocallySubmitting || isMatchLocked) return;
    setIsLocallySubmitting(true);
    try {
      const { goals, cards } = buildPayload();
      onClose();
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

  if (!isOpen) return null;

  const totalCards = yellowA + yellowB + redA + redB;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-[#090f17] border border-white/10 rounded-3xl shadow-2xl text-white flex flex-col max-h-[96vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#070c13] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">End Match</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {match.league || 'ESN'} · MD {match.matchday || 1}
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

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {isMatchLocked ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-black text-sm text-emerald-400">Result Locked</p>
                <p className="text-xs text-slate-400">This match is already finalized.</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── SCORE ROW ─────────────────────────────────────────────
                  [Home logo] [Home name]  [▲ score ▼]  vs  [▲ score ▼]  [Away name] [Away logo]
              ─────────────────────────────────────────────────────────── */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center mb-3">
                  Final Score
                </p>
                <div className="flex items-center justify-between gap-2">
                  {/* Home team (highlighted) */}
                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0 p-3 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/30">
                    <img
                      src={match.teamA.logo}
                      alt={match.teamA.name}
                      className="w-9 h-9 rounded-full object-contain bg-black/40 p-0.5 border border-white/10 shrink-0"
                    />
                    <span className="font-black text-[11px] uppercase text-emerald-300 truncate max-w-full text-center leading-tight">
                      {match.teamA.name}
                    </span>
                    <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Home</span>
                    <Counter value={scoreA} onChange={setScoreA} />
                  </div>

                  {/* VS divider */}
                  <div className="shrink-0 text-center">
                    <span className="font-mono font-black text-xl text-slate-500">vs</span>
                  </div>

                  {/* Away team */}
                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <img
                      src={match.teamB.logo}
                      alt={match.teamB.name}
                      className="w-9 h-9 rounded-full object-contain bg-black/40 p-0.5 border border-white/10 shrink-0"
                    />
                    <span className="font-black text-[11px] uppercase text-white truncate max-w-full text-center leading-tight">
                      {match.teamB.name}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Away</span>
                    <Counter value={scoreB} onChange={setScoreB} />
                  </div>
                </div>

                {/* Live score preview */}
                <div className="mt-3 flex items-center justify-center gap-3 font-mono font-black text-2xl text-white">
                  <span className="text-emerald-400">{scoreA}</span>
                  <span className="text-slate-500 text-lg">—</span>
                  <span className="text-slate-200">{scoreB}</span>
                </div>
              </div>

              {/* ── CARDS ROW ─────────────────────────────────────────────
                  [Home yellow]  🟨  [Away yellow]
                  [Home red]     🟥  [Away red]
              ─────────────────────────────────────────────────────────── */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                  Cards
                </p>

                {/* Yellow cards */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex justify-end">
                    <Counter value={yellowA} onChange={setYellowA} />
                  </div>
                  <div className="flex items-center justify-center w-12 shrink-0">
                    <span className="text-2xl leading-none">🟨</span>
                  </div>
                  <div className="flex-1 flex justify-start">
                    <Counter value={yellowB} onChange={setYellowB} />
                  </div>
                </div>

                {/* Red cards */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex justify-end">
                    <Counter value={redA} onChange={setRedA} />
                  </div>
                  <div className="flex items-center justify-center w-12 shrink-0">
                    <span className="text-2xl leading-none">🟥</span>
                  </div>
                  <div className="flex-1 flex justify-start">
                    <Counter value={redB} onChange={setRedB} />
                  </div>
                </div>

                {/* Label row */}
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="flex-1 text-right truncate">{match.teamA.shortName || match.teamA.name}</span>
                  <span className="w-12 text-center shrink-0"></span>
                  <span className="flex-1 text-left truncate">{match.teamB.shortName || match.teamB.name}</span>
                </div>
              </div>

              {/* ── Venue / time meta ─────────────────────────────────── */}
              <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500">
                <span>{formatMatchPitch(match.venue) || match.venue || 'Stadium'}</span>
                <span>·</span>
                <span>KO {formatMatchTime(match.scheduledTime || match.time)}</span>
              </div>
            </>
          )}
        </div>

        {/* ── Bottom action bar ────────────────────────────────────────────── */}
        {!isMatchLocked && (
          <div className="px-5 pb-5 pt-3 border-t border-white/10 bg-[#070c13] shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Confirm Results
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            CONFIRM POPUP
        ════════════════════════════════════════════════════════════════════ */}
        {isConfirmOpen && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm animate-fadeIn rounded-3xl"
            onClick={() => setIsConfirmOpen(false)}
          >
            <div
              className="w-full bg-[#0b131e] border border-white/15 rounded-2xl p-5 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">Confirm Results</h3>
                  <p className="text-[10px] text-slate-400">Full Time — this will lock the result.</p>
                </div>
              </div>

              {/* Score summary */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/30 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Final Score</p>
                <div className="flex items-center justify-center gap-3 font-mono font-black text-2xl">
                  <span className="text-emerald-400">{scoreA}</span>
                  <span className="text-slate-500">—</span>
                  <span className="text-white">{scoreB}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {match.teamA.name} vs {match.teamB.name}
                </p>
              </div>

              {/* Cards summary */}
              {totalCards > 0 && (
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {yellowA > 0 && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span>🟨</span>
                      <span className="text-slate-300">{match.teamA.shortName || match.teamA.name}: {yellowA}</span>
                    </div>
                  )}
                  {yellowB > 0 && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span>🟨</span>
                      <span className="text-slate-300">{match.teamB.shortName || match.teamB.name}: {yellowB}</span>
                    </div>
                  )}
                  {redA > 0 && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span>🟥</span>
                      <span className="text-slate-300">{match.teamA.shortName || match.teamA.name}: {redA}</span>
                    </div>
                  )}
                  {redB > 0 && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span>🟥</span>
                      <span className="text-slate-300">{match.teamB.shortName || match.teamB.name}: {redB}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>This will instantly finalize the match and update the standings. Cannot be undone.</p>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isSubmitting || isLocallySubmitting}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase transition-colors cursor-pointer disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFT}
                  disabled={isSubmitting || isLocallySubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting || isLocallySubmitting ? 'Finalizing...' : 'Confirm & End Match'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndMatchModal;
