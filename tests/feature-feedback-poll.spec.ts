import { test, expect, Route } from '@playwright/test';

test.describe('Match Predictions Preview & Determinant Poll Tests', () => {
  test('Guest Homepage: Tooltip appears, clicking ODDS opens preview modal with psychological safety note & allows determinant voting', async ({ page }) => {
    // Intercept Supabase fixtures & anonymous devices calls
    await page.route(/.*\/rest\/v1\/fixtures.*/, async (route: Route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-1/2' },
        body: JSON.stringify([
          {
            id: 'fix-1',
            home_team_id: 't-1',
            away_team_id: 't-2',
            home_team_name: 'Five Stars fc',
            away_team_name: 'Blue Blazers',
            score_home: 0,
            score_away: 0,
            status: 'UPCOMING',
            matchday: 1,
            scheduled_time: new Date().toISOString(),
            competition_id: '11111111-1111-1111-1111-111111111111',
            league: 'Egerton Premier League',
          },
        ]),
      });
    });

    await page.route(/.*\/rest\/v1\/anonymous_devices.*/, async (route: Route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          device_id: 'dev-test-1234',
          has_completed_onboarding: true,
          favorite_team_id: null,
        }),
      });
    });

    // Intercept feature feedback polls API
    let recordedVote: string | null = null;
    let recordedOpenedOdds: boolean = false;
    await page.route(/.*\/rest\/v1\/feature_feedback_polls.*/, async (route: Route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const postData = route.request().postDataJSON();
        if (postData?.vote) {
          recordedVote = postData.vote;
        }
        if (postData?.opened_odds_page) {
          recordedOpenedOdds = true;
        }
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, ...postData }),
        });
      }
      if (method === 'GET') {
        if (recordedVote || recordedOpenedOdds) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'v1', device_id: 'dev-test-1234', opened_odds_page: recordedOpenedOdds, vote: recordedVote, created_at: new Date().toISOString() }]),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      return route.continue();
    });

    // Navigate to homepage
    await page.goto('/');

    // 1. Verify ODDS button has the permanent NEW badge
    const oddsButton = page.locator('button', { hasText: 'ODDS' }).first();
    await expect(oddsButton).toBeVisible();
    await expect(oddsButton.locator('text=NEW')).toBeVisible();

    // 2. Verify New Feature Tooltip is visible on the fixtures filters row for a first-time device
    const tooltip = page.locator('text=New. Check this out!');
    await expect(tooltip).toBeVisible({ timeout: 5000 });

    // 3. Dismiss the popup: click somewhere else on the page to collapse it
    await page.mouse.click(10, 10);
    await expect(tooltip).not.toBeVisible({ timeout: 2000 });

    // 4. Click the ODDS button to open odds page and redesigned modal
    await oddsButton.click();

    // 5. Verify modal opened with title, How It Works, and NB guidelines below the poll
    const modalTitle = page.locator('text=Weekend Match Predictor Challenge');
    await expect(modalTitle).toBeVisible();

    const howItWorks = page.locator('text=How It Works');
    await expect(howItWorks).toBeVisible();

    const nbNotice = page.locator('text=NB: Important Guidelines & Mental Peace');
    await expect(nbNotice).toBeVisible();
    await expect(page.locator('text=Zero Money:')).toBeVisible();
    await expect(page.locator('text=100% Private:')).toBeVisible();

    // 6. Verify determinant question and options are visible
    const yesButton = page.locator('button', { hasText: 'Yes, Great Idea!' });
    const noButton = page.locator('button', { hasText: 'No, Prefer Not' });
    await expect(yesButton).toBeVisible();
    await expect(noButton).toBeVisible();

    // 7. Cast vote "Yes"
    await yesButton.click();

    // 8. Verify modal closes and user is returned to homepage with ALL filter active
    await expect(modalTitle).not.toBeVisible({ timeout: 3000 });

    // 9. On subsequent visit/reload: since device has opened odds page, popup stays permanently dismissed, while NEW badge remains on button
    await page.reload();
    await expect(page.locator('text=New. Check this out!')).not.toBeVisible({ timeout: 2000 });
    await expect(page.locator('button', { hasText: 'ODDS' }).first().locator('text=NEW')).toBeVisible();
  });

  test('Admin 2 Dashboard: Switch to Polls & Feature Determinants sub-page and verify metrics display', async ({ page }) => {
    const adminId = 'b6e63390-3116-4dbc-a7a8-65fc13b86a8e';
    const adminEmail = 'apobett11@gmail.com';

    const headerBase64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadBase64 = Buffer.from(JSON.stringify({
      sub: adminId,
      aud: 'authenticated',
      role: 'authenticated',
      email: adminEmail,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { role: 'admin' },
      exp: Math.floor(Date.now() / 1000) + 86400,
    })).toString('base64url');
    const validJwt = `${headerBase64}.${payloadBase64}.signaturemockvalidjwt`;

    const adminUser = {
      id: adminId,
      aud: 'authenticated',
      role: 'authenticated',
      email: adminEmail,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { role: 'admin' },
      created_at: '2026-08-01T00:00:00.000Z',
    };

    // Mock Auth
    await page.route(/.*\/auth\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      if (url.includes('/user')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminUser) });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: validJwt, user: adminUser }),
      });
    });

    // Mock all REST DB endpoints so nothing fails on mock JWT
    await page.route(/.*\/rest\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      const isSingle = route.request().headers()['accept']?.includes('vnd.pgrst.object');

      if (url.includes('/rest/v1/profiles')) {
        const prof = { id: adminId, email: adminEmail, role: 'admin', first_name: 'Admin', last_name: 'User' };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle ? prof : [prof]),
        });
      }

      if (url.includes('/rest/v1/feature_feedback_polls')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'p1', device_id: 'dev_mock_alpha_123', opened_guest_page: true, opened_odds_page: true, voted: true, vote: 'yes', created_at: new Date().toISOString() },
            { id: 'p2', device_id: 'dev_mock_beta_456', opened_guest_page: true, opened_odds_page: true, voted: true, vote: 'no', created_at: new Date().toISOString() },
            { id: 'p3', device_id: 'dev_mock_gamma_789', opened_guest_page: true, opened_odds_page: false, voted: false, vote: null, created_at: new Date().toISOString() },
          ]),
        });
      }

      if (url.includes('/rest/v1/anonymous_devices')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': '0-2/3' },
          body: JSON.stringify([
            { device_id: 'dev_1', last_seen_at: new Date().toISOString() },
          ]),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? {} : []),
      });
    });

    // Pre-authorize Admin 2 and 2FA in session storage
    await page.addInitScript(({ id, email, user, token }) => {
      const now = Date.now().toString();
      const sessionPayload = {
        access_token: token,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: 'mock-refresh-token',
        user,
      };
      localStorage.setItem('egerscore_auth_token', JSON.stringify(sessionPayload));
      localStorage.setItem('esn_cached_role', 'admin');
      localStorage.setItem('esn_cached_user', JSON.stringify(user));
      localStorage.setItem(
        'esn_cached_profile',
        JSON.stringify({
          id,
          email,
          role: 'admin',
          first_name: 'System',
          last_name: 'Admin',
        })
      );
      localStorage.setItem('esn_last_activity_timestamp', now);
      localStorage.setItem('esn_session_start_timestamp', now);
      sessionStorage.setItem('esn_admin_2fa_verified', 'true');
      localStorage.setItem('esn_admin_2fa_cleared_until', String(Date.now() + 86400000));
      sessionStorage.setItem('esn_admin_2_unlocked', 'true');
    }, { id: adminId, email: adminEmail, user: adminUser, token: validJwt });

    // Navigate to admin
    await page.goto('/#admin');
    await expect(page.locator('text=Operations Center')).toBeVisible({ timeout: 15000 });

    // Click Admin 2 Telemetry sidebar button
    const admin2TabBtn = page.locator('aside button:has-text("Admin 2 Telemetry")');
    await admin2TabBtn.click();

    // Verify Admin 2 loaded
    const admin2Header = page.locator('text=Admin 2 • Deep Telemetry & User Flow Analytics');
    await expect(admin2Header).toBeVisible({ timeout: 15000 });

    // Click "Polls & Feature Determinants" sub-tab
    const pollsTabBtn = page.locator('button:has-text("Polls & Feature Determinants")');
    await expect(pollsTabBtn).toBeVisible();
    await pollsTabBtn.click();

    // Verify Admin 2 Polls view rendered
    await expect(page.locator('text=Admin 2 • Polls & Feature Determinants')).toBeVisible();
    await expect(page.locator('text=Guest Page').first()).toBeVisible();
    await expect(page.locator('text=Odds Opened').first()).toBeVisible();
    await expect(page.locator('text=Total Voted').first()).toBeVisible();
    await expect(page.locator('text=Yes (In Favor)').first()).toBeVisible();
    await expect(page.locator('text=Weekly Fixtures Match Prediction Lifecycle')).toBeVisible();
    await expect(page.locator('text=Device Determinant Responses Log')).toBeVisible();
  });

  test('Guest Homepage: Tooltip appears once per session for device without opened odds, and never appears once odds is opened', async ({ page }) => {
    let devOpenedOdds = false;
    const testDeviceId = 'device-session-check-99';

    await page.route(/.*\/rest\/v1\/fixtures.*/, async (route: Route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-0/1' },
        body: JSON.stringify([]),
      });
    });

    await page.route(/.*\/rest\/v1\/anonymous_devices.*/, async (route: Route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          device_id: testDeviceId,
          has_completed_onboarding: true,
          favorite_team_id: null,
        }),
      });
    });

    await page.route(/.*\/rest\/v1\/feature_feedback_polls.*/, async (route: Route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const postData = route.request().postDataJSON();
        if (postData?.opened_odds_page) {
          devOpenedOdds = true;
        }
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, ...postData }),
        });
      }
      if (method === 'GET') {
        if (devOpenedOdds) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'v2', device_id: testDeviceId, opened_odds_page: true, vote: null }]),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      return route.continue();
    });

    // 1. First session load: tooltip must appear
    await page.goto('/');
    const tooltip = page.locator('text=New. Check this out!');
    await expect(tooltip).toBeVisible({ timeout: 5000 });

    // 2. Dismiss by clicking anywhere outside
    await page.mouse.click(20, 20);
    await expect(tooltip).not.toBeVisible({ timeout: 2000 });

    // 3. Reload in same session: tooltip must NOT re-appear in same session
    await page.reload();
    await expect(tooltip).not.toBeVisible({ timeout: 2000 });

    // 4. Simulate closing session and opening a new session (clear sessionStorage)
    await page.evaluate(() => {
      sessionStorage.clear();
    });
    await page.reload();
    // Since opened_odds_page is still false in DB, new session shows tooltip again!
    await expect(tooltip).toBeVisible({ timeout: 5000 });

    // 5. User opens the ODDS feature
    const oddsButton = page.locator('button', { hasText: 'ODDS' }).first();
    await oddsButton.click();
    await expect(page.locator('text=Weekend Match Predictor Challenge')).toBeVisible();

    // 6. Close the modal
    const closeBtn = page.locator('button[aria-label="Close"]').first();
    await closeBtn.click();

    // 7. Simulate another new session (clear sessionStorage)
    await page.evaluate(() => {
      sessionStorage.clear();
    });
    await page.reload();

    // 8. Because opened_odds_page is now true in DB and localStorage, tooltip NEVER appears again
    await expect(tooltip).not.toBeVisible({ timeout: 3000 });
  });
});
