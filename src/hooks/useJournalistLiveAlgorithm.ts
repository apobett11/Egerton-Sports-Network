import { useState, useEffect, useCallback } from 'react';
import {
  matchLiveEngine,
  matchRepository,
  matchPublisher,
  type UID,
  type Match,
  type MatchSquad,
  type MatchEvent,
  type LiveMatchState,
  type GoalType,
  type CardType,
  type Period,
  MatchEngineError,
} from '../services/matchLiveEngineAdapter';

export const useJournalistLiveAlgorithm = (
  matchUid: UID | undefined,
  journalistUid: UID = 'journalist-1'
) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [liveState, setLiveState] = useState<LiveMatchState | null>(null);
  const [squads, setSquads] = useState<MatchSquad[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [engineError, setEngineError] = useState<string | null>(null);

  // Helper for generating instant fallback squads when DB squads are loading
  const buildInstantSquads = useCallback((uid: string, homeId: string, awayId: string): MatchSquad[] => [
    {
      squad_uid: `squad_home_${uid}`,
      match_uid: uid,
      team_uid: homeId,
      players: Array.from({ length: 11 }, (_, i) => ({
        player_uid: `p_${homeId}_${i + 1}`,
        team_uid: homeId,
        jersey_number: i + 1,
        display_name: `Home Player #${i + 1}`,
        is_starting_xi: true,
        is_substitute: false,
        eligible_for_match: true,
      })),
    },
    {
      squad_uid: `squad_away_${uid}`,
      match_uid: uid,
      team_uid: awayId,
      players: Array.from({ length: 11 }, (_, i) => ({
        player_uid: `p_${awayId}_${i + 1}`,
        team_uid: awayId,
        jersey_number: i + 1,
        display_name: `Away Player #${i + 1}`,
        is_starting_xi: true,
        is_substitute: false,
        eligible_for_match: true,
      })),
    },
  ], []);

  const refreshState = useCallback(async () => {
    if (!matchUid) return;
    try {
      const loadedMatch = await matchRepository.getMatch(matchUid);
      setMatch(loadedMatch);

      const loadedSquads = await matchRepository.getSquads(matchUid);
      if (loadedSquads && loadedSquads.length > 0) {
        setSquads(loadedSquads);
      } else if (loadedMatch) {
        setSquads(buildInstantSquads(matchUid, loadedMatch.home_team_uid, loadedMatch.away_team_uid));
      }

      const loadedState = await matchRepository.getLiveState(matchUid);
      setLiveState(loadedState);
    } catch (err: any) {
      console.error('Error refreshing journalist live state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [matchUid, buildInstantSquads]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Subscribe to engine realtime publications
  useEffect(() => {
    if (!matchUid) return;
    const unsubscribe = matchPublisher.subscribe((update) => {
      if (update.match_uid === matchUid) {
        refreshState();
      }
    });
    return unsubscribe;
  }, [matchUid, refreshState]);

  const startMatch = useCallback(async (now?: string) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);

    // Optimistic start state
    setLiveState((prev) => ({
      match_uid: matchUid,
      status: 'LIVE',
      period: 'FIRST_HALF',
      home_score: prev?.home_score ?? 0,
      away_score: prev?.away_score ?? 0,
      active_events: prev?.active_events ?? [],
      event_sequence: (prev?.event_sequence ?? 0) + 1,
      version: (prev?.version ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }));

    try {
      const state = await matchLiveEngine.startMatch({
        match_uid: matchUid,
        now,
      });
      setLiveState(state);
      await refreshState();
      return state;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to start match.';
      setEngineError(msg);
      await refreshState();
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, refreshState]);

  const setPeriod = useCallback(async (period: Period) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);

    // Optimistic period transition
    setLiveState((prev) => ({
      match_uid: matchUid,
      status: period === 'FULL_TIME' ? 'FULL_TIME' : period === 'HALF_TIME' ? 'HALF_TIME' : 'LIVE',
      period,
      home_score: prev?.home_score ?? 0,
      away_score: prev?.away_score ?? 0,
      active_events: prev?.active_events ?? [],
      event_sequence: (prev?.event_sequence ?? 0) + 1,
      version: (prev?.version ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }));

    try {
      const state = await matchLiveEngine.journalistSetPeriod({
        match_uid: matchUid,
        journalist_uid: journalistUid,
        period,
        idempotency_key: crypto.randomUUID(),
      });
      setLiveState(state);
      await refreshState();
      return state;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to transition period.';
      setEngineError(msg);
      await refreshState();
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, journalistUid, refreshState]);

  const addGoal = useCallback(async (input: {
    team_uid: UID;
    goal_type: GoalType;
    minute?: number;
    period?: Period;
    player_uid?: UID | null;
    player_number?: number | null;
  }) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);

    // Optimistic local state update (0ms UI latency)
    const targetPeriod = input.period || (liveState?.period ?? 'FIRST_HALF');
    const optimisticEvent: MatchEvent = {
      event_uid: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      match_uid: matchUid,
      team_uid: input.team_uid,
      player_uid: input.player_uid || null,
      player_number: input.player_number || null,
      type: 'GOAL',
      goal_type: input.goal_type,
      card_type: undefined,
      minute: input.minute ?? (targetPeriod === 'SECOND_HALF' ? 46 : 1),
      period: targetPeriod,
      status: 'ACTIVE',
      created_by_role: 'JOURNALIST',
      created_by_uid: journalistUid,
      last_modified_by_role: 'JOURNALIST',
      last_modified_by_uid: journalistUid,
      injury_player_optional: false,
      idempotency_key: crypto.randomUUID(),
      derived_red: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLiveState((prev) => {
      const isHome = match ? input.team_uid === match.home_team_uid : true;
      const currentHome = prev?.home_score ?? 0;
      const currentAway = prev?.away_score ?? 0;
      const prevEvents = prev?.active_events ?? [];
      return {
        match_uid: matchUid,
        status: prev?.status ?? 'LIVE',
        period: targetPeriod,
        home_score: isHome ? currentHome + 1 : currentHome,
        away_score: !isHome ? currentAway + 1 : currentAway,
        active_events: [...prevEvents, optimisticEvent],
        event_sequence: (prev?.event_sequence ?? 0) + 1,
        version: (prev?.version ?? 0) + 1,
        updated_at: new Date().toISOString(),
      };
    });

    try {
      const event = await matchLiveEngine.journalistAddGoal({
        match_uid: matchUid,
        journalist_uid: journalistUid,
        team_uid: input.team_uid,
        goal_type: input.goal_type,
        minute: input.minute,
        period: input.period || (liveState?.period ?? undefined),
        player_uid: input.player_uid,
        player_number: input.player_number,
        idempotency_key: crypto.randomUUID(),
      });
      await refreshState();
      return event;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to add goal.';
      setEngineError(msg);
      await refreshState();
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, journalistUid, liveState?.period, match, refreshState]);

  const addCard = useCallback(async (input: {
    team_uid: UID;
    card_type: CardType;
    minute?: number;
    period?: Period;
    player_uid?: UID | null;
    player_number?: number | null;
  }) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);

    // Optimistic local state update (0ms UI latency)
    const targetPeriod = input.period || (liveState?.period ?? 'FIRST_HALF');
    const optimisticEvent: MatchEvent = {
      event_uid: `opt_card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      match_uid: matchUid,
      team_uid: input.team_uid,
      player_uid: input.player_uid || null,
      player_number: input.player_number || null,
      type: 'CARD',
      goal_type: undefined,
      card_type: input.card_type,
      minute: input.minute ?? (targetPeriod === 'SECOND_HALF' ? 46 : 1),
      period: targetPeriod,
      status: 'ACTIVE',
      created_by_role: 'JOURNALIST',
      created_by_uid: journalistUid,
      last_modified_by_role: 'JOURNALIST',
      last_modified_by_uid: journalistUid,
      injury_player_optional: false,
      idempotency_key: crypto.randomUUID(),
      derived_red: input.card_type === 'RED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLiveState((prev) => {
      const prevEvents = prev?.active_events ?? [];
      return {
        match_uid: matchUid,
        status: prev?.status ?? 'LIVE',
        period: targetPeriod,
        home_score: prev?.home_score ?? 0,
        away_score: prev?.away_score ?? 0,
        active_events: [...prevEvents, optimisticEvent],
        event_sequence: (prev?.event_sequence ?? 0) + 1,
        version: (prev?.version ?? 0) + 1,
        updated_at: new Date().toISOString(),
      };
    });

    try {
      const event = await matchLiveEngine.journalistAddCard({
        match_uid: matchUid,
        journalist_uid: journalistUid,
        team_uid: input.team_uid,
        card_type: input.card_type,
        minute: input.minute,
        period: input.period || (liveState?.period ?? undefined),
        player_uid: input.player_uid,
        player_number: input.player_number,
        idempotency_key: crypto.randomUUID(),
      });
      await refreshState();
      return event;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to add card.';
      setEngineError(msg);
      await refreshState();
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, journalistUid, liveState?.period, refreshState]);

  const addInjury = useCallback(async (input: {
    team_uid: UID;
    player_uid?: UID;
    minute?: number;
    period?: Period;
  }) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);

    // Optimistic local state update (0ms UI latency)
    const targetPeriod = input.period || (liveState?.period ?? 'FIRST_HALF');
    const optimisticEvent: MatchEvent = {
      event_uid: `opt_inj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      match_uid: matchUid,
      team_uid: input.team_uid,
      player_uid: input.player_uid || null,
      player_number: null,
      type: 'INJURY',
      minute: input.minute ?? (targetPeriod === 'SECOND_HALF' ? 46 : 1),
      period: targetPeriod,
      status: 'ACTIVE',
      created_by_role: 'JOURNALIST',
      created_by_uid: journalistUid,
      last_modified_by_role: 'JOURNALIST',
      last_modified_by_uid: journalistUid,
      injury_player_optional: true,
      idempotency_key: crypto.randomUUID(),
      derived_red: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLiveState((prev) => {
      const prevEvents = prev?.active_events ?? [];
      return {
        match_uid: matchUid,
        status: prev?.status ?? 'LIVE',
        period: targetPeriod,
        home_score: prev?.home_score ?? 0,
        away_score: prev?.away_score ?? 0,
        active_events: [...prevEvents, optimisticEvent],
        event_sequence: (prev?.event_sequence ?? 0) + 1,
        version: (prev?.version ?? 0) + 1,
        updated_at: new Date().toISOString(),
      };
    });

    try {
      const event = await matchLiveEngine.journalistAddInjury({
        match_uid: matchUid,
        journalist_uid: journalistUid,
        team_uid: input.team_uid,
        player_uid: input.player_uid,
        minute: input.minute,
        period: input.period || (liveState?.period ?? undefined),
        idempotency_key: crypto.randomUUID(),
      });
      await refreshState();
      return event;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to add injury.';
      setEngineError(msg);
      await refreshState();
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, journalistUid, liveState?.period, refreshState]);

  const updateEvent = useCallback(async (input: {
    event_uid: UID;
    goal_type?: GoalType;
    card_type?: CardType;
    player_uid?: UID | null;
    minute?: number | null;
    period?: Period | null;
  }) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
    try {
      const event = await matchLiveEngine.journalistUpdateEvent({
        match_uid: matchUid,
        journalist_uid: journalistUid,
        event_uid: input.event_uid,
        goal_type: input.goal_type,
        card_type: input.card_type,
        player_uid: input.player_uid,
        minute: input.minute,
        period: input.period,
        idempotency_key: crypto.randomUUID(),
      });
      await refreshState();
      return event;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to update event.';
      setEngineError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, journalistUid, refreshState]);

  const cancelEvent = useCallback(async (event_uid: UID) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);

    // Optimistic removal
    setLiveState((prev) => {
      if (!prev) return prev;
      const target = prev.active_events.find((e) => e.event_uid === event_uid);
      const isHomeGoal = target && target.type === 'GOAL' && match && target.team_uid === match.home_team_uid;
      const isAwayGoal = target && target.type === 'GOAL' && match && target.team_uid !== match.home_team_uid;

      return {
        ...prev,
        home_score: isHomeGoal ? Math.max(0, prev.home_score - 1) : prev.home_score,
        away_score: isAwayGoal ? Math.max(0, prev.away_score - 1) : prev.away_score,
        active_events: prev.active_events.filter((e) => e.event_uid !== event_uid),
        updated_at: new Date().toISOString(),
      };
    });

    try {
      await matchLiveEngine.journalistCancelEvent({
        match_uid: matchUid,
        journalist_uid: journalistUid,
        event_uid,
        idempotency_key: crypto.randomUUID(),
      });
      await refreshState();
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to cancel event.';
      setEngineError(msg);
      await refreshState();
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, journalistUid, match, refreshState]);

  return {
    match,
    liveState,
    setLiveState,
    squads,
    isLoading,
    isSubmitting,
    engineError,
    setEngineError,
    startMatch,
    setPeriod,
    addGoal,
    addCard,
    addInjury,
    updateEvent,
    cancelEvent,
    refreshState,
  };
};
