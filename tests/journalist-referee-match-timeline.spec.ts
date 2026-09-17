import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import {
  MatchLiveInputEngine,
  type Match,
  type MatchSquad,
  type SquadPlayer,
  type MatchPublisher,
} from '../src/algorithms/matchLiveInputAlgorithm';
import { VirtualFootballEnvironment } from './stress-test-algo1-algo2-chained';

// Mock MatchPublisher
const mockPublisher: MatchPublisher = {
  publishRealtime: async () => {},
  publishWebhook: async () => {},
};

test.describe('Journalist & Referee Match Management E2E Integration', () => {
  let env: VirtualFootballEnvironment;
  let liveEngine: MatchLiveInputEngine;

  const compId = crypto.randomUUID();
  const matchUid = crypto.randomUUID();
  const homeTeamUid = crypto.randomUUID();
  const awayTeamUid = crypto.randomUUID();
  const journalistUid = crypto.randomUUID();
  const refereeUid = crypto.randomUUID();

  const homePlayer1: SquadPlayer = {
    player_uid: crypto.randomUUID(),
    jersey_number: 9,
    display_name: 'Marcus Striker',
    is_starting_xi: true,
  };
  const homePlayer2: SquadPlayer = {
    player_uid: crypto.randomUUID(),
    jersey_number: 8,
    display_name: 'David Midfielder',
    is_starting_xi: true,
  };
  const awayPlayer1: SquadPlayer = {
    player_uid: crypto.randomUUID(),
    jersey_number: 4,
    display_name: 'Alex Defender',
    is_starting_xi: true,
  };
  const awayPlayer2: SquadPlayer = {
    player_uid: crypto.randomUUID(),
    jersey_number: 1,
    display_name: 'Sam Goalkeeper',
    is_starting_xi: true,
  };

  test.beforeEach(async () => {
    env = new VirtualFootballEnvironment();
    liveEngine = new MatchLiveInputEngine(env, mockPublisher);

    const initialMatch: Match = {
      match_uid: matchUid,
      competition_uid: compId,
      home_team_uid: homeTeamUid,
      away_team_uid: awayTeamUid,
      home_score: 0,
      away_score: 0,
      status: 'SCHEDULED',
      referee_uid: refereeUid,
      assigned_journalist_uids: [journalistUid],
      scheduled_start_at: new Date(Date.now() - 3600000).toISOString(),
      finalized_at: null,
      locked_at: null,
      version: 1,
    };
    env.matches.set(matchUid, initialMatch);

    env.fixtures.set(matchUid, {
      id: matchUid,
      competition_id: compId,
      home_team_id: homeTeamUid,
      away_team_id: awayTeamUid,
      score_home: 0,
      score_away: 0,
      status: 'SCHEDULED',
      stats_processed: false,
    });

    const homeSquad: MatchSquad = {
      team_uid: homeTeamUid,
      match_uid: matchUid,
      players: [homePlayer1, homePlayer2],
    };
    const awaySquad: MatchSquad = {
      team_uid: awayTeamUid,
      match_uid: matchUid,
      players: [awayPlayer1, awayPlayer2],
    };
    env.squads.set(matchUid, [homeSquad, awaySquad]);
  });

  test('Step 1: Journalist starts match and enters events with automated timing and player selection', async () => {
    // 1. Kick off match
    const startedMatch = await liveEngine.startMatch({
      match_uid: matchUid,
    });

    expect(startedMatch.status).toBe('LIVE');
    const liveStateAfterStart = await env.getLiveState(matchUid);
    expect(liveStateAfterStart?.status).toBe('LIVE');
    expect(liveStateAfterStart?.period).toBe('FIRST_HALF');

    // 2. Add Goal in 1st half: Minute is auto-computed (14'), player selected from squad
    const goalEvent1 = await liveEngine.journalistAddGoal({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: homeTeamUid,
      player_uid: homePlayer1.player_uid,
      player_number: homePlayer1.jersey_number,
      goal_type: 'TAP_IN',
      minute: 14,
      period: 'FIRST_HALF',
      idempotency_key: crypto.randomUUID(),
    });

    expect(goalEvent1.type).toBe('GOAL');
    expect(goalEvent1.minute).toBe(14);
    expect(goalEvent1.period).toBe('FIRST_HALF');
    expect(goalEvent1.player_uid).toBe(homePlayer1.player_uid);
    expect(goalEvent1.player_number).toBe(9);

    // Score increments to 1 - 0
    const stateAfterGoal1 = await env.getLiveState(matchUid);
    expect(stateAfterGoal1?.home_score).toBe(1);
    expect(stateAfterGoal1?.away_score).toBe(0);

    // 3. Add Yellow Card in 1st half: Minute auto-computed (28'), player selected from squad
    const cardEvent = await liveEngine.journalistAddCard({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: awayTeamUid,
      player_uid: awayPlayer1.player_uid,
      player_number: awayPlayer1.jersey_number,
      card_type: 'YELLOW',
      minute: 28,
      period: 'FIRST_HALF',
      idempotency_key: crypto.randomUUID(),
    });

    expect(cardEvent.type).toBe('CARD');
    expect(cardEvent.minute).toBe(28);
    expect(cardEvent.player_uid).toBe(awayPlayer1.player_uid);
    expect(cardEvent.card_type).toBe('YELLOW');

    // 4. Transition to HALF_TIME: Clock stops, period set to HALF_TIME
    await liveEngine.journalistSetPeriod({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      period: 'HALF_TIME',
      idempotency_key: crypto.randomUUID(),
    });

    const stateAtHT = await env.getLiveState(matchUid);
    expect(stateAtHT?.period).toBe('HALF_TIME');

    // An injury event recorded during half time receives exactly 45'
    const injuryEvent = await liveEngine.journalistAddInjury({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: homeTeamUid,
      player_uid: homePlayer2.player_uid,
      minute: 45,
      period: 'HALF_TIME',
      idempotency_key: crypto.randomUUID(),
    });
    expect(injuryEvent.minute).toBe(45);
    expect(injuryEvent.period).toBe('HALF_TIME');

    // 5. Transition to SECOND_HALF: Clock resumes from 46'
    await liveEngine.journalistSetPeriod({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      period: 'SECOND_HALF',
      idempotency_key: crypto.randomUUID(),
    });

    const stateAt2H = await env.getLiveState(matchUid);
    expect(stateAt2H?.period).toBe('SECOND_HALF');

    // Add Goal in 2nd half: Minute auto-computed (67'), player selected
    const goalEvent2 = await liveEngine.journalistAddGoal({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: homeTeamUid,
      player_uid: homePlayer1.player_uid,
      player_number: homePlayer1.jersey_number,
      goal_type: 'HEADER',
      minute: 67,
      period: 'SECOND_HALF',
      idempotency_key: crypto.randomUUID(),
    });
    expect(goalEvent2.minute).toBe(67);
    expect(goalEvent2.player_uid).toBe(homePlayer1.player_uid);

    const stateAfterGoal2 = await env.getLiveState(matchUid);
    expect(stateAfterGoal2?.home_score).toBe(2);
    expect(stateAfterGoal2?.away_score).toBe(0);
  });

  test('Step 2: Referee opens working set, sees all journalist events on timeline, and finalizes cleanly', async () => {
    // 1. Kick off match & add events via Journalist
    await liveEngine.startMatch({
      match_uid: matchUid,
    });

    await liveEngine.journalistAddGoal({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: homeTeamUid,
      player_uid: homePlayer1.player_uid,
      player_number: homePlayer1.jersey_number,
      goal_type: 'TAP_IN',
      minute: 12,
      period: 'FIRST_HALF',
      idempotency_key: crypto.randomUUID(),
    });

    await liveEngine.journalistAddCard({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: awayTeamUid,
      player_uid: awayPlayer1.player_uid,
      player_number: awayPlayer1.jersey_number,
      card_type: 'YELLOW',
      minute: 34,
      period: 'FIRST_HALF',
      idempotency_key: crypto.randomUUID(),
    });

    await liveEngine.journalistSetPeriod({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      period: 'SECOND_HALF',
      idempotency_key: crypto.randomUUID(),
    });

    await liveEngine.journalistAddGoal({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: awayTeamUid,
      player_uid: awayPlayer2.player_uid,
      player_number: awayPlayer2.jersey_number,
      goal_type: 'SCREAMER',
      minute: 82,
      period: 'SECOND_HALF',
      idempotency_key: crypto.randomUUID(),
    });

    // 2. Referee opens match reconciliation
    const workingSet = await liveEngine.refereeOpenMatch({
      match_uid: matchUid,
      referee_uid: refereeUid,
    });

    // Verify referee working set contains ALL journalist timeline events without data loss
    expect(workingSet.events.length).toBe(3);
    const goalEvents = workingSet.events.filter((e) => e.type === 'GOAL');
    const cardEvents = workingSet.events.filter((e) => e.type === 'CARD');

    expect(goalEvents.length).toBe(2);
    expect(cardEvents.length).toBe(1);

    // Verify timeline order & player attribution
    expect(goalEvents[0].minute).toBe(12);
    expect(goalEvents[0].player_uid).toBe(homePlayer1.player_uid);
    expect(goalEvents[0].player_number).toBe(9);

    expect(cardEvents[0].minute).toBe(34);
    expect(cardEvents[0].player_uid).toBe(awayPlayer1.player_uid);
    expect(cardEvents[0].player_number).toBe(4);

    expect(goalEvents[1].minute).toBe(82);
    expect(goalEvents[1].player_uid).toBe(awayPlayer2.player_uid);
    expect(goalEvents[1].player_number).toBe(1);

    // 3. Referee finalizes normal result (1-1 score)
    const finalizedResult = await liveEngine.refereeConfirmNormalResult({
      match_uid: matchUid,
      referee_uid: refereeUid,
      idempotency_key: crypto.randomUUID(),
    });

    expect(finalizedResult.outcome).toBe('NORMAL');
    expect(finalizedResult.home_score).toBe(1);
    expect(finalizedResult.away_score).toBe(1);

    // Canonical result verified in storage
    const canonical = env.canonicalResults.get(matchUid);
    expect(canonical).toBeDefined();
    expect(canonical?.home_score).toBe(1);
    expect(canonical?.away_score).toBe(1);
    expect(canonical?.outcome).toBe('NORMAL');
    expect(canonical?.events.length).toBe(3);
  });

  test('Step 3: Algorithm 2 cascades finalized result into Fixtures, Standings, Form, and Player Stats', async () => {
    // 1. Setup and finalize match: Home 2 - 1 Away
    await liveEngine.startMatch({
      match_uid: matchUid,
    });

    // Home Player 1 scores twice
    await liveEngine.journalistAddGoal({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: homeTeamUid,
      player_uid: homePlayer1.player_uid,
      player_number: homePlayer1.jersey_number,
      goal_type: 'TAP_IN',
      minute: 20,
      period: 'FIRST_HALF',
      idempotency_key: crypto.randomUUID(),
    });

    await liveEngine.journalistAddGoal({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: homeTeamUid,
      player_uid: homePlayer1.player_uid,
      player_number: homePlayer1.jersey_number,
      goal_type: 'PENALTY',
      minute: 55,
      period: 'SECOND_HALF',
      idempotency_key: crypto.randomUUID(),
    });

    // Away Player 1 receives a card
    await liveEngine.journalistAddCard({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: awayTeamUid,
      player_uid: awayPlayer1.player_uid,
      player_number: awayPlayer1.jersey_number,
      card_type: 'YELLOW',
      minute: 60,
      period: 'SECOND_HALF',
      idempotency_key: crypto.randomUUID(),
    });

    // Away Player 2 scores once
    await liveEngine.journalistAddGoal({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: awayTeamUid,
      player_uid: awayPlayer2.player_uid,
      player_number: awayPlayer2.jersey_number,
      goal_type: 'TAP_IN',
      minute: 75,
      period: 'SECOND_HALF',
      idempotency_key: crypto.randomUUID(),
    });

    // 2. Referee finalizes match
    await liveEngine.refereeOpenMatch({
      match_uid: matchUid,
      referee_uid: refereeUid,
    });

    await liveEngine.refereeConfirmNormalResult({
      match_uid: matchUid,
      referee_uid: refereeUid,
      idempotency_key: crypto.randomUUID(),
    });

    // 3. Natural trigger automatically fires Algorithm 2 on finalization
    expect(env.triggerFiredCount).toBe(1);

    // Verify Idempotency on manual re-run (fixture already marked processed)
    const reRun = await env.statsEngine.processMatchStatistics({
      fixture_id: matchUid,
      competition_id: compId,
    });
    expect(reRun.stats_processed).toBe(true);

    // 4. Verify Fixtures table updated
    const updatedFixture = env.fixtures.get(matchUid);
    expect(updatedFixture?.status).toBe('FT');
    expect(updatedFixture?.score_home).toBe(2);
    expect(updatedFixture?.score_away).toBe(1);
    expect(updatedFixture?.stats_processed).toBe(true);

    // 5. Verify Standings table updated
    const homeStandings = env.standings.get(`${homeTeamUid}:${compId}`);
    const awayStandings = env.standings.get(`${awayTeamUid}:${compId}`);

    expect(homeStandings).toBeDefined();
    expect(homeStandings?.played).toBe(1);
    expect(homeStandings?.won).toBe(1);
    expect(homeStandings?.drawn).toBe(0);
    expect(homeStandings?.lost).toBe(0);
    expect(homeStandings?.goals_for).toBe(2);
    expect(homeStandings?.goals_against).toBe(1);
    expect(homeStandings?.goal_difference).toBe(1);
    expect(homeStandings?.points).toBe(3);

    expect(awayStandings).toBeDefined();
    expect(awayStandings?.played).toBe(1);
    expect(awayStandings?.won).toBe(0);
    expect(awayStandings?.drawn).toBe(0);
    expect(awayStandings?.lost).toBe(1);
    expect(awayStandings?.goals_for).toBe(1);
    expect(awayStandings?.goals_against).toBe(2);
    expect(awayStandings?.goal_difference).toBe(-1);
    expect(awayStandings?.points).toBe(0);

    // 6. Verify Form table updated (FIFO)
    const homeForm = env.forms.get(homeTeamUid);
    const awayForm = env.forms.get(awayTeamUid);

    expect(homeForm?.latest_results).toEqual(['W']);
    expect(awayForm?.latest_results).toEqual(['L']);

    // 7. Verify Player Stats table updated (Module C)
    const strikerStats = env.playerStats.get(`${homePlayer1.player_uid}:${compId}`);
    expect(strikerStats).toBeDefined();
    expect(strikerStats?.goals).toBe(2); // Credited with 2 goals

    const awayScorerStats = env.playerStats.get(`${awayPlayer2.player_uid}:${compId}`);
    expect(awayScorerStats).toBeDefined();
    expect(awayScorerStats?.goals).toBe(1); // Credited with 1 goal
  });
});
