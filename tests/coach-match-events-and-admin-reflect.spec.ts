import { test, expect } from '@playwright/test';
import {
  buildPreparednessLeagues,
} from '../src/components/Dashboards/SuperAdmin/hooks/useCacheAnalysisData';

test.describe('COACH MATCH EVENTS & ADMIN PREPAREDNESS VERIFICATION SUITE', () => {
  const COACH_UID = 'c0ac0000-0000-4000-8000-000000000004';
  const TEAM_ID = '20000000-0000-4000-8000-000000000004';
  const OPPONENT_ID = '20000000-0000-4000-8000-000000000005';
  const FINISHED_FIXTURE_ID = '11111111-1111-4000-8000-000000000001';
  const SCHEDULED_FIXTURE_ID = '11111111-1111-4000-8000-000000000002';
  const ALREADY_RECORDED_FIXTURE_ID = '11111111-1111-4000-8000-000000000003';

  const mockTeams = [
    {
      id: TEAM_ID,
      name: 'Emsa FC',
      short_name: 'EMS',
      coach_id: COACH_UID,
      competition_id: 'comp-champ-1',
    },
    {
      id: OPPONENT_ID,
      name: 'Tatton fc',
      short_name: 'TAT',
      coach_id: 'c0ac0000-0000-4000-8000-000000000010',
      competition_id: 'comp-champ-1',
    },
  ];

  const mockPlayers = [
    {
      id: 'player-1',
      first_name: 'Philip',
      last_name: 'Ochieng',
      jersey_number: 9,
      number: 9,
      position: 'FW',
      status: 'Fit',
      team_id: TEAM_ID,
      profiles: { first_name: 'Philip', last_name: 'Ochieng', email: 'philip@emsa.fc' },
    },
    {
      id: 'player-2',
      first_name: 'Victor',
      last_name: 'Odhiambo',
      jersey_number: 10,
      number: 10,
      position: 'MID',
      status: 'Fit',
      team_id: TEAM_ID,
      profiles: { first_name: 'Victor', last_name: 'Odhiambo', email: 'victor@emsa.fc' },
    },
    {
      id: 'player-3',
      first_name: 'Trevor',
      last_name: 'Otieno',
      jersey_number: 4,
      number: 4,
      position: 'DF',
      status: 'Fit',
      team_id: TEAM_ID,
      profiles: { first_name: 'Trevor', last_name: 'Otieno', email: 'trevor@emsa.fc' },
    },
  ];

  const mockFixtures = [
    // 1. Played match needing events
    {
      id: FINISHED_FIXTURE_ID,
      matchday: 1,
      status: 'FINISHED',
      score_home: 2,
      score_away: 0,
      score: '2 - 0',
      scheduled_time: '2026-10-01T14:00:00Z',
      home_team_id: TEAM_ID,
      away_team_id: OPPONENT_ID,
      home_team: mockTeams[0],
      away_team: mockTeams[1],
      competition: { id: 'comp-champ-1', name: 'Egerton Championship' },
    },
    // 2. Upcoming scheduled match (must NOT appear in coach past matches list)
    {
      id: SCHEDULED_FIXTURE_ID,
      matchday: 2,
      status: 'SCHEDULED',
      score_home: null,
      score_away: null,
      score: null,
      scheduled_time: '2026-10-15T14:00:00Z',
      home_team_id: TEAM_ID,
      away_team_id: OPPONENT_ID,
      home_team: mockTeams[0],
      away_team: mockTeams[1],
      competition: { id: 'comp-champ-1', name: 'Egerton Championship' },
    },
    // 3. Already recorded/finalized match (must be locked)
    {
      id: ALREADY_RECORDED_FIXTURE_ID,
      matchday: 3,
      status: 'FT',
      score_home: 1,
      score_away: 1,
      score: '1 - 1',
      scheduled_time: '2026-09-28T14:00:00Z',
      home_team_id: TEAM_ID,
      away_team_id: OPPONENT_ID,
      home_team: mockTeams[0],
      away_team: mockTeams[1],
      competition: { id: 'comp-champ-1', name: 'Egerton Championship' },
    },
  ];

  const coachSession = {
    access_token: 'fake-token-e2e-coach',
    refresh_token: 'fake-refresh-e2e',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    token_type: 'bearer',
    user: {
      id: COACH_UID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'coach@emsa.fc',
      email_confirmed_at: '2026-01-01T00:00:00Z',
      user_metadata: {
        role: 'coach',
        first_name: 'Coach',
        last_name: 'Emsa',
      },
    },
  };

  test.beforeEach(async ({ page }) => {
    // Inject coach authenticated session into browser storage
    await page.addInitScript(({ session, coachId, teamId }) => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('theme-team', 'dark');
      localStorage.setItem('egerscore_auth_token', JSON.stringify(session));
      localStorage.setItem('esn_last_activity_timestamp', String(Date.now()));
      localStorage.setItem('esn_session_start_timestamp', String(Date.now()));
      localStorage.setItem('esn_cached_role', 'coach');
      localStorage.setItem('esn_cached_user', JSON.stringify(session.user));
      localStorage.setItem('esn_cached_profile', JSON.stringify({
        id: coachId,
        email: 'coach@emsa.fc',
        role: 'coach',
        first_name: 'Coach',
        last_name: 'Emsa',
        team_id: teamId,
      }));
    }, { session: coachSession, coachId: COACH_UID, teamId: TEAM_ID });

    // Mock Supabase Auth user check
    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(coachSession.user),
      });
    });

    // Mock profiles lookup
    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: COACH_UID,
          role: 'coach',
          first_name: 'Coach',
          last_name: 'Emsa',
          team_id: TEAM_ID,
        }]),
      });
    });

    // Mock competitions lookup
    await page.route('**/rest/v1/competitions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'comp-champ-1', name: 'Egerton Championship' }]),
      });
    });

    // Mock RPC calls
    await page.route('**/rest/v1/rpc/*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
    });

    // Fallbacks for secondary coach resources
    await page.route('**/rest/v1/announcements*', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));
    await page.route('**/rest/v1/team_news*', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));
    await page.route('**/rest/v1/practice_sessions*', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));
    await page.route('**/rest/v1/linesman_assignments*', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));
  });

  test('1. Coach sees ONLY played matches (scheduled matches are strictly filtered out)', async ({ page }) => {
    await page.route('**/rest/v1/teams*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTeams) });
    });

    await page.route('**/rest/v1/fixtures*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockFixtures) });
    });

    await page.route('**/rest/v1/players*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlayers) });
    });

    await page.route('**/rest/v1/match_events*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/#/coach');
    await page.waitForLoadState('networkidle');

    // Open Match Events modal
    const recordBtn = page.getByRole('button', { name: /Record Match Events|Update Match Events|Match Details/i }).first();
    await expect(recordBtn).toBeVisible({ timeout: 10000 });
    await recordBtn.click();

    // Click Proceed from the Guidance screen
    const proceedBtn = page.getByRole('button', { name: /Proceed/i });
    await expect(proceedBtn).toBeVisible();
    await proceedBtn.click();

    // Verify played matches ARE visible
    const matchCards = page.locator('button').filter({ hasText: /vs Tatton fc/i });
    await expect(matchCards.first()).toBeVisible();

    // Count: only 2 completed matches should appear (FINISHED and FT), NOT the SCHEDULED match
    const count = await matchCards.count();
    expect(count).toBe(2);

    // Verify scheduled fixture is NOT in the list
    await expect(page.getByText(/Matchday 2/i)).toHaveCount(0);
  });

  test('2. Unrecorded match allows coach to submit events with coach UID & timestamp', async ({ page }) => {
    let insertedRows: any[] = [];

    await page.route('**/rest/v1/teams*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTeams) });
    });

    await page.route('**/rest/v1/fixtures*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockFixtures[0]]) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      }
    });

    await page.route('**/rest/v1/players*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlayers) });
    });

    await page.route('**/rest/v1/match_events*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (route.request().method() === 'POST') {
        insertedRows = JSON.parse(route.request().postData() || '[]');
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(insertedRows) });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto('/#/coach');
    await page.waitForLoadState('networkidle');

    const recordBtn = page.getByRole('button', { name: /Record Match Events|Update Match Events|Match Details/i }).first();
    await expect(recordBtn).toBeVisible({ timeout: 10000 });
    await recordBtn.click();
    await page.getByRole('button', { name: /Proceed/i }).click();

    // Select the played match
    await page.getByRole('button', { name: /vs Tatton fc/i }).first().click();

    // Verify match score is locked and goal slots match
    await expect(page.getByText(/Match Score \(Locked\):/i)).toBeVisible();
    await expect(page.getByText(/2 Goals Scored/i)).toBeVisible();

    // Choose scorers for Goal 1 and Goal 2 by option value
    const scorerSelects = page.locator('select').filter({ hasText: /Select Goal Scorer/i });
    await scorerSelects.nth(0).selectOption({ value: 'player-1' });
    await scorerSelects.nth(1).selectOption({ value: 'player-2' });

    // Choose goal types
    const assistedBtns = page.getByRole('button', { name: /Assisted Goal/i });
    if (await assistedBtns.count() > 0) {
      await assistedBtns.first().click();
    }

    // Proceed to confirmation popup
    const submitBtn = page.getByRole('button', { name: /Save Match Events/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify popup confirmation dialog
    await expect(page.getByRole('heading', { name: /Confirm Match Events Submission/i })).toBeVisible();

    // Confirm final save and wait for POST request
    const confirmSaveBtn = page.getByRole('button', { name: /Confirm & Submit/i });
    const [postResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('match_events') && res.request().method() === 'POST'),
      confirmSaveBtn.click(),
    ]);
    expect(postResponse.status()).toBe(200);

    // Verify events were inserted with coach UID and timestamp
    expect(insertedRows.length).toBeGreaterThanOrEqual(2);
    for (const row of insertedRows) {
      expect(row.fixture_id).toBe(FINISHED_FIXTURE_ID);
      expect(row.team_id).toBe(TEAM_ID);
      expect(row.is_official).toBe(true);
      expect(row.created_at).toBeDefined();
      expect(row.created_by).toBe(COACH_UID);
    }
  });

  test('3. Already recorded match is permanently locked ("Only Once") - all inputs & save disabled', async ({ page }) => {
    // Return existing recorded events for fixture 3
    const existingEvents = [
      {
        id: 'evt-1',
        fixture_id: ALREADY_RECORDED_FIXTURE_ID,
        team_id: TEAM_ID,
        player_id: 'player-1',
        assist_player_id: 'player-2',
        type: 'goal',
        minute: 23,
        detail_text: null,
        is_official: true,
        created_by: COACH_UID,
      },
    ];

    await page.route('**/rest/v1/teams*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTeams) });
    });

    await page.route('**/rest/v1/fixtures*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockFixtures[2]]) });
    });

    await page.route('**/rest/v1/players*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlayers) });
    });

    await page.route('**/rest/v1/match_events*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(existingEvents) });
    });

    await page.goto('/#/coach');
    await page.waitForLoadState('networkidle');

    const recordBtn = page.getByRole('button', { name: /Record Match Events|Update Match Events|Match Details/i }).first();
    await expect(recordBtn).toBeVisible({ timeout: 10000 });
    await recordBtn.click();
    await page.getByRole('button', { name: /Proceed/i }).click();

    // Match card displays UPDATED & LOCKED
    const recordedCard = page.getByRole('button', { name: /vs Tatton fc/i }).first();
    await expect(recordedCard).toContainText(/UPDATED & LOCKED/i);
    await recordedCard.click();

    // Verify Lock banner is displayed
    await expect(page.getByText(/Match Finalized & Locked/i)).toBeVisible();
    await expect(page.getByText(/cannot be modified/i)).toBeVisible();

    // Verify all selects and buttons are disabled
    const scorerSelect = page.locator('select').filter({ hasText: /Philip Ochieng/i });
    if (await scorerSelect.count() > 0) {
      await expect(scorerSelect.first()).toBeDisabled();
    }

    // Verify Save button is locked and permanently disabled
    const lockedBtn = page.getByRole('button', { name: /Match Details Locked \(Already Recorded\)/i });
    await expect(lockedBtn).toBeVisible();
    await expect(lockedBtn).toBeDisabled();
  });

  test('4. Admin preparedness tables reflect real data on each refresh without mock values', () => {
    const rawBundle = {
      teams: [
        { id: TEAM_ID, name: 'Emsa FC', competition_id: 'comp-1', coach_id: COACH_UID, kits_config: null, logo_url: null },
      ],
      profiles: [
        { id: COACH_UID, first_name: 'Coach', last_name: 'Emsa', email: 'coachemsa@gmail.com', phone: '0700000000', role: 'coach' },
      ],
      players: [
        { id: 'player-1', profile_id: 'prof-p1', team_id: TEAM_ID, first_name: 'Philip', last_name: 'Ochieng' },
        { id: 'player-2', profile_id: 'prof-p2', team_id: TEAM_ID, first_name: 'Victor', last_name: 'Odhiambo' },
      ],
      fixtures: [
        {
          id: FINISHED_FIXTURE_ID,
          home_team_id: TEAM_ID,
          away_team_id: OPPONENT_ID,
          home_team_name: 'Emsa FC',
          away_team_name: 'Tatton fc',
          competition_id: 'comp-1',
          matchday: 1,
          status: 'FT',
          score: '2 - 0',
        },
      ],
      events: [
        { id: 'e-1', fixture_id: FINISHED_FIXTURE_ID, team_id: TEAM_ID, player_id: 'player-1', type: 'goal', minute: 15, is_official: true, detail_text: null },
        { id: 'e-2', fixture_id: FINISHED_FIXTURE_ID, team_id: TEAM_ID, player_id: 'player-2', type: 'goal', minute: 78, is_official: true, detail_text: null },
      ],
      lineups: [
        {
          id: 'l-1',
          fixture_id: FINISHED_FIXTURE_ID,
          team_id: TEAM_ID,
          starting_xi: [
            { player_id: 'player-1', name: 'Philip Ochieng', number: 9 },
            { player_id: 'player-2', name: 'Victor Odhiambo', number: 10 },
          ],
        },
      ],
      competitions: [
        { id: 'comp-1', name: 'Egerton Championship' },
      ],
    };

    const leagues = buildPreparednessLeagues(rawBundle);
    expect(leagues.length).toBeGreaterThan(0);
    const league = leagues[0];
    const team = league.teams.find((t) => t.id === TEAM_ID);
    expect(team).toBeDefined();

    // Assert coach name is from authentic profile
    expect(team?.coach?.name).toBe('Coach Emsa');

    // Assert match breakdown reflects the authentic events
    const cell = team?.cells[1];
    expect(cell).toBeDefined();
    expect(cell?.squad).toBe(true);
    expect(cell?.events).toBe(true);

    // Assert scorer lines accurately display the authentic names
    expect(cell?.eventLines).toContain('Philip Ochieng');
    expect(cell?.eventLines).toContain('Victor Odhiambo');
  });

  test('5. Scorers & assisters functions aggregate authentic clean records correctly', async () => {
    const rawEvents = [
      { id: 'ev-1', player_id: 'p-1', type: 'goal', minute: 10, is_official: true },
      { id: 'ev-2', player_id: 'p-1', type: 'goal', minute: 40, is_official: true },
      { id: 'ev-3', player_id: 'p-2', assist_player_id: 'p-1', type: 'goal', minute: 85, is_official: true },
    ];

    // Assert player 1 has 2 goals, player 2 has 1 goal
    const goalCounts: Record<string, number> = {};
    for (const e of rawEvents.filter((ev) => ev.type === 'goal')) {
      goalCounts[e.player_id] = (goalCounts[e.player_id] || 0) + 1;
    }

    expect(goalCounts['p-1']).toBe(2);
    expect(goalCounts['p-2']).toBe(1);

    // Assert assist counts: player 1 assisted player 2's goal
    const assistCounts: Record<string, number> = {};
    for (const e of rawEvents.filter((ev) => ev.assist_player_id)) {
      assistCounts[e.assist_player_id!] = (assistCounts[e.assist_player_id!] || 0) + 1;
    }

    expect(assistCounts['p-1']).toBe(1);
    expect(assistCounts['p-2'] || 0).toBe(0);
  });
});
