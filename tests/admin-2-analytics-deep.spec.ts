import { test, expect, Route } from '@playwright/test';

test.describe('Admin 2 Deep Telemetry & Analytics Suite', () => {
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
  const validJwt = `${headerBase64}.${payloadBase64}.mockedsignature`;

  const adminUser = {
    id: adminId,
    aud: 'authenticated',
    role: 'authenticated',
    email: adminEmail,
    email_confirmed_at: '2026-08-01T00:00:00.000Z',
    phone: '',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { role: 'admin' },
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z',
  };

  test.beforeEach(async ({ page }) => {
    // Intercept Auth endpoints
    await page.route(/.*\/auth\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      if (url.includes('/user')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminUser) });
      }
      if (url.includes('/token') || url.includes('/session')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: validJwt,
            token_type: 'bearer',
            expires_in: 86400,
            expires_at: Math.floor(Date.now() / 1000) + 86400,
            refresh_token: 'mock-refresh-token',
            user: adminUser,
          }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    // Intercept REST endpoints
    await page.route(/.*\/rest\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      const headers = { ...route.request().headers() };
      const isSingle = headers['accept']?.includes('vnd.pgrst.object');

      if (url.includes('/rest/v1/profiles')) {
        const profileObj = {
          id: adminId,
          role: 'admin',
          first_name: 'System',
          last_name: 'Admin',
          email: adminEmail,
          bio: '',
          created_at: '2026-08-01T00:00:00.000Z',
          updated_at: '2026-08-01T00:00:00.000Z',
        };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle || url.includes('id=eq.') ? profileObj : [profileObj]),
        });
      }

      if (url.includes('/rest/v1/anonymous_devices')) {
        const sampleDevices = Array.from({ length: 602 }, (_, i) => ({
          device_id: `dev-${i}`,
          last_seen_at: i < 89 ? new Date().toISOString() : '2026-09-01T12:00:00Z',
          favorite_team_id: null,
        }));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': '0-601/602' },
          body: JSON.stringify(sampleDevices),
        });
      }

      if (url.includes('/rest/v1/teams')) {
        const mockTeams = [
          { id: 't1', name: 'Five Stars fc', short_name: 'FSF' },
          { id: 't2', name: 'Blue Blazers', short_name: 'BLU' },
          { id: 't3', name: 'Legends Fc', short_name: 'LGD' },
          { id: 't4', name: 'Giants FC', short_name: 'GNT' },
        ];
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTeams),
        });
      }

      if (url.includes('/rest/v1/system_settings')) {
        if (url.includes('admin_2_security')) {
          const setting = { key: 'admin_2_security', value: { password: 'Apo1574bett7687', updated_at: new Date().toISOString() } };
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(isSingle ? setting : [setting]),
          });
        }
        if (url.includes('admin_2_analytics')) {
          const analyticsSetting = {
            key: 'admin_2_analytics',
            value: {
              teams: [
                { id: 't1', name: 'Five Stars fc', shortName: 'FSF', visitsWeek: 883, visitsMonth: 3532, avgDwellTime: '4.2m', sharePercentage: 14.8 },
                { id: 't2', name: 'Blue Blazers', shortName: 'BLU', visitsWeek: 778, visitsMonth: 3112, avgDwellTime: '3.8m', sharePercentage: 13.0 },
                { id: 't3', name: 'Legends Fc', shortName: 'LGD', visitsWeek: 696, visitsMonth: 2784, avgDwellTime: '3.5m', sharePercentage: 11.6 },
                { id: 't4', name: 'Giants FC', shortName: 'GNT', visitsWeek: 662, visitsMonth: 2649, avgDwellTime: '3.2m', sharePercentage: 11.1 },
              ],
              pageViewsCurrent: {
                perHour: { homepage: 48, fixtures: 24, standings: 18, formTables: 12, teamsProfiles: 32, matchDetails: 42, otherPages: 14 },
                perDay: { homepage: 840, fixtures: 420, standings: 310, formTables: 215, teamsProfiles: 560, matchDetails: 730, otherPages: 245 },
                perWeekMonFri: { homepage: 2980, fixtures: 1490, standings: 1100, formTables: 760, teamsProfiles: 1980, matchDetails: 2590, otherPages: 870 },
                perWeekSatSun: { homepage: 2860, fixtures: 1430, standings: 1050, formTables: 730, teamsProfiles: 1910, matchDetails: 2500, otherPages: 840 },
                thisMonth: { homepage: 8940, fixtures: 4470, standings: 3290, formTables: 2280, teamsProfiles: 5970, matchDetails: 7790, otherPages: 2610 },
              },
              pageViewsPrevious: {
                prevHour: { homepage: 42, fixtures: 20, standings: 15, formTables: 10, teamsProfiles: 28, matchDetails: 36, otherPages: 12 },
                prevDay: { homepage: 790, fixtures: 395, standings: 290, formTables: 200, teamsProfiles: 525, matchDetails: 685, otherPages: 230 },
                lastWeek: { homepage: 5540, fixtures: 2770, standings: 2045, formTables: 1415, teamsProfiles: 3695, matchDetails: 4835, otherPages: 1625 },
                lastMonth: { homepage: 22800, fixtures: 11400, standings: 8400, formTables: 5820, teamsProfiles: 15200, matchDetails: 19900, otherPages: 6680 },
              },
            },
          };
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(isSingle ? analyticsSetting : [analyticsSetting]),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle ? {} : []),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? {} : []),
      });
    });
  });

  test('Admin 2 Full Suite: Devices, Sortable Users Graph (Hour/Day/Week/Month), Enlarged Tables, and Team Visits Graph', async ({ page }) => {
    // Seed authenticated session with 2FA cleared and Admin 2 unlocked
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
      localStorage.setItem('livescore_auth_token', JSON.stringify(sessionPayload));
      localStorage.setItem('esn_cached_role', 'admin');
      localStorage.setItem('esn_cached_user', JSON.stringify(user));
      localStorage.setItem('esn_cached_profile', JSON.stringify({ id, email, role: 'admin', first_name: 'System', last_name: 'Admin' }));
      localStorage.setItem('esn_last_activity_timestamp', now);
      localStorage.setItem('esn_session_start_timestamp', now);
      sessionStorage.setItem('esn_admin_2fa_verified', 'true');
      localStorage.setItem('esn_admin_2fa_cleared_until', String(Date.now() + 86400000));
      sessionStorage.setItem('esn_admin_2_unlocked', 'true');
    }, { id: adminId, email: adminEmail, user: adminUser, token: validJwt });

    await page.goto('/#admin');
    await expect(page.locator('text=Operations Center')).toBeVisible({ timeout: 15000 });

    // Navigate to Admin 2 Telemetry tab
    const admin2TabBtn = page.locator('aside button:has-text("Admin 2 Telemetry")');
    await admin2TabBtn.click();

    // Verify Admin 2 header and Realtime indicator
    await expect(page.locator('text=Admin 2 • Deep Telemetry & User Flow Analytics')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=REALTIME STREAM ACTIVE')).toBeVisible();

    // 1. Verify Devices & Active Today Metrics
    await expect(page.locator('text=Total Tracked Devices')).toBeVisible();
    await expect(page.locator('text=Active Today')).toBeVisible();
    await expect(page.locator('text=Active This Week')).toBeVisible();

    // 2. Test Users Graph Time Range (Hour, Day, Week, Month - Closes at Month)
    await expect(page.locator('button:has-text("Last Hour")')).toBeVisible();
    await expect(page.locator('button:has-text("Last Day")')).toBeVisible();
    await expect(page.locator('button:has-text("Last Week")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month', exact: true })).toBeVisible();

    // Click Last Hour
    await page.locator('button:has-text("Last Hour")').click();
    await expect(page.locator('text=Users Track in Graphs (Sortable Distribution)')).toBeVisible();

    // Click Last Week
    await page.locator('button:has-text("Last Week")').click();

    // Click Month (Closes at Month)
    await page.getByRole('button', { name: 'Month', exact: true }).click();

    // 3. Test Enlarged Page Views Matrix Tables (Current Period & Previous Period)
    // Table 1: Current Period
    await expect(page.locator('text=Current Period Page Views Matrix')).toBeVisible();
    await expect(page.locator('text=Per Hour (Current)')).toBeVisible();
    await expect(page.locator('text=Per Day (Today 00:00 – 00:00)')).toBeVisible();
    await expect(page.locator('text=Per Week (Monday – Friday)')).toBeVisible();
    await expect(page.locator('text=Per Week (Saturday – Sunday)')).toBeVisible();
    await expect(page.getByText('This Month (Starting from 1st)', { exact: true })).toBeVisible();

    // Table 2: Previous Period
    await expect(page.locator('text=Previous Period Comparison Matrix')).toBeVisible();
    await expect(page.getByText('Previous Hour', { exact: true })).toBeVisible();
    await expect(page.getByText('Previous Day (Yesterday)', { exact: true })).toBeVisible();
    await expect(page.getByText('Last Week (Full 7-Day Baseline)', { exact: true })).toBeVisible();
    await expect(page.getByText('Last Month (Full 30-Day Cycle)', { exact: true })).toBeVisible();

    // Columns present
    await expect(page.locator('th:has-text("Homepage")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Fixtures")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Standings")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Form Tables")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Teams Profiles")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Match Details")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Other Visited")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Total Views")').first()).toBeVisible();

    // 4. Test Graph of Profile Visits per Team (Week / Month, Sortable)
    await expect(page.locator('text=Team Profile Visits & Squad Inspection Telemetry')).toBeVisible();
    await expect(page.locator('button:has-text("In a Week")')).toBeVisible();
    await expect(page.locator('button:has-text("In a Month")')).toBeVisible();

    // Toggle to Month
    await page.locator('button:has-text("In a Month")').click();

    // Search for a team
    const teamSearchInput = page.locator('input[placeholder="Search team..."]');
    await teamSearchInput.fill('Five Stars');
    await expect(page.locator('text=Five Stars fc').first()).toBeVisible();
  });
});
