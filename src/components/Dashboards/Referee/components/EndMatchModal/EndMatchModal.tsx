import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, AlertTriangle, Plus, Minus, ShieldCheck
} from 'lucide-react';
import { formatMatchTime, formatMatchPitch } from '../../../../../lib/matchdayHelper';
import type { Match, MatchStatus } from '../../../../../types';
import type { GoalEntry, CardEntry, InjuryEntry } from '../../types';

// ── Re-exported types (used by other components) ──────────────────────────────
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

// ── Props ─────────────────────────────────────────────────────────────────────
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

// ── Guiding steps ─────────────────────────────────────────────────────────────
// Step 1 = entering scores, Step 2 = entering cards, Step 3 = confirming
type GuideStep = 1 | 2 | 3;

// ── Counter widget ─────────────────────────────────────────────────────────────
const Counter: React.FC<{
  value: number;
  onChange: (n: number) => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => onChange(Math.max(0, value - 1))}
      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 active:scale-95"
    >
      <Minus className="w-3.5 h-3.5" />
    </button>
    <span className="w-8 text-center font-mono font-black text-xl text-white select-none leading-none">
      {value}
    </span>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 active:scale-95"
    >
      <Plus className="w-3.5 h-3.5" />
    </button>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const EndMatchModal: React.FC<EndMatchModalProps> = ({
  match,
  isOpen,
  onClose,
  onSubmitReport,
  isSubmitting,
}) => {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [yellowA, setYellowA] = useState(0);
  const [yellowB, setYellowB] = useState(0);
  const [redA, setRedA] = useState(0);
  const [redB, setRedB] = useState(0);
  const [guideStep, setGuideStep] = useState<GuideStep>(1);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLocallySubmitting, setIsLocallySubmitting] = useState(false);

  const isMatchLocked =
    match.status === 'FT' ||
    (match.status as any) === 'WALKOVER' ||
    Boolean((match as any).stats_processed);

  // Reset when modal closes / match changes
  useEffect(() => {
    if (!isOpen) {
      setScoreA(0); setScoreB(0);
      setYellowA(0); setYellowB(0);
      setRedA(0); setRedB(0);
      setGuideStep(1);
      setIsConfirmOpen(false);
      setIsLocallySubmitting(false);
    }
  }, [isOpen, match.id]);

  // Pre-seed scores from existing match data (if already started)
  useEffect(() => {
    if (isOpen && match.status !== 'UPCOMING') {
      setScoreA(match.scoreA ?? 0);
      setScoreB(match.scoreB ?? 0);
    }
  }, [isOpen, match.id]);

  // ── Build payload — algorithms accept: minute fallback 1, playerName "Player", empty playerId ──
  // Module C player stats only fires when player_id IS NOT NULL — blank entries are safe.
  const buildPayload = () => {
    const goals: GoalEntry[] = [];
    const cards: CardEntry[] = [];

    // Each goal entry: minute defaults to 1 (algorithm uses `|| 1`); no player info needed
    for (let i = 0; i < scoreA; i++) {
      goals.push({ id: `g_a_${i}_${Date.now()}`, teamTarget: 'home', minute: 1, jerseyNumber: '', playerName: 'Player', goalType: 'normal' });
    }
    for (let i = 0; i < scoreB; i++) {
      goals.push({ id: `g_b_${i}_${Date.now()}`, teamTarget: 'away', minute: 1, jerseyNumber: '', playerName: 'Player', goalType: 'normal' });
    }
    for (let i = 0; i < yellowA; i++) {
      cards.push({ id: `y_a_${i}_${Date.now()}`, teamTarget: 'home', minute: 1, jerseyNumber: '', playerName: 'Player', cardType: 'yellow' });
    }
    for (let i = 0; i < yellowB; i++) {
      cards.push({ id: `y_b_${i}_${Date.now()}`, teamTarget: 'away', minute: 1, jerseyNumber: '', playerName: 'Player', cardType: 'yellow' });
    }
    for (let i = 0; i < redA; i++) {
      cards.push({ id: `r_a_${i}_${Date.now()}`, teamTarget: 'home', minute: 1, jerseyNumber: '', playerName: 'Player', cardType: 'red' });
    }
    for (let i = 0; i < redB; i++) {
      cards.push({ id: `r_b_${i}_${Date.now()}`, teamTarget: 'away', minute: 1, jerseyNumber: '', playerName: 'Player', cardType: 'red' });
    }
    return { goals, cards };
  };

  const handleConfirmFT = async () => {
    if (isSubmitting || isLocallySubmitting || isMatchLocked) return;
    setIsLocallySubmitting(true);
    try {
      const { goals, cards } = buildPayload();
      // Close modal first — optimistic UI
      onClose();
      await onSubmitReport({
        scoreHome: scoreA,
        scoreAway: scoreB,
        matchState: 'FT',
        goals,
        cards,
        injuries: [],
        // No MOTM from this simplified flow
      });
    } catch (err) {
      console.error('Submit match report error:', err);
    } finally {
      setIsLocallySubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalCards = yellowA + yellowB + redA + redB;

  // Step labels for guiding block
  const STEPS: { label: string; done: boolean }[] = [
    { label: 'Score', done: guideStep > 1 },
    { label: 'Cards', done: guideStep > 2 },
    { label: 'Confirm', done: false },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-match-title"
    >
      <div
        className="relative w-full max-w-md bg-[#090f17] border border-white/10 rounded-3xl shadow-2xl text-white flex flex-col max-h-[96vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#070c13] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <h2 id="end-match-title" className="text-sm font-black uppercase tracking-wider text-white">End Match</h2>
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

        {/* ── GUIDING BLOCK ────────────────────────────────────────────────── */}
        {!isMatchLocked && (
          <div className="px-5 pt-4 pb-2 shrink-0">
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => {
                const stepNum = (i + 1) as GuideStep;
                const isActive = guideStep === stepNum;
                const isDone = s.done;
                return (
                  <React.Fragment key={s.label}>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                          isDone
                            ? 'bg-emerald-500 text-black'
                            : isActive
                            ? 'bg-emerald-400 text-black ring-4 ring-emerald-400/30'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
                          isDone ? 'text-emerald-400' : isActive ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mb-4 mx-1 transition-colors ${isDone ? 'bg-emerald-500' : 'bg-white/10'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BODY ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3 space-y-5">

          {/* ── LOCKED STATE ───────────────────────────────────────────────── */}
          {isMatchLocked && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mt-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-black text-sm text-emerald-400">Result Locked</p>
                <p className="text-xs text-slate-400">This match is already finalized.</p>
              </div>
            </div>
          )}

          {/* ── STEP 1: SCORE ──────────────────────────────────────────────── */}
          {!isMatchLocked && (
            <div className={`space-y-3 transition-opacity ${guideStep === 1 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                {guideStep === 1 ? '▶ Enter the final score' : 'Score'}
              </p>

              <div className="flex items-stretch gap-3">
                {/* Home */}
                <div className="flex flex-col items-center gap-2 flex-1 p-3 rounded-2xl bg-emerald-500/[0.07] border-2 border-emerald-500/40">
                  <img
                    src={match.teamA.logo}
                    alt={match.teamA.name}
                    className="w-9 h-9 rounded-full object-contain bg-black/40 p-0.5 border border-white/10"
                  />
                  <span className="font-black text-[11px] uppercase text-emerald-300 text-center leading-tight truncate max-w-full">
                    {match.teamA.name}
                  </span>
                  <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Home</span>
                  <Counter value={scoreA} onChange={setScoreA} />
                </div>

                {/* VS */}
                <div className="flex items-center justify-center shrink-0 px-1">
                  <span className="font-mono font-black text-lg text-slate-500">vs</span>
                </div>

                {/* Away */}
                <div className="flex flex-col items-center gap-2 flex-1 p-3 rounded-2xl bg-white/[0.03] border-2 border-white/10">
                  <img
                    src={match.teamB.logo}
                    alt={match.teamB.name}
                    className="w-9 h-9 rounded-full object-contain bg-black/40 p-0.5 border border-white/10"
                  />
                  <span className="font-black text-[11px] uppercase text-white text-center leading-tight truncate max-w-full">
                    {match.teamB.name}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Away</span>
                  <Counter value={scoreB} onChange={setScoreB} />
                </div>
              </div>

              {/* Live preview */}
              <div className="flex items-center justify-center gap-3 font-mono font-black text-3xl">
                <span className="text-emerald-400">{scoreA}</span>
                <span className="text-slate-500 text-2xl">—</span>
                <span className="text-white">{scoreB}</span>
              </div>

              {/* Step 1 CTA */}
              <button
                type="button"
                onClick={() => setGuideStep(2)}
                className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Score set — next: Cards
                <span className="text-emerald-400">→</span>
              </button>
            </div>
          )}

          {/* ── STEP 2: CARDS ──────────────────────────────────────────────── */}
          {!isMatchLocked && (
            <div className={`space-y-3 transition-opacity ${guideStep === 2 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                {guideStep === 2 ? '▶ Enter cards (or leave at 0)' : 'Cards'}
              </p>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-4">
                {/* Team name labels */}
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider">
                  <span className="flex-1 text-right text-emerald-400 truncate">{match.teamA.shortName || match.teamA.name}</span>
                  <span className="w-12 text-center shrink-0 text-slate-500">Card</span>
                  <span className="flex-1 text-left text-slate-300 truncate">{match.teamB.shortName || match.teamB.name}</span>
                </div>

                {/* Yellow cards */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex justify-end">
                    <Counter value={yellowA} onChange={setYellowA} />
                  </div>
                  <div className="w-12 flex items-center justify-center shrink-0">
                    <span className="text-2xl leading-none" role="img" aria-label="Yellow card">🟨</span>
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
                  <div className="w-12 flex items-center justify-center shrink-0">
                    <span className="text-2xl leading-none" role="img" aria-label="Red card">🟥</span>
                  </div>
                  <div className="flex-1 flex justify-start">
                    <Counter value={redB} onChange={setRedB} />
                  </div>
                </div>
              </div>

              {/* Venue / kickoff meta */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
                <span>{formatMatchPitch(match.venue) || match.venue || 'Stadium'}</span>
                <span>·</span>
                <span>KO {formatMatchTime(match.scheduledTime || match.time)}</span>
              </div>

              {/* Step 2 CTA */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGuideStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => { setGuideStep(3); setIsConfirmOpen(true); }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Confirm Results
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── CONFIRM OVERLAY (Step 3) ─────────────────────────────────────── */}
        {isConfirmOpen && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm animate-fadeIn rounded-3xl"
            onClick={() => { setIsConfirmOpen(false); setGuideStep(2); }}
          >
            <div
              className="w-full bg-[#0b131e] border border-white/15 rounded-2xl p-5 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">Confirm Results</h3>
                  <p className="text-[10px] text-slate-400">Full Time — this will lock the result in the database.</p>
                </div>
              </div>

              {/* Score summary */}
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 text-center space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Final Score</p>
                <div className="flex items-center justify-center gap-4 font-mono font-black text-3xl">
                  <span className="text-emerald-400">{scoreA}</span>
                  <span className="text-slate-500 text-2xl">—</span>
                  <span className="text-white">{scoreB}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {match.teamA.name} vs {match.teamB.name}
                </p>
                {scoreA === 0 && scoreB === 0 && (
                  <p className="text-[10px] text-amber-400 font-bold">Goalless draw — will be recorded as 0 — 0</p>
                )}
              </div>

              {/* Cards summary (only if any) */}
              {totalCards > 0 && (
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {yellowA > 0 && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span>🟨</span>
                      <span className="text-slate-300">{match.teamA.shortName || match.teamA.name}: ×{yellowA}</span>
                    </div>
                  )}
                  {yellowB > 0 && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span>🟨</span>
                      <span className="text-slate-300">{match.teamB.shortName || match.teamB.name}: ×{yellowB}</span>
                    </div>
                  )}
                  {redA > 0 && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span>🟥</span>
                      <span className="text-slate-300">{match.teamA.shortName || match.teamA.name}: ×{redA}</span>
                    </div>
                  )}
                  {redB > 0 && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span>🟥</span>
                      <span className="text-slate-300">{match.teamB.shortName || match.teamB.name}: ×{redB}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>This will instantly finalize the match, update league standings, and cannot be undone.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => { setIsConfirmOpen(false); setGuideStep(2); }}
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
