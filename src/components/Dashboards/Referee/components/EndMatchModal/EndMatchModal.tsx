import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Clock, Trophy, CheckCircle2, AlertTriangle, Plus, Trash2, 
  ArrowRight, ShieldCheck, Sparkles, User, Flame
} from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import type { Match, MatchStatus, MatchEventType } from '../../../../../types';
import type { GoalEntry, CardEntry, InjuryEntry } from '../../types';

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
  onAwardWalkover?: (fixtureId: string, winningTeamTarget: 'home' | 'away') => Promise<void>;
  onCancelMatch?: (fixtureId: string) => Promise<void>;
  isSubmitting: boolean;
  homeSquad?: PlayerRosterItem[];
  awaySquad?: PlayerRosterItem[];
}

export const EndMatchModal: React.FC<EndMatchModalProps> = ({
  match,
  isOpen,
  onClose,
  onSubmitReport,
  isSubmitting,
  homeSquad = [],
  awaySquad = [],
}) => {
  // Recorded Match Events list
  const [events, setEvents] = useState<RecordedEvent[]>([]);

  // Add Match Event Hierarchy Modal State
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState<boolean>(false);

  // Submit Confirmation Modal State
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState<boolean>(false);

  // Smart Hierarchy Form State (No Defaults / Pre-selection)
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | null>(null);
  const [selectedAction, setSelectedAction] = useState<'goal' | 'yellow' | 'red' | 'substitution' | null>(null);
  const [selectedGoalType, setSelectedGoalType] = useState<'open_play' | 'penalty' | 'free_kick' | 'own_goal' | null>(null);
  const [minuteInput, setMinuteInput] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedSubPlayerInId, setSelectedSubPlayerInId] = useState<string>('');

  // Local fetched squad rosters (guaranteed starters + substitutes)
  const [fetchedHomeSquad, setFetchedHomeSquad] = useState<PlayerRosterItem[]>([]);
  const [fetchedAwaySquad, setFetchedAwaySquad] = useState<PlayerRosterItem[]>([]);

  // Instant non-blocking pre-fetch of full rosters and existing events
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function loadFullRosters() {
      try {
        const homeId = match.teamA.id;
        const awayId = match.teamB.id;

        const { data: lineups } = await supabase
          .from('match_lineups')
          .select('*')
          .eq('fixture_id', match.id);

        if (!isMounted) return;

        if (lineups && lineups.length > 0) {
          const homeL = lineups.find((l: any) => l.team_id === homeId);
          const awayL = lineups.find((l: any) => l.team_id === awayId);

          if (homeL) {
            const starters = (homeL.starting_xi || []).map((p: any) => ({
              id: p.id || p.player_id || `h_xi_${p.jersey_number || p.number}`,
              name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Player ${p.jersey_number || p.number}`,
              jerseyNumber: p.jersey_number || p.number || 0,
              position: p.position || 'FWD',
              isSub: false,
            }));
            const subs = (homeL.substitutes || []).map((p: any) => ({
              id: p.id || p.player_id || `h_sub_${p.jersey_number || p.number}`,
              name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Sub ${p.jersey_number || p.number}`,
              jerseyNumber: p.jersey_number || p.number || 0,
              position: p.position || 'SUB',
              isSub: true,
            }));
            setFetchedHomeSquad([...starters, ...subs]);
          }

          if (awayL) {
            const starters = (awayL.starting_xi || []).map((p: any) => ({
              id: p.id || p.player_id || `a_xi_${p.jersey_number || p.number}`,
              name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Player ${p.jersey_number || p.number}`,
              jerseyNumber: p.jersey_number || p.number || 0,
              position: p.position || 'FWD',
              isSub: false,
            }));
            const subs = (awayL.substitutes || []).map((p: any) => ({
              id: p.id || p.player_id || `a_sub_${p.jersey_number || p.number}`,
              name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Sub ${p.jersey_number || p.number}`,
              jerseyNumber: p.jersey_number || p.number || 0,
              position: p.position || 'SUB',
              isSub: true,
            }));
            setFetchedAwaySquad([...starters, ...subs]);
          }
        }

        const { data: existingEvents } = await supabase
          .from('match_events')
          .select('*')
          .eq('fixture_id', match.id)
          .order('minute', { ascending: true });

        if (!isMounted) return;

        if (existingEvents && existingEvents.length > 0) {
          const mappedEvts: RecordedEvent[] = existingEvents.map((evt: any) => {
            const isHome = evt.event_target === 'home' || evt.team_id === homeId;
            let type: 'goal' | 'yellow' | 'red' | 'substitution' = 'goal';
            const rawType = (evt.type || '').toLowerCase();
            if (rawType.includes('goal')) type = 'goal';
            else if (rawType.includes('yellow')) type = 'yellow';
            else if (rawType.includes('red')) type = 'red';
            else if (rawType.includes('sub')) type = 'substitution';

            return {
              id: evt.id || `evt_${Math.random()}`,
              dbId: evt.id,
              minute: evt.minute || 1,
              type,
              teamTarget: isHome ? 'home' : 'away',
              teamName: isHome ? match.teamA.name : match.teamB.name,
              playerId: evt.player_id || '',
              playerName: evt.detail_text || 'Official Event',
              jerseyNumber: '',
            };
          });
          setEvents(mappedEvts);
        }
      } catch (err) {
        console.warn('Non-blocking squad load note:', err);
      }
    }

    loadFullRosters();

    return () => {
      isMounted = false;
    };
  }, [isOpen, match.id, match.teamA.id, match.teamB.id, match.teamA.name, match.teamB.name]);

  // Instant score calculation from recorded goals
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

  // Immediate synchronous squad fallbacks (loads instantly, zero wait)
  const resolvedHomeSquad = useMemo(() => {
    if (fetchedHomeSquad.length > 0) return fetchedHomeSquad;
    if (homeSquad.length > 0) return homeSquad;
    const starters: PlayerRosterItem[] = Array.from({ length: 11 }, (_, i) => ({
      id: `h_xi_${i + 1}`,
      name: `${match.teamA.shortName || 'Home'} Starter #${i + 1}`,
      jerseyNumber: i + 1,
      isSub: false,
      position: i === 0 ? 'GK' : i < 5 ? 'DEF' : i < 9 ? 'MID' : 'FWD',
    }));
    const subs: PlayerRosterItem[] = Array.from({ length: 7 }, (_, i) => ({
      id: `h_sub_${i + 12}`,
      name: `${match.teamA.shortName || 'Home'} Sub #${i + 12}`,
      jerseyNumber: i + 12,
      isSub: true,
      position: 'SUB',
    }));
    return [...starters, ...subs];
  }, [fetchedHomeSquad, homeSquad, match.teamA.shortName]);

  const resolvedAwaySquad = useMemo(() => {
    if (fetchedAwaySquad.length > 0) return fetchedAwaySquad;
    if (awaySquad.length > 0) return awaySquad;
    const starters: PlayerRosterItem[] = Array.from({ length: 11 }, (_, i) => ({
      id: `a_xi_${i + 1}`,
      name: `${match.teamB.shortName || 'Away'} Starter #${i + 1}`,
      jerseyNumber: i + 1,
      isSub: false,
      position: i === 0 ? 'GK' : i < 5 ? 'DEF' : i < 9 ? 'MID' : 'FWD',
    }));
    const subs: PlayerRosterItem[] = Array.from({ length: 7 }, (_, i) => ({
      id: `a_sub_${i + 12}`,
      name: `${match.teamB.shortName || 'Away'} Sub #${i + 12}`,
      jerseyNumber: i + 12,
      isSub: true,
      position: 'SUB',
    }));
    return [...starters, ...subs];
  }, [fetchedAwaySquad, awaySquad, match.teamB.shortName]);

  const activeSquad = selectedTeam === 'home' ? resolvedHomeSquad : resolvedAwaySquad;
  const activeStarters = activeSquad.filter((p) => !p.isSub);
  const activeSubstitutes = activeSquad.filter((p) => p.isSub);

  // Validate minute: integer between 1 and 120
  const parsedMinute = parseInt(minuteInput, 10);
  const isMinuteValid = !isNaN(parsedMinute) && parsedMinute >= 1 && parsedMinute <= 120;

  // Dynamic focus step computation for the visual guide border
  // 1: Team -> 2: Event Type -> 2.5: Goal Type -> 3: Minute -> 4: Player -> 5: Ready to Add Event
  const currentFocusStep = useMemo(() => {
    if (!selectedTeam) return 1;
    if (!selectedAction) return 2;
    if (selectedAction === 'goal' && !selectedGoalType) return 2.5;
    if (!isMinuteValid) return 3;
    if (!selectedPlayerId || (selectedAction === 'substitution' && !selectedSubPlayerInId)) return 4;
    return 5;
  }, [selectedTeam, selectedAction, selectedGoalType, isMinuteValid, selectedPlayerId, selectedSubPlayerInId]);

  const isValidUuid = (id?: string | null): boolean => {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  };

  // Add Event Handler (Instant local state update)
  const handleAddEvent = () => {
    if (!selectedTeam || !selectedAction || !isMinuteValid || !selectedPlayerId) return;
    if (selectedAction === 'goal' && !selectedGoalType) return;
    if (selectedAction === 'substitution' && !selectedSubPlayerInId) return;

    const primaryPlayer = activeSquad.find((p) => p.id === selectedPlayerId);
    const subInPlayer = activeSquad.find((p) => p.id === selectedSubPlayerInId);

    const newEventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const teamName = selectedTeam === 'home' ? match.teamA.name : match.teamB.name;

    const newEvent: RecordedEvent = {
      id: newEventId,
      minute: parsedMinute,
      type: selectedAction,
      goalType: selectedAction === 'goal' ? selectedGoalType! : undefined,
      teamTarget: selectedTeam,
      teamName,
      playerId: selectedPlayerId,
      playerName: primaryPlayer?.name || 'Player',
      jerseyNumber: primaryPlayer?.jerseyNumber || '',
      subPlayerInId: selectedAction === 'substitution' ? selectedSubPlayerInId : undefined,
      subPlayerInName: selectedAction === 'substitution' ? subInPlayer?.name : undefined,
    };

    setEvents((prev) => [...prev, newEvent].sort((a, b) => a.minute - b.minute));
    setIsAddEventModalOpen(false);

    // Reset hierarchy
    setSelectedTeam(null);
    setSelectedAction(null);
    setSelectedGoalType(null);
    setMinuteInput('');
    setSelectedPlayerId('');
    setSelectedSubPlayerInId('');
  };

  // Cancel / Remove Event Handler
  const handleRemoveEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Submit Final Match Report & End Match Instantly
  const handleConfirmSubmitFT = async () => {
    const goals: GoalEntry[] = events
      .filter((e) => e.type === 'goal')
      .map((g) => ({
        id: g.id,
        teamTarget: g.teamTarget,
        minute: g.minute,
        jerseyNumber: g.jerseyNumber ?? '',
        playerId: isValidUuid(g.playerId) ? g.playerId : undefined,
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
        playerId: isValidUuid(c.playerId) ? c.playerId : undefined,
        playerName: c.playerName,
        cardType: c.type === 'yellow' ? 'yellow' : 'red',
      }));

    // Instantly close dialogs to guarantee 0ms perceptual lag
    setIsConfirmSubmitOpen(false);
    onClose();

    // Fire up the match end algorithms
    await onSubmitReport({
      scoreHome: calculatedScore.home,
      scoreAway: calculatedScore.away,
      matchState: 'FT',
      goals,
      cards,
      injuries: [],
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-3xl bg-[#090f17] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto text-white flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR: Clean Apple Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/10 bg-[#070c13]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Official Match Control • End Match Portal
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {match.league || 'Egerton Premier League'} • Matchday {match.matchday || 1}
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

        {/* SCROLLABLE BODY CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. THE STEPS (Apple Minimalist Pipeline) */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-bold">
              {/* Step 1 */}
              <div className="flex items-center gap-2 text-emerald-400 shrink-0">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-black text-xs text-emerald-400">
                  ✓
                </div>
                <div>
                  <span className="block uppercase text-[9px] text-slate-400 font-black">Step 1</span>
                  <span className="font-bold text-white">Teams & Lineup</span>
                </div>
              </div>
              <div className="h-0.5 w-6 bg-white/10 shrink-0 hidden sm:block" />

              {/* Step 2 */}
              <div className="flex items-center gap-2 text-amber-400 shrink-0">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-black text-xs text-amber-400">
                  2
                </div>
                <div>
                  <span className="block uppercase text-[9px] text-amber-300 font-black">Step 2 • Active</span>
                  <span className="font-bold text-white">Add Match Events ({events.length})</span>
                </div>
              </div>
              <div className="h-0.5 w-6 bg-white/10 shrink-0 hidden sm:block" />

              {/* Step 3 */}
              <div className="flex items-center gap-2 text-[#00b04f] shrink-0">
                <div className="w-6 h-6 rounded-full bg-[#00b04f]/20 border border-[#00b04f]/40 flex items-center justify-center font-mono font-black text-xs text-[#00b04f]">
                  3
                </div>
                <div>
                  <span className="block uppercase text-[9px] text-slate-400 font-black">Step 3</span>
                  <span className="font-bold text-white">Submit Match Details</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. THE TEAMS (Clean Apple Matchup Card - No bulky meta clutter) */}
          <div className="bg-[#0b131e] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="grid grid-cols-11 items-center gap-2">
              {/* Home Team */}
              <div className="col-span-4 flex items-center justify-start gap-3 min-w-0">
                <img
                  src={match.teamA.logo}
                  alt={match.teamA.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-contain bg-black/40 p-1.5 shrink-0 border border-white/10 shadow-md"
                />
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base uppercase tracking-tight text-white truncate">
                    {match.teamA.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Home Team
                  </span>
                </div>
              </div>

              {/* Digital Scoreboard */}
              <div className="col-span-3 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-2.5 text-3xl sm:text-5xl font-mono font-black tracking-tight text-white">
                  <span className="text-emerald-400">{calculatedScore.home}</span>
                  <span className="text-slate-500 font-sans text-2xl sm:text-3xl">-</span>
                  <span className="text-emerald-400">{calculatedScore.away}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mt-1">
                  Full Time Target
                </span>
              </div>

              {/* Away Team */}
              <div className="col-span-4 flex items-center justify-end gap-3 min-w-0 text-right">
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base uppercase tracking-tight text-white truncate">
                    {match.teamB.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Away Team
                  </span>
                </div>
                <img
                  src={match.teamB.logo}
                  alt={match.teamB.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-contain bg-black/40 p-1.5 shrink-0 border border-white/10 shadow-md"
                />
              </div>
            </div>
          </div>

          {/* 3. VISIBLE "ADD MATCH EVENT" BUTTON (Right Below Teams) */}
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setIsAddEventModalOpen(true)}
              className="w-full sm:w-auto min-w-[280px] px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2.5 group"
            >
              <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4 text-black" />
              </div>
              <span>+ Add Match Event</span>
            </button>
          </div>

          {/* 4. ADDED EVENTS LIST (WITH VISIBLE "CANCEL EVENT" BUTTON) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Logged Events ({events.length})
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {events.length === 0 ? 'Draw 0 — 0' : 'Chronological Order'}
              </span>
            </div>

            {events.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-1.5">
                <p className="text-xs font-bold text-slate-300">No match events logged yet</p>
                <p className="text-[11px] text-slate-500">
                  If the match concluded 0 — 0 without cards or substitutions, you can proceed directly to Submit Match Details.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e1724] border border-white/10 hover:border-white/20 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Minute Badge */}
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono font-black text-xs text-emerald-400 shrink-0">
                        {evt.minute}'
                      </div>

                      {/* Event Icon */}
                      <div className="text-lg shrink-0">
                        {evt.type === 'goal' ? '⚽' : evt.type === 'yellow' ? '🟨' : evt.type === 'red' ? '🟥' : '🔄'}
                      </div>

                      {/* Event Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-white truncate">{evt.playerName}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            • {evt.teamName}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 block">
                          {evt.type === 'goal'
                            ? `Goal (${evt.goalType === 'penalty' ? 'Penalty' : evt.goalType === 'own_goal' ? 'Own Goal' : 'Open Play'})`
                            : evt.type === 'yellow'
                            ? 'Yellow Card'
                            : evt.type === 'red'
                            ? 'Red Card'
                            : `Substitution: Off #${evt.jerseyNumber || ''} → In ${evt.subPlayerInName || 'Player In'}`}
                        </span>
                      </div>
                    </div>

                    {/* VISIBLE CANCEL EVENT BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleRemoveEvent(evt.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 hover:border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
                      title="Cancel this event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancel Event</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. BOTTOM ACTION BAR: SUBMIT MATCH DETAILS */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070c13] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center justify-center sm:justify-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Final Match Certification
            </span>
            <p className="text-xs text-slate-400">
              {events.length === 0
                ? "Draw 0 — 0 with 0 events. Click Submit Match Details to review and finalize."
                : `${events.length} event${events.length === 1 ? '' : 's'} recorded. Score: ${calculatedScore.home} — ${calculatedScore.away}.`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Exit
            </button>

            <button
              type="button"
              onClick={() => setIsConfirmSubmitOpen(true)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>Submit Match Details</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ADD MATCH EVENT HIERARCHY MODAL WITH DYNAMIC APPLE FOCUS BORDER GUIDE     */}
        {/* ========================================================================= */}
        {isAddEventModalOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
            onClick={() => setIsAddEventModalOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative w-full max-w-lg bg-[#0b131e] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-white">
                      Add Match Event
                    </h3>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Interactive Visual Guide • Follow the Highlighted Border
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* DYNAMIC PROGRESS STEP TRACKER */}
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-center text-[10px] font-bold">
                <div className={`py-1.5 px-1 rounded-lg transition-all ${
                  selectedTeam ? 'bg-emerald-500/20 text-emerald-300 font-black' : currentFocusStep === 1 ? 'bg-emerald-400 text-black font-black shadow-sm' : 'text-slate-500'
                }`}>
                  1. Team {selectedTeam && '✓'}
                </div>
                <div className={`py-1.5 px-1 rounded-lg transition-all ${
                  selectedAction ? 'bg-emerald-500/20 text-emerald-300 font-black' : currentFocusStep === 2 || currentFocusStep === 2.5 ? 'bg-emerald-400 text-black font-black shadow-sm' : 'text-slate-500'
                }`}>
                  2. Event {selectedAction && '✓'}
                </div>
                <div className={`py-1.5 px-1 rounded-lg transition-all ${
                  isMinuteValid ? 'bg-emerald-500/20 text-emerald-300 font-black' : currentFocusStep === 3 ? 'bg-emerald-400 text-black font-black shadow-sm' : 'text-slate-500'
                }`}>
                  3. Minute {isMinuteValid && '✓'}
                </div>
                <div className={`py-1.5 px-1 rounded-lg transition-all ${
                  selectedPlayerId ? 'bg-emerald-500/20 text-emerald-300 font-black' : currentFocusStep === 4 ? 'bg-emerald-400 text-black font-black shadow-sm' : 'text-slate-500'
                }`}>
                  4. Player {selectedPlayerId && '✓'}
                </div>
              </div>

              {/* Form Steps Container */}
              <div className="space-y-3.5 text-xs">
                {/* STEP 1: SELECT TEAM */}
                <div
                  className={`rounded-2xl p-3.5 transition-all duration-300 ${
                    currentFocusStep === 1
                      ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/20 bg-emerald-500/[0.06] shadow-[0_0_25px_rgba(16,185,129,0.25)] scale-[1.01]'
                      : selectedTeam
                      ? 'border border-emerald-500/30 bg-white/[0.02]'
                      : 'border border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <span>Step 1: Select Team</span>
                      <span className="text-emerald-400">*</span>
                    </label>
                    {currentFocusStep === 1 ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                        👉 Start Here
                      </span>
                    ) : selectedTeam ? (
                      <span className="text-[10px] font-bold text-emerald-400">
                        ✓ {selectedTeam === 'home' ? match.teamA.name : match.teamB.name}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeam('home');
                        setSelectedPlayerId('');
                        setSelectedSubPlayerInId('');
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedTeam === 'home'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white font-black ring-2 ring-emerald-400/50 shadow-md shadow-emerald-500/20'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={match.teamA.logo} alt="" className="w-6 h-6 rounded-lg object-contain bg-black/40 p-0.5 shrink-0" />
                        <span className="truncate font-bold text-xs">{match.teamA.name}</span>
                      </div>
                      {selectedTeam === 'home' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeam('away');
                        setSelectedPlayerId('');
                        setSelectedSubPlayerInId('');
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedTeam === 'away'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white font-black ring-2 ring-emerald-400/50 shadow-md shadow-emerald-500/20'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={match.teamB.logo} alt="" className="w-6 h-6 rounded-lg object-contain bg-black/40 p-0.5 shrink-0" />
                        <span className="truncate font-bold text-xs">{match.teamB.name}</span>
                      </div>
                      {selectedTeam === 'away' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  </div>
                </div>

                {/* STEP 2: SELECT EVENT TYPE */}
                <div
                  className={`rounded-2xl p-3.5 transition-all duration-300 ${
                    currentFocusStep === 2
                      ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/20 bg-emerald-500/[0.06] shadow-[0_0_25px_rgba(16,185,129,0.25)] scale-[1.01]'
                      : selectedAction
                      ? 'border border-emerald-500/30 bg-white/[0.02]'
                      : 'border border-white/5 opacity-40 pointer-events-none'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <span>Step 2: Select Event Type</span>
                      <span className="text-emerald-400">*</span>
                    </label>
                    {currentFocusStep === 2 ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                        👉 Select Action
                      </span>
                    ) : selectedAction ? (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">
                        ✓ {selectedAction}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'goal', label: 'Goal', icon: '⚽' },
                      { id: 'yellow', label: 'Yellow Card', icon: '🟨' },
                      { id: 'red', label: 'Red Card', icon: '🟥' },
                      { id: 'substitution', label: 'Substitution', icon: '🔄' },
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          setSelectedAction(act.id as any);
                          if (act.id !== 'goal') setSelectedGoalType(null);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedAction === act.id
                            ? 'bg-emerald-500/20 border-emerald-400 text-white font-black ring-2 ring-emerald-400/50 shadow-md shadow-emerald-500/20'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xl block mb-0.5">{act.icon}</span>
                        <span className="text-[11px] font-bold">{act.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* STEP 2.5: GOAL TYPE (When Goal is selected) */}
                {selectedAction === 'goal' && (
                  <div
                    className={`rounded-2xl p-3.5 transition-all duration-300 ${
                      currentFocusStep === 2.5
                        ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/20 bg-emerald-500/[0.06] shadow-[0_0_25px_rgba(16,185,129,0.25)] scale-[1.01]'
                        : selectedGoalType
                        ? 'border border-emerald-500/30 bg-white/[0.02]'
                        : 'border border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span>How was the goal scored?</span>
                        <span className="text-emerald-400">*</span>
                      </label>
                      {currentFocusStep === 2.5 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          👉 Select Type
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'open_play', label: 'Open Play' },
                        { id: 'penalty', label: 'Penalty Kick' },
                        { id: 'free_kick', label: 'Free Kick' },
                        { id: 'own_goal', label: 'Own Goal' },
                      ].map((gt) => (
                        <button
                          key={gt.id}
                          type="button"
                          onClick={() => setSelectedGoalType(gt.id as any)}
                          className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                            selectedGoalType === gt.id
                              ? 'bg-emerald-500/20 border-emerald-400 text-white font-black ring-2 ring-emerald-400/50'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {gt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 3: MATCH MINUTE (With quick-pick pills for instant input) */}
                <div
                  className={`rounded-2xl p-3.5 transition-all duration-300 ${
                    currentFocusStep === 3
                      ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/20 bg-emerald-500/[0.06] shadow-[0_0_25px_rgba(16,185,129,0.25)] scale-[1.01]'
                      : isMinuteValid
                      ? 'border border-emerald-500/30 bg-white/[0.02]'
                      : 'border border-white/5 opacity-40 pointer-events-none'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <span>Step 3: Enter Match Minute (1 — 120)</span>
                      <span className="text-emerald-400">*</span>
                    </label>
                    {currentFocusStep === 3 ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                        👉 Enter Minute
                      </span>
                    ) : isMinuteValid ? (
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">
                        ✓ Minute: {minuteInput}'
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={minuteInput}
                      onChange={(e) => setMinuteInput(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-32 p-2.5 rounded-xl bg-black/50 border border-white/20 font-mono text-sm font-bold text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none ring-1 focus:ring-emerald-400/40"
                    />
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {[15, 30, 45, 60, 75, 90].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMinuteInput(String(m))}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            minuteInput === String(m)
                              ? 'bg-emerald-400 text-black font-black ring-2 ring-emerald-400/50'
                              : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          {m}'
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* STEP 4: SELECT PLAYER (Starters and Substitutes Included) */}
                <div
                  className={`rounded-2xl p-3.5 transition-all duration-300 ${
                    currentFocusStep === 4
                      ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/20 bg-emerald-500/[0.06] shadow-[0_0_25px_rgba(16,185,129,0.25)] scale-[1.01]'
                      : selectedPlayerId
                      ? 'border border-emerald-500/30 bg-white/[0.02]'
                      : 'border border-white/5 opacity-40 pointer-events-none'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <span>Step 4: Select Player</span>
                      <span className="text-emerald-400">*</span>
                    </label>
                    {currentFocusStep === 4 ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                        👉 Pick Player
                      </span>
                    ) : selectedPlayerId ? (
                      <span className="text-[10px] font-bold text-emerald-400 truncate max-w-[150px]">
                        ✓ {activeSquad.find((p) => p.id === selectedPlayerId)?.name || 'Player Selected'}
                      </span>
                    ) : null}
                  </div>

                  {selectedAction === 'substitution' ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-rose-400 uppercase block mb-1">
                          Player Coming Off (Starter)
                        </span>
                        <select
                          value={selectedPlayerId}
                          onChange={(e) => setSelectedPlayerId(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                        >
                          <option value="">-- Select Starter Coming Off --</option>
                          {activeStarters.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.jerseyNumber || '-'} {p.name} ({p.position || 'Starter'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                          Substitute Coming On (Bench)
                        </span>
                        <select
                          value={selectedSubPlayerInId}
                          onChange={(e) => setSelectedSubPlayerInId(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                        >
                          <option value="">-- Select Substitute Coming On --</option>
                          {activeSubstitutes.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.jerseyNumber || '-'} {p.name} (Substitute)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={selectedPlayerId}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="">-- Select Official Player --</option>
                      <optgroup label="Starting XI (Starters)">
                        {activeStarters.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.jerseyNumber || '-'} {p.name} ({p.position || 'Starter'})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Bench Substitutes">
                        {activeSubstitutes.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.jerseyNumber || '-'} {p.name} (Substitute)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  )}
                </div>
              </div>

              {/* Action Buttons for Add Match Event Modal */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleAddEvent}
                  disabled={currentFocusStep !== 5}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                    currentFocusStep === 5
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black border-2 border-emerald-400 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/40 animate-pulse scale-105 active:scale-95'
                      : 'bg-white/10 text-slate-500 border border-white/10 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentFocusStep === 5 ? 'Add Match Event' : 'Complete Steps to Add Event'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBMIT CONFIRMATION POPUP: CONFIRMATION OF SCORES AND EVENTS              */}
        {/* ========================================================================= */}
        {isConfirmSubmitOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="bg-[#0b131e] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-white animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      Confirmation of Scores and Events
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                      Instant Match Finalization
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConfirmSubmitOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Official Score Summary Card */}
              <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Official Final Result (Full Time)
                </span>
                <div className="flex items-center justify-center gap-3 py-1 font-mono font-black text-xl sm:text-2xl text-white">
                  <span className="text-slate-200">{match.teamA.name}</span>
                  <span className="px-3 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {calculatedScore.home} — {calculatedScore.away}
                  </span>
                  <span className="text-slate-200">{match.teamB.name}</span>
                </div>
              </div>

              {/* Events Summary List */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                  Recorded Events ({events.length}):
                </span>
                {events.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    0 match events recorded. Fixture will be finalized as 0 — 0 draw in league tables.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto divide-y divide-white/5 rounded-xl bg-black/30 border border-white/10 p-2 space-y-1">
                    {events.map((evt) => (
                      <div key={evt.id} className="flex items-center justify-between text-xs py-1 px-2">
                        <span className="font-mono text-emerald-400 font-bold">{evt.minute}'</span>
                        <span className="text-slate-200 font-medium">
                          {evt.type === 'goal' ? '⚽ Goal' : evt.type === 'yellow' ? '🟨 Yellow Card' : evt.type === 'red' ? '🟥 Red Card' : '🔄 Sub'}: {evt.playerName} ({evt.teamTarget.toUpperCase()})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Confirming will end the match instantly, lock Full Time status, and fire up official match end reconciliation algorithms.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsConfirmSubmitOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSubmitFT}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00b04f] hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Ending Match...' : 'Confirm & End Match Instantly'}</span>
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
