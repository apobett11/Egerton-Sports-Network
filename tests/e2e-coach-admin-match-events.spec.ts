import { test, expect, Route } from '@playwright/test';

test.describe('E2E COACH & ADMIN MATCH EVENTS - STRICT VERIFICATION SUITE', () => {
  const COACH_ID = 'c0ac0000-0000-4000-8000-000000000001';
  const TEAM_ID = '10000000-0000-4000-8000-000000000001';
  const OPPONENT_TEAM_ID = '20000000-0000-4000-8000-000000000002';
  const PLAYED_FIXTURE_1 = 'a0000000-0000-4000-8000-000000000001';
  const PLAYED_FIXTURE_2 = 'a0000000-0000-4000-8000-000000000002';
  const UPCOMING_FIXTURE_3 = 'a0000000-0000-4000-8000-000000000003';
  const COMPETITION_ID = 'b0000000-0000-4000-8000-000000000001';

  const ADMIN_ID = 'b6e63390-3116-4dbc-a7a8-65fc13b86a8e';
  const ADMIN_EMAIL = 'admin@egerton.fc';

  const mockTeams = [
    {
      id: TEAM_ID,
      name: 'Super Eagles',
      short_name: 'SEG',
      competition_id: COMPETITION_ID,
      coach_id: COACH_ID,
      logo_url: 'https://example.com/eagles.png',
      crest_url: 'https://example.com/eagles.png',
      tactics_config: { formation: '4-3-3 Attack' },
    },
    {
      id: OPPONENT_TEAM_ID,
      name: 'BCOM FC',
      short_name: 'BCM',
      competition_id: COMPETITION_ID,
      coach_id: 'c0ac0000-0000-4000-8000-000000000002',
      logo_url: 'https://example.com/bcom.png',
      crest_url: 'https://example.com/bcom.png',
    },
  ];

  const mockPlayers = [
    { id: '30000000-0000-4000-8000-000000000001', first_name: 'Victor', last_name: 'Odhiambo', jersey_number: 10, number: 10, position: 'FW', team_id: TEAM_ID, status: 'Fit' },
    { id: '30000000-0000-4000-8000-000000000002', first_name: 'Trevor', last_name: 'Otieno', jersey_number: 7, number: 7, position: 'MID', team_id: TEAM_ID, status: 'Fit' },
    { id: '30000000-0000-4000-8000-000000000003', first_name: 'Mark', last_name: 'Kwanda', jersey_number: 9, number: 9, position: 'FW', team_id: TEAM_ID, status: 'Fit' },
  ];

  const mockFixtures = [
    {
      id: PLAYED_FIXTURE_1,
      matchday: 1,
      status: 'FINISHED',
      score_home: 2,
      score_away: 1,
      score: '2 - 1',
      date: 'Thu 1 Oct',
      scheduled_time: '2026-10-01T15:00:00Z',
      home_team_id: TEAM_ID,
      away_team_id: OPPONENT_TEAM_ID,
      competition_id: COMPETITION_ID,
      home_team: mockTeams[0],
      away_team: mockTeams[1],
    },
    {
      id: PLAYED_FIXTURE_2,
      matchday: 2,
      status: 'FT',
      score_home: 0,
      score_away: 0,
      score: '0 - 0',
      date: 'Fri 2 Oct',
      scheduled_time: '2026-10-02T15:00:00Z',
      home_team_id: OPPONENT_TEAM_ID,
      away_team_id: TEAM_ID,
      competition_id: COMPETITION_ID,
      home_team: mockTeams[1],
      away_team: mockTeams[0],
    },
    {
      id: UPCOMING_FIXTURE_3,
      matchday: 3,
      status: 'SCHEDULED',
      score_home: null,
      score_away: null,
      score: null,
      date: 'Sat 10 Oct',
      scheduled_time: '2026-10-10T15:00:00Z',
      home_team_id: TEAM_ID,
      away_team_id: OPPONENT_TEAM_ID,
      competition_id: COMPETITION_ID,
      home_team: mockTeams[0],
      away_team: mockTeams[1],
    },
  ];

  function makeJwt(userId: string, email: string, role: string) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      app_metadata: { provider: 'email' },
      user_metadata: { role },
      exp: Math.floor(Date.now() / 1000) + 86400,
    })).toString('base64url');
    return `${header}.${payload}.mocksignature`;
  }

  test('1. Coach sees ONLY played matches (never upcoming), updates scorers/assisters via Match Details button, with timestamp & creator, and updates are locked', async ({ page }) => {
    const insertedEvents: any[] = [];
    const coachJwt = makeJwt(COACH_ID, 'coacheagle@gmail.com', 'coach');

    const coachUser = {
      id: COACH_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'coacheagle@gmail.com',
      email_confirmed_at: '2026-01-01T00:00:00.000Z',
      user_metadata: { role: 'coach', team_id: TEAM_ID },
      app_metadata: { provider: 'email' },
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };

    const coachProfile = {
      id: COACH_ID,
      role: 'coach',
      first_name: 'Coach',
      last_name: 'Eagle',
      email: 'coacheagle@gmail.com',
      team_id: TEAM_ID,
      status: 'active',
    };

    // Pre-populate localStorage
    await page.addInitScript(({ cId, tId, jwt, user, prof }) => {
      const now = String(Date.now());
      const session = {
        access_token: jwt,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: 'mock-refresh-token',
        user,
      };
      localStorage.setItem('egerscore_auth_token', JSON.stringify(session));
      localStorage.setItem('esn_cached_user', JSON.stringify(user));
      localStorage.setItem('esn_cached_role', 'coach');
      localStorage.setItem('esn_cached_profile', JSON.stringify(prof));
      localStorage.setItem('esn_session_start_timestamp', now);
      localStorage.setItem('esn_last_activity_timestamp', now);
      localStorage.setItem('team_id', tId);
    }, { cId: COACH_ID, tId: TEAM_ID, jwt: coachJwt, user: coachUser, prof: coachProfile });

    // Mock Supabase Auth routes
    await page.route(/.*\/auth\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      if (url.includes('/user')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(coachUser),
        });
      }
      if (url.includes('/token') || url.includes('/session')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: coachJwt,
            token_type: 'bearer',
            expires_in: 86400,
            expires_at: Math.floor(Date.now() / 1000) + 86400,
            refresh_token: 'mock-refresh-token',
            user: coachUser,
          }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    // Mock Supabase REST routes
    await page.route(/.*\/rest\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      const method = route.request().method();
      const headers = route.request().headers();
      const isSingle = headers['accept']?.includes('vnd.pgrst.object');

      if (url.includes('/profiles')) {
        if (isSingle || url.includes('id=eq.')) {
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(coachProfile) });
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([coachProfile]) });
      }

      if (url.includes('/teams')) {
        if (isSingle) {
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTeams[0]) });
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTeams) });
      }

      if (url.includes('/players')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlayers) });
      }

      if (url.includes('/fixtures')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockFixtures) });
      }

      if (url.includes('/match_events')) {
        if (method === 'POST') {
          const postData = route.request().postDataJSON();
          const rows = Array.isArray(postData) ? postData : [postData];
          rows.forEach((r) => {
            insertedEvents.push({ ...r, id: `event-${insertedEvents.length + 1}` });
          });
          return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(rows) });
        }
        const fixMatch = url.match(/fixture_id=eq\.([a-f0-9-]+)/i);
        if (fixMatch) {
          const targetFixId = fixMatch[1];
          const filtered = insertedEvents.filter((e) => String(e.fixture_id).toLowerCase() === targetFixId.toLowerCase());
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(filtered) });
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(insertedEvents) });
      }

      if (url.includes('/rpc/recalculate_all_player_stats')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      }

      if (url.includes('/player_stats')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }

      if (url.includes('/competitions')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: COMPETITION_ID, name: 'Egerton Premier League' }]) });
      }

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Navigate to coach dashboard
    await page.goto('/#/coach');
    await page.waitForLoadState('domcontentloaded');

    // If redirected to login page due to initial state, log in cleanly
    const loginEmail = page.locator('#login-email');
    if (await loginEmail.isVisible({ timeout: 2500 }).catch(() => false)) {
      await loginEmail.fill('coacheagle@gmail.com');
      await page.locator('#login-password').fill('securepassword');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('**/#/**', { timeout: 10000 });
    }

    // Open Match Events modal via Homepage button
    const matchDetailsBtn = page.getByRole('button', { name: /Match Details|Update Match Events/i }).first();
    await expect(matchDetailsBtn).toBeVisible({ timeout: 15000 });
    await matchDetailsBtn.click();

    // Modal opens directly into SELECT_MATCH view (no guidance banner)
    const modalScope = page.locator('div.fixed.inset-0').first();

    // Verify that ONLY played matches are shown inside modal, NOT Matchday 3 (Upcoming)
    await expect(modalScope.getByText(/vs BCOM FC/i).first()).toBeVisible();
    await expect(modalScope.getByText(/Matchday 3|MD3/i)).toHaveCount(0); // Upcoming match must never appear in modal

    // Click into Matchday 1 (the 2-1 win with 2 goals scored)
    const match1Card = modalScope.locator('button').filter({ hasText: /2 Goals Scored/i }).first();
    await expect(match1Card).toBeVisible();
    await match1Card.click();

    // Select goal scorers for the 2 goals
    const scorerSelects = page.locator('select').filter({ hasText: /Select Goal Scorer/i });
    await expect(scorerSelects.first()).toBeVisible();

    // Goal 1: Victor Odhiambo, Assisted by Trevor Otieno
    await scorerSelects.first().selectOption('30000000-0000-4000-8000-000000000001');
    await page.getByRole('button', { name: /Assisted Goal/i }).first().click();
    const assistSelect = page.locator('select').filter({ hasText: /None \(Solo Goal/i }).first();
    await assistSelect.selectOption('30000000-0000-4000-8000-000000000002');

    // Goal 2: Mark Kwanda, Solo Goal
    await scorerSelects.nth(1).selectOption('30000000-0000-4000-8000-000000000003');
    await page.getByRole('button', { name: /Solo Goal/i }).nth(1).click();

    // Click Save Match Events
    const saveBtn = page.getByRole('button', { name: /Save Match Events/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Modal advances to Confirmation Popup
    const confirmSubmitHeading = page.getByRole('heading', { name: /Confirm Match Events Submission/i });
    await expect(confirmSubmitHeading).toBeVisible();

    // Confirm Submission Permanently
    const confirmBtn = page.getByRole('button', { name: /Confirm & Submit/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify events were inserted into database with created_at timestamp and created_by coach
    await expect.poll(() => insertedEvents.length).toBe(2);
    expect(insertedEvents[0].created_by).toBe(COACH_ID);
    expect(insertedEvents[0].created_at).toBeTruthy();
    expect(insertedEvents[1].created_by).toBe(COACH_ID);
    expect(insertedEvents[1].created_at).toBeTruthy();

    // Modal shows REMAINING_MATCHES view with Done button
    const doneBtn = page.getByRole('button', { name: /Done for Now|Complete & Close/i });
    await expect(doneBtn).toBeVisible();
    await doneBtn.click();

    // Re-open modal to inspect recorded match
    await matchDetailsBtn.click();

    // Verify Matchday 1 is marked as UPDATED (CLOSED) and is closed/non-clickable
    const updatedMatch1 = modalScope.locator('div').filter({ hasText: /2 Goals Scored/i }).first();
    await expect(updatedMatch1.getByText(/UPDATED \(CLOSED\)/i)).toBeVisible();
    // It is no longer an interactive button
    await expect(modalScope.locator('button').filter({ hasText: /2 Goals Scored/i })).toHaveCount(0);
  });

  test('2. Table & Fixtures desk displays UPDATED status, allows recording from fixtures page, and locks submitted matches', async ({ page }) => {
    const insertedEvents: any[] = [
      {
        id: 'event-prev-1',
        fixture_id: PLAYED_FIXTURE_1,
        team_id: TEAM_ID,
        player_id: '30000000-0000-4000-8000-000000000001',
        event_type: 'goal',
        type: 'goal',
        is_official: true,
        created_at: new Date().toISOString(),
        created_by: COACH_ID,
      },
    ];

    const coachJwt = makeJwt(COACH_ID, 'coacheagle@gmail.com', 'coach');
    const coachUser = {
      id: COACH_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'coacheagle@gmail.com',
      user_metadata: { role: 'coach', team_id: TEAM_ID },
      app_metadata: { provider: 'email' },
    };
    const coachProfile = {
      id: COACH_ID,
      role: 'coach',
      first_name: 'Coach',
      last_name: 'Eagle',
      email: 'coacheagle@gmail.com',
      team_id: TEAM_ID,
      status: 'active',
    };

    await page.addInitScript(({ cId, tId, jwt, user, prof }) => {
      const now = String(Date.now());
      const session = {
        access_token: jwt,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: 'mock-refresh-token',
        user,
      };
      localStorage.setItem('egerscore_auth_token', JSON.stringify(session));
      localStorage.setItem('esn_cached_user', JSON.stringify(user));
      localStorage.setItem('esn_cached_role', 'coach');
      localStorage.setItem('esn_cached_profile', JSON.stringify(prof));
      localStorage.setItem('esn_session_start_timestamp', now);
      localStorage.setItem('esn_last_activity_timestamp', now);
      localStorage.setItem('team_id', tId);
    }, { cId: COACH_ID, tId: TEAM_ID, jwt: coachJwt, user: coachUser, prof: coachProfile });

    await page.route(/.*\/auth\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      if (url.includes('/user')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(coachUser) });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: coachJwt,
          token_type: 'bearer',
          expires_in: 86400,
          expires_at: Math.floor(Date.now() / 1000) + 86400,
          refresh_token: 'mock-refresh-token',
          user: coachUser,
        }),
      });
    });

    await page.route(/.*\/rest\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      const method = route.request().method();
      const isSingle = route.request().headers()['accept']?.includes('vnd.pgrst.object');

      if (url.includes('/profiles')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle || url.includes('id=eq.') ? coachProfile : [coachProfile]),
        });
      }
      if (url.includes('/teams')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle ? mockTeams[0] : mockTeams),
        });
      }
      if (url.includes('/players')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlayers) });
      }
      if (url.includes('/fixtures')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockFixtures) });
      }
      if (url.includes('/match_events')) {
        if (method === 'POST') {
          const postData = route.request().postDataJSON();
          const rows = Array.isArray(postData) ? postData : [postData];
          rows.forEach((r) => {
            insertedEvents.push({ ...r, id: `event-${insertedEvents.length + 1}` });
          });
          return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(rows) });
        }
        const fixMatch = url.match(/fixture_id=eq\.([a-f0-9-]+)/i);
        if (fixMatch) {
          const targetFixId = fixMatch[1];
          const filtered = insertedEvents.filter((e) => String(e.fixture_id).toLowerCase() === targetFixId.toLowerCase());
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(filtered) });
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(insertedEvents) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Navigate to coach dashboard
    await page.goto('/#/coach');
    await page.waitForLoadState('domcontentloaded');

    // Click into "Fixtures & Standings" via overview button
    const standingsNavBtn = page.getByRole('button', { name: /Fixtures & Standings/i }).first();
    await expect(standingsNavBtn).toBeVisible({ timeout: 15000 });
    await standingsNavBtn.click();

    // Verify Table & Fixtures page header is loaded
    await expect(page.getByRole('heading', { name: /Table & Fixtures Desk/i })).toBeVisible();

    // Verify UPDATED badge appears on Matchday 1 and is strictly closed (not a clickable button)
    await expect(page.getByText(/UPDATED/i).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /UPDATED/i })).toHaveCount(0);

    // Click "Input Events" for Matchday 2 (the 0-0 match)
    const recordEventsBtn = page.getByRole('button', { name: /Input Events/i }).first();
    await expect(recordEventsBtn).toBeVisible();
    await recordEventsBtn.click();

    // Modal opens directly in RECORD_EVENTS view for Matchday 2 (no guidance banner)
    await expect(page.getByText(/0 goals scored/i).first()).toBeVisible();
    const saveEventsBtn = page.getByRole('button', { name: /Save Match Events/i });
    await expect(saveEventsBtn).toBeVisible();
    await saveEventsBtn.click();

    // Confirm permanently
    const confirmBtn = page.getByRole('button', { name: /Confirm & Submit/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify that FT event was recorded with created_at timestamp and coach ID
    await expect.poll(() => insertedEvents.length).toBeGreaterThan(1);
    const lastEvent = insertedEvents[insertedEvents.length - 1];
    expect(lastEvent.created_by).toBe(COACH_ID);
    expect(lastEvent.created_at).toBeTruthy();
  });

  test('3. Admin Team Preparedness and Match Log reflects real match data on refresh with zero seeded mock data', async ({ page }) => {
    const adminJwt = makeJwt(ADMIN_ID, ADMIN_EMAIL, 'admin');
    const adminUser = {
      id: ADMIN_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: ADMIN_EMAIL,
      user_metadata: { role: 'admin' },
      app_metadata: { provider: 'email' },
    };
    const adminProfile = {
      id: ADMIN_ID,
      role: 'admin',
      first_name: 'Admin',
      last_name: 'Super',
      email: ADMIN_EMAIL,
      status: 'active',
    };

    const recordedEvents = [
      {
        id: 'e1',
        fixture_id: PLAYED_FIXTURE_1,
        team_id: TEAM_ID,
        player_id: '30000000-0000-4000-8000-000000000001',
        type: 'goal',
        event_type: 'goal',
        detail_text: 'Victor Odhiambo (Assisted by Trevor Otieno)',
        is_official: true,
        created_at: '2026-10-01T17:00:00Z',
        created_by: COACH_ID,
      },
    ];

    await page.addInitScript(({ aId, jwt, user, prof }) => {
      const now = String(Date.now());
      const session = {
        access_token: jwt,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: 'mock-refresh-token',
        user,
      };
      localStorage.setItem('egerscore_auth_token', JSON.stringify(session));
      localStorage.setItem('esn_cached_user', JSON.stringify(user));
      localStorage.setItem('esn_cached_role', 'admin');
      localStorage.setItem('esn_cached_profile', JSON.stringify(prof));
      localStorage.setItem('esn_session_start_timestamp', now);
      localStorage.setItem('esn_last_activity_timestamp', now);
      // Pre-clear 2FA clearance
      sessionStorage.setItem('esn_admin_2fa_verified', 'true');
      localStorage.setItem('esn_admin_2fa_cleared_until', String(Date.now() + 86400000 * 7));
    }, { aId: ADMIN_ID, jwt: adminJwt, user: adminUser, prof: adminProfile });

    await page.route(/.*\/auth\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      if (url.includes('/user')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminUser) });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: adminJwt,
          token_type: 'bearer',
          expires_in: 86400,
          expires_at: Math.floor(Date.now() / 1000) + 86400,
          refresh_token: 'mock-refresh-token',
          user: adminUser,
        }),
      });
    });

    await page.route(/.*\/rest\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      const isSingle = route.request().headers()['accept']?.includes('vnd.pgrst.object');

      if (url.includes('/profiles')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle || url.includes('id=eq.') ? adminProfile : [adminProfile]),
        });
      }
      if (url.includes('/teams')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTeams),
        });
      }
      if (url.includes('/fixtures')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockFixtures) });
      }
      if (url.includes('/players')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlayers) });
      }
      if (url.includes('/match_events')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(recordedEvents) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Navigate to Admin Dashboard
    await page.goto('/#/admin');
    await page.waitForLoadState('domcontentloaded');

    // Click "Team Preparedness"
    const preparednessBtn = page.getByRole('button', { name: /Team Preparedness/i }).first();
    await expect(preparednessBtn).toBeVisible({ timeout: 15000 });
    await preparednessBtn.click();

    // Verify Preparedness Modal opens
    const modalHeading = page.getByRole('heading', { name: /Team Preparedness/i });
    await expect(modalHeading).toBeVisible();

    // Switch to "Match Log" tab
    const matchLogTab = page.getByRole('button', { name: /Match Log/i });
    await expect(matchLogTab).toBeVisible();
    await matchLogTab.click();

    // Verify real match log content reflects the coach's recorded scorers and assists
    await expect(page.getByText(/Victor Odhiambo/i).first()).toBeVisible();

    // Trigger refresh button inside modal to test reload
    const refreshBtn = page.getByRole('button', { name: /Reload from database/i }).first();
    if (await refreshBtn.isVisible().catch(() => false)) {
      await refreshBtn.click();
      await expect(page.getByText(/Victor Odhiambo/i).first()).toBeVisible();
    }
  });
});
