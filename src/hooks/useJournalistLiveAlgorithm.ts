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

  const refreshState = useCallback(async () => {
    if (!matchUid) return;
    try {
      const loadedMatch = await matchRepository.getMatch(matchUid);
      setMatch(loadedMatch);

      const loadedSquads = await matchRepository.getSquads(matchUid);
      setSquads(loadedSquads);

      const loadedState = await matchRepository.getLiveState(matchUid);
      setLiveState(loadedState);
    } catch (err: any) {
      console.error('Error refreshing journalist live state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [matchUid]);

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
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, refreshState]);

  const setPeriod = useCallback(async (period: Period) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
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
  }) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
    try {
      const event = await matchLiveEngine.journalistAddGoal({
        match_uid: matchUid,
        journalist_uid: journalistUid,
        team_uid: input.team_uid,
        goal_type: input.goal_type,
        minute: input.minute,
        period: input.period || (liveState?.period ?? undefined),
        idempotency_key: crypto.randomUUID(),
      });
      await refreshState();
      return event;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to add goal.';
      setEngineError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, journalistUid, liveState?.period, refreshState]);

  const addCard = useCallback(async (input: {
    team_uid: UID;
    card_type: CardType;
    minute?: number;
    period?: Period;
  }) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
    try {
      const event = await matchLiveEngine.journalistAddCard({
        match_uid: matchUid,
        journalist_uid: journalistUid,
        team_uid: input.team_uid,
        card_type: input.card_type,
        minute: input.minute,
        period: input.period || (liveState?.period ?? undefined),
        idempotency_key: crypto.randomUUID(),
      });
      await refreshState();
      return event;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to add card.';
      setEngineError(msg);
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
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, journalistUid, refreshState]);

  return {
    match,
    liveState,
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
