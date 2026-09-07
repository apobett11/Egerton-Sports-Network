import React, { useState, useMemo } from 'react';
import { 
  X, Clock, MapPin, Trophy, ShieldAlert, CheckCircle2, 
  AlertTriangle, Plus, Trash2, ArrowRight, ShieldCheck,
  Ban, CornerUpRight
} from 'lucide-react';
import type { Match, MatchStatus, MatchEventType } from '../../../../../types';
import type { GoalEntry, CardEntry, InjuryEntry } from '../../types';

interface RecordedEvent {
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
  }) => Promise<void>;
  onAwardWalkover: (fixtureId: string, winningTeamTarget: 'home' | 'away') => Promise<void>;
  onCancelMatch: (fixtureId: string) => Promise<void>;
  isSubmitting: boolean;
  homeSquad?: Array<{ id: string; name: string; jerseyNumber?: number }>;
  awaySquad?: Array<{ id: string; name: string; jerseyNumber?: number }>;
}

export const EndMatchModal: React.FC<EndMatchModalProps> = ({
  match,
  isOpen,
  onClose,
  onSubmitReport,
  onAwardWalkover,
  onCancelMatch,
  isSubmitting,
  homeSquad = [],
  awaySquad = [],
}) => {
  if (!isOpen) return null;

  // Recorded Match Events list (used for timeline and report compilation)
  const [events, setEvents] = useState<RecordedEvent[]>([]);

  // STRICT HIERARCHY STATE - ZERO PRESELECTION
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | null>(null);
  const [selectedAction, setSelectedAction] = useState<'goal' | 'yellow' | 'red' | 'substitution' | null>(null);
  const [selectedGoalType, setSelectedGoalType] = useState<'open_play' | 'penalty' | 'free_kick' | 'own_goal' | null>(null);
  const [minuteInput, setMinuteInput] = useState<string>(''); // No default minute!
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(''); // Unlocked only after minute
  const [selectedSubPlayerInId, setSelectedSubPlayerInId] = useState<string>('');

  // Confirmation Prompts
  const [confirmPrompt, setConfirmPrompt] = useState<'FT' | 'WALKOVER' | 'CANCEL' | null>(null);
  const [walkoverWinningTeam, setWalkoverWinningTeam] = useState<'home' | 'away' | null>(null);

  // Dynamic Score calculated from recorded goals
  const calculatedScore = useMemo(() => {
    let homeScore = 0;
    let awayScore = 0;

    events.forEach((evt) => {
      if (evt.type === 'goal') {
        if (evt.goalType === 'own_goal') {
          if (evt.teamTarget === 'home') awayScore++;
          else homeScore++;
        } else {
          if (evt.teamTarget === 'home') homeScore++;
          else awayScore++;
        }
      }
    });

    if (events.length === 0 && match.status !== 'UPCOMING') {
      return { home: match.scoreA ?? 0, away: match.scoreB ?? 0 };
    }
    return { home: homeScore, away: awayScore };
  }, [events, match.scoreA, match.scoreB, match.status]);

  // Squad selection based on currently selected team
  const currentSquad = useMemo(() => {
    if (selectedTeam === 'home') {
      return homeSquad.length > 0
        ? homeSquad
        : Array.from({ length: 11 }, (_, i) => ({
            id: `h_p_${i + 1}`,
            name: `${match.teamA.shortName || 'Home'} Player #${i + 1}`,
            jerseyNumber: i + 1,
          }));
    }
    if (selectedTeam === 'away') {
      return awaySquad.length > 0
        ? awaySquad
        : Array.from({ length: 11 }, (_, i) => ({
            id: `a_p_${i + 1}`,
            name: `${match.teamB.shortName || 'Away'} Player #${i + 1}`,
            jerseyNumber: i + 1,
          }));
    }
    return [];
  }, [selectedTeam, homeSquad, awaySquad, match.teamA.shortName, match.teamB.shortName]);

  // Validate minute: must be integer between 1 and 120
  const parsedMinute = parseInt(minuteInput, 10);
  const isMinuteValid = !isNaN(parsedMinute) && parsedMinute >= 1 && parsedMinute <= 120;

  // Add Event Handler
  const handleAddEvent = () => {
    if (!selectedTeam || !selectedAction || !isMinuteValid || !selectedPlayerId) return;
    if (selectedAction === 'goal' && !selectedGoalType) return;
    if (selectedAction === 'substitution' && !selectedSubPlayerInId) return;

    const primaryPlayer = currentSquad.find((p) => p.id === selectedPlayerId);
    const subInPlayer = currentSquad.find((p) => p.id === selectedSubPlayerInId);

    const newEvent: RecordedEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      minute: parsedMinute,
      type: selectedAction,
      goalType: selectedAction === 'goal' ? selectedGoalType! : undefined,
      teamTarget: selectedTeam,
      teamName: selectedTeam === 'home' ? match.teamA.name : match.teamB.name,
      playerId: selectedPlayerId,
      playerName: primaryPlayer?.name || 'Player',
      jerseyNumber: primaryPlayer?.jerseyNumber || '',
      subPlayerInId: selectedAction === 'substitution' ? selectedSubPlayerInId : undefined,
      subPlayerInName: selectedAction === 'substitution' ? subInPlayer?.name : undefined,
    };

    setEvents((prev) => [...prev, newEvent].sort((a, b) => a.minute - b.minute));

    // Reset hierarchy completely - NO pre-selections
    setSelectedTeam(null);
    setSelectedAction(null);
    setSelectedGoalType(null);
    setMinuteInput('');
    setSelectedPlayerId('');
    setSelectedSubPlayerInId('');
  };

  const handleRemoveEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Submit Final Match Report (Full Time)
  const handleConfirmSubmitFT = async () => {
    const goals: GoalEntry[] = events
      .filter((e) => e.type === 'goal')
      .map((g) => ({
        id: g.id,
        teamTarget: g.teamTarget,
        minute: g.minute,
        jerseyNumber: g.jerseyNumber ?? '',
        playerId: g.playerId,
        playerName: g.playerName,
        goalType: g.goalType === 'penalty' ? 'penalty' : g.goalType === 'own_goal' ? 'own_goal' : 'normal',
      }));

    const cards: CardEntry[] = events
      .filter((e) => e.type === 'yellow' || e.type === 'red')
      .map((c) => ({
        id: c.id,
        teamTarget: c.teamTarget,
        minute: c.minute,
        jerseyNumber: c.jerseyNumber ?? '',
        playerId: c.playerId,
        playerName: c.playerName,
        cardType: c.type === 'yellow' ? 'yellow' : 'red',
      }));

    await onSubmitReport({
      scoreHome: calculatedScore.home,
      scoreAway: calculatedScore.away,
      matchState: 'FT',
      goals,
      cards,
      injuries: [],
    });

    setConfirmPrompt(null);
    onClose();
  };

  // Submit Walkover (3-0)
  const handleConfirmWalkover = async () => {
    if (!walkoverWinningTeam) return;
    await onAwardWalkover(match.id, walkoverWinningTeam);
    setConfirmPrompt(null);
    onClose();
  };

  // Cancel Match
  const handleConfirmCancel = async () => {
    await onCancelMatch(match.id);
    setConfirmPrompt(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-[#0c1825] border-2 border-slate-300 dark:border-[#1e3857] rounded-lg shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR: Header & Cancel X Button */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-[#182e47] bg-slate-50 dark:bg-[#09131d]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff0046] animate-pulse" />
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Official Match Control • End Match Portal
              </h2>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {match.league || 'Egerton Premier League'} • Matchday {match.matchday || 1}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md border border-slate-300 dark:border-white/10 hover:bg-rose-500 hover:text-white hover:border-rose-500 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            title="Cancel and close end match popup"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE BODY CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* SECTION 1: MATCH DETAILS HEADER (Teams, Crests, Live Score, Venue, Time) */}
          <div className="bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md p-4 space-y-3">
            <div className="grid grid-cols-11 items-center gap-2">
              {/* Home Team */}
              <div className="col-span-4 flex items-center justify-start gap-3 min-w-0">
                <img
                  src={match.teamA.logo}
                  alt={match.teamA.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover bg-white dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-white/10"
                />
                <div className="min-w-0">
                  <h3 className="font-black text-xs sm:text-base uppercase tracking-tight text-slate-900 dark:text-white truncate">
                    {match.teamA.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Home Team
                  </span>
                </div>
              </div>

              {/* Digital Scoreboard */}
              <div className="col-span-3 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-2 text-2xl sm:text-4xl font-mono font-black tracking-tight text-[#ff0046]">
                  <span>{calculatedScore.home}</span>
                  <span className="text-slate-400 font-sans text-xl sm:text-2xl">-</span>
                  <span>{calculatedScore.away}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mt-1">
                  Official Full Time Target
                </span>
              </div>

              {/* Away Team */}
              <div className="col-span-4 flex items-center justify-end gap-3 min-w-0 text-right">
                <div className="min-w-0">
                  <h3 className="font-black text-xs sm:text-base uppercase tracking-tight text-slate-900 dark:text-white truncate">
                    {match.teamB.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Away Team
                  </span>
                </div>
                <img
                  src={match.teamB.logo}
                  alt={match.teamB.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover bg-white dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-white/10"
                />
              </div>
            </div>

            {/* Venue & Time Meta Strip */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-[#14263b] pt-2.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="text-[11px] font-bold truncate">
                  Venue: <span className="text-slate-800 dark:text-slate-200">{match.venue || 'Egerton Sports Ground'}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5 text-[#00b04f]" />
                <span className="text-[11px] font-bold">
                  Scheduled: <span className="text-slate-800 dark:text-slate-200">{match.time || '16:00'} EAT</span>
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: BEAUTIFUL NON-SCROLLING TIMELINE RIBBON */}
          <div className="bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#ff0046]" /> Match Timeline (0' — 90'+)
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {events.length} {events.length === 1 ? 'Event' : 'Events'} Recorded
              </span>
            </div>

            {/* Non-scrolling sleek horizontal timeline bar */}
            <div className="relative pt-6 pb-2 px-3">
              <div className="relative h-2 w-full bg-slate-200 dark:bg-[#18314e] rounded-full">
                {/* 45' Half-Time Divider */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-400 dark:bg-slate-500" />
                {/* 90' Full-Time Marker */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-400 dark:bg-slate-500" />

                {/* Event Markers placed along the track */}
                {events.map((evt) => {
                  const percent = Math.min(100, Math.max(0, (evt.minute / 90) * 100));
                  return (
                    <div
                      key={evt.id}
                      style={{ left: `${percent}%` }}
                      className="absolute -top-3.5 -translate-x-1/2 group cursor-pointer"
                      title={`${evt.minute}' ${evt.type.toUpperCase()}: ${evt.playerName} (${evt.teamName})`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 shadow-xs transition-transform group-hover:scale-125 ${
                        evt.type === 'goal'
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : evt.type === 'yellow'
                          ? 'bg-amber-400 text-slate-900 border-amber-500'
                          : evt.type === 'red'
                          ? 'bg-rose-500 text-white border-rose-600'
                          : 'bg-sky-500 text-white border-sky-600'
                      }`}>
                        {evt.type === 'goal' ? '⚽' : evt.type === 'yellow' ? '🟨' : evt.type === 'red' ? '🟥' : '🔄'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time tick labels under the bar */}
              <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-2 px-0.5">
                <span>0'</span>
                <span>15'</span>
                <span>30'</span>
                <span className="font-black text-slate-600 dark:text-slate-300">45' (HT)</span>
                <span>60'</span>
                <span>75'</span>
                <span className="font-black text-[#ff0046]">90'+ (FT)</span>
              </div>
            </div>

            {/* Event Chips Strip */}
            {events.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white dark:bg-[#0c1825] border border-slate-200 dark:border-[#1e3857] text-xs shadow-2xs"
                  >
                    <span className="font-black font-mono text-[#ff0046]">{evt.minute}'</span>
                    <span className="text-[11px]">
                      {evt.type === 'goal' ? '⚽ Goal' : evt.type === 'yellow' ? '🟨 Caution' : evt.type === 'red' ? '🟥 Red Card' : '🔄 Sub'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {evt.playerName}
                    </span>
                    <span className="text-[10px] text-slate-400">({evt.teamTarget === 'home' ? match.teamA.shortName : match.teamB.shortName})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvent(evt.id)}
                      className="ml-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Remove event"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center py-1">
                No events recorded yet. Follow the hierarchy below to deliberately log goals, cards, and substitutions.
              </p>
            )}
          </div>

          {/* SECTION 3: SMART HIERARCHICAL EVENT ENTRY (STRICT: NO PRE-SELECTION) */}
          <div className="bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#14263b] pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#ff0046]" /> Smart Match Event Hierarchy
              </span>
              <span className="text-[10px] font-bold text-amber-500">
                Conscious Decision Mode (No Defaults)
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* STEP 1: TEAM SELECTION (NO PRESELECTION) */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  1. Select Team <span className="text-[#ff0046]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeam('home');
                      setSelectedPlayerId('');
                      setSelectedSubPlayerInId('');
                    }}
                    className={`py-2 px-3 rounded-md border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedTeam === 'home'
                        ? 'bg-[#ff0046]/10 border-[#ff0046] text-[#ff0046] font-black ring-1 ring-[#ff0046]'
                        : 'bg-white dark:bg-[#0c1825] border-slate-200 dark:border-[#1a2e45] hover:border-slate-300 font-bold text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{match.teamA.name} (Home)</span>
                    {selectedTeam === 'home' && <CheckCircle2 className="w-4 h-4 text-[#ff0046]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeam('away');
                      setSelectedPlayerId('');
                      setSelectedSubPlayerInId('');
                    }}
                    className={`py-2 px-3 rounded-md border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedTeam === 'away'
                        ? 'bg-[#ff0046]/10 border-[#ff0046] text-[#ff0046] font-black ring-1 ring-[#ff0046]'
                        : 'bg-white dark:bg-[#0c1825] border-slate-200 dark:border-[#1a2e45] hover:border-slate-300 font-bold text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{match.teamB.name} (Away)</span>
                    {selectedTeam === 'away' && <CheckCircle2 className="w-4 h-4 text-[#ff0046]" />}
                  </button>
                </div>
              </div>

              {/* STEP 2: ACTION / EVENT TYPE (UNLOCKED AFTER TEAM) */}
              <div className={!selectedTeam ? 'opacity-40 pointer-events-none' : ''}>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  2. Select Action Type <span className="text-[#ff0046]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={!selectedTeam}
                    onClick={() => {
                      setSelectedAction('goal');
                      setSelectedGoalType(null);
                    }}
                    className={`py-2 px-3 rounded-md border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedAction === 'goal'
                        ? 'bg-emerald-500 text-white border-emerald-600 font-black ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-[#0c1825] border-slate-200 dark:border-[#1a2e45] text-slate-800 dark:text-slate-200 hover:border-emerald-500/50'
                    }`}
                  >
                    <span>⚽ Goal</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedTeam}
                    onClick={() => {
                      setSelectedAction('yellow');
                      setSelectedGoalType(null);
                    }}
                    className={`py-2 px-3 rounded-md border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedAction === 'yellow'
                        ? 'bg-amber-400 text-slate-900 border-amber-500 font-black ring-1 ring-amber-400'
                        : 'bg-white dark:bg-[#0c1825] border-slate-200 dark:border-[#1a2e45] text-slate-800 dark:text-slate-200 hover:border-amber-400/50'
                    }`}
                  >
                    <span>🟨 Yellow Card</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedTeam}
                    onClick={() => {
                      setSelectedAction('red');
                      setSelectedGoalType(null);
                    }}
                    className={`py-2 px-3 rounded-md border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedAction === 'red'
                        ? 'bg-rose-500 text-white border-rose-600 font-black ring-1 ring-rose-500'
                        : 'bg-white dark:bg-[#0c1825] border-slate-200 dark:border-[#1a2e45] text-slate-800 dark:text-slate-200 hover:border-rose-500/50'
                    }`}
                  >
                    <span>🟥 Red Card</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedTeam}
                    onClick={() => {
                      setSelectedAction('substitution');
                      setSelectedGoalType(null);
                    }}
                    className={`py-2 px-3 rounded-md border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedAction === 'substitution'
                        ? 'bg-sky-500 text-white border-sky-600 font-black ring-1 ring-sky-500'
                        : 'bg-white dark:bg-[#0c1825] border-slate-200 dark:border-[#1a2e45] text-slate-800 dark:text-slate-200 hover:border-sky-500/50'
                    }`}
                  >
                    <span>🔄 Substitution</span>
                  </button>
                </div>
              </div>

              {/* STEP 3: GOAL TYPE (SHOWN ONLY IF ACTION == GOAL) */}
              {selectedAction === 'goal' && (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-md space-y-2 animate-fadeIn">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    3. Select Goal Type <span className="text-[#ff0046]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['open_play', 'penalty', 'free_kick', 'own_goal'] as const).map((gType) => {
                      const labels = {
                        open_play: 'Open Play',
                        penalty: 'Penalty',
                        free_kick: 'Free Kick',
                        own_goal: 'Own Goal',
                      };
                      return (
                        <button
                          key={gType}
                          type="button"
                          onClick={() => setSelectedGoalType(gType)}
                          className={`py-1.5 px-2.5 rounded-md border text-xs font-bold transition-all cursor-pointer ${
                            selectedGoalType === gType
                              ? 'bg-emerald-500 text-white border-emerald-600 font-black'
                              : 'bg-white dark:bg-[#0c1825] border-emerald-500/30 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
                          }`}
                        >
                          {labels[gType]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: MINUTE SELECTION (NO DEFAULT MINUTE) */}
              <div className={!selectedAction || (selectedAction === 'goal' && !selectedGoalType) ? 'opacity-40 pointer-events-none' : ''}>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  4. Match Minute (1 - 120, Required, No Default) <span className="text-[#ff0046]">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={minuteInput}
                    onChange={(e) => setMinuteInput(e.target.value)}
                    placeholder="Enter minute (e.g. 42)"
                    className="w-44 p-2 rounded-md bg-white dark:bg-[#0c1825] border border-slate-300 dark:border-[#223b56] font-mono text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#ff0046] focus:outline-none transition-colors"
                  />
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {[15, 30, 45, 60, 75, 90].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMinuteInput(String(m))}
                        className="px-2 py-1 rounded bg-slate-200 dark:bg-[#152a40] hover:bg-slate-300 dark:hover:bg-[#1e3857] text-[10px] font-bold font-mono text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        {m}'
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* STEP 5: PLAYER SELECTION (UNLOCKED ONLY AFTER MINUTE IS ENTERED) */}
              <div className={!isMinuteValid ? 'opacity-40 pointer-events-none' : ''}>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  5. Select Player (Unlocked only after Minute is selected) <span className="text-[#ff0046]">*</span>
                </label>

                {!isMinuteValid ? (
                  <div className="p-2.5 rounded-md bg-slate-100 dark:bg-[#0c1825] border border-slate-200 dark:border-[#1a2e45] text-slate-400 text-xs italic">
                    Enter the match minute above to unlock player selection. No player can be chosen by mistake.
                  </div>
                ) : selectedAction === 'substitution' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-rose-500 uppercase block mb-1">
                        Player Coming Off (Out)
                      </span>
                      <select
                        value={selectedPlayerId}
                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                        className="w-full p-2 rounded-md bg-white dark:bg-[#0c1825] border border-slate-300 dark:border-[#223b56] text-xs font-bold text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none"
                      >
                        <option value="">-- Choose Out Player --</option>
                        {currentSquad.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.jerseyNumber || '-'} {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase block mb-1">
                        Player Coming On (In)
                      </span>
                      <select
                        value={selectedSubPlayerInId}
                        onChange={(e) => setSelectedSubPlayerInId(e.target.value)}
                        className="w-full p-2 rounded-md bg-white dark:bg-[#0c1825] border border-slate-300 dark:border-[#223b56] text-xs font-bold text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none"
                      >
                        <option value="">-- Choose In Player --</option>
                        {currentSquad.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.jerseyNumber || '-'} {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full p-2 rounded-md bg-white dark:bg-[#0c1825] border border-slate-300 dark:border-[#223b56] text-xs font-bold text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none"
                  >
                    <option value="">-- Choose Official Player --</option>
                    {currentSquad.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.jerseyNumber || '-'} {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* ADD EVENT BUTTON */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddEvent}
                  disabled={
                    !selectedTeam ||
                    !selectedAction ||
                    !isMinuteValid ||
                    !selectedPlayerId ||
                    (selectedAction === 'goal' && !selectedGoalType) ||
                    (selectedAction === 'substitution' && !selectedSubPlayerInId)
                  }
                  className="px-4 py-2 rounded-md bg-[#152a40] hover:bg-[#ff0046] text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Event to Match Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS BAR */}
        <div className="p-4 border-t border-slate-200 dark:border-[#182e47] bg-slate-50 dark:bg-[#09131d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Cancel Match Button */}
            <button
              type="button"
              onClick={() => setConfirmPrompt('CANCEL')}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-md border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
            >
              Cancel Match
            </button>

            {/* Award Walkover Button */}
            <button
              type="button"
              onClick={() => setConfirmPrompt('WALKOVER')}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-md border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
            >
              Award Walkover (3-0)
            </button>
          </div>

          {/* Primary Submit FT Button */}
          <button
            type="button"
            onClick={() => setConfirmPrompt('FT')}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-md bg-[#00b04f] hover:bg-[#009b45] text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Submit Match Report (FT)</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* CONFIRMATION PROMPT MODAL (FOR ALL SUBMITS: FT, WALKOVER, CANCEL) */}
        {/* =================================================================== */}
        {confirmPrompt && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="bg-white dark:bg-[#0e1e2d] border border-slate-300 dark:border-[#1a2e45] rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 text-slate-900 dark:text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-2 text-rose-500 dark:text-[#ff0046] border-b border-slate-100 dark:border-[#14263b] pb-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <h3 className="font-black text-sm uppercase tracking-wider">
                  {confirmPrompt === 'FT' && 'Confirm End Match & Final Score'}
                  {confirmPrompt === 'WALKOVER' && 'Confirm Official Walkover'}
                  {confirmPrompt === 'CANCEL' && 'Confirm Match Cancellation'}
                </h3>
              </div>

              {/* Prompt Body */}
              {confirmPrompt === 'FT' && (
                <div className="space-y-2 text-xs">
                  <p className="text-slate-600 dark:text-slate-300">
                    Are you sure you want to conclude and submit this match report?
                  </p>
                  <div className="p-3 bg-slate-100 dark:bg-[#102237] rounded-md font-mono text-center text-sm font-black text-slate-900 dark:text-white">
                    {match.teamA.name} {calculatedScore.home} — {calculatedScore.away} {match.teamB.name}
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Once submitted, the match status will be locked as <strong>Full Time (FT)</strong>. Standings will be updated permanently. Past confirmed matches cannot be revoked.
                  </p>
                </div>
              )}

              {confirmPrompt === 'WALKOVER' && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    Select the winning team to receive the official <strong>3 - 0</strong> walkover victory:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWalkoverWinningTeam('home')}
                      className={`p-2.5 rounded-md border text-center font-bold text-xs transition-colors cursor-pointer ${
                        walkoverWinningTeam === 'home'
                          ? 'bg-amber-500 text-white border-amber-600 font-black ring-1 ring-amber-500'
                          : 'bg-slate-50 dark:bg-[#102237] border-slate-200 dark:border-[#1a2e45] text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {match.teamA.name} (3-0 Win)
                    </button>

                    <button
                      type="button"
                      onClick={() => setWalkoverWinningTeam('away')}
                      className={`p-2.5 rounded-md border text-center font-bold text-xs transition-colors cursor-pointer ${
                        walkoverWinningTeam === 'away'
                          ? 'bg-amber-500 text-white border-amber-600 font-black ring-1 ring-amber-500'
                          : 'bg-slate-50 dark:bg-[#102237] border-slate-200 dark:border-[#1a2e45] text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {match.teamB.name} (3-0 Win)
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Awarding walkover records an official 3-0 result. This action is final.
                  </p>
                </div>
              )}

              {confirmPrompt === 'CANCEL' && (
                <div className="space-y-2 text-xs">
                  <p className="text-slate-600 dark:text-slate-300">
                    Are you sure you want to cancel this match?
                  </p>
                  <p className="text-[11px] text-rose-500 font-bold">
                    The fixture will be marked as CANCELLED in the official league records.
                  </p>
                </div>
              )}

              {/* Prompt Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#14263b]">
                <button
                  type="button"
                  onClick={() => setConfirmPrompt(null)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-md bg-slate-200 dark:bg-[#152a40] hover:bg-slate-300 dark:hover:bg-[#1e3857] text-slate-700 dark:text-slate-200 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Back
                </button>

                {confirmPrompt === 'FT' && (
                  <button
                    type="button"
                    onClick={handleConfirmSubmitFT}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-md bg-[#00b04f] hover:bg-[#009b45] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Yes, Confirm & End Match'}
                  </button>
                )}

                {confirmPrompt === 'WALKOVER' && (
                  <button
                    type="button"
                    onClick={handleConfirmWalkover}
                    disabled={isSubmitting || !walkoverWinningTeam}
                    className="px-4 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isSubmitting ? 'Awarding...' : 'Yes, Award 3-0 Walkover'}
                  </button>
                )}

                {confirmPrompt === 'CANCEL' && (
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Cancelling...' : 'Yes, Cancel Match'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndMatchModal;
