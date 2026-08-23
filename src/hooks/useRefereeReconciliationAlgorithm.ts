import { useState, useEffect, useCallback } from 'react';
import {
  matchLiveEngine,
  matchRepository,
  matchPublisher,
  type UID,
  type Match,
  type MatchSquad,
  type RefereeWorkingSet,
  type CanonicalPermanentResult,
  type EventType,
  type GoalType,
  type CardType,
  type Period,
  MatchEngineError,
} from '../services/matchLiveEngineAdapter';

export const useRefereeReconciliationAlgorithm = (
  matchUid: UID | undefined,
  refereeUid: UID = 'referee-1'
) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [workingSet, setWorkingSet] = useState<RefereeWorkingSet | null>(null);
  const [canonicalResult, setCanonicalResult] = useState<CanonicalPermanentResult | null>(null);
  const [squads, setSquads] = useState<MatchSquad[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    if (!matchUid) return;
    try {
      const loadedMatch = await matchRepository.getMatch(matchUid);
      setMatch(loadedMatch);

      const loadedSquads = await matchRepository.getSquads(matchUid);
      setSquads(loadedSquads);

      const ws = await matchRepository.getRefereeWorkingSet(matchUid);
      setWorkingSet(ws);

      const res = await matchRepository.getCanonicalPermanentResult(matchUid);
      setCanonicalResult(res);
    } catch (err: any) {
      console.error('Error refreshing referee working set:', err);
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

  const openWorkingSet = useCallback(async () => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
    try {
      const ws = await matchLiveEngine.refereeOpenMatch({
        match_uid: matchUid,
        referee_uid: refereeUid,
      });
      setWorkingSet(ws);
      await refreshState();
      return ws;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to open working set.';
      setEngineError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, refereeUid, refreshState]);

  const addEvent = useCallback(async (input: {
    team_uid: UID;
    type: EventType;
    goal_type?: GoalType;
    card_type?: CardType;
    player_number?: number;
    player_uid?: UID;
    minute?: number | null;
    period?: Period | null;
    injury_player_optional?: boolean;
  }) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
    try {
      const evt = await matchLiveEngine.refereeAddEvent({
        match_uid: matchUid,
        referee_uid: refereeUid,
        team_uid: input.team_uid,
        type: input.type,
        goal_type: input.goal_type,
        card_type: input.card_type,
        player_number: input.player_number,
        player_uid: input.player_uid,
        minute: input.minute,
        period: input.period,
        injury_player_optional: input.injury_player_optional,
        idempotency_key: crypto.randomUUID(),
      });
      await refreshState();
      return evt;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to add event to working set.';
      setEngineError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, refereeUid, refreshState]);

  const updateEvent = useCallback(async (input: {
    event_uid: UID;
    player_number?: number | null;
    player_uid?: UID | null;
    goal_type?: GoalType;
    card_type?: CardType;
    minute?: number | null;
    period?: Period | null;
  }) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
    try {
      const ws = await matchLiveEngine.refereeUpdateEvent({
        match_uid: matchUid,
        referee_uid: refereeUid,
        event_uid: input.event_uid,
        player_number: input.player_number,
        player_uid: input.player_uid,
        goal_type: input.goal_type,
        card_type: input.card_type,
        minute: input.minute,
        period: input.period,
        idempotency_key: crypto.randomUUID(),
      });
      setWorkingSet(ws);
      await refreshState();
      return ws;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to update event in working set.';
      setEngineError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, refereeUid, refreshState]);

  const removeEvent = useCallback(async (event_uid: UID) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
    try {
      const ws = await matchLiveEngine.refereeRemoveEvent({
        match_uid: matchUid,
        referee_uid: refereeUid,
        event_uid,
        idempotency_key: crypto.randomUUID(),
      });
      setWorkingSet(ws);
      await refreshState();
      return ws;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to remove event from working set.';
      setEngineError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, refereeUid, refreshState]);

  const clearEvents = useCallback(async () => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
    try {
      const ws = await matchLiveEngine.refereeClearEvents({
        match_uid: matchUid,
        referee_uid: refereeUid,
        idempotency_key: crypto.randomUUID(),
      });
      setWorkingSet(ws);
      await refreshState();
      return ws;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to clear working set.';
      setEngineError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, refereeUid, refreshState]);

  const confirmNormalResult = useCallback(async () => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
    try {
      const result = await matchLiveEngine.refereeConfirmNormalResult({
        match_uid: matchUid,
        referee_uid: refereeUid,
        idempotency_key: crypto.randomUUID(),
      });
      setCanonicalResult(result);
      setSuccessMsg(`Official match result confirmed and committed (${result.home_score} - ${result.away_score}).`);
      await refreshState();
      return result;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to confirm normal result.';
      setEngineError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, refereeUid, refreshState]);

  const declareWalkover = useCallback(async (winning_team_uid: UID) => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
    try {
      const result = await matchLiveEngine.refereeDeclareWalkover({
        match_uid: matchUid,
        referee_uid: refereeUid,
        winning_team_uid,
        idempotency_key: crypto.randomUUID(),
      });
      setCanonicalResult(result);
      setSuccessMsg('Walkover awarded: 3-0 administrative result committed.');
      await refreshState();
      return result;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to declare walkover.';
      setEngineError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, refereeUid, refreshState]);

  const cancelMatch = useCallback(async () => {
    if (!matchUid) return;
    setIsSubmitting(true);
    setEngineError(null);
    try {
      const result = await matchLiveEngine.refereeCancelMatch({
        match_uid: matchUid,
        referee_uid: refereeUid,
        idempotency_key: crypto.randomUUID(),
      });
      setCanonicalResult(result);
      setSuccessMsg('Match status officially CANCELLED (0-0 result committed).');
      await refreshState();
      return result;
    } catch (err: any) {
      const msg = err instanceof MatchEngineError ? err.message : err?.message || 'Failed to cancel match.';
      setEngineError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [matchUid, refereeUid, refreshState]);

  return {
    match,
    workingSet,
    canonicalResult,
    squads,
    isLoading,
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
    refreshState,
  };
};
