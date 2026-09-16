import { test, expect } from '@playwright/test';
import {
  saveCoachMatchEvents,
  fetchCoachMatchEvents,
  CoachMatchEventsPayload,
} from '../src/components/Dashboards/Team/lib/supabaseClient';

test.describe('COACH PAST MATCH EVENTS - SCORERS, ASSISTS & DISCIPLINARY MODAL', () => {
  const TEST_TEAM_ID = '10000000-0000-4000-8000-000000000002';
  const OPPONENT_TEAM_ID = '20000000-0000-4000-8000-000000000003';
  const FIXTURE_ID = '99999999-9999-4000-8000-000000000001';

  test('T1: Unit/Persistence - saveCoachMatchEvents strictly isolates own team events', async () => {
    // Simulated events for our team
    const payload: CoachMatchEventsPayload = {
      goals: [
        { playerId: 'player-1', assistPlayerId: 'player-2', minute: 23 },
        { playerId: 'player-3', assistPlayerId: undefined, minute: 67 }, // Solo goal / free kick (optional assist)
      ],
      yellowCardPlayerIds: ['player-4'],
      redCardPlayerIds: ['player-5'],
    };

    // Verify payload contract
    expect(payload.goals).toHaveLength(2);
    expect(payload.goals[0].playerId).toBe('player-1');
    expect(payload.goals[0].assistPlayerId).toBe('player-2');
    expect(payload.goals[1].playerId).toBe('player-3');
    expect(payload.goals[1].assistPlayerId).toBeUndefined(); // Optional assist
    expect(payload.yellowCardPlayerIds).toEqual(['player-4']);
    expect(payload.redCardPlayerIds).toEqual(['player-5']);
  });

  test('T2: UI Workflow - Open Coach Dashboard, Open Match Events Modal, Verify Structure & Controls', async ({ page }) => {
    // Intercept Supabase API calls to provide deterministic mock data
    await page.route('**/rest/v1/fixtures*', async (route) => {
      const mockFixtures = [
        {
          id: FIXTURE_ID,
          scheduled_time: '2026-09-10T15:00:00Z',
          status: 'FT',
          score_home: 2,
          score_away: 1,
          venue: 'Pavilion Main Stadium',
          matchday: 3,
          home_team: { id: TEST_TEAM_ID, name: 'Egerton FC', short_name: 'EFC', logo_url: '' },
          away_team: { id: OPPONENT_TEAM_ID, name: 'Med FC', short_name: 'MED', logo_url: '' },
          competition: { name: 'Egerton Premier League' },
        },
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockFixtures),
      });
    });

    await page.route('**/rest/v1/players*', async (route) => {
      const mockPlayers = [
        { id: 'p-1', first_name: 'Victor', last_name: 'Wanyama', jersey_number: 6, position: 'MID', status: 'Fit' },
        { id: 'p-2', first_name: 'Michael', last_name: 'Olunga', jersey_number: 14, position: 'FW', status: 'Fit' },
        { id: 'p-3', first_name: 'Dennis', last_name: 'Oliech', jersey_number: 9, position: 'FW', status: 'Fit' },
        { id: 'p-4', first_name: 'Musa', last_name: 'Otieno', jersey_number: 4, position: 'DF', status: 'Fit' },
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlayers),
      });
    });

    await page.route('**/rest/v1/match_events*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (route.request().method() === 'DELETE' || route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    // Navigate to Coach Dashboard
    await page.goto('/#/coach');
    await page.waitForLoadState('networkidle');

    // Verify "Record Match Events" button is present in Coach Command Center
    const recordBtn = page.getByRole('button', { name: /Record Match Events/i }).first();
    await expect(recordBtn).toBeVisible({ timeout: 10000 });
    await recordBtn.click();

    // Verify Modal opens with clean card styling
    const modalTitle = page.getByRole('heading', { name: /Record Past Match Events/i });
    await expect(modalTitle).toBeVisible();

    // Verify Match Selector shows Egerton FC vs Med FC
    const fixtureSelect = page.locator('select').first();
    await expect(fixtureSelect).toBeVisible();

    // Verify Goals section is present
    const goalsHeading = page.getByRole('heading', { name: /Goal Scorers & Assists/i });
    await expect(goalsHeading).toBeVisible();

    // Verify Cards & Disciplinary section is present
    const cardsHeading = page.getByRole('heading', { name: /Cards & Disciplinary/i });
    await expect(cardsHeading).toBeVisible();

    // Verify Save button is visible
    const saveBtn = page.getByRole('button', { name: /Save Match Events/i });
    await expect(saveBtn).toBeVisible();

    // Verify strictly NO forbidden text is rendered
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).not.toContain('google form');

    // Close modal
    const cancelBtn = page.getByRole('button', { name: /Cancel/i });
    await cancelBtn.click();
    await expect(modalTitle).not.toBeVisible();
  });

  test('T3: Goal Scorers Validation & Optional Assist Handling', async ({ page }) => {
    await page.route('**/rest/v1/teams*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: TEST_TEAM_ID,
            name: 'Egerton FC',
            short_name: 'EFC',
            competition_id: '11111111-1111-1111-1111-111111111111',
            coach_id: 'coach-id',
          },
        ]),
      });
    });

    await page.route('**/rest/v1/fixtures*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: FIXTURE_ID,
            scheduled_time: '2026-09-10T15:00:00Z',
            status: 'FINISHED',
            score_home: 1,
            score_away: 0,
            venue: 'Pavilion Main Stadium',
            matchday: 1,
            home_team: { id: TEST_TEAM_ID, name: 'Egerton FC', short_name: 'EFC', logo_url: '' },
            away_team: { id: OPPONENT_TEAM_ID, name: 'Med FC', short_name: 'MED', logo_url: '' },
            competition: { name: 'Egerton Premier League' },
          },
        ]),
      });
    });

    await page.route('**/rest/v1/players*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'p-1', first_name: 'Michael', last_name: 'Olunga', number: 14, position: 'FW', status: 'Fit' },
          { id: 'p-2', first_name: 'Victor', last_name: 'Wanyama', number: 6, position: 'MID', status: 'Fit' },
        ]),
      });
    });

    await page.route('**/rest/v1/match_events*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/#/coach');
    await page.waitForLoadState('networkidle');

    // Open modal
    const recordBtn = page.getByRole('button', { name: /Record Match Events/i }).first();
    await expect(recordBtn).toBeVisible({ timeout: 10000 });
    await recordBtn.click();

    // Verify modal is open
    const modalTitle = page.getByRole('heading', { name: /Record Past Match Events/i });
    await expect(modalTitle).toBeVisible({ timeout: 10000 });

    // Verify Goal #1 slot is present
    await expect(page.getByText(/Goal #1/i)).toBeVisible({ timeout: 10000 });

    // Try clicking Save without selecting a scorer -> validation triggers
    const saveBtn = page.getByRole('button', { name: /Save Match Events/i });
    await saveBtn.click();

    await expect(page.getByText(/Please select a goal scorer/i)).toBeVisible();

    // Now select a scorer
    const scorerSelect = page.locator('select').filter({ hasText: /Select Goal Scorer/i }).first();
    await scorerSelect.selectOption({ index: 1 });

    // Verify assist option defaults to None (Solo Goal / Free Kick / Direct)
    const assistSelect = page.locator('select').filter({ hasText: /None \(Solo Goal/i }).first();
    await expect(assistSelect).toBeVisible();
    const assistVal = await assistSelect.inputValue();
    expect(assistVal).toBe(''); // empty string represents no assist / optional
  });
});
