import { test, expect } from '@playwright/test';

test.describe('Priority Fixtures Loading & Referee Dashboard Performance', () => {
  const refId = '88b96347-102c-4632-b934-b9ecb6ada202';
  const refEmail = 'referee1@gmail.com';

  const sessionData = {
    access_token: 'fake-token-e2e-referee',
    refresh_token: 'fake-refresh-e2e',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    token_type: 'bearer',
    user: {
      id: refId,
      aud: 'authenticated',
      role: 'authenticated',
      email: refEmail,
      email_confirmed_at: '2026-01-01T00:00:00Z',
      user_metadata: {
        role: 'referee',
        first_name: 'Referee',
        last_name: 'One',
      },
    },
  };

  test('Guest Page: Cold-start priority fixture rendering', async ({ page }) => {
    // Simulate cold start: clear storage and cookies
    await page.context().clearCookies();
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const startTime = Date.now();
    await page.goto('http://localhost:5173/');

    // Priority 1: Matchday fixtures container or fixtures list should be visible immediately
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    const fixtureCard = page.locator('text=Matchday').first();
    await expect(fixtureCard).toBeVisible({ timeout: 5000 });

    const renderTime = Date.now() - startTime;
    console.log(`[Performance Audit] Cold start fixture render completed in: ${renderTime}ms`);

    // Verify root is mounted
    const isAppMounted = await page.evaluate(() => document.getElementById('root') !== null);
    expect(isAppMounted).toBe(true);
  });

  test('Referee Dashboard: Real club data loaded within seconds without placeholder text', async ({ page }) => {
    // Set referee authentication credentials in init script
    await page.addInitScript(({ session, refId, refEmail }) => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('egerscore_auth_token', JSON.stringify(session));
      localStorage.setItem('esn_last_activity_timestamp', String(Date.now()));
      localStorage.setItem('esn_cached_role', 'referee');
      localStorage.setItem('esn_cached_user', JSON.stringify(session.user));
      localStorage.setItem('esn_cached_profile', JSON.stringify({
        id: refId,
        email: refEmail,
        role: 'referee',
        first_name: 'Referee',
        last_name: 'One',
      }));
    }, { session: sessionData, refId, refEmail });

    const startRef = Date.now();
    await page.goto('http://localhost:5173/#/referee');

    // Wait for Referee header and active match queue
    await expect(page.locator('text=REFEREES DASHBOARD').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Active Match Queue').first()).toBeVisible({ timeout: 8000 });

    const refLoadTime = Date.now() - startRef;
    console.log(`[Performance Audit] Referee dashboard real data loaded in: ${refLoadTime}ms`);

    // Verify no generic "Home Team" / "Away Team" placeholder text is present
    const homeTeamPlaceholder = page.locator('text="Home Team"');
    const countHomePlaceholders = await homeTeamPlaceholder.count();
    expect(countHomePlaceholders).toBe(0);

    const awayTeamPlaceholder = page.locator('text="Away Team"');
    const countAwayPlaceholders = await awayTeamPlaceholder.count();
    expect(countAwayPlaceholders).toBe(0);

    // Verify MD 1 or active matchday fixtures are present
    const mdButton = page.locator('button:has-text("MD 1")').first();
    await expect(mdButton).toBeVisible();
  });

  test('Referee Dashboard: Logout occurs exclusively via the explicit Logout button', async ({ page }) => {
    // Set referee authentication credentials in init script
    await page.addInitScript(({ session, refId, refEmail }) => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('egerscore_auth_token', JSON.stringify(session));
      localStorage.setItem('esn_last_activity_timestamp', String(Date.now()));
      localStorage.setItem('esn_cached_role', 'referee');
      localStorage.setItem('esn_cached_user', JSON.stringify(session.user));
      localStorage.setItem('esn_cached_profile', JSON.stringify({
        id: refId,
        email: refEmail,
        role: 'referee',
        first_name: 'Referee',
        last_name: 'One',
      }));
    }, { session: sessionData, refId, refEmail });

    await page.goto('http://localhost:5173/#/referee');

    // Wait for dashboard to load
    await expect(page.locator('text=REFEREES DASHBOARD').first()).toBeVisible({ timeout: 8000 });

    // 1. Clicking on the ESN Referee branding/logo should NOT logout or redirect away
    const brandLogo = page.locator('text=ESN REFEREE').first();
    await brandLogo.click();
    await page.waitForTimeout(500);

    // Should still be on referee dashboard
    expect(page.url()).toContain('referee');
    await expect(page.locator('text=REFEREES DASHBOARD').first()).toBeVisible();

    // 2. Clicking the explicit Logout button should trigger logout and navigate to login
    const logoutBtn = page.locator('button:has-text("Logout")').first();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Wait for URL to transition to login
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('login');
  });

});
