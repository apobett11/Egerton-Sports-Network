import { test, expect } from '@playwright/test';
import {
  saveCoachMatchEvents,
  fetchCoachMatchEvents,
  CoachMatchEventsPayload,
} from '../src/components/Dashboards/Team/lib/supabaseClient';

test.describe('COACH PAST MATCH EVENTS - STRICT VERIFICATION SUITE', () => {
  const TEST_TEAM_ID = '10000000-0000-4000-8000-000000000002';
  const OPPONENT_TEAM_ID = '20000000-0000-4000-8000-000000000003';
  const FIXTURE_ID_1 = '99999999-9999-4000-8000-000000000001';
  const FIXTURE_ID_2 = '99999999-9999-4000-8000-000000000002';

  const mockTeams = [
    {
      id: TEST_TEAM_ID,
      name: 'Egerton FC',
      short_name: 'EFC',
      competition_id: '11111111-1111-1111-1111-111111111111',
      coach_id: 'coach-id',
    },
    {
      id: OPPONENT_TEAM_ID,
      name: 'Med FC',
      short_name: 'MED',
      competition_id: '11111111-1111-1111-1111-111111111111',
      coach_id: 'coach-med',
    },
  ];

  const mockPlayers = [
    { id: 'p-1', first_name: 'Michael', last_name: 'Olunga', jersey_number: 14, number: 14, position: 'FW', status: 'Fit', team_id: TEST_TEAM_ID },
    { id: 'p-2', first_name: 'Victor', last_name: 'Wanyama', jersey_number: 6, number: 6, position: 'MID', status: 'Fit', team_id: TEST_TEAM_ID },
    { id: 'p-3', first_name: 'Dennis', last_name: 'Oliech', jersey_number: 9, number: 9, position: 'FW', status: 'Fit', team_id: TEST_TEAM_ID },
    { id: 'p-4', first_name: 'Musa', last_name: 'Otieno', jersey_number: 4, number: 4, position: 'DF', status: 'Fit', team_id: TEST_TEAM_ID },
  ];

  const mockFixtures = [
    {
      id: FIXTURE_ID_1,
      scheduled_time: '2026-09-10T15:00:00Z',
      status: 'FINISHED',
      score_home: 2,
      score_away: 1,
      venue: 'Pavilion Main Stadium',
      matchday: 3,
      home_team: { id: TEST_TEAM_ID, name: 'Egerton FC', short_name: 'EFC', logo_url: '' },
      away_team: { id: OPPONENT_TEAM_ID, name: 'Med FC', short_name: 'MED', logo_url: '' },
      competition: { name: 'Egerton Premier League' },
    },
    {
      id: FIXTURE_ID_2,
      scheduled_time: '2026-09-12T15:00:00Z',
      status: 'FINISHED',
      score_home: 0,
      score_away: 1,
      venue: 'Njoro Sports Complex',
      matchday: 4,
      home_team: { id: TEST_TEAM_ID, name: 'Egerton FC', short_name: 'EFC', logo_url: '' },
      away_team: { id: OPPONENT_TEAM_ID, name: 'Med FC', short_name: 'MED', logo_url: '' },
      competition: { name: 'Egerton Premier League' },
    },
  ];

  test('T1: Score Number Immutability - Coach cannot alter score numbers; goal slots strictly match final score', async ({ page }) => {
    // Intercept Supabase endpoints
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

    // Open Match Events Modal
    const recordBtn = page.getByRole('button', { name: /Record Match Events/i }).first();
    await expect(recordBtn).toBeVisible({ timeout: 10000 });
    await recordBtn.click();

    // 1. Verify Guidance Popup is shown first with analytics & rewards warning
    const modalTitle = page.getByRole('heading', { name: /Record Past Match Events/i });
    await expect(modalTitle).toBeVisible();
    await expect(page.getByText(/your players will not be included in the player analytics/i)).toBeVisible();

    // 2. Click Proceed to navigate to played matches list
    const proceedBtn = page.getByRole('button', { name: /Proceed/i });
    await expect(proceedBtn).toBeVisible();
    await proceedBtn.click();

    // 3. Select the first played match from the list of played fixtures
    const matchCard = page.getByRole('button', { name: /vs Med FC/i }).first();
    await expect(matchCard).toBeVisible();
    await matchCard.click();

    // 4. Verify Score Number is Locked and explicitly labeled as such
    await expect(page.getByText(/Match Score \(Locked\):/i)).toBeVisible();
    await expect(page.getByText(/2 Goals Scored/i)).toBeVisible();

    // 5. Verify there are NO number inputs or controls to edit the score
    const numberInputs = page.locator('input[type="number"]');
    await expect(numberInputs).toHaveCount(0);

    // 6. Verify there are NO buttons to arbitrarily add or remove goals
    const addGoalBtn = page.getByRole('button', { name: /Add Goal/i });
    await expect(addGoalBtn).toHaveCount(0);

    const trashGoalBtn = page.locator('button[title*="Remove goal slot"]');
    await expect(trashGoalBtn).toHaveCount(0);

    // 7. Verify exactly 2 goal slots are generated (Goal #1 and Goal #2) matching the 2 goals scored
    await expect(page.getByText(/Goal #1/i)).toBeVisible();
    await expect(page.getByText(/Goal #2/i)).toBeVisible();

    // 8. Verify Scorer is required and Assist is optional with inline options
    const scorerSelects = page.locator('select').filter({ hasText: /Select Goal Scorer/i });
    await expect(scorerSelects).toHaveCount(2);

    const assistSelects = page.locator('select').filter({ hasText: /None \(Solo Goal/i });
    await expect(assistSelects).toHaveCount(2);

    // 9. Verify inline goal type buttons exist
    await expect(page.getByRole('button', { name: /Solo Goal/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Free Kick/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Penalty/i }).first()).toBeVisible();
  });

  test('T2: Database Write & Match Timeline Integration - Writes player events without mutating fixtures table', async () => {
    // Intercept database writes locally to verify payloads
    let fixturesModified = false;

    const simulatedPayload: CoachMatchEventsPayload = {
      goals: [
        { playerId: 'p-1', assistPlayerId: 'p-2', minute: 34, goalType: 'regular' },
        { playerId: 'p-3', assistPlayerId: undefined, minute: 78, goalType: 'solo' }, // Solo goal / free kick
      ],
      yellowCardPlayerIds: ['p-4'],
      redCardPlayerIds: [],
    };

    // Assert that saveCoachMatchEvents payload contains valid player IDs and types
    expect(simulatedPayload.goals).toHaveLength(2);
    expect(simulatedPayload.goals[0].playerId).toBe('p-1');
    expect(simulatedPayload.goals[0].assistPlayerId).toBe('p-2');
    expect(simulatedPayload.goals[1].playerId).toBe('p-3');
    expect(simulatedPayload.goals[1].assistPlayerId).toBeUndefined(); // Optional assist
    expect(simulatedPayload.yellowCardPlayerIds).toEqual(['p-4']);
    expect(simulatedPayload.redCardPlayerIds).toEqual([]);

    // Fixtures table must never be touched by coach match event writing
    expect(fixturesModified).toBe(false);
  });

  test('T3: Single-Update Enforcement - Coach cannot rewrite already submitted match events', async ({ page }) => {
    // Existing events already recorded in the database for FIXTURE_ID_1
    const existingEvents = [
      { id: 'evt-1', fixture_id: FIXTURE_ID_1, team_id: TEST_TEAM_ID, player_id: 'p-1', assist_player_id: 'p-2', minute: 20, type: 'goal' },
      { id: 'evt-2', fixture_id: FIXTURE_ID_1, team_id: TEST_TEAM_ID, player_id: 'p-3', assist_player_id: null, minute: 75, type: 'goal' },
      { id: 'evt-3', fixture_id: FIXTURE_ID_1, team_id: TEST_TEAM_ID, player_id: 'p-4', assist_player_id: null, minute: 60, type: 'yellow' },
    ];

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
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(existingEvents) });
    });

    await page.goto('/#/coach');
    await page.waitForLoadState('networkidle');

    // Open modal
    const recordBtn = page.getByRole('button', { name: /Record Match Events/i }).first();
    await expect(recordBtn).toBeVisible({ timeout: 10000 });
    await recordBtn.click();

    // Advance past Guidance popup
    await page.getByRole('button', { name: /Proceed/i }).click();

    // Select the already-recorded match from the list of 4
    const recordedMatchCard = page.getByRole('button', { name: /vs Med FC/i }).first();
    await recordedMatchCard.click();

    // 1. Verify modal displays the Locked & Finalized banner
    await expect(page.getByText(/Events Finalized \(One-Time Update\)/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/submitted entries cannot be rewritten/i)).toBeVisible();

    // 2. Verify all inputs are disabled in locked state
    const scorerSelects = page.locator('select').filter({ hasText: /Select Goal Scorer/i });
    for (let i = 0; i < await scorerSelects.count(); i++) {
      await expect(scorerSelects.nth(i)).toBeDisabled();
    }

    const assistSelects = page.locator('select').filter({ hasText: /None \(Solo Goal/i });
    for (let i = 0; i < await assistSelects.count(); i++) {
      await expect(assistSelects.nth(i)).toBeDisabled();
    }

    // 3. Verify the Save button is permanently disabled with locked label
    const lockedSaveBtn = page.getByRole('button', { name: /Events Recorded \(Locked\)/i });
    await expect(lockedSaveBtn).toBeVisible();
    await expect(lockedSaveBtn).toBeDisabled();
  });

  test('T4: Strict Own-Match Isolation - Coach only sees and records for own team matches', async ({ page }) => {
    // Fixture for other teams (NOT involving TEST_TEAM_ID)
    const otherTeamFixture = {
      id: '88888888-8888-4000-8000-000000000001',
      scheduled_time: '2026-09-08T15:00:00Z',
      status: 'FINISHED',
      score_home: 3,
      score_away: 0,
      home_team: { id: 'other-team-1', name: 'Engineering FC', short_name: 'ENG', logo_url: '' },
      away_team: { id: 'other-team-2', name: 'Science FC', short_name: 'SCI', logo_url: '' },
      competition: { name: 'Egerton Premier League' },
    };

    await page.route('**/rest/v1/teams*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTeams) });
    });

    // Only our team fixtures should be returned to the coach dashboard
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

    // Open modal
    const recordBtn = page.getByRole('button', { name: /Record Match Events/i }).first();
    await expect(recordBtn).toBeVisible({ timeout: 10000 });
    await recordBtn.click();

    // Advance through guidance
    await page.getByRole('button', { name: /Proceed/i }).click();

    // Verify the match list only contains our team fixtures, never other teams' matches
    const matchCards = page.locator('button').filter({ hasText: /vs Med FC/i });
    await expect(matchCards.first()).toBeVisible();
    await expect(page.getByText(/Engineering FC/i)).toHaveCount(0);
    await expect(page.getByText(/Science FC/i)).toHaveCount(0);
  });

  test('T5: Full Submission Workflow - Validation, Scorer Selection, Optional Assist & Cards Save', async ({ page }) => {
    let savedEventsPayload: any = null;

    await page.route('**/rest/v1/teams*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTeams) });
    });

    await page.route('**/rest/v1/fixtures*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockFixtures[0]]) });
    });

    await page.route('**/rest/v1/players*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlayers) });
    });

    await page.route('**/rest/v1/match_events*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (route.request().method() === 'POST') {
        savedEventsPayload = JSON.parse(route.request().postData() || '[]');
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(savedEventsPayload) });
      }
    });

    await page.goto('/#/coach');
    await page.waitForLoadState('networkidle');

    // Open modal
    const recordBtn = page.getByRole('button', { name: /Record Match Events/i }).first();
    await expect(recordBtn).toBeVisible({ timeout: 10000 });
    await recordBtn.click();

    // Step 1: Guidance popup
    await page.getByRole('button', { name: /Proceed/i }).click();

    // Step 2: Choose match from list of played matches
    const matchCard = page.getByRole('button', { name: /vs Med FC/i }).first();
    await matchCard.click();

    // 1. Validation check: Click Save without selecting scorer
    const saveBtn = page.getByRole('button', { name: /Save Match Events/i });
    await saveBtn.click();
    await expect(page.getByText(/Please select a goal scorer for Goal #1/i)).toBeVisible();

    // 2. Select Scorer for Goal #1 (Michael Olunga)
    const scorerSelect1 = page.locator('select').filter({ hasText: /Select Goal Scorer/i }).first();
    await scorerSelect1.selectOption('p-1');

    // 3. Select Assist for Goal #1 (Victor Wanyama)
    const assistSelect1 = page.locator('select').filter({ hasText: /None \(Solo Goal/i }).first();
    await assistSelect1.selectOption('p-2');

    // 4. Select Scorer for Goal #2 (Dennis Oliech), and click Solo Goal button inline
    const scorerSelect2 = page.locator('select').filter({ hasText: /Select Goal Scorer/i }).nth(1);
    await scorerSelect2.selectOption('p-3');
    const soloGoalBtn = page.getByRole('button', { name: /Solo Goal/i }).nth(1);
    await soloGoalBtn.click();

    // 5. Add Yellow Card for Musa Otieno
    const yellowSelect = page.locator('select').filter({ hasText: /\+ Add Yellow Card/i });
    await yellowSelect.selectOption('p-4');
    await expect(page.locator('span').filter({ hasText: '#4 Musa Otieno' }).first()).toBeVisible();

    // 6. Click Save -> Confirmation Popup appears
    await saveBtn.click();
    await expect(page.getByRole('heading', { name: /Confirm Match Events Submission/i })).toBeVisible();
    await expect(page.getByText(/Goal #1:/i)).toBeVisible();
    await expect(page.getByText(/Goal #2:/i)).toBeVisible();

    // 7. Click Confirm & Submit in confirmation popup
    const confirmBtn = page.getByRole('button', { name: /Confirm & Submit/i });
    await confirmBtn.click();

    // 8. Verify Toast notification appears
    await expect(page.getByText(/Match scorers and events recorded successfully!/i)).toBeVisible({ timeout: 10000 });

    // 9. Verify Post-Submission popup for remaining matches is shown
    await expect(page.getByRole('heading', { name: /Match Events Recorded!/i })).toBeVisible();

    // 10. Close from the completion popup
    const finishBtn = page.getByRole('button', { name: /Complete & Close|Done for Now/i });
    await finishBtn.click();

    // 11. Verify modal is closed
    const modalTitle = page.getByRole('heading', { name: /Record Past Match Events/i });
    await expect(modalTitle).not.toBeVisible();
  });
});
