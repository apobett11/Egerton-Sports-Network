import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  Plus,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Radio,
  Loader2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  matchRepository,
  syncMatchEventsAndScores,
  type MatchEvent,
  type MatchSquad,
  type SquadPlayer,
  type EventType,
  type GoalType,
  type CardType,
  type Period,
  type Match,
} from '../../services/matchLiveEngineAdapter';

export interface MatchEventsDetailViewProps {
  matchId: string;
  canEdit?: boolean;
  role?: 'guest' | 'journalist' | 'referee' | 'admin';
  actorUid?: string;
  initialMatch?: any;
  onSuccess?: () => void;
  onMatchUpdated?: (updatedMatch: any) => void;
}

export const MatchEventsDetailView: React.FC<MatchEventsDetailViewProps> = ({
  matchId,
  canEdit = false,
  role = 'guest',
  actorUid = 'user-1',
  initialMatch,
  onSuccess,
  onMatchUpdated,
}) => {
  // --- Data State ---
  const [matchData, setMatchData] = useState<any>(initialMatch || null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [squads, setSquads] = useState<MatchSquad[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- Mini Popup State ---
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedTeamUid, setSelectedTeamUid] = useState<string>('');
  const [eventType, setEventType] = useState<EventType>('GOAL');
  const [goalType, setGoalType] = useState<GoalType>('TAP_IN');
  const [cardType, setCardType] = useState<CardType>('YELLOW');
  const [minuteInput, setMinuteInput] = useState<string>('1');
  const [playerUid, setPlayerUid] = useState<string>('');
  const [assistPlayerUid, setAssistPlayerUid] = useState<string>('');
  const [subOutPlayerUid, setSubOutPlayerUid] = useState<string>('');
  const [customDetail, setCustomDetail] = useState<string>('');

  // 1. Fetch Complete Match, Squads, and Events by Match UID
  const fetchMatchAndEvents = useCallback(async () => {
    if (!matchId) return;
    try {
      // 1.1 Fetch Fixture Record by UID
      const { data: fixData, error: fixErr } = await supabase
        .from('fixtures')
        .select(`
          id,
          status,
          scheduled_time,
          score_home,
          score_away,
          venue,
          matchday,
          competition:competitions(id, name),
          team_home:teams!home_team_id(id, name, short_name, logo_url, color_code),
          team_away:teams!away_team_id(id, name, short_name, logo_url, color_code)
        `)
        .eq('id', matchId)
        .maybeSingle();

      if (!fixErr && fixData) {
        setMatchData({
          id: fixData.id,
          status: fixData.status,
          scheduledTime: fixData.scheduled_time,
          scoreA: fixData.score_home ?? 0,
          scoreB: fixData.score_away ?? 0,
          venue: fixData.venue || 'Pavilion Stadium',
          matchday: fixData.matchday || 1,
          competition: (fixData.competition as any)?.name || 'Egerton Premier League',
          teamA: {
            id: (fixData.team_home as any)?.id || 'home-1',
            name: (fixData.team_home as any)?.name || 'Home Team',
            shortName: (fixData.team_home as any)?.short_name || 'HOM',
            logo: (fixData.team_home as any)?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
            colorCode: (fixData.team_home as any)?.color_code || '#D4AF37',
          },
          teamB: {
            id: (fixData.team_away as any)?.id || 'away-1',
            name: (fixData.team_away as any)?.name || 'Away Team',
            shortName: (fixData.team_away as any)?.short_name || 'AWY',
            logo: (fixData.team_away as any)?.logo_url || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
            colorCode: (fixData.team_away as any)?.color_code || '#2563EB',
          },
        });
      }

      // 1.2 Fetch Squads for Player Selection
      const loadedSquads = await matchRepository.getSquads(matchId);
      setSquads(loadedSquads);

      // 1.3 Fetch Live Events from Database using Match UID
      const loadedEvents = await matchRepository.getLiveEvents(matchId);
      setEvents(loadedEvents);
    } catch (err: any) {
      console.error('Error fetching match events detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatchAndEvents();
  }, [fetchMatchAndEvents]);

  // 2. Realtime Database Subscription by Match UID
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`match-events-live-${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures', filter: `id=eq.${matchId}` },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as any;
            setMatchData((prev: any) => ({
              ...prev,
              scoreA: updated.score_home ?? prev?.scoreA ?? 0,
              scoreB: updated.score_away ?? prev?.scoreB ?? 0,
              status: updated.status ?? prev?.status,
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_live_events', filter: `match_uid=eq.${matchId}` },
        () => {
          fetchMatchAndEvents();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_events', filter: `fixture_id=eq.${matchId}` },
        () => {
          fetchMatchAndEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, fetchMatchAndEvents]);

  // Team UIDs
  const homeTeamUid = matchData?.teamA?.id || 'home-1';
  const awayTeamUid = matchData?.teamB?.id || 'away-1';

  // Set default selected team when modal opens
  useEffect(() => {
    if (homeTeamUid && !selectedTeamUid) {
      setSelectedTeamUid(homeTeamUid);
    }
  }, [homeTeamUid, selectedTeamUid]);

  // Squads for currently selected team in popup
  const homeSquad: SquadPlayer[] = squads.find((s) => s.team_uid === homeTeamUid)?.players || [];
  const awaySquad: SquadPlayer[] = squads.find((s) => s.team_uid === awayTeamUid)?.players || [];
  const currentTeamSquad: SquadPlayer[] = selectedTeamUid === homeTeamUid ? homeSquad : awaySquad;

  // Active events sorted chronologically by minute ascending
  const chronologicalEvents = useMemo(() => {
    return [...events]
      .filter((e) => e.status === 'ACTIVE')
      .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
  }, [events]);

  // Derived Scores
  const derivedScore = useMemo(() => {
    let home = 0;
    let away = 0;
    for (const ev of chronologicalEvents) {
      if (ev.type === 'GOAL') {
        if (ev.team_uid === homeTeamUid) home += 1;
        if (ev.team_uid === awayTeamUid) away += 1;
      }
    }
    return {
      home: matchData ? home : (matchData?.scoreA ?? home),
      away: matchData ? away : (matchData?.scoreB ?? away),
    };
  }, [chronologicalEvents, homeTeamUid, awayTeamUid, matchData]);

  // Match Minute string calculation
  const matchMinuteDisplay = useMemo(() => {
    if (!matchData) return '—';
    const status = matchData.status;
    if (status === 'LIVE') return '65\'';
    if (status === 'HT' || status === 'HALF_TIME') return '45\' (HT)';
    if (status === 'FT' || status === 'FINALIZED') return '90\' (FT)';
    if (status === 'CANCELLED') return 'CANCELLED';
    if (status === 'WALKOVER') return 'WALKOVER';
    return matchData.scheduledTime ? new Date(matchData.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'UPCOMING';
  }, [matchData]);

  // Open Mini Popup
  const handleOpenAddModal = () => {
    setSelectedTeamUid(homeTeamUid);
    setEventType('GOAL');
    setGoalType('TAP_IN');
    setCardType('YELLOW');
    setPlayerUid('');
    setAssistPlayerUid('');
    setSubOutPlayerUid('');
    setCustomDetail('');
    setMinuteInput('1');
    setIsAddModalOpen(true);
  };

  // Add Event Handler (local add & auto-arranged by minute)
  const handleConfirmAddEvent = () => {
    const min = parseInt(minuteInput, 10);
    if (isNaN(min) || min < 0 || min > 130) {
      setFeedback({ type: 'error', message: 'Please enter a valid minute between 0 and 130.' });
      return;
    }

    const selectedPlayer = currentTeamSquad.find((p) => p.player_uid === playerUid);
    const newEventUid = crypto.randomUUID();

    const newEvent: MatchEvent = {
      event_uid: newEventUid,
      match_uid: matchId,
      team_uid: selectedTeamUid,
      player_uid: playerUid || null,
      player_number: selectedPlayer?.jersey_number || null,
      type: eventType,
      goal_type: eventType === 'GOAL' ? goalType : undefined,
      card_type: eventType === 'CARD' ? cardType : undefined,
      minute: min,
      period: min <= 45 ? 'FIRST_HALF' : 'SECOND_HALF',
      status: 'ACTIVE',
      created_by_role: role === 'referee' ? 'REFEREE' : 'JOURNALIST',
      created_by_uid: actorUid,
      idempotency_key: `evt_${newEventUid}`,
      derived_red: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as MatchEvent;

    // Automatically inserted and arranged by minute in the state
    setEvents((prev) => {
      const updated = [...prev, newEvent];
      return updated.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
    });

    setIsAddModalOpen(false);
    setFeedback({
      type: 'success',
      message: `Event added at minute ${min}'! Remember to click "Publish / Save" to sync with the database.`,
    });
  };

  // Remove Event Handler
  const handleRemoveEvent = (eventUid: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.event_uid === eventUid ? { ...e, status: 'CANCELLED' } : e))
    );
    setFeedback({
      type: 'success',
      message: 'Event removed locally. Click "Publish / Save" to persist changes.',
    });
  };

  // Publish / Save to Database using Match UID
  const handlePublishSave = async () => {
    if (!matchId) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const newScore = await syncMatchEventsAndScores(
        matchId,
        events,
        role === 'referee' ? 'REFEREE' : 'JOURNALIST',
        actorUid
      );

      setMatchData((prev: any) => ({
        ...prev,
        scoreA: newScore.home_score,
        scoreB: newScore.away_score,
      }));

      setFeedback({
        type: 'success',
        message: `Published successfully to database! Match Score updated to ${newScore.home_score} - ${newScore.away_score}.`,
      });

      if (onMatchUpdated) {
        onMatchUpdated({
          ...matchData,
          scoreA: newScore.home_score,
          scoreB: newScore.away_score,
          events,
        });
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Failed to save to database: ${err.message || 'Unknown error'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to find player display name
  const getPlayerLabel = (teamUid: string, pUid?: string | null, pNum?: number | null) => {
    if (!pUid) return pNum ? `Player #${pNum}` : 'Player';
    const squad = teamUid === homeTeamUid ? homeSquad : awaySquad;
    const p = squad.find((item) => item.player_uid === pUid);
    if (p) return `${p.display_name} (#${p.jersey_number})`;
    return pNum ? `Player #${pNum}` : 'Player';
  };

  if (isLoading && !matchData) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff0046]" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading match events by UID...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-fadeIn">
      {/* 1. MATCH DETAIL HEADER: TEAMS, SCORE & MINUTE AT THE MIDDLE */}
      <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-24 bg-[#ff0046]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Context Bar */}
        <div className="flex items-center justify-between border-b border-[#f0f2f5] dark:border-[#16283d] pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase text-slate-900 dark:text-white">
              {matchData?.competition || 'Egerton League'}
            </span>
            <span className="text-slate-400">• Round {matchData?.matchday || 1}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              📍 {matchData?.venue || 'Egerton Pavilion'}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                matchData?.status === 'LIVE'
                  ? 'bg-rose-500/15 text-[#ff0046] border border-rose-500/30 animate-pulse'
                  : matchData?.status === 'FT'
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {matchData?.status === 'LIVE' ? '● LIVE' : matchData?.status || 'UPCOMING'}
            </span>
          </div>
        </div>

        {/* Teams & Center Minute Grid */}
        <div className="grid grid-cols-11 items-center pt-5 pb-2 gap-2">
          {/* HOME TEAM (Left) */}
          <div className="col-span-4 flex items-center justify-end gap-3 text-right">
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {matchData?.teamA?.name || 'Home Team'}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {matchData?.teamA?.shortName || 'HOME'}
              </span>
            </div>
            <img
              src={matchData?.teamA?.logo}
              alt={matchData?.teamA?.name}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border border-[#e6e8ec] dark:border-[#1a2e45] shrink-0 shadow-xs"
            />
          </div>

          {/* SCORE & MINUTE AT THE MIDDLE */}
          <div className="col-span-3 flex flex-col items-center justify-center text-center px-1">
            {/* Score */}
            <div className="font-mono font-black text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>{derivedScore.home}</span>
              <span className="text-slate-300 dark:text-slate-600 text-xl sm:text-2xl">-</span>
              <span>{derivedScore.away}</span>
            </div>

            {/* Match Minute at the middle */}
            <div className="mt-1 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/20 text-xs font-mono font-black shadow-xs">
              {matchData?.status === 'LIVE' && (
                <span className="w-2 h-2 rounded-full bg-[#ff0046] animate-ping inline-block" />
              )}
              <Clock className="w-3.5 h-3.5 text-[#ff0046]" />
              <span>{matchMinuteDisplay}</span>
            </div>
          </div>

          {/* AWAY TEAM (Right) */}
          <div className="col-span-4 flex items-center justify-start gap-3 text-left">
            <img
              src={matchData?.teamB?.logo}
              alt={matchData?.teamB?.name}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border border-[#e6e8ec] dark:border-[#1a2e45] shrink-0 shadow-xs"
            />
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {matchData?.teamB?.name || 'Away Team'}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {matchData?.teamB?.shortName || 'AWAY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK ALERTS */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. CHRONOLOGICAL TIMELINE: MINUTE IN THE MIDDLE, NON-OVERLAPPING ROWS FOR EACH SIDE */}
      <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-2xl overflow-hidden shadow-xs">
        {/* Timeline Top Banner */}
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between text-xs">
          <span className="font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
            MATCH EVENTS TIMELINE ({chronologicalEvents.length})
          </span>
          <span className="text-[11px] font-mono text-slate-400 font-bold">
            Automated Minute Sequencing
          </span>
        </div>

        {chronologicalEvents.length === 0 ? (
          <div className="p-10 text-center space-y-2 text-slate-400">
            <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              No match events registered yet.
            </p>
            <p className="text-[11px] text-slate-400">
              {canEdit
                ? 'Click "+ Add Event" below to log goals, cautions, or substitutions in a mini popup.'
                : 'Live events will appear here chronologically as the referee and journalists update the game.'}
            </p>
          </div>
        ) : (
          <div className="relative py-4">
            {/* Center Spine Line */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-200 dark:bg-slate-800" />

            <div className="space-y-3">
              {chronologicalEvents.map((evt, idx) => {
                const isHome = evt.team_uid === homeTeamUid;
                const playerName = getPlayerLabel(evt.team_uid, evt.player_uid, evt.player_number);

                // Event Badge renderer
                const renderEventBadge = () => {
                  if (evt.type === 'GOAL') {
                    return (
                      <div className="flex items-center gap-1.5 font-black text-xs text-slate-900 dark:text-white">
                        <span className="text-base leading-none">⚽</span>
                        <div className="flex flex-col">
                          <span className="font-extrabold">{playerName}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            Goal ({evt.goal_type || 'Open Play'})
                          </span>
                        </div>
                      </div>
                    );
                  }
                  if (evt.type === 'CARD') {
                    const isRed = evt.card_type === 'RED' || evt.derived_red;
                    return (
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span
                          className={`w-3 h-4 rounded-xs inline-block shrink-0 shadow-xs ${
                            isRed ? 'bg-[#d32f2f]' : 'bg-[#fbc02d]'
                          }`}
                        />
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {playerName}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              isRed ? 'text-rose-600' : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {isRed ? 'Red Card' : 'Yellow Card'}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  if (evt.type === 'INJURY') {
                    return (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-base leading-none">🩹</span>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {playerName}
                          </span>
                          <span className="text-[10px] text-sky-500 font-bold">Injury Treated</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <span className="text-base leading-none">🔄</span>
                      <div className="flex flex-col">
                        <span className="font-extrabold">{playerName}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{evt.type}</span>
                      </div>
                    </div>
                  );
                };

                return (
                  /* 3-Column Non-Overlapping Row */
                  <div
                    key={evt.event_uid || idx}
                    className="grid grid-cols-[1fr_64px_1fr] items-center gap-2 px-3 py-1 relative z-10 group"
                  >
                    {/* LEFT COLUMN: HOME EVENT */}
                    <div className="flex items-center justify-end pr-3">
                      {isHome && (
                        <div className="flex items-center gap-2 bg-[#f8f9fa] dark:bg-[#122336] p-2 rounded-xl border border-[#e6e8ec] dark:border-[#1a2e45] shadow-xs max-w-full">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEvent(evt.event_uid)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                              title="Delete event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className="text-right">{renderEventBadge()}</div>
                        </div>
                      )}
                    </div>

                    {/* MIDDLE COLUMN: MINUTE BADGE */}
                    <div className="flex justify-center">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-[#0e1c2b] border-2 border-[#ff0046] text-[#ff0046] flex items-center justify-center font-mono font-black text-xs shadow-xs z-20">
                        {evt.minute !== null && evt.minute !== undefined ? `${evt.minute}'` : "—'"}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: AWAY EVENT */}
                    <div className="flex items-center justify-start pl-3">
                      {!isHome && (
                        <div className="flex items-center gap-2 bg-[#f8f9fa] dark:bg-[#122336] p-2 rounded-xl border border-[#e6e8ec] dark:border-[#1a2e45] shadow-xs max-w-full">
                          <div className="text-left">{renderEventBadge()}</div>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEvent(evt.event_uid)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                              title="Delete event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. BOTTOM ACTIONS: "+ ADD EVENT" & "PUBLISH / SAVE" BUTTONS (FOR JOURNALIST & REFEREE) */}
        {canEdit && (
          <div className="p-4 bg-[#f8f9fa] dark:bg-[#112236] border-t border-[#e6e8ec] dark:border-[#1a2e45] flex flex-wrap items-center justify-end gap-3">
            {/* BUTTON 1: ADD EVENT (MINI POPUP) */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>

            {/* BUTTON 2: PUBLISH / SAVE */}
            <button
              type="button"
              onClick={handlePublishSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff0046] to-rose-600 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving to Database...' : 'Publish / Save'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. MINI POPUP MODAL: INPUT EVENT DETAILS */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#121827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff0046]" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Add Match Event
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Field 1: Team Selection (Home vs Away) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                  Select Team
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(homeTeamUid)}
                    className={`p-2.5 rounded-xl font-extrabold border text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedTeamUid === homeTeamUid
                        ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <img
                      src={matchData?.teamA?.logo}
                      alt="Home"
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="truncate">{matchData?.teamA?.name || 'Home'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTeamUid(awayTeamUid)}
                    className={`p-2.5 rounded-xl font-extrabold border text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedTeamUid === awayTeamUid
                        ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <img
                      src={matchData?.teamB?.logo}
                      alt="Away"
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="truncate">{matchData?.teamB?.name || 'Away'}</span>
                  </button>
                </div>
              </div>

              {/* Field 2: Event Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                  Event Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'GOAL', icon: '⚽', label: 'Goal' },
                    { type: 'CARD', icon: '🟨', label: 'Card' },
                    { type: 'INJURY', icon: '🩹', label: 'Injury' },
                  ].map((btn) => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => setEventType(btn.type as EventType)}
                      className={`p-2 rounded-xl font-extrabold border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        eventType === btn.type
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{btn.icon}</span>
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Specific Subtype (Goal Type / Card Type) */}
              {eventType === 'GOAL' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Goal Method
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="TAP_IN">Open Play (Tap-in / Standard)</option>
                    <option value="HEADER">Header</option>
                    <option value="PENALTY">Penalty Kick</option>
                    <option value="FREE_KICK">Direct Free Kick</option>
                    <option value="SCREAMER">Long Range (Screamer)</option>
                    <option value="OTHER">Other / Own Goal</option>
                  </select>
                </div>
              )}

              {eventType === 'CARD' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Card Sanction
                  </label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as CardType)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="YELLOW">🟨 Yellow Card (Caution)</option>
                    <option value="SECOND_YELLOW">🟨 Second Yellow (Automatic Red)</option>
                    <option value="RED">🟥 Direct Red Card (Dismissal)</option>
                  </select>
                </div>
              )}

              {/* Field 4: Minute & Player */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Minute
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="130"
                    value={minuteInput}
                    onChange={(e) => setMinuteInput(e.target.value)}
                    placeholder="1"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 text-center"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Player (Squad)
                  </label>
                  <select
                    value={playerUid}
                    onChange={(e) => setPlayerUid(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Select Player --</option>
                    {currentTeamSquad.map((p) => (
                      <option key={p.player_uid} value={p.player_uid}>
                        #{p.jersey_number} {p.display_name} {p.is_starting_xi ? '(XI)' : '(Sub)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddEvent}
                className="px-5 py-2 rounded-xl bg-[#ff0046] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95"
              >
                Add to Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MatchEventsDetailView;
