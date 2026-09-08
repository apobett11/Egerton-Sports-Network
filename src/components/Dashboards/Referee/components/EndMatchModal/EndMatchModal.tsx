import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Clock, MapPin, Trophy, ShieldAlert, CheckCircle2, 
  AlertTriangle, Plus, Trash2, ArrowRight, ShieldCheck,
  Ban, CornerUpRight
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

  // Second Module Popup State: Smart Event Hierarchy Modal
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

  // Fetch complete squads (starters and substitutes) if not already fully supplied
  useEffect(() => {
    if (!isOpen) return;
    async function loadFullRosters() {
      try {
        const homeId = match.teamA.id;
        const awayId = match.teamB.id;

        const { data: lineups } = await supabase
          .from('match_lineups')
          .select('*')
          .eq('fixture_id', match.id);

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

        // Fetch existing match_events to pre-populate timeline if any
        const { data: existingEvents } = await supabase
          .from('match_events')
          .select('*')
          .eq('fixture_id', match.id)
          .order('minute', { ascending: true });

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
        console.warn('Squad / events prefetch note:', err);
      }
    }

    loadFullRosters();
  }, [isOpen, match.id, match.teamA.id, match.teamB.id, match.teamA.name, match.teamB.name]);

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

  // Resolved squad: combines props or fetched roster or complete fallback
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

  // Validate minute: must be integer between 1 and 120
  const parsedMinute = parseInt(minuteInput, 10);
  const isMinuteValid = !isNaN(parsedMinute) && parsedMinute >= 1 && parsedMinute <= 120;

  // Add Event Handler: Immediately updates state & syncs with Supabase
  const handleAddEvent = async () => {
    if (!selectedTeam || !selectedAction || !isMinuteValid || !selectedPlayerId) return;
    if (selectedAction === 'goal' && !selectedGoalType) return;
    if (selectedAction === 'substitution' && !selectedSubPlayerInId) return;

    const primaryPlayer = activeSquad.find((p) => p.id === selectedPlayerId);
    const subInPlayer = activeSquad.find((p) => p.id === selectedSubPlayerInId);

    const newEventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const teamId = selectedTeam === 'home' ? match.teamA.id : match.teamB.id;
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

    // 1. Immediately update local state
    setEvents((prev) => [...prev, newEvent].sort((a, b) => a.minute - b.minute));

    // 2. Close hierarchy popup
    setIsAddEventModalOpen(false);

    // 3. Reset form inputs
    setSelectedTeam(null);
    setSelectedAction(null);
    setSelectedGoalType(null);
    setMinuteInput('');
    setSelectedPlayerId('');
    setSelectedSubPlayerInId('');

    // 4. Send event to database immediately
    try {
      const detailText = selectedAction === 'substitution'
        ? `Sub: ${primaryPlayer?.name || 'Player'} OUT -> ${subInPlayer?.name || 'Sub'} IN`
        : `${selectedAction.toUpperCase()}: ${primaryPlayer?.name || 'Player'} (${selectedGoalType || 'normal'})`;

      const { data: insertedData, error: insertErr } = await supabase
        .from('match_events')
        .insert({
          fixture_id: match.id,
          minute: parsedMinute,
          type: selectedAction,
          event_target: selectedTeam,
          team_id: teamId || null,
          player_id: selectedPlayerId || null,
          detail_text: detailText,
          is_official: true,
        })
        .select('id')
        .maybeSingle();

      if (!insertErr && insertedData?.id) {
        setEvents((prev) =>
          prev.map((e) => (e.id === newEventId ? { ...e, dbId: insertedData.id } : e))
        );
      }

      // Also update running scores in fixtures table immediately
      const nextHome = calculatedScore.home + (selectedAction === 'goal' ? (selectedGoalType === 'own_goal' ? (selectedTeam === 'away' ? 1 : 0) : (selectedTeam === 'home' ? 1 : 0)) : 0);
      const nextAway = calculatedScore.away + (selectedAction === 'goal' ? (selectedGoalType === 'own_goal' ? (selectedTeam === 'home' ? 1 : 0) : (selectedTeam === 'away' ? 1 : 0)) : 0);

      await supabase
        .from('fixtures')
        .update({
          score_home: nextHome,
          score_away: nextAway,
        })
        .eq('id', match.id);
    } catch (dbErr) {
      console.warn('Immediate database event sync notice:', dbErr);
    }
  };

  const handleRemoveEvent = async (id: string) => {
    const target = events.find((e) => e.id === id);
    setEvents((prev) => prev.filter((e) => e.id !== id));

    if (target?.dbId) {
      try {
        await supabase.from('match_events').delete().eq('id', target.dbId);
      } catch (err) {
        console.warn('Event removal DB sync note:', err);
      }
    }
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

    setIsConfirmSubmitOpen(false);
    onClose();
  };

  if (!isOpen) return null;

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

          {/* SECTION 2: VERTICAL TIMELINE STYLE (RESTORED PREVIOUS TIMELINE) */}
          <div className="bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#14263b] pb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#ff0046]" />
                Match Events Timeline ({events.length})
              </span>
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                Chronological Minute Ordering
              </span>
            </div>

            {/* Vertical Timeline Body */}
            {events.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Clock className="w-7 h-7 mx-auto text-slate-400 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No match events registered yet.
                </p>
                <p className="text-[11px] text-slate-400">
                  Click "+ Add Event" below to log goals, cautions, dismissals, or substitutions.
                </p>
              </div>
            ) : (
              <div className="relative py-3">
                {/* Center Spine Line */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-200 dark:bg-slate-700" />

                {/* Event Rows */}
                <div className="space-y-3 relative z-10">
                  {events.map((evt) => {
                    const isHome = evt.teamTarget === 'home';

                    return (
                      <div
                        key={evt.id}
                        className="grid grid-cols-[1fr_60px_1fr] items-center gap-2 group"
                      >
                        {/* LEFT COLUMN: HOME EVENT */}
                        <div className="flex items-center justify-end pr-2">
                          {isHome && (
                            <div className="flex items-center gap-2 bg-white dark:bg-[#0c1825] border border-slate-200 dark:border-[#1a2e45] p-2 sm:p-2.5 rounded-md shadow-2xs max-w-full">
                              <button
                                type="button"
                                onClick={() => handleRemoveEvent(evt.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                                title="Remove event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div className="text-right">
                                <div className="flex items-center justify-end gap-1.5 font-black text-xs text-slate-900 dark:text-white">
                                  <span>{evt.playerName}</span>
                                  <span>
                                    {evt.type === 'goal' ? '⚽' : evt.type === 'yellow' ? '🟨' : evt.type === 'red' ? '🟥' : '🔄'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 block">
                                  {evt.type === 'goal'
                                    ? `Goal (${evt.goalType || 'Open Play'})`
                                    : evt.type === 'yellow'
                                    ? 'Yellow Card'
                                    : evt.type === 'red'
                                    ? 'Red Card'
                                    : `Sub: ${evt.subPlayerInName || 'Player In'}`}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CENTER COLUMN: MINUTE BADGE */}
                        <div className="flex justify-center">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-[#0c1825] border-2 border-[#ff0046] text-[#ff0046] flex items-center justify-center font-mono font-black text-xs shadow-xs z-20">
                            {evt.minute}'
                          </div>
                        </div>

                        {/* RIGHT COLUMN: AWAY EVENT */}
                        <div className="flex items-center justify-start pl-2">
                          {!isHome && (
                            <div className="flex items-center gap-2 bg-white dark:bg-[#0c1825] border border-slate-200 dark:border-[#1a2e45] p-2 sm:p-2.5 rounded-md shadow-2xs max-w-full">
                              <div className="text-left">
                                <div className="flex items-center gap-1.5 font-black text-xs text-slate-900 dark:text-white">
                                  <span>
                                    {evt.type === 'goal' ? '⚽' : evt.type === 'yellow' ? '🟨' : evt.type === 'red' ? '🟥' : '🔄'}
                                  </span>
                                  <span>{evt.playerName}</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 block">
                                  {evt.type === 'goal'
                                    ? `Goal (${evt.goalType || 'Open Play'})`
                                    : evt.type === 'yellow'
                                    ? 'Yellow Card'
                                    : evt.type === 'red'
                                    ? 'Red Card'
                                    : `Sub: ${evt.subPlayerInName || 'Player In'}`}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveEvent(evt.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                                title="Remove event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* "+ ADD EVENT" BUTTON AT THE BOTTOM OF THE TIMELINE */}
            <div className="pt-2 flex justify-center border-t border-slate-200 dark:border-[#14263b]">
              <button
                type="button"
                onClick={() => setIsAddEventModalOpen(true)}
                className="px-4 py-2 rounded-md bg-slate-900 dark:bg-[#152a40] hover:bg-[#ff0046] dark:hover:bg-[#ff0046] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Event</span>
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR: SUBMIT MATCH REPORT (FT) IN THE MIDDLE HORIZONTALLY */}
        <div className="p-4 border-t border-slate-200 dark:border-[#182e47] bg-slate-50 dark:bg-[#09131d] flex items-center justify-center">
          <button
            type="button"
            onClick={() => setIsConfirmSubmitOpen(true)}
            disabled={isSubmitting}
            className="px-8 py-3 rounded-md bg-[#00b04f] hover:bg-[#009b45] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Submit Match Report (FT)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SECOND MODULE POPUP: SMART MATCH EVENT HIERARCHY MODAL                    */}
        {/* Closes on X, Cancel, or Add Event. Clear directions and player substitutes */}
        {/* ========================================================================= */}
        {isAddEventModalOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs animate-fadeIn select-none"
            onClick={() => setIsAddEventModalOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative w-full max-w-lg bg-white dark:bg-[#0e1e2d] border border-slate-300 dark:border-[#1e3857] rounded-xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#182e47] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#ff0046]/10 border border-[#ff0046]/30 flex items-center justify-center text-[#ff0046]">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                      Log Match Event
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Smart Decision Hierarchy (No Default Assumptions)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Steps */}
              <div className="space-y-4 text-xs">
                {/* STEP 1: SELECT TEAM */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Step 1: Select the team to add the event <span className="text-[#ff0046]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeam('home');
                        setSelectedPlayerId('');
                        setSelectedSubPlayerInId('');
                      }}
                      className={`p-2.5 rounded-md border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedTeam === 'home'
                          ? 'bg-[#ff0046]/10 border-[#ff0046] text-[#ff0046] font-black ring-1 ring-[#ff0046]'
                          : 'bg-slate-50 dark:bg-[#0c1825] border-slate-200 dark:border-[#1a2e45] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={match.teamA.logo} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                        <span className="truncate font-bold">{match.teamA.name}</span>
                      </div>
                      {selectedTeam === 'home' && <CheckCircle2 className="w-4 h-4 text-[#ff0046]" shrink-0 />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeam('away');
                        setSelectedPlayerId('');
                        setSelectedSubPlayerInId('');
                      }}
                      className={`p-2.5 rounded-md border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedTeam === 'away'
                          ? 'bg-[#ff0046]/10 border-[#ff0046] text-[#ff0046] font-black ring-1 ring-[#ff0046]'
                          : 'bg-slate-50 dark:bg-[#0c1825] border-slate-200 dark:border-[#1a2e45] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={match.teamB.logo} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                        <span className="truncate font-bold">{match.teamB.name}</span>
                      </div>
                      {selectedTeam === 'away' && <CheckCircle2 className="w-4 h-4 text-[#ff0046]" shrink-0 />}
                    </button>
                  </div>
                </div>

                {/* STEP 2: SELECT EVENT TYPE */}
                <div className={!selectedTeam ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Step 2: Select Event Type <span className="text-[#ff0046]">*</span>
                  </label>
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
                        className={`p-2 rounded-md border text-center transition-all cursor-pointer ${
                          selectedAction === act.id
                            ? 'bg-[#152a40] text-white border-[#ff0046] font-black ring-1 ring-[#ff0046]'
                            : 'bg-slate-50 dark:bg-[#0c1825] border-slate-200 dark:border-[#1a2e45] text-slate-700 dark:text-slate-300 font-bold'
                        }`}
                      >
                        <span className="text-base block mb-0.5">{act.icon}</span>
                        <span className="text-[11px]">{act.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* STEP 3: GOAL TYPE (If Goal is chosen) */}
                {selectedAction === 'goal' && (
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Step 3: Select Goal Type <span className="text-[#ff0046]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'open_play', label: 'Open Play' },
                        { id: 'penalty', label: 'Penalty Kick' },
                        { id: 'free_kick', label: 'Direct Free Kick' },
                        { id: 'own_goal', label: 'Own Goal' },
                      ].map((gt) => (
                        <button
                          key={gt.id}
                          type="button"
                          onClick={() => setSelectedGoalType(gt.id as any)}
                          className={`p-2 rounded-md border text-center text-xs font-bold transition-all cursor-pointer ${
                            selectedGoalType === gt.id
                              ? 'bg-emerald-600 text-white border-emerald-700 font-black'
                              : 'bg-slate-50 dark:bg-[#0c1825] border-slate-200 dark:border-[#1a2e45] text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {gt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: MINUTE SELECTION (No Default) */}
                <div className={!selectedAction || (selectedAction === 'goal' && !selectedGoalType) ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Step 4: Enter Match Minute (1 — 120, No Default) <span className="text-[#ff0046]">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={minuteInput}
                      onChange={(e) => setMinuteInput(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-36 p-2 rounded-md bg-slate-50 dark:bg-[#0c1825] border border-slate-300 dark:border-[#223b56] font-mono text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#ff0046] focus:outline-none"
                    />
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {[15, 30, 45, 60, 75, 90].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMinuteInput(String(m))}
                          className="px-2 py-1 rounded bg-slate-200 dark:bg-[#152a40] text-[10px] font-bold font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-[#1e3857] cursor-pointer"
                        >
                          {m}'
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* STEP 5: SELECT PLAYER (STARTERS AND SUBSTITUTES INCLUDED) */}
                <div className={!isMinuteValid ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Step 5: Select Player (Starters & Substitutes Included) <span className="text-[#ff0046]">*</span>
                  </label>

                  {!isMinuteValid ? (
                    <div className="p-2.5 rounded-md bg-slate-100 dark:bg-[#0c1825] border border-slate-200 dark:border-[#1a2e45] text-slate-400 text-xs italic">
                      Please enter the match minute in Step 4 to unlock player roster selection.
                    </div>
                  ) : selectedAction === 'substitution' ? (
                    /* Substitution: Select Out (Starter) and In (Substitute) */
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-rose-500 uppercase block mb-1">
                          Player Coming Off (Starting XI)
                        </span>
                        <select
                          value={selectedPlayerId}
                          onChange={(e) => setSelectedPlayerId(e.target.value)}
                          className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#0c1825] border border-slate-300 dark:border-[#223b56] text-xs font-bold text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none"
                        >
                          <option value="">-- Select Starter Coming Off --</option>
                          {activeStarters.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.jerseyNumber || '-'} {p.name} ({p.position || 'Starting XI'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase block mb-1">
                          Substitute Coming On (Bench)
                        </span>
                        <select
                          value={selectedSubPlayerInId}
                          onChange={(e) => setSelectedSubPlayerInId(e.target.value)}
                          className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#0c1825] border border-slate-300 dark:border-[#223b56] text-xs font-bold text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none"
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
                    /* Goal or Card: Dropdown showing Starters and Substitutes */
                    <select
                      value={selectedPlayerId}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#0c1825] border border-slate-300 dark:border-[#223b56] text-xs font-bold text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none"
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

              {/* Bottom Actions for Event Hierarchy Modal */}
              <div className="pt-3 border-t border-slate-200 dark:border-[#182e47] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-slate-200 dark:bg-[#152a40] hover:bg-slate-300 dark:hover:bg-[#1e3857] text-slate-700 dark:text-slate-200 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>

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
                  className="px-5 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Event</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBMIT CONFIRMATION POPUP MODAL (If no events, explicitly says 0 - 0)      */}
        {/* ========================================================================= */}
        {isConfirmSubmitOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn select-none"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="bg-white dark:bg-[#0e1e2d] border border-slate-300 dark:border-[#1a2e45] rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 text-slate-900 dark:text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-rose-500 dark:text-[#ff0046] border-b border-slate-100 dark:border-[#14263b] pb-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <h3 className="font-black text-sm uppercase tracking-wider">
                  {events.length === 0 ? 'Confirm End Match (0 — 0)' : 'Confirm Official Match Report (FT)'}
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                {events.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      No match events have been logged for this fixture.
                    </p>
                    <div className="p-3 bg-slate-100 dark:bg-[#102237] rounded-md font-mono text-center text-sm font-black text-slate-900 dark:text-white">
                      {match.teamA.name} 0 — 0 {match.teamB.name}
                    </div>
                    <p className="text-amber-600 dark:text-amber-400 font-semibold">
                      The match will be finalized and confirmed as <strong>0 — 0 (Full Time)</strong> in official league standings.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Are you sure you want to finalize this match with {events.length} recorded events?
                    </p>
                    <div className="p-3 bg-slate-100 dark:bg-[#102237] rounded-md font-mono text-center text-sm font-black text-slate-900 dark:text-white">
                      {match.teamA.name} {calculatedScore.home} — {calculatedScore.away} {match.teamB.name}
                    </div>
                    <p className="text-amber-600 dark:text-amber-400 font-semibold">
                      Once submitted, the match status will be locked as <strong>Full Time (FT)</strong>.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#14263b]">
                <button
                  type="button"
                  onClick={() => setIsConfirmSubmitOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md bg-slate-200 dark:bg-[#152a40] hover:bg-slate-300 dark:hover:bg-[#1e3857] text-slate-700 dark:text-slate-200 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSubmitFT}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-md bg-[#00b04f] hover:bg-[#009b45] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & End Match (FT)'}
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
