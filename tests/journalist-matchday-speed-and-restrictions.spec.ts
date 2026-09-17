import { test, expect } from '@playwright/test';
import { resolveGuestMatchdayDate, formatMatchTime, formatMatchPitch } from '../src/lib/matchdayHelper';
import { isMatchScheduledToday } from '../src/components/Dashboards/Journalist/components/Modals/MatchEventsModal';
import {
  matchLiveEngine,
  matchRepository,
  nowIso,
} from '../src/services/matchLiveEngineAdapter';

test.describe('Journalist Dashboard - Impending Matchday, Speed & Day-Only Restrictions', () => {

  test('Impending Matchday Resolution & Fixture formatting parity', async () => {
    const today = new Date();
    const todayStr = today.toISOString();

    // 1. Fixture with today's date
    const todayFixture = {
      id: 'fix-today-1',
      scheduledTime: todayStr,
      status: 'SCHEDULED',
      league: 'Egerton Premier League',
      matchday: 4,
    } as any;

    const resolvedToday = resolveGuestMatchdayDate([todayFixture]);
    expect(resolvedToday).toBeDefined();

    // 2. formatMatchTime and formatMatchPitch tests
    expect(formatMatchTime('14:30')).toBe('2:30 PM');
    expect(formatMatchTime('08:30')).toBe('8:30 AM');
    expect(formatMatchPitch('Pitch A — Main Field', true)).toBe('Pitch A');
  });

  test('Day-Only Editing Permission Gatekeeper', async () => {
    const today = new Date();
    const todayIso = today.toISOString();

    // Future date: 10 days from now
    const futureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 15, 0);
    const futureIso = futureDate.toISOString();

    // Past date: 10 days ago
    const pastDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10, 15, 0);
    const pastIso = pastDate.toISOString();

    // 1. Match scheduled for today is editable
    const matchToday: any = {
      id: 'm-today',
      competition: 'Egerton Premier League',
      homeTeam: 'Home FC',
      awayTeam: 'Away FC',
      scoreHome: 0,
      scoreAway: 0,
      status: 'SCHEDULED',
      scheduledTime: todayIso,
      kickoff: '10:00 AM',
      time: '10:00 AM',
      venue: 'Pitch A',
    };
    expect(isMatchScheduledToday(matchToday)).toBe(true);

    // 2. Live match is always editable
    const matchLiveAnotherDay: any = {
      ...matchToday,
      scheduledTime: futureIso,
      status: 'LIVE',
    };
    expect(isMatchScheduledToday(matchLiveAnotherDay)).toBe(true);

    // 3. Match scheduled for future is NOT editable
    const matchFuture: any = {
      ...matchToday,
      status: 'SCHEDULED',
      scheduledTime: futureIso,
    };
    expect(isMatchScheduledToday(matchFuture)).toBe(false);

    // 4. Past finalized match is NOT editable today
    const matchPast: any = {
      ...matchToday,
      status: 'FT',
      scheduledTime: pastIso,
    };
    expect(isMatchScheduledToday(matchPast)).toBe(false);
  });

  test('Instant Live Algorithm & Optimistic Score Transitions', async () => {
    const { VirtualFootballEnvironment } = await import('./stress-test-algo1-algo2-chained');
    const { MatchLiveInputEngine } = await import('../src/algorithms/matchLiveInputAlgorithm');

    const env = new VirtualFootballEnvironment();
    const mockPublisher = {
      publishRealtime: async () => {},
      publishWebhook: async () => {},
    };
    const liveEngine = new MatchLiveInputEngine(env, mockPublisher);

    const matchUid = `j-opt-match-${Date.now()}`;
    const journalistUid = 'journalist-test-id';

    // Seed test match
    await env.saveMatch({
      match_uid: matchUid,
      competition_uid: 'comp-1',
      home_team_uid: 'home-opt-team',
      away_team_uid: 'away-opt-team',
      scheduled_start_at: nowIso(),
      home_score: 0,
      away_score: 0,
      status: 'SCHEDULED',
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    // 1. Start match
    const startedState = await liveEngine.startMatch({ match_uid: matchUid });
    expect(startedState.status).toBe('LIVE');

    // 2. Add goal with instant execution
    const startTime = Date.now();
    const goalPromise = liveEngine.journalistAddGoal({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      team_uid: 'home-opt-team',
      goal_type: 'TAP_IN',
      minute: 12,
      period: 'FIRST_HALF',
      idempotency_key: `goal-${Date.now()}`,
    });

    const goalEvent = await goalPromise;
    const duration = Date.now() - startTime;
    expect(goalEvent).toBeDefined();
    expect(goalEvent.type).toBe('GOAL');
    expect(duration).toBeLessThan(100); // Instant in-memory execution (<100ms)

    // 3. Re-verify score in repository
    const liveState = await env.getLiveState(matchUid);
    expect(liveState?.home_score).toBe(1);
    expect(liveState?.away_score).toBe(0);

    // 4. Instant period switch to FULL_TIME (Match End Mechanism)
    const endPromise = liveEngine.journalistSetPeriod({
      match_uid: matchUid,
      journalist_uid: journalistUid,
      period: 'FULL_TIME',
      idempotency_key: `ft-${Date.now()}`,
    });

    const ftState = await endPromise;
    expect(ftState.period).toBe('FULL_TIME');
    expect(ftState.status).toBe('FULL_TIME');
  });

});
